import time
from datetime import datetime
from agents.state import AgentState


def evidence_agent(state: AgentState) -> AgentState:
    """
    Agent 5: Collects all sub-scores and evidence from scoring agents.
    Computes weighted confidence per dimension and assembles evidence_summary.
    Weights: Skill 45%, Experience 35%, Projects 20%
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        skill_score = state.get("skill_match_score", 0)
        exp_score = state.get("experience_match_score", 0)
        proj_score = state.get("project_relevance_score", 40)

        skill_evidence = state.get("skill_match_evidence", [])
        exp_evidence = state.get("experience_evidence", [])
        proj_evidence = state.get("project_evidence", [])

        # Confidence: how many evidence items we have per dimension (max 5)
        skill_confidence = min(100, len(skill_evidence) * 20)
        exp_confidence = min(100, len(exp_evidence) * 20)
        proj_confidence = min(100, len(proj_evidence) * 20)

        evidence_summary = {
            "skill_match": {
                "score": skill_score,
                "confidence": skill_confidence,
                "evidence": skill_evidence,
            },
            "experience_match": {
                "score": exp_score,
                "confidence": exp_confidence,
                "evidence": exp_evidence,
            },
            "project_relevance": {
                "score": proj_score,
                "confidence": proj_confidence,
                "evidence": proj_evidence,
            },
            "weights": {
                "skill": 0.45,
                "experience": 0.35,
                "project": 0.20,
            }
        }

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "EvidenceAgent",
            "input_summary": f"Scores: skill={skill_score}, exp={exp_score}, proj={proj_score}",
            "output_summary": f"Confidence: skill={skill_confidence}%, exp={exp_confidence}%, proj={proj_confidence}%",
            "reasoning": "Evidence aggregation with confidence scoring (20% per evidence item, max 100%)",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": "rule-based",
            "tokens_used": 0,
        })

        return {
            **state,
            "evidence_summary": evidence_summary,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"EvidenceAgent error: {str(e)}")
        return {**state, "evidence_summary": {}, "errors": errors, "audit_entries": audit_entries}
