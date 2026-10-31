import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import engine, Base
from app.db.models import (
    User, Joiner, RequirementRule, ChecklistTemplate, Task, Document,
    DocumentHistory, Policy, PolicyAcknowledgement, ProvisioningRequest,
    ITCatalogue, DepartmentOwner, Followup, Nudge, Notification,
    AuditLog, ChatMessage, IngestionRun, AppSetting
)

def init_database():
    print("Creating all tables in Supabase PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_database()

