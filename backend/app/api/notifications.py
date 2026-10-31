from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.db.models import Notification, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def list_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Match user_email or user_id
    notifs = db.query(Notification).filter(
        (Notification.user_email == current_user.email) | (Notification.user_id == current_user.id)
    ).order_by(Notification.created_at.desc()).limit(30).all()
    return notifs

@router.patch("/{id}")
def mark_as_read(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    db.commit()
    return {"status": "success"}

@router.post("/mark-all-read")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        (Notification.user_email == current_user.email) | (Notification.user_id == current_user.id)
    ).update({"read": True})
    db.commit()
    return {"status": "success"}

