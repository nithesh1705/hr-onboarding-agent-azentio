import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "HR Onboarding Agent"
    APP_ENV: str = "production"
    DEMO_MODE: bool = True
    
    # Google Cloud Project & Services
    GCP_PROJECT_ID: str = "possible-cocoa-513307-a9"
    GCS_BUCKET_NAME: str = "possible-cocoa-513307-a9-hr-storage"
    VERTEX_LOCATION: str = "us-central1"
    VERTEX_GEMINI_MODEL: str = "gemini-3.5-flash"
    ENABLE_CLOUD_TRACE: bool = True
    ENABLE_CLOUD_LOGGING: bool = True
    
    # Cloud SQL (MySQL 8.4)
    CLOUDSQL_INSTANCE: str = "possible-cocoa-513307-a9:us-east1:free-trial-first-project"
    CLOUDSQL_USER: str = "root"
    CLOUDSQL_PASSWORD: str = ""
    CLOUDSQL_DATABASE: str = "hr_onboarding"
    CLOUDSQL_HOST: str = "35.237.181.253"
    CLOUDSQL_PORT: int = 3306
    DATABASE_URL: str = ""
    
    # Elasticsearch & Elastic Email Connector
    ELASTIC_ENDPOINT: str = "https://41413b501b454b638f365e85fb75f14a.ap-southeast-1.aws.found.io:443"
    ELASTIC_KIBANA_URL: str = "https://my-deployment-c76ff3.kb.ap-southeast-1.aws.elastic-cloud.com:443"
    ELASTIC_EMAIL_CONNECTOR_ID: str = "hr-onboarding"
    ELASTIC_API_KEY: str = ""
    ELASTIC_INDEX_ALIAS: str = "policy_chunks"
    
    # Auth
    SECRET_KEY: str = "hr-onboarding-secure-jwt-secret-key-prod-level-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # RAG Settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    BM25_CANDIDATES: int = 30
    VECTOR_CANDIDATES: int = 30
    KNN_NUM_CANDIDATES: int = 100
    FINAL_K: int = 6
    RRF_K: int = 60
    BM25_WEIGHT: float = 1.0
    VECTOR_WEIGHT: float = 1.0
    MIN_SEMANTIC_SCORE: float = 0.40
    MIN_BM25_SCORE: float = 2.0
    GATE_TOP_N: int = 5
    ENABLE_QUERY_REWRITE: bool = True
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    POLICY_DOCS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "policy_docs")

    class Config:
        env_file = ".env"
        extra = "allow"

    @property
    def database_connection_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # In Cloud Run with Cloud SQL instance flag mounted
        cloudsql_socket = f"/cloudsql/{self.CLOUDSQL_INSTANCE}"
        if os.path.exists(cloudsql_socket):
            return f"mysql+pymysql://{self.CLOUDSQL_USER}:{self.CLOUDSQL_PASSWORD}@/{self.CLOUDSQL_DATABASE}?unix_socket={cloudsql_socket}&charset=utf8mb4"
        # Otherwise connect via Cloud SQL Public IP
        return f"mysql+pymysql://{self.CLOUDSQL_USER}:{self.CLOUDSQL_PASSWORD}@{self.CLOUDSQL_HOST}:{self.CLOUDSQL_PORT}/{self.CLOUDSQL_DATABASE}?charset=utf8mb4"

settings = Settings()
