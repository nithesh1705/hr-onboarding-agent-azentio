from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="EMPLOYEE")  # EMPLOYEE, HR_ADMIN, HR_REVIEWER, IT_ADMIN, SYSTEM_ADMIN
    status = Column(String(50), nullable=False, default="Active")  # Active, Locked, Deactivated, Invited
    password_hash = Column(String(255), nullable=True)
    must_change_password = Column(Boolean, default=False)
    joiner_id = Column(String(64), nullable=True, index=True)
    department = Column(String(100), nullable=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Joiner(Base):
    __tablename__ = "joiners"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(100), nullable=False)  # e.g., Software Engineer
    grade = Column(String(50), nullable=False, default="L4")
    department = Column(String(100), nullable=False, index=True)
    location = Column(String(100), nullable=False, index=True)  # Bengaluru, Mumbai, Delhi, Remote
    manager_name = Column(String(255), nullable=False)
    manager_email = Column(String(255), nullable=False)
    joining_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    original_joining_date = Column(String(20), nullable=True)
    status = Column(String(50), nullable=False, default="Pre-joining")  # Pre-joining, Day-1 Ready, Joined, On Hold, Withdrawn
    completeness_pct = Column(Integer, default=60)
    readiness_score = Column(Integer, default=0)
    hr_record_created = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    preferred_name = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RequirementRule(Base):
    __tablename__ = "requirement_rules"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)  # DOC-ID, DOC-EDU, IT-LAPTOP, etc.
    title = Column(String(255), nullable=False)
    item_type = Column(String(50), nullable=False)  # Document, Activity, Provisioning, Acknowledgement, Verification
    category = Column(String(100), nullable=False)
    owner_function = Column(String(50), nullable=False)  # HR, IT, Facilities, Compliance, Reviewer
    due_offset_days = Column(Integer, default=-5)  # e.g., -10 days before joining
    anchor = Column(String(50), default="JOINING_DATE")  # JOINING_DATE, HR_RECORD, OFFER_ACCEPTANCE
    is_blocking = Column(Boolean, default=True)
    conditions = Column(JSON, default=dict)  # {"roles": ["*"], "departments": ["*"], "locations": ["*"], "min_grade": "L1"}
    linked_policy_code = Column(String(50), nullable=True)
    explanation = Column(Text, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChecklistTemplate(Base):
    __tablename__ = "checklist_templates"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    department = Column(String(100), default="*")
    grade_band = Column(String(100), default="*")
    location = Column(String(100), default="*")
    rule_codes = Column(JSON, default=list)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=False, index=True)
    rule_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    owner_function = Column(String(50), nullable=False)
    owner_name = Column(String(255), nullable=False)
    owner_email = Column(String(255), nullable=False)
    due_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    original_due_date = Column(String(20), nullable=True)
    status = Column(String(50), nullable=False, default="Pending")  # Pending, In Progress, Blocked, Completed, Overdue, Cancelled
    is_blocking = Column(Boolean, default=True)
    blocked_by_task_ids = Column(JSON, default=list)
    why_explanation = Column(Text, nullable=False)
    is_manual = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False)  # IDENTITY, ADDRESS, EDUCATION, BGV
    title = Column(String(255), nullable=False)
    required_rule_code = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="Not Submitted")  # Not Submitted, Submitted, Under Review, Accepted, Correction Requested
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    version = Column(Integer, default=1)
    rejection_reason = Column(String(255), nullable=True)  # Illegible, Expired, Name mismatch, Wrong document, Incomplete, Other
    employee_message = Column(Text, nullable=True)
    reviewer_remarks = Column(Text, nullable=True)
    extracted_values = Column(JSON, default=dict)  # {"name": "...", "dob": "...", "expiry": "...", "doc_number": "..."}
    mismatches = Column(JSON, default=list)  # [{"field": "name", "extracted": "...", "profile": "..."}]
    assigned_reviewer_id = Column(String(64), nullable=True)
    claimed_at = Column(DateTime, nullable=True)
    due_date = Column(String(20), nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DocumentHistory(Base):
    __tablename__ = "document_history"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    document_id = Column(String(64), ForeignKey("documents.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)  # HR-ONB-001, etc.
    title = Column(String(255), nullable=False)
    version = Column(String(20), default="1.0")
    category = Column(String(100), default="General")
    audience = Column(JSON, default=list)  # ["EMPLOYEE", "HR_ADMIN"]
    departments = Column(JSON, default=list)  # ["*"] or ["Engineering"]
    locations = Column(JSON, default=list)    # ["*"] or ["Bengaluru"]
    roles = Column(JSON, default=list)        # ["*"]
    grades = Column(JSON, default=list)       # ["*"]
    requires_ack = Column(Boolean, default=False)
    file_url = Column(String(500), nullable=True)
    content_text = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    approved_at = Column(DateTime, default=datetime.utcnow)
    chunks_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PolicyAcknowledgement(Base):
    __tablename__ = "policy_acknowledgements"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=False, index=True)
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=False)
    policy_version = Column(String(20), nullable=False)
    acknowledged_at = Column(DateTime, default=datetime.utcnow)
    ip_hint = Column(String(100), nullable=True)
    signature_statement = Column(String(500), default="I have read, understood and agree to abide by this policy.")

class ProvisioningRequest(Base):
    __tablename__ = "provisioning_requests"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=False, index=True)
    kind = Column(String(50), nullable=False)  # LAPTOP, EMAIL, ACCESS
    item_name = Column(String(255), nullable=False)
    status = Column(String(50), default="Waiting")  # Waiting, Requested, In Progress, Needs Info, Fulfilled, Rejected
    due_date = Column(String(20), nullable=False)
    dependencies_met = Column(Boolean, default=False)
    blocked_reason = Column(String(255), nullable=True)
    payload = Column(JSON, default=dict)  # {"model": "MacBook Pro 16", "specs": "M3 Pro/32GB/512GB", "access_groups": [...]}
    fulfilment_details = Column(JSON, default=dict)  # {"asset_tag": "AST-9021", "serial": "C02G...", "email_created": "asha.rao@acme.com"}
    assignee = Column(String(255), nullable=True)
    it_notes = Column(Text, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ITCatalogue(Base):
    __tablename__ = "it_catalogue"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    kind = Column(String(50), nullable=False)  # LAPTOP, EMAIL_RULE, ACCESS_BUNDLE
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    applies_to = Column(JSON, default=dict)  # {"roles": ["Software Engineer"], "grades": ["L4", "L5"]}
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DepartmentOwner(Base):
    __tablename__ = "department_owners"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    function_name = Column(String(50), nullable=False)  # HR, IT, Facilities, Compliance
    department = Column(String(100), nullable=False)
    owner_name = Column(String(255), nullable=False)
    owner_email = Column(String(255), nullable=False)
    backup_owner_name = Column(String(255), nullable=True)
    backup_owner_email = Column(String(255), nullable=True)
    dept_head_name = Column(String(255), nullable=True)
    dept_head_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Followup(Base):
    __tablename__ = "followups"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=True, index=True)
    source = Column(String(50), default="assistant_refusal")  # assistant_refusal, profile_report, document_mismatch, general
    text = Column(Text, nullable=False)
    status = Column(String(50), default="Open")  # Open, In Progress, Answered, Closed
    assignee_id = Column(String(64), nullable=True)
    reply = Column(Text, nullable=True)
    is_policy_gap = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class Nudge(Base):
    __tablename__ = "nudges"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    sender_id = Column(String(64), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    joiner_id = Column(String(64), nullable=True)
    task_id = Column(String(64), nullable=True)
    body = Column(Text, nullable=False)
    channel = Column(String(50), default="in-app")  # in-app, email
    status = Column(String(50), default="Sent")
    sent_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    user_id = Column(String(64), nullable=True, index=True)
    user_email = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, error, action_required
    related_joiner_id = Column(String(64), nullable=True)
    related_item_id = Column(String(64), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    actor_name = Column(String(255), nullable=False)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(64), nullable=True)
    joiner_id = Column(String(64), nullable=True, index=True)
    details = Column(JSON, default=dict)
    ip_hint = Column(String(50), default="127.0.0.1")
    trace_id = Column(String(64), default=gen_uuid)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    conversation_id = Column(String(64), index=True, default=gen_uuid)
    joiner_id = Column(String(64), ForeignKey("joiners.id"), nullable=True, index=True)
    user_role = Column(String(50), nullable=False)
    user_message = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    is_refusal = Column(Boolean, default=False)
    proposed_action = Column(JSON, nullable=True)
    trace_id = Column(String(64), default=gen_uuid)
    meta_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    dataset = Column(String(50), nullable=False)  # joiners, requirements, owners, policies
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0)
    saved_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    status = Column(String(50), default="Completed")
    error_details = Column(JSON, default=list)
    uploaded_by = Column(String(255), default="HR Admin")
    created_at = Column(DateTime, default=datetime.utcnow)

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    id = Column(String(64), primary_key=True, default=gen_uuid)
    group_name = Column(String(50), nullable=False)  # General, Onboarding, Escalation, Notifications, AI, Security
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    version = Column(Integer, default=1)
    updated_by = Column(String(255), default="System Admin")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

