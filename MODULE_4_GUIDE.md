# Module 4 Guide — Interview Scheduling & Candidate AI Assistant
### HireFlow – Agentic AI Recruitment Pipeline

This file explains what Module 4 is, what's already done in Modules 1–3, how to set up everything needed, and gives a ready-to-use build prompt.

---

## 1. What we've built so far

### Module 1 — Done ✅
- Project structure: `backend/` (FastAPI) and `frontend/` (React + Vite)
- MongoDB Atlas connected via Motor (async driver)
- JWT authentication — Register/Login for **Candidate** and **HR** roles
- React frontend: Login, Register, Candidate Dashboard, HR Dashboard, protected routes, shared design system

### Module 2 — Done ✅
- HR can create, edit, delete job postings
- Candidates can browse jobs, upload resumes, apply
- Application status tracking: `applied → under_review → shortlisted → rejected/hired`
- In-app notifications
- MongoDB collections: `jobs`, `resumes`, `applications`, `notifications`

### Module 3 — Done ✅
- LangGraph pipeline of 9 AI agents: Criteria Extraction, Resume Parsing (Textract), Bias Guardrail, Skill Matching, Experience, Project Evaluation, Evidence, Ranking, Audit
- LLM setup: AWS Bedrock (Nova Pro) primary, Groq fallback
- Resumes stored in AWS S3, parsed data stored in MongoDB
- HR can trigger screening and view candidate rankings + evidence
- `audit_logs` collection tracking every agent decision

At this point, HR can screen and rank candidates. Module 4 handles what happens **after** a candidate is shortlisted — communication, scheduling, and candidate-facing AI help.

---

## 2. What Module 4 is (in plain language)

Module 4 closes the loop between "candidate is shortlisted" and "candidate shows up prepared for an interview." It adds four new agents and a candidate-facing AI assistant.

```
Candidate shortlisted (from Module 3)
   ↓
Scheduler Agent — proposes interview time, creates Google Meet link, sends email
   ↓
Candidate receives notification + email
   ↓
Candidate opens AI Assistant chat:
   → FAQ Agent — answers questions about the company/role/process (RAG-based)
   → Resume Advisor Agent — suggests resume improvements
   → Interview Coach Agent — generates practice interview questions
```

### The 4 agents explained simply

| # | Agent | What it does |
|---|---|---|
| 1 | Scheduler Agent | Picks/confirms an interview slot, generates a Google Meet link, creates a calendar event, and triggers an email notification |
| 2 | FAQ Agent | A RAG-based chatbot — answers candidate questions by retrieving relevant chunks from company policy docs, the JD, and FAQ documents, then generating a grounded answer |
| 3 | Resume Advisor Agent | Looks at the candidate's resume and suggests concrete improvements — missing keywords, formatting/ATS tips, weak sections |
| 4 | Interview Coach Agent | Generates personalized interview questions based on the candidate's resume, the JD, and any skill gaps identified in Module 3 |

### Why it matters
- Reduces HR's manual back-and-forth for scheduling
- Keeps candidates engaged and informed (better candidate experience)
- Gives candidates real, personalized prep help — not generic tips
- RAG grounding means the FAQ bot doesn't hallucinate — it only answers from real company documents

---

## 3. Resources & Setup Required for Module 4

### 3.1 AWS SES (email notifications)
1. AWS Console → **SES** → **Verified identities** → **Create identity**
2. Choose **Email address** (or **Domain** if you own one) → enter your sending email
3. Check your inbox → click the verification link AWS sends
4. If your SES account is in **sandbox mode** (default for new accounts), you can only send to/from verified emails — fine for development/demo; request production access later if needed
5. Attach `AmazonSESFullAccess` policy to your existing IAM user (`hireflow-dev`) if not already attached

### 3.2 Google Calendar / Google Meet API
1. Go to Google Cloud Console → create a new project (or reuse existing)
2. Enable **Google Calendar API**
3. Create **OAuth 2.0 credentials** (OAuth client ID) — type: Web application
4. Add authorized redirect URI (e.g. `http://localhost:8000/auth/google/callback` for local dev)
5. Download the client secret JSON, store safely (not committed to Git)
6. Note: Meet links are auto-generated when creating a Calendar event with `conferenceData` enabled — no separate Meet API needed

### 3.3 FAISS (vector store for RAG)
```bash
pip install faiss-cpu
```
Runs locally — no cloud account needed. Stores embeddings for company documents, JD, FAQs.

### 3.4 Embeddings model
Use **Bedrock Titan Embeddings** (via the same Bedrock access already set up in Module 3) — no new AWS setup needed, just a new model call.

### 3.5 `.env` additions (backend)
```
SES_SENDER_EMAIL=your_verified_email@example.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

### 3.6 Python packages
```bash
pip install boto3 faiss-cpu google-auth google-auth-oauthlib google-api-python-client
```
(`boto3` already installed from Module 3 — used for both SES and Bedrock embeddings)

### 3.7 Pre-flight checklist (before writing agent code)
- [ ] SES sender email verified and able to send a test email
- [ ] Google Cloud OAuth credentials created and redirect URI matches backend route
- [ ] FAISS installed and can create/query a test index
- [ ] Bedrock Titan Embeddings responds to a test call
- [ ] Existing Bedrock/Groq LLM setup from Module 3 still working (used for FAQ/Advisor/Coach agents' text generation)

---

## 4. New MongoDB additions for Module 4
- New collection: `interviews` — application_id, candidate_id, job_id, scheduled_time, meet_link, calendar_event_id, status (scheduled/completed/rescheduled/cancelled)
- New collection: `chat_history` — candidate_id, agent_type (faq/advisor/coach), messages[], created_at
- New collection: `company_documents` — title, content/text, doc_type (policy/faq/interview_process), embedding_id, uploaded_at
- Update to `notifications` — add type values for interview invites/reminders

---

## 5. Optimized Build Prompt

Paste this into your coding tool to build Module 4 step by step:

```
Build Module 4 of "HireFlow – Agentic AI Recruitment Pipeline" — a final year project.

CONTEXT — what's already built:
- Module 1: FastAPI + Motor (MongoDB Atlas) backend, JWT auth (Candidate/HR roles), React (Vite) + Tailwind frontend with dashboards and protected routes.
- Module 2: Job posting CRUD, resume upload (S3), applications, status tracking, notifications.
- Module 3: LangGraph pipeline with 9 agents (Criteria Extraction, Resume Parsing via Textract, Bias Guardrail, Skill Matching, Experience, Project Evaluation, Evidence, Ranking, Audit). LLM setup: AWS Bedrock (Nova Pro) primary, Groq fallback, via a shared llm_client.py. HR can view candidate rankings and evidence.
- No scheduling, email, or candidate-facing AI assistant exists yet — Module 4 adds these.

BEFORE WRITING AGENT CODE — run and report a pre-flight check:
- SES sender email is verified and can send a test email
- Google OAuth credentials work and redirect URI is correctly configured
- FAISS installed and can build/query a test vector index
- Bedrock Titan Embeddings responds to a test call
- Existing Bedrock/Groq LLM client from Module 3 still functional
- Flag anything broken and give exact fix steps before continuing

MODULE 4 SCOPE — build these agents and features in order:

1. Scheduler Agent
   - Given a shortlisted application, propose/confirm an interview time
   - Create a Google Calendar event with Google Meet link (conferenceData) via Calendar API
   - Store record in new `interviews` collection
   - Trigger an email via SES to the candidate with interview details
   - FastAPI routes: POST /interviews/schedule, GET /interviews/candidate/{id}, PATCH /interviews/{id}/reschedule

2. RAG Knowledge Base setup
   - New `company_documents` collection — HR can upload/add policy docs, FAQs, interview process docs (plain text for now, file upload optional)
   - Generate embeddings via Bedrock Titan Embeddings, store vectors in a local FAISS index
   - Build a retrieval function: given a query, return top-k relevant document chunks

3. FAQ Agent
   - Candidate-facing chatbot endpoint: POST /assistant/faq
   - Retrieves relevant chunks from FAISS index, passes to LLM (Bedrock/Groq) with retrieved context, returns grounded answer
   - Store conversation in `chat_history` collection

4. Resume Advisor Agent
   - Endpoint: POST /assistant/resume-advice
   - Takes candidate's parsed resume data (from Module 3), returns structured suggestions: missing_keywords[], formatting_tips[], weak_sections[]

5. Interview Coach Agent
   - Endpoint: POST /assistant/interview-coach
   - Takes resume + JD + missing_skills (from Module 3 ranking output), generates 5-8 personalized interview questions with brief guidance on what a good answer covers

FRONTEND:
- Candidate side: "AI Assistant" page with three tabs/modes — FAQ Chat, Resume Advisor, Interview Coach — chat-style UI consistent with existing design system
- Candidate side: "My Interviews" section showing scheduled interviews with Meet link and date/time
- HR side: simple document upload/entry form to add company_documents for the RAG knowledge base
- Keep frontend styling consistent with Modules 1-3 (dark theme, indigo accent, rounded-xl cards)

WORKING STYLE:
- Design MongoDB schema additions and RAG pipeline structure first, show me, wait for confirmation before coding
- Then build one agent/feature at a time, in the order listed above
- After each feature, show how to test it in isolation before moving to the next
- Give commands and code only, minimal explanation, wait for my confirmation before continuing to the next feature
```

---

## 6. Quick summary for a teammate in one sentence

> Module 4 = once a candidate is shortlisted, the system schedules their interview (Google Meet + email), and gives them an AI assistant to ask questions, improve their resume, and practice interview questions — all grounded in real company documents, not guesses.
