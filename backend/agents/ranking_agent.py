import time
import json
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def _safe_parse_ranking(response_text: str) -> dict:
    """Parse LLM JSON with fallback repair for common issues."""
    try:
        return parse_json_from_llm(response_text)
    except Exception:
        pass

    # Repair attempt: truncate at last valid closing brace
    try:
        text = response_text.strip()
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        # Find last complete JSON object
        depth, last_close = 0, -1
        for i, ch in enumerate(text):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    last_close = i
                    break
        if last_close > 0:
            return json.loads(text[:last_close + 1])
    except Exception:
        pass

    # Final fallback: extract fields with regex
    import re
    result = {}
    reasoning_m = re.search(r'"reasoning"\s*:\s*"([^"]*)"', response_text)
    if reasoning_m:
        result['reasoning'] = reasoning_m.group(1)
    return result


def ranking_agent(state: AgentState) -> AgentState:
    """
    Agent 6: Computes final overall_score as weighted average of sub-scores.
    Uses LLM to generate human-readable reasoning, strengths, weaknesses, missing skills.
    Weights: Skill 45%, Experience 35%, Projects 20%
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    skill_score = state.get("skill_match_score", 0)
    exp_score = state.get("experience_match_score", 0)
    proj_score = state.get("project_relevance_score", 40)

    # Calculate weighted overall score first (never fails)
    overall_score = int(
        skill_score * 0.45 +
        exp_score * 0.35 +
        proj_score * 0.20
    )

    try:
        resume = state.get("bias_stripped_resume", {})
        jd = state.get("jd_criteria", {})

        # Tight, simple prompt to avoid JSON parsing issues
        system_prompt = """You are a hiring analyst. Return a JSON object only. No markdown, no extra text.
Use simple ASCII characters only in string values (no special quotes or dashes).
Required format:
{"reasoning":"2 sentence summary","strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"missing_skills":["m1","m2"],"recommendation":"yes"}"""

        user_prompt = (
            f"Overall score: {overall_score}/100 "
            f"(Skills: {skill_score}/100, Experience: {exp_score}/100, Projects: {proj_score}/100). "
            f"Job needs: {jd.get('must_have_skills', [])}. "
            f"Candidate has: {resume.get('skills', [])}. "
            f"Candidate experience: {len(resume.get('experience', []))} roles. "
            f"Missing from must-have: {[s for s in jd.get('must_have_skills', []) if s not in resume.get('skills', [])]}. "
            "Return JSON evaluation."
        )

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        result = _safe_parse_ranking(response_text)

        reasoning = result.get("reasoning", f"Candidate scored {overall_score}/100 overall based on skill, experience, and project evaluation.")
        strengths = result.get("strengths", [])
        weaknesses = result.get("weaknesses", [])
        missing_skills = result.get("missing_skills", [])

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "RankingAgent",
            "input_summary": f"Scores: skill={skill_score}, exp={exp_score}, proj={proj_score}",
            "output_summary": f"Overall: {overall_score}/100. Recommendation: {result.get('recommendation', 'scored')}",
            "reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "overall_score": overall_score,
            "reasoning": reasoning,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "missing_skills": missing_skills,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"RankingAgent error: {str(e)}")
        # Return numeric score even if LLM reasoning failed
        return {
            **state,
            "overall_score": overall_score,
            "reasoning": f"Candidate scored {overall_score}/100 (Skills: {skill_score}, Experience: {exp_score}, Projects: {proj_score}).",
            "strengths": [],
            "weaknesses": [],
            "missing_skills": [],
            "errors": errors,
            "audit_entries": audit_entries,
        }
