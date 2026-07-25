from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from bson import ObjectId
from database import db
from auth import require_role, get_current_user
from services.scheduler import generate_meet_link, send_interview_email

router = APIRouter(prefix="/interviews", tags=["Interviews"])

def serialize_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/schedule")
async def schedule_interview(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["hr"]))
):
    """
    HR schedules an interview for a shortlisted application.
    Generates a Google Meet link, saves to MongoDB 'interviews', and sends Gmail notification via background task.
    """
    application_id = payload.get("application_id")
    scheduled_time = payload.get("scheduled_time")

    if not application_id or not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")
    if not scheduled_time:
        raise HTTPException(status_code=400, detail="Scheduled time is required")

    app_doc = await db.applications.find_one({"_id": ObjectId(application_id)})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")

    job_doc = await db.jobs.find_one({"_id": ObjectId(app_doc["job_id"])})
    job_title = job_doc.get("title", "Software Engineer Role") if job_doc else "Software Role"

    candidate_email = app_doc["candidate_id"]
    candidate_user = await db.users.find_one({"email": candidate_email})
    candidate_name = (
        (candidate_user.get("name") if candidate_user else None) or
        (candidate_user.get("full_name") if candidate_user else None) or
        app_doc.get("candidate_name") or
        candidate_email.split("@")[0].replace(".", " ").capitalize()
    )

    # Generate Meet Link & Event Info
    meet_link = generate_meet_link()
    calendar_event_id = f"evt_{ObjectId()}"

    now_iso = datetime.utcnow().isoformat()

    # Remove any existing old interview cards for this candidate & job so only the latest scheduled card is kept
    await db.interviews.delete_many({
        "candidate_id": candidate_email,
        "job_id": app_doc["job_id"]
    })

    interview_doc = {
        "application_id": application_id,
        "candidate_id": candidate_email,
        "candidate_name": candidate_name,
        "job_id": app_doc["job_id"],
        "job_title": job_title,
        "scheduled_time": scheduled_time,
        "meet_link": meet_link,
        "calendar_event_id": calendar_event_id,
        "status": "scheduled",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    res = await db.interviews.insert_one(interview_doc)
    
    # Update application status to shortlisted if not already
    await db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": "shortlisted", "updated_at": now_iso}}
    )

    # Dispatch Email Notification via non-blocking BackgroundTask for zero UI delay
    background_tasks.add_task(send_interview_email, candidate_email, candidate_name, job_title, scheduled_time, meet_link)

    # Insert Candidate Notification
    await db.notifications.insert_one({
        "user_id": candidate_email,
        "message": f"Interview scheduled for '{job_title}' on {scheduled_time}. Meet link: {meet_link}",
        "type": "interview_scheduled",
        "read": False,
        "created_at": now_iso
    })

    created = await db.interviews.find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.get("/candidate/me")
async def get_my_interviews(
    current_user: dict = Depends(require_role(["candidate"]))
):
    """Candidate views all scheduled interviews."""
    cursor = db.interviews.find({"candidate_id": current_user["email"]}).sort("created_at", -1)
    interviews = []
    async for doc in cursor:
        interviews.append(serialize_doc(doc))
    return interviews


@router.get("/hr/all")
async def get_all_hr_interviews(
    current_user: dict = Depends(require_role(["hr"]))
):
    """HR views all scheduled interviews across all job postings."""
    cursor = db.interviews.find().sort("created_at", -1)
    interviews = []
    async for doc in cursor:
        interviews.append(serialize_doc(doc))
    return interviews


@router.get("/job/{job_id}")
async def get_job_interviews(
    job_id: str,
    current_user: dict = Depends(require_role(["hr"]))
):
    """HR views all scheduled interviews for a specific job."""
    cursor = db.interviews.find({"job_id": job_id}).sort("scheduled_time", 1)
    interviews = []
    async for doc in cursor:
        interviews.append(serialize_doc(doc))
    return interviews


@router.patch("/{interview_id}/reschedule")
async def reschedule_interview(
    interview_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """Reschedule an existing interview."""
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID")

    new_time = payload.get("scheduled_time")
    if not new_time:
        raise HTTPException(status_code=400, detail="New scheduled time is required")

    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    now_iso = datetime.utcnow().isoformat()
    await db.interviews.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {"scheduled_time": new_time, "status": "rescheduled", "updated_at": now_iso}}
    )

    # Notify candidate if HR updated
    send_interview_email(
        interview["candidate_id"],
        interview.get("candidate_name", "Candidate"),
        interview.get("job_title", "Position"),
        new_time,
        interview.get("meet_link", "")
    )

    updated = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    return serialize_doc(updated)


@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an interview card (accessible by HR or the candidate)."""
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID")

    res = await db.interviews.delete_one({"_id": ObjectId(interview_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")

    return {"message": "Interview card deleted successfully", "id": interview_id}
