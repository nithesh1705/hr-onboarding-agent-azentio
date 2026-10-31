from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Joiner, User
from app.core.deps import get_current_user, require_roles
from app.services.rag.index import get_rag_health, swap_alias
from app.services.rag.retrieval import retrieve
from app.services.rag.ingest import ingest_all_policy_docs

router = APIRouter(prefix="/rag", tags=["RAG Administration"])

@router.get("/health")
def rag_health():
    return get_rag_health()

@router.get("/debug/search")
def rag_debug_search(
    q: str = Query(..., description="Query text"),
    as_role: str = Query("EMPLOYEE", description="Role to test access filter"),
    joiner_id: Optional[str] = Query(None, description="Joiner context"),
    db: Session = Depends(get_db)
):
    joiner_ctx = None
    if joiner_id:
        j = db.query(Joiner).filter(Joiner.id == joiner_id).first()
        if j:
            joiner_ctx = {
                "department": j.department,
                "location": j.location,
                "role": j.role,
                "grade": j.grade
            }
            
    res = retrieve(query=q, user_role=as_role, joiner_context=joiner_ctx, k=10)
    
    # Identify chunks present in both legs
    bm25_ids = {h["chunk_id"] for h in res["bm25_hits"]}
    vector_ids = {h["chunk_id"] for h in res["vector_hits"]}
    overlap_ids = list(bm25_ids.intersection(vector_ids))
    
    return {
        "query": q,
        "role": as_role,
        "joiner_context": joiner_ctx,
        "gate_passed": res["gate_passed"],
        "best_vector_score": res["best_vector_score"],
        "best_bm25_score": res["best_bm25_score"],
        "in_both_top_n": res["in_both_top_n"],
        "overlap_chunk_ids": overlap_ids,
        "degraded": res.get("degraded"),
        "bm25_candidates": res["bm25_hits"],
        "vector_candidates": res["vector_hits"],
        "fused_results": [
            {
                "chunk_id": f.get("chunk_id"),
                "policy_code": f.get("policy_code"),
                "policy_title": f.get("policy_title"),
                "section": f.get("section"),
                "fused_score": f.get("fused_score"),
                "bm25_rank": f.get("bm25_rank"),
                "vector_rank": f.get("vector_rank"),
                "in_both": f.get("chunk_id") in overlap_ids,
                "snippet": f.get("text", "")[:180] + "..."
            }
            for f in res["fused_results"]
        ]
    }

@router.post("/reindex-all")
def reindex_all_policies(current_user: User = Depends(require_roles(["SYSTEM_ADMIN", "HR_ADMIN"]))):
    results = ingest_all_policy_docs()
    health = get_rag_health()
    return {"status": "success", "results": results, "health": health}

