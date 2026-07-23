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
    try:
        await db.screening_results.update_one(
            {"_id": ObjectId(screening_result_id)},
            {"$set": {"status": "running", "updated_at": datetime.utcnow().isoformat()}}
        )
        # LangGraph invoke (sync agents wrapped in thread for async compat)
        loop = asyncio.get_event_loop()
        final_state = await loop.run_in_executor(
            None,
            lambda: screening_pipeline.invoke(initial_state)
        )
        print(f"[Screening] Pipeline complete for result_id={screening_result_id}, score={final_state.get('overall_score')}")
    except Exception as e:
        print(f"[Screening] Pipeline FAILED: {e}")
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

    # Check if already screened (avoid duplicates)
    existing = await db.screening_results.find_one({
        "job_id": job_id,
        "resume_id": resume_id,
        "status": {"$in": ["pending", "running", "completed"]}
    })
    if existing:
        return {"message": "Screening already exists", "screening_result_id": str(existing["_id"]), "status": existing["status"]}

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
