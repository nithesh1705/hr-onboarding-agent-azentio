import logging
from app.config import settings
from app.services.rag.es_client import get_es_client

logger = logging.getLogger(__name__)

INDEX_MAPPING = {
    "properties": {
        "chunk_id": {"type": "keyword"},
        "policy_id": {"type": "keyword"},
        "policy_code": {"type": "keyword"},
        "policy_title": {
            "type": "text",
            "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}
        },
        "policy_version": {"type": "keyword"},
        "section": {
            "type": "text",
            "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}
        },
        "page": {"type": "integer"},
        "text": {
            "type": "text",
            "analyzer": "english",
            "fields": {
                "exact": {"type": "text", "analyzer": "standard"}
            }
        },
        "embedding": {
            "type": "dense_vector",
            "dims": settings.EMBEDDING_DIM,
            "index": True,
            "similarity": "cosine",
            "index_options": {
                "type": "hnsw",
                "m": 16,
                "ef_construction": 200
            }
        },
        "audience": {"type": "keyword"},
        "departments": {"type": "keyword"},
        "locations": {"type": "keyword"},
        "roles": {"type": "keyword"},
        "grades": {"type": "keyword"},
        "active": {"type": "boolean"},
        "approved_at": {"type": "date"},
        "content_hash": {"type": "keyword"},
        "token_count": {"type": "integer"},
        "created_at": {"type": "date"}
    }
}

INDEX_SETTINGS = {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "1s"
}

def ensure_index(version: int = 1) -> str:
    client = get_es_client()
    alias = settings.ELASTIC_INDEX_ALIAS
    physical_index = f"{alias}_v{version}"
    
    if not client.indices.exists(index=physical_index):
        logger.info(f"Creating physical index {physical_index}...")
        client.indices.create(
            index=physical_index,
            mappings=INDEX_MAPPING,
            settings=INDEX_SETTINGS
        )
        logger.info(f"Physical index {physical_index} created.")
        
    # Check alias
    if not client.indices.exists_alias(name=alias):
        logger.info(f"Creating alias {alias} -> {physical_index}")
        client.indices.put_alias(index=physical_index, name=alias)
    else:
        # Check if alias points to physical index
        existing = client.indices.get_alias(name=alias)
        if physical_index not in existing:
            client.indices.put_alias(index=physical_index, name=alias)
            
    return physical_index

def swap_alias(new_physical_index: str):
    client = get_es_client()
    alias = settings.ELASTIC_INDEX_ALIAS
    
    actions = []
    if client.indices.exists_alias(name=alias):
        existing = client.indices.get_alias(name=alias)
        for old_idx in existing.keys():
            actions.append({"remove": {"index": old_idx, "alias": alias}})
            
    actions.append({"add": {"index": new_physical_index, "alias": alias}})
    client.indices.update_aliases(body={"actions": actions})
    logger.info(f"Swapped alias {alias} to {new_physical_index}")

def get_rag_health():
    client = get_es_client()
    alias = settings.ELASTIC_INDEX_ALIAS
    try:
        alias_exists = client.indices.exists_alias(name=alias)
        doc_count = 0
        physical_indices = []
        if alias_exists:
            indices_dict = client.indices.get_alias(name=alias)
            physical_indices = list(indices_dict.keys())
            count_res = client.count(index=alias)
            doc_count = count_res.get("count", 0)
            
        cluster_info = client.info()
        return {
            "status": "healthy",
            "alias": alias,
            "alias_exists": alias_exists,
            "physical_indices": physical_indices,
            "doc_count": doc_count,
            "embedding_dim": settings.EMBEDDING_DIM,
            "cluster_version": cluster_info.get("version", {}).get("number"),
            "cluster_name": cluster_info.get("cluster_name")
        }
    except Exception as e:
        logger.error(f"Failed to get RAG health: {e}")
        return {
            "status": "degraded",
            "error": str(e),
            "alias": alias
        }

