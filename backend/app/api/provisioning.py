from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import ProvisioningRequest, Joiner, Task, ITCatalogue, AuditLog, Notification, User
from app.core.deps import get_current_user, require_roles
from app.services.checklist_engine import recalculate_readiness

router = APIRouter(tags=["IT Provisioning"])

class FulfilmentUpdateRequest(BaseModel):
    status: Optional[str] = None  # Waiting, Requested, In Progress, Needs Info, Fulfilled, Rejected
    asset_tag: Optional[str] = None
    serial: Optional[str] = None
    email_created: Optional[str] = None
    it_notes: Optional[str] = None

@router.get("/provisioning")
def list_provisioning_requests(
    kind: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    joiner_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ProvisioningRequest)
    if joiner_id:
        query = query.filter(ProvisioningRequest.joiner_id == joiner_id)
    elif current_user.role == "EMPLOYEE" and current_user.joiner_id:
        query = query.filter(ProvisioningRequest.joiner_id == current_user.joiner_id)
        
    if kind and kind != "All":
        query = query.filter(ProvisioningRequest.kind == kind)
    if status_filter and status_filter != "All":
        query = query.filter(ProvisioningRequest.status == status_filter)
        
    requests = query.order_by(ProvisioningRequest.due_date.asc()).all()
    
    # Enrich with joiner info
    result = []
    for r in requests:
        joiner = db.query(Joiner).filter(Joiner.id == r.joiner_id).first()
        result.append({
            "id": r.id,
            "joiner_id": r.joiner_id,
            "joiner_name": joiner.full_name if joiner else "Unknown",
            "joiner_role": joiner.role if joiner else "Unknown",
            "joiner_department": joiner.department if joiner else "Unknown",
            "joiner_location": joiner.location if joiner else "Unknown",
            "joining_date": joiner.joining_date if joiner else "Unknown",
            "kind": r.kind,
            "item_name": r.item_name,
            "status": r.status,
            "due_date": r.due_date,
            "dependencies_met": r.dependencies_met,
            "blocked_reason": r.blocked_reason,
            "payload": r.payload,
            "fulfilment_details": r.fulfilment_details,
            "assignee": r.assignee,
            "it_notes": r.it_notes if current_user.role != "EMPLOYEE" else None,
            "fulfilled_at": r.fulfilled_at
        })
    return result

@router.get("/provisioning/{id}")
def get_provisioning_request(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(ProvisioningRequest).filter(ProvisioningRequest.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Request not found")
        
    joiner = db.query(Joiner).filter(Joiner.id == r.joiner_id).first()
    tasks = db.query(Task).filter(Task.joiner_id == r.joiner_id).all()
    
    # Upstream items
    hr_task = next((t for t in tasks if t.rule_code == "HR-REC-01"), None)
    sec_task = next((t for t in tasks if t.rule_code == "SEC-ACK-01"), None)
    bgv_task = next((t for t in tasks if t.rule_code == "BGV-CHK-01"), None)
    
    upstream_chain = [
        {"name": "Core HR Record", "status": hr_task.status if hr_task else "Pending"},
        {"name": "Information Security Acknowledgement", "status": sec_task.status if sec_task else "Pending"},
        {"name": "Background Verification Clearance", "status": bgv_task.status if bgv_task else "Pending"}
    ]
    
    return {
        "id": r.id,
        "joiner_id": r.joiner_id,
        "joiner_name": joiner.full_name if joiner else "Unknown",
        "joiner_role": joiner.role if joiner else "Unknown",
        "joiner_department": joiner.department if joiner else "Unknown",
        "joiner_location": joiner.location if joiner else "Unknown",
        "joining_date": joiner.joining_date if joiner else "Unknown",
        "kind": r.kind,
        "item_name": r.item_name,
        "status": r.status,
        "due_date": r.due_date,
        "dependencies_met": r.dependencies_met,
        "blocked_reason": r.blocked_reason,
        "payload": r.payload,
        "fulfilment_details": r.fulfilment_details,
        "assignee": r.assignee,
        "it_notes": r.it_notes if current_user.role != "EMPLOYEE" else None,
        "fulfilled_at": r.fulfilled_at,
        "upstream_chain": upstream_chain
    }

@router.patch("/provisioning/{id}")
def update_provisioning_request(
    id: str,
    req: FulfilmentUpdateRequest,
    current_user: User = Depends(require_roles(["IT_ADMIN", "SYSTEM_ADMIN"])),
    db: Session = Depends(get_db)
):
    r = db.query(ProvisioningRequest).filter(ProvisioningRequest.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Request not found")
        
    joiner = db.query(Joiner).filter(Joiner.id == r.joiner_id).first()
    
    if req.status:
        r.status = req.status
    if req.it_notes:
        r.it_notes = req.it_notes
        
    fulfilment = r.fulfilment_details or {}
    if req.asset_tag:
        fulfilment["asset_tag"] = req.asset_tag
    if req.serial:
        fulfilment["serial"] = req.serial
    if req.email_created:
        fulfilment["email_created"] = req.email_created
    r.fulfilment_details = fulfilment
    
    # If fulfilled, mark linked task completed
    if req.status == "Fulfilled":
        r.fulfilled_at = datetime.utcnow()
        if r.kind == "LAPTOP":
            t = db.query(Task).filter(Task.joiner_id == r.joiner_id, Task.rule_code == "IT-PROV-LAPTOP").first()
            if t:
                t.status = "Completed"
        elif r.kind == "EMAIL":
            t = db.query(Task).filter(Task.joiner_id == r.joiner_id, Task.rule_code == "IT-PROV-EMAIL").first()
            if t:
                t.status = "Completed"
        elif r.kind == "ACCESS":
            t = db.query(Task).filter(Task.joiner_id == r.joiner_id, Task.rule_code == "IT-PROV-ACCESS").first()
            if t:
                t.status = "Completed"
                
        notif = Notification(
            user_email=joiner.email,
            title=f"IT {r.kind.capitalize()} Provisioned",
            message=f"Your {r.item_name} has been fulfilled and is ready.",
            type="success",
            related_joiner_id=joiner.id
        )
        db.add(notif)
        
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="UPDATE_PROVISIONING",
        entity_type="PROVISIONING",
        entity_id=r.id,
        joiner_id=r.joiner_id,
        details={"status": r.status, "fulfilment": r.fulfilment_details}
    )
    db.add(audit)
    db.commit()
    
    recalculate_readiness(db, r.joiner_id)
    return {"status": "success", "request": r}

@router.get("/it/summary")
def get_it_summary(db: Session = Depends(get_db)):
    requests = db.query(ProvisioningRequest).all()
    ready = sum(1 for r in requests if r.status == "Requested" and r.dependencies_met)
    waiting = sum(1 for r in requests if r.status == "Waiting" or not r.dependencies_met)
    in_progress = sum(1 for r in requests if r.status == "In Progress")
    fulfilled = sum(1 for r in requests if r.status == "Fulfilled")
    overdue = sum(1 for r in requests if r.status in ["Requested", "In Progress"] and r.due_date < datetime.utcnow().strftime("%Y-%m-%d"))
    
    return {
        "ready_to_fulfill": ready,
        "waiting_on_dependencies": waiting,
        "in_progress": in_progress,
        "fulfilled_this_week": fulfilled,
        "overdue": overdue
    }

@router.get("/it/catalogue")
def get_it_catalogue(db: Session = Depends(get_db)):
    return db.query(ITCatalogue).filter(ITCatalogue.active == True).all()

@router.get("/it/calendar")
def get_it_calendar(db: Session = Depends(get_db)):
    joiners = db.query(Joiner).order_by(Joiner.joining_date.asc()).all()
    events = []
    for j in joiners:
        provs = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == j.id).all()
        fulfilled = sum(1 for p in provs if p.status == "Fulfilled")
        total = len(provs)
        events.append({
            "joiner_id": j.id,
            "joiner_name": j.full_name,
            "role": j.role,
            "location": j.location,
            "joining_date": j.joining_date,
            "it_readiness_pct": int((fulfilled / total) * 100) if total > 0 else 0,
            "items_count": total,
            "fulfilled_count": fulfilled
        })
    return events

