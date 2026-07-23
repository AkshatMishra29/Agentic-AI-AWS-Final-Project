import time
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def skill_matcher_agent(state: AgentState) -> AgentState:
    """
    Agent 4a: Compares bias-stripped resume skills against JD criteria.
    Produces a skill_match_score (0-100) with evidence list.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        resume = state.get("bias_stripped_resume", {})
        jd = state.get("jd_criteria", {})

        resume_skills = resume.get("skills", [])
        must_have = jd.get("must_have_skills", [])
        nice_to_have = jd.get("nice_to_have_skills", [])

        system_prompt = """You are a precise technical skill evaluator. Compare candidate skills to job requirements.
Return ONLY valid JSON:
{
  "score": 0-100,
  "matched_must_have": ["skill1"],
  "matched_nice_to_have": ["skill2"],
  "missing_must_have": ["skill3"],
  "evidence": ["Evidence sentence 1", "Evidence sentence 2"]
}
Scoring: 100% must-have match = 80 base score. Each nice-to-have match adds up to 20 points. Partial/related matches count partially."""

        user_prompt = f"""Candidate Skills: {resume_skills}
Must-Have Requirements: {must_have}
Nice-to-Have Requirements: {nice_to_have}

Also check experience descriptions for implicit skill mentions:
{[exp.get('description', '') for exp in resume.get('experience', [])]}"""

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        result = parse_json_from_llm(response_text)

        score = max(0, min(100, int(result.get("score", 0))))
        evidence = result.get("evidence", [])

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "SkillMatcherAgent",
            "input_summary": f"{len(resume_skills)} candidate skills vs {len(must_have)} must-have, {len(nice_to_have)} nice-to-have",
            "output_summary": f"Score: {score}/100. Matched must-have: {result.get('matched_must_have', [])}",
            "reasoning": f"Missing: {result.get('missing_must_have', [])}",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "skill_match_score": score,
            "skill_match_evidence": evidence,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"SkillMatcherAgent error: {str(e)}")
        return {**state, "skill_match_score": 0, "skill_match_evidence": [], "errors": errors, "audit_entries": audit_entries}
