# Module 3 Guide — Agentic AI Screening Pipeline
### HireFlow – Agentic AI Recruitment Pipeline

This file explains what Module 3 is, what's already done in Modules 1 & 2, how to set up everything needed, and gives a ready-to-use prompt to build it.

---

## 1. What we've built so far

### Module 1 — Done ✅
- Project structure: `backend/` (FastAPI) and `frontend/` (React + Vite)
- MongoDB Atlas connected using Motor (async driver)
- JWT authentication — Register/Login for two roles: **Candidate** and **HR**
- React frontend: Login, Register, Candidate Dashboard, HR Dashboard, protected routes, shared design system (Tailwind)

### Module 2 — Done ✅
- HR can create, edit, delete job postings
- Candidates can browse jobs, upload resumes (stored locally in `/uploads` for now), and apply
- Application status tracking: `applied → under_review → shortlisted → rejected/hired`
- Basic in-app notifications
- MongoDB collections: `jobs`, `resumes`, `applications`, `notifications`

At this point the project is a normal job portal — no AI involved yet.

---

## 2. What Module 3 is (in plain language)

Module 3 turns the project into a real **"agentic AI system."** This is the core of what makes HireFlow special.

**The idea:** instead of one giant AI prompt trying to do everything, we build a chain of small, specialized AI agents. Each agent does ONE job well and passes its result to the next agent — like an assembly line evaluating a candidate.

```
JD uploaded
   ↓
Agent 1 — reads JD, extracts required skills/experience
   ↓
Resume uploaded
   ↓
Agent 2 — reads resume (via AWS Textract), extracts skills/projects/experience
   ↓
Agent 3 — removes name/gender/college/photo BEFORE scoring (fairness)
   ↓
Agents 4,5,6 — score skill match, experience match, project relevance
   ↓
Agent 7 — attaches evidence to every score (proof from the resume text)
   ↓
Agent 8 — combines everything into one final ranking + explanation
   ↓
Agent 9 — logs everything that happened (audit trail)
   ↓
HR reviews and approves manually — AI never makes the final hiring decision
```

### The 9 agents explained simply

| # | Agent | What it does |
|---|---|---|
| 1 | Criteria Extraction Agent | Turns JD text into structured data: must-have skills, nice-to-have skills, experience, education |
| 2 | Resume Parsing Agent | Sends resume to AWS Textract → structured JSON: skills, projects, experience, education, certifications |
| 3 | Bias Guardrail Agent | Strips name, gender, photo, college, address before any scoring happens |
| 4 | Skill Matching Agent | Compares candidate skills vs JD requirements → score |
| 5 | Experience Agent | Evaluates years of experience, internships, domain relevance |
| 6 | Project Evaluation Agent | Judges project relevance, tech stack, complexity, impact |
| 7 | Evidence Agent | Attaches proof text + confidence score to every score given |
| 8 | Ranking Agent | Combines all scores into one final score, reasoning, strengths/weaknesses, missing skills |
| 9 | Audit Agent | Logs every agent's input/output/reasoning/timestamp for full traceability |

### Why it's built this way
- **Explainability** — HR sees *why* a candidate scored what they did, not a black-box number
- **Fairness** — bias guardrail removes identity info before judgment
- **Traceability** — every AI decision has a logged trail
- **Human control** — AI only scores/ranks/explains; HR makes the final call

---

## 3. Resources & Setup Required for Module 3

### 3.1 AWS IAM User
1. AWS Console → **IAM** → **Users** → **Create user**
2. Username: `hireflow-dev`
3. Leave console access unchecked (programmatic access only)
4. Attach policies: `AmazonS3FullAccess`, `AmazonTextractFullAccess`, `AmazonBedrockFullAccess`
5. Create user → open it → **Security credentials** → **Create access key** → choose "Application running outside AWS"
6. Save the Access Key ID and Secret Access Key (shown only once)

### 3.2 AWS S3 (resume storage)
1. AWS Console → **S3** → **Create bucket**
2. Name: `hireflow-resumes-<yourname>` (must be globally unique)
3. Region: pick one close to you (e.g. `ap-south-1` for India) — must match your `.env`
4. Keep "Block all public access" ON (private bucket)

### 3.3 AWS Textract
No manual setup — it's an API called directly via `boto3`, using the same IAM credentials.

### 3.4 AWS Bedrock (LLM — primary)
1. AWS Console → **Bedrock** → **Model catalog**
2. Select **Amazon Nova Pro**
3. Open in playground and send one test message — this auto-enables the model for your account
4. No manual "request access" step needed anymore (AWS auto-enables serverless models on first use)

### 3.5 Groq API (LLM — fallback)
1. Sign up at Groq's console, generate an API key
2. Used only if Bedrock fails or is rate-limited

### 3.6 `.env` additions (backend)
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=hireflow-resumes-yourname
GROQ_API_KEY=your_groq_key
```

### 3.7 Python packages
```bash
pip install boto3 langchain langgraph groq
```

### 3.8 Pre-flight checklist (do this before writing any agent code)
Confirm all of these work before starting development:
- [ ] MongoDB connection working (already set up in Module 1)
- [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` present and correct in `.env`
- [ ] S3 bucket reachable (can list/head the bucket via boto3)
- [ ] Nova Pro responds to a test call via Bedrock
- [ ] Groq API key responds to a test call
- [ ] IAM permissions allow S3, Textract, and Bedrock calls

---

## 4. New MongoDB additions for Module 3
- New collection: `audit_logs` — agent_name, input, output, reasoning, timestamp
- Updates to `resumes` — add `parsed_data` (structured JSON from Textract)
- Updates to `applications` — add `scores`, `evidence`, `final_ranking`, `reasoning`

---

## 5. Optimized Build Prompt (for Antigravity)

Paste this into Antigravity to build Module 3 step by step:

```
Build Module 3 of "HireFlow – Agentic AI Recruitment Pipeline" — a final year project.

CONTEXT — what's already built:
- Module 1: FastAPI + Motor (MongoDB Atlas) backend with JWT auth (Candidate/HR roles), React (Vite) + Tailwind frontend with Login/Register/Candidate Dashboard/HR Dashboard, Auth Context + protected routes.
- Module 2: Job posting CRUD (HR), resume upload (local /uploads for now), job applications, application status tracking, basic in-app notifications. MongoDB collections: jobs, resumes, applications, notifications.
- No AI/LLM code exists yet — Module 3 introduces the first AI agents.

LLM SETUP:
- Primary: AWS Bedrock, model = Amazon Nova Pro (via boto3)
- Fallback: Groq API (Llama model) — used only if Bedrock call fails or rate-limits
- Build a single llm_client.py that tries Bedrock first, falls back to Groq on exception, and returns a consistent response format to all agents

BEFORE WRITING AGENT CODE — run and report a pre-flight check:
- MongoDB connection working
- AWS credentials present and S3 bucket reachable
- Nova Pro responds to a test Bedrock call
- Groq API responds to a test call
- Flag anything broken and give exact fix steps before continuing

MODULE 3 SCOPE — build as a LangGraph pipeline with these agent nodes, in this order:
1. Criteria Extraction Agent — parses JD text into structured JSON (must_have_skills, nice_to_have_skills, experience_required, education)
2. Resume Parsing Agent — sends resume file to AWS Textract, extracts skills/projects/experience/education/certifications as structured JSON, stores in MongoDB (resumes.parsed_data)
3. Bias Guardrail Agent — strips name, gender, photo, college, address from parsed resume data before it's passed to any scoring agent
4. Skill Matching Agent — compares parsed resume skills vs JD criteria, returns a skill match score
5. Experience Agent — evaluates years of experience, internships, domain relevance, returns a score
6. Project Evaluation Agent — evaluates project relevance/complexity/impact, returns a score
7. Evidence Agent — for every score above, attaches supporting evidence text extracted from the resume + a confidence level
8. Ranking Agent — combines all scores into one overall_score, written reasoning, strengths, weaknesses, missing_skills
9. Audit Agent — logs every agent's name, input, output, and timestamp into a new audit_logs collection

ALSO BUILD:
- Migrate resume storage from local /uploads to AWS S3 (update upload route from Module 2)
- FastAPI route: POST /screening/run/{job_id} — triggers the full LangGraph pipeline for all applicants of a job
- FastAPI route: GET /screening/results/{job_id} — returns rankings + evidence for HR to review
- Frontend (HR side): a "Rankings" page showing candidates sorted by score, with expandable evidence/reasoning per candidate, and a "Fairness Report" summary view
- Keep frontend styling consistent with Modules 1 & 2's design system

IMPORTANT PRINCIPLE: the AI must never make the final hiring decision — it only scores, ranks, and explains. HR always approves manually.

WORKING STYLE:
- Design the MongoDB schema additions and the LangGraph graph structure first, show them to me, wait for confirmation before writing any code
- Then build one agent at a time, in the order listed above
- After each agent, show how to test it in isolation before moving to the next
- Give commands and code only, minimal explanation, wait for my confirmation before continuing to the next agent
```

---

## 6. Quick summary for a teammate in one sentence

> Module 1 = login/dashboards. Module 2 = post jobs, apply, upload resumes. Module 3 = a pipeline of 9 small AI agents that read the JD and resume, remove bias, score the candidate, explain the score with evidence, and log everything — but a human (HR) still makes the final decision.
