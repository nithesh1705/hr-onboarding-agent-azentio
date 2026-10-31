from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.db.models import User, Joiner, AuditLog
from app.core.security import verify_password, hash_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    demo_role: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = None
    if req.demo_role:
        user = db.query(User).filter(User.role == req.demo_role.upper()).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"No seeded user found for role {req.demo_role}")
    else:
        user = db.query(User).filter(User.email == req.email.strip()).first()
        if not user:
            raise HTTPException(status_code=401, detail="Email or password is incorrect")
            
        if req.password and not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Email or password is incorrect")
            
    if user.status == "Deactivated":
        raise HTTPException(status_code=403, detail="Your account is not active. Contact your administrator.")
        
    access_token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    
    # Audit log
    audit = AuditLog(
        actor_name=user.name,
        actor_email=user.email,
        actor_role=user.role,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        details={"login_type": "demo" if req.demo_role else "password"}
    )
    db.add(audit)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
            "joiner_id": user.joiner_id
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joiner = None
    if current_user.joiner_id:
        joiner = db.query(Joiner).filter(Joiner.id == current_user.joiner_id).first()
    elif current_user.role == "EMPLOYEE":
        joiner = db.query(Joiner).filter(Joiner.email == current_user.email).first()
        
    joiner_dict = None
    if joiner:
        joiner_dict = {
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
            "completeness_pct": joiner.completeness_pct,
            "readiness_score": joiner.readiness_score,
            "hr_record_created": joiner.hr_record_created
        }
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "department": current_user.department,
        "joiner_id": current_user.joiner_id or (joiner.id if joiner else None),
        "joiner": joiner_dict
    }

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    joiners = db.query(Joiner).all()
    
    role_order = ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER", "IT_ADMIN", "SYSTEM_ADMIN"]
    demo_list = []
    
    for r in role_order:
        u = next((x for x in users if x.role == r), None)
        if u:
            demo_list.append({
                "role": u.role,
                "email": u.email,
                "name": u.name,
                "department": u.department,
                "joiner_id": u.joiner_id
            })
            
    return {
        "demo_users": demo_list,
        "sample_joiners": [
            {"id": j.id, "name": j.full_name, "role": j.role, "location": j.location, "email": j.email}
            for j in joiners
        ]
    }

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}

