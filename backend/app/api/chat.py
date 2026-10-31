import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Joiner, Task, ChatMessage, Followup, AuditLog, User
from app.core.deps import get_current_user
from app.services.rag.retrieval import retrieve
from app.services.rag.generation import generate_grounded_answer

router = APIRouter(prefix="/chat", tags=["Assistant & RAG"])

class ChatRequest(BaseModel):
    message: str
    joiner_id: Optional[str] = None
    conversation_id: Optional[str] = None

@router.post("")
def chat(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Determine joiner context
    joiner = None
    target_joiner_id = req.joiner_id or current_user.joiner_id
    if target_joiner_id:
        joiner = db.query(Joiner).filter(Joiner.id == target_joiner_id).first()
    elif current_user.role == "EMPLOYEE":
        joiner = db.query(Joiner).filter(Joiner.email == current_user.email).first()
        
    joiner_ctx = None
    recent_tasks = []
    if joiner:
        joiner_ctx = {
            "id": joiner.id,
            "full_name": joiner.full_name,
            "role": joiner.role,
            "grade": joiner.grade,
            "department": joiner.department,
            "location": joiner.location,
            "joining_date": joiner.joining_date
        }
        tasks = db.query(Task).filter(Task.joiner_id == joiner.id).all()
        recent_tasks = [{"title": t.title, "status": t.status, "due_date": t.due_date} for t in tasks]
        
    # Hybrid Retrieval with access filter
    retrieval_res = retrieve(
        query=req.message,
        user_role=current_user.role,
        joiner_context=joiner_ctx,
        k=6
    )
    
    # Grounded answer generation
    ans_result = generate_grounded_answer(
        query=req.message,
        retrieval_res=retrieval_res,
        user_role=current_user.role,
        joiner_context=joiner_ctx,
        recent_tasks=recent_tasks
    )
    
    # If refusal flow triggered, create an HR follow-up automatically!
    if not ans_result.get("answerable", True):
        fup = Followup(
            joiner_id=joiner.id if joiner else None,
            source="assistant_refusal",
            text=f"Employee asked: '{req.message}'. Assistant could not find answer in approved policies.",
            status="Open",
            is_policy_gap=True
        )
        db.add(fup)
        
    # Store turn in ChatMessage
    chat_msg = ChatMessage(
        conversation_id=req.conversation_id or "default-convo",
        joiner_id=joiner.id if joiner else None,
        user_role=current_user.role,
        user_message=req.message,
        assistant_response=ans_result["answer"],
        citations=ans_result["citations"],
        is_refusal=not ans_result["answerable"],
        proposed_action=ans_result.get("proposed_actions"),
        meta_info={
            "gate_passed": retrieval_res["gate_passed"],
            "best_vector_score": retrieval_res["best_vector_score"],
            "best_bm25_score": retrieval_res["best_bm25_score"],
            "degraded": retrieval_res.get("degraded")
        }
    )
    db.add(chat_msg)
    db.commit()
    
    return {
        "answer": ans_result["answer"],
        "citations": ans_result["citations"],
        "answerable": ans_result["answerable"],
        "followup_suggestions": ans_result["followup_suggestions"],
        "proposed_actions": ans_result.get("proposed_actions", []),
        "meta": {
            "gate_passed": retrieval_res["gate_passed"],
            "best_vector_score": retrieval_res["best_vector_score"],
            "best_bm25_score": retrieval_res["best_bm25_score"],
            "degraded": retrieval_res.get("degraded")
        }
    }

@router.get("/{joiner_id}/history")
def get_chat_history(joiner_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter(ChatMessage.joiner_id == joiner_id).order_by(ChatMessage.created_at.asc()).all()
    return msgs

@router.post("/stream")
async def chat_stream(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """SSE streaming endpoint for assistant responses."""
    ans = chat(req, current_user, db)
    
    async def event_generator():
        words = ans["answer"].split(" ")
        for i, w in enumerate(words):
            chunk_data = json.dumps({"token": w + " "})
            yield f"data: {chunk_data}\n\n"
            await asyncio.sleep(0.02)
        # Send citations and done event
        final_payload = json.dumps({
            "citations": ans["citations"],
            "answerable": ans["answerable"],
            "followup_suggestions": ans["followup_suggestions"]
        })
        yield f"event: done\ndata: {final_payload}\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")

