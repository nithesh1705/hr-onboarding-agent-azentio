# Intelligent HR Onboarding & Statutory Compliance Automation Platform

## 1. Executive Summary
The **Intelligent HR Onboarding Platform** is an enterprise-grade, cloud-native application designed to automate, govern, and streamline the end-to-end employee onboarding lifecycle. It eliminates manual administrative friction by transforming static paperwork into a dynamic, rule-driven workflow—from batch candidate ingestion and role-tailored checklists to AI-powered document verification, policy grounding, and automated cross-departmental provisioning.

---

## 2. Core Architecture & Technology Stack

The platform is built on modern, cloud-native microservices architecture deployed to Google Cloud Platform:

```
+-------------------------------------------------------------------------------------------------+
|                                    CLOUD-NATIVE ARCHITECTURE                                    |
+-------------------------------------------------------------------------------------------------+
|  React 18 + Vite (Tailwind UI)  -->  FastAPI (Python 3.11)  -->  Cloud SQL (MySQL)              |
|  (Cloud Run: Frontend)               (Cloud Run: Backend)        GCS (Structured Document Lake) |
|                                                                  Elasticsearch (RAG Policies)   |
|                                                                  Elastic Email (SLA / Alerts)   |
+-------------------------------------------------------------------------------------------------+
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Dark/Light theme support.
- **Backend**: Python 3.11, FastAPI REST API, SQLAlchemy ORM, Pydantic data schemas.
- **Relational Database**: Google Cloud SQL MySQL (`possible-cocoa-513307-a9:us-east1:free-trial-first-project`, database `hr_onboarding`).
- **Object Storage**: Google Cloud Storage (`gs://possible-cocoa-513307-a9-hr-storage`) with structured folder hierarchies (`policies/`, `joiners/{id}/documents/{doc_type}/`, `templates/`).
- **Search & Knowledge Base**: Elasticsearch with BM25 keyword matching and vector embeddings for grounded policy retrieval (RAG).
- **AI & NLP Engine**: Two-stage document processing pipeline combining PyMuPDF (`fitz`), text/image stream analysis, fuzzy token matching (RapidFuzz), and Vertex AI / Gemini API integration.
- **Email Infrastructure**: Elastic Email connector (`hr-onboarding`) integrated via Kibana and direct REST API triggers for event-driven alerts.

---

## 3. Key Capabilities & Functional Modules

### 3.1 Multi-Format Data Ingestion Engine
- Ingests new-joiner profiles, statutory requirement rules, department ownership matrices, and governance policies.
- Accepts **CSV**, **Microsoft Excel (`.xlsx`)**, and **JSON (`.json`)** formats.
- Performs row-level validation:
  - Mandatory field presence.
  - ISO 8601 date parsing (`YYYY-MM-DD`) and tolerance for native Excel datetime stamps.
  - Email format validation.
  - Referential integrity to departments and reporting managers.
- Provides downloadable templates with **2 pre-configured sample records each** in CSV, XLSX, and JSON formats, along with on-screen live data previews.

### 3.2 Dynamic Role-Based Checklist Engine
- Automatically generates individualized day-1 checklists upon joiner creation.
- Dynamically assigns tasks and document requirements based on candidate role, grade, department, and location.
- Explains the exact governing business rule behind every item (e.g., `DOC-ID-01` for identity verification, `IT-PRV-01` for VPN setup, `POL-SEC-01` for InfoSec compliance).
- Evaluates task SLA offsets relative to scheduled joining dates and identifies Day-1 blocking compliance gates.

### 3.3 Two-Stage AI Document Processing & Extraction Engine
- **Stage 1: AI Document Validation (Checking if document is PROPER)**:
  - File integrity, stream corruption, and 300 DPI legibility verification.
  - **Category Relevance & Classification**: Analyzes document markers to verify if the file matches the requested slot (e.g., detecting and rejecting an educational degree uploaded into a government photo ID slot).
  - **Document Expiry Verification**: Extracts expiration dates and validates them against the candidate's scheduled joining date.
  - **Candidate Identity Matching**: Compares legal names using fuzzy token matching (handling inverted names and middle initials).
- **Stage 2: AI Data Collection (Structured Field Extraction)**:
  - Extracts `full_name`, `date_of_birth`, masked `document_number` (`••••-••••-XXXX`), `expiry_date`, `issuing_authority`, and document classification.
  - Computes AI confidence score (e.g., 98%) and validation summary notes.
- **Reviewer Workspace**:
  - Displays side-by-side comparison of official HR profile data against extracted document values.
  - Highlights discrepancies (name mismatches, expired documents) in real-time.
  - Provides 1-click decision actions: **Accept**, **Request Correction**, or **Escalate**, complete with confidential reviewer remarks.

### 3.4 Grounded Conversational AI Assistant
- Exclusively accessible to candidates (`EMPLOYEE` role) to eliminate confusion and reduce repetitive queries.
- Answers questions about company policies, statutory deadlines, leave allowances, and benefits.
- Grounded strictly in indexed policy documents from Elasticsearch, citing exact policy references without hallucinating requirements.

### 3.5 Automated Communications & Follow-Up System
- **Document Upload Alerts**: Automatically triggers notification emails to assigned reviewers via Elastic Email when any new document is submitted.
- **HR Follow-Up Mail Dispatcher**: Allows HR Admins and Reviewers to send custom reminders and follow-up emails directly from candidate profile views, featuring:
  - Pre-filled candidate details and customizable email templates.
  - Editable recipient field supporting alternate email addresses.

### 3.6 Onboarding Progress & Analytics Dashboard
- Visualizes real-time status: **Completed**, **Pending**, **Blocked**, and **Overdue** tasks.
- Filters candidates by joining date, department, location, and Day-1 readiness status.
- Single-click drill-down into individual candidate checklists, audit histories, and provisioning statuses.

---

## 4. User Roles & Permission Model

| Role | Responsibilities & UI Features |
| :--- | :--- |
| **New Joiner (Employee)** | Interactive checklist, policy reading & digital signature, document uploads with instant AI feedback, and access to the grounded AI Onboarding Assistant. |
| **HR Reviewer** | Reviewer Workspace for inspecting submitted documents, viewing side-by-side AI extraction comparisons, logging confidential remarks, and approving or requesting corrections. |
| **HR Admin** | Full joiner management, single joiner provisioning, batch ingestion, pipeline oversight, custom email follow-up dispatching, and SLA breach tracking. |
| **IT Admin** | Hardware provisioning queues (laptops, peripherals), corporate email & SSO generation, and access-tunnel readiness. |
| **System Admin** | Global audit logs, cloud storage hierarchy inspection, Elasticsearch RAG vector synchronization, and system configuration. |

---

## 5. Live Production Cloud Deployments

| Component | Production URL |
| :--- | :--- |
| **Frontend Application** | [https://hr-onboarding-frontend-621277707617.us-east1.run.app](https://hr-onboarding-frontend-621277707617.us-east1.run.app) |
| **Backend REST API** | [https://hr-onboarding-backend-621277707617.us-east1.run.app](https://hr-onboarding-backend-621277707617.us-east1.run.app) |
| **Swagger API Documentation** | [https://hr-onboarding-backend-621277707617.us-east1.run.app/docs](https://hr-onboarding-backend-621277707617.us-east1.run.app/docs) |
| **Cloud Storage Bucket** | `gs://possible-cocoa-513307-a9-hr-storage` |
| **Cloud SQL Instance** | `possible-cocoa-513307-a9:us-east1:free-trial-first-project` (`hr_onboarding`) |
| **Elasticsearch Service** | `https://my-elasticsearch-project-a68187.es.us-east-1.aws.elastic.cloud:443` |
| **Elastic Email Connector** | Connector ID `hr-onboarding` |

