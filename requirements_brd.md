# HR Onboarding Agent: Business Requirements Document (BRD)

| | |
| --- | --- |
| **Category** | AI for HR Operations & Employee Lifecycle Automation |
| **Applicable Domains** | Human Resources, IT, Administration, Compliance and Enterprise Operations |
| **Focus** | New Employee Onboarding, Document Collection, Task Orchestration, Policy Assistance and Onboarding Readiness |

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Challenge](#2-challenge)
3. [Onboarding Scenarios to Be Addressed](#3-onboarding-scenarios-to-be-addressed)
4. [Level 1: Manage Employee Onboarding Requirements](#4-level-1-manage-employee-onboarding-requirements)
5. [Expected Submission](#5-expected-submission)

---

## 1. Problem Statement

Employee onboarding involves several departments and activities, including:

- Offer acceptance
- Document collection
- Identity and background verification
- HR record creation
- IT provisioning
- Policy acknowledgement
- Training and orientation

A smooth onboarding experience helps new employees become productive quickly and creates a positive first impression of the organisation.

These activities are frequently coordinated through emails, spreadsheets and separate HR, IT and facilities applications. Missing documents, unclear responsibilities and delayed approvals can prevent employees from being fully prepared on their joining date. New joiners may arrive without a laptop, system access or a completed employee record, while HR teams spend considerable time chasing documents and following up with other departments.

### Example

A new software engineer joining in Bengaluru may require:

- Identity documents
- Education certificates
- A background verification check
- A laptop
- An email account
- Access to development tools
- Completion of an information security policy acknowledgement

If the laptop request cannot be raised until the employee record is created, and the employee record cannot be created until documents are verified, a single delayed document can affect the entire onboarding plan.

```
Documents verified  →  Employee record created  →  Laptop / email / access requested
        ↑
 One delayed document blocks everything downstream
```

---

## 2. Challenge

Build an **AI-powered HR Onboarding Agent** that coordinates the employee onboarding journey, identifies outstanding requirements, executes approved workflows and provides employees and HR teams with clear progress visibility.

### Key expectations

- **Conversational support.** The agent supports new employees through a conversational interface while managing actual onboarding tasks and records in the application.
- **Grounded answers.** It must answer questions using approved policy information.
- **Task execution.** It must initiate tasks through backend services.
- **Stakeholder visibility.** It must keep every stakeholder informed of what is pending and who is responsible.
- **Handling change.** Joining dates move, roles are revised and documents are rejected. The application should recalculate affected tasks and deadlines rather than requiring HR teams to rebuild the onboarding plan manually.
- **Innovation encouraged.** Participants are encouraged to introduce additional onboarding automation capabilities and innovative approaches beyond the specified scenarios. Solutions demonstrating measurable improvements in onboarding readiness and employee experience will receive additional consideration within the evaluation framework.

> **Evaluation note:** The organiser will assess actual application behaviour rather than a static dashboard, predefined presentation or standalone AI-generated response.

---

## 3. Onboarding Scenarios to Be Addressed

The solution should consider the following onboarding scenarios. These represent practical challenges faced by HR teams and provide the basis for progressive evaluation.

### Scenario 1: Pre-Joining Document Collection and Correction

The application should request the documents required for the employee's role and location, validate submissions and identify missing, expired, illegible or incorrect documents. Where a document is rejected, the employee should receive a clear explanation and a request for correction.

### Scenario 2: Employee Profile Creation and IT Provisioning

Once required information is approved, the application should populate a structured HR record and initiate provisioning requests for a laptop, email account and role-specific application access.

### Scenario 3: Role-Specific Onboarding and Policy Acknowledgement

Onboarding requirements may differ by department, role, grade and location. The application should apply the correct template, present the relevant policies and record each acknowledgement.

### Scenario 4: Joining-Date and Role Changes

A joining date may be brought forward or postponed, or a role may change before joining. The application should update dependent tasks, deadlines and owners accordingly.

### Scenario 5: Employee Questions and Delayed Approvals

New employees may ask about onboarding steps, documents, first-day arrangements or company policies. Where tasks are blocked because an approval is overdue, the application should escalate to the correct owner.

### Scenario summary

| # | Scenario | Core outcome |
| --- | --- | --- |
| 1 | Pre-joining document collection and correction | Right documents requested, validated, and corrected with clear explanations |
| 2 | Employee profile creation and IT provisioning | HR record populated; laptop, email and access requested |
| 3 | Role-specific onboarding and policy acknowledgement | Correct template applied; every acknowledgement recorded |
| 4 | Joining-date and role changes | Dependent tasks, deadlines and owners recalculated automatically |
| 5 | Employee questions and delayed approvals | Grounded answers; overdue approvals escalated to the right owner |

---

## 4. Level 1: Manage Employee Onboarding Requirements

| | |
| --- | --- |
| **Suggested time** | 0 to 3 hours |
| **Objective** | Build a working application that creates employee onboarding records, generates role-appropriate checklists, tracks documents and provides grounded AI-assisted guidance. |

### Required Capabilities

### 4.1 Employee Data Ingestion

Build an application that allows users to upload or select synthetic onboarding information. The application should support the following sample data:

- New-joiner profiles containing name, role, grade, department, location, manager and joining date
- Onboarding requirements by role, department and location
- Policy documents and onboarding process guides
- Department owners for HR, IT, facilities and compliance tasks

The application should accept **CSV, Excel and JSON** formats and must validate:

- Mandatory fields
- Date formats
- References to managers and departments

### 4.2 Onboarding Checklist Generation

Generate a role-appropriate checklist for each new joiner containing required documents, activities, responsible owners and due dates.

| Checklist item | Example rule |
| --- | --- |
| Identity and address documents | Required for all employees before joining |
| Education certificates | Required for roles that specify minimum qualifications |
| Background verification | Required before system access is granted |
| Laptop and email provisioning | Requested after the HR record is created |
| Information security acknowledgement | Required before access to production systems |

The application should **explain which rule caused each item to be included**.

### 4.3 Document Submission and Tracking

Allow employees to upload documents and track the submission status of each required item.

Status values should include:

| Status |
| --- |
| Not Submitted |
| Submitted |
| Under Review |
| Accepted |
| Correction Requested |

### 4.4 Document and Record Validation

Identify:

- Missing mandatory information
- Incorrect file types
- Expired documents
- Incomplete records

Where sample document extraction is used, extracted values such as names and dates should be compared with the employee profile and any mismatch should be highlighted.

### 4.5 Conversational Assistance

Provide a conversational assistant that answers onboarding questions using approved policy and process information.

**Example question:** "Which documents do I need to submit before my joining date?"

The answer must:

- Be specific to the employee's role and location
- Include a reference to the source policy
- Not invent requirements

### 4.6 Onboarding Progress Dashboard

Develop a dashboard that displays **completed, pending, blocked and overdue** tasks for each new joiner.

Users should be able to:

- Filter by **joining date, department, location and status**
- Open an employee record to view the full checklist

### Level 1 capability checklist

- [ ] Employee data ingestion (CSV, Excel, JSON) with validation
- [ ] Role-based checklist generation with rule explanations
- [ ] Document submission and status tracking
- [ ] Document and record validation, including extraction mismatch highlighting
- [ ] Grounded conversational assistant with policy references
- [ ] Onboarding progress dashboard with filters and employee record view

---

## 5. Expected Submission

A working onboarding application demonstrating:

1. Employee data ingestion
2. Role-based checklists
3. Document tracking
4. Validation
5. Grounded conversational assistance
6. A progress dashboard
