from datetime import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Policy, PolicyAcknowledgement, Joiner, Task, AuditLog, Notification, User
from app.core.deps import get_current_user, require_roles
from app.services.rag.ingest import ingest_policy_data
from app.services.checklist_engine import recalculate_readiness
from app.services.gcs_storage import list_blobs, download_blob_bytes
from app.config import settings

router = APIRouter(tags=["Policies"])

class AcknowledgeRequest(BaseModel):
    policy_id: str
    signature_statement: Optional[str] = "I have read, understood and agree to abide by this policy."

@router.get("/policies")
def list_policies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Policy).filter(Policy.active == True)
    policies = query.order_by(Policy.code.asc()).all()
    return policies

@router.get("/policies/{id}")
def get_policy(id: str, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.get("/joiners/{joiner_id}/policies")
def get_joiner_policies(joiner_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner not found")
        
    policies = db.query(Policy).filter(Policy.active == True).all()
    acks = db.query(PolicyAcknowledgement).filter(PolicyAcknowledgement.joiner_id == joiner_id).all()
    ack_map = {a.policy_id: a for a in acks}
    
    result = []
    for p in policies:
        # Check audience
        if current_user.role == "EMPLOYEE" and p.audience and "*" not in p.audience and "EMPLOYEE" not in p.audience:
            continue
            
        is_ack = p.id in ack_map
        ack_obj = ack_map.get(p.id)
        
        result.append({
            "id": p.id,
            "code": p.code,
            "title": p.title,
            "version": p.version,
            "category": p.category,
            "content_text": p.content_text,
            "requires_ack": p.requires_ack,
            "status": "Acknowledged" if is_ack else ("Pending" if p.requires_ack else "Optional"),
            "acknowledged_at": ack_obj.acknowledged_at.strftime("%Y-%m-%d %H:%M:%S") if (ack_obj and ack_obj.acknowledged_at) else None,
            "due_date": joiner.joining_date
        })
    return result

@router.post("/joiners/{joiner_id}/acknowledgements")
def acknowledge_policy(joiner_id: str, req: AcknowledgeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner not found")
        
    policy = db.query(Policy).filter(Policy.id == req.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    existing = db.query(PolicyAcknowledgement).filter(
        PolicyAcknowledgement.joiner_id == joiner_id,
        PolicyAcknowledgement.policy_id == req.policy_id
    ).first()
    
    if not existing:
        ack = PolicyAcknowledgement(
            joiner_id=joiner_id,
            policy_id=policy.id,
            policy_version=policy.version,
            signature_statement=req.signature_statement or "I have read, understood and agree to abide by this policy."
        )
        db.add(ack)
        
    # Mark linked tasks in joiner checklist as Completed
    tasks = db.query(Task).filter(Task.joiner_id == joiner_id).all()
    for t in tasks:
        if t.linked_policy_code == policy.code or (policy.code == "SEC-POL-001" and t.rule_code == "SEC-ACK-01") or (t.category == "Compliance" and policy.code in (t.title or "")):
            t.status = "Completed"
            
    # Audit log
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="ACKNOWLEDGE_POLICY",
        entity_type="POLICY",
        entity_id=policy.id,
        joiner_id=joiner_id,
        details={"policy_code": policy.code, "version": policy.version, "policy_title": policy.title}
    )
    db.add(audit)
    db.commit()
    
    recalculate_readiness(db, joiner_id)
    return {"status": "success", "message": f"Policy {policy.title} acknowledged successfully."}

@router.get("/policies/{id}/file")
def get_policy_file(id: str, db: Session = Depends(get_db)):
    """
    Streams policy file directly from Google Cloud Storage (policies/ folder).
    """
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    # Search for matching policy blob in GCS
    blobs = list_blobs(prefix="policies/")
    matching_blob = None
    for b in blobs:
        if policy.code in b["name"]:
            matching_blob = b["name"]
            break
            
    if matching_blob:
        try:
            content = download_blob_bytes(matching_blob)
            media_type = "application/pdf" if matching_blob.endswith(".pdf") else "text/markdown; charset=utf-8"
            filename = os.path.basename(matching_blob)
            return Response(
                content=content,
                media_type=media_type,
                headers={"Content-Disposition": f'inline; filename="{filename}"'}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read policy from GCS: {e}")
            
    raise HTTPException(status_code=404, detail=f"No file found in Google Cloud Storage for policy code {policy.code}")

@router.get("/policies/file/{filename}")
def stream_policy_blob(filename: str):
    """
    Streams any policy document by filename directly from GCS policies/ prefix.
    """
    blob_path = f"policies/{filename}"
    try:
        content = download_blob_bytes(blob_path)
        media_type = "application/pdf" if filename.endswith(".pdf") else "text/markdown; charset=utf-8"
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Policy file {filename} not found in GCS: {e}")

