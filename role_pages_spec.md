# HR Onboarding Agent: Role and Page Specification

Companion to `SSOT.md`, `requirements_brd.md` and the two build prompts. This document defines every page each of the five roles sees, what is on each page, and every action available there.

Last updated: 2026-10-31

---

## Table of contents

1. [How to read this document](#1-how-to-read-this-document)
2. [Entry flow: sign-in is the base](#2-entry-flow-sign-in-is-the-base)
3. [Shared layout and shared pages](#3-shared-layout-and-shared-pages)
4. [Role overview and page inventory](#4-role-overview-and-page-inventory)
5. [Role 1: Employee / New Joiner](#5-role-1-employee--new-joiner)
6. [Role 2: HR Admin](#6-role-2-hr-admin)
7. [Role 3: HR Reviewer](#7-role-3-hr-reviewer)
8. [Role 4: IT Admin](#8-role-4-it-admin)
9. [Role 5: System Admin](#9-role-5-system-admin)
10. [Permission matrix](#10-permission-matrix)
11. [Field-level data visibility](#11-field-level-data-visibility)
12. [Notifications by role](#12-notifications-by-role)
13. [Status reference](#13-status-reference)
14. [Complete route map](#14-complete-route-map)
15. [Backend additions this spec requires](#15-backend-additions-this-spec-requires)
16. [Minimum set for the Level 1 demo](#16-minimum-set-for-the-level-1-demo)

---

## 1. How to read this document

**Role identifiers** (used in code, API and RAG filters): `EMPLOYEE`, `HR_ADMIN`, `HR_REVIEWER`, `IT_ADMIN`, `SYSTEM_ADMIN`.

**Level tags** match the BRD: **L1** = required in the first 3 hours, **L2** = IT provisioning, templates and acknowledgements, **L3** = change handling, escalation, readiness and metrics.

**Page template.** Every page below uses the same structure:

| Block | Meaning |
| --- | --- |
| Route and level | URL, level tag, and who can open it |
| Purpose | One sentence on why the page exists |
| On the page | Every section, table, card and field shown |
| Actions | Everything the user can do, and what each action changes |
| Rules | Permissions, validations and business rules specific to the page |
| API | Endpoints the page calls (existing ones from `SSOT.md`; new ones are marked **NEW** and listed in section 15) |

**Standard states** apply to every list and page and are not repeated: loading skeleton, empty state with a helpful next step, error state with retry and trace id, and a read-only banner when the role may view but not edit.

**Change from earlier docs.** The earlier role switcher (Employee, HR, IT, Manager) is replaced by five real roles with sign-in. Managers remain reference data (`manager_email` on a joiner) but are not a login role.

---

## 2. Entry flow: sign-in is the base

### 2.1 Routing rules

| Situation | Behaviour |
| --- | --- |
| Not signed in, opens any page or `/` | Redirected to `/signin?next=<original path>` |
| Signed in, opens `/` or `/signin` | Redirected to the role's home dashboard (table below) |
| Signed in, opens a page of another role | Shows the 403 page with a "Go to my dashboard" button; the attempt is audited |
| Session expires or is revoked | Redirected to `/signin?reason=expired`; unsent form drafts are kept locally and offered after sign-in |
| After sign-in with a `next` parameter | Goes to `next` only if the role may open it; otherwise the role's home |

### 2.2 Home dashboard per role

| Role | Home route | Home page |
| --- | --- | --- |
| Employee / New Joiner | `/me` | My Onboarding |
| HR Admin | `/hr/dashboard` | Onboarding Progress Dashboard |
| HR Reviewer | `/review/dashboard` | Review Dashboard |
| IT Admin | `/it/dashboard` | Provisioning Dashboard |
| System Admin | `/admin/dashboard` | System Health Dashboard |

### 2.3 Authentication pages (public)

#### A1. Sign in
`/signin` · L1 · public

**Purpose:** the single entry point for all five roles.

**On the page**
- Product logo, name and one-line description
- Email field and password field with show/hide toggle
- "Remember this device" checkbox (extends session to 7 days)
- "Forgot password?" link
- "Sign in with Google" button (shown when SSO is configured by System Admin)
- Inline error area (generic wording: "Email or password is incorrect", never reveals whether the email exists)
- Demo access panel, shown only when `DEMO_MODE=true`: five quick-login buttons (Employee with a joiner selector, HR Admin, HR Reviewer, IT Admin, System Admin) that sign in as seeded users
- Footer: privacy notice link, environment badge when not production

**Actions**
- Submit credentials: on success, store the session and redirect by the rules in 2.1
- Click a demo button: signs in as that seeded user
- Start SSO flow
- Navigate to forgot password

**Rules**
- Account locks for 15 minutes after 5 failed attempts; System Admin is notified of repeated lockouts
- Deactivated users see "Your account is not active. Contact your administrator"
- Users flagged `must_change_password` are sent to `/activate` after sign-in
- Every sign-in, failure and sign-out writes an audit row with IP hint and trace id

**API:** `POST /auth/login` **NEW**, `POST /auth/sso/callback` **NEW**, `GET /auth/me` **NEW**

#### A2. Activate account
`/activate?token=…` · L1 · public (valid token only)

- Shows the invited user's name, email and role (read-only)
- Set password form with strength meter and rules (minimum 12 characters, not a common password)
- Accept the privacy notice checkbox
- Action: set password and sign in. Expired or used token shows "This link has expired" with a "Request a new link" button
- API: `POST /auth/activate` **NEW**

#### A3. Forgot password
`/forgot-password` · L1 · public

- Email field; always answers "If an account exists, we sent a reset link"
- Action: send reset email (link valid 30 minutes, single use)
- API: `POST /auth/forgot` **NEW**

#### A4. Reset password
`/reset-password?token=…` · L1 · public

- New password and confirm fields with the same strength rules
- Action: set password; all other sessions for the user are revoked
- API: `POST /auth/reset` **NEW**

---

## 3. Shared layout and shared pages

### 3.1 Application shell (all signed-in pages)

| Element | Contents |
| --- | --- |
| Top bar | Logo (links to role home), page-scoped search (role-limited), notification bell with unread count and a dropdown of the latest 5, Assistant button (roles that have one), user menu |
| User menu | Name, email, role badge, "My account", "Notifications", "Sign out" |
| Left sidebar | Role-specific navigation (see 3.2), collapsible; active item highlighted; badge counts on queue items |
| Page header | Title, breadcrumbs, primary actions on the right |
| Banners | Environment badge (non-production), maintenance notice, read-only notice |
| Toasts | Success and error feedback for every action, with trace id on errors |
| Global rules | Keyboard navigable, visible focus, status never shown by colour alone, responsive down to tablet |

### 3.2 Sidebar navigation per role

| Employee | HR Admin | HR Reviewer | IT Admin | System Admin |
| --- | --- | --- | --- | --- |
| My Onboarding | Dashboard | Dashboard | Dashboard | Dashboard |
| Checklist | Joiners | Review Queue | Requests | Users |
| Documents | Document Reviews | Verification | Joining Calendar | Roles & Permissions |
| Policies | Data Ingestion | History | Catalogue | Settings |
| Equipment & Access | Rules | Templates | Escalations | Integrations |
| First-Day Guide | Templates | Assistant | Assistant | Search & AI |
| Assistant | Policies | | | Audit Log |
| My Profile | Owners & Escalation | | | Monitoring & Jobs |
| | Escalations | | | Notification Templates |
| | Employee Questions | | | Data Tools |
| | Nudges & Messages | | | |
| | Metrics | | | |
| | Audit Trail | | | |
| | Assistant | | | |

### 3.3 Shared pages (every signed-in role)

#### S-A. Notifications
`/notifications` · L1

**On the page:** list of notifications newest first (icon by type, message, related joiner or item, time, read/unread dot); filters (All, Unread, by type); "Mark all as read".

**Actions:** open a notification (deep-links to the related page and marks it read); mark one read or unread; clear read items older than 30 days.

**Rules:** a user only sees notifications addressed to them. The bell dropdown shows the same data.

**API:** `GET /notifications`, `PATCH /notifications/{id}` **NEW**

#### S-B. My account
`/account` · L1

**On the page:** profile (name, email, role, department, read-only), change password, notification preferences (in-app and email per event group), active sessions list, language and date format.

**Actions:** change password (requires current password), toggle notification preferences, sign out other sessions, sign out everywhere.

**API:** `GET /auth/me`, `POST /auth/change-password` **NEW**, `PATCH /account/preferences` **NEW**, `GET /auth/sessions`, `DELETE /auth/sessions/{id}` **NEW**

#### S-C. Error pages
`/403`, `/404`, `/500`, `/maintenance` · L1

- 403: explains the page is not available to the role, shows the role's home link
- 404: "Page not found" with home link and search
- 500: friendly message with trace id to quote to support, retry button
- Maintenance: planned downtime message with expected end time

---

## 4. Role overview and page inventory

| # | Role | Main responsibility | Pages | Home |
| --- | --- | --- | --- | --- |
| 1 | Employee / New Joiner | Complete their own onboarding | 8 | `/me` |
| 2 | HR Admin | Manage the onboarding process | 20 | `/hr/dashboard` |
| 3 | HR Reviewer | Verify employee information and documents | 7 | `/review/dashboard` |
| 4 | IT Admin | Handle IT-related onboarding tasks | 8 | `/it/dashboard` |
| 5 | System Admin | Configure and maintain the application | 11 | `/admin/dashboard` |
| | Shared | Sign-in, notifications, account, errors | 4 auth + 3 shared | |

---

## 5. Role 1: Employee / New Joiner

**Responsibility:** complete their own onboarding.
**Can do:** view the assigned checklist, upload documents, track document status, ask onboarding questions, view progress.
**Cannot do:** see any other joiner, reviewer remarks, internal HR notes or system data. Employees can only read their own joiner record, enforced on the server.

### E1. My Onboarding (home dashboard)
`/me` · L1 · Employee

**Purpose:** show at a glance how ready the joiner is for day one and what to do next.

**On the page**
- Header: greeting, role, department, location, manager, joining date with a countdown ("12 days to go")
- Readiness ring (0 to 100) and a "Day-1 Ready" badge once all blocking items are complete
- Alert banners in priority order:
  - Correction requested (count, "Fix now" button)
  - Plan changed (joining date or role moved; "See what changed") L3
  - Overdue items
  - Policies waiting for acknowledgement L2
- Four count tiles: Completed, Pending, Blocked, Overdue; each opens the checklist filtered to that status
- "Next actions" (up to 5), ordered by due date then by how many items they unblock: item, due date, owner, action button (Upload, Acknowledge, Confirm, View)
- "Waiting on others": blocked items in plain language, for example "Your laptop request starts after HR creates your record"
- Milestone timeline from today to day one (documents due, verification, HR record, laptop, first day)
- Recent updates feed (document accepted, correction requested, request fulfilled)
- Assistant quick-ask card with 3 suggested questions
- "Who to contact": manager, HR contact, IT contact (names and emails)

**Actions**
- Click any action button to jump straight into the upload, acknowledgement or detail view
- Open the "Why?" drawer from any next action
- Ask a suggested question (opens the assistant with it sent)
- Dismiss a plan-change banner after reading it

**Rules**
- Before the checklist exists, shows "Your HR team is preparing your plan" and no counts
- After the joining date passes and all items are done, switches to a "Welcome aboard" state with links to the first-day guide
- Employees see only their own data

**API:** `GET /joiners/{me}`, `GET /joiners/{me}/tasks`, `GET /notifications`

### E2. My Checklist
`/me/checklist` · L1 · Employee

**Purpose:** the full list of everything required before joining, with the reason for each item.

**On the page**
- Table columns: Item, Category (Document, Activity, Provisioning, Acknowledgement, Verification), Owner (name and function), Due date, Status badge, Blocked by, Action
- Filters: status, category; search by item name; group-by toggle (by category or by due week)
- "Why is this here?" drawer per row: rule code, plain-language explanation ("Included because your role requires a minimum qualification"), source policy with link, how the due date was worked out ("10 days before your joining date of 16 Nov"), what it depends on, what depends on it
- Progress summary bar at the top
- Print or download checklist as PDF

**Actions**
- Upload (document rows), Acknowledge (policy rows), Confirm (employee-owned activities such as confirming orientation attendance), View details
- Open "Why?" drawer
- "Ask the assistant about this item" (opens assistant with the item as context)
- Download checklist PDF

**Rules**
- Employees cannot change a status directly; status only moves through their allowed actions or through the owner
- Blocked rows show the exact blocker and who owns it
- Overdue rows are marked with text and an icon, not colour alone

**API:** `GET /joiners/{me}/tasks`, `GET /tasks/{id}/explain`

### E3. My Documents
`/me/documents` · L1 · Employee

**Purpose:** upload required documents, see their review status and fix anything rejected.

**On the page**
- One card per required document type, each showing:
  - Name, why it is required (rule), accepted formats (PDF, JPG, PNG) and maximum size (10 MB), due date
  - Status chip: Not Submitted, Submitted, Under Review, Accepted, Correction Requested
  - Latest file name, version number, upload time
  - For Correction Requested: the exact reason in plain language and what to do ("The expiry date on this ID is before your joining date. Upload a valid ID")
  - "What we read from your document": name, date of birth and expiry date extracted; if different from the profile, a clear message with the two values side by side
  - Document numbers shown masked (last 4 characters)
- Tips panel: how to take a clear photo, accepted formats, privacy note
- Version history drawer per document (all uploads with status and the message shown at the time)

**Actions**
- Upload or Replace: drag and drop or browse; client-side checks for type and size before sending; progress bar; then a live "Checking your document" state that resolves to Under Review or Correction Requested with the reason
- View my file (short-lived signed link)
- View history
- "My profile is wrong" on a name or date mismatch: creates an HR follow-up with the document attached to the case, instead of forcing a re-upload
- Ask the assistant about a document

**Rules**
- Wrong file types are rejected with the allowed list and nothing is stored
- Accepted documents are locked; changes go through HR
- Employees never see reviewer internal remarks, only the employee-facing message

**API:** `GET /joiners/{me}/documents`, `POST /joiners/{me}/documents`, `GET /documents/{id}/url`

### E4. Policies and Acknowledgements
`/me/policies` · L2 · Employee

**Purpose:** read the policies that apply to the joiner and record acknowledgements.

**On the page**
- List of policies required for the joiner's role, department and location: title, code, version, status (Not read, Read, Acknowledged), due date
- In-page policy viewer with section navigation
- Acknowledgement receipt: date, time and policy version
- History of past acknowledgements

**Actions**
- Open and read a policy; the Acknowledge button unlocks after scrolling to the end
- Acknowledge: confirmation dialog with the statement "I have read and understood this policy", then confirm
- Download the policy as PDF
- "Ask about this policy" (opens the assistant with the policy as context)

**Rules**
- Each acknowledgement stores the policy version; a new version requires a fresh acknowledgement
- Acknowledging the information security policy completes SEC-01 and can unblock access provisioning
- Employees cannot un-acknowledge

**API:** `GET /joiners/{me}/policies` **NEW**, `POST /joiners/{me}/acknowledgements`

### E5. Equipment and Access
`/me/it-setup` · L2 · Employee

**Purpose:** show the status of the laptop, email account and role-specific access in plain language.

**On the page**
- Three cards: Laptop, Email account, Role-specific access (for example development tools)
- Each card: status (Waiting, Requested, In progress, Ready, Delivered), what it is waiting for, expected date, delivery or pickup instructions, and the email address once created
- Dependency explanation: "Starts after your HR record is created"

**Actions**
- Confirm receipt of laptop
- Report an issue (creates an IT task linked to the request)
- Ask the assistant

**Rules:** read-only apart from the two actions above. Employees see no IT-internal notes.

**API:** `GET /joiners/{me}/provisioning` **NEW**

### E6. First-Day Guide
`/me/first-day` · L2 · Employee

**Purpose:** everything needed for day one, specific to the joiner's location and role.

**On the page**
- Arrival details for the joiner's office: address, reporting time, reception, what to bring (originals of submitted documents)
- Day-one schedule including orientation
- Contacts: manager, HR, IT
- Each block shows its source policy; if nothing is published for the location, shows "Not published yet" rather than guessing

**Actions:** add the first day to a calendar (.ics download), open directions, print or download, ask the assistant.

**Rules:** content comes only from approved policy and the joiner's records; never generated freely.

**API:** `GET /joiners/{me}/first-day` **NEW**

### E7. Assistant
`/me/assistant` · L1 · Employee (also available as a floating panel on every employee page)

**Purpose:** answer onboarding questions from approved policy, specific to this joiner.

**On the page**
- Chat area with message history, streaming answers, suggested starter questions
- Citation chips under each answer (policy code, section, page); clicking opens a drawer with the source passage
- Context chip when launched from an item ("Asking about: Identity proof")
- Refusal style when nothing is found: "I can't find that in the approved onboarding policies. I've let HR know."
- Confirmation dialog for any action the assistant proposes (for example, acknowledging a policy)

**Actions**
- Send message, stop streaming, start a new conversation
- Open a citation
- Thumbs up or down on an answer
- "Talk to HR" (creates a follow-up for HR)
- Confirm or cancel a proposed action

**Rules**
- Answers only from policies whose audience includes Employee and whose scope matches the joiner
- Never shows another employee's data
- Rate limited per user, with a clear message when limited

**API:** `POST /chat`, `POST /chat/stream`, `GET /chat/{joiner_id}/history`, `POST /chat/{id}/feedback` **NEW**

### E8. My Profile
`/me/profile` · L1 · Employee

**Purpose:** show the joiner's onboarding profile and let them complete missing details.

**On the page**
- Read-only job details: name, email, role, grade, department, location, manager, joining date (with the original date if it changed)
- Record completeness meter: which mandatory fields are filled and which are missing
- Editable contact details: phone, emergency contact, preferred name, address (fields HR marks as employee-editable)
- Privacy notice

**Actions**
- Save contact details
- Provide a missing mandatory detail (flagged "Incomplete" until filled)
- "Report an incorrect detail": opens a short form that creates an HR follow-up

**Rules:** job details can only be changed by HR; edits to employee-editable fields are audited.

**API:** `GET /joiners/{me}`, `PATCH /joiners/{me}/contact` **NEW**, `POST /followups` **NEW**

---

## 6. Role 2: HR Admin

**Responsibility:** manage the onboarding process.
**Can do:** upload employee data, view all employees, manage onboarding checklists, review documents, track progress, manage policies.
**Cannot do:** manage users, roles, system settings or integrations (System Admin). Cannot view IT-internal fulfilment notes.

### H1. Onboarding Progress Dashboard (home)
`/hr/dashboard` · L1 · HR Admin

**Purpose:** see every joiner's readiness, spot risk early and jump to the person or item that needs action.

**On the page**
- KPI row: total joiners in range, Day-1 Ready, At risk, and task counts Completed, Pending, Blocked, Overdue
- Readiness distribution chart (bands 0-25, 26-50, 51-75, 76-100)
- Joining timeline chart: joiners per week stacked by readiness band
- "At risk" list: joiners joining within a configurable number of days with readiness below the threshold, each with the main reason and a "Nudge" button
- Critical path card: the pending item that blocks the most downstream tasks (for example "Identity proof for Asha Rao blocks 5 tasks")
- Escalations summary: open escalations by level L3
- Documents waiting for review (count, link to reviews)
- Unanswered employee questions (count, link)
- Latest ingestion runs with success and failure counts
- Joiners table with filters: joining date range (with presets Next 7 days, Next 30 days), department, location, status (Completed, Pending, Blocked, Overdue), readiness band, owner; filters are saved in the URL; "Save this view"
- Table columns: Name, Role, Department, Location, Joining date, Readiness, Completed/Pending/Blocked/Overdue counts, Next blocker

**Actions**
- Apply, save and share filters
- Click a row to open the joiner
- Nudge an at-risk joiner or owner
- Export the filtered table as CSV
- Open the critical path item

**Rules:** counts come from live data and match the filtered joiners exactly; no hard-coded numbers.

**API:** `GET /dashboard/summary`, `GET /dashboard/critical-path`, `GET /joiners`, `GET /meta/filters`

### H2. Joiners
`/hr/joiners` · L1 · HR Admin

**Purpose:** work with the complete joiner list.

**On the page:** the joiners table from H1 at full size with the same filters, a search box (name, email), pagination, column chooser.

**Actions**
- Add joiner (goes to H4), Import (goes to H6)
- Row menu: Open, Edit, Regenerate checklist, Change plan, Send nudge, Put on hold, Withdraw
- Bulk actions on selected rows: regenerate checklists, send nudges, export, assign status
- Export CSV

**Rules:** "Withdraw" asks for a reason, cancels open tasks and keeps history. "Regenerate" shows a diff first when tasks already exist.

**API:** `GET /joiners`, `POST /joiners/{id}/checklist/generate`

### H3. Joiner Detail
`/hr/joiners/:id` · L1 (tabs marked L2 and L3 as noted) · HR Admin

**Purpose:** the full record of one joiner in one place.

**Header:** name, role, grade, department, location, manager, joining date, readiness ring, Day-1 Ready badge, status, and actions (Edit, Change plan, Nudge, Put on hold).

**Tabs**

| Tab | Content | Actions |
| --- | --- | --- |
| Overview | Profile card, key dates, owner contacts, critical path for this joiner, HR record preview and completeness (L2 adds "Create HR record") | Edit, Create HR record (enabled once required approvals are complete), copy contact |
| Checklist | Full table with owner, due date, status, blockers, "Why?" drawer, dependency graph toggle | Mark complete or waive (reason required), reassign owner, change due date (flagged as an override), add a manual task (labelled "Manual"), cancel a task, nudge the owner |
| Documents | Each document with status, extracted values against profile, mismatches highlighted | View file, open in review workspace, upload on behalf of the employee, accept or request correction (HR Admin override with reason) |
| Provisioning (L2) | Laptop, email and access requests with status and dependency state | Raise a manual request, view fulfilment |
| Policies (L2) | Required policies and acknowledgement status with timestamps | Send acknowledgement reminder |
| Changes (L3) | History of date and role changes with before and after | Start a change (goes to H5) |
| Timeline | Audit events for this joiner (who, what, before, after, trace id) | Filter by type, export |
| Assistant history | The joiner's questions and answers with citations, plus any refusal | Create a follow-up, flag a wrong answer |

**Rules**
- Overrides (waive, manual due date, status change) always require a reason and write an audit row
- Identity document numbers are masked everywhere
- Editing job details that affect rules (role, grade, department, location, joining date) routes through the change flow (H5) so dependent tasks recalculate

**API:** `GET /joiners/{id}`, `GET /joiners/{id}/tasks`, `PATCH /tasks/{id}`, `GET /joiners/{id}/documents`, `POST /joiners/{id}/profile/create`, `GET /chat/{joiner_id}/history`, `POST /joiners/{id}/tasks/manual` **NEW**

### H4. Add or Edit Joiner
`/hr/joiners/new` and `/hr/joiners/:id/edit` · L1 · HR Admin

**On the page:** form with name, email, role, grade, department (dropdown), location (dropdown), manager (searchable dropdown), joining date (date picker), optional notes; validation messages inline; preview of the checklist that will be generated (when creating).

**Actions:** Save and generate checklist, Save draft, Cancel. On edit, if a rule-affecting field changed, "Review changes" leads to the change preview (H5) instead of saving directly.

**Rules:** same validation as ingestion (mandatory fields, date format, manager and department must exist, joining date not in the past unless demo flag is on, unique email).

**API:** `POST /joiners`, `PATCH /joiners/{id}` **NEW**

### H5. Change Plan
`/hr/joiners/:id/change` · L3 · HR Admin

**Purpose:** safely change a joining date or role and recalculate everything affected.

**On the page (three steps)**
1. Choose the change: new joining date and/or new role, grade, department or location; reason (required)
2. Preview: tables for Kept, Updated (old and new due date or owner), Added, Cancelled; documents that become invalid are flagged; warnings (for example "Laptop already requested; IT will be notified"); count of owners who will be notified
3. Confirm: toggles to notify the employee and affected owners, optional note, Apply

**Actions:** Preview, Back, Apply change, Cancel.

**Rules:** completed tasks and accepted documents are preserved unless the change invalidates them. Apply runs as one transaction and writes one audit row per changed task. Each task keeps its rule, so only dependent tasks are re-derived.

**API:** `POST /joiners/{id}/change/preview`, `POST /joiners/{id}/change/apply`

### H6. Data Ingestion
`/hr/ingest` · L1 · HR Admin

**Purpose:** upload and validate onboarding data in CSV, Excel or JSON.

**On the page**
- Dataset tabs: Joiners, Requirements, Owners, Policies
- Upload dropzone (CSV, XLSX, JSON), "Download template" per dataset, sheet selector for Excel files
- Column mapping preview (with AI-suggested mapping for unknown headers that the user confirms)
- Options: generate checklists after import (default on), allow past joining dates (visible only in demo mode)
- Validation report after upload: counts (total, saved, failed), error table with row number, field, offending value and message, "Download errors as CSV"
- Run history table: date, dataset, file, total, saved, failed, uploaded by, link to detail
- "Load synthetic sample data" button (non-production environments)

**Actions:** upload, map columns, run import, download template, download error file, fix and re-upload, load sample data, open a run.

**Rules**
- Processing is per row: valid rows are saved, invalid rows are reported, nothing is silently dropped
- Re-uploading the same file is idempotent (upsert on email for joiners, code for rules and policies)
- Policies upload takes multiple files plus audience and scope metadata

**API:** `POST /ingest/{dataset}`, `GET /ingest/runs`, `GET /ingest/template/{dataset}` **NEW**

### H7. Ingestion Run Detail
`/hr/ingest/runs/:id` · L1 · HR Admin

**On the page:** summary (dataset, file, who, when, created, updated, skipped, failed), per-row results with filter (all, failed), links to affected joiners, raw file download.

**Actions:** download errors, download the original file, re-run after fixes (opens H6 with the dataset preselected).

**API:** `GET /ingest/runs/{id}` **NEW**

### H8. Requirement Rules
`/hr/rules` · L1 (view) · L2 (full edit) · HR Admin

**On the page:** table of rules (code, title, item type, conditions summary, owner function, due offset and anchor, depends on, policy, blocking flag, active), filters by type, owner function and active state, "applies to N joiners" count, dependency graph view.

**Actions:** New rule, Edit, Duplicate, Activate or deactivate, View dependency graph, Import rules (goes to H6).

**Rules:** deactivating or editing a rule that is in use shows the impact (number of joiners affected) and offers recalculation with preview.

**API:** `GET /rules` **NEW**, `PATCH /rules/{id}` **NEW**

### H9. Rule Editor
`/hr/rules/new` and `/hr/rules/:id` · L2 · HR Admin

**On the page:** fields (code, title, item type, owner function, due offset in days, anchor, blocking flag, active); condition builder (roles, departments, locations, grade range, requires qualification, office-based); dependency selector; linked policy selector; **Test panel**: pick a joiner and see whether the rule matches and the exact task it would create (owner, due date, explanation).

**Actions:** Save, Save and recalculate affected joiners (with preview), Cancel.

**Rules:** codes must be unique; dependencies must exist and cannot form a cycle; every rule needs an owner function.

**API:** `POST /rules` **NEW**, `PATCH /rules/{id}` **NEW**, `POST /rules/{id}/test` **NEW**

### H10. Checklist Templates
`/hr/templates` · L2 · HR Admin

**On the page:** list of templates (name, department, grade band, location, number of rules, active); template editor with the rule set; preview against a sample joiner.

**Actions:** Create, Edit, Duplicate, Activate or deactivate, Preview.

**Rules:** when several templates match a joiner, the most specific one (department, grade band and location all matching) wins; the winning template is shown on the joiner's overview.

**API:** `GET /templates`, `POST /templates`, `PATCH /templates/{id}` **NEW**

### H11. Document Reviews
`/hr/reviews` and `/hr/reviews/:id` · L1 · HR Admin

**Purpose:** HR Admin sees the same review queue and workspace as the HR Reviewer (pages R2 and R3), plus management controls.

**Extra on the page:** reviewer assignment column, queue age and SLA indicator.

**Extra actions:** assign or reassign a document to a reviewer, override a reviewer's decision (reopen an Accepted document as Correction Requested with a reason), bulk assign.

**API:** `GET /reviews`, `POST /documents/{id}/review`, `POST /documents/{id}/assign` **NEW**

### H12. Policies
`/hr/policies` · L1 · HR Admin

**On the page:** policy catalogue (code, title, version, audience, scope, requires acknowledgement, indexing status with chunk count, approved date, active); upload form with metadata (audience roles, departments, locations, roles, grades, version, approval date, requires acknowledgement and for whom).

**Actions:** Upload new policy or new version, Deactivate, Reindex one policy, Preview chunks, Download original, Open detail.

**Rules:** a new version deactivates the old one only after it is fully indexed; re-uploading an identical file changes nothing; indexing failures show an error and a retry.

**API:** `POST /policies`, `GET /policies`, `DELETE /policies/{id}`, `POST /policies/{id}/reindex`, `GET /policies/{id}/chunks`

### H13. Policy Detail
`/hr/policies/:id` · L1 · HR Admin

**On the page:** metadata, version history, chunk preview with section and page, indexing status, rules that reference the policy, acknowledgement stats (acknowledged, pending, overdue with names) L2.

**Actions:** upload a new version, deactivate, reindex, download, send acknowledgement reminders to pending joiners L2.

**API:** `GET /policies/{id}`, `GET /policies/{id}/chunks`, `GET /policies/{id}/acknowledgements` **NEW**

### H14. Owners and Escalation Rules
`/hr/owners` · L1 · HR Admin

**On the page:** owners table (function HR, IT, Facilities, Compliance; department; name; email; backup owner; department head); escalation chain diagram (task owner, then backup after the configured hours, then department head); coverage warnings when a function and department has no owner or no backup.

**Actions:** Add, edit or remove an owner, set backup, set department head, import owners (goes to H6).

**Rules:** removing an owner who still has open tasks asks for a replacement and reassigns the tasks. Escalation timings are shown here but set in System Admin settings (S5).

**API:** `GET /owners`, `POST /owners`, `PATCH /owners/{id}` **NEW**

### H15. Escalations
`/hr/escalations` · L3 · HR Admin

**On the page:** table of overdue and escalated items (joiner, task, current owner, overdue by, escalation level, next escalation time, number of tasks blocked downstream); filters by level, function, department; escalation timeline for the selected item.

**Actions:** Nudge owner, Reassign, Escalate now, Snooze (reason and duration), Mark resolved with a note, Open joiner.

**Rules:** each escalation step creates a notification and an audit row; snoozes are visible to the next level.

**API:** `GET /escalations` **NEW**, `POST /escalations/{id}/action` **NEW**

### H16. Employee Questions
`/hr/followups` · L1 · HR Admin

**Purpose:** handle questions the assistant could not answer and issues employees reported.

**On the page:** list of follow-ups (question or issue, joiner, source: assistant refusal, profile report or document mismatch, created time, status Open, In progress, Answered, Closed, assignee); detail drawer with the original question and joiner context; "Top unanswered topics" panel to reveal policy gaps.

**Actions:** Reply to the employee (message appears in their notifications), Assign, Mark answered, Close, "Flag as policy gap" (adds to a gap list for policy updates), open the joiner.

**API:** `GET /followups`, `PATCH /followups/{id}`, `POST /followups/{id}/reply` **NEW**

### H17. Nudges and Messages
`/hr/nudges` · L2 manual, L3 automatic · HR Admin

**On the page:** composer (recipient: employee or task owner; related item; channel in-app and email), "Draft with AI" that writes a short message grounded in the exact missing item and deadline, message templates, history table with delivery status.

**Actions:** Draft with AI, edit, send, schedule, save as template, resend.

**Rules:** AI drafts are never sent without a human clicking Send; reminder cadence for automatic nudges is configured in System Admin settings.

**API:** `POST /nudges/draft` **NEW**, `POST /nudges` **NEW**, `GET /nudges` **NEW**

### H18. Metrics and Reports
`/hr/metrics` · L3 · HR Admin

**On the page:** KPI cards and charts for median time to Day-1 ready, share of joiners Day-1 Ready at joining, first-pass document acceptance rate, average correction cycles, average review turnaround, overdue count, escalations raised and resolved, automatic nudges sent (chase effort avoided), assistant answered-with-citation rate and refusal rate; filters for date range, department, location; baseline versus current comparison.

**Actions:** change filters, export CSV or PDF, schedule a weekly summary email.

**API:** `GET /metrics/summary` **NEW**, `GET /metrics/trends` **NEW**

### H19. Audit Trail
`/hr/audit` · L2 · HR Admin

**On the page:** table of events limited to HR data (joiners, tasks, documents, policies, rules, ingestion): time, actor, role, action, entity, before and after diff, trace id; filters by actor, action, entity type, joiner, date range.

**Actions:** filter, expand a diff, export CSV.

**Rules:** read-only; HR Admin sees HR-scope events only (System Admin sees everything in S8).

**API:** `GET /audit` **NEW**

### H20. Policy Assistant
`/hr/assistant` · L1 · HR Admin

**On the page:** same chat interface as E7, optional joiner selector ("answer for this joiner's role and location"), citation chips and drawers.

**Rules:** can retrieve employee-facing and HR-internal policies, never another system's data; refusals create a follow-up.

**API:** `POST /chat`, `POST /chat/stream`

---

## 7. Role 3: HR Reviewer

**Responsibility:** verify employee information and documents.
**Can do:** review uploaded documents, validate extracted information, approve or reject documents, add remarks.
**Cannot do:** ingest data, edit rules or policies, change plans, view IT fulfilment, manage anyone. Read access to joiners is limited to what verification needs.

### R1. Review Dashboard (home)
`/review/dashboard` · L1 · HR Reviewer

**Purpose:** show the review workload and what is most urgent.

**On the page**
- Count tiles: Waiting for review, Assigned to me, Flagged with mismatch, Incomplete records, Reviewed today
- "Most urgent" list: oldest or soonest-joining documents first, with age and days to joining
- Queue by document type (identity, address, education, other) and by location
- My performance: first-pass acceptance rate, correction rate, average review time (own numbers only)
- Recent decisions

**Actions:** "Start next review" (opens the most urgent item in the workspace), open a queue filtered by tile, open any listed item.

**API:** `GET /review/summary` **NEW**, `GET /reviews`

### R2. Review Queue
`/review/queue` · L1 · HR Reviewer

**On the page**
- Tabs: **Documents** and **Incomplete records**
- Documents table: joiner, document type, version, uploaded time, age, joining date and days left, location, validation flags (Mismatch, Expiry, Legibility), assigned reviewer, status
- Filters: document type, flag, joining date range, location, department, assigned (me, unassigned, anyone), status
- Sort: urgency (default, by joining date), age, joiner name
- Incomplete records table: joiner, missing mandatory fields, days to joining

**Actions**
- Claim a document (assigns it to me), release it, open in the workspace
- "Accept all clean" on selected rows that have no flags, with a confirmation that lists them (a human still confirms; nothing is auto-accepted)
- Open the joiner verification view for incomplete records and request the missing details

**Rules:** a document claimed by someone else is shown as locked with their name; claims expire after 30 minutes of inactivity.

**API:** `GET /reviews`, `POST /documents/{id}/claim` **NEW**

### R3. Document Review Workspace
`/review/documents/:id` · L1 · HR Reviewer

**Purpose:** make an accept or reject decision with full context in one screen.

**On the page (split view)**
- **Left: file viewer.** Zoom, rotate, page navigation for PDFs, full-screen, side by side with a previous version when one exists
- **Right: verification panel**
  - Validation checks list: file type, legibility, expiry against joining date, name match, date of birth match, each with pass, warn or fail
  - Extracted values against profile values in two columns, with match score and mismatches highlighted; masked document number
  - Joiner context: name, role, location, joining date, other documents and their statuses
  - Version history of this document
  - Decision area: **Accept**, **Request correction**, **Escalate to HR Admin**
  - For Request correction: reason picker (Illegible, Expired, Name mismatch, Wrong document, Incomplete, Other), template message, editable **employee-facing message** with live preview of what the employee will see
  - **Internal remarks** field (never shown to the employee)

**Actions**
- Edit an extracted value if the model misread it (correct it, then re-run the comparison; the correction is audited)
- Accept: completes the task, writes an audit row, re-evaluates dependants so blocked tasks move to Pending
- Request correction: sets Correction Requested and notifies the employee
- Escalate: sends to HR Admin with a note
- Previous or Next in queue, keyboard shortcuts (A accept, C correct, N next)

**Rules**
- A reason and employee-facing message are mandatory for correction requests
- A mismatch cannot be accepted without a one-line justification
- Every decision records reviewer, time, remarks and trace id

**API:** `GET /documents/{id}`, `GET /documents/{id}/url`, `POST /documents/{id}/review`, `PATCH /documents/{id}/extracted` **NEW**

### R4. Joiner Verification View
`/review/joiners/:id` · L1 · HR Reviewer

**On the page:** read-only joiner profile (name, role, department, location, manager, joining date), record completeness, all documents with statuses, verification tasks (identity, address, education, background verification) with status and due date, verification remarks timeline.

**Actions:** open any document in the workspace, add a verification remark, request missing details from the employee (creates a notification and a task), mark a verification task complete where the reviewer owns it.

**Rules:** no access to provisioning, assistant history or unrelated checklist items.

**API:** `GET /review/joiners/{id}` **NEW**

### R5. My Decisions
`/review/history` · L2 · HR Reviewer

**On the page:** table of the reviewer's past decisions (joiner, document, decision, reason, time), filters by decision, type and date, search.

**Actions:** open a decision, reopen within 24 hours (returns it to Under Review with a reason), export CSV.

**API:** `GET /review/history` **NEW**

### R6. Correction Templates
`/review/templates` · L2 · HR Reviewer

**On the page:** shared reason library (Illegible, Expired, Name mismatch, Wrong document, Incomplete) with the employee-facing wording, plus the reviewer's personal snippets.

**Actions:** create, edit and delete personal snippets, preview wording, suggest a change to a shared template (goes to HR Admin).

**API:** `GET /correction-templates`, `POST /correction-templates` **NEW**

### R7. Guidance Assistant
`/review/assistant` · L1 · HR Reviewer

**On the page:** same chat as E7, scoped to document-review and verification guidance policies, citation chips and drawers.

**Rules:** answers only from policies whose audience includes HR Reviewer; refusals create a follow-up for HR Admin.

**API:** `POST /chat`, `POST /chat/stream`

---

## 8. Role 4: IT Admin

**Responsibility:** handle IT-related onboarding tasks.
**Can do:** view assigned IT tasks, update account, email and access provisioning status.
**Cannot do:** see identity or education documents, extracted personal values, reviewer remarks or assistant history. IT sees only the joiner details needed to provision.

### I1. Provisioning Dashboard (home)
`/it/dashboard` · L2 · IT Admin

**On the page**
- Count tiles: Ready to fulfil, Waiting on dependencies, In progress, Fulfilled this week, Overdue
- "Do next" list: ready requests ordered by joining date, with due date
- "Coming soon": joiners starting in the next 14 days with unfinished IT items
- Breakdown by request type (Laptop, Email, Access) and by location
- Fulfilment performance: average time from Ready to Fulfilled

**Actions:** open a request, "Start next ready request", open the queue filtered by a tile.

**API:** `GET /it/summary` **NEW**

### I2. Requests
`/it/requests` · L2 · IT Admin

**On the page:** table of provisioning requests (joiner, kind, role, location, joining date, due date, status, dependency state such as "Ready" or "Waiting for HR record", assignee); filters by kind, status, location, joining date range, dependency state, assignee.

**Actions:** claim, release, update status, bulk status update for selected rows, open detail.

**Rules:** a request cannot move to In Progress while its dependencies are unmet; the reason is shown.

**API:** `GET /provisioning`, `PATCH /provisioning/{id}`

### I3. Request Detail
`/it/requests/:id` · L2 · IT Admin

**On the page**
- Joiner summary limited to name, role, department, location, joining date, manager
- Dependency chain visual with status of each upstream item (for example identity, HR record, background check, security acknowledgement)
- Request payload: laptop model for the role and grade, email alias, access bundle list
- Fulfilment form: asset tag and serial (laptop), created email address (email), access groups granted (access), fulfilment date, handover method
- Notes (internal to IT) and activity timeline

**Actions:** claim, edit payload within allowed options, mark In Progress, mark Fulfilled (completes the linked task and notifies the employee), mark Needs info (asks HR or the employee through a notification), reject with a reason, add a note.

**Rules:** fulfilling email and access requires a valid fulfilment record; every status change writes an audit row.

**API:** `GET /provisioning/{id}`, `PATCH /provisioning/{id}`

### I4. Joiner IT Readiness
`/it/joiners/:id` · L2 · IT Admin

**On the page:** the joiner's three IT requests side by side with status and blockers, IT readiness percentage, basic joiner details (no documents).

**Actions:** open a request, raise a missing request if a rule did not create it (with HR Admin notified).

**API:** `GET /it/joiners/{id}` **NEW**

### I5. Catalogue
`/it/catalogue` · L2 · IT Admin

**On the page:** laptop models by role and grade, access bundles by role (for example development tools and repositories for Engineering), email naming rule, standard software.

**Actions:** add, edit or retire catalogue entries, set which roles and grades each entry applies to.

**Rules:** the provisioning payload offers only active catalogue items for the joiner's role.

**API:** `GET /it/catalogue`, `POST /it/catalogue`, `PATCH /it/catalogue/{id}` **NEW**

### I6. Joining Calendar
`/it/calendar` · L2 · IT Admin

**On the page:** calendar or timeline of joining dates with each joiner's IT readiness, provisioning deadlines, and lead-time warnings (for example "Laptop lead time 5 days, joining in 3").

**Actions:** switch week or month view, filter by location, open a joiner or a request.

**API:** `GET /it/calendar` **NEW**

### I7. IT Escalations
`/it/escalations` · L3 · IT Admin

**On the page:** IT tasks that are overdue or escalated to this admin as backup or head, with level, age and blocked downstream tasks.

**Actions:** accept, reassign, resolve with a note, snooze with a reason.

**API:** `GET /escalations?function=IT`, `POST /escalations/{id}/action`

### I8. IT Assistant
`/it/assistant` · L2 · IT Admin

**On the page:** same chat as E7, scoped to IT provisioning and information security policies.

**Rules:** answers only from policies whose audience includes IT Admin.

**API:** `POST /chat`, `POST /chat/stream`

---

## 9. Role 5: System Admin

**Responsibility:** configure and maintain the application.
**Can do:** manage users and roles, configure system settings, manage integrations and access.
**Cannot do:** open joiner documents, checklists or assistant conversations. System administration is separated from HR data; the only joiner-related data visible is aggregate counts and audit metadata.

### S1. System Health Dashboard (home)
`/admin/dashboard` · L1 · System Admin

**On the page**
- Service status tiles: API, database, search index (Elasticsearch), Vertex AI, job queue, scheduler; each green, amber or red with last check time
- Key numbers: request rate, error rate, p95 latency, active users now, failed jobs in 24 hours
- AI health: refusal rate, degraded (BM25-only) answers, embedding errors, average generation latency
- Pending items: failed ingestion runs, failed indexing, users locked out, invited users not yet activated
- Recent audit events (last 10) and recent configuration changes
- Links to Cloud Logging, Cloud Trace and Cloud Monitoring

**Actions:** refresh, open a failing service's detail, open related pages (Monitoring, Search & AI, Users), open external Google Cloud consoles.

**API:** `GET /admin/health` **NEW**, `GET /rag/health`

### S2. Users
`/admin/users` · L1 · System Admin

**On the page:** table of users (name, email, role, department, status Invited, Active, Locked, Deactivated, last sign-in, linked joiner for employees); filters by role, status, department; search; counts per role.

**Actions:** Invite user (email, name, role; for employees, link to a joiner), Bulk invite from CSV, Change role, Deactivate or reactivate, Unlock, Force password reset, Resend invitation, Sign out all sessions for a user, Export.

**Rules**
- Employee accounts can be created automatically when joiners are ingested (invitation sent on the joiner's email) if the setting is on
- The last active System Admin cannot be deactivated or demoted
- Every change is audited with before and after

**API:** `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/{id}` **NEW**

### S3. User Detail
`/admin/users/:id` and `/admin/users/new` · L1 · System Admin

**On the page:** profile fields, role selector, status, last sign-in, active sessions list, sign-in history, activity summary (audit events by this user), effective permissions summary derived from the role.

**Actions:** edit profile, change role, deactivate, reset password, revoke a session or all sessions, resend invite.

**API:** `GET /admin/users/{id}`, `PATCH /admin/users/{id}`, `DELETE /admin/users/{id}/sessions` **NEW**

### S4. Roles and Permissions
`/admin/roles` · L2 · System Admin

**On the page:** the five roles as columns and capabilities as rows (matrix like section 10), the number of users per role, scope options for HR Reviewer (all locations or selected locations and departments).

**Actions:** view a role, change allowed capabilities for non-locked rows, set reviewer scope, reset to defaults, view the change history.

**Rules:** the five system roles cannot be deleted or renamed; critical capabilities (for example managing users) are locked to System Admin; every change is audited and takes effect at next sign-in.

**API:** `GET /admin/roles`, `PATCH /admin/roles/{role}` **NEW**

### S5. Settings
`/admin/settings` · L2 · System Admin

**On the page (grouped sections)**

| Group | Settings |
| --- | --- |
| General | Company name, time zone, date format, default language, locations list |
| Onboarding defaults | Allowed document types and maximum size, correction reminder cadence, demo mode flag, allow past joining dates (non-production only) |
| Escalation and SLA | Hours until backup escalation (default 24) and department-head escalation (default 48), overdue sweep interval, review SLA hours, at-risk threshold |
| Notifications | Channels in use (in-app, email), sender address, quiet hours, automatic nudge cadence |
| AI | Model name, embedding model, similarity thresholds, chat rate limit, thinking budget, prompt version in use |
| Security | Password policy, session timeout, MFA requirement, SSO enable, lockout rules |
| Feature flags | Level 2 modules, Level 3 modules, assistant on or off per role |

**Actions:** edit a group and save (with a diff confirmation), reset a group to defaults, view change history, test email.

**Rules:** secrets are never displayed (Secret Manager holds them); changes are audited and versioned; risky changes ask for confirmation.

**API:** `GET /admin/settings`, `PATCH /admin/settings/{group}` **NEW**

### S6. Integrations
`/admin/integrations` · L2 · System Admin

**On the page:** cards for each connection with status and last check: Cloud SQL, Cloud Storage buckets, Vertex AI, Elasticsearch, Cloud Tasks, Cloud Scheduler, email provider, SSO provider, optional chat webhook; service account roles overview (read-only); secret names and last rotated dates (never values).

**Actions:** Test connection, edit non-secret configuration (endpoint, region, index alias), trigger a secret rotation reminder, enable or disable an integration.

**Rules:** secret values are entered through Secret Manager, not this UI.

**API:** `GET /admin/integrations`, `POST /admin/integrations/{name}/test` **NEW**

### S7. Search and AI
`/admin/rag` · L1 · System Admin (HR Admin has debug search only)

**On the page:** index health (alias, physical index version, document count, embedding dimension match, cluster status, last reindex); policy indexing status table; **debug search** with BM25, vector and fused result columns, role and joiner selector; evaluation results (retrieval hit rate for BM25, vector and hybrid, citation presence, refusal accuracy) and the thresholds in use.

**Actions:** run debug search, reindex all (creates a new index version and swaps the alias), run evaluation, change thresholds (writes to settings), view the prompt version.

**API:** `GET /rag/health`, `GET /rag/debug/search`, `POST /rag/reindex-all`, `POST /rag/eval/run` **NEW**

### S8. Audit Log
`/admin/audit` · L1 · System Admin

**On the page:** global event table (time, actor, role, action, entity type and id, before and after diff, trace id, IP hint); filters by actor, role, action, entity, date range, outcome; free-text search.

**Actions:** expand a diff, open the trace in Cloud Trace via the trace id, export CSV, save a filter.

**Rules:** read-only and append-only; exports are themselves audited.

**API:** `GET /audit`

### S9. Monitoring and Jobs
`/admin/monitoring` · L2 · System Admin

**On the page:** embedded charts for latency, error rate and Vertex AI latency; Cloud Tasks queue depth and failed tasks; scheduled jobs table (overdue sweep: last run, result, next run); recent errors list with trace links.

**Actions:** run the overdue sweep now, retry a failed job, pause or resume a queue, open Cloud Logging, Cloud Trace or Cloud Monitoring.

**API:** `GET /admin/jobs`, `POST /admin/jobs/{name}/run`, `POST /admin/jobs/{id}/retry` **NEW**

### S10. Notification Templates
`/admin/templates` · L2 · System Admin

**On the page:** list of system messages (welcome, correction requested, document accepted, plan changed, escalation, acknowledgement reminder, invitation, password reset) with subject, body, variables available, last edited.

**Actions:** edit with live preview, send a test to self, restore default, view change history.

**Rules:** required variables cannot be removed; templates are versioned.

**API:** `GET /admin/message-templates`, `PATCH /admin/message-templates/{id}` **NEW**

### S11. Data Tools
`/admin/data` · L1 · System Admin

**On the page:** environment name and warning banner; synthetic data loader; reset demo data (only when `APP_ENV` is not production); export of non-personal configuration (rules, templates, settings) as JSON; data retention settings overview.

**Actions:** load sample data, reset demo data (type the environment name to confirm), export or import configuration.

**Rules:** the reset control is hidden entirely in production.

**API:** `POST /admin/data/seed`, `POST /admin/data/reset`, `GET /admin/config/export` **NEW**

---

## 10. Permission matrix

Legend: **Full** = view and change, **View** = read only, **Own** = own record only, **Scoped** = limited fields or records (see section 11), **No** = no access.

| Capability | Employee | HR Admin | HR Reviewer | IT Admin | System Admin |
| --- | --- | --- | --- | --- | --- |
| Sign in and manage own account | Full | Full | Full | Full | Full |
| Own checklist, progress and profile | Own | n/a | n/a | n/a | n/a |
| Upload own documents | Own | Full (on behalf) | No | No | No |
| View all joiners | No | Full | Scoped (verification fields) | Scoped (IT fields) | No |
| Create and edit joiners | No | Full | No | No | No |
| Ingest data (CSV, Excel, JSON) | No | Full | No | No | No |
| Manage rules and templates | No | Full | No | No | No |
| View and manage checklists of others | No | Full | View (verification items) | View (IT items) | No |
| Review documents (accept, reject) | No | Full (and override) | Full | No | No |
| Edit extracted values | No | Full | Full | No | No |
| Manage policies (upload, version, reindex) | No | Full | No | No | View (index status) |
| Read and acknowledge policies | Own | View | View (guidance) | View (IT and security) | No |
| Change joining date or role | No | Full | No | No | No |
| Provisioning requests | View own | View and raise | No | Full | No |
| IT catalogue | No | No | No | Full | No |
| Escalations | No | Full | View (review items) | Full (IT items) | View |
| Employee questions (follow-ups) | Create own | Full | Create | Create | No |
| Nudges and messages | Receive | Full | Request correction messages | Notes on requests | No |
| Assistant (chat) | Own scope | HR scope | Review guidance | IT guidance | No |
| RAG debug search | No | Full | No | No | Full |
| Reindex search | No | Policy-level | No | No | Full |
| Metrics | Own progress | Full | Own review stats | Own IT stats | System metrics |
| Audit | Own actions | HR scope | Own actions | Own actions | Full |
| Users and roles | No | No | No | No | Full |
| Settings, integrations, templates | No | No | No | No | Full |
| Jobs and monitoring | No | No | No | No | Full |
| Demo data tools | No | Load sample (non-production) | No | No | Full |

---

## 11. Field-level data visibility

| Data | Employee | HR Admin | HR Reviewer | IT Admin | System Admin |
| --- | --- | --- | --- | --- | --- |
| Joiner name, role, department, location, joining date | Own | Yes | Yes | Yes | Aggregates only |
| Email and phone | Own | Yes | Yes | Email only | No |
| Identity document image | Own | Yes | Yes | No | No |
| Extracted document values (name, date of birth) | Own | Yes | Yes | No | No |
| Document number | Own, masked | Masked | Full on the review screen only | No | No |
| Reviewer internal remarks | No | Yes | Yes | No | No |
| Employee-facing correction message | Yes | Yes | Yes | No | No |
| Background verification outcome | Status only | Yes | Yes | Status only | No |
| Provisioning details (asset tag, serial) | Status and email only | View | No | Yes | No |
| IT internal notes | No | No | No | Yes | No |
| Assistant conversations | Own | Yes (own-HR scope, disclosed in privacy notice) | No | No | No |
| Audit entries | Own actions | HR scope | Own actions | Own actions | All |
| User accounts and sessions | Own | No | No | No | Yes |
| Secrets and keys | No | No | No | No | Metadata only |

Rules applied everywhere: document numbers are masked in lists and logs; signed file links expire after 10 minutes; every view of an identity document by a non-owner writes an audit row.

---

## 12. Notifications by role

| Event | Recipients | Channel |
| --- | --- | --- |
| Joiner created, checklist generated | Employee (welcome with link to sign in), HR Admin (summary) | In-app, email |
| Document uploaded | HR Reviewers (queue badge) | In-app |
| Automatic validation failed (illegible, expired, wrong type) | Employee | In-app, email |
| Document flagged for mismatch | Assigned or next HR Reviewer | In-app |
| Correction requested | Employee | In-app, email |
| Document accepted | Employee | In-app |
| Reviewer escalates a document | HR Admin | In-app |
| Task unblocked | Task owner | In-app |
| HR record created | Employee, IT Admin (requests become ready) | In-app |
| Provisioning request ready | IT Admin | In-app |
| Provisioning fulfilled | Employee, HR Admin | In-app, email |
| Policy to acknowledge | Employee | In-app, email |
| Acknowledgement overdue | Employee, HR Admin | In-app |
| Plan changed (date or role) | Employee, every affected owner, HR Reviewer if documents become invalid | In-app, email |
| Task overdue | Task owner | In-app, email |
| Escalation level 2 (after 24 hours) | Owner's backup | In-app, email |
| Escalation level 3 (after 48 hours) | Department head, HR Admin | In-app, email |
| Assistant could not answer | HR Admin (follow-up) | In-app |
| Ingestion finished with errors | HR Admin who uploaded | In-app |
| Failed job, failed indexing, integration down, repeated lockouts | System Admin | In-app, email |
| User invited, role changed, password reset | The user, System Admin | Email |

---

## 13. Status reference

| Object | Statuses |
| --- | --- |
| Task | Pending, In Progress, Blocked, Completed, Overdue, Cancelled |
| Document | Not Submitted, Submitted, Under Review, Accepted, Correction Requested |
| Provisioning request | Waiting (dependencies), Requested, In Progress, Needs Info, Fulfilled, Rejected |
| Joiner | Pre-joining, Day-1 Ready, Joined, On Hold, Withdrawn |
| Follow-up | Open, In Progress, Answered, Closed |
| User | Invited, Active, Locked, Deactivated |
| Ingestion run | Running, Completed, Completed with errors, Failed |
| Policy indexing | Queued, Indexing, Indexed, Failed |
| Policy acknowledgement | Not read, Read, Acknowledged, Overdue |
| Escalation level | 0 (none), 1 (owner), 2 (backup), 3 (department head) |

Status colours always appear with an icon and text: Completed green, Pending grey, In Progress blue, Blocked amber, Overdue red.

---

## 14. Complete route map

| Route | Page | Roles | Level |
| --- | --- | --- | --- |
| `/` | Redirect (sign-in or role home) | all | L1 |
| `/signin` | Sign in | public | L1 |
| `/activate` | Activate account | public | L1 |
| `/forgot-password` | Forgot password | public | L1 |
| `/reset-password` | Reset password | public | L1 |
| `/notifications` | Notifications | all | L1 |
| `/account` | My account | all | L1 |
| `/403` `/404` `/500` `/maintenance` | Error pages | all | L1 |
| `/me` | E1 My Onboarding | Employee | L1 |
| `/me/checklist` | E2 My Checklist | Employee | L1 |
| `/me/documents` | E3 My Documents | Employee | L1 |
| `/me/policies` | E4 Policies and Acknowledgements | Employee | L2 |
| `/me/it-setup` | E5 Equipment and Access | Employee | L2 |
| `/me/first-day` | E6 First-Day Guide | Employee | L2 |
| `/me/assistant` | E7 Assistant | Employee | L1 |
| `/me/profile` | E8 My Profile | Employee | L1 |
| `/hr/dashboard` | H1 Dashboard | HR Admin | L1 |
| `/hr/joiners` | H2 Joiners | HR Admin | L1 |
| `/hr/joiners/new` `/hr/joiners/:id/edit` | H4 Add or Edit Joiner | HR Admin | L1 |
| `/hr/joiners/:id` | H3 Joiner Detail | HR Admin | L1 |
| `/hr/joiners/:id/change` | H5 Change Plan | HR Admin | L3 |
| `/hr/ingest` | H6 Data Ingestion | HR Admin | L1 |
| `/hr/ingest/runs/:id` | H7 Run Detail | HR Admin | L1 |
| `/hr/rules` | H8 Requirement Rules | HR Admin | L1 |
| `/hr/rules/new` `/hr/rules/:id` | H9 Rule Editor | HR Admin | L2 |
| `/hr/templates` | H10 Checklist Templates | HR Admin | L2 |
| `/hr/reviews` `/hr/reviews/:id` | H11 Document Reviews | HR Admin | L1 |
| `/hr/policies` | H12 Policies | HR Admin | L1 |
| `/hr/policies/:id` | H13 Policy Detail | HR Admin | L1 |
| `/hr/owners` | H14 Owners and Escalation | HR Admin | L1 |
| `/hr/escalations` | H15 Escalations | HR Admin | L3 |
| `/hr/followups` | H16 Employee Questions | HR Admin | L1 |
| `/hr/nudges` | H17 Nudges and Messages | HR Admin | L2 |
| `/hr/metrics` | H18 Metrics | HR Admin | L3 |
| `/hr/audit` | H19 Audit Trail | HR Admin | L2 |
| `/hr/assistant` | H20 Policy Assistant | HR Admin | L1 |
| `/review/dashboard` | R1 Review Dashboard | HR Reviewer | L1 |
| `/review/queue` | R2 Review Queue | HR Reviewer | L1 |
| `/review/documents/:id` | R3 Review Workspace | HR Reviewer | L1 |
| `/review/joiners/:id` | R4 Joiner Verification | HR Reviewer | L1 |
| `/review/history` | R5 My Decisions | HR Reviewer | L2 |
| `/review/templates` | R6 Correction Templates | HR Reviewer | L2 |
| `/review/assistant` | R7 Guidance Assistant | HR Reviewer | L1 |
| `/it/dashboard` | I1 Provisioning Dashboard | IT Admin | L2 |
| `/it/requests` | I2 Requests | IT Admin | L2 |
| `/it/requests/:id` | I3 Request Detail | IT Admin | L2 |
| `/it/joiners/:id` | I4 Joiner IT Readiness | IT Admin | L2 |
| `/it/catalogue` | I5 Catalogue | IT Admin | L2 |
| `/it/calendar` | I6 Joining Calendar | IT Admin | L2 |
| `/it/escalations` | I7 IT Escalations | IT Admin | L3 |
| `/it/assistant` | I8 IT Assistant | IT Admin | L2 |
| `/admin/dashboard` | S1 System Health | System Admin | L1 |
| `/admin/users` | S2 Users | System Admin | L1 |
| `/admin/users/new` `/admin/users/:id` | S3 User Detail | System Admin | L1 |
| `/admin/roles` | S4 Roles and Permissions | System Admin | L2 |
| `/admin/settings` | S5 Settings | System Admin | L2 |
| `/admin/integrations` | S6 Integrations | System Admin | L2 |
| `/admin/rag` | S7 Search and AI | System Admin, HR Admin (debug only) | L1 |
| `/admin/audit` | S8 Audit Log | System Admin | L1 |
| `/admin/monitoring` | S9 Monitoring and Jobs | System Admin | L2 |
| `/admin/templates` | S10 Notification Templates | System Admin | L2 |
| `/admin/data` | S11 Data Tools | System Admin | L1 |

**Frontend structure**

```
frontend/src/
├── auth/            # AuthProvider, RequireAuth, RequireRole, role-home redirect
├── nav/             # navConfig.ts keyed by role (section 3.2)
├── pages/
│   ├── auth/        # signin, activate, forgot, reset
│   ├── shared/      # notifications, account, errors
│   ├── employee/    # E1 to E8
│   ├── hr/          # H1 to H20
│   ├── reviewer/    # R1 to R7
│   ├── it/          # I1 to I8
│   └── admin/       # S1 to S11
└── components/      # ChecklistTable, DocumentUploader, ExtractionCompare, ChatPanel, CitationDrawer, ReadinessRing, StatusBadge, FilterBar, DiffTable, ConfirmDialog
```

`RequireRole` reads the role from the signed-in session and the route table above; the API enforces the same rules independently, so hiding a menu item is never the only protection.

---

## 15. Backend additions this spec requires

The existing `SSOT.md` and build prompt define Level 1 endpoints for joiners, tasks, documents, chat, policies, dashboard and ingestion. Sign-in and the five roles add the following.

**New tables**

| Table | Purpose |
| --- | --- |
| `users` | id, email, name, role (EMPLOYEE, HR_ADMIN, HR_REVIEWER, IT_ADMIN, SYSTEM_ADMIN), status, password_hash, must_change_password, joiner_id (employees), department_id, failed_attempts, locked_until, last_login_at |
| `sessions` | id, user_id, refresh token hash, ip_hint, user_agent, created_at, expires_at, revoked_at |
| `invitations` and `password_resets` | token hash, user_id, expires_at, used_at |
| `role_permissions` | role, capability, allowed, locked |
| `app_settings` | group, key, value (JSONB), version, updated_by, updated_at |
| `message_templates` | key, subject, body, variables, version |
| `followups` | id, joiner_id, source, text, status, assignee_id, reply, gap_flag, created_at |
| `review_assignments` | document_id, reviewer_id, claimed_at, released_at |
| `correction_templates` | id, scope (shared or personal), owner_id, reason, text |
| `it_catalogue` | id, kind (LAPTOP, EMAIL_RULE, ACCESS_BUNDLE), name, applies_to (JSONB), active |
| `nudges` | id, sender_id, recipient, joiner_id, task_id, body, channel, status, sent_at |

**New endpoint groups:** authentication (`/auth/*`), account, notifications, users and roles (`/admin/users`, `/admin/roles`), settings, integrations, jobs, follow-ups, review queue and assignment, IT summary, catalogue and calendar, rules CRUD and test, templates CRUD, nudges, metrics, escalations, audit. Each is marked **NEW** in the pages above.

**Auth implementation.** Level 1: backend-issued JWT access token (15 minutes) plus refresh token, passwords hashed with Argon2, seeded users for all five roles. The role is read from the token by a single dependency in `deps.py`; the previous `X-Demo-Role` header is retained only when `DEMO_MODE=true`. Upgrade path: Identity Platform with custom role claims, with no page changes.

**Changes to earlier documents**

| Document | Update |
| --- | --- |
| `SSOT.md` section 7.3 and 8.1 | Replace the four-role demo switcher with the five roles and the sign-in flow; replace the page table with sections 5 to 9 here |
| `antigravity_build_prompt.md` | Replace "Demo auth" and the "Frontend pages" list with this document; add the new tables and endpoint groups |
| `rag_build_prompt.md` | Roles already match; add that HR Admin has policy-level reindex only and System Admin has full reindex |

---

## 16. Minimum set for the Level 1 demo

If time is tight, build these pages first; everything else is L2 or L3 and the layout, routing and permissions already allow it to be added later.

| Role | Pages to build first |
| --- | --- |
| Shared | Sign in (with demo quick-login), shell and sidebar, notifications, 403 and 404 |
| Employee | E1 My Onboarding, E2 Checklist with "Why?" drawer, E3 Documents with upload and status, E7 Assistant, E8 My Profile |
| HR Admin | H1 Dashboard with filters, H2 Joiners, H3 Joiner Detail (Overview, Checklist, Documents, Timeline), H4 Add Joiner, H6 Data Ingestion with validation report, H7 Run Detail, H8 Rules (view), H11 Document Reviews, H12 Policies, H14 Owners, H16 Employee Questions, H20 Assistant |
| HR Reviewer | R1 Dashboard, R2 Queue, R3 Review Workspace, R4 Joiner Verification, R7 Guidance Assistant |
| IT Admin | Seeded user can sign in and see a read-only placeholder dashboard until L2 |
| System Admin | S1 Health, S2 Users (list, invite, role change), S3 User Detail, S7 Search and AI with debug search, S8 Audit Log, S11 Data Tools |

**Demo path across roles (about 6 minutes):** sign in as System Admin and show users and roles; sign in as HR Admin, upload the data files with errors and show the validation report and dashboard; sign in as an Employee and show the checklist, upload an expired ID and see the correction message; ask the assistant a policy question and an unanswerable one; sign in as HR Reviewer and review a mismatched document in the workspace; return as HR Admin to show the dashboard and critical path change; sign in as IT Admin to show the requests unblocking (L2); close with the System Admin audit log and trace link.
