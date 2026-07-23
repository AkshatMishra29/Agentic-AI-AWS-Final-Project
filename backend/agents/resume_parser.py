import os
import io
import time
from datetime import datetime
from services.s3 import download_file_from_s3
from agents.state import AgentState


def _extract_text_from_file(file_bytes: bytes, filename: str, s3_key: str, aws_key: str, aws_secret: str, aws_region: str, s3_bucket: str) -> str:
    """
    Extract raw text from a resume file.
    - PDF: Use Amazon Textract (S3-based, no 5MB byte limit)
    - DOCX: Use python-docx
    - TXT: Decode directly
    """
    ext = os.path.splitext(filename)[1].lower() if filename else ".pdf"

    if ext == ".txt":
        return file_bytes.decode("utf-8", errors="ignore")

    elif ext in (".docx", ".doc"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        except ImportError:
            # python-docx not installed — fall through to Textract
            pass
        except Exception:
            pass

    # PDF (or DOCX fallback) — Use Textract via S3 reference (no 5MB limit)
    import boto3
    textract = boto3.client(
        "textract",
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret,
        region_name=aws_region,
    )
    response = textract.detect_document_text(
        Document={
            "S3Object": {
                "Bucket": s3_bucket,
                "Name": s3_key,
            }
        }
    )
    blocks = response.get("Blocks", [])
    return " ".join(b["Text"] for b in blocks if b["BlockType"] == "LINE")


def resume_parser_agent(state: AgentState) -> AgentState:
    """
    Agent 1: Downloads resume from S3, runs Amazon Textract (S3-based, no 5MB limit),
    then uses LLM to structure the raw text into a clean JSON.
    Supports PDF (Textract), DOCX (python-docx), TXT (direct decode).
    """
    from services.llm import llm_call, parse_json_from_llm

    start = time.time()
    s3_key = state.get("s3_key", "")
    filename = s3_key.split("/")[-1] if s3_key else ""
    errors = state.get("errors", [])
    audit_entries = state.get("audit_entries", [])

    aws_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region = os.getenv("AWS_REGION", "ap-south-1")
    s3_bucket = os.getenv("S3_BUCKET_NAME", "")

    if not s3_key:
        errors.append("ResumeParserAgent: s3_key is empty — cannot process resume")
        return {**state, "parsed_resume": {}, "raw_text": "", "errors": errors, "audit_entries": audit_entries}

    try:
        # For DOCX/TXT we need the raw bytes; for PDF Textract reads from S3 directly
        ext = os.path.splitext(filename)[1].lower()
        file_bytes = b""
        if ext in (".txt", ".docx", ".doc"):
            file_bytes = download_file_from_s3(s3_key)

        raw_text = _extract_text_from_file(file_bytes, filename, s3_key, aws_key, aws_secret, aws_region, s3_bucket)

        if not raw_text.strip():
            raise ValueError("Textract returned empty text — resume may be image-only or corrupted")

        # Use LLM to parse raw text into structured JSON
        system_prompt = """You are an expert resume parser. Extract structured information from resume text.
Return ONLY valid JSON with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "Job Title", "company": "Company", "duration": "X years", "description": "responsibilities"}],
  "education": [{"degree": "Degree Name", "institution": "University", "year": "YYYY"}],
  "certifications": ["cert1"],
  "projects": [{"name": "Project", "description": "what it does", "tech_stack": ["tech1"]}],
  "achievements": ["achievement1"]
}
Be thorough. If a field has no data, return an empty array."""

        user_prompt = f"Parse this resume text:\n\n{raw_text[:6000]}"
        response_text, model_used, tokens = llm_call(system_prompt, user_prompt)
        parsed_resume = parse_json_from_llm(response_text)

        duration_ms = int((time.time() - start) * 1000)
        audit_entries.append({
            "agent_name": "ResumeParserAgent",
            "input_summary": f"S3 key: {s3_key}, format: {ext}, text length: {len(raw_text)} chars",
            "output_summary": f"Parsed {len(parsed_resume.get('skills', []))} skills, {len(parsed_resume.get('experience', []))} jobs, {len(parsed_resume.get('projects', []))} projects",
            "reasoning": f"Extraction method: {'Textract S3' if ext == '.pdf' else ext[1:].upper() + ' reader'} + LLM structuring",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "llm_model": model_used,
            "tokens_used": tokens,
        })

        return {
            **state,
            "raw_text": raw_text,
            "parsed_resume": parsed_resume,
            "audit_entries": audit_entries,
        }

    except Exception as e:
        errors.append(f"ResumeParserAgent error: {str(e)}")
        audit_entries.append({
            "agent_name": "ResumeParserAgent",
            "input_summary": f"S3 key: {s3_key}",
            "output_summary": "FAILED",
            "reasoning": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": int((time.time() - start) * 1000),
            "llm_model": "N/A",
            "tokens_used": 0,
        })
        return {**state, "parsed_resume": {}, "raw_text": "", "errors": errors, "audit_entries": audit_entries}
