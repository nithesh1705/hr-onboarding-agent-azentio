from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Document, Joiner, User, AuditLog
from app.core.deps import get_current_user, require_roles

router = APIRouter(tags=["Document Reviews"])

@router.get("/reviews")
def list_review_queue(
    doc_type: Optional[str] = None,
    flag: Optional[str] = None,  # mismatch, expiry, legibility
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_roles(["HR_REVIEWER", "HR_ADMIN", "SYSTEM_ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    
    if status_filter and status_filter != "All":
        query = query.filter(Document.status == status_filter)
    else:
        query = query.filter(Document.status.in_(["Submitted", "Under Review", "Correction Requested"]))
        
    if doc_type and doc_type != "All":
        query = query.filter(Document.doc_type == doc_type)
        
    docs = query.order_by(Document.updated_at.desc()).all()
    
    result = []
    for d in docs:
        joiner = db.query(Joiner).filter(Joiner.id == d.joiner_id).first()
        has_mismatch = bool(d.mismatches)
        has_expiry_issue = any(m.get("field") == "Document Expiry" for m in (d.mismatches or []))
        
        if flag == "mismatch" and not has_mismatch:
            continue
        if flag == "expiry" and not has_expiry_issue:
            continue
            
        result.append({
            "id": d.id,
            "joiner_id": d.joiner_id,
            "joiner_name": joiner.full_name if joiner else "Unknown",
            "joiner_role": joiner.role if joiner else "Unknown",
            "joiner_location": joiner.location if joiner else "Unknown",
            "joining_date": joiner.joining_date if joiner else "Unknown",
            "doc_type": d.doc_type,
            "title": d.title,
            "status": d.status,
            "file_name": d.file_name,
            "file_url": d.file_url,
            "version": d.version,
            "has_mismatch": has_mismatch,
            "mismatches": d.mismatches,
            "extracted_values": d.extracted_values,
            "assigned_reviewer_id": d.assigned_reviewer_id,
            "claimed_at": d.claimed_at,
            "rejection_reason": d.rejection_reason,
            "employee_message": d.employee_message,
            "reviewer_remarks": d.reviewer_remarks,
            "due_date": d.due_date,
            "updated_at": d.updated_at
        })
    return result

@router.get("/review/summary")
def get_review_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    
    waiting = sum(1 for d in docs if d.status in ["Submitted", "Under Review"])
    assigned_to_me = sum(1 for d in docs if d.assigned_reviewer_id == current_user.id and d.status in ["Submitted", "Under Review"])
    mismatch_count = sum(1 for d in docs if bool(d.mismatches) and d.status in ["Submitted", "Under Review"])
    reviewed_today = sum(1 for d in docs if d.verified_at and d.verified_at.date() == datetime.utcnow().date())
    
    return {
        "waiting_for_review": waiting,
        "assigned_to_me": assigned_to_me,
        "flagged_with_mismatch": mismatch_count,
        "reviewed_today": reviewed_today
    }

@router.get("/review/history")
def get_review_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audits = db.query(AuditLog).filter(AuditLog.action == "REVIEW_DOCUMENT").order_by(AuditLog.created_at.desc()).limit(50).all()
    res = []
    for a in audits:
        doc = db.query(Document).filter(Document.id == a.entity_id).first()
        joiner = db.query(Joiner).filter(Joiner.id == a.joiner_id).first()
        res.append({
            "id": a.id,
            "doc_title": doc.title if doc else "Document",
            "joiner_name": joiner.full_name if joiner else "Joiner",
            "decision": a.details.get("decision"),
            "reason": a.details.get("reason"),
            "remarks": a.details.get("remarks"),
            "reviewer": a.actor_name,
            "timestamp": a.created_at
        })
    return res

