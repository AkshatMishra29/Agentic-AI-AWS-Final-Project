from typing import TypedDict, Optional, List, Dict, Any


class AgentState(TypedDict, total=False):
    # ---- Input Context ----
    job_id: str
    resume_id: str
    candidate_id: str
    screening_result_id: str

    # ---- Job Description ----
    job_title: str
    job_description: str
    job_must_have_skills: List[str]
    job_nice_to_have_skills: List[str]
    job_experience_required: str
    job_education: str

    # ---- S3 / Resume ----
    s3_key: str
    s3_url: str

    # ---- Parsed Resume (Textract output) ----
    raw_text: str
    parsed_resume: Dict[str, Any]       # skills, experience, education, projects, certs, achievements

    # ---- Bias-stripped Resume ----
    bias_stripped_resume: Dict[str, Any]
    bias_stripped_fields: List[str]     # list of fields that were removed

    # ---- JD Criteria (LLM-extracted) ----
    jd_criteria: Dict[str, Any]         # {must_have, nice_to_have, experience, education}

    # ---- Sub-scores from scoring agents ----
    skill_match_score: int
    skill_match_evidence: List[str]
    experience_match_score: int
    experience_evidence: List[str]
    project_relevance_score: int
    project_evidence: List[str]

    # ---- Evidence Agent ----
    evidence_summary: Dict[str, Any]    # confidence + evidence per dimension

    # ---- Ranking Agent ----
    overall_score: int
    reasoning: str
    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]

    # ---- Audit tracking ----
    audit_entries: List[Dict[str, Any]]  # accumulated per-agent audit logs

    # ---- Error Handling ----
    errors: List[str]
