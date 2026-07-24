import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from bson import ObjectId
from database import db
from auth import require_role, get_current_user
from agents.pipeline import screening_pipeline

router = APIRouter(prefix="/screening", tags=["AI Screening"])


def serialize_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


async def run_pipeline_task(screening_result_id: str, initial_state: dict):
    """Background task: run the LangGraph pipeline and update MongoDB."""
    print(f"[Screening] Starting pipeline for result_id={screening_result_id}")
    try:
        await db.screening_results.update_one(
            {"_id": ObjectId(screening_result_id)},
            {"$set": {"status": "running", "updated_at": datetime.utcnow().isoformat()}}
        )
        # LangGraph invoke runs sync — run safely in thread pool without loop conflict
        import concurrent.futures
        def _invoke_graph():
            return screening_pipeline.invoke(initial_state)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            loop = asyncio.get_running_loop()
            final_state = await loop.run_in_executor(pool, _invoke_graph)
        errors = final_state.get("errors", [])
        score = final_state.get("overall_score", 0)
        if errors:
            print(f"[Screening] Pipeline finished with {len(errors)} error(s): {errors}")
        else:
            print(f"[Screening] Pipeline complete. result_id={screening_result_id}, score={score}")
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[Screening] Pipeline CRASHED: {e}\n{tb}")
        await db.screening_results.update_one(
            {"_id": ObjectId(screening_result_id)},
            {"$set": {"status": "failed", "errors": [str(e)], "updated_at": datetime.utcnow().isoformat()}}
        )


@router.post("/run")
async def trigger_screening(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["hr"]))
):
    """
    HR triggers AI screening for a specific application (job_id + resume_id).
    Runs async — returns immediately with screening_result_id for polling.
    """
    job_id = payload.get("job_id")
    resume_id = payload.get("resume_id")
    candidate_id = payload.get("candidate_id")

    if not job_id or not resume_id or not candidate_id:
        raise HTTPException(status_code=400, detail="job_id, resume_id, and candidate_id are required")

    if not ObjectId.is_valid(job_id) or not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid job_id or resume_id format")

    # Fetch job
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch resume
    resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Check if already screened (allow retry if failed)
    existing = await db.screening_results.find_one({
        "job_id": job_id,
        "resume_id": resume_id,
        "status": {"$in": ["pending", "running", "completed"]}
    })
    if existing:
        # Delete old record so clean new run can happen
        await db.screening_results.delete_one({"_id": existing["_id"]})

    # Create pending screening_result
    now = datetime.utcnow().isoformat()
    screening_doc = {
        "job_id": job_id,
        "resume_id": resume_id,
        "candidate_id": candidate_id,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.screening_results.insert_one(screening_doc)
    screening_result_id = str(result.inserted_id)

    # Build initial state for LangGraph
    initial_state = {
        "job_id": job_id,
        "resume_id": resume_id,
        "candidate_id": candidate_id,
        "screening_result_id": screening_result_id,
        "job_title": job.get("title", ""),
        "job_description": job.get("description", ""),
        "job_must_have_skills": job.get("must_have_skills", []),
        "job_nice_to_have_skills": job.get("nice_to_have_skills", []),
        "job_experience_required": job.get("experience_required", ""),
        "job_education": job.get("education", ""),
        "s3_key": resume.get("s3_key", ""),
        "s3_url": resume.get("file_url", ""),
        "audit_entries": [],
        "errors": [],
    }

    # Run pipeline in background
    background_tasks.add_task(run_pipeline_task, screening_result_id, initial_state)

    return {
        "message": "AI screening pipeline started",
        "screening_result_id": screening_result_id,
        "status": "pending"
    }


@router.post("/run-all/{job_id}")
async def run_all_screening(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["hr"]))
):
    """
    Bulk trigger AI screening for all applicants of a job who haven't completed screening.
    """
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cursor = db.applications.find({"job_id": job_id})
    applications = await cursor.to_list(1000)

    triggered_count = 0
    now = datetime.utcnow().isoformat()

    for app_item in applications:
        resume_id = app_item.get("resume_id")
        candidate_id = app_item.get("candidate_id")

        if not resume_id or not ObjectId.is_valid(resume_id):
            continue

        existing = await db.screening_results.find_one({
            "job_id": job_id,
            "resume_id": resume_id,
            "status": "completed"
        })
        if existing:
            continue

        resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
        if not resume:
            continue

        # Clean old incomplete result
        await db.screening_results.delete_many({
            "job_id": job_id,
            "resume_id": resume_id
        })

        screening_doc = {
            "job_id": job_id,
            "resume_id": resume_id,
            "candidate_id": candidate_id,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
        result = await db.screening_results.insert_one(screening_doc)
        screening_result_id = str(result.inserted_id)

        initial_state = {
            "job_id": job_id,
            "resume_id": resume_id,
            "candidate_id": candidate_id,
            "screening_result_id": screening_result_id,
            "job_title": job.get("title", ""),
            "job_description": job.get("description", ""),
            "job_must_have_skills": job.get("must_have_skills", []),
            "job_nice_to_have_skills": job.get("nice_to_have_skills", []),
            "job_experience_required": job.get("experience_required", ""),
            "job_education": job.get("education", ""),
            "s3_key": resume.get("s3_key", ""),
            "s3_url": resume.get("file_url", ""),
            "audit_entries": [],
            "errors": [],
        }

        background_tasks.add_task(run_pipeline_task, screening_result_id, initial_state)
        triggered_count += 1

    return {
        "message": f"Triggered AI screening for {triggered_count} applicant(s)",
        "triggered_count": triggered_count,
        "total_applicants": len(applications)
    }


@router.get("/results/{job_id}")
async def get_screening_results_for_job(
    job_id: str,
    current_user: dict = Depends(require_role(["hr"]))
):
    """Get all completed AI screening results for a specific job, ranked by overall_score."""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    cursor = db.screening_results.find({"job_id": job_id}).sort("overall_score", -1)
    results = []
    async for doc in cursor:
        results.append(serialize_doc(doc))
    return results


@router.get("/result/{result_id}")
async def get_screening_result_detail(
    result_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get full detail of a single screening result including evidence."""
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result_id format")

    doc = await db.screening_results.find_one({"_id": ObjectId(result_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Screening result not found")
    return serialize_doc(doc)


@router.get("/audit/{result_id}")
async def get_audit_logs(
    result_id: str,
    current_user: dict = Depends(require_role(["hr"]))
):
    """Get full agent audit trail for a screening run."""
    cursor = db.audit_logs.find({"screening_result_id": result_id}).sort("timestamp", 1)
    logs = []
    async for doc in cursor:
        logs.append(serialize_doc(doc))
    return logs


@router.get("/parsed-resume/{resume_id}")
async def get_parsed_resume(
    resume_id: str,
    current_user: dict = Depends(require_role(["hr"]))
):
    """Get Textract-parsed resume data for a candidate."""
    doc = await db.parsed_resumes.find_one({"resume_id": resume_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Parsed resume not found. Run screening first.")
    return serialize_doc(doc)
