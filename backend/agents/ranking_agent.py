import time
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def ranking_agent(state: AgentState) -> AgentState:
    """
    Agent 6: Computes final overall_score as weighted average of sub-scores.
    Uses LLM to generate human-readable reasoning, strengths, weaknesses, and missing skills.
    Weights: Skill 45%, Experience 35%, Projects 20%
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        skill_score = state.get("skill_match_score", 0)
        exp_score = state.get("experience_match_score", 0)
        proj_score = state.get("project_relevance_score", 40)

        # Weighted overall score
        overall_score = int(
            skill_score * 0.45 +
            exp_score * 0.35 +
            proj_score * 0.20
        )

        resume = state.get("bias_stripped_resume", {})
        jd = state.get("jd_criteria", {})
        evidence = state.get("evidence_summary", {})

        system_prompt = """You are an expert hiring decision analyst. Based on scoring data, generate a fair candidate evaluation.
Return ONLY valid JSON:
{
  "reasoning": "2-3 sentence summary of candidate fit",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "missing_skills": ["skill1", "skill2"],
  "recommendation": "strong_yes|yes|maybe|no"
}"""

        user_prompt = f"""Overall Score: {overall_score}/100
Skill Match Score: {skill_score}/100 (45% weight)
Experience Score: {exp_score}/100 (35% weight)
Project Score: {proj_score}/100 (20% weight)

Job Requirements:
- Must-have skills: {jd.get('must_have_skills', [])}
- Experience: {jd.get('experience_required', '')}

Candidate Profile (bias-stripped):
- Skills: {resume.get('skills', [])}
- Experience count: {len(resume.get('experience', []))} roles
- Projects: {len(resume.get('projects', []))} projects
- Certifications: {resume.get('certifications', [])}

Evidence:
- Skill evidence: {evidence.get('skill_match', {}).get('evidence', [])}
- Experience evidence: {evidence.get('experience_match', {}).get('evidence', [])}

Generate concise, fair reasoning. List specific missing skills from must-have that candidate lacks."""

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        result = parse_json_from_llm(response_text)

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "RankingAgent",
            "input_summary": f"Scores: skill={skill_score}, exp={exp_score}, proj={proj_score}",
            "output_summary": f"Overall: {overall_score}/100. Recommendation: {result.get('recommendation')}",
            "reasoning": result.get("reasoning", ""),
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "overall_score": overall_score,
            "reasoning": result.get("reasoning", ""),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "missing_skills": result.get("missing_skills", []),
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"RankingAgent error: {str(e)}")
        overall_score = int(
            state.get("skill_match_score", 0) * 0.45 +
            state.get("experience_match_score", 0) * 0.35 +
            state.get("project_relevance_score", 40) * 0.20
        )
        return {
            **state,
            "overall_score": overall_score,
            "reasoning": "Automated scoring only (LLM reasoning unavailable)",
            "strengths": [],
            "weaknesses": [],
            "missing_skills": [],
            "errors": errors,
            "audit_entries": audit_entries,
        }
