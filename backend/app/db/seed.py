import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.db.models import (
    User, Joiner, RequirementRule, ChecklistTemplate, Task, Document,
    Policy, DepartmentOwner, ITCatalogue, AppSetting, Notification, AuditLog, IngestionRun
)
from app.core.security import hash_password
from app.services.checklist_engine import generate_checklist_for_joiner, recalculate_readiness, DEFAULT_RULES

def seed_database():
    db = SessionLocal()
    print("Seeding database with synthetic users, joiners, rules, and settings...")
    
    # 1. Seed Users for 5 roles
    default_pwd = hash_password("Welcome@123")
    
    users_data = [
        {"email": "sys.admin@company.com", "name": "Elena Rostova", "role": "SYSTEM_ADMIN", "department": "IT Operations"},
        {"email": "hr.admin@company.com", "name": "Sarah Jenkins", "role": "HR_ADMIN", "department": "People & Culture"},
        {"email": "hr.reviewer@company.com", "name": "Marcus Vance", "role": "HR_REVIEWER", "department": "Talent Operations"},
        {"email": "it.admin@company.com", "name": "David Chen", "role": "IT_ADMIN", "department": "Enterprise IT"},
        {"email": "asha.rao@example.com", "name": "Asha Rao", "role": "EMPLOYEE", "department": "Engineering"}
    ]
    
    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                name=u["name"],
                role=u["role"],
                status="Active",
                password_hash=default_pwd,
                department=u["department"]
            )
            db.add(user)
    db.commit()
    
    # 2. Seed Requirement Rules
    for r in DEFAULT_RULES:
        existing = db.query(RequirementRule).filter(RequirementRule.code == r["code"]).first()
        if not existing:
            rule = RequirementRule(
                code=r["code"],
                title=r["title"],
                item_type=r["item_type"],
                category=r["category"],
                owner_function=r["owner_function"],
                due_offset_days=r["due_offset_days"],
                anchor=r["anchor"],
                is_blocking=r["is_blocking"],
                conditions=r["conditions"],
                linked_policy_code=r["linked_policy_code"],
                explanation=r["explanation"]
            )
            db.add(rule)
    db.commit()
    
    # 3. Seed Joiners
    today = datetime.utcnow()
    joiners_data = [
        {
            "full_name": "Asha Rao",
            "email": "asha.rao@example.com",
            "phone": "+91 98450 12345",
            "role": "Software Engineer",
            "grade": "L4",
            "department": "Engineering",
            "location": "Bengaluru",
            "manager_name": "Karthik Subramaniam",
            "manager_email": "karthik.s@company.com",
            "joining_date": (today + timedelta(days=12)).strftime("%Y-%m-%d"),
            "status": "Pre-joining",
            "completeness_pct": 80
        },
        {
            "full_name": "Rajesh Sharma",
            "email": "rajesh.sharma@example.com",
            "phone": "+91 98200 54321",
            "role": "Product Manager",
            "grade": "L5",
            "department": "Product",
            "location": "Mumbai",
            "manager_name": "Deepa Nair",
            "manager_email": "deepa.n@company.com",
            "joining_date": (today + timedelta(days=6)).strftime("%Y-%m-%d"),
            "status": "Pre-joining",
            "completeness_pct": 60
        },
        {
            "full_name": "Priya Deshmukh",
            "email": "priya.deshmukh@example.com",
            "phone": "+91 97654 32109",
            "role": "Data Analyst",
            "grade": "L3",
            "department": "Analytics",
            "location": "Bengaluru",
            "manager_name": "Rahul Verma",
            "manager_email": "rahul.v@company.com",
            "joining_date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "status": "Pre-joining",
            "completeness_pct": 90
        },
        {
            "full_name": "Vikram Malhotra",
            "email": "vikram.malhotra@example.com",
            "phone": "+91 99110 88776",
            "role": "Finance Lead",
            "grade": "L5",
            "department": "Finance",
            "location": "Delhi",
            "manager_name": "Anita Roy",
            "manager_email": "anita.r@company.com",
            "joining_date": (today + timedelta(days=18)).strftime("%Y-%m-%d"),
            "status": "Pre-joining",
            "completeness_pct": 50
        },
        {
            "full_name": "Sameer Khan",
            "email": "sameer.khan@example.com",
            "phone": "+91 91234 56789",
            "role": "DevOps Engineer",
            "grade": "L4",
            "department": "Engineering",
            "location": "Remote",
            "manager_name": "Karthik Subramaniam",
            "manager_email": "karthik.s@company.com",
            "joining_date": (today + timedelta(days=25)).strftime("%Y-%m-%d"),
            "status": "Pre-joining",
            "completeness_pct": 40
        }
    ]
    
    for j_data in joiners_data:
        joiner = db.query(Joiner).filter(Joiner.email == j_data["email"]).first()
        if not joiner:
            joiner = Joiner(**j_data)
            db.add(joiner)
            db.commit()
            db.refresh(joiner)
        else:
            # Refresh details and reset dates
            joiner.full_name = j_data["full_name"]
            joiner.role = j_data["role"]
            joiner.grade = j_data["grade"]
            joiner.department = j_data["department"]
            joiner.location = j_data["location"]
            joiner.manager_name = j_data["manager_name"]
            joiner.manager_email = j_data["manager_email"]
            joiner.joining_date = j_data["joining_date"]
            joiner.completeness_pct = j_data["completeness_pct"]
            db.commit()
            
        # Ensure employee user account exists and is linked
        user_emp = db.query(User).filter(User.email == joiner.email).first()
        if not user_emp:
            user_emp = User(
                email=joiner.email,
                name=joiner.full_name,
                role="EMPLOYEE",
                status="Active",
                password_hash=default_pwd,
                department=joiner.department,
                joiner_id=joiner.id
            )
            db.add(user_emp)
            db.commit()
        else:
            user_emp.joiner_id = joiner.id
            user_emp.role = "EMPLOYEE"
            db.commit()
            
        # Generate checklist tasks, documents, and provisioning
        generate_checklist_for_joiner(db, joiner)
        recalculate_readiness(db, joiner.id)
        print(f"Generated / refreshed checklist for joiner {joiner.full_name}")
            
    # 4. Seed Department Owners
    owners = [
        {"func": "HR", "dept": "Engineering", "owner": "Sarah Jenkins", "email": "sarah.j@company.com", "backup": "Anand Rao", "bemail": "anand.r@company.com", "head": "Kavita Reddy", "hemail": "kavita.r@company.com"},
        {"func": "IT", "dept": "Engineering", "owner": "David Chen", "email": "david.c@company.com", "backup": "Sunil Nair", "bemail": "sunil.n@company.com", "head": "Amitabh Bose", "hemail": "amitabh.b@company.com"},
        {"func": "Facilities", "dept": "Bengaluru", "owner": "Anand Kumar", "email": "anand.k@company.com", "backup": "Ramesh P", "bemail": "ramesh.p@company.com", "head": "Sunita Murthy", "hemail": "sunita.m@company.com"},
        {"func": "Compliance", "dept": "Corporate", "owner": "Marcus Vance", "email": "marcus.v@company.com", "backup": "Lisa Ray", "bemail": "lisa.r@company.com", "head": "Sanjay Gupta", "hemail": "sanjay.g@company.com"}
    ]
    for o in owners:
        existing = db.query(DepartmentOwner).filter(DepartmentOwner.function_name == o["func"], DepartmentOwner.department == o["dept"]).first()
        if not existing:
            owner = DepartmentOwner(
                function_name=o["func"],
                department=o["dept"],
                owner_name=o["owner"],
                owner_email=o["email"],
                backup_owner_name=o["backup"],
                backup_owner_email=o["bemail"],
                dept_head_name=o["head"],
                dept_head_email=o["hemail"]
            )
            db.add(owner)
    db.commit()
    
    # 5. Seed IT Catalogue
    catalogue_items = [
        {"kind": "LAPTOP", "name": "Apple MacBook Pro 16\" (M3 Pro, 32GB RAM)", "desc": "Standard engineering and product machine", "applies_to": {"roles": ["Software Engineer", "Product Manager", "DevOps Engineer"], "departments": ["Engineering", "Product"]}},
        {"kind": "LAPTOP", "name": "Apple MacBook Air 13\" (M3, 16GB RAM)", "desc": "Standard business machine for HR, Sales, Finance", "applies_to": {"departments": ["Finance", "People & Culture", "Sales", "Analytics"]}},
        {"kind": "ACCESS_BUNDLE", "name": "Engineering Core Stack", "desc": "GitHub Enterprise, AWS Sandbox, Jira, Slack, Datadog", "applies_to": {"departments": ["Engineering"]}},
        {"kind": "ACCESS_BUNDLE", "name": "Product & Analytics Stack", "desc": "Figma Enterprise, Mixpanel, Jira, Confluence, Snowflake", "applies_to": {"departments": ["Product", "Analytics"]}}
    ]
    for ci in catalogue_items:
        existing = db.query(ITCatalogue).filter(ITCatalogue.name == ci["name"]).first()
        if not existing:
            item = ITCatalogue(
                kind=ci["kind"],
                name=ci["name"],
                description=ci["desc"],
                applies_to=ci["applies_to"],
                active=True
            )
            db.add(item)
    db.commit()
    
    # 6. Seed App Settings
    settings_items = [
        {"group": "General", "key": "company_name", "value": "Acme Technologies Global"},
        {"group": "General", "key": "time_zone", "value": "Asia/Kolkata (IST +05:30)"},
        {"group": "Onboarding", "key": "allowed_file_types", "value": ["PDF", "PNG", "JPEG"]},
        {"group": "Onboarding", "key": "max_file_size_mb", "value": 10},
        {"group": "Escalation", "key": "backup_escalation_hours", "value": 24},
        {"group": "Escalation", "key": "head_escalation_hours", "value": 48},
        {"group": "AI", "key": "model_name", "value": "gemini-2.5-flash"},
        {"group": "AI", "key": "embedding_model", "value": "all-MiniLM-L6-v2"},
        {"group": "AI", "key": "min_semantic_score", "value": 0.40}
    ]
    for s in settings_items:
        existing = db.query(AppSetting).filter(AppSetting.key == s["key"]).first()
        if not existing:
            app_s = AppSetting(
                group_name=s["group"],
                key=s["key"],
                value=s["value"]
            )
            db.add(app_s)
    db.commit()
    
    # 7. Seed Policies in DB to match
    policies_meta = [
        {"code": "HR-ONB-001", "title": "Pre-Joining Document Submission Policy", "ver": "1.2", "aud": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER"], "ack": True},
        {"code": "HR-ONB-002", "title": "Academic Qualifications & Education Verification", "ver": "1.1", "aud": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER"], "ack": False},
        {"code": "HR-BGV-001", "title": "Background Verification (BGV) Policy & Protocols", "ver": "2.0", "aud": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER", "COMPLIANCE"], "ack": False},
        {"code": "IT-PRV-001", "title": "IT Asset Provisioning and System Access Policy", "ver": "1.4", "aud": ["IT_ADMIN", "HR_ADMIN", "EMPLOYEE"], "ack": False},
        {"code": "SEC-POL-001", "title": "Information Security and Acceptable Use Policy", "ver": "3.0", "aud": ["EMPLOYEE", "HR_ADMIN", "HR_REVIEWER", "IT_ADMIN", "SYSTEM_ADMIN"], "ack": True},
        {"code": "HR-DAY1-001", "title": "First-Day Office Arrival and Orientation Guide", "ver": "1.3", "aud": ["EMPLOYEE", "HR_ADMIN", "FACILITIES"], "ack": False}
    ]
    for pm in policies_meta:
        existing = db.query(Policy).filter(Policy.code == pm["code"]).first()
        if not existing:
            pol = Policy(
                code=pm["code"],
                title=pm["title"],
                version=pm["ver"],
                audience=pm["aud"],
                departments=["*"],
                locations=["*"],
                roles=["*"],
                grades=["*"],
                requires_ack=pm["ack"],
                chunks_count=5,
                active=True
            )
            db.add(pol)
    db.commit()
    
    # Record Ingestion Run so /hr/ingest updates immediately
    run = IngestionRun(
        dataset="joiners",
        filename="synthetic_seed_cohort.json",
        total_rows=len(joiners_data),
        saved_rows=len(joiners_data),
        failed_rows=0,
        status="Completed",
        error_details=[],
        uploaded_by="Synthetic Data Generator"
    )
    db.add(run)
    db.commit()
    
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()

