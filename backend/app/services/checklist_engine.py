from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import Joiner, Task, RequirementRule, Document, ProvisioningRequest

DEFAULT_RULES = [
    {
        "code": "DOC-ID-01",
        "title": "Government Identity & Address Verification",
        "item_type": "Document",
        "category": "Document",
        "owner_function": "Reviewer",
        "due_offset_days": -7,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "HR-ONB-001",
        "explanation": "Mandatory statutory verification required for all employees prior to joining.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "DOC-EDU-01",
        "title": "Education Degree & Marksheet Verification",
        "item_type": "Document",
        "category": "Document",
        "owner_function": "Reviewer",
        "due_offset_days": -5,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "HR-ONB-002",
        "explanation": "Required for technical and professional roles specifying minimum academic credentials.",
        "conditions": {"roles": ["*"], "departments": ["Engineering", "Product", "Analytics", "Finance", "*"]}
    },
    {
        "code": "HR-REC-01",
        "title": "Core HR Record Creation & ID Assignment",
        "item_type": "Activity",
        "category": "HR Operations",
        "owner_function": "HR",
        "due_offset_days": -4,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "HR-ONB-001",
        "explanation": "HR record generation in Core HR database upon approval of mandatory identity documents.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "BGV-CHK-01",
        "title": "Background Verification (BGV) Clearance",
        "item_type": "Verification",
        "category": "Compliance",
        "owner_function": "Compliance",
        "due_offset_days": -3,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "HR-BGV-001",
        "explanation": "External partner verification of employment tenure and criminal history.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "IT-PROV-LAPTOP",
        "title": "IT Equipment & Laptop Provisioning",
        "item_type": "Provisioning",
        "category": "IT Operations",
        "owner_function": "IT",
        "due_offset_days": -2,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "IT-PRV-001",
        "explanation": "Hardware imaging and assignment; starts after Core HR record is created.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "IT-PROV-EMAIL",
        "title": "Corporate Email & SSO Account Creation",
        "item_type": "Provisioning",
        "category": "IT Operations",
        "owner_function": "IT",
        "due_offset_days": -2,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "IT-PRV-001",
        "explanation": "Google Workspace SSO account generation following HR record creation.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "SEC-ACK-01",
        "title": "Information Security Policy Acknowledgement",
        "item_type": "Acknowledgement",
        "category": "Compliance",
        "owner_function": "Employee",
        "due_offset_days": -1,
        "anchor": "JOINING_DATE",
        "is_blocking": True,
        "linked_policy_code": "SEC-POL-001",
        "explanation": "Mandatory digital sign-off before production environment access is unlocked.",
        "conditions": {"roles": ["*"], "departments": ["*"], "locations": ["*"]}
    },
    {
        "code": "IT-PROV-ACCESS",
        "title": "Role-Specific Application & Tool Access",
        "item_type": "Provisioning",
        "category": "IT Operations",
        "owner_function": "IT",
        "due_offset_days": 0,
        "anchor": "JOINING_DATE",
        "is_blocking": False,
        "linked_policy_code": "IT-PRV-001",
        "explanation": "Github, Jira, AWS sandbox access granted after InfoSec acknowledgement.",
        "conditions": {"roles": ["Software Engineer", "Product Manager", "DevOps Engineer", "QA Engineer", "*"], "departments": ["Engineering", "Product", "*"]}
    },
    {
        "code": "FAC-DESK-01",
        "title": "Workstation & Office Badge Allocation",
        "item_type": "Activity",
        "category": "Facilities",
        "owner_function": "Facilities",
        "due_offset_days": 0,
        "anchor": "JOINING_DATE",
        "is_blocking": False,
        "linked_policy_code": "HR-DAY1-001",
        "explanation": "Desk seating allocation and physical RFID badge preparation at local campus.",
        "conditions": {"locations": ["Bengaluru", "Mumbai", "Delhi", "*"]}
    }
]

def calculate_due_date(joining_date_str: str, offset_days: int) -> str:
    try:
        j_date = datetime.strptime(joining_date_str, "%Y-%m-%d")
        due = j_date + timedelta(days=offset_days)
        return due.strftime("%Y-%m-%d")
    except Exception:
        return joining_date_str

def generate_checklist_for_joiner(db: Session, joiner: Joiner) -> List[Task]:
    """
    Generates a tailored onboarding checklist based on rules and dependencies.
    """
    # Delete existing non-completed tasks if any
    existing_tasks = db.query(Task).filter(Task.joiner_id == joiner.id).all()
    if existing_tasks:
        db.query(Task).filter(Task.joiner_id == joiner.id).delete()
        db.commit()
        
    rules = db.query(RequirementRule).filter(RequirementRule.active == True).all()
    if not rules:
        # Seed default rules
        for r_data in DEFAULT_RULES:
            r = RequirementRule(
                code=r_data["code"],
                title=r_data["title"],
                item_type=r_data["item_type"],
                category=r_data["category"],
                owner_function=r_data["owner_function"],
                due_offset_days=r_data["due_offset_days"],
                anchor=r_data["anchor"],
                is_blocking=r_data["is_blocking"],
                conditions=r_data["conditions"],
                linked_policy_code=r_data["linked_policy_code"],
                explanation=r_data["explanation"]
            )
            db.add(r)
        db.commit()
        rules = db.query(RequirementRule).filter(RequirementRule.active == True).all()
        
    created_tasks = []
    task_map = {}
    
    for rule in rules:
        due_date = calculate_due_date(joiner.joining_date, rule.due_offset_days)
        
        # Determine owner
        owner_name = "HR Operations"
        owner_email = "hr-ops@company.com"
        if rule.owner_function == "IT":
            owner_name = "IT Helpdesk"
            owner_email = "it-provisioning@company.com"
        elif rule.owner_function == "Reviewer":
            owner_name = "Document Reviewer"
            owner_email = "reviewer@company.com"
        elif rule.owner_function == "Compliance":
            owner_name = "Compliance Lead"
            owner_email = "compliance@company.com"
        elif rule.owner_function == "Facilities":
            owner_name = f"{joiner.location} Facilities Desk"
            owner_email = f"facilities-{joiner.location.lower()}@company.com"
        elif rule.owner_function == "Employee":
            owner_name = joiner.full_name
            owner_email = joiner.email
            
        task = Task(
            joiner_id=joiner.id,
            rule_code=rule.code,
            title=rule.title,
            category=rule.category,
            owner_function=rule.owner_function,
            owner_name=owner_name,
            owner_email=owner_email,
            due_date=due_date,
            original_due_date=due_date,
            status="Pending",
            is_blocking=rule.is_blocking,
            blocked_by_task_ids=[],
            why_explanation=f"{rule.explanation} (Source: {rule.linked_policy_code or 'Company HR Manual'})"
        )
        db.add(task)
        db.flush()
        created_tasks.append(task)
        task_map[rule.code] = task
        
    # Wire dependencies
    # 1. HR Record creation is blocked by Identity Verification
    if "DOC-ID-01" in task_map and "HR-REC-01" in task_map:
        task_map["HR-REC-01"].blocked_by_task_ids = [task_map["DOC-ID-01"].id]
        task_map["HR-REC-01"].status = "Blocked"
        
    # 2. IT Laptop and Email are blocked by HR Record
    if "HR-REC-01" in task_map:
        if "IT-PROV-LAPTOP" in task_map:
            task_map["IT-PROV-LAPTOP"].blocked_by_task_ids = [task_map["HR-REC-01"].id]
            task_map["IT-PROV-LAPTOP"].status = "Blocked"
        if "IT-PROV-EMAIL" in task_map:
            task_map["IT-PROV-EMAIL"].blocked_by_task_ids = [task_map["HR-REC-01"].id]
            task_map["IT-PROV-EMAIL"].status = "Blocked"
            
    # 3. IT Access is blocked by InfoSec acknowledgement and BGV
    access_blockers = []
    if "SEC-ACK-01" in task_map:
        access_blockers.append(task_map["SEC-ACK-01"].id)
    if "BGV-CHK-01" in task_map:
        access_blockers.append(task_map["BGV-CHK-01"].id)
    if "IT-PROV-ACCESS" in task_map and access_blockers:
        task_map["IT-PROV-ACCESS"].blocked_by_task_ids = access_blockers
        task_map["IT-PROV-ACCESS"].status = "Blocked"
        
    # Also initialize Documents and Provisioning Requests
    init_documents_and_provisioning(db, joiner)
    
    db.commit()
    recalculate_readiness(db, joiner.id)
    return created_tasks

def init_documents_and_provisioning(db: Session, joiner: Joiner):
    # Ensure standard documents exist
    doc_types = [
        {"type": "IDENTITY", "title": "Government Photo ID (PAN / Aadhaar / Passport)", "rule": "DOC-ID-01", "offset": -7},
        {"type": "ADDRESS", "title": "Proof of Address (Utility Bill / Passport)", "rule": "DOC-ID-01", "offset": -7},
        {"type": "EDUCATION", "title": "Degree Certificate & Marksheets", "rule": "DOC-EDU-01", "offset": -5}
    ]
    for dt in doc_types:
        exists = db.query(Document).filter(Document.joiner_id == joiner.id, Document.doc_type == dt["type"]).first()
        if not exists:
            due = calculate_due_date(joiner.joining_date, dt["offset"])
            d = Document(
                joiner_id=joiner.id,
                doc_type=dt["type"],
                title=dt["title"],
                required_rule_code=dt["rule"],
                status="Not Submitted",
                due_date=due
            )
            db.add(d)
            
    # Ensure IT provisioning requests exist
    pr_items = [
        {"kind": "LAPTOP", "name": f"Laptop for {joiner.role} ({joiner.grade})", "offset": -2, "model": "Apple MacBook Pro 16\"" if "Engineer" in joiner.role else "Apple MacBook Air 13\""},
        {"kind": "EMAIL", "name": f"Corporate Email Account ({joiner.email.split('@')[0]}@company.com)", "offset": -2, "alias": joiner.email.split('@')[0]},
        {"kind": "ACCESS", "name": f"Role Access Bundle for {joiner.department}", "offset": 0, "groups": ["engineering-standard", "github-repo-read", "slack-general"]}
    ]
    for pr in pr_items:
        exists = db.query(ProvisioningRequest).filter(ProvisioningRequest.joiner_id == joiner.id, ProvisioningRequest.kind == pr["kind"]).first()
        if not exists:
            due = calculate_due_date(joiner.joining_date, pr["offset"])
            req = ProvisioningRequest(
                joiner_id=joiner.id,
                kind=pr["kind"],
                item_name=pr["name"],
                status="Waiting",
                due_date=due,
                dependencies_met=False,
                blocked_reason="Waiting for Core HR record creation",
                payload=pr
            )
            db.add(req)
            
    db.commit()

def recalculate_readiness(db: Session, joiner_id: str):
    joiner = db.query(Joiner).filter(Joiner.id == joiner_id).first()
    if not joiner:
        return
        
    tasks = db.query(Task).filter(Task.joiner_id == joiner_id).all()
    if not tasks:
        joiner.readiness_score = 0
        db.commit()
        return
        
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "Completed")
    score = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    joiner.readiness_score = score
    
    # Check if all blocking tasks are completed
    blocking_tasks = [t for t in tasks if t.is_blocking]
    all_blocking_done = all(t.status == "Completed" for t in blocking_tasks) if blocking_tasks else False
    
    if all_blocking_done:
        joiner.status = "Day-1 Ready"
    elif joiner.status == "Day-1 Ready" and not all_blocking_done:
        joiner.status = "Pre-joining"
        
    db.commit()

