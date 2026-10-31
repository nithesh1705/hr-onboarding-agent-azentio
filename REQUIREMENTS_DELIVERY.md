# HR Onboarding Agent — Capabilities Delivery Report

This document outlines how each of the six required capabilities is implemented and fulfilled in the application architecture.

---

### 1. Employee Data Ingestion
- **Implementation:** Built via the `/hr/ingest` data management interface powered by `backend/app/api/ingest.py`, supporting CSV, Excel (`.xlsx`), and JSON formats with dataset schemas for Joiners, Checklist Rules, Department Owners, and Policies.
- **Validation Engine:** Enforces row-level schema checks including mandatory fields, ISO 8601 date formatting (`YYYY-MM-DD`), valid email syntax, and relational references to reporting managers and departments with an audit error log for rejected rows.
- **Sample Seeding:** Provides instantaneous reloading of synthetic recruit cohorts and pre-configured templates with one-click sample CSV generation for each dataset.

---

### 2. Onboarding Checklist Generation
- **Implementation:** Orchestrated by `backend/app/services/checklist_engine.py`, which evaluates incoming joiner profiles against dynamic rule matrices to construct personalized checklists across statutory, IT, facilities, and compliance categories.
- **Rule Explainability:** Every task carries a human-readable `why_explanation` and `rule_code` tag (e.g., explaining why engineering roles require academic verification, or why InfoSec acknowledgement must precede production access).
- **Owner & Due-Date Resolution:** Dynamically binds SLA owners (HR, Reviewer, IT, Facilities) and calculates timeline anchors (e.g., `JOINING_DATE - 7 days`) with blocking gate flags to prevent Day-1 unauthorized entry.

---

### 3. Document Submission and Tracking
- **Implementation:** Employees submit statutory files through the Document Workspace (`/me/documents`), with files archived into Google Cloud Storage under `joiners/{joiner_id}/documents/{category}/` and streamed inline via `GET /api/v1/documents/{id}/file`.
- **Status Lifecycle:** Tracks lifecycle progression across all five mandatory states: `Not Submitted`, `Submitted`, `Under Review`, `Accepted`, and `Correction Requested`.
- **Reviewer Feedback Loop:** When corrections are requested, rejection reasons and employee-facing instructions are displayed on the employee card for immediate re-upload, with past revisions tracked in document version history.

---

### 4. Document and Record Validation
- **Implementation:** Evaluated by `backend/app/services/doc_extraction.py`, which validates MIME types (PDF, JPEG, PNG), file size limits (≤ 10MB), and document expiration against scheduled joining dates.
- **Side-by-Side Verification:** Compares extracted metadata (legal name, dates, document numbers) side-by-side with profile records in the Reviewer Workspace (`/review/documents/:id`), automatically highlighting discrepancies and mismatches in red.
- **Adjudication Controls:** Enables HR reviewers to claim items, adjudicate findings with custom remarks, and trigger follow-up alerts or escalations to department heads.

---

### 5. Conversational Assistance
- **Implementation:** Implemented as a hybrid RAG assistant (`/me/assistant`) powered by Elasticsearch Cloud (BM25 + 384-dimensional dense vectors + RRF fusion) and Google Vertex AI (`gemini-3.5-flash`).
- **Grounded Responses:** Enforces strict role and location filters during Elasticsearch retrieval, citing exact policy codes and sections (e.g., `[HR-ONB-001 Section 2.1]`) with direct clickable policy viewing.
- **Hallucination Prevention:** Includes strict refusal mechanisms requiring the AI model to decline answering if approved policy sources do not contain the answer, preventing invented requirements.

---

### 6. Onboarding Progress Dashboard
- **Implementation:** Delivered through `H1_Dashboard.tsx` and `H2_Joiners.tsx` supported by `backend/app/api/dashboard.py`, visualizing real-time metrics, Day-1 readiness percentages, and critical-path bottlenecks.
- **Task Categorization:** Explicitly breaks down progress into completed, pending, blocked, and overdue tasks with automated health signals and single-click reminder nudges.
- **Filtering & Drill-Down:** Provides multi-attribute filtering across joining dates, business departments, office locations, and readiness statuses, enabling HR administrators to open any employee record to inspect the complete operational checklist.

