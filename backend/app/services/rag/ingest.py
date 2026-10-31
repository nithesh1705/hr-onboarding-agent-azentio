import os
import glob
from datetime import datetime
from typing import Dict, Any, List
import logging
from elasticsearch.helpers import bulk
from app.config import settings
from app.services.rag.es_client import get_es_client
from app.services.rag.index import ensure_index
from app.services.rag.parsing import parse_document
from app.services.rag.chunking import chunk_sections
from app.services.rag.embeddings import embed_batch

logger = logging.getLogger(__name__)

def ingest_policy_data(
    policy_code: str,
    title: str,
    version: str,
    audience: List[str],
    departments: List[str],
    locations: List[str],
    roles: List[str],
    grades: List[str],
    raw_content: str = "",
    file_path: str = "",
    raw_bytes: bytes = None,
    filename: str = ""
) -> Dict[str, Any]:
    """
    Ingests and indexes a single policy into Elasticsearch with embeddings.
    Supports GCS raw_bytes, raw_content, or file_path.
    """
    client = get_es_client()
    alias = settings.ELASTIC_INDEX_ALIAS
    ensure_index(version=1)
    
    # 1. Parse sections
    sections = parse_document(file_path=file_path, raw_content=raw_content, raw_bytes=raw_bytes, filename=filename)
    if not sections:
        logger.warning(f"No sections parsed for policy {policy_code}")
        return {"status": "empty", "chunks_indexed": 0}
        
    # 2. Chunk sections
    chunks = chunk_sections(policy_code, version, sections)
    if not chunks:
        return {"status": "empty", "chunks_indexed": 0}
        
    # 3. Batch embed
    texts_to_embed = [c["embed_text"] for c in chunks]
    embeddings = embed_batch(texts_to_embed)
    
    # 4. Prepare ES bulk actions
    now_iso = datetime.utcnow().isoformat()
    actions = []
    
    for c, emb in zip(chunks, embeddings):
        doc = {
            "_index": alias,
            "_id": c["chunk_id"],
            "_source": {
                "chunk_id": c["chunk_id"],
                "policy_id": policy_code,
                "policy_code": policy_code,
                "policy_title": title,
                "policy_version": version,
                "section": c["section"],
                "page": c["page"],
                "text": c["text"],
                "embedding": emb,
                "audience": audience,
                "departments": departments,
                "locations": locations,
                "roles": roles,
                "grades": grades,
                "active": True,
                "approved_at": now_iso,
                "content_hash": c["content_hash"],
                "token_count": c["token_count"],
                "created_at": now_iso
            }
        }
        actions.append(doc)
        
    # 5. Bulk index
    success, failed = bulk(client, actions, refresh=True)
    logger.info(f"Policy {policy_code} indexed: {success} chunks, failed: {failed}")
    
    return {
        "status": "success",
        "policy_code": policy_code,
        "chunks_indexed": success,
        "chunks_failed": failed
    }

def ingest_all_policy_docs():
    """
    Ingests policies directly from Google Cloud Storage bucket (policies/),
    falling back to policy_docs/ directory.
    """
    from app.services.gcs_storage import list_blobs, download_blob_bytes
    
    results = []
    policy_metadata = {
        "HR-ONB-001": {
            "title": "Pre-Joining Document Submission Policy",
            "version": "1.2",
            "audience": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER"],
            "departments": ["*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        },
        "HR-ONB-002": {
            "title": "Academic Qualifications & Education Verification",
            "version": "1.1",
            "audience": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER"],
            "departments": ["Engineering", "Product", "Analytics", "Finance", "Operations", "*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        },
        "HR-BGV-001": {
            "title": "Background Verification (BGV) Policy & Protocols",
            "version": "2.0",
            "audience": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER", "COMPLIANCE"],
            "departments": ["*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        },
        "IT-PRV-001": {
            "title": "IT Asset Provisioning and System Access Policy",
            "version": "1.4",
            "audience": ["IT_ADMIN", "HR_ADMIN", "EMPLOYEE"],
            "departments": ["Engineering", "Product", "Sales", "Design", "Corporate", "*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        },
        "SEC-POL-001": {
            "title": "Information Security and Acceptable Use Policy",
            "version": "3.0",
            "audience": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER", "IT_ADMIN", "SYSTEM_ADMIN"],
            "departments": ["*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        },
        "HR-DAY1-001": {
            "title": "First-Day Office Arrival and Orientation Guide",
            "version": "1.3",
            "audience": ["EMPLOYEE", "HR_ADMIN", "FACILITIES"],
            "departments": ["*"],
            "locations": ["Bengaluru", "Mumbai", "Delhi", "Remote", "*"],
            "roles": ["*"],
            "grades": ["*"]
        }
    }
    
    # 1. Try Google Cloud Storage first
    try:
        gcs_blobs = list_blobs(prefix="policies/")
        if gcs_blobs:
            logger.info(f"Ingesting {len(gcs_blobs)} policy documents from GCS bucket...")
            for b in gcs_blobs:
                blob_name = b["name"]
                fname = os.path.basename(blob_name)
                if not fname:
                    continue
                code = None
                for k in policy_metadata.keys():
                    if k in fname:
                        code = k
                        break
                meta = policy_metadata.get(code, {
                    "title": os.path.splitext(fname)[0].replace("_", " "),
                    "version": "1.0",
                    "audience": ["EMPLOYEE", "HR_ADMIN"],
                    "departments": ["*"],
                    "locations": ["*"],
                    "roles": ["*"],
                    "grades": ["*"]
                })
                policy_code = code or os.path.splitext(fname)[0].split("_")[0]
                
                try:
                    data = download_blob_bytes(blob_name)
                    res = ingest_policy_data(
                        policy_code=policy_code,
                        title=meta["title"],
                        version=meta["version"],
                        audience=meta["audience"],
                        departments=meta["departments"],
                        locations=meta["locations"],
                        roles=meta["roles"],
                        grades=meta["grades"],
                        raw_bytes=data,
                        filename=fname
                    )
                    results.append(res)
                except Exception as ex:
                    logger.error(f"Failed to ingest GCS blob {blob_name}: {ex}")
            if results:
                return results
    except Exception as gcs_err:
        logger.warning(f"Could not read policies from GCS: {gcs_err}. Falling back to local directory.")
        
    # 2. Local fallback
    docs_dir = settings.POLICY_DOCS_DIR
    if not os.path.exists(docs_dir):
        return results
        
    files = glob.glob(os.path.join(docs_dir, "*.*"))
    for fpath in files:
        fname = os.path.basename(fpath)
        code = None
        for k in policy_metadata.keys():
            if k in fname:
                code = k
                break
                
        meta = policy_metadata.get(code, {
            "title": os.path.splitext(fname)[0].replace("_", " "),
            "version": "1.0",
            "audience": ["EMPLOYEE", "HR_ADMIN"],
            "departments": ["*"],
            "locations": ["*"],
            "roles": ["*"],
            "grades": ["*"]
        })
        policy_code = code or os.path.splitext(fname)[0].split("_")[0]
        
        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
        res = ingest_policy_data(
            policy_code=policy_code,
            title=meta["title"],
            version=meta["version"],
            audience=meta["audience"],
            departments=meta["departments"],
            locations=meta["locations"],
            roles=meta["roles"],
            grades=meta["grades"],
            raw_content=content,
            file_path=fpath
        )
        results.append(res)
    return results

