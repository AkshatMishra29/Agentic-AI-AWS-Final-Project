import time
from datetime import datetime
from services.llm import llm_call, parse_json_from_llm
from agents.state import AgentState


def project_evaluator_agent(state: AgentState) -> AgentState:
    """
    Agent 4c: Evaluates candidate projects for relevance, complexity, 
    and alignment with the target role's domain and tech stack.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    try:
        resume = state.get("bias_stripped_resume", {})
        jd = state.get("jd_criteria", {})

        projects = resume.get("projects", [])
        achievements = resume.get("achievements", [])
        must_have = jd.get("must_have_skills", [])
        domain_keywords = jd.get("domain_keywords", [])

        if not projects:
            # No projects — neutral score
            audit_entries.append({
                "agent_name": "ProjectEvaluatorAgent",
                "input_summary": "No projects found in resume",
                "output_summary": "Score: 40/100 (no projects — neutral penalty)",
                "reasoning": "Candidate has no listed projects",
                "timestamp": datetime.utcnow().isoformat(),
                "duration_ms": 0,
                "llm_model": "rule-based",
                "tokens_used": 0,
            })
            return {**state, "project_relevance_score": 40, "project_evidence": ["No projects listed in resume"], "audit_entries": audit_entries}

        system_prompt = """You are a senior technical recruiter evaluating candidate projects.
Assess project relevance, complexity, and tech alignment with the role.
Return ONLY valid JSON:
{
  "score": 0-100,
  "most_relevant_project": "project name",
  "tech_overlap": ["tech1", "tech2"],
  "complexity_assessment": "low|medium|high",
  "evidence": ["Evidence sentence 1", "Evidence sentence 2"]
}
Scoring: Tech overlap with job requirements=50pts, Project complexity=30pts, Domain alignment=20pts."""

        user_prompt = f"""Job Requires (must-have skills): {must_have}
Job Domain Keywords: {domain_keywords}

Candidate Projects:
{projects}

Candidate Achievements:
{achievements}"""

        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        result = parse_json_from_llm(response_text)

        score = max(0, min(100, int(result.get("score", 40))))
        evidence = result.get("evidence", [])

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "ProjectEvaluatorAgent",
            "input_summary": f"{len(projects)} projects, {len(achievements)} achievements evaluated",
            "output_summary": f"Score: {score}/100. Top project: {result.get('most_relevant_project', 'N/A')}, complexity: {result.get('complexity_assessment')}",
            "reasoning": f"Tech overlap: {result.get('tech_overlap', [])}",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "project_relevance_score": score,
            "project_evidence": evidence,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"ProjectEvaluatorAgent error: {str(e)}")
        return {**state, "project_relevance_score": 40, "project_evidence": [], "errors": errors, "audit_entries": audit_entries}
