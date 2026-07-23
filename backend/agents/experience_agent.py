import time
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def experience_agent(state: AgentState) -> AgentState:
    """
    Agent 4b: Evaluates if candidate's experience (years, seniority, domain)
    matches the job's required experience level.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        resume = state.get("bias_stripped_resume", {})
        jd = state.get("jd_criteria", {})

        experience_list = resume.get("experience", [])
        experience_required = jd.get("experience_required", state.get("job_experience_required", ""))

        system_prompt = """You are an expert HR experience evaluator. Assess if candidate experience meets job requirements.
Return ONLY valid JSON:
{
  "score": 0-100,
  "total_years_estimated": 3.5,
  "relevant_years": 2.0,
  "seniority_level": "junior|mid|senior|lead",
  "domain_relevance": "high|medium|low",
  "evidence": ["Evidence sentence 1", "Evidence sentence 2"],
  "gaps": ["gap1"]
}
Scoring rubric: Years match=50pts, Seniority match=25pts, Domain relevance=25pts."""

        user_prompt = f"""Job Experience Requirement: {experience_required}

Candidate Experience History:
{experience_list}

Certifications (may indicate seniority): {resume.get('certifications', [])}"""

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        result = parse_json_from_llm(response_text)

        score = max(0, min(100, int(result.get("score", 0))))
        evidence = result.get("evidence", [])

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "ExperienceAgent",
            "input_summary": f"Required: '{experience_required}', Candidate: {len(experience_list)} roles",
            "output_summary": f"Score: {score}/100. Est. {result.get('total_years_estimated', 0)} years total, {result.get('relevant_years', 0)} relevant",
            "reasoning": f"Seniority: {result.get('seniority_level')}, Domain: {result.get('domain_relevance')}",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "experience_match_score": score,
            "experience_evidence": evidence,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"ExperienceAgent error: {str(e)}")
        return {**state, "experience_match_score": 0, "experience_evidence": [], "errors": errors, "audit_entries": audit_entries}
