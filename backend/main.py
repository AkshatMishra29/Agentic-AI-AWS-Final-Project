import os
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status
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
    query = {}
    if current_user["role"] == "candidate":
        query["status"] = "open"
    cursor = db.jobs.find(query).sort("created_at", -1)
    jobs = []
    async for doc in cursor:
        jobs.append(serialize_doc(doc))
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

@app.post("/applications")
async def create_application(app_data: ApplicationCreate, current_user: dict = Depends(require_role(["candidate"]))):
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
    application_doc = {
        "candidate_id": current_user["email"],
        "job_id": app_data.job_id,
        "resume_id": app_data.resume_id,
        "status": "applied",
        "applied_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    result = await db.applications.insert_one(application_doc)
    if "created_by" in job:
        await db.notifications.insert_one({
            "user_id": job["created_by"],
            "message": f"New applicant ({current_user['email']}) for '{job.get('title')}'",
            "type": "new_application",
            "read": False,
            "created_at": datetime.utcnow().isoformat()
        })
    created_app = await db.applications.find_one({"_id": result.inserted_id})
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
async def get_applications_for_job(job_id: str, current_user: dict = Depends(require_role(["hr"]))):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
    cursor = db.applications.find({"job_id": job_id}).sort("applied_at", -1)
    applications = []
    async for doc in cursor:
        app_item = serialize_doc(doc)
        if ObjectId.is_valid(app_item["resume_id"]):
            resume = await db.resumes.find_one({"_id": ObjectId(app_item["resume_id"])})
            if resume:
                app_item["resume"] = serialize_doc(resume)
        # Attach AI screening result if exists
        screening_result = await db.screening_results.find_one({
            "job_id": job_id,
            "resume_id": app_item["resume_id"]
        })
        if screening_result:
            app_item["screening"] = serialize_doc(screening_result)
        applications.append(app_item)
    return applications


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