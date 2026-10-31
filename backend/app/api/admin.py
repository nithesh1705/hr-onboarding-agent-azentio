from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import User, AppSetting, AuditLog, Joiner
from app.core.deps import get_current_user, require_roles
from app.core.security import hash_password
from app.services.rag.index import get_rag_health
from app.config import settings

router = APIRouter(prefix="/admin", tags=["System Administration"])

class UserInviteRequest(BaseModel):
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None
    joiner_id: Optional[str] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None  # Active, Locked, Deactivated
    department: Optional[str] = None

class SettingUpdateRequest(BaseModel):
    key: str
    value: Any

@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    # 1. DB check
    db_healthy = True
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1")).scalar()
    except Exception:
        db_healthy = False
        
    # 2. ES check
    rag = get_rag_health()
    es_healthy = rag.get("status") == "healthy"
    
    return {
        "services": {
            "fastapi_backend": {"status": "healthy", "version": "1.0.0"},
            "cloud_sql_mysql": {
                "status": "healthy" if db_healthy else "unhealthy",
                "instance": settings.CLOUDSQL_INSTANCE,
                "database": settings.CLOUDSQL_DATABASE
            },
            "elasticsearch": rag,
            "vertex_ai_gemini": {
                "status": "connected",
                "model": settings.VERTEX_GEMINI_MODEL,
                "project_id": settings.GCP_PROJECT_ID,
                "region": settings.VERTEX_LOCATION
            },
            "cloud_observability": {
                "cloud_logging": "enabled",
                "cloud_trace": "enabled"
            }
        },
        "overall_status": "healthy" if db_healthy and es_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/users")
def list_users(current_user: User = Depends(require_roles(["SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    res = []
    for u in users:
        joiner = None
        if u.joiner_id:
            joiner = db.query(Joiner).filter(Joiner.id == u.joiner_id).first()
        res.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "status": u.status,
            "department": u.department,
            "joiner_id": u.joiner_id,
            "joiner_name": joiner.full_name if joiner else None,
            "created_at": u.created_at
        })
    return res

@router.post("/users")
def invite_user(req: UserInviteRequest, current_user: User = Depends(require_roles(["SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
        
    user = User(
        email=req.email.strip(),
        name=req.name,
        role=req.role,
        status="Active",
        department=req.department,
        joiner_id=req.joiner_id,
        password_hash=hash_password("Welcome@123")
    )
    db.add(user)
    db.commit()
    return {"status": "success", "user": user}

@router.patch("/users/{id}")
def update_user(id: str, req: UserUpdateRequest, current_user: User = Depends(require_roles(["SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.name:
        user.name = req.name
    if req.role:
        user.role = req.role
    if req.status:
        user.status = req.status
    if req.department:
        user.department = req.department
        
    db.commit()
    return {"status": "success", "user": user}

@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    return db.query(AppSetting).all()

@router.patch("/settings/{group}")
def update_setting(group: str, req: SettingUpdateRequest, current_user: User = Depends(require_roles(["SYSTEM_ADMIN"])), db: Session = Depends(get_db)):
    setting = db.query(AppSetting).filter(AppSetting.group_name == group, AppSetting.key == req.key).first()
    if not setting:
        setting = AppSetting(group_name=group, key=req.key, value=req.value)
        db.add(setting)
    else:
        setting.value = req.value
        setting.version += 1
        setting.updated_by = current_user.name
        
    db.commit()
    return {"status": "success", "setting": setting}

@router.get("/audit")
def get_audit_logs(
    actor_role: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if current_user.role != "SYSTEM_ADMIN":
        query = query.filter(AuditLog.actor_role == current_user.role)
    if action and action != "All":
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.created_at.desc()).limit(100).all()

@router.post("/data/seed")
def reseed_demo_data(current_user: User = Depends(require_roles(["SYSTEM_ADMIN", "HR_ADMIN"]))):
    from app.db.seed import seed_database
    seed_database()
    return {"status": "success", "message": "Demo data seeded successfully."}

