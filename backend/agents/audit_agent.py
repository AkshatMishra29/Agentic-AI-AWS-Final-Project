import time
import os
import certifi
from datetime import datetime
from database import db
from bson import ObjectId
from agents.state import AgentState


def audit_agent(state: AgentState) -> AgentState:
    """
    Agent 7 (Final): Persists all accumulated audit_entries to MongoDB audit_logs.
    Updates the screening_result document with final scores and status.
    Uses PyMongo sync client with exact MONGO_URI, DB_NAME, and certifi settings.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = list(state.get("audit_entries", []))
    screening_result_id = state.get("screening_result_id", "")
    job_id = state.get("job_id", "")
    resume_id = state.get("resume_id", "")

    now = datetime.utcnow().isoformat()

    update_payload = {
        "status": "completed" if not errors else "failed",
        "jd_criteria": state.get("jd_criteria", {}),
        "scores": {
            "skill_match": state.get("skill_match_score", 0),
            "experience_match": state.get("experience_match_score", 0),
            "project_relevance": state.get("project_relevance_score", 0),
        },
        "evidence": {
            "skill_match_evidence": state.get("skill_match_evidence", []),
            "experience_evidence": state.get("experience_evidence", []),
            "project_evidence": state.get("project_evidence", []),
        },
        "evidence_summary": state.get("evidence_summary", {}),
        "overall_score": state.get("overall_score", 0),
        "reasoning": state.get("reasoning", ""),
        "strengths": state.get("strengths", []),
        "weaknesses": state.get("weaknesses", []),
        "missing_skills": state.get("missing_skills", []),
        "bias_stripped_fields": state.get("bias_stripped_fields", []),
        "errors": errors,
        "updated_at": now,
    }

    parsed_resume_doc = {
        "resume_id": resume_id,
        "candidate_id": state.get("candidate_id", ""),
        "s3_key": state.get("s3_key", ""),
        "s3_url": state.get("s3_url", ""),
        "raw_text": state.get("raw_text", ""),
        "parsed": state.get("parsed_resume", {}),
        "parsed_at": now,
    }

    try:
        from pymongo import MongoClient
        mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
        db_name = os.getenv("DB_NAME") or os.getenv("MONGODB_DB_NAME", "hireflow")

        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        sync_db = client[db_name]

        # Insert audit entries
        if audit_entries:
            for entry in audit_entries:
                entry["screening_result_id"] = screening_result_id
                entry["job_id"] = job_id
                entry["resume_id"] = resume_id
            sync_db.audit_logs.insert_many(audit_entries)

        # Update screening result
        if ObjectId.is_valid(screening_result_id):
            sync_db.screening_results.update_one(
                {"_id": ObjectId(screening_result_id)},
                {"$set": update_payload}
            )

        # Upsert parsed resume
        sync_db.parsed_resumes.update_one(
            {"resume_id": resume_id},
            {"$set": parsed_resume_doc},
            upsert=True
        )

        client.close()
        duration_ms = int((time.time() - start) * 1000)
        print(f"[AuditAgent] Persisted screening result to Cloud MongoDB Atlas. result_id={screening_result_id}, score={update_payload['overall_score']}, duration={duration_ms}ms")
        return {**state, "errors": errors}

    except Exception as e:
        err_str = f"AuditAgent error: {str(e)}"
        errors.append(err_str)
        print(f"[AuditAgent] FAILED: {err_str}")
        return {**state, "errors": errors}
