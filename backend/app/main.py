import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.init_db import init_database
from app.services.rag.index import ensure_index
from app.services.rag.ingest import ingest_all_policy_docs
from app.core.observability import setup_observability

# Import Routers
from app.api.auth import router as auth_router
from app.api.joiners import router as joiners_router
from app.api.tasks import router as tasks_router
from app.api.documents import router as documents_router
from app.api.policies import router as policies_router
from app.api.chat import router as chat_router
from app.api.provisioning import router as provisioning_router
from app.api.dashboard import router as dashboard_router
from app.api.ingest import router as ingest_router
from app.api.admin import router as admin_router
from app.api.rag_admin import router as rag_admin_router
from app.api.notifications import router as notifications_router
from app.api.reviews import router as reviews_router
from app.api.owners import router as owners_router
from app.api.followups import router as followups_router

app = FastAPI(
    title="HR Onboarding Agent API",
    description="Enterprise AI-powered HR Onboarding System with Supabase, Elasticsearch Hybrid RAG, and Role-Based Portals.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded documents
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(joiners_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(policies_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(provisioning_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(ingest_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(rag_admin_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(owners_router, prefix="/api/v1")
app.include_router(followups_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    print("Initializing HR Onboarding Agent backend services...")
    setup_observability()
    try:
        init_database()
        ensure_index(version=1)
    except Exception as e:
        print(f"Startup warning: {e}")

@app.get("/")
def root():
    return {
        "app": "HR Onboarding Agent",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

