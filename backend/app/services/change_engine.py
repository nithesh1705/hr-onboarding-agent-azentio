from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import Joiner, Task, Document, ProvisioningRequest, AuditLog, Notification
from app.services.checklist_engine import calculate_due_date, recalculate_readiness

def preview_plan_change(
    db: Session,
    joiner_id: str,
    new_joining_date: Optional[str] = None,
    new_role: Optional[str] = None,
    new_grade: Optional[str] = None,
    new_department: Optional[str] = None,
    new_location: Optional[str] = None,
    reason: str = ""
) -> Dict[str, Any]:
    """
    Computes diff for joining date or role changes:
    Tables for Kept, Updated, Added, and Cancelled tasks with warnings.
    """
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    if not joiner:
        raise ValueError("Joiner not found")
        
    tasks = db.query(Task).filter(Task.joiner_id == joiner_id).all()
    target_date = new_joining_date or joiner.joining_date
    
    kept = []
    updated = []
    cancelled = []
    warnings = []
    
    # Check date changes
    date_changed = new_joining_date and new_joining_date != joiner.joining_date
    role_changed = (new_role and new_role != joiner.role) or (new_department and new_department != joiner.department)
    
    for t in tasks:
        # If task is already completed, it is kept
        if t.status == "Completed":
            kept.append({
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "owner": t.owner_name,
                "due_date": t.due_date,
                "note": "Completed task preserved."
            })
            continue
            
        # Calculate new due date if date changed
        if date_changed:
            # Estimate offset from original
            try:
                curr_due = datetime.strptime(t.due_date, "%Y-%m-%d")
                orig_join = datetime.strptime(joiner.joining_date, "%Y-%m-%d")
                offset = (curr_due - orig_join).days
            except Exception:
                offset = -3
                
            new_due = calculate_due_date(target_date, offset)
            if new_due != t.due_date:
                updated.append({
                    "id": t.id,
                    "title": t.title,
                    "owner": t.owner_name,
                    "old_due_date": t.due_date,
                    "new_due_date": new_due,
                    "reason": f"Recalculated based on new joining date ({target_date})"
                })
            else:
                kept.append({
                    "id": t.id,
                    "title": t.title,
                    "status": t.status,
                    "owner": t.owner_name,
                    "due_date": t.due_date,
                    "note": "Unchanged"
                })
        else:
            kept.append({
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "owner": t.owner_name,
                "due_date": t.due_date,
                "note": "Unchanged"
            })
            
    # Check if provisioning has already started
    prov_requests = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == joiner_id).all()
    in_flight_prov = [p for p in prov_requests if p.status in ["In Progress", "Fulfilled"]]
    if in_flight_prov:
        warnings.append(f"IT Provisioning has {len(in_flight_prov)} items already in progress or fulfilled. IT team will be notified of the rescheduled joining date.")
        
    return {
        "joiner_id": joiner_id,
        "joiner_name": joiner.full_name,
        "old_joining_date": joiner.joining_date,
        "new_joining_date": target_date,
        "old_role": joiner.role,
        "new_role": new_role or joiner.role,
        "old_department": joiner.department,
        "new_department": new_department or joiner.department,
        "kept_count": len(kept),
        "updated_count": len(updated),
        "cancelled_count": len(cancelled),
        "kept_tasks": kept,
        "updated_tasks": updated,
        "cancelled_tasks": cancelled,
        "warnings": warnings,
        "reason": reason
    }

def apply_plan_change(
    db: Session,
    joiner_id: str,
    new_joining_date: Optional[str] = None,
    new_role: Optional[str] = None,
    new_grade: Optional[str] = None,
    new_department: Optional[str] = None,
    new_location: Optional[str] = None,
    reason: str = "",
    actor_name: str = "HR Admin",
    actor_email: str = "hr@company.com"
) -> Dict[str, Any]:
    """
    Applies the plan change in a single transaction, updates dates and writes audit logs.
    """
    preview = preview_plan_change(
        db, joiner_id, new_joining_date, new_role, new_grade, new_department, new_location, reason
    )
    
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    
    # Update joiner details
    if new_joining_date and new_joining_date != joiner.joining_date:
        if not joiner.original_joining_date:
            joiner.original_joining_date = joiner.joining_date
        joiner.joining_date = new_joining_date
        
    if new_role:
        joiner.role = new_role
    if new_grade:
        joiner.grade = new_grade
    if new_department:
        joiner.department = new_department
    if new_location:
        joiner.location = new_location
        
    # Update task due dates
    for item in preview["updated_tasks"]:
        t = db.query(Task).filter(Task.id == item["id"]).first()
        if t:
            t.original_due_date = t.due_date
            t.due_date = item["new_due_date"]
            
    # Update documents and provisioning due dates
    if new_joining_date:
        docs = db.query(Document).filter(Document.joiner_id == joiner_id).all()
        for d in docs:
            d.due_date = calculate_due_date(new_joining_date, -5)
        provs = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == joiner_id).all()
        for p in provs:
            p.due_date = calculate_due_date(new_joining_date, -2)
            
    # Audit entry
    audit = AuditLog(
        actor_name=actor_name,
        actor_email=actor_email,
        actor_role="HR_ADMIN",
        action="CHANGE_PLAN",
        entity_type="JOINER",
        entity_id=joiner_id,
        joiner_id=joiner_id,
        details={
            "reason": reason,
            "old_date": preview["old_joining_date"],
            "new_date": preview["new_joining_date"],
            "tasks_updated": len(preview["updated_tasks"])
        }
    )
    db.add(audit)
    
    # Notification to employee
    notif = Notification(
        user_email=joiner.email,
        title="Onboarding Plan Updated",
        message=f"Your joining schedule has been adjusted to {joiner.joining_date}. Your checklist due dates have been recalculated.",
        type="info",
        related_joiner_id=joiner.id
    )
    db.add(notif)
    
    db.commit()
    recalculate_readiness(db, joiner_id)
    
    return {"status": "success", "message": "Onboarding plan updated successfully", "details": preview}

