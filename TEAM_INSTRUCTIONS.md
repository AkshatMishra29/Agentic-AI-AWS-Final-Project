# 🚀 HireFlow - Team Developer Instructions & Setup Guide

Welcome to the **HireFlow** repository! This document contains step-by-step instructions on how to set up, configure, run, test, and extend the project for team collaboration—including guidelines for developing **Module 3**.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Prerequisites](#-prerequisites)
3. [Step-by-Step Setup & How to Run](#-step-by-step-setup--how-to-run)
   - [Backend Setup (FastAPI)](#1-backend-setup-fastapi)
   - [Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
4. [Environment & API Credentials Setup](#-environment--api-credentials-setup)
5. [End-to-End Testing & Verification Guide](#-end-to-end-testing--verification-guide)
   - [Module 1: Authentication & Roles](#module-1-authentication--roles)
   - [Module 2: Job CRUD, Resume Upload & Applications](#module-2-job-crud-resume-upload--applications)
   - [Module 3: AI Screening Pipeline (Textract + LLM + LangGraph)](#module-3-ai-screening-pipeline-textract--llm--langgraph)
6. [Guide for Building Module 3](#-guide-for-building-module-3)
   - [Backend Development Workflow](#a-backend-development-workflow)
   - [Frontend Development Workflow](#b-frontend-development-workflow)
7. [Git Collaboration Workflow](#-git-collaboration-workflow)

---

## 🏗 Project Overview

HireFlow is an AI-powered applicant tracking system (ATS) and recruitment platform.

- **Backend**: Python 3.10+ / FastAPI / Motor (Async MongoDB Driver) / PyJWT / Passlib
- **Frontend**: React 19 / Vite / Tailwind CSS / React Router v7 / Axios
- **Database**: MongoDB Atlas (Cloud)

```text
HireFlow Project/
├── TEAM_INSTRUCTIONS.md    <-- You are here
├── backend/
│   ├── main.py             # FastAPI entry point & API endpoints
│   ├── auth.py             # Authentication & JWT utilities
│   ├── database.py         # MongoDB connection setup
│   ├── models.py           # Pydantic data schemas
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Local environment variables (DO NOT COMMIT)
│   └── .env.example        # Environment variable template
└── frontend/
    ├── src/
    │   ├── api.js          # Centralized Axios API instance
    │   ├── App.jsx         # Routes setup
    │   ├── pages/          # Full page views (HRDashboard, CandidateDashboard, etc.)
    │   ├── components/     # Feature components (hr/, candidate/, ui/, layout/)
    │   └── context/        # Auth Context provider
    ├── package.json
    └── vite.config.js
```

---

## 🛠 Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher
- **Python**: `3.10` or higher
- **Git**: Installed and configured

---

## ⚡ Step-by-Step Setup & How to Run

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   - **macOS/Linux**:
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

4. Set up environment variables (see [Environment Credentials Setup](#-environment--api-credentials-setup)).

5. Start the backend development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will run at `http://localhost:8000`. You can test endpoints interactive docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup (React + Vite)

1. Open a **new terminal tab/window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The web app will run at `http://localhost:5173`.

---

## 🔑 Environment & API Credentials Setup

To connect to the database and use external API services, set up your `.env` file in the `backend/` directory.

### Step 1: Create `.env` in `backend/`
Create a `.env` file inside the `backend` directory (if it does not exist already):
```bash
# Path: backend/.env
```

### Step 2: Add Required Credentials
Paste the following key-value pairs into `backend/.env`:

```env
# MongoDB Database Credentials
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
DB_NAME=hireflow

# Authentication Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Third-party APIs / Cloud Credentials (AWS / AI / Email)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
OPENAI_API_KEY=your_openai_api_key
```

> ⚠️ **IMPORTANT SECURITY NOTICE**:
> Never commit `.env` files containing actual passwords or secret keys to GitHub. Ensure `.env` is listed in your `.gitignore`.

---

## 🧪 End-to-End Testing & Verification Guide

Follow these testing steps to verify each module of the application:

### Module 1: Authentication & Roles

1. **Register HR Account**:
   - Go to **Register** → Fill name, email (`hr@test.com`), password (`123456`), and select role **HR**.
   - Confirm redirect to Login / HR Dashboard.

2. **Register Candidate Account**:
   - Open Incognito mode (or Logout) → Register candidate (`candidate@test.com`), password (`123456`), and select role **Candidate**.

3. **Verify Auth Guards**:
   - Log in as Candidate → Try visiting HR routes (or posting a job) → Should block/hide HR controls.

---

### Module 2: Job CRUD, Resume Upload & Applications

1. **Post a Job (as HR)**:
   - Log in as `hr@test.com`.
   - Go to **Job Postings** → Click **"Post New Job"**.
   - **Title**: Senior Python Engineer
   - **Description**: Looking for a Python expert with 3+ years experience in FastAPI, React, and AWS S3.
   - **Must-Have Skills**: Python, FastAPI, React
   - **Nice-to-Have Skills**: AWS, Docker
   - **Experience**: 3+ years
   - Click **Submit** → Confirm job appears under Job Postings.

2. **Upload Resume & Apply (as Candidate)**:
   - Log in as `candidate@test.com`.
   - Go to **Candidate Dashboard** → **Upload Resume** → Select a PDF/DOCX resume file.
   - Confirm resume uploads successfully (lands in AWS S3 / storage).
   - Go to **Browse Jobs** → Find *Senior Python Engineer* → Click **Apply** → Select uploaded resume → Submit.
   - Confirm status changes to **Applied**.

---

### Module 3: AI Screening Pipeline (Textract + LLM + LangGraph)

1. **Trigger AI Screening (as HR)**:
   - Log in back as `hr@test.com`.
   - Go to **Job Postings** → Click **Applicants** on *Senior Python Engineer*.
   - You should see `candidate@test.com` in the list with their uploaded resume.
   - Click the **"Run AI Screen"** button.

2. **Verify AI Agent Execution & Results**:
   - Watch the status badge: `Queued` ➔ `Running…` ➔ `Screened`.
   - Once completed, the overall score (e.g., `82/100`) and sub-score breakdown (Skills, Experience, Projects) will appear.
   - Click **"View Report"** to open the **Evidence Modal**:
     - **Overview tab**: Check AI reasoning, strengths, weaknesses, and missing skills.
     - **Evidence tab**: Check quotes extracted by agents.
     - **Fairness tab**: Confirm PII fields (name, email, institution) were stripped by the Bias Guardrail agent.

3. **Update Candidate Stage**:
   - In Applicants View, change stage dropdown to **Shortlisted** or **Hired**.
   - Log in as Candidate → Check **Notifications** tab to confirm real-time notification received!

---

## 🧩 Guide for Building Module 3

Team members assigned to develop **Module 3** should follow these established patterns to keep the codebase clean and modular.

### A. Backend Development Workflow

1. **Define Module 3 Data Models (`backend/models.py`)**:
   Add Pydantic models for incoming request bodies and responses:
   ```python
   from pydantic import BaseModel, Field
   from typing import Optional, List

   class Module3ItemCreate(BaseModel):
       title: str
       description: str
       status: Optional[str] = "pending"
   ```

2. **Implement Module 3 API Endpoints (`backend/main.py`)**:
   Create async API endpoints for Module 3 functionality:
   ```python
   from database import db
   from auth import get_current_user
   from models import Module3ItemCreate

   @app.post("/api/module3/items")
   async def create_module3_item(item: Module3ItemCreate, current_user: dict = Depends(get_current_user)):
       doc = item.dict()
       doc["created_by"] = current_user["email"]
       result = await db["module3_collection"].insert_one(doc)
       return {"id": str(result.inserted_id), "message": "Module 3 item created successfully"}
   ```

3. **Database Collections**:
   Use `db["module3_collection_name"]` to perform async queries with Motor driver.

---

### B. Frontend Development Workflow

1. **Add Module 3 API Calls (`frontend/src/api.js`)**:
   Define exported functions using the existing Axios instance:
   ```javascript
   // Module 3 API Calls
   export const getModule3Data = async () => {
     const response = await API.get('/api/module3/items');
     return response.data;
   };

   export const createModule3Item = async (data) => {
     const response = await API.post('/api/module3/items', data);
     return response.data;
   };
   ```

2. **Create Module 3 UI Components**:
   - Place reusable sub-components in `frontend/src/components/module3/` (e.g. `Module3Form.jsx`, `Module3List.jsx`).
   - Create main dashboard/page views in `frontend/src/pages/Module3Page.jsx`.

3. **Register Page Route in `frontend/src/App.jsx`**:
   Wrap routes with `<ProtectedRoute>` if authentication is required:
   ```javascript
   <Route 
     path="/module3" 
     element={
       <ProtectedRoute allowedRoles={['hr', 'candidate']}>
         <Module3Page />
       </ProtectedRoute>
     } 
   />
   ```

4. **Update Navigation (`Sidebar.jsx` / `Navbar.jsx`)**:
   Add a link entry in `frontend/src/components/layout/Sidebar.jsx` so users can navigate to the Module 3 section.

---

## 🔀 Git Collaboration Workflow

Follow these git commands when contributing to the repository:

1. **Pull latest changes before starting work**:
   ```bash
   git pull origin main
   ```

2. **Stage and commit your updates**:
   ```bash
   git add .
   git commit -m "feat(module-3): implement module 3 core backend and frontend components"
   ```

3. **Push changes to GitHub**:
   ```bash
   git push origin main
   ```
