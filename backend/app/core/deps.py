from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.db.models import User, Joiner
from app.core.security import decode_access_token
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    db: Session = Depends(get_db)
) -> User:
    # 1. Check Bearer JWT token
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.email == payload["sub"]).first()
            if user:
                return user
                
    # 2. Demo mode fallback if X-Demo-Role is provided or header is set
    if settings.DEMO_MODE and x_demo_role:
        role_upper = x_demo_role.upper()
        user = db.query(User).filter(User.role == role_upper).first()
        if user:
            return user
            
    # Default fallback for local testing in demo mode: Return default HR Admin or first user
    if settings.DEMO_MODE:
        user = db.query(User).filter(User.role == "HR_ADMIN").first()
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != "SYSTEM_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role {current_user.role} does not have required permissions."
            )
        return current_user
    return role_checker

