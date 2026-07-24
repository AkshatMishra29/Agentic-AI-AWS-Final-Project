# Module 5 Guide — Recruiter Copilot, Offer Letters, Analytics & Deployment
### HireFlow – Agentic AI Recruitment Pipeline

This is the final module. It explains what Module 5 is, what's already done in Modules 1–4, setup steps for everything needed, and gives a ready-to-use build prompt. It also includes a final checklist to confirm every original project requirement is satisfied before submission.

---

## 1. What we've built so far

### Module 1 — Done ✅
- Project structure, MongoDB Atlas, JWT auth (Candidate/HR), React dashboards, protected routes

### Module 2 — Done ✅
- Job posting CRUD, resume upload (S3), applications, status tracking, notifications

### Module 3 — Done ✅
- LangGraph pipeline, 9 agents (Criteria Extraction, Resume Parsing, Bias Guardrail, Skill Matching, Experience, Project Evaluation, Evidence, Ranking, Audit)
- LLM: Bedrock (Nova Pro) primary, Groq fallback
- HR can view rankings, evidence, audit logs

### Module 4 — Done ✅
- Scheduler Agent (Google Meet + Calendar), SES email notifications
- RAG knowledge base (FAISS + Bedrock Titan Embeddings)
- FAQ Agent, Resume Advisor Agent, Interview Coach Agent
- Candidate AI Assistant page, "My Interviews" view

At this point the platform is functionally complete for both Candidate and HR. Module 5 adds the final layer for **HR power-users**, generates **offer letters**, adds **analytics**, and takes the project to **deployment + submission-ready** state.

---

## 2. What Module 5 is (in plain language)

Module 5 has two halves:

**Half A — Recruiter-facing AI tools**
```
HR asks a natural-language question
   ↓
Recruiter Copilot Agent — searches candidate/ranking data, retrieves relevant records,
generates a grounded, explainable answer
   ↓
HR approves a candidate → clicks "Generate Offer"
   ↓
Offer Letter Agent — fills an approved template with candidate + role details
   ↓
HR reviews/edits → downloads final offer letter
```

**Half B — Shipping the project**
```
Analytics Dashboard (pipeline stats) → Deployment (host frontend + backend)
   → Documentation (README, screenshots, demo video) → Submission
```

### The 2 agents explained simply

| # | Agent | What it does |
|---|---|---|
| 1 | Recruiter Copilot Agent | Answers HR's natural-language questions about candidates — e.g. "show top 5 Python candidates," "why is Rahul ranked #2," "who's missing Docker experience" — by querying MongoDB (rankings/evidence from Module 3) and generating an explainable answer, not a guess |
| 2 | Offer Letter Agent | Takes an approved candidate + a pre-written offer template, fills in name/role/salary/joining date/etc., produces an editable draft for HR |

### Why it matters
- Recruiter Copilot saves HR time — no manual filtering/sorting through spreadsheets
- Offer Letter Agent removes repetitive manual drafting
- Analytics gives HR visibility into hiring funnel health
- Deployment + docs make the project demo-able and evaluable — this is what actually gets graded/judged

---

## 3. Resources & Setup Required for Module 5

### 3.1 No new AWS AI services needed
Module 5 reuses the existing Bedrock (Nova Pro) + Groq fallback LLM setup from Module 3 — no new model access required.

### 3.2 Deployment — Backend
Options (pick one):
- **Render** (easiest, free tier available) — connect GitHub repo, set build command, add all `.env` variables in dashboard
- **AWS EC2** (more "production," more setup) — provision instance, install dependencies, run with `gunicorn`/`uvicorn` + a process manager (e.g. `systemd` or `pm2`)
- **Railway** — similar to Render, simple GitHub-connected deploys

Steps for Render (recommended for a student project):
1. Push backend code to GitHub (if not already)
2. Render dashboard → **New Web Service** → connect repo → select `backend/` as root
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all `.env` variables (Mongo URI, JWT secret, AWS keys, Groq key, Google OAuth keys) in Render's Environment tab
6. Deploy, confirm the live URL responds

### 3.3 Deployment — Frontend
- **Vercel** or **Netlify** (recommended, free tier, GitHub-connected)
1. Push frontend code to GitHub
2. Vercel/Netlify → **New Project** → connect repo → select `frontend/` as root
3. Build command: `npm run build`, output dir: `dist`
4. Set environment variable for backend API base URL (pointing to your deployed backend)
5. Deploy, confirm the live URL loads and connects to the backend

### 3.4 `requirements.txt` (generate before deploying)
```bash
cd backend
pip freeze > requirements.txt
```

### 3.5 Pre-flight checklist (before writing agent code)
- [ ] Existing Bedrock/Groq LLM client from Module 3 still functional
- [ ] MongoDB has enough candidate/ranking data (from Module 3 testing) to demo Recruiter Copilot meaningfully
- [ ] At least one offer letter template drafted and approved for the Offer Letter Agent to use
- [ ] GitHub repo is clean and pushed (frontend + backend)
- [ ] `.env.example` file created (with placeholder values) so teammates/evaluators know what variables are needed without exposing real secrets

---

## 4. New MongoDB additions for Module 5
- New collection: `offer_letters` — application_id, candidate_id, job_id, template_used, filled_content, status (draft/sent), created_at, edited_by
- Optional: `analytics_cache` — precomputed pipeline stats if you want faster dashboard loads (not required for a student project scale)

---

## 5. Optimized Build Prompt

```
Build Module 5 (final module) of "HireFlow – Agentic AI Recruitment Pipeline" — a final year project.

CONTEXT — what's already built:
- Module 1: FastAPI + Motor (MongoDB Atlas) backend, JWT auth (Candidate/HR), React (Vite) + Tailwind frontend, dashboards, protected routes.
- Module 2: Job posting CRUD, resume upload (S3), applications, status tracking, notifications.
- Module 3: LangGraph pipeline with 9 agents (Criteria Extraction, Resume Parsing via Textract, Bias Guardrail, Skill Matching, Experience, Project Evaluation, Evidence, Ranking, Audit). LLM: Bedrock (Nova Pro) primary, Groq fallback, via shared llm_client.py. HR views rankings/evidence.
- Module 4: Scheduler Agent (Google Meet/Calendar + SES email), RAG knowledge base (FAISS + Bedrock Titan Embeddings), FAQ Agent, Resume Advisor Agent, Interview Coach Agent, candidate AI Assistant page.
- No recruiter copilot, offer letters, analytics, or deployment exist yet.

BEFORE WRITING AGENT CODE — run and report a pre-flight check:
- Bedrock/Groq LLM client from Module 3 still functional
- MongoDB has candidate/application/ranking data available to query
- Flag anything broken before continuing

MODULE 5 SCOPE — build in this order:

1. Recruiter Copilot Agent
   - Endpoint: POST /copilot/query — accepts a natural-language HR question
   - Retrieves relevant candidate/application/ranking/evidence data from MongoDB based on the question (use simple structured queries or a retrieval step, not full RAG unless needed)
   - Passes retrieved data + question to LLM, returns a grounded, explainable answer (must cite which candidates/data it used)
   - Store query + response in a lightweight log for traceability

2. Offer Letter Agent
   - New `offer_letters` collection
   - HR-side: manage 1-2 offer letter templates (plain text with placeholders like {candidate_name}, {role}, {salary}, {joining_date})
   - Endpoint: POST /offers/generate/{application_id} — fills template with candidate + job data, creates a draft
   - Endpoint: PATCH /offers/{id} — HR edits draft before finalizing
   - Endpoint: GET /offers/{id}/download — exports as PDF or plain text download

3. Recruitment Analytics
   - Endpoint: GET /analytics/overview — pipeline funnel counts (applied/under_review/shortlisted/rejected/hired), average time-to-hire, average AI score per job
   - Endpoint: GET /analytics/job/{job_id} — per-job breakdown

FRONTEND:
- HR side: "Recruiter Copilot" chat page — ask questions, see grounded answers with candidate references
- HR side: "Offer Letters" page — generate/edit/download offers for shortlisted candidates
- HR side: "Analytics" dashboard — funnel chart, key stats cards, per-job breakdown
- Keep styling consistent with Modules 1-4 (dark theme, indigo accent, rounded-xl cards)

DEPLOYMENT (after all features work locally):
- Generate requirements.txt for backend
- Prepare .env.example (placeholder values only, no real secrets) for both backend and frontend
- Give me step-by-step deployment instructions for backend (Render) and frontend (Vercel), including exact environment variables needed
- Confirm the deployed frontend can reach the deployed backend (CORS configured correctly)

DOCUMENTATION (final step):
- Update the project README with final architecture, setup instructions, and feature list
- List all environment variables needed with a short description of each (no real values)
- Note: I will add screenshots and a demo video separately before submission

WORKING STYLE:
- Design the MongoDB schema and API structure first, show me, wait for confirmation before coding
- Then build one feature at a time, in the order listed above
- After each feature, show how to test it in isolation before moving to the next
- Give commands and code only, minimal explanation, wait for my confirmation before continuing to the next feature
```

---

## 6. Final Project Requirements Checklist

Use this before submission to confirm nothing from the original spec was missed.

**Core principle**
- [ ] AI never makes the final hiring decision — HR always approves (verify this is true in every AI-touching flow)

**User roles**
- [ ] Candidate: register, login, profile, resume upload, apply, application history/status, interview schedule + Meet link, notifications, AI assistant (FAQ/resume advice/interview coach)
- [ ] HR: login, dashboard, job CRUD, view candidates, run AI screening, view rankings + evidence, fairness report, schedule interviews, generate interview questions, generate offer letters, recruitment analytics

**All 15 agents present**
- [ ] Criteria Extraction, Resume Parsing, Skill Matching, Experience, Project Evaluation, Evidence, Bias Guardrail, Ranking, Audit, Scheduler, FAQ, Resume Advisor, Interview Coach, Offer Letter, Recruiter Copilot

**Technical**
- [ ] LangGraph orchestrates the full agent workflow end-to-end (not just Module 3's screening chain)
- [ ] RAG system functional with FAISS + real company documents
- [ ] MongoDB collections match spec: users, jobs, resumes, applications, interviews, audit_logs, notifications, offer_letters, company_documents, chat_history
- [ ] All APIs documented (request/response/status codes) — Swagger docs via FastAPI `/docs` covers this automatically
- [ ] Error handling present on all endpoints
- [ ] Environment variables used for all secrets (no hardcoded keys)

**Deliverables**
- [ ] Deployed frontend + backend (live links)
- [ ] Final README with setup instructions
- [ ] Screenshots of all major screens
- [ ] Demo video
- [ ] GitHub repo clean, organized, with meaningful commit history

---

## 7. Quick summary for a teammate in one sentence

> Module 5 = HR gets a smart assistant to query candidate data in plain English, auto-generates offer letters, sees hiring analytics — and then the whole project gets deployed live and documented for submission.
