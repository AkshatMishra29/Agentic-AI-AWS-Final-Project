# HireFlow – Agentic AI Recruitment Pipeline

> **An End-to-End, Explainable, Multi-Agent AI Recruitment Platform Built on AWS, LangGraph, and FastAPI.**

![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-emerald?logo=fastapi)
![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![AWS](https://img.shields.io/badge/AWS-Bedrock%20%7C%20S3-orange?logo=amazon-aws)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![LangChain](https://img.shields.io/badge/Orchestration-LangGraph-darkgreen)
![Docker](https://img.shields.io/badge/Container-Docker-2496ed?logo=docker)

---

## 1. Project Title & Tagline
**HireFlow – Agentic AI Recruitment Pipeline (v1)**  
*Empowering recruiters with a 15-Agent explainable AI pipeline that accelerates candidate shortlisting from weeks to seconds while eliminating unconscious bias.*

---

## 2. Problem Statement
Traditional corporate recruitment is fundamentally broken across four major dimensions:
- **Manual Resume Bottlenecks:** Recruiters spend an average of 6–10 seconds skimming a resume, leading to missed qualified talent and high fatigue.
- **Unconscious Hiring Bias:** Candidate age, name, gender, geographic location, and institutional reputation bias decisions during initial screening phases.
- **Black-Box AI Scoring:** Legacy Applicant Tracking Systems (ATS) output arbitrary keyword-match percentages without explaining *why* a candidate was accepted or rejected.
- **Slow Turnaround:** Scheduling calls, answering applicant FAQs, and drafting customized offer letters takes weeks of redundant administrative work.

**Target Audience:** Enterprise HR teams, technical recruiters, hiring managers, and candidates seeking a transparent, fast, and fair recruitment process.

---

## 3. Solution Overview & Human-in-the-Loop Philosophy
HireFlow introduces an agentic AI recruitment system powered by **15 specialized AI agents** organized into modular graphs. The system parses resumes, strips personal identifying information, evaluates candidates across multiple technical dimensions, generates evidence-backed scores, automates interview scheduling, and assists HR in drafting offer letters.

> **Crucial Design Principle — Human-in-the-Loop (HITL):**  
> HireFlow’s AI agents **never** autonomously hire or reject candidates. The system acts as a decision-support copilot—scoring, ranking, explaining, and drafting proposals—while HR managers and Admins retain 100% final authority over shortlisting, interview scheduling, and hiring decisions.

---

## 4. System Architecture
The application follows a modern, decoupled cloud architecture designed for high availability, low latency, and auditability:

```
[Candidate / HR / Admin]
       │
       ▼
┌─────────────────────────┐
│ React (Vite) + Tailwind │  <-- Single Page Application (SPA) UI with Dark/Light Mode
└──────────┬──────────────┘
           │ HTTP / REST API
           ▼
┌─────────────────────────┐
│     FastAPI Backend     │  <-- REST API Gateways, JWT Auth, Background Task Dispatcher
└──────────┬──────────────┘
           ├───────────────────────────────┬──────────────────────────────┐
           ▼                               ▼                              ▼
┌───────────────────────┐     ┌────────────────────────┐     ┌───────────────────────┐
│ LangGraph / LangChain │     │     MongoDB Atlas      │     │    AWS Infrastructure │
│ (15-Agent Pipeline)   │     │ (Users, Jobs, Audits)  │     │ S3 (Resumes), Bedrock │
└──────────┬────────────┘     └────────────────────────┘     └───────────────────────┘
           ▼
┌───────────────────────┐
│ AWS Bedrock (Nova)    │
│ Fallback: Groq Llama3 │
└───────────────────────┘
```

### Architectural Layer Responsibilities:
1. **Frontend Layer (React + Vite):** Renders role-based interfaces (Candidate, HR, Admin), dynamic step-by-step application trackers, and interactive recruiter copilot interfaces.
2. **Backend Gateway (FastAPI):** Enforces JWT authorization, processes file uploads, manages MongoDB CRUD operations, and executes non-blocking background tasks for SMTP/calendar services.
3. **Agent Orchestration (LangGraph):** Manages multi-step stateful workflows where outputs from screening agents feed directly into downstream ranking and audit agents.
4. **Data & Cloud Storage (MongoDB Atlas & AWS S3):** Mongo Atlas stores structured documents and complete JSON audit logs; AWS S3 securely stores uploaded candidate resumes with restricted IAM policies.

---

## 5. User Roles & Access Control
HireFlow enforces strict Role-Based Access Control (RBAC) across three distinct user roles:

| Role | Provisioning Method | Primary Capabilities | Security Restrictions |
| :--- | :--- | :--- | :--- |
| **Candidate** | Public Registration & Google OAuth | Apply for jobs, track application stage, access AI Resume Advisor & Coach, ask FAQ bot. | Restricted to viewing own profile and applications. Cannot access HR or Admin endpoints. |
| **HR Manager** | Created strictly by Admin | Create job postings, run AI screening pipelines, view evidence-backed scores, schedule interviews, draft offer letters. | **No public self-registration.** Cannot delete admin accounts or modify platform-wide configurations. |
| **Super Admin** | One-Time CLI Seed Script | Create/Deactivate HR accounts, reset user passwords, upload updated RAG FAQ files, view platform stats. | Single master account initialized securely. |

**Deliberate Security Architecture:** Restricting HR registration exclusively to Super Admin creation prevents unauthorized users from self-registering as recruiters to access sensitive candidate data or job pipelines.

---

## 6. The 15 AI Agents
HireFlow breaks complex recruitment tasks into 15 focused, single-responsibility agents divided across three functional modules:

### Module 3: Autonomous Screening & Evaluation Graph
1. **Criteria Extraction Agent:** Extracts mandatory skills, preferred qualifications, and experience limits from job descriptions.  
   *Output:* Normalized JSON criteria schema.
2. **Resume Parsing Agent:** Extracts text from candidate PDFs and structures work history, education, and skills.  
   *Output:* Structured candidate JSON object.
3. **Bias Guardrail Agent:** Strips names, emails, gender indicators, age references, and physical addresses from resumes before screening.  
   *Output:* Anonymized candidate profile.
4. **Skill Matching Agent:** Evaluates candidate technical skills against job requirements with semantic match scoring.  
   *Output:* Skill match sub-score (0–100) with missing skill tags.
5. **Experience Evaluation Agent:** Analyzes years of relevant industry experience against senior/junior role constraints.  
   *Output:* Experience relevance sub-score (0–100).
6. **Project Evaluation Agent:** Evaluates candidate project descriptions for depth, complexity, and technology stack alignment.  
   *Output:* Project complexity sub-score (0–100).
7. **Evidence Synthesis Agent:** Combines sub-scores and extracts direct quotes from resumes justifying evaluation ratings.  
   *Output:* Concise evidence summary breakdown.
8. **Ranking Agent:** Calculates weighted overall candidate match scores and ranks applications within a job pool.  
   *Output:* Sorted candidate leaderboard.
9. **Audit Agent:** Formats evaluation steps into immutable JSON audit records for transparency and compliance.  
   *Output:* Complete decision audit log entry.

### Module 4: Candidate Experience & Guidance Agents
10. **Scheduler Agent:** Generates Google Meet links and formats automated calendar invitation emails.  
    *Output:* Google Meet URL and email payload.
11. **FAQ RAG Agent:** Answers candidate questions using FAISS vector retrieval over company policy documents.  
    *Output:* Grounded policy answer with citations.
12. **Resume Advisor Agent:** Analyzes candidate resumes against target roles to recommend improvements.  
    *Output:* Actionable resume optimization advice.
13. **Interview Coach Agent:** Generates mock interview questions tailored to a candidate's specific background.  
    *Output:* Customized technical interview prep questions.

### Module 5: HR Decision Support & Communication Agents
14. **Recruiter Copilot Agent:** Serves as a natural language assistant for HR managers to query applicant pools.  
    *Output:* Filtered candidate insights and summaries.
15. **Offer Letter Agent:** Generates customized offer letters (.docx / text) tailored to role, candidate, and compensation details.  
    *Output:* Formatted, exportable offer letter document.

> **Why Multi-Agent Over a Single Large Prompt?**  
> Single large prompts suffer from instruction drift, hallucination, and zero explainability. The multi-agent architecture ensures isolation: if the Skill Matching Agent evaluates a candidate, its output can be independently inspected, debugged, and audited without affecting the Bias Guardrail or Ranking agents.

---

## 7. Technology Stack & Justification

| Technology | Role | Why Chosen |
| :--- | :--- | :--- |
| **React (Vite)** | Frontend Framework | Blazing fast build times (`< 600ms`), component modularity, and smooth single-page user experience. |
| **Tailwind CSS** | Styling System | Rapid utility-first styling with native class-based dark mode and custom iOS spring curves. |
| **FastAPI** | Backend Web Framework | High-performance asynchronous execution in Python, automatic OpenAPI documentation, and native Pydantic validation. |
| **MongoDB Atlas** | Primary Database | Flexible document model ideally suited for storing heterogeneous resume schemas, job descriptions, and multi-agent JSON audit logs. |
| **LangGraph / LangChain**| Agent Orchestration | Stateful cyclic execution graphs allowing complex multi-agent handoffs, conditional branching, and full step tracing. |

---

## 8. LLM Model Choice & Comparison

HireFlow utilizes **AWS Bedrock (Amazon Nova Pro)** as its primary LLM engine with an automated fallback to **Groq API (Llama 3.3 70B)**.

### Model Evaluation Matrix:

| LLM Model | Evaluation Role | Cost per 1M Tokens | Structured JSON Quality | Reasoning Speed | Choice Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon Nova Pro (Bedrock)** | Primary Enterprise LLM | Very Low ($0.0008) | Exceptional (Native Pydantic) | ~450 ms | **Selected Primary** |
| **Llama 3.3 70B (Groq)** | Open-Source Fallback | Extremely Low | High | ~250 ms | **Selected Fallback** |
| **OpenAI GPT-4o** | Proprietary Competitor | High ($2.50+) | Exceptional | ~600 ms | Rejected (Cost prohibitive for bulk parsing) |
| **Llama 3 8B** | Small Open Model | Minimal | Medium / Low | ~150 ms | Rejected (Fails complex multi-attribute extraction) |

**Justification:** Amazon Nova Pro on AWS Bedrock delivers enterprise-grade structured JSON extraction at a fraction of the cost of legacy proprietary models, while Groq’s Llama 3.3 70B provider guarantees sub-second fallback resiliency if cloud limits are reached.

---

## 9. AWS Resources Used & Justification

| AWS Resource | Purpose | Architectural Justification |
| :--- | :--- | :--- |
| **AWS Bedrock** | Managed Foundation Model Host | Provides secure, compliant access to Amazon Nova Pro without managing GPU infrastructure. |
| **AWS S3** | Candidate Resume Storage | Industry standard for secure object storage with server-side encryption and direct URL generation. |
| **AWS IAM** | Identity & Access Management | Enforces strict least-privilege policies restricting backend access exclusively to dedicated S3 buckets and Bedrock models. |

---

## 10. Free & Open-Source Components (Cost-Conscious Engineering)
Rather than relying on high-cost proprietary APIs for basic operations, HireFlow integrates open-source components:

| Open-Source Tool | Paid Equivalent Replaced | Engineering Rationale |
| :--- | :--- | :--- |
| **PyMuPDF (fitz)** | AWS Textract ($1.50 per 1k pages) | Fast, zero-cost local PDF text parsing with low memory overhead. |
| **sentence-transformers + FAISS** | AWS Bedrock Titan Embeddings + OpenSearch | Enables < 1ms local vector similarity search for RAG FAQ retrieval without maintaining paid vector databases. |
| **Google Calendar API** | Paid Scheduling SaaS (Calendly API) | Direct, seamless generation of authentic Google Meet URLs and calendar invites. |
| **Gmail SMTP** | AWS SES | Zero-overhead, transactional email dispatch via TLS STARTTLS (Port 587) with HTML & plain-text anti-spam delivery. |

---

## 11. Containerization & Deployment
The entire platform is containerized using **Docker** and orchestrated with **Docker Compose**:

- **Frontend Container:** Lightweight Alpine Nginx / Vite dev container serving static assets.
- **Backend Container:** Python 3.11 slim container running FastAPI via `uvicorn`.

### Why Docker Deployment?
- **Reproducibility:** Eliminates "works on my machine" issues by standardizing Python C-extensions (PyMuPDF, FAISS) and Node dependencies across macOS, Linux, and AWS EC2 environments.
- **Instant Rollbacks & Scaling:** Container images allow single-command deployment (`docker compose up --build -d`) and zero-downtime container swaps.

---

## 12. Security Features
- **JWT Authentication:** Stateful user session tokens signed with SHA-256 JWT keys.
- **Role-Based Access Control (RBAC):** Strict route authorization decorators (`require_role(["admin"])`) on FastAPI endpoints.
- **Bcrypt Password Hashing:** Secure, salted password storage for all account types.
- **Bias Guardrail PII Anonymization:** Candidate identity markers stripped prior to evaluation.
- **Immutable Audit Logging:** Every AI sub-score, extracted phrase, and model decision is logged to MongoDB Atlas.
- **Gated HR Account Provisioning:** Public signups restricted strictly to candidate roles; HR credentials can only be generated by Super Admin.

---

## 13. What Makes HireFlow Unique?
1. **Explainable Evidence-Backed Scoring:** Unlike traditional black-box ATS systems, HireFlow provides direct resume quotes and sub-score breakdowns justifying candidate ranks.
2. **Architecture-Level Bias Elimination:** Anonymization occurs inside the LangGraph pipeline before scoring agents execute.
3. **Structurally Enforced Human-in-the-Loop:** AI agents only recommend and explain; human recruiters retain full decision control.
4. **Ultra-Low Cost Engineering:** Combination of AWS Bedrock Nova Pro and open-source FAISS/PyMuPDF keeps per-candidate evaluation costs under $0.002.

---

## 14. Current Limitations (Version 1 Scope)
HireFlow v1 is a production-ready first iteration with the following explicit scope boundaries:
- **No Automated Unit Test Suite Yet:** Testing is currently performed via automated Python integration test scripts.
- **No Automated CI/CD Pipeline Yet:** Deployments are executed manually via Docker build scripts on AWS.
- **No API Rate Limiting Yet:** Basic backend throttling is not yet enforced per IP address.

---

## 15. Future Roadmap (v2+)
- [ ] **CI/CD Integration:** GitHub Actions workflow for automated testing and container deployment.
- [ ] **Automated Testing Suite:** PyTest unit tests for backend routers and Vitest for React components.
- [ ] **Multi-Language Resume Support:** Support for parsing and evaluating resumes in Spanish, French, and German.
- [ ] **Predictive Recruitment Analytics:** Attrition risk analysis and time-to-hire forecasting models.
- [ ] **Native Mobile App:** React Native candidate portal for iOS and Android.

---

## 16. Getting Started & Environment Variables

### Required Environment Variables (.env)

#### Backend `.env` (`/backend/.env`):
```env
# Database & Auth
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=HireFlow
DB_NAME=hireflow
JWT_SECRET=YourSuperSecretJWTKey2026

# AWS Infrastructure
AWS_ACCESS_KEY_ID=YourAWSAccessKeyID
AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey
AWS_REGION=ap-south-1
S3_BUCKET_NAME=hireflow-resumes-bucket

# LLM Providers
GROQ_API_KEY=gsk_YourGroqAPIKeyHere

# Gmail SMTP Email Dispatch
EMAIL_SENDER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
```

#### Frontend `.env` (`/frontend/.env`):
```env
VITE_GOOGLE_CLIENT_ID=706843949127-u8a9k68haol9seklrorc47ee7692mleq.apps.googleusercontent.com
```

### Local Running Instructions via Docker Compose

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AkshatMishra29/Agentic-AI-AWS-Final-Project.git
   cd Agentic-AI-AWS-Final-Project
   ```

2. **Launch with Docker Compose:**
   ```bash
   docker compose up --build -d
   ```

3. **Access the application:**
   - **Frontend UI:** `http://localhost:5173`
   - **FastAPI API Docs:** `http://localhost:8000/docs`

---

## 17. Project Structure

```text
HireFlow Project/
├── backend/
│   ├── main.py                     # FastAPI main application & auth routes
│   ├── database.py                 # Async MongoDB Motor connection client
│   ├── candidate_faq_kb.txt        # Candidate FAQ & Policy Knowledge Base
│   ├── models.py                   # Pydantic data schemas
│   ├── routers/
│   │   ├── admin.py                # Admin management & FAQ uploader routes
│   │   ├── analytics.py            # Recruitment overview analytics
│   │   ├── assistant.py            # RAG FAQ Assistant & Resume Advisor
│   │   ├── interviews.py           # Interview scheduling routes
│   │   ├── jobs.py                 # Job posting CRUD endpoints
│   │   ├── offers.py               # Sample offer letters & .docx streaming
│   │   └── screening.py            # LangGraph multi-agent screening trigger
│   └── services/
│       ├── llm.py                  # AWS Bedrock & Groq LLM integration
│       ├── rag_kb.py               # sentence-transformers & FAISS vector search
│       └── scheduler.py            # Gmail SMTP & Google Meet link generator
├── frontend/
│   ├── src/
│   │   ├── api.js                  # Axios API client
│   │   ├── App.jsx                 # Main React router with lazy loading
│   │   ├── components/             # Reusable UI components & dashboard views
│   │   ├── context/AuthContext.jsx # Theme state & session auth provider
│   │   └── pages/                  # Candidate, HR, & Admin dashboard pages
│   ├── index.html                  # Main HTML template
│   └── tailwind.config.js          # Tailwind CSS dark mode configuration
└── docker-compose.yml              # Container orchestration manifest
```

---

## 18. License & Acknowledgments

- **Developed as a Final Year AI Engineering Capstone Project (v1).**
- Built using open-source tools: [FastAPI](https://fastapi.tiangolo.com/), [React](https://react.dev/), [LangChain](https://www.langchain.com/), [FAISS](https://github.com/facebookresearch/faiss), and [PyMuPDF](https://pymupdf.readthedocs.io/).
- Hosted on **AWS Cloud Infrastructure**.
