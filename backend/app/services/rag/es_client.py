from elasticsearch import Elasticsearch
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_es_client = None

def get_es_client() -> Elasticsearch:
    global _es_client
    if _es_client is None:
        _es_client = Elasticsearch(
            settings.ELASTIC_ENDPOINT,
            api_key=settings.ELASTIC_API_KEY,
            request_timeout=30,
            max_retries=3,
            retry_on_timeout=True
        )
    return _es_client

def check_es_health():
    try:
        client = get_es_client()
        info = client.info()
        return {
            "status": "healthy",
            "cluster_name": info.get("cluster_name"),
            "version": info.get("version", {}).get("number")
        }
    except Exception as e:
        logger.error(f"Elasticsearch health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

