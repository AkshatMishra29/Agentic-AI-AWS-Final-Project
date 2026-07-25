from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from bson import ObjectId
from datetime import datetime
from database import db
from models import UserCreate
from auth import require_role, hash_password

def serialize_doc(doc):
    if not doc:
        return doc
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(require_role(["admin"]))):
    """Return top-level counts for Admin overview."""
    total_candidates = await db.users.count_documents({"role": "candidate"})
    total_hr = await db.users.count_documents({"role": "hr"})
    total_jobs = await db.jobs.count_documents({})
    total_interviews = await db.interviews.count_documents({})
    return {
        "total_candidates": total_candidates,
        "total_hr": total_hr,
        "total_jobs": total_jobs,
        "total_interviews": total_interviews
    }

@router.post("/hr")
async def create_hr_account(
    payload: UserCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin creates a new HR Manager account directly."""
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    hr_doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": "hr",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    res = await db.users.insert_one(hr_doc)
    created = await db.users.find_one({"_id": res.inserted_id})
    created.pop("password", None)
    return serialize_doc(created)

@router.get("/hr")
async def list_hr_accounts(current_user: dict = Depends(require_role(["admin"]))):
    """Admin lists all registered HR Manager accounts."""
    cursor = db.users.find({"role": "hr"}).sort("created_at", -1)
    hr_list = []
    async for doc in cursor:
        doc.pop("password", None)
        hr_list.append(serialize_doc(doc))
    return hr_list

@router.patch("/hr/{id}/deactivate")
async def toggle_hr_status(
    id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin deactivates or reactivates an HR account."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid HR User ID")

    hr_user = await db.users.find_one({"_id": ObjectId(id), "role": "hr"})
    if not hr_user:
        raise HTTPException(status_code=404, detail="HR account not found")

    new_status = not hr_user.get("is_active", True)
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"is_active": new_status}})
    return {"message": f"HR account status updated to {'Active' if new_status else 'Deactivated'}", "is_active": new_status}

@router.delete("/hr/{id}")
async def delete_hr_account(
    id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin deletes an HR account."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid HR User ID")

    res = await db.users.delete_one({"_id": ObjectId(id), "role": "hr"})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="HR account not found")
    return {"message": "HR account deleted successfully", "id": id}

# --- ADMIN KNOWLEDGE BASE & FAQ MANAGEMENT ---

@router.post("/faq-upload")
async def upload_admin_faq_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Admin uploads an updated .txt FAQ / Knowledge Base file.
    Parses file content, saves to MongoDB company_documents, and rebuilds FAISS RAG index.
    """
    from services.rag_kb import rebuild_faiss_index

    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt Knowledge Base files are supported.")

    content_bytes = await file.read()
    content_text = content_bytes.decode("utf-8", errors="ignore").strip()

    if not content_text:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save to MongoDB
    doc_item = {
        "title": file.filename,
        "content": content_text,
        "doc_type": "faq",
        "created_by": current_user["email"],
        "created_at": datetime.utcnow().isoformat()
    }
    res = await db.company_documents.insert_one(doc_item)

    # Rebuild FAISS RAG index instantly with all documents
    all_docs = await db.company_documents.find().to_list(100)
    rebuild_faiss_index(all_docs)

    created = await db.company_documents.find_one({"_id": res.inserted_id})
    return {
        "message": f"FAQ document '{file.filename}' uploaded and FAISS RAG Knowledge Base updated successfully!",
        "doc": serialize_doc(created)
    }

@router.get("/faq-docs")
async def list_admin_faq_docs(current_user: dict = Depends(require_role(["admin"]))):
    """Admin lists all active RAG FAQ documents."""
    cursor = db.company_documents.find({"doc_type": "faq"}).sort("created_at", -1)
    docs = []
    async for doc in cursor:
        docs.append(serialize_doc(doc))
    return docs

@router.delete("/faq-docs/{id}")
async def delete_admin_faq_doc(id: str, current_user: dict = Depends(require_role(["admin"]))):
    """Admin deletes an old FAQ document and updates FAISS RAG index."""
    from services.rag_kb import rebuild_faiss_index

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")

    res = await db.company_documents.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ document not found")

    all_docs = await db.company_documents.find().to_list(100)
    rebuild_faiss_index(all_docs)
    return {"message": "FAQ document deleted and RAG index updated"}

@router.patch("/users/{user_id}/reset-password")
async def admin_reset_user_password(
    user_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Super Admin resets/modifies the password for any user account (HR or Candidate).
    Updates both 'password' and 'password_hash' keys for backward compatibility.
    """
    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found")

    hashed_pw = hash_password(new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "password": hashed_pw,
            "password_hash": hashed_pw,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "message": f"Password for '{target_user.get('email')}' updated successfully!",
        "user_id": user_id,
        "email": target_user.get("email")
    }
