from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Joiner, Task, Document, ProvisioningRequest, AuditLog, Notification, User
from app.core.deps import get_current_user, require_roles
from app.services.checklist_engine import generate_checklist_for_joiner, recalculate_readiness
from app.services.change_engine import preview_plan_change, apply_plan_change

router = APIRouter(prefix="/joiners", tags=["Joiners"])

class JoinerCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    grade: str = "L4"
    department: str
    location: str
    manager_name: str
    manager_email: EmailStr
    joining_date: str
    notes: Optional[str] = None

class ContactUpdateRequest(BaseModel):
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferred_name: Optional[str] = None
    address: Optional[str] = None

class PlanChangeRequest(BaseModel):
    new_joining_date: Optional[str] = None
    new_role: Optional[str] = None
    new_grade: Optional[str] = None
    new_department: Optional[str] = None
    new_location: Optional[str] = None
    reason: str

@router.get("")
def list_joiners(
    search: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    readiness_band: Optional[str] = None,
    date_preset: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Joiner)
    
    # If employee, can only view own record
    if current_user.role == "EMPLOYEE":
        if current_user.joiner_id:
            query = query.filter(Joiner.id == current_user.joiner_id)
        else:
            query = query.filter(Joiner.email == current_user.email)
            
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Joiner.full_name.ilike(s)) | (Joiner.email.ilike(s)) | (Joiner.role.ilike(s)))
        
    if department and department != "All":
        query = query.filter(Joiner.department == department)
        
    if location and location != "All":
        query = query.filter(Joiner.location == location)
        
    if status_filter and status_filter != "All":
        query = query.filter(Joiner.status == status_filter)
        
    if readiness_band and readiness_band != "All":
        if readiness_band == "0-25":
            query = query.filter(Joiner.readiness_score <= 25)
        elif readiness_band == "26-50":
            query = query.filter(Joiner.readiness_score > 25, Joiner.readiness_score <= 50)
        elif readiness_band == "51-75":
            query = query.filter(Joiner.readiness_score > 50, Joiner.readiness_score <= 75)
        elif readiness_band == "76-100":
            query = query.filter(Joiner.readiness_score > 75)
            
    joiners = query.order_by(Joiner.joining_date.asc()).all()
    
    # Enrich with task counts and next blocker
    result = []
    for j in joiners:
        tasks = db.query(Task).filter(Task.joiner_id == j.id).all()
        completed = sum(1 for t in tasks if t.status == "Completed")
        pending = sum(1 for t in tasks if t.status == "Pending")
        blocked = sum(1 for t in tasks if t.status == "Blocked")
        overdue = sum(1 for t in tasks if t.status == "Overdue")
        
        # Find next blocker
        next_blocker = next((t.title for t in tasks if t.status in ["Blocked", "Overdue", "Pending"] and t.is_blocking), "None")
        
        result.append({
            "id": j.id,
            "full_name": j.full_name,
            "email": j.email,
            "phone": j.phone,
            "role": j.role,
            "grade": j.grade,
            "department": j.department,
            "location": j.location,
            "manager_name": j.manager_name,
            "manager_email": j.manager_email,
            "joining_date": j.joining_date,
            "original_joining_date": j.original_joining_date,
            "status": j.status,
            "readiness_score": j.readiness_score,
            "completeness_pct": j.completeness_pct,
            "hr_record_created": j.hr_record_created,
            "task_counts": {
                "total": len(tasks),
                "completed": completed,
                "pending": pending,
                "blocked": blocked,
                "overdue": overdue
            },
            "next_blocker": next_blocker
        })
        
    return result

@router.get("/me")
def get_my_joiner(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = None
    if current_user.joiner_id:
        joiner = db.query(Joiner).filter(Joiner.id == current_user.joiner_id).first()
    if not joiner:
        joiner = db.query(Joiner).filter(Joiner.email == current_user.email).first()
    if not joiner:
        # Fallback for demo
        joiner = db.query(Joiner).first()
        
    if not joiner:
        raise HTTPException(status_code=404, detail="No joiner record found.")
        
    tasks = db.query(Task).filter(Task.joiner_id == joiner.id).all()
    completed = sum(1 for t in tasks if t.status == "Completed")
    pending = sum(1 for t in tasks if t.status == "Pending")
    blocked = sum(1 for t in tasks if t.status == "Blocked")
    overdue = sum(1 for t in tasks if t.status == "Overdue")
    
    return {
        "id": joiner.id,
        "full_name": joiner.full_name,
        "email": joiner.email,
        "phone": joiner.phone,
        "role": joiner.role,
        "grade": joiner.grade,
        "department": joiner.department,
        "location": joiner.location,
        "manager_name": joiner.manager_name,
        "manager_email": joiner.manager_email,
        "joining_date": joiner.joining_date,
        "original_joining_date": joiner.original_joining_date,
        "status": joiner.status,
        "readiness_score": joiner.readiness_score,
        "completeness_pct": joiner.completeness_pct,
        "hr_record_created": joiner.hr_record_created,
        "emergency_contact": joiner.emergency_contact,
        "preferred_name": joiner.preferred_name,
        "address": joiner.address,
        "task_counts": {
            "total": len(tasks),
            "completed": completed,
            "pending": pending,
            "blocked": blocked,
            "overdue": overdue
        }
    }

@router.get("/{id}")
def get_joiner_detail(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = db.query(Joiner).filter(Joiner.id == id).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner not found")
        
    # Check permissions
    if current_user.role == "EMPLOYEE" and current_user.email != joiner.email and current_user.joiner_id != joiner.id:
        raise HTTPException(status_code=403, detail="Employees may only access their own profile.")
        
    tasks = db.query(Task).filter(Task.joiner_id == id).all()
    docs = db.query(Document).filter(Document.joiner_id == id).all()
    provs = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == id).all()
    
    completed = sum(1 for t in tasks if t.status == "Completed")
    pending = sum(1 for t in tasks if t.status == "Pending")
    blocked = sum(1 for t in tasks if t.status == "Blocked")
    overdue = sum(1 for t in tasks if t.status == "Overdue")
    
    return {
        "id": joiner.id,
        "full_name": joiner.full_name,
        "email": joiner.email,
        "phone": joiner.phone,
        "role": joiner.role,
        "grade": joiner.grade,
        "department": joiner.department,
        "location": joiner.location,
        "manager_name": joiner.manager_name,
        "manager_email": joiner.manager_email,
        "joining_date": joiner.joining_date,
        "original_joining_date": joiner.original_joining_date,
        "status": joiner.status,
        "readiness_score": joiner.readiness_score,
        "completeness_pct": joiner.completeness_pct,
        "hr_record_created": joiner.hr_record_created,
        "notes": joiner.notes,
        "emergency_contact": joiner.emergency_contact,
        "preferred_name": joiner.preferred_name,
        "address": joiner.address,
        "task_counts": {
            "total": len(tasks),
            "completed": completed,
            "pending": pending,
            "blocked": blocked,
            "overdue": overdue
        },
        "documents_count": len(docs),
        "provisioning_count": len(provs)
    }

@router.post("")
def create_joiner(req: JoinerCreateRequest, current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(Joiner).filter(Joiner.email == req.email.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A joiner with this email address already exists.")
        
    joiner = Joiner(
        full_name=req.full_name,
        email=req.email.strip(),
        phone=req.phone,
        role=req.role,
        grade=req.grade,
        department=req.department,
        location=req.location,
        manager_name=req.manager_name,
        manager_email=req.manager_email,
        joining_date=req.joining_date,
        notes=req.notes
    )
    db.add(joiner)
    db.commit()
    db.refresh(joiner)
    
    # Ensure corresponding employee user exists for login
    from app.core.security import hash_password
    user_emp = db.query(User).filter(User.email == joiner.email).first()
    if not user_emp:
        user_emp = User(
            email=joiner.email,
            name=joiner.full_name,
            role="EMPLOYEE",
            status="Active",
            password_hash=hash_password("Welcome@123"),
            department=joiner.department,
            joiner_id=joiner.id
        )
        db.add(user_emp)
    else:
        user_emp.joiner_id = joiner.id
    db.commit()

    # Generate checklist
    tasks = generate_checklist_for_joiner(db, joiner)
    
    # Write audit log
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="CREATE_JOINER",
        entity_type="JOINER",
        entity_id=joiner.id,
        joiner_id=joiner.id,
        details={"name": joiner.full_name, "role": joiner.role, "tasks_generated": len(tasks)}
    )
    db.add(audit)
    db.commit()
    
    joiner_dict = {
        "id": joiner.id,
        "full_name": joiner.full_name,
        "email": joiner.email,
        "role": joiner.role,
        "grade": joiner.grade,
        "department": joiner.department,
        "location": joiner.location,
        "manager_name": joiner.manager_name,
        "manager_email": joiner.manager_email,
        "joining_date": joiner.joining_date,
        "status": joiner.status
    }
    return {"status": "success", "joiner": joiner_dict, "tasks_created": len(tasks)}

@router.patch("/me/contact")
def update_contact(req: ContactUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = None
    if current_user.joiner_id:
        joiner = db.query(Joiner).filter(Joiner.id == current_user.joiner_id).first()
    if not joiner:
        joiner = db.query(Joiner).filter(Joiner.email == current_user.email).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner profile not found")
        
    if req.phone:
        joiner.phone = req.phone
    if req.emergency_contact:
        joiner.emergency_contact = req.emergency_contact
    if req.preferred_name:
        joiner.preferred_name = req.preferred_name
    if req.address:
        joiner.address = req.address
        
    joiner.completeness_pct = 100
    db.commit()
    return {"status": "success", "message": "Contact information updated."}

@router.post("/{id}/profile/create")
def create_hr_record(id: str, current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    """
    Scenario 2: Formal Core HR Record creation.
    Unblocks downstream IT laptop, email and access requests!
    """
    joiner = db.query(Joiner).filter(Joiner.id == id).first()
    if not joiner:
        raise HTTPException(status_code=404, detail="Joiner not found")
        
    joiner.hr_record_created = True
    
    # Find HR Record task and mark completed
    hr_task = db.query(Task).filter(Task.joiner_id == id, Task.rule_code == "HR-REC-01").first()
    if hr_task:
        hr_task.status = "Completed"
        
    # Unblock IT Laptop and IT Email tasks
    laptop_task = db.query(Task).filter(Task.joiner_id == id, Task.rule_code == "IT-PROV-LAPTOP").first()
    if laptop_task and laptop_task.status == "Blocked":
        laptop_task.status = "Pending"
        
    email_task = db.query(Task).filter(Task.joiner_id == id, Task.rule_code == "IT-PROV-EMAIL").first()
    if email_task and email_task.status == "Blocked":
        email_task.status = "Pending"
        
    # Update Provisioning Requests to Requested
    prov_requests = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == id).all()
    for p in prov_requests:
        if p.kind in ["LAPTOP", "EMAIL"]:
            p.status = "Requested"
            p.dependencies_met = True
            p.blocked_reason = None
            
    # Audit log
    audit = AuditLog(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="CREATE_HR_RECORD",
        entity_type="JOINER",
        entity_id=id,
        joiner_id=id,
        details={"status": "HR Record Created", "unblocked_tasks": ["IT-PROV-LAPTOP", "IT-PROV-EMAIL"]}
    )
    db.add(audit)
    
    # Notification to IT
    notif = Notification(
        user_email="it-provisioning@company.com",
        title="New Provisioning Request Ready",
        message=f"HR Record created for {joiner.full_name} ({joiner.role}). Laptop & Email provisioning is now ready to fulfill.",
        type="action_required",
        related_joiner_id=joiner.id
    )
    db.add(notif)
    
    db.commit()
    recalculate_readiness(db, id)
    
    return {"status": "success", "message": f"Core HR Record created for {joiner.full_name}. IT provisioning unlocked."}

@router.post("/{id}/change/preview")
def preview_change(id: str, req: PlanChangeRequest, current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    return preview_plan_change(
        db=db,
        joiner_id=id,
        new_joining_date=req.new_joining_date,
        new_role=req.new_role,
        new_grade=req.new_grade,
        new_department=req.new_department,
        new_location=req.new_location,
        reason=req.reason
    )

@router.post("/{id}/change/apply")
def apply_change(id: str, req: PlanChangeRequest, current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    return apply_plan_change(
        db=db,
        joiner_id=id,
        new_joining_date=req.new_joining_date,
        new_role=req.new_role,
        new_grade=req.new_grade,
        new_department=req.new_department,
        new_location=req.new_location,
        reason=req.reason,
        actor_name=current_user.name,
        actor_email=current_user.email
    )

