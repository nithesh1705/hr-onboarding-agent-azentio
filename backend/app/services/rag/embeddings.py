import logging
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        _embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedder

def embed_text(text: str) -> List[float]:
    """Embed single query or chunk text."""
    embedder = get_embedder()
    vec = embedder.encode(text, normalize_embeddings=True)
    return vec.tolist()

def embed_batch(texts: List[str]) -> List[List[float]]:
    """Embed a batch of texts."""
    if not texts:
        return []
    embedder = get_embedder()
    vecs = embedder.encode(texts, batch_size=32, normalize_embeddings=True)
    return [v.tolist() for v in vecs]

