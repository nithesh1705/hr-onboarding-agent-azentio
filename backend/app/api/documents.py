import os
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Document, DocumentHistory, Joiner, Task, AuditLog, Notification, User, DepartmentOwner
from app.core.deps import get_current_user, require_roles
from app.services.doc_extraction import extract_and_validate_document
from app.services.checklist_engine import recalculate_readiness
from app.services.elastic_email import send_elastic_connector_email
from app.services.gcs_storage import (
    upload_blob_bytes,
    download_blob_bytes,
    list_blobs,
    get_joiner_doc_blob_path
)
from app.config import settings

router = APIRouter(tags=["Documents"])

class ReviewDecisionRequest(BaseModel):
    decision: str  # ACCEPT, CORRECTION_REQUESTED, ESCALATE
    reason: Optional[str] = None  # Illegible, Expired, Name mismatch, Wrong document, Incomplete, Other
    employee_message: Optional[str] = None
    reviewer_remarks: Optional[str] = None

class EditExtractedRequest(BaseModel):
    extracted_values: Dict[str, Any]

@router.get("/joiners/{joiner_id}/documents")
def get_joiner_documents(joiner_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "EMPLOYEE" and current_user.joiner_id and current_user.joiner_id != joiner_id:
        raise HTTPException(status_code=403, detail="Employees may only access their own documents.")
        
    docs = db.query(Document).filter(Document.joiner_id == joiner_id).order_by(Document.created_at.desc()).all()
    
    # Hide internal reviewer remarks from employees
    res = []
    for d in docs:
        doc_dict = {
            "id": d.id,
            "joiner_id": d.joiner_id,
            "doc_type": d.doc_type,
            "title": d.title,
            "required_rule_code": d.required_rule_code,
            "status": d.status,
            "file_url": d.file_url,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "version": d.version,
            "rejection_reason": d.rejection_reason,
            "employee_message": d.employee_message,
            "extracted_values": d.extracted_values,
            "mismatches": d.mismatches,
            "due_date": d.due_date,
            "verified_at": d.verified_at,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        }
        if current_user.role != "EMPLOYEE":
            doc_dict["reviewer_remarks"] = d.reviewer_remarks
            doc_dict["assigned_reviewer_id"] = d.assigned_reviewer_id
        res.append(doc_dict)
    return res

@router.get("/documents/{doc_id}")
def get_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Document).filter(Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
        
    joiner = db.query(Joiner).filter(Joiner.id == d.joiner_id).first()
    history = db.query(DocumentHistory).filter(DocumentHistory.document_id == doc_id).order_by(DocumentHistory.version.desc()).all()
    
    doc_dict = {
        "id": d.id,
        "joiner_id": d.joiner_id,
        "joiner_name": joiner.full_name if joiner else "Unknown",
        "joiner_role": joiner.role if joiner else "Unknown",
        "joiner_location": joiner.location if joiner else "Unknown",
        "joining_date": joiner.joining_date if joiner else "Unknown",
        "doc_type": d.doc_type,
        "title": d.title,
        "required_rule_code": d.required_rule_code,
        "status": d.status,
        "file_url": d.file_url,
        "file_name": d.file_name,
        "file_size": d.file_size,
        "mime_type": d.mime_type,
        "version": d.version,
        "rejection_reason": d.rejection_reason,
        "employee_message": d.employee_message,
        "extracted_values": d.extracted_values,
        "mismatches": d.mismatches,
        "due_date": d.due_date,
        "verified_at": d.verified_at,
        "history": [
            {
                "version": h.version,
                "file_name": h.file_name,
                "status": h.status,
                "rejection_reason": h.rejection_reason,
                "created_at": h.created_at
            }
            for h in history
        ]
    }
    if current_user.role != "EMPLOYEE":
        doc_dict["reviewer_remarks"] = d.reviewer_remarks
        doc_dict["assigned_reviewer_id"] = d.assigned_reviewer_id
        
    return doc_dict

def generate_sample_pdf(title: str, joiner_name: str, doc_type: str) -> bytes:
    clean_title = title.replace("(", "").replace(")", "")
    clean_name = joiner_name.replace("(", "").replace(")", "")
    stream_text = f"BT /F1 16 Tf 50 720 Td (OFFICIAL RECORD - {doc_type}) Tj 0 -35 Td /F1 12 Tf (Name: {clean_name}) Tj 0 -25 Td (Type: {clean_title}) Tj 0 -25 Td (Storage: Google Cloud Storage Secured) Tj ET"
    stream_len = len(stream_text)
    pdf = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length {stream_len}>>stream
{stream_text}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000210 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
450
%%EOF"""
    return pdf.encode("latin1", errors="ignore")

@router.get("/documents/{doc_id}/file")
def get_document_file(
    doc_id: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Streams the document file directly from Google Cloud Storage.
    Accessible inline by the FileViewer iframe and preview tags.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    blob_path = None
    if isinstance(doc.extracted_values, dict):
        blob_path = doc.extracted_values.get("_gcs_blob_path")
        
    if not blob_path and doc.file_name:
        prefix = f"joiners/{doc.joiner_id}/documents/{doc.doc_type}"
        blobs = list_blobs(prefix=prefix)
        if blobs:
            blob_path = blobs[-1]["name"]
            
    # Try downloading from GCS
    if blob_path:
        try:
            content_bytes = download_blob_bytes(blob_path)
            media_type = doc.mime_type or "application/pdf"
            return Response(
                content=content_bytes,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'inline; filename="{doc.file_name or "document.pdf"}"',
                    "Cache-Control": "public, max-age=3600"
                }
            )
        except Exception:
            pass
            
    # Check local uploads directory fallback
    if doc.file_name:
        local_safe = f"{doc.joiner_id}_{doc.doc_type}_{doc.file_name}"
        local_path = os.path.join(settings.UPLOAD_DIR, local_safe)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return Response(
                    content=f.read(),
                    media_type=doc.mime_type or "application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{doc.file_name}"'}
                )
                
    # Return placeholder sample PDF for preview
    joiner = db.query(Joiner).filter(Joiner.id == doc.joiner_id).first()
    joiner_name = joiner.full_name if joiner else "New Joiner"
    placeholder_pdf = generate_sample_pdf(doc.title, joiner_name, doc.doc_type)
    return Response(
        content=placeholder_pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.doc_type}_sample.pdf"'}
    )

@router.get("/storage/tree")
def get_storage_tree(current_user: User = Depends(get_current_user)):
    """
    Returns the Google Cloud Storage hierarchy and file inventory.
    """
    try:
        blobs = list_blobs()
        return {
            "bucket": settings.GCS_BUCKET_NAME,
            "project": settings.GCP_PROJECT_ID,
            "total_objects": len(blobs),
            "folders": {
                "policies": [b for b in blobs if b["name"].startswith("policies/")],
                "joiners": [b for b in blobs if b["name"].startswith("joiners/")],
                "templates": [b for b in blobs if b["name"].startswith("templates/")]
            }
        }
    except Exception as e:
        return {"bucket": settings.GCS_BUCKET_NAME, "error": str(e), "total_objects": 0, "folders": {}}

@router.post("/joiners/{joiner_id}/documents")
async def upload_document(
    joiner_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner not found")
        
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Save file to Google Cloud Storage with structured hierarchy
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    clean_filename = file.filename.replace(" ", "_")
    safe_name = f"{timestamp}_{clean_filename}"
    blob_path = get_joiner_doc_blob_path(joiner_id=joiner_id, doc_type=doc_type, safe_filename=safe_name)
    
    try:
        upload_blob_bytes(
            blob_path=blob_path,
            data=content,
            content_type=file.content_type or "application/octet-stream"
        )
    except Exception as gcs_err:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        local_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        with open(local_path, "wb") as f:
            f.write(content)
            
    # Run Extraction & Side-by-side Validation against profile
    validation = extract_and_validate_document(
        file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        doc_type=doc_type,
        joiner_profile={
            "full_name": joiner.full_name,
            "joining_date": joiner.joining_date,
            "location": joiner.location,
            "role": joiner.role
        },
        file_bytes=content
    )
    
    # Find existing or create new Document
    doc = db.query(Document).filter(Document.joiner_id == joiner_id, Document.doc_type == doc_type).first()
    if not doc:
        doc = Document(
            joiner_id=joiner_id,
            doc_type=doc_type,
            title=f"{doc_type} Document",
            required_rule_code="DOC-ID-01" if doc_type == "IDENTITY" else "DOC-EDU-01",
            due_date=joiner.joining_date
        )
        db.add(doc)
        db.flush()
        
    # Save previous version to history
    if doc.file_url:
        hist = DocumentHistory(
            document_id=doc.id,
            version=doc.version,
            file_url=doc.file_url,
            file_name=doc.file_name,
            status=doc.status,
            rejection_reason=doc.rejection_reason
        )
        db.add(hist)
        doc.version = doc.version + 1
        
    doc.file_url = f"/api/v1/documents/{doc.id}/file"
    doc.file_name = file.filename
    doc.file_size = file_size
    doc.mime_type = file.content_type or "application/pdf"
    doc.status = validation["status"]
    doc.rejection_reason = validation.get("reason")
    doc.employee_message = validation.get("employee_message")
    
    extracted_vals = validation.get("extracted_values", {})
    extracted_vals["_gcs_blob_path"] = blob_path
    extracted_vals["_gcs_bucket"] = settings.GCS_BUCKET_NAME
    doc.extracted_values = extracted_vals
    doc.mismatches = validation.get("mismatches", [])
    doc.updated_at = datetime.utcnow()
    
    # Audit log
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="UPLOAD_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=doc.id,
        joiner_id=joiner_id,
        details={
            "doc_type": doc_type,
            "filename": file.filename,
            "status": doc.status,
            "mismatches_count": len(doc.mismatches)
        }
    )
    db.add(audit)
    
    # Notification if correction requested
    if doc.status == "Correction Requested":
        notif = Notification(
            user_email=joiner.email,
            title="Document Correction Requested",
            message=doc.employee_message or "Please review and re-upload your document.",
            type="warning",
            related_joiner_id=joiner.id,
            related_item_id=doc.id
        )
        db.add(notif)
        
    db.commit()
    recalculate_readiness(db, joiner_id)

    # Dispatch email notification to appropriate Reviewer
    try:
        reviewer_email = None
        reviewer_name = "Reviewer"

        # 1. Assigned reviewer on doc
        if doc.assigned_reviewer_id:
            rev_user = db.query(User).filter(User.id == doc.assigned_reviewer_id).first()
            if rev_user and rev_user.email:
                reviewer_email = rev_user.email
                reviewer_name = rev_user.name

        # 2. Department Owner for HR / Compliance
        if not reviewer_email and joiner.department:
            dept_owner = db.query(DepartmentOwner).filter(
                DepartmentOwner.department == joiner.department,
                DepartmentOwner.function_name.in_(["HR", "Compliance"])
            ).first()
            if dept_owner and dept_owner.owner_email:
                reviewer_email = dept_owner.owner_email
                reviewer_name = dept_owner.owner_name

        # 3. Any active HR_REVIEWER in User table
        if not reviewer_email:
            rev_user = db.query(User).filter(User.role == "HR_REVIEWER").first()
            if rev_user and rev_user.email:
                reviewer_email = rev_user.email
                reviewer_name = rev_user.name

        # 4. Fallback default reviewer
        if not reviewer_email:
            reviewer_email = "hr.reviewer@company.com"

        email_subject = f"[Review Ready] Document Uploaded: {doc.title} - {joiner.full_name}"
        email_message = f"""Dear {reviewer_name},

A new onboarding document has been submitted and is ready for your verification.

Candidate Details:
• Name: {joiner.full_name}
• Email: {joiner.email}
• Department: {joiner.department}
• Role: {joiner.role}
• Joining Date: {joiner.joining_date}

Document Submission:
• Document Type: {doc.doc_type} ({doc.title})
• File Name: {file.filename} ({round(file_size / 1024, 1)} KB)
• Status: {doc.status}
• Mismatches Detected: {len(doc.mismatches or [])}

Action Required:
Please log in to the Reviewer Workspace to inspect the extracted data and make a determination:
https://hr-onboarding-frontend-621277707617.us-east1.run.app/review/workspace/{doc.id}

Best regards,
Automated HR Onboarding System
Aurelia Technologies"""

        send_elastic_connector_email(
            to_email=reviewer_email,
            subject=email_subject,
            message=email_message
        )
    except Exception as email_err:
        print(f"Warning: Reviewer email dispatch encountered an issue: {email_err}")

    return {
        "status": "success",
        "document_status": doc.status,
        "message": doc.employee_message,
        "extracted_values": doc.extracted_values,
        "mismatches": doc.mismatches,
        "document": doc
    }

@router.post("/documents/{doc_id}/review")
def review_document(
    doc_id: str,
    req: ReviewDecisionRequest,
    current_user: User = Depends(require_roles(["HR_REVIEWER", "HR_ADMIN", "SYSTEM_ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Scenario 1: Reviewer workspace decision.
    Accepts, requests correction, or escalates with remarks.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    joiner = db.query(Joiner).filter(Joiner.id == doc.joiner_id).first()
    
    if req.decision == "ACCEPT":
        doc.status = "Accepted"
        doc.verified_at = datetime.utcnow()
        doc.rejection_reason = None
        doc.employee_message = "Document verified and accepted."
        doc.reviewer_remarks = req.reviewer_remarks
        
        # If this is Identity doc, mark task DOC-ID-01 completed
        if doc.doc_type == "IDENTITY":
            task = db.query(Task).filter(Task.joiner_id == doc.joiner_id, Task.rule_code == "DOC-ID-01").first()
            if task:
                task.status = "Completed"
                
        # Notification
        notif = Notification(
            user_email=joiner.email,
            title="Document Accepted",
            message=f"Your {doc.title} has been verified and accepted.",
            type="success",
            related_joiner_id=joiner.id,
            related_item_id=doc.id
        )
        db.add(notif)
        
    elif req.decision == "CORRECTION_REQUESTED":
        if not req.reason or not req.employee_message:
            raise HTTPException(status_code=400, detail="Reason and employee-facing message are mandatory for correction requests.")
            
        doc.status = "Correction Requested"
        doc.rejection_reason = req.reason
        doc.employee_message = req.employee_message
        doc.reviewer_remarks = req.reviewer_remarks
        
        notif = Notification(
            user_email=joiner.email,
            title="Document Correction Required",
            message=req.employee_message,
            type="warning",
            related_joiner_id=joiner.id,
            related_item_id=doc.id
        )
        db.add(notif)
        
    elif req.decision == "ESCALATE":
        doc.reviewer_remarks = f"ESCALATED to HR Admin: {req.reviewer_remarks}"
        notif = Notification(
            user_email="hr.admin@company.com",
            title="Document Review Escalated",
            message=f"Reviewer {current_user.name} escalated document {doc.title} for {joiner.full_name}: {req.reviewer_remarks}",
            type="action_required",
            related_joiner_id=joiner.id,
            related_item_id=doc.id
        )
        db.add(notif)
        
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="REVIEW_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=doc.id,
        joiner_id=doc.joiner_id,
        details={
            "decision": req.decision,
            "reason": req.reason,
            "remarks": req.reviewer_remarks
        }
    )
    db.add(audit)
    db.commit()
    
    recalculate_readiness(db, doc.joiner_id)
    return {"status": "success", "decision": req.decision, "document": doc}

@router.post("/documents/{doc_id}/claim")
def claim_document(doc_id: str, current_user: User = Depends(require_roles(["HR_REVIEWER", "HR_ADMIN"])), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.assigned_reviewer_id = current_user.id
    doc.claimed_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": f"Document claimed by {current_user.name}."}

@router.patch("/documents/{doc_id}/extracted")
def edit_extracted_values(doc_id: str, req: EditExtractedRequest, current_user: User = Depends(require_roles(["HR_REVIEWER", "HR_ADMIN"])), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.extracted_values = req.extracted_values
    db.commit()
    return {"status": "success", "extracted_values": doc.extracted_values}

