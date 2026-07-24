import os
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from database import db
from models import UserCreate, UserLogin, JobCreate, JobUpdate, ApplicationCreate, ApplicationStatusUpdate
from auth import hash_password, verify_password, create_token, get_current_user, require_role
from routers import s3_upload, screening

app = FastAPI(title="HireFlow API - Agentic Recruitment Pipeline", version="3.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Module 3 Routers ---
app.include_router(s3_upload.router)    # /resumes/upload, /resumes/me
app.include_router(screening.router)   # /screening/run, /screening/results/{job_id}, etc.


def serialize_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


@app.get("/")
def root():
    return {"status": "HireFlow backend running", "module": "Module 3 - Agentic AI Screening Pipeline"}


@app.get("/dbtest")
async def dbtest():
    collections = await db.list_collection_names()
    return {"collections": collections}


# --- AUTH ROUTES ---

@app.post("/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()
    await db.users.insert_one(user_dict)
    return {"message": "User registered successfully"}


@app.post("/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.email, "role": db_user["role"]})
    return {"access_token": token, "token_type": "bearer", "role": db_user["role"], "email": db_user["email"]}


# --- JOBS ROUTES ---

@app.post("/jobs")
async def create_job(job: JobCreate, current_user: dict = Depends(require_role(["hr"]))):
    job_dict = job.dict()
    job_dict["status"] = "open"
    job_dict["created_by"] = current_user["email"]
    job_dict["created_at"] = datetime.utcnow().isoformat()
    result = await db.jobs.insert_one(job_dict)
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    return serialize_doc(created_job)


@app.get("/jobs")
async def get_jobs(current_user: dict = Depends(get_current_user)):
    """Fast job listing with single-query aggregation for applicant counts."""
    query = {}
    if current_user["role"] == "candidate":
        query["status"] = "open"

    # 1. Fetch jobs
    cursor = db.jobs.find(query).sort("created_at", -1)
    jobs = []
    job_ids = []
    async for doc in cursor:
        job = serialize_doc(doc)
        job["applicant_count"] = 0
        jobs.append(job)
        job_ids.append(job["id"])

    # 2. Single-pass aggregation for all applicant counts
    if job_ids:
        pipeline = [
            {"$match": {"job_id": {"$in": job_ids}}},
            {"$group": {"_id": "$job_id", "count": {"$sum": 1}}}
        ]
        counts_cursor = db.applications.aggregate(pipeline)
        counts_map = {}
        async for item in counts_cursor:
            counts_map[item["_id"]] = item["count"]

        for job in jobs:
            job["applicant_count"] = counts_map.get(job["id"], 0)

    return jobs


@app.get("/jobs/{job_id}")
async def get_job_by_id(job_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_doc(job)


@app.put("/jobs/{job_id}")
async def update_job(job_id: str, job_data: JobUpdate, current_user: dict = Depends(require_role(["hr"]))):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
    update_fields = {k: v for k, v in job_data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    updated_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    return serialize_doc(updated_job)


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(require_role(["hr"]))):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
    result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}


# --- APPLICATIONS ROUTES ---

@app.post("/jobs/parse-jd")
async def parse_job_description(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["hr"]))
):
    """
    Uploads JD document to S3 (under jds/), extracts text using pdfplumber/python-docx,
    and returns structured auto-fill JSON + S3 key and URL.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    filename = file.filename or "job_description.pdf"
    
    # 1. Upload JD file to S3
    try:
        from services.s3 import upload_file_to_s3, get_presigned_url
        import re
        sanitized_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        user_clean = current_user['email'].replace('@', '_').replace('.', '_')
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        s3_key = f"jds/{user_clean}/{timestamp}_{sanitized_filename}"

        content_type = file.content_type or "application/octet-stream"
        s3_result = upload_file_to_s3(contents, s3_key, content_type)
        presigned_url = get_presigned_url(s3_key)
    except Exception as s3_err:
        print(f"[JD Upload S3 Warning]: {s3_err}")
        s3_key = ""
        presigned_url = ""

    # 2. Extract text and parse with LLM
    try:
        from agents.resume_parser import _extract_text_pure_python
        from services.llm import llm_call, parse_json_from_llm

        raw_text = _extract_text_pure_python(contents, filename)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the JD document.")

        system_prompt = """You are an expert HR assistant. Extract structured job posting details from a Job Description document.
Return ONLY valid JSON with this exact structure:
{
  "title": "Job Title",
  "description": "2-4 sentence job summary",
  "experience_required": "e.g. 3+ years",
  "education": "e.g. Bachelor's in CS",
  "location": "e.g. Remote / City",
  "salary_range": "e.g. 10-15 LPA",
  "must_have_skills": ["Skill1", "Skill2"],
  "nice_to_have_skills": ["Skill3"]
}"""

        user_prompt = f"Extract details from this Job Description:\n\n{raw_text[:5000]}"
        response_text, _, _ = llm_call(system_prompt, user_prompt)
        parsed_jd = parse_json_from_llm(response_text)
        
        parsed_jd["jd_s3_key"] = s3_key
        parsed_jd["jd_s3_url"] = presigned_url
        return parsed_jd
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse JD document: {str(e)}")


@app.post("/applications")
async def create_application(
    app_data: ApplicationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["candidate"]))
):
    if not ObjectId.is_valid(app_data.job_id) or not ObjectId.is_valid(app_data.resume_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID or Resume ID format")

    job = await db.jobs.find_one({"_id": ObjectId(app_data.job_id)})
    if not job or job.get("status") != "open":
        raise HTTPException(status_code=400, detail="Job posting is unavailable or closed")

    existing = await db.applications.find_one({
        "candidate_id": current_user["email"],
        "job_id": app_data.job_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    now_iso = datetime.utcnow().isoformat()
    application_doc = {
        "candidate_id": current_user["email"],
        "job_id": app_data.job_id,
        "resume_id": app_data.resume_id,
        "status": "applied",
        "applied_at": now_iso,
        "updated_at": now_iso,
    }
    result = await db.applications.insert_one(application_doc)

    # Notify HR if job has creator
    if "created_by" in job:
        await db.notifications.insert_one({
            "user_id": job["created_by"],
            "message": f"New applicant ({current_user['email']}) for '{job.get('title')}'",
            "type": "new_application",
            "read": False,
            "created_at": now_iso,
        })

    created_app = await db.applications.find_one({"_id": result.inserted_id})

    # Auto-trigger AI screening pipeline in background (non-blocking)
    try:
        from routers.screening import run_pipeline_task
        resume_doc = await db.resumes.find_one({"_id": ObjectId(app_data.resume_id)})
        if resume_doc:
            scr_result = await db.screening_results.insert_one({
                "job_id": app_data.job_id,
                "resume_id": app_data.resume_id,
                "candidate_id": current_user["email"],
                "status": "pending",
                "created_at": now_iso,
                "updated_at": now_iso,
            })
            initial_state = {
                "job_id": app_data.job_id,
                "resume_id": app_data.resume_id,
                "candidate_id": current_user["email"],
                "screening_result_id": str(scr_result.inserted_id),
                "job_title": job.get("title", ""),
                "job_description": job.get("description", ""),
                "job_must_have_skills": job.get("must_have_skills", []),
                "job_nice_to_have_skills": job.get("nice_to_have_skills", []),
                "job_experience_required": job.get("experience_required", ""),
                "job_education": job.get("education", ""),
                "s3_key": resume_doc.get("s3_key", ""),
                "s3_url": resume_doc.get("file_url", ""),
                "audit_entries": [],
                "errors": [],
            }
            background_tasks.add_task(run_pipeline_task, str(scr_result.inserted_id), initial_state)
            print(f"[AutoScreening] Queued screening for {current_user['email']} on job {app_data.job_id}")
        else:
            print(f"[AutoScreening] Resume not found for id={app_data.resume_id}, skipping pipeline")
    except Exception as e:
        # Never fail the application submission because of screening pipeline issues
        import traceback
        print(f"[AutoScreening] Failed to queue screening (non-fatal): {e}\n{traceback.format_exc()}")

    return serialize_doc(created_app)


@app.get("/applications/me")
async def get_my_applications(current_user: dict = Depends(require_role(["candidate"]))):
    cursor = db.applications.find({"candidate_id": current_user["email"]}).sort("applied_at", -1)
    applications = []
    async for doc in cursor:
        app_item = serialize_doc(doc)
        if ObjectId.is_valid(app_item["job_id"]):
            job = await db.jobs.find_one({"_id": ObjectId(app_item["job_id"])})
            if job:
                app_item["job"] = serialize_doc(job)
        if ObjectId.is_valid(app_item["resume_id"]):
            resume = await db.resumes.find_one({"_id": ObjectId(app_item["resume_id"])})
            if resume:
                app_item["resume"] = serialize_doc(resume)
        applications.append(app_item)
    return applications


@app.get("/applications/job/{job_id}")
async def get_applications_for_job(
    job_id: str,
    stage: Optional[str] = None,
    sort_by: Optional[str] = "applied_at_desc",
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(require_role(["hr"]))
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
    
    query = {"job_id": job_id}
    if stage and stage != "all":
        query["status"] = stage

    cursor = db.applications.find(query)
    
    if sort_by == "applied_at_asc":
        cursor = cursor.sort("applied_at", 1)
    else:
        cursor = cursor.sort("applied_at", -1)

    total_count = await db.applications.count_documents(query)
    
    applications = []
    async for doc in cursor:
        app_item = serialize_doc(doc)
        
        # Look up candidate user profile to get full name
        candidate_user = await db.users.find_one({"email": app_item["candidate_id"]})
        if candidate_user:
            app_item["candidate_name"] = candidate_user.get("full_name") or candidate_user.get("name") or app_item["candidate_id"].split("@")[0].capitalize()
        else:
            app_item["candidate_name"] = app_item["candidate_id"].split("@")[0].capitalize()

        if ObjectId.is_valid(app_item["resume_id"]):
            resume = await db.resumes.find_one({"_id": ObjectId(app_item["resume_id"])})
            if resume:
                app_item["resume"] = serialize_doc(resume)

        # Attach latest completed or active AI screening result
        screening_result = await db.screening_results.find_one(
            {"job_id": job_id, "resume_id": app_item["resume_id"]},
            sort=[("updated_at", -1)]
        )
        if screening_result:
            app_item["screening"] = serialize_doc(screening_result)
        
        applications.append(app_item)

    # In-memory sort by overall_score if requested
    if sort_by == "score_desc":
        applications.sort(key=lambda x: (x.get("screening", {}) or {}).get("overall_score", -1), reverse=True)
    elif sort_by == "score_asc":
        applications.sort(key=lambda x: (x.get("screening", {}) or {}).get("overall_score", 999))

    # Apply pagination skip/limit
    paginated_apps = applications[skip: skip + limit]

    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "items": paginated_apps
    }


@app.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_data: ApplicationStatusUpdate,
    current_user: dict = Depends(require_role(["hr"]))
):
    if not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="Invalid Application ID format")
    app_doc = await db.applications.find_one({"_id": ObjectId(application_id)})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    now_iso = datetime.utcnow().isoformat()
    await db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": status_data.status, "updated_at": now_iso}}
    )
    job_title = "a job opening"
    if ObjectId.is_valid(app_doc["job_id"]):
        job = await db.jobs.find_one({"_id": ObjectId(app_doc["job_id"])})
        if job:
            job_title = job.get("title", job_title)
    await db.notifications.insert_one({
        "user_id": app_doc["candidate_id"],
        "message": f"Your application status for '{job_title}' was updated to '{status_data.status.replace('_', ' ').title()}'",
        "type": "status_update",
        "read": False,
        "created_at": now_iso
    })
    updated_app = await db.applications.find_one({"_id": ObjectId(application_id)})
    return serialize_doc(updated_app)


# --- NOTIFICATIONS ROUTES ---

@app.get("/notifications/me")
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    cursor = db.notifications.find({"user_id": current_user["email"]}).sort("created_at", -1)
    notifications = []
    unread_count = 0
    async for doc in cursor:
        item = serialize_doc(doc)
        if not item.get("read"):
            unread_count += 1
        notifications.append(item)
    return {"unread_count": unread_count, "notifications": notifications}


@app.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid Notification ID format")
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user["email"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}