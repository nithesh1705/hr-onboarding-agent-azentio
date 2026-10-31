import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import Joiner, IngestionRun, AuditLog, User, RequirementRule, DepartmentOwner, Policy, Task
from app.core.deps import get_current_user, require_roles
from app.core.security import hash_password
from app.services.checklist_engine import generate_checklist_for_joiner, recalculate_readiness

router = APIRouter(prefix="/ingest", tags=["Data Ingestion"])

REQUIRED_FIELDS_BY_DATASET = {
    "joiners": ["full_name", "email", "role", "department", "location", "manager_name", "manager_email", "joining_date"],
    "requirements": ["code", "title", "item_type", "owner_function", "due_offset_days"],
    "owners": ["function_name", "department", "owner_name", "owner_email"],
    "policies": ["code", "title", "category"]
}

DATASET_SCHEMAS = {
    "joiners": {
        "title": "Joiner Records (Employee Profiles)",
        "description": "Statutory recruit data used to initialize onboarding pipelines and generate dynamic day-1 checklists.",
        "mandatory": ["full_name", "email", "role", "department", "location", "manager_name", "manager_email", "joining_date"],
        "optional": ["phone", "grade", "notes"],
        "headers": ["full_name", "email", "phone", "role", "grade", "department", "location", "manager_name", "manager_email", "joining_date", "notes"],
        "samples": [
            ["Tanvi Rao", "tanvi.rao@example.com", "+91 98450 99887", "Cloud Architect", "L5", "Engineering", "Bengaluru", "Karthik Subramaniam", "karthik.s@company.com", "2026-11-20", "Senior lateral hire"],
            ["Rohan Deshmukh", "rohan.d@example.com", "+91 98210 44321", "Data Analyst", "L4", "Analytics", "Mumbai", "Pooja Hegde", "pooja.h@company.com", "2026-11-25", "Product analytics specialist"]
        ],
        "sample": ["Tanvi Rao", "tanvi.rao@example.com", "+91 98450 99887", "Cloud Architect", "L5", "Engineering", "Bengaluru", "Karthik Subramaniam", "karthik.s@company.com", "2026-11-20", "Senior lateral hire"]
    },
    "requirements": {
        "title": "Checklist Rules (Statutory & IT Gates)",
        "description": "Rule definitions mapped to onboarding categories, SLA offsets, and blocking compliance gates.",
        "mandatory": ["code", "title", "item_type", "owner_function", "due_offset_days"],
        "optional": ["category", "anchor", "is_blocking", "linked_policy_code", "explanation"],
        "headers": ["code", "title", "item_type", "category", "owner_function", "due_offset_days", "anchor", "is_blocking", "linked_policy_code", "explanation"],
        "samples": [
            ["DOC-MED-01", "Medical Fitness Certificate", "Document", "Health & Safety", "HR", "-5", "JOINING_DATE", "true", "HR-ONB-001", "Mandatory pre-joining medical clearance"],
            ["IT-VPN-02", "Remote Access & Production VPN Setup", "IT_Provisioning", "IT Systems", "IT", "-2", "JOINING_DATE", "true", "POL-IT-002", "Secure tunnel access for engineering and production environments"]
        ],
        "sample": ["DOC-MED-01", "Medical Fitness Certificate", "Document", "Health & Safety", "HR", "-5", "JOINING_DATE", "true", "HR-ONB-001", "Mandatory pre-joining medical clearance"]
    },
    "owners": {
        "title": "Department Owners & Backups",
        "description": "Function and departmental ownership matrix for task escalation paths and SLA breach notifications.",
        "mandatory": ["function_name", "department", "owner_name", "owner_email"],
        "optional": ["backup_owner_name", "backup_owner_email", "dept_head_name", "dept_head_email"],
        "headers": ["function_name", "department", "owner_name", "owner_email", "backup_owner_name", "backup_owner_email", "dept_head_name", "dept_head_email"],
        "samples": [
            ["HR", "Engineering", "Sarah Jenkins", "sarah.j@company.com", "Anand Rao", "anand.r@company.com", "Kavita Reddy", "kavita.r@company.com"],
            ["IT", "All Departments", "Deepak Nair", "deepak.n@company.com", "Priya Sen", "priya.s@company.com", "Vikram Malhotra", "vikram.m@company.com"]
        ],
        "sample": ["HR", "Engineering", "Sarah Jenkins", "sarah.j@company.com", "Anand Rao", "anand.r@company.com", "Kavita Reddy", "kavita.r@company.com"]
    },
    "policies": {
        "title": "Corporate & Compliance Policies",
        "description": "Internal and statutory governance policies indexed into Elasticsearch knowledge base for employee grounding.",
        "mandatory": ["code", "title", "category"],
        "optional": ["version", "audience", "departments", "locations", "roles", "requires_ack"],
        "headers": ["code", "title", "version", "category", "audience", "departments", "locations", "roles", "requires_ack"],
        "samples": [
            ["POL-HR-007", "Remote Working and Travel Expense Policy", "1.0", "Workplace", "EMPLOYEE;HR_ADMIN", "*", "Bengaluru;Mumbai;Remote", "*", "true"],
            ["POL-SEC-004", "Information Security & Data Protection Standard", "2.1", "Security", "EMPLOYEE", "Engineering;Product;IT", "*", "*", "true"]
        ],
        "sample": ["POL-HR-007", "Remote Working and Travel Expense Policy", "1.0", "Workplace", "EMPLOYEE;HR_ADMIN", "*", "Bengaluru;Mumbai;Remote", "*", "true"]
    }
}

@router.get("/schema/{dataset}")
def get_dataset_schema(dataset: str):
    """
    Returns the distinct column specification and sample row for the selected dataset.
    """
    ds = dataset.lower()
    if ds not in DATASET_SCHEMAS:
        raise HTTPException(status_code=404, detail=f"Unknown dataset '{dataset}'. Supported: joiners, requirements, owners, policies")
    return DATASET_SCHEMAS[ds]

@router.post("/{dataset}")
async def ingest_file(
    dataset: str,
    file: UploadFile = File(...),
    generate_checklists: bool = Form(True),
    current_user: User = Depends(require_roles(["HR_ADMIN", "SYSTEM_ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Ingests and validates CSV, Excel or JSON dataset.
    Supports joiners, requirements, owners, and policies with row-level validation.
    """
    ds = dataset.lower()
    if ds not in DATASET_SCHEMAS:
        raise HTTPException(status_code=400, detail=f"Unsupported dataset '{dataset}'. Supported: joiners, requirements, owners, policies")

    content = await file.read()
    filename = file.filename
    errors = []
    saved_rows = 0
    total_rows = 0
    
    rows = []
    if filename.endswith(".json"):
        try:
            rows = json.loads(content.decode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {e}")
    elif filename.endswith((".xlsx", ".xls")):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            headers = [str(cell.value or "").strip() for cell in sheet[1]]
            rows = []
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if any(row):
                    row_dict = {}
                    for i, val in enumerate(row):
                        if i < len(headers):
                            k = headers[i]
                            if val is None:
                                v_str = ""
                            elif isinstance(val, (datetime, )):
                                v_str = val.strftime("%Y-%m-%d")
                            else:
                                v_str = str(val).strip()
                                if " 00:00:00" in v_str:
                                    v_str = v_str.replace(" 00:00:00", "")
                            row_dict[k] = v_str
                    rows.append(row_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Excel format: {e}")
    else:
        try:
            csv_text = content.decode("utf-8", errors="ignore")
            reader = csv.DictReader(io.StringIO(csv_text))
            rows = list(reader)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {e}")
            
    total_rows = len(rows)
    required_fields = REQUIRED_FIELDS_BY_DATASET.get(ds, [])

    for idx, row in enumerate(rows):
        row_num = idx + 2  # considering header line
        
        # 1. Validate mandatory fields
        missing = [f for f in required_fields if not row.get(f) or not str(row.get(f)).strip()]
        if missing:
            errors.append({
                "row": row_num,
                "field": ", ".join(missing),
                "value": "Missing",
                "message": f"Mandatory field(s) missing: {', '.join(missing)}"
            })
            continue

        # 2. Dataset-specific validation and upsert
        if ds == "joiners":
            email = row.get("email", "").strip()
            if "@" not in email or "." not in email:
                errors.append({
                    "row": row_num,
                    "field": "email",
                    "value": email,
                    "message": "Invalid email address format."
                })
                continue
                
            jdate = row.get("joining_date", "").strip()
            try:
                datetime.strptime(jdate, "%Y-%m-%d")
            except Exception:
                errors.append({
                    "row": row_num,
                    "field": "joining_date",
                    "value": jdate,
                    "message": "Invalid date format. Expected YYYY-MM-DD."
                })
                continue
                
            existing = db.query(Joiner).filter(Joiner.email == email).first()
            if existing:
                existing.full_name = row.get("full_name")
                existing.role = row.get("role")
                existing.department = row.get("department")
                existing.location = row.get("location")
                existing.manager_name = row.get("manager_name")
                existing.manager_email = row.get("manager_email")
                existing.joining_date = jdate
                joiner = existing
            else:
                joiner = Joiner(
                    full_name=row.get("full_name"),
                    email=email,
                    phone=row.get("phone", ""),
                    role=row.get("role"),
                    grade=row.get("grade", "L4"),
                    department=row.get("department"),
                    location=row.get("location"),
                    manager_name=row.get("manager_name"),
                    manager_email=row.get("manager_email"),
                    joining_date=jdate,
                    notes=row.get("notes", "")
                )
                db.add(joiner)
                db.flush()
                
            if row.get("phone"):
                joiner.phone = row.get("phone")
            if row.get("grade"):
                joiner.grade = row.get("grade")
                
            # Create or update user login account for joiner
            user_emp = db.query(User).filter(User.email == email).first()
            if not user_emp:
                user_emp = User(
                    email=email,
                    name=joiner.full_name,
                    role="EMPLOYEE",
                    status="Active",
                    password_hash=hash_password("Welcome@123"),
                    department=joiner.department,
                    joiner_id=joiner.id
                )
                db.add(user_emp)
            else:
                user_emp.joiner_id = joiner.id
                user_emp.name = joiner.full_name
                user_emp.department = joiner.department

            if generate_checklists:
                generate_checklist_for_joiner(db, joiner)
            recalculate_readiness(db, joiner.id)
            saved_rows += 1

        elif ds == "requirements":
            code = row.get("code", "").strip().upper()
            existing_rule = db.query(RequirementRule).filter(RequirementRule.code == code).first()
            due_offset = 0
            try:
                due_offset = int(row.get("due_offset_days", 0))
            except ValueError:
                pass
            is_blocking = str(row.get("is_blocking", "false")).lower() in ["true", "1", "yes"]

            if existing_rule:
                existing_rule.title = row.get("title")
                existing_rule.item_type = row.get("item_type", "Document")
                existing_rule.category = row.get("category", "General")
                existing_rule.owner_function = row.get("owner_function", "HR")
                existing_rule.due_offset_days = due_offset
                existing_rule.anchor = row.get("anchor", "JOINING_DATE")
                existing_rule.is_blocking = is_blocking
                existing_rule.linked_policy_code = row.get("linked_policy_code")
                existing_rule.explanation = row.get("explanation", "")
            else:
                rule = RequirementRule(
                    code=code,
                    title=row.get("title"),
                    item_type=row.get("item_type", "Document"),
                    category=row.get("category", "General"),
                    owner_function=row.get("owner_function", "HR"),
                    due_offset_days=due_offset,
                    anchor=row.get("anchor", "JOINING_DATE"),
                    is_blocking=is_blocking,
                    linked_policy_code=row.get("linked_policy_code"),
                    explanation=row.get("explanation", "")
                )
                db.add(rule)
            saved_rows += 1

        elif ds == "owners":
            func = row.get("function_name", "").strip().upper()
            dept = row.get("department", "").strip()
            existing_owner = db.query(DepartmentOwner).filter(
                DepartmentOwner.function_name == func,
                DepartmentOwner.department == dept
            ).first()

            if existing_owner:
                existing_owner.owner_name = row.get("owner_name")
                existing_owner.owner_email = row.get("owner_email")
                existing_owner.backup_owner_name = row.get("backup_owner_name")
                existing_owner.backup_owner_email = row.get("backup_owner_email")
                existing_owner.dept_head_name = row.get("dept_head_name")
                existing_owner.dept_head_email = row.get("dept_head_email")
            else:
                owner = DepartmentOwner(
                    function_name=func,
                    department=dept,
                    owner_name=row.get("owner_name"),
                    owner_email=row.get("owner_email"),
                    backup_owner_name=row.get("backup_owner_name"),
                    backup_owner_email=row.get("backup_owner_email"),
                    dept_head_name=row.get("dept_head_name"),
                    dept_head_email=row.get("dept_head_email")
                )
                db.add(owner)
            saved_rows += 1

        elif ds == "policies":
            pcode = row.get("code", "").strip().upper()
            existing_policy = db.query(Policy).filter(Policy.code == pcode).first()
            
            # Helper to parse list from comma / semicolon separated values
            def parse_csv_list(val: Optional[str]) -> List[str]:
                if not val or val.strip() == "*":
                    return ["*"]
                return [x.strip() for x in val.replace(";", ",").split(",") if x.strip()]

            audience = parse_csv_list(row.get("audience"))
            if audience == ["*"]:
                audience = ["EMPLOYEE", "HR_ADMIN"]
            departments = parse_csv_list(row.get("departments"))
            locations = parse_csv_list(row.get("locations"))
            roles = parse_csv_list(row.get("roles"))
            requires_ack = str(row.get("requires_ack", "false")).lower() in ["true", "1", "yes"]

            if existing_policy:
                existing_policy.title = row.get("title")
                existing_policy.version = row.get("version", "1.0")
                existing_policy.category = row.get("category", "General")
                existing_policy.audience = audience
                existing_policy.departments = departments
                existing_policy.locations = locations
                existing_policy.roles = roles
                existing_policy.requires_ack = requires_ack
            else:
                policy = Policy(
                    code=pcode,
                    title=row.get("title"),
                    version=row.get("version", "1.0"),
                    category=row.get("category", "General"),
                    audience=audience,
                    departments=departments,
                    locations=locations,
                    roles=roles,
                    requires_ack=requires_ack
                )
                db.add(policy)
            saved_rows += 1

    db.commit()

    # Cascade changes across the system
    try:
        if ds == "requirements":
            # Re-evaluate all joiner checklists so new rules take effect
            all_joiners = db.query(Joiner).all()
            for j in all_joiners:
                generate_checklist_for_joiner(db, j)
                recalculate_readiness(db, j.id)

        elif ds == "owners":
            # Update owner names in all matching open tasks
            for owner in db.query(DepartmentOwner).all():
                tasks_to_update = db.query(Task).join(Joiner).filter(
                    Joiner.department == owner.department,
                    Task.owner_function == owner.function_name
                ).all()
                for t in tasks_to_update:
                    t.owner_name = owner.owner_name

        elif ds == "policies":
            # Ingest policies into Elasticsearch vector knowledge base
            try:
                from app.services.rag.ingest import ingest_policy_data
                ingest_policy_data()
            except Exception as es_err:
                print(f"Warning: Elasticsearch sync error during policy ingest: {es_err}")

        db.commit()
    except Exception as cascade_err:
        print(f"Warning: Cascading update error during ingest: {cascade_err}")
    
    # Record ingestion run
    run = IngestionRun(
        dataset=ds,
        filename=filename,
        total_rows=total_rows,
        saved_rows=saved_rows,
        failed_rows=len(errors),
        status="Completed" if len(errors) == 0 else ("Completed with errors" if saved_rows > 0 else "Failed"),
        error_details=errors,
        uploaded_by=current_user.name
    )
    db.add(run)
    db.commit()
    
    return {
        "run_id": run.id,
        "dataset": ds,
        "filename": filename,
        "total_rows": total_rows,
        "saved_rows": saved_rows,
        "failed_rows": len(errors),
        "status": run.status,
        "errors": errors
    }

@router.get("/runs")
def list_ingestion_runs(db: Session = Depends(get_db)):
    return db.query(IngestionRun).order_by(IngestionRun.created_at.desc()).limit(20).all()

def generate_template_response(dataset: str, file_format: str = "csv"):
    ds = dataset.lower()
    schema = DATASET_SCHEMAS.get(ds)
    if not schema:
        raise HTTPException(status_code=404, detail=f"No template available for dataset '{dataset}'")

    fmt = file_format.lower().strip()
    headers = schema["headers"]
    samples = schema.get("samples", [schema.get("sample", [])])

    if fmt in ["xlsx", "excel"]:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = ds.capitalize()

        # Styled header
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")

        ws.append(headers)
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # 2 sample records
        for sample in samples:
            ws.append(sample)

        # Auto-fit column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 15)

        buf = io.BytesIO()
        wb.save(buf)
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{ds}_sample_template.xlsx"'}
        )

    elif fmt == "json":
        records = [dict(zip(headers, sample)) for sample in samples]
        json_str = json.dumps(records, indent=2)
        return Response(
            content=json_str,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{ds}_sample_template.json"'}
        )

    else:
        # Default: CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        for sample in samples:
            writer.writerow(sample)

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{ds}_sample_template.csv"'}
        )

@router.get("/template/{dataset}")
def download_template(dataset: str, format: Optional[str] = Query(None)):
    """
    Downloads sample ingestion template containing 2 complete sample records.
    Supports ?format=csv, ?format=xlsx, and ?format=json.
    """
    return generate_template_response(dataset, format or "csv")

@router.get("/template/{dataset}/{file_format}")
def download_template_by_format(dataset: str, file_format: str):
    """
    Direct route to download template in CSV, XLSX, or JSON format with 2 sample records.
    """
    return generate_template_response(dataset, file_format)

