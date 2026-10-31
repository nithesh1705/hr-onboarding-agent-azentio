# HR Onboarding Agent

A complete, enterprise-grade HR Onboarding Agent platform running on **Google Cloud Platform (GCP)**:
- **Cloud Run (Frontend)**: [https://hr-onboarding-frontend-621277707617.us-east1.run.app](https://hr-onboarding-frontend-621277707617.us-east1.run.app)
- **Cloud Run (FastAPI Backend)**: [https://hr-onboarding-backend-621277707617.us-east1.run.app](https://hr-onboarding-backend-621277707617.us-east1.run.app)
- **API Documentation**: [https://hr-onboarding-backend-621277707617.us-east1.run.app/docs](https://hr-onboarding-backend-621277707617.us-east1.run.app/docs)
- **Cloud SQL**: MySQL 8.4 instance `free-trial-first-project` on project `possible-cocoa-513307-a9`
- **Vertex AI**: Gemini 3.5-flash with grounded retrieval
- **Observability**: Google Cloud Logging and Google Cloud Trace
- **Hybrid RAG**: Elasticsearch Cloud (BM25 + Dense vector embeddings + RRF fusion)

---

## 🌟 Architecture & Services

1. **Google Cloud Run**:
   - `hr-onboarding-frontend`: React 18 SPA served via Nginx reverse proxy routing API calls seamlessly to backend.
   - `hr-onboarding-backend`: FastAPI container with 2 vCPU and 2GB RAM connecting to Cloud SQL via unix socket `/cloudsql/possible-cocoa-513307-a9:us-east1:free-trial-first-project`.

2. **Google Cloud SQL (MySQL 8.4)**:
   - Instance: `free-trial-first-project`
   - Database: `hr_onboarding`
   - 19 tables created and seeded with realistic test joiners, requirements, policies, and IT catalogue items.

3. **Vertex AI & Hybrid Search**:
   - Project: `possible-cocoa-513307-a9` (Region: `us-central1`)
   - Model: `gemini-3.5-flash` with grounded policy citation checks.
   - RAG Knowledge Base: Elasticsearch Cloud `policy_chunks_v1` behind alias `policy_chunks`.
   - Refusal flow: Triggered when confidence falls below 0.65 threshold: *"I can't find that in the approved onboarding policies. I've let HR know."*

4. **Cloud Observability**:
   - Integrated with Google Cloud Logging (`google-cloud-logging`).
   - Integrated with Google Cloud Trace (`google-cloud-trace`).

---

## 🔑 Demo Quick-Switch & Accounts

Default password for all users: `Welcome@123`

| Role | Demo Email | Name | Default Workspace |
| :--- | :--- | :--- | :--- |
| **`EMPLOYEE`** | `aditi.sharma@example.com` | Aditi Sharma | `/me` |
| **`HR_ADMIN`** | `priya.nair@company.com` | Priya Nair | `/hr/dashboard` |
| **`HR_REVIEWER`** | `kavita.deshmukh@company.com` | Kavita Deshmukh | `/review/queue` |
| **`IT_ADMIN`** | `rajesh.kumar@company.com` | Rajesh Kumar | `/it/dashboard` |
| **`SYSTEM_ADMIN`** | `vikram.aditya@company.com` | Vikram Aditya | `/admin/dashboard` |

*(Tip: Click the Demo Quick-Switch badge in the top navigation bar to switch roles in 1 click).*
