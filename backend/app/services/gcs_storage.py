import logging
from typing import Optional, List, Dict, Any
from google.cloud import storage
from app.config import settings

logger = logging.getLogger(__name__)

_storage_client: Optional[storage.Client] = None

def get_storage_client() -> storage.Client:
    global _storage_client
    if _storage_client is None:
        try:
            _storage_client = storage.Client(project=settings.GCP_PROJECT_ID)
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Storage client: {e}")
            raise e
    return _storage_client

def get_bucket(bucket_name: Optional[str] = None):
    client = get_storage_client()
    target_bucket = bucket_name or settings.GCS_BUCKET_NAME
    return client.bucket(target_bucket)

def upload_blob_bytes(blob_path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """
    Uploads raw bytes to a Google Cloud Storage blob.
    Returns the blob name (path inside the bucket).
    """
    bucket = get_bucket()
    blob = bucket.blob(blob_path)
    blob.upload_from_string(data, content_type=content_type)
    logger.info(f"Uploaded {len(data)} bytes to gs://{bucket.name}/{blob_path} ({content_type})")
    return blob_path

def download_blob_bytes(blob_path: str) -> bytes:
    """
    Downloads raw bytes from a Google Cloud Storage blob.
    """
    bucket = get_bucket()
    blob = bucket.blob(blob_path)
    if not blob.exists():
        raise FileNotFoundError(f"Blob gs://{bucket.name}/{blob_path} does not exist.")
    return blob.download_as_bytes()

def blob_exists(blob_path: str) -> bool:
    """
    Checks if a blob exists in Google Cloud Storage.
    """
    try:
        bucket = get_bucket()
        blob = bucket.blob(blob_path)
        return blob.exists()
    except Exception as e:
        logger.error(f"Error checking blob existence for {blob_path}: {e}")
        return False

def list_blobs(prefix: str = "") -> List[Dict[str, Any]]:
    """
    Lists blobs in GCS bucket with given prefix.
    """
    try:
        client = get_storage_client()
        bucket = get_bucket()
        blobs = client.list_blobs(bucket, prefix=prefix)
        return [
            {
                "name": b.name,
                "size": b.size,
                "content_type": b.content_type,
                "updated": b.updated.isoformat() if b.updated else None,
                "gcs_uri": f"gs://{bucket.name}/{b.name}"
            }
            for b in blobs
        ]
    except Exception as e:
        logger.error(f"Error listing blobs with prefix '{prefix}': {e}")
        return []

def delete_blob(blob_path: str) -> bool:
    """
    Deletes a blob from GCS.
    """
    try:
        bucket = get_bucket()
        blob = bucket.blob(blob_path)
        if blob.exists():
            blob.delete()
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting blob {blob_path}: {e}")
        return False

def get_joiner_doc_blob_path(joiner_id: str, doc_type: str, safe_filename: str) -> str:
    """
    Structured path hierarchy: joiners/{joiner_id}/documents/{doc_type}/{safe_filename}
    """
    clean_doc_type = doc_type.upper().replace(" ", "_")
    return f"joiners/{joiner_id}/documents/{clean_doc_type}/{safe_filename}"

def get_policy_blob_path(filename: str) -> str:
    """
    Structured path hierarchy: policies/{filename}
    """
    return f"policies/{filename}"

def get_template_blob_path(template_name: str) -> str:
    """
    Structured path hierarchy: templates/{template_name}
    """
    return f"templates/{template_name}"

