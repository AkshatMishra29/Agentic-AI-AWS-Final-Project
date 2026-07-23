import time
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def criteria_extractor_agent(state: AgentState) -> AgentState:
    """
    Agent 2: Uses LLM (Groq primary / Bedrock fallback) to parse the job description
    into structured criteria: must_have_skills, nice_to_have_skills, experience, education.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        job_title = state.get("job_title", "")
        job_description = state.get("job_description", "")
        must_have = state.get("job_must_have_skills", [])
        nice_to_have = state.get("job_nice_to_have_skills", [])
        experience_req = state.get("job_experience_required", "")
        education_req = state.get("job_education", "")

        system_prompt = """You are an expert HR analyst. Extract precise screening criteria from a job description.
Return ONLY valid JSON with this exact structure:
{
  "must_have_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill3"],
  "experience_required": "3+ years in...",
  "education_required": "Bachelor's degree in...",
  "key_responsibilities": ["responsibility1"],
  "domain_keywords": ["keyword1"]
}"""

        user_prompt = f"""Job Title: {job_title}
Job Description: {job_description}

Already tagged Must-Have Skills: {must_have}
Already tagged Nice-to-Have Skills: {nice_to_have}
Experience Required (from form): {experience_req}
Education Required (from form): {education_req}

Extract complete structured criteria. Supplement the tagged skills with any additional ones found in the description."""

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        jd_criteria = parse_json_from_llm(response_text)

        # Merge form-filled skills with LLM-extracted ones (deduplicated)
        all_must = list(set(must_have + jd_criteria.get("must_have_skills", [])))
        all_nice = list(set(nice_to_have + jd_criteria.get("nice_to_have_skills", [])))
        jd_criteria["must_have_skills"] = all_must
        jd_criteria["nice_to_have_skills"] = all_nice

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "CriteriaExtractorAgent",
            "input_summary": f"Job: {job_title}, description length: {len(job_description)} chars",
            "output_summary": f"Extracted {len(all_must)} must-have, {len(all_nice)} nice-to-have skills",
            "reasoning": "LLM JD parsing with form-data merging",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {**state, "jd_criteria": jd_criteria, "audit_entries": audit_entries}

    except Exception as e:
        errors.append(f"CriteriaExtractorAgent error: {str(e)}")
        return {**state, "jd_criteria": {}, "errors": errors, "audit_entries": audit_entries}
