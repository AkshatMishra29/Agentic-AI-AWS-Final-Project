import re
import time
import copy
from datetime import datetime
from agents.state import AgentState

# Fields to strip to prevent bias in scoring
BIAS_FIELDS = ["name", "full_name", "first_name", "last_name", "gender", "photo", "address", "phone"]
BIAS_PATTERNS = [
    r"\b[A-Z][a-z]+ [A-Z][a-z]+\b",        # Full names
    r"\b\d{10}\b",                           # Phone numbers
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",  # Emails
    r"\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+\w+\b",    # Titles + names
    r"\b(Male|Female|He|She|His|Her)\b",    # Gender pronouns/terms
]
# College names are intentionally NOT stripped here — experience is what matters
# We remove explicit personal identity fields only


def strip_bias_from_text(text: str) -> tuple[str, list]:
    """Remove PII patterns from raw text. Returns (cleaned_text, stripped_types)."""
    stripped = []
    for pattern in BIAS_PATTERNS:
        if re.search(pattern, text):
            text = re.sub(pattern, "[REDACTED]", text)
            stripped.append(pattern)
    return text, stripped


def bias_guardrail_agent(state: AgentState) -> AgentState:
    """
    Agent 3: Strips personal identity information (name, gender, phone, email)
    from the parsed resume before it reaches scoring agents.
    Preserves skills, experience content, education degree (not institution name),
    projects, certifications, and achievements.
    """
    start = time.time()
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])
    parsed_resume = state.get("parsed_resume", {})

    try:
        stripped_fields = []
        bias_stripped = copy.deepcopy(parsed_resume)

        # Strip top-level identity fields
        for field in BIAS_FIELDS:
            if field in bias_stripped:
                del bias_stripped[field]
                stripped_fields.append(field)

        # Clean experience descriptions (remove names/pronouns in text)
        for exp in bias_stripped.get("experience", []):
            if "description" in exp:
                exp["description"], found = strip_bias_from_text(exp["description"])
                if found:
                    stripped_fields.append("experience.description PII")

        # Strip institution names from education (degree + year kept)
        for edu in bias_stripped.get("education", []):
            if "institution" in edu:
                edu["institution"] = "[INSTITUTION REDACTED]"
                stripped_fields.append("education.institution")

        # Clean achievements
        clean_achievements = []
        for ach in bias_stripped.get("achievements", []):
            cleaned, found = strip_bias_from_text(ach)
            clean_achievements.append(cleaned)
        bias_stripped["achievements"] = clean_achievements

        stripped_fields = list(set(stripped_fields))

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "BiasGuardrailAgent",
            "input_summary": f"Resume fields: {list(parsed_resume.keys())}",
            "output_summary": f"Stripped {len(stripped_fields)} bias/PII fields: {stripped_fields}",
            "reasoning": "PII patterns + identity field removal for fair scoring",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": "rule-based",
            "tokens_used": 0,
        })

        return {
            **state,
            "bias_stripped_resume": bias_stripped,
            "bias_stripped_fields": stripped_fields,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"BiasGuardrailAgent error: {str(e)}")
        return {**state, "bias_stripped_resume": parsed_resume, "bias_stripped_fields": [], "errors": errors, "audit_entries": audit_entries}
