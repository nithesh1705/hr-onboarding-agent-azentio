from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Task, Joiner, AuditLog, User
from app.core.deps import get_current_user
from app.services.checklist_engine import recalculate_readiness

router = APIRouter(tags=["Tasks"])

class TaskUpdateRequest(BaseModel):
    status: Optional[str] = None  # Pending, In Progress, Blocked, Completed, Overdue, Cancelled
    due_date: Optional[str] = None
    override_reason: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None

class ManualTaskCreateRequest(BaseModel):
    title: str
    category: str = "Manual Task"
    owner_function: str = "HR"
    owner_name: str
    owner_email: str
    due_date: str
    is_blocking: bool = False
    why_explanation: str

@router.get("/tasks")
def list_tasks(
    joiner_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    owner_function: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if joiner_id:
        query = query.filter(Task.joiner_id == joiner_id)
    elif current_user.role == "EMPLOYEE":
        if current_user.joiner_id:
            query = query.filter(Task.joiner_id == current_user.joiner_id)
            
    if status_filter and status_filter != "All":
        query = query.filter(Task.status == status_filter)
    if category and category != "All":
        query = query.filter(Task.category == category)
    if owner_function and owner_function != "All":
        query = query.filter(Task.owner_function == owner_function)
        
    return query.order_by(Task.due_date.asc()).all()

@router.get("/joiners/{joiner_id}/tasks")
def get_joiner_tasks(joiner_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "EMPLOYEE" and current_user.joiner_id and current_user.joiner_id != joiner_id:
        raise HTTPException(status_code=403, detail="Employees may only access their own tasks.")
        
    tasks = db.query(Task).filter(Task.joiner_id == joiner_id).order_by(Task.due_date.asc()).all()
    
    # Enrich with blocker titles
    all_task_map = {t.id: t for t in tasks}
    result = []
    for t in tasks:
        blockers = []
        if t.blocked_by_task_ids:
            for bid in t.blocked_by_task_ids:
                if bid in all_task_map:
                    bt = all_task_map[bid]
                    blockers.append({
                        "id": bt.id,
                        "title": bt.title,
                        "status": bt.status,
                        "owner": bt.owner_name
                    })
        result.append({
            "id": t.id,
            "joiner_id": t.joiner_id,
            "rule_code": t.rule_code,
            "title": t.title,
            "category": t.category,
            "owner_function": t.owner_function,
            "owner_name": t.owner_name,
            "owner_email": t.owner_email,
            "due_date": t.due_date,
            "original_due_date": t.original_due_date,
            "status": t.status,
            "is_blocking": t.is_blocking,
            "blocked_by": blockers,
            "why_explanation": t.why_explanation,
            "is_manual": t.is_manual,
            "override_reason": t.override_reason
        })
    return result

@router.get("/tasks/{task_id}/explain")
def explain_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    joiner = db.query(Joiner).filter(Joiner.id == task.joiner_id).first()
    
    # Upstream blockers
    blockers = []
    if task.blocked_by_task_ids:
        b_tasks = db.query(Task).filter(Task.id.in_(task.blocked_by_task_ids)).all()
        blockers = [{"id": b.id, "title": b.title, "owner": b.owner_name, "status": b.status} for b in b_tasks]
        
    # Downstream dependents (tasks blocked by this task)
    all_tasks = db.query(Task).filter(Task.joiner_id == task.joiner_id).all()
    dependents = []
    for ot in all_tasks:
        if ot.blocked_by_task_ids and task.id in ot.blocked_by_task_ids:
            dependents.append({"id": ot.id, "title": ot.title, "owner": ot.owner_name, "status": ot.status})
            
    return {
        "task_id": task.id,
        "title": task.title,
        "rule_code": task.rule_code,
        "category": task.category,
        "explanation": task.why_explanation,
        "due_date_logic": f"Targeted due date is {task.due_date} (relative to joining date {joiner.joining_date if joiner else 'N/A'}).",
        "owner": f"{task.owner_name} ({task.owner_function})",
        "is_blocking": task.is_blocking,
        "status": task.status,
        "blocked_by": blockers,
        "blocks_downstream": dependents
    }

@router.patch("/tasks/{task_id}")
def update_task(task_id: str, req: TaskUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    old_status = task.status
    if req.status:
        task.status = req.status
    if req.due_date:
        task.due_date = req.due_date
    if req.override_reason:
        task.override_reason = req.override_reason
    if req.owner_name:
        task.owner_name = req.owner_name
    if req.owner_email:
        task.owner_email = req.owner_email
        
    # If completed, check downstream tasks and unblock them if all blockers completed!
    if req.status == "Completed":
        downstream = db.query(Task).filter(Task.joiner_id == task.joiner_id).all()
        for dt in downstream:
            if dt.blocked_by_task_ids and task.id in dt.blocked_by_task_ids:
                # Check if all other blockers are completed
                other_blockers = [bid for bid in dt.blocked_by_task_ids if bid != task.id]
                other_done = True
                if other_blockers:
                    unfinshed = db.query(Task).filter(Task.id.in_(other_blockers), Task.status != "Completed").count()
                    if unfinshed > 0:
                        other_done = False
                if other_done and dt.status == "Blocked":
                    dt.status = "Pending"
                    
    # Audit log
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="UPDATE_TASK",
        entity_type="TASK",
        entity_id=task.id,
        joiner_id=task.joiner_id,
        details={"old_status": old_status, "new_status": task.status, "reason": req.override_reason}
    )
    db.add(audit)
    db.commit()
    
    recalculate_readiness(db, task.joiner_id)
    return {"status": "success", "task": task}

@router.post("/joiners/{joiner_id}/tasks/manual")
def add_manual_task(joiner_id: str, req: ManualTaskCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(
        joiner_id=joiner_id,
        rule_code="MANUAL-TASK",
        title=req.title,
        category=req.category,
        owner_function=req.owner_function,
        owner_name=req.owner_name,
        owner_email=req.owner_email,
        due_date=req.due_date,
        original_due_date=req.due_date,
        status="Pending",
        is_blocking=req.is_blocking,
        blocked_by_task_ids=[],
        why_explanation=req.why_explanation,
        is_manual=True
    )
    db.add(task)
    db.commit()
    recalculate_readiness(db, joiner_id)
    return {"status": "success", "task": task}

