from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "candidate" or "hr"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Module 2 Schemas ---

class JobCreate(BaseModel):
    title: str
    description: str
    must_have_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    experience_required: str
    education: str
    location: str
    salary_range: str

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    must_have_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    experience_required: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    status: Optional[str] = None  # "open" or "closed"

class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: str

class ApplicationStatusUpdate(BaseModel):
    status: str  # "applied", "under_review", "shortlisted", "rejected", "hired"