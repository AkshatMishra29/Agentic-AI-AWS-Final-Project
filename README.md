# ⚡ HireFlow - AI-Powered Applicant Tracking System (ATS)

HireFlow is an end-to-end AI-powered Applicant Tracking System (ATS) and recruitment platform. It automates candidate resume parsing, S3 document storage, bias-free PII guardrails, multi-agent LLM scoring, and real-time application tracking for HR teams and job seekers.

---

## 🏗 Architecture & Technology Stack

- **Backend**: Python 3.10+ / FastAPI / Motor (Async MongoDB) / PyJWT / Passlib / Boto3 (AWS S3) / LangGraph & OpenAI/Gemini LLMs
- **Frontend**: React 19 / Vite / Tailwind CSS / React Router v7 / Axios / React Hot Toast
- **Database**: MongoDB Atlas (Cloud Cluster)
- **Cloud Storage**: AWS S3 Bucket (Resume storage)

```text
HireFlow Project/
├── README.md               # Main Project Documentation & Setup Guide
├── TEAM_INSTRUCTIONS.md    # Developer Instructions & Module 3 Guide
├── backend/
│   ├── main.py             # FastAPI entry point & API routes
│   ├── auth.py             # JWT Authentication logic & password hashing
│   ├── database.py         # Async MongoDB Motor connection
│   ├── models.py           # Pydantic request & response schemas
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   ├── agents/             # Multi-agent AI screening pipeline (LangGraph)
│   ├── routers/            # Modular FastAPI endpoint routers
│   └── services/           # S3 storage & LLM integrations
└── frontend/
    ├── src/
    │   ├── api.js          # Centralized Axios API client
    │   ├── App.jsx         # Application routing & layout
    │   ├── pages/          # HR & Candidate views
    │   └── components/     # UI components & AI Evidence Modal
    ├── package.json
    └── vite.config.js
```

---

## 🔑 Environment & Connection Strings Configuration

To run the application, create a `.env` file inside the `backend/` directory:

```bash
# Path: backend/.env
```

### Required `.env` Variables Breakdown:

```env
# 1. MongoDB Connection String & Database Name
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/?appName=Cluster0
DB_NAME=hireflow

# 2. Authentication Secret Key (Used to sign JWT tokens)
JWT_SECRET=your_super_secret_jwt_key_here

# 3. AWS S3 Credentials (For Resume Upload & Textract Storage)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_hireflow_s3_bucket_name

# 4. AI / LLM API Key (For Candidate Resume Evaluation & Bias Removal)
OPENAI_API_KEY=your_openai_api_key
# or
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ **SECURITY NOTICE**:
> `backend/.env` contains sensitive keys and passwords. It is ignored by Git and **must never be committed** to the public repository.

---

## ⚡ How to Run the Entire Project Step-by-Step

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` or higher
- **Git**: Installed

---

### Step 1: Start the Backend Server (FastAPI)

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Ensure your `backend/.env` file is set up with valid database and API connection strings.

5. Launch the backend FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

- 🌐 **Backend Server URL**: `http://localhost:8000`
- 📖 **Interactive API Documentation (Swagger Docs)**: `http://localhost:8000/docs`

---

### Step 2: Start the Frontend Application (React + Vite)

1. Open a **second terminal window/tab** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

- 🚀 **Frontend Web Application URL**: `http://localhost:5173`

---

## 🌐 Comprehensive API Endpoints Reference

### 🔐 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user (Role: `hr` or `candidate`) | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & return JWT Bearer token | ❌ |
| `GET` | `/api/auth/me` | Fetch current logged-in user profile | 🔐 Yes |

### 💼 2. Job Management Endpoints (`/api/jobs`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/jobs` | Retrieve all active job postings | ❌ |
| `POST` | `/api/jobs` | Create a new job posting (HR only) | 🔐 HR Only |
| `GET` | `/api/jobs/{job_id}` | Fetch detailed job specifications | ❌ |
| `DELETE` | `/api/jobs/{job_id}` | Delete a job posting (HR only) | 🔐 HR Only |

### 📄 3. Resume & Storage Endpoints (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/upload/resume` | Upload candidate resume PDF/DOCX to AWS S3 | 🔐 Yes |

### 📝 4. Job Applications Endpoints (`/api/applications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/applications` | Submit candidate job application with S3 resume link | 🔐 Candidate |
| `GET` | `/api/applications/my` | Get candidate's submitted applications | 🔐 Candidate |
| `GET` | `/api/applications/job/{job_id}` | Get all applicants for a specific job (HR only) | 🔐 HR Only |
| `PATCH` | `/api/applications/{id}/stage` | Update candidate hiring stage (`Shortlisted`, `Hired`, etc.) | 🔐 HR Only |

### 🧠 5. AI Resume Screening Pipeline (`/api/screening`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/screening/run` | Trigger multi-agent AI resume screening & evaluation | 🔐 HR Only |
| `GET` | `/api/screening/results/{application_id}` | Retrieve AI score, radar sub-scores, and fairness audit | 🔐 HR Only |

### 🔔 6. Notifications Endpoints (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications` | Fetch unread notifications for logged-in user | 🔐 Yes |
| `PATCH` | `/api/notifications/{id}/read` | Mark notification as read | 🔐 Yes |

---

## 🧪 Quick Testing Guide

1. **Register HR Account**: Sign up with `hr@test.com`, select role **HR**, and log in.
2. **Post a Job**: Go to **Job Postings** ➔ **Post New Job** (e.g. *Senior Python Engineer*).
3. **Candidate Application**: Sign up as `candidate@test.com`, upload a PDF resume, browse jobs, and click **Apply**.
4. **AI Screening**: Switch to HR account, view applicants for the job, click **Run AI Screen**, and view the generated **AI Evidence Modal** report.

---

## 🤝 Contributing & Team Guidelines
Refer to [TEAM_INSTRUCTIONS.md](TEAM_INSTRUCTIONS.md) for detailed guidelines on adding new modules and features.
