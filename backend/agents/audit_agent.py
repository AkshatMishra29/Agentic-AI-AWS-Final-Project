import time
import asyncio
from datetime import datetime
from agents.state import AgentState


def _run_async(coro):
    """Run a coroutine from a sync context safely."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside run_in_executor — create new loop
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


async def _persist_to_mongo(screening_result_id: str, job_id: str, resume_id: str,
                             audit_entries: list, update_payload: dict, parsed_resume_doc: dict):
    """All MongoDB writes in one async function."""
    from database import db
    from bson import ObjectId

    for entry in audit_entries:
        entry["screening_result_id"] = screening_result_id
        entry["job_id"] = job_id
        entry["resume_id"] = resume_id
        await db.audit_logs.insert_one(entry)

    if ObjectId.is_valid(screening_result_id):
        await db.screening_results.update_one(
            {"_id": ObjectId(screening_result_id)},
            {"$set": update_payload}
        )

    await db.parsed_resumes.update_one(
        {"resume_id": resume_id},
        {"$set": parsed_resume_doc},
        upsert=True,
    )


def audit_agent(state: AgentState) -> AgentState:
    """
    Agent 7 (Final): Persists all accumulated audit_entries to MongoDB audit_logs.
    Updates the screening_result document with final scores and status.
    Must be sync for LangGraph compatibility — uses asyncio.run internally for DB writes.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = list(state.get("audit_entries", []))
    screening_result_id = state.get("screening_result_id", "")
    job_id = state.get("job_id", "")
    resume_id = state.get("resume_id", "")

    try:
        now = datetime.utcnow().isoformat()

        update_payload = {
            "status": "completed",
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

        _run_async(_persist_to_mongo(
            screening_result_id, job_id, resume_id,
            audit_entries, update_payload, parsed_resume_doc
        ))

        duration_ms = int((time.time() - start) * 1000)
        print(f"[AuditAgent] Done in {duration_ms}ms. result_id={screening_result_id}, score={update_payload['overall_score']}")
        return {**state, "errors": errors}

    except Exception as e:
        errors.append(f"AuditAgent error: {str(e)}")
        print(f"[AuditAgent] FAILED: {e}")
        # Try to mark as failed in DB
        try:
            from bson import ObjectId
            async def mark_failed():
                from database import db
                if ObjectId.is_valid(screening_result_id):
                    await db.screening_results.update_one(
                        {"_id": ObjectId(screening_result_id)},
                        {"$set": {"status": "failed", "errors": errors, "updated_at": datetime.utcnow().isoformat()}}
                    )
            _run_async(mark_failed())
        except Exception:
            pass
        return {**state, "errors": errors}
