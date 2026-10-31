from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.db.models import Joiner, Task, Document, Followup, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    joiners = db.query(Joiner).all()
    tasks = db.query(Task).all()
    docs = db.query(Document).all()
    followups = db.query(Followup).all()
    
    total_joiners = len(joiners)
    day1_ready = sum(1 for j in joiners if j.status == "Day-1 Ready" or j.readiness_score == 100)
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    fourteen_days = (datetime.utcnow() + timedelta(days=14)).strftime("%Y-%m-%d")
    
    # At risk joiners: joining in next 14 days and readiness < 75%
    at_risk_joiners = []
    for j in joiners:
        if j.joining_date <= fourteen_days and j.readiness_score < 75 and j.status != "Withdrawn":
            j_tasks = [t for t in tasks if t.joiner_id == j.id and t.status in ["Blocked", "Pending", "Overdue"]]
            main_blocker = j_tasks[0].title if j_tasks else "Pending document submission"
            at_risk_joiners.append({
                "id": j.id,
                "name": j.full_name,
                "role": j.role,
                "location": j.location,
                "joining_date": j.joining_date,
                "readiness_score": j.readiness_score,
                "main_blocker": main_blocker
            })
            
    # Task status counts
    completed_tasks = sum(1 for t in tasks if t.status == "Completed")
    pending_tasks = sum(1 for t in tasks if t.status == "Pending")
    blocked_tasks = sum(1 for t in tasks if t.status == "Blocked")
    overdue_tasks = sum(1 for t in tasks if t.status == "Overdue")
    
    # Readiness bands
    band_0_25 = sum(1 for j in joiners if j.readiness_score <= 25)
    band_26_50 = sum(1 for j in joiners if 25 < j.readiness_score <= 50)
    band_51_75 = sum(1 for j in joiners if 50 < j.readiness_score <= 75)
    band_76_100 = sum(1 for j in joiners if j.readiness_score > 75)
    
    # Critical path: find task blocking the most downstream tasks
    task_block_counts = {}
    for t in tasks:
        if t.status in ["Pending", "In Progress", "Blocked"]:
            for ot in tasks:
                if ot.blocked_by_task_ids and t.id in ot.blocked_by_task_ids:
                    task_block_counts[t.id] = task_block_counts.get(t.id, 0) + 1
                    
    critical_path_item = None
    if task_block_counts:
        top_blocked_task_id = max(task_block_counts.keys(), key=lambda k: task_block_counts[k])
        top_task = next((t for t in tasks if t.id == top_blocked_task_id), None)
        if top_task:
            top_joiner = next((j for j in joiners if j.id == top_task.joiner_id), None)
            critical_path_item = {
                "task_id": top_task.id,
                "task_title": top_task.title,
                "joiner_name": top_joiner.full_name if top_joiner else "Unknown",
                "joiner_id": top_task.joiner_id,
                "blocks_count": task_block_counts[top_blocked_task_id],
                "due_date": top_task.due_date,
                "owner": top_task.owner_name
            }
            
    # Unreviewed docs & unanswered questions
    unreviewed_docs = sum(1 for d in docs if d.status == "Under Review")
    unanswered_questions = sum(1 for f in followups if f.status == "Open")
    
    return {
        "kpis": {
            "total_joiners": total_joiners,
            "day1_ready": day1_ready,
            "at_risk_count": len(at_risk_joiners),
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "blocked_tasks": blocked_tasks,
            "overdue_tasks": overdue_tasks
        },
        "readiness_distribution": [
            {"band": "0-25%", "count": band_0_25},
            {"band": "26-50%", "count": band_26_50},
            {"band": "51-75%", "count": band_51_75},
            {"band": "76-100%", "count": band_76_100}
        ],
        "at_risk_joiners": at_risk_joiners[:5],
        "critical_path": critical_path_item,
        "unreviewed_docs_count": unreviewed_docs,
        "unanswered_questions_count": unanswered_questions
    }

@router.get("/critical-path")
def get_critical_path(db: Session = Depends(get_db)):
    summary = get_dashboard_summary(db)
    return summary.get("critical_path")

