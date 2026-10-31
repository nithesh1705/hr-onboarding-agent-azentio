from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import DepartmentOwner, Task, Joiner, Nudge, Notification, AuditLog, RequirementRule, User
from app.core.deps import get_current_user, require_roles

router = APIRouter(tags=["Owners, Escalations & Rules"])

class OwnerCreateRequest(BaseModel):
    function_name: str
    department: str
    owner_name: str
    owner_email: EmailStr
    backup_owner_name: Optional[str] = None
    backup_owner_email: Optional[EmailStr] = None
    dept_head_name: Optional[str] = None
    dept_head_email: Optional[EmailStr] = None

class EscalationActionRequest(BaseModel):
    action: str  # NUDGE, REASSIGN, ESCALATE_NOW, SNOOZE, RESOLVE
    new_owner_name: Optional[str] = None
    new_owner_email: Optional[str] = None
    note: Optional[str] = None

class NudgeCreateRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str
    joiner_id: Optional[str] = None
    task_id: Optional[str] = None
    body: str
    channel: str = "in-app"

@router.get("/owners")
def list_owners(db: Session = Depends(get_db)):
    return db.query(DepartmentOwner).all()

@router.post("/owners")
def add_owner(req: OwnerCreateRequest, current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    owner = DepartmentOwner(
        function_name=req.function_name,
        department=req.department,
        owner_name=req.owner_name,
        owner_email=req.owner_email,
        backup_owner_name=req.backup_owner_name,
        backup_owner_email=req.backup_owner_email,
        dept_head_name=req.dept_head_name,
        dept_head_email=req.dept_head_email
    )
    db.add(owner)
    db.commit()
    return {"status": "success", "owner": owner}

@router.get("/escalations")
def list_escalations(
    function_name: Optional[str] = Query(None, alias="function"),
    db: Session = Depends(get_db)
):
    """
    Returns tasks that are overdue or blocked for downstream items.
    """
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    tasks = db.query(Task).filter(Task.status.in_(["Overdue", "Blocked", "Pending"])).all()
    
    escalations = []
    for t in tasks:
        joiner = db.query(Joiner).filter(Joiner.id == t.joiner_id).first()
        is_overdue = t.due_date < today_str and t.status != "Completed"
        
        # Check downstream blocked count
        downstream_count = db.query(Task).filter(Task.blocked_by_task_ids.contains([t.id])).count()
        
        level = 1
        if is_overdue:
            level = 2
        if downstream_count >= 2:
            level = 3
            
        if function_name and function_name != "All" and t.owner_function != function_name:
            continue
            
        escalations.append({
            "task_id": t.id,
            "title": t.title,
            "category": t.category,
            "joiner_id": t.joiner_id,
            "joiner_name": joiner.full_name if joiner else "Unknown",
            "joiner_department": joiner.department if joiner else "Unknown",
            "owner_function": t.owner_function,
            "owner_name": t.owner_name,
            "owner_email": t.owner_email,
            "due_date": t.due_date,
            "status": "Overdue" if is_overdue else t.status,
            "escalation_level": level,
            "downstream_blocked_count": downstream_count
        })
        
    return sorted(escalations, key=lambda x: x["escalation_level"], reverse=True)

@router.post("/escalations/{task_id}/action")
def escalation_action(task_id: str, req: EscalationActionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if req.action == "NUDGE":
        nudge = Nudge(
            sender_id=current_user.id,
            recipient_email=task.owner_email,
            recipient_name=task.owner_name,
            joiner_id=task.joiner_id,
            task_id=task.id,
            body=req.note or f"Reminder: Task '{task.title}' is pending or overdue.",
            channel="in-app"
        )
        db.add(nudge)
        
    elif req.action == "REASSIGN":
        if req.new_owner_name:
            task.owner_name = req.new_owner_name
        if req.new_owner_email:
            task.owner_email = req.new_owner_email
            
    elif req.action == "RESOLVE":
        task.status = "Completed"
        
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action=f"ESCALATION_{req.action}",
        entity_type="TASK",
        entity_id=task.id,
        joiner_id=task.joiner_id,
        details={"action": req.action, "note": req.note}
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "action": req.action}

@router.get("/rules")
def list_rules(db: Session = Depends(get_db)):
    return db.query(RequirementRule).filter(RequirementRule.active == True).all()

@router.post("/nudges")
def send_nudge(req: NudgeCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    nudge = Nudge(
        sender_id=current_user.id,
        recipient_email=req.recipient_email,
        recipient_name=req.recipient_name,
        joiner_id=req.joiner_id,
        task_id=req.task_id,
        body=req.body,
        channel=req.channel
    )
    db.add(nudge)
    
    # In-app notification
    notif = Notification(
        user_email=req.recipient_email,
        title="Onboarding Action Reminder",
        message=req.body,
        type="action_required",
        related_joiner_id=req.joiner_id,
        related_item_id=req.task_id
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "nudge": nudge}

@router.get("/nudges")
def list_nudges(db: Session = Depends(get_db)):
    return db.query(Nudge).order_by(Nudge.sent_at.desc()).limit(30).all()

