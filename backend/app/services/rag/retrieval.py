import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.rag.es_client import get_es_client
from app.services.rag.embeddings import embed_text

logger = logging.getLogger(__name__)

def build_access_filter(role: str, joiner_context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Builds mandatory Elasticsearch filters according to role and joiner scope.
    """
    filters = [
        {"term": {"active": True}}
    ]
    
    # Audience filtering
    filters.append({
        "terms": {"audience": [role, "*"]}
    })
    
    # If EMPLOYEE, filter by department, location, role, and grade
    if role == "EMPLOYEE" and joiner_context:
        dept = joiner_context.get("department")
        loc = joiner_context.get("location")
        r = joiner_context.get("role")
        grd = joiner_context.get("grade")
        
        if dept:
            filters.append({
                "bool": {
                    "should": [
                        {"term": {"departments": dept}},
                        {"term": {"departments": "*"}}
                    ],
                    "minimum_should_match": 1
                }
            })
        if loc:
            filters.append({
                "bool": {
                    "should": [
                        {"term": {"locations": loc}},
                        {"term": {"locations": "*"}}
                    ],
                    "minimum_should_match": 1
                }
            })
        if r:
            filters.append({
                "bool": {
                    "should": [
                        {"term": {"roles": r}},
                        {"term": {"roles": "*"}}
                    ],
                    "minimum_should_match": 1
                }
            })
        if grd:
            filters.append({
                "bool": {
                    "should": [
                        {"term": {"grades": grd}},
                        {"term": {"grades": "*"}}
                    ],
                    "minimum_should_match": 1
                }
            })
            
    return filters

def rrf_fuse(
    bm25_hits: List[Dict[str, Any]],
    vector_hits: List[Dict[str, Any]],
    k: int = 60,
    bm25_weight: float = 1.0,
    vector_weight: float = 1.0,
    final_k: int = 6
) -> List[Dict[str, Any]]:
    """
    Reciprocal Rank Fusion of BM25 and Dense Vector hits.
    score = sum( weight / (k + rank) )
    """
    fused_scores = {}
    item_map = {}
    
    for rank, hit in enumerate(bm25_hits):
        cid = hit["_source"]["chunk_id"]
        item_map[cid] = hit["_source"]
        fused_scores[cid] = fused_scores.get(cid, 0.0) + (bm25_weight / (k + rank + 1))
        item_map[cid]["bm25_rank"] = rank + 1
        item_map[cid]["bm25_score"] = float(hit.get("_score") or 0.0)
        
    for rank, hit in enumerate(vector_hits):
        cid = hit["_source"]["chunk_id"]
        if cid not in item_map:
            item_map[cid] = hit["_source"]
            item_map[cid]["bm25_rank"] = None
            item_map[cid]["bm25_score"] = 0.0
        fused_scores[cid] = fused_scores.get(cid, 0.0) + (vector_weight / (k + rank + 1))
        item_map[cid]["vector_rank"] = rank + 1
        item_map[cid]["vector_score"] = float(hit.get("_score") or 0.0)
        
    # Sort by fused score
    sorted_cids = sorted(fused_scores.keys(), key=lambda x: fused_scores[x], reverse=True)
    
    results = []
    seen_sections = set()
    for cid in sorted_cids:
        chunk = item_map[cid]
        chunk["fused_score"] = round(fused_scores[cid], 5)
        
        # Deduplicate multiple chunks from exact same policy section if we have enough
        sec_key = f"{chunk.get('policy_code')}:{chunk.get('section')}"
        if sec_key in seen_sections and len(results) >= 3:
            continue
        seen_sections.add(sec_key)
        
        results.append(chunk)
        if len(results) >= final_k:
            break
            
    return results

def retrieve(
    query: str,
    user_role: str = "EMPLOYEE",
    joiner_context: Optional[Dict[str, Any]] = None,
    k: int = 6
) -> Dict[str, Any]:
    """
    Executes hybrid retrieval (BM25 + kNN) with access filtering and gating.
    """
    client = get_es_client()
    alias = settings.ELASTIC_INDEX_ALIAS
    
    filters = build_access_filter(user_role, joiner_context)
    
    # 1. BM25 Query
    bm25_query = {
        "bool": {
            "must": [
                {
                    "multi_match": {
                        "query": query,
                        "fields": [
                            "text^1.0",
                            "text.exact^1.2",
                            "section^2.0",
                            "policy_title^1.5",
                            "policy_code^3.0"
                        ],
                        "type": "best_fields",
                        "minimum_should_match": "1<70%"
                    }
                }
            ],
            "filter": filters
        }
    }
    
    bm25_hits = []
    degraded = None
    try:
        bm25_res = client.search(
            index=alias,
            query=bm25_query,
            size=settings.BM25_CANDIDATES
        )
        bm25_hits = bm25_res["hits"]["hits"]
    except Exception as e:
        logger.error(f"BM25 search error: {e}")
        degraded = "vector_only"
        
    # 2. Vector kNN Query
    vector_hits = []
    try:
        query_vec = embed_text(query)
        knn_clause = {
            "field": "embedding",
            "query_vector": query_vec,
            "k": settings.VECTOR_CANDIDATES,
            "num_candidates": settings.KNN_NUM_CANDIDATES,
            "filter": filters
        }
        vec_res = client.search(
            index=alias,
            knn=knn_clause,
            size=settings.VECTOR_CANDIDATES
        )
        vector_hits = vec_res["hits"]["hits"]
    except Exception as e:
        logger.error(f"Vector search error: {e}")
        degraded = "bm25_only"
        
    # 3. Reciprocal Rank Fusion
    fused_results = rrf_fuse(
        bm25_hits=bm25_hits,
        vector_hits=vector_hits,
        k=settings.RRF_K,
        bm25_weight=settings.BM25_WEIGHT,
        vector_weight=settings.VECTOR_WEIGHT,
        final_k=k
    )
    
    # 4. Confidence Gating Check
    best_vector_score = max([float(h.get("_score") or 0.0) for h in vector_hits], default=0.0)
    best_bm25_score = max([float(h.get("_score") or 0.0) for h in bm25_hits], default=0.0)
    
    bm25_top_ids = {h["_source"]["chunk_id"] for h in bm25_hits[:settings.GATE_TOP_N]}
    vector_top_ids = {h["_source"]["chunk_id"] for h in vector_hits[:settings.GATE_TOP_N]}
    in_both_legs = len(bm25_top_ids.intersection(vector_top_ids)) > 0
    
    # Pass gate if any condition holds
    gate_passed = (
        best_vector_score >= settings.MIN_SEMANTIC_SCORE or
        best_bm25_score >= settings.MIN_BM25_SCORE or
        in_both_legs
    )
    
    # Edge case: if no hits at all, gate fails
    if not fused_results:
        gate_passed = False
        
    return {
        "gate_passed": gate_passed,
        "fused_results": fused_results,
        "bm25_hits": [
            {
                "chunk_id": h["_source"]["chunk_id"],
                "policy_code": h["_source"]["policy_code"],
                "section": h["_source"]["section"],
                "score": float(h["_score"])
            }
            for h in bm25_hits[:10]
        ],
        "vector_hits": [
            {
                "chunk_id": h["_source"]["chunk_id"],
                "policy_code": h["_source"]["policy_code"],
                "section": h["_source"]["section"],
                "score": float(h["_score"])
            }
            for h in vector_hits[:10]
        ],
        "degraded": degraded,
        "best_vector_score": round(best_vector_score, 4),
        "best_bm25_score": round(best_bm25_score, 4),
        "in_both_top_n": in_both_legs
    }

