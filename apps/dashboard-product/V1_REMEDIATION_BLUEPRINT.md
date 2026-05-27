# Tracebud Dashboard V1-Aligned Remediation Blueprint

**Status:** Implementation-Ready Specification  
**Version:** 1.0  
**Date:** April 2026  
**Audience:** Engineering, Product, Compliance  

---

## A. CURRENT VS TARGET GAP MATRIX

| Area | Existing Route/Component | Canonical Requirement | Gap Severity | Remediation Approach |
|------|---------------------------|------------------------|--------------|----------------------|
| **Role Model** | `useRole()` returns simplified tenant-scoped roles | Section 5: 7 legal workflow roles (OPERATOR, MICRO_SMALL_PRIMARY_OPERATOR, DOWNSTREAM_OPERATOR_FIRST/SUBSEQUENT, TRADER, OUT_OF_SCOPE, PENDING_MANUAL_CLASSIFICATION) + commercial tiers + permissions matrix | CRITICAL | Refactor: Expand RBAC to canonical role model; add role decision engine; implement permission matrix per Section 8 |
| **State Machines** | Hardcoded status strings | Canonical status per entity (shipment_headers, dds_records, compliance_issues, yield_exception_requests) | CRITICAL | Refactor: Map current states to canonical; add missing transitions; implement immutable audit trail |
| **Shipment Model** | `/packages/[id]/assemble` wizard with incomplete state tracking | Section 15: shipment_headers + shipment_lines + shipment_line_coverages with yield cap validation, blocking issues, liability acknowledgement | HIGH | Refactor: Align assembly flow to canonical shipment model; add lineage materialization; enforce yield-cap pre-flight gate |
| **DDS Workflow** | `/compliance/page.tsx` shows pre-flight checks only | Section 16: dds_records with submission_status state machine (DRAFT → READY_TO_SUBMIT → SUBMITTED → ACCEPTED/REJECTED/PENDING_CONFIRMATION + amendment/withdrawal states); MANUAL_ASSIST path only for MVP | HIGH | Refactor: Add dds_records lifecycle UI; show TRACES reference numbers; link to shipment_header; implement audit event logging |
| **Compliance Issues** | `/compliance/issues/page.tsx` exists but no SLA/ownership | Section 17: compliance_issues with severity, owner, SLA, blocking status, resolution path | HIGH | Refactor: Add issue ownership, SLA tracking, escalation, blocking impact visibility |
| **Yield Exception Workflow** | `/harvests/page.tsx` has exception request dialog | Section 20: yield_exception_requests with status machine; 5-day SLA; blocking issues if unresolved | MEDIUM | Refactor: Add SLA tracking; link to compliance_issues; show approval/rejection with audit events |
| **Role-Based Navigation** | Fixed sidebar for all roles | V0_DESIGN_CONTEXT: Role-specific nav; post-MVP gating | HIGH | Refactor: Implement role switcher; hide/show pages per Section 51 MVP gating; add "Release 2+" labels |
| **MVP vs Release 2+ Gating** | No explicit separation | Section 51: MVP = MANUAL_ASSIST only; no API_DIRECT, no simplified declarations, no downstream, no sponsor governance, no automation | CRITICAL | New: Add route guards; feature flags; explicit screen gating |
| **Tenant Context** | No header switcher in current implementation | V0_DESIGN_CONTEXT: Tenant switcher visible at all times | HIGH | Refactor: Add org switcher to app-header; show active tenant prominently |
| **Blocker/SLA Visibility** | Dashboards show metrics only | Canonical: Every critical screen must show blocker reason, owner, due date/SLA, next action | CRITICAL | Refactor: Add blocker cards to all pages; show "action required" states; surface SLA breaches |
| **Audit Event Logging** | No audit trail for actions | Section 17: Every compliance-critical action must emit audit_events with user, timestamp, event_type, payload, regulatory_profile_version | CRITICAL | Refactor: Add audit logging middleware; show audit timeline on detail pages |
| **Request Campaign Workflows** | Not implemented | Section 51.1: request_campaigns + request_campaign_targets + duplicate_suppression outcomes | Post-MVP | Defer: Mark as Release 2 feature |
| **Sponsor Governance** | Not implemented | Section 38: data_visibility_policy editor, delegated_admin_actions, network health | Post-MVP | Defer: Mark as Release 2+ feature |
| **Producer Wallet / Simplified Declarations** | Not implemented | Sections 11, 22: Farmer self-sovereign identity; postal address substitution; simplified declaration path | Post-MVP | Defer: Mark as Release 2 feature |

---

## B. ROUTE REMEDIATION PLAN

| Route | Keep/Refactor/New | MVP_or_V1+ | Primary Roles | Canonical Entities | Required State Machine Alignment | API Dependencies |
|-------|-------------------|------------|---------------|--------------------|---------------------------------|------------------|
| `/` | Refactor | MVP | Field Agent, Field Manager, Org Admin | N/A (dashboard) | N/A | GET /orgs/{org_id}/metrics, GET /tasks/my-tasks |
| `/login` | Keep | MVP | All | identity, session | Auth flow | POST /auth/login |
| `/settings` | Refactor | MVP | Org Admin | organisation, users, roles | N/A | PATCH /orgs/{org_id}, GET/POST /orgs/{org_id}/users |
| `/plots` | Keep | MVP | Field Agent, Field Manager, Compliance Analyst | plots, geometries | DRAFT → CAPTURED → SYNCED → UNDER_REVIEW → VERIFIED/REJECTED → ARCHIVED | GET/POST /plots, GET /plots/{plot_id}/geometry |
| `/farmers` | Keep | MVP | Field Agent, Field Manager | farmers, consent_grants | N/A | GET/POST /farmers, GET/POST /farmers/{farmer_id}/consents |
| `/farmers/[id]` | Keep | MVP | All | farmers, consent_grants, plots | N/A | GET /farmers/{id}, GET /farmers/{id}/consents, GET /farmers/{id}/plots |
| `/packages` | Refactor | MVP | Supplier User, Org Admin, Compliance Analyst | shipment_headers, dds_records | Show all shipment states; filter by legal role | GET /shipments?org_id={org_id} |
| `/packages/new` | Refactor | MVP | Supplier User | shipment_headers | DRAFT | POST /shipments |
| `/packages/[id]` | Refactor | MVP | All | shipment_headers, shipment_lines, shipment_line_coverages | DRAFT → READY → SEALED → SUBMITTED → ACCEPTED/REJECTED → ARCHIVED/ON_HOLD | GET /shipments/{id}, GET /shipments/{id}/lines, GET /shipments/{id}/coverage |
| `/packages/[id]/assemble` | Refactor | MVP | Supplier User, Compliance Manager | shipment_headers, shipment_lines, shipment_line_coverages, yield_checks, compliance_issues | 4-step wizard: Select Batches → Allocate Coverage → Validate Issues → Seal (with liability) | GET /batches, GET /compliance-issues?shipment_id={id} |
| `/compliance` | Refactor | MVP | Compliance Analyst, Compliance Manager | dds_records | DRAFT → READY_TO_SUBMIT → SUBMITTED → ACCEPTED/REJECTED/NEEDS_MANUAL_REVIEW | GET /dds-records?shipment_id={id}, GET /pre-flight-checks |
| `/compliance/queue` | Keep | MVP | Compliance Reviewer, Compliance Manager | dds_records, compliance_issues | READY_TO_SUBMIT → SUBMITTED | GET /dds-records?status=READY_TO_SUBMIT |
| `/compliance/issues` | Refactor | MVP | Compliance Analyst, Compliance Manager, Risk Reviewer | compliance_issues | OPEN → IN_PROGRESS → ESCALATED/RESOLVED | GET/POST /compliance-issues, PATCH /compliance-issues/{id}/assign-owner |
| `/harvests` | Refactor | MVP | Supplier User, Field Manager | batches, yield_checks, yield_exception_requests | yield_check_status: PENDING → PASS/WARNING/BLOCKED; exception_status: NONE → PENDING → APPROVED/REJECTED | GET /batches, POST /yield-exception-requests |
| `/fpic` | Keep | MVP | Supplier User, Field Manager | evidence_documents, consent_grants | DRAFT → UPLOADED → UNDER_REVIEW → APPROVED/REJECTED | GET/POST /evidence-documents?type=FPIC |
| `/audit-log` | Keep | MVP | Auditor, Org Admin | audit_events | N/A | GET /audit-events?org_id={org_id} |
| `/admin` | Refactor | MVP | Org Admin | organisations, users, roles, billing | N/A | GET/PATCH /orgs/{id}, GET/POST /orgs/{id}/users, GET /orgs/{id}/billing |
| `/reports` | Defer | V1+ | Importer, Trader, Risk Reviewer | dds_records, shipments (aggregate) | N/A | GET /reports/shipment-summary |
| `/sponsor-admin` | **New (Release 2+)** | V1+ | Sponsor Admin, Network Admin | organisations, data_visibility_policies, delegated_admin_actions | N/A | N/A |
| `/outreach` + `/inbox` | **New (Release 2+)** | V1+ | All roles | requests, request_campaigns, request_campaign_targets | request status: OPEN → IN_PROGRESS → FULFILLED/EXPIRED/CANCELLED; campaign status: DRAFT → QUEUED → RUNNING → COMPLETED/PARTIAL/CANCELLED | N/A |

---

## C. CANONICAL ROLE-ACTION MATRIX

| Role | View Orgs | Create Shipment | Seal Shipment | Submit DDS | Approve DDS | View Compliance Issues | Create Issue | Resolve Issue | Manage Users | Export Audit | View Reports | Edit Policies |
|------|-----------|-----------------|---------------|------------|-------------|----------------------|--------------|---------------|--------------|--------------|--------------|--------------|
| **Field Agent** | own | ✓ | — | — | — | view-open | — | — | — | — | — | — |
| **Field Manager** | own | ✓ | ✓ | — | — | view-assigned | create | update-owned | — | — | — | — |
| **Supplier User** | own | ✓ | ✓ | propose | — | view-open | create | update-owned | — | — | view-own | — |
| **Org Admin** | own | ✓ | ✓ | propose | approve* | view-all | create | update-all | ✓ | ✓ | view-all | — |
| **Compliance Analyst** | own | — | — | — | — | view-all | create | update-all | — | — | view-all | — |
| **Compliance Manager** | all | — | — | — | approve* | view-all | create | resolve-all | — | — | view-all | — |
| **Risk Reviewer** | all | — | — | — | — | view-all | — | — | — | — | view-all | — |
| **Sponsor Admin** | sponsored | — | — | — | approve* | view-all | — | — | ✓ (sponsored) | — | view-all | ✓ |
| **Auditor** | all | — | — | — | — | view-all | — | — | — | ✓ | view-all | — |

**Conditions:**
- `approve*` requires role assignment at shipment line or org level
- Org Admin role gives "view-all" within tenant; cannot view other tenants
- "view-assigned" = own + delegated issues
- Sponsor Admin can manage other orgs **only if sponsored by that sponsor**

---

## D. STATE ALIGNMENT MATRIX

### Entity: `shipment_headers`

| Canonical State | Current Implemented State | Required Mapping | Migration Notes |
|-----------------|--------------------------|------------------|-----------------|
| `DRAFT` | `draft` | 1:1 | ✓ Exists |
| `READY` | `ready` | 1:1 | ✓ Exists |
| `SEALED` | Partially tracked | Explicit canonical sealed state | enforce sealing gate |
| `SUBMITTED` | `submitted` | 1:1 | ensure linkage to dds_records |
| `ACCEPTED` | Not consistently tracked | Add canonical accepted state | add TRACES success handler |
| `REJECTED` | Partial | Add canonical rejected state | add rejection handling |
| `ARCHIVED` | Not tracked | Add terminal archival state | post-accept/archive flow |
| `ON_HOLD` | Partial blocker UX only | Add explicit canonical hold state | hold/resume transitions |

### Entity: `dds_records`

| Canonical State | Current Implemented State | Required Mapping | Migration Notes |
|-----------------|--------------------------|------------------|-----------------|
| `DRAFT` | N/A (no dds_records table yet) | — | Create dds_records table |
| `READY_TO_SUBMIT` | N/A | — | Derive from shipment pre-flight result |
| `SUBMITTED` | N/A | — | When TRACES API called (MANUAL_ASSIST only) |
| `ACCEPTED` | N/A | — | When TRACES returns reference number |
| `REJECTED` | N/A | — | When TRACES returns error |
| `PENDING_CONFIRMATION` | N/A | — | When submit outcome is ambiguous |
| `AMENDMENT_DRAFT` | N/A | — | Amendment preparation state |
| `AMENDED_SUBMITTED` | N/A | — | Amendment submitted state |
| `WITHDRAWAL_REQUESTED` | N/A | — | Withdrawal requested state |
| `WITHDRAWN` | N/A | — | TRACES withdrawal requested |

### Entity: `compliance_issues`

| Canonical State | Current Implemented State | Required Mapping | Migration Notes |
|-----------------|--------------------------|------------------|-----------------|
| `OPEN` | Not tracked in current code | — | Add status field |
| `RESOLVED` | `resolved` | 1:1 | ✓ Partially exists |
| `ESCALATED` | N/A | — | escalation path for overdue/critical items |

### Entity: `yield_exception_requests`

| Canonical State | Current Implemented State | Required Mapping | Migration Notes |
|-----------------|--------------------------|------------------|-----------------|
| `PENDING` | `pending` (in harvest UI) | 1:1 | Upgrade to DB entity |
| `APPROVED` | N/A | — | Compliance Manager decision |
| `REJECTED` | N/A | — | Compliance Manager decision |
| `EXPIRED` | N/A | — | After 5-day SLA breach (where policy requires) |

---

## E. SCREEN SPECS FOR MISSING CRITICAL DOMAINS

### Screen 1: DDS Submission Lifecycle

**screen_id:** `dds-records-detail`  
**route:** `/compliance/[id]/dds-record`  
**purpose:** Track DDS record through MANUAL_ASSIST submission lifecycle  
**roles allowed:** Compliance Manager, Compliance Analyst, Org Admin  
**key data widgets:**
- Header: Shipment reference + DDS ID + submission_status + traces_reference_number (if accepted)
- Status timeline: visual flow through DRAFT → READY_TO_SUBMIT → SUBMITTED → ACCEPTED/REJECTED
- Pre-flight summary: all checks (yield, deforestation, FPIC, tenure)
- Payload preview: JSON dump of TRACES XML/JSON (read-only)
- Submission log: timestamp, user, TRACES response, error details
- Linked compliance_issues: blocking + warnings preventing submission

**primary actions:**
- "Submit to TRACES" (only if status = READY_TO_SUBMIT AND no blocking_issues)
- "View Payload" (expand/copy JSON)
- "Export Package" (SHA-256 + timestamp)
- "Request Manual Review" (if pre-flight failed)

**blocking/empty/error states:**
- Empty: "No DDS record linked to this shipment. Create one from shipment detail."
- Error: "Pre-flight checks failed. Review compliance issues below."
- Blocked: "Cannot submit. [N] blocking issues assigned to you. See details."
- Pending: "Submission pending TRACES response (may take 24 hours)."

**SLA indicators:**
- "Submitted [n] hours ago. TRACES typically responds within 24 hours."
- Red badge if > 48 hours pending

**audit events emitted:**
- `dds_submitted`: `{dds_record_id, user_id, timestamp, payload_hash}`
- `dds_response_received`: `{dds_record_id, traces_reference_number, decision, timestamp}`

**API endpoints needed:**
- `GET /dds-records/{id}` → full record + linked shipment + compliance_issues
- `POST /dds-records/{id}/submit` → dispatch to TRACES (MANUAL_ASSIST only)
- `GET /dds-records/{id}/payload` → XML/JSON representation
- `POST /dds-records/{id}/export` → download package

---

### Screen 2: Compliance Issue Triage Board

**screen_id:** `compliance-issues-board`  
**route:** `/compliance/issues-triage`  
**purpose:** Triage and resolve compliance issues with SLA visibility  
**roles allowed:** Compliance Manager, Risk Reviewer, Org Admin  
**key data widgets:**
- Filter row: severity (BLOCKING/WARNING/INFO), status, owner, overdue
- Kanban board: OPEN → ASSIGNED → WAITING_ON_PARTNER → UPDATED → RESOLVED columns
- Card per issue:
  - ID, type (e.g., "Missing FPIC"), severity badge
  - Linked entity: shipment_id or batch_id
  - Owner name + avatar (or "Unassigned")
  - SLA: due date + days remaining (red if overdue)
  - Blocker: "Blocks shipment sealing" or "Warning only"
  - Last updated timestamp

**primary actions:**
- Drag card between columns to transition status
- Click card → detail modal (see Screen 3)
- "Assign to me" / "Reassign to..."
- "Mark as resolved"
- "Escalate" (notify owner's manager)
- Bulk: "Mark all as read"

**blocking/empty/error states:**
- Empty: "No open issues. Great job!"
- Overdue: Red highlight on SLA badge; count badge on board header

**SLA indicators:**
- SLA due date + days remaining per issue
- Summary at top: "[n] overdue, [m] due today"

**audit events emitted:**
- `issue_assigned`: `{issue_id, from_user_id, to_user_id, timestamp}`
- `issue_status_changed`: `{issue_id, from_status, to_status, timestamp}`

**API endpoints needed:**
- `GET /compliance-issues?org_id={org_id}&status={status}&severity={severity}` → list with SLA
- `PATCH /compliance-issues/{id}` → update status, owner, priority
- `POST /compliance-issues/{id}/escalate` → notify hierarchy

---

### Screen 3: Compliance Issue Detail

**screen_id:** `compliance-issue-detail`  
**route:** `/compliance/issues/[id]`  
**purpose:** Deep-dive and resolve single compliance issue  
**roles allowed:** Compliance Manager, Assigned User, Org Admin  
**key data widgets:**
- Header: ID, type, severity badge, status, owner, SLA countdown
- Issue detail:
  - Created: [date] by [user]
  - Related entity: Shipment [ref] or Batch [ref]
  - Description: auto-generated rule + context
  - Blocking: Yes/No (impact on shipment sealing)
- Remediation guidance:
  - Suggested action (e.g., "Upload updated FPIC document")
  - Link to related form (e.g., Plot detail, Farmer consent)
- Resolution workflow:
  - Current status + transition buttons (Assign, Wait for Partner, Mark Resolved)
  - Assignment panel: show current owner; quick reassign dropdown
- Linked records:
  - Related shipment (link to detail)
  - Related batch/plot (link to detail)
  - Related evidence docs (if any)
- Audit trail:
  - Timeline: status changes, owner changes, comments

**primary actions:**
- "Assign to [user]"
- "Mark as Waiting on Partner" (send automated reminder)
- "Mark as Resolved"
- "Reopen" (if already resolved)
- "Comment" (inline notes; visible to assigned users)

**blocking/empty/error states:**
- N/A (detail page always has data)

**SLA indicators:**
- Large red countdown if overdue
- Visual warning: "SLA breach! 3 days overdue. Escalate?"

**audit events emitted:**
- `issue_detail_viewed`: `{issue_id, user_id, timestamp}`
- `issue_resolved`: `{issue_id, resolution_reason, user_id, timestamp}`

**API endpoints needed:**
- `GET /compliance-issues/{id}` → full issue + linked entities + audit trail
- `POST /compliance-issues/{id}/assign` → assign to user
- `POST /compliance-issues/{id}/resolve` → mark resolved + reason
- `POST /compliance-issues/{id}/comments` → add comment

---

### Screen 4: TRACES Drift Monitor

**screen_id:** `traces-drift-monitor`  
**route:** `/compliance/traces-drift` (internal only, post-MVP)  
**purpose:** Monitor TRACES NT schema drift and dispatch failures  
**roles allowed:** Sponsor Admin, Compliance Manager, Tracebud Internal  
**key data widgets:**
- Health dashboard:
  - Last 30 days: [n]% success rate (target ≥ 80%)
  - DDS submissions: [count] submitted, [count] accepted, [count] rejected, [count] manual_review
  - Dispatch latency: median [time], p95 [time]
- Drift alerts:
  - Table of detected schema changes (XSD version mismatch, field removal, etc.)
  - Timestamp, severity (INFO/WARNING/BLOCKING)
  - Action: "Review & acknowledge" or "Escalate to EU"
- Failure log:
  - Recent TRACES rejections; error codes + messages
  - Link to affected DDS records

**primary actions:**
- "Acknowledge drift" (sets reviewed_at timestamp)
- "Download drift report"
- "View affected DDS records"

**blocking/empty/error states:**
- Normal: "TRACES schema stable. Last check: [timestamp]"
- Warning: "Schema drift detected in [field]. Review required within 48 hours."

**SLA indicators:**
- "Drift detected [timestamp]. 48-hour review SLA. [hours] remaining."

**audit events emitted:**
- `traces_drift_detected`: `{diff_payload, timestamp}`
- `traces_drift_reviewed`: `{diff_payload, reviewed_by_user_id, timestamp}`

**API endpoints needed:**
- `GET /monitoring/traces-health` → aggregated stats
- `GET /monitoring/traces-drifts?since={timestamp}` → drift events
- `POST /monitoring/traces-drifts/{drift_id}/acknowledge` → mark reviewed

---

### Screen 5: Shipment State Machine Detail

**screen_id:** `shipment-state-detail`  
**route:** `/packages/[id]/state` (new tab or expanded view)  
**purpose:** Show full shipment state machine + transitions + blocking path  
**roles allowed:** All  
**key data widgets:**
- Visual state diagram:
  - Circles for states (current = highlighted)
  - Arrows for valid transitions
  - Red X on blocked transitions with reason
- Timeline:
  - Each state entry with timestamp + user + action
  - Color-coded by state
- Current state detail:
  - State name + description
  - Allowed actions (buttons)
  - Blocking issues preventing exit
- Legal role determination:
  - Show evaluated role (OPERATOR, DOWNSTREAM_FIRST, etc.)
  - Show regulatory_profile_version used

**primary actions:**
- (Auto): State transitions triggered by other actions (assembly, pre-flight, submission)
- "View blocker details" → link to compliance_issue

**blocking/empty/error states:**
- N/A

**SLA indicators:**
- Time spent in current state
- (Post-MVP) SLA for manual review states

**audit events emitted:**
- None new (re-use shipment audit events)

**API endpoints needed:**
- `GET /shipments/{id}/state-history` → timeline of state changes

---

## F. MVP VS V1 SEGMENTATION

### MVP-Only Screens (Section 51 Scope)

**Always Visible:**
- `/` (Dashboard)
- `/login`
- `/plots`
- `/farmers`
- `/farmers/[id]`
- `/packages` (shipments only)
- `/packages/new`
- `/packages/[id]`
- `/packages/[id]/assemble`
- `/compliance`
- `/compliance/issues`
- `/compliance/queue`
- `/harvests`
- `/fpic`
- `/audit-log`
- `/settings`
- `/admin`

**Navigation Rules:**
```
IF role = OPERATOR OR MICRO_SMALL_PRIMARY_OPERATOR:
  Hide: /admin
IF role = FIELD_AGENT:
  Show: /plots, /farmers only
IF role = COMPLIANCE_ANALYST:
  Show: /compliance/* only
IF is_sponsor_org:
  Hide: /admin (show /sponsor-admin when Release 2)
```

### Release 2+ Screens (Behind Feature Flags)

| Screen | Route | Reason for Post-MVP | Feature Flag |
|--------|-------|-------------------|--------------|
| API_DIRECT Submission | `/compliance/api-direct` | API direct submission not in MVP scope | `FEATURE_API_DIRECT_SUBMISSION` |
| Request Campaigns | `/outreach`, `/inbox` | Request campaign workflows deferred | `FEATURE_REQUEST_CAMPAIGNS` |
| Sponsor Governance | `/sponsor-admin` | Sponsor governance post-MVP | `FEATURE_SPONSOR_GOVERNANCE` |
| Deforestation Risk | `/compliance/risk-screening` | Deforestation automation post-MVP | `FEATURE_DEFORESTATION_ENGINE` |
| Simplified Declarations | `/declarations` | Simplified path deferred to Release 2 | `FEATURE_SIMPLIFIED_DECLARATIONS` |
| Downstream Workflows | `/packages/downstream` | Downstream/trader workflows post-MVP | `FEATURE_DOWNSTREAM_WORKFLOWS` |
| Evidence Parsing | `/evidence/parsing` | Automated evidence parsing deferred | `FEATURE_AUTOMATED_EVIDENCE_PARSING` |
| Producer Wallet | `/farmers/wallet` | GeoID/self-sovereign identity post-MVP | `FEATURE_PRODUCER_WALLET` |

**Implementation:**
```tsx
// In route guards:
if (!featureFlags.get(requiredFlag)) {
  return <NotAvailableInMVP />;
}
```

---

## G. COMPONENT REUSE PLAN

### Components to Keep (No Changes)

- `<Button />` — standard shadcn button
- `<Card />, <CardHeader />, <CardContent />` — layout primitives
- `<Table />, <TableRow />, <TableCell />` — data presentation
- `<Badge />` — status badges
- `<AppHeader />` — header shell (will add org switcher)
- `<AppSidebar />` — sidebar shell (will refactor nav)
- `<PermissionGate />` — RBAC wrapper (will extend with new roles)

### Components to Refactor

| Component | Current State | Required Refactor | Impact |
|-----------|--------------|-------------------|--------|
| `<ExporterDashboard />` | Shows metrics only | Add KPI cards for blocking issues, SLA breaches, DDS queue | 5 files |
| `<SidebarNav />` | Fixed menu | Make role-aware; hide/show per MVP gating | 2 files |
| `<PackagesTable />` | Shows shipment_headers rows | Add dds_records.submission_status column; show legal_role; add "Submit DDS" action | 3 files |
| `<ComplianceCheckList />` | Hardcoded checks | Link to compliance_issues; show blocking vs. warning; track audit events | 2 files |
| `<PackageDetail />` | Shows form fields | Add state machine timeline; link related entities (dds_record, compliance_issues); show SLA | 4 files |

### New Components Required

| Component | Purpose | Used In | Complexity |
|-----------|---------|---------|------------|
| `<StateTimeline />` | Visual state machine + audit trail | Package detail, DDS detail | Medium |
| `<BlockerCard />` | Display blocking issue + SLA + action | All critical screens | Low |
| `<SLABadge />` | Show due date + days remaining + color | Compliance issues, Yield exceptions | Low |
| `<TenantSwitcher />` | Dropdown to change active org | App header | Low |
| `<RoleIndicator />` | Show current role + legal role inference | Dashboard, Package detail | Low |
| `<ComplianceIssueBoard />` | Kanban board for issues | `/compliance/issues` | High |
| `<SubmissionTimeline />` | DDS lifecycle timeline | DDS detail page | Medium |
| `<AuditEventLog />` | Timeline of audit events | Detail pages | Low |
| `<DDSPreflightSummary />` | Pre-flight checks summary + results | DDS detail, pre-flight page | Medium |
| `<YieldExceptionSLA />` | Exception request + SLA countdown | Harvest detail, issue detail | Low |

### Deprecations

- `<ComplianceCheckList />` (old static list) → replace with `<DDSPreflightSummary />`
- Mock shipment status logic → replace with canonical state machine enum

---

## H. IMPLEMENTATION ORDER (6–10 Steps)

| Step | Scope | Why This Order | Risk Reduced | Validation Criteria |
|------|-------|----------------|--------------|-------------------|
| 1 | **Expand RBAC + Role Model** | Foundation for all permission-gated screens; blocks everything else | High | New roles in useRole(); permission checks pass; admin panel shows all roles |
| 2 | **Add dds_records Table + State Machine** | Needed for DDS submission lifecycle (core MVP); unblocks compliance screens | High | DB schema migrated; dds_records linked to shipment_headers; state transitions validated |
| 3 | **Implement canonical State Machines** | Shipment, DDS, Compliance Issue, Yield Exception states; prerequisite for all detail screens | Critical | All 4 entities have immutable state history; audit_events logged per transition; UI reflects states correctly |
| 4 | **Add compliance_issues Refinements** | SLA, ownership, blocking status; needed to show blockers on critical screens | High | SLA tracking works; blockers prevent shipment sealing; ownership assignment works |
| 5 | **Refactor Shipment Detail + Assembly** | Align to canonical shipment model; add liability acknowledgement + DDS link | High | Assembly produces valid shipment_headers; pre-flight checks map to compliance_issues; audit events logged |
| 6 | **Create DDS Submission Lifecycle Screen** | Core MVP surface; shows MANUAL_ASSIST submission path end-to-end | High | User can submit DDS; TRACES response captured; screen shows all states correctly |
| 7 | **Add Navigation Gating + Role Switcher** | Complete MVP surface segregation; add org switcher to header | Medium | All MVP pages visible; Release 2+ pages hidden; org switcher works; role switcher on all roles |
| 8 | **Implement Blocker/SLA Visibility** | Add blocker cards + SLA badges to all critical screens (Dashboard, Package Detail, Compliance Issues, Harvests) | Medium | Every critical screen shows blockers; SLA badges accurate; users see action-required states |
| 9 | **Add Audit Event Logging Middleware** | All compliance-critical actions emit audit_events; audit timeline visible on detail pages | Medium | Audit events logged for all spec-required actions; audit_events table populated; export works |
| 10 | **Polish + Edge Cases** | Handle error states, empty states, permission edge cases, accessibility (WCAG 2.1 AA) | Low | All screens have meaningful error/empty states; keyboard navigation works; screen reader friendly |

---

## I. ACCEPTANCE RUBRIC

**Must-Pass Checks (V1 Alignment):**

1. ✓ **Role Model:** All 7 canonical roles (OPERATOR, MICRO_SMALL_PRIMARY_OPERATOR, DOWNSTREAM_OPERATOR_FIRST/SUBSEQUENT, TRADER, OUT_OF_SCOPE, PENDING_MANUAL_CLASSIFICATION) are implemented; role decision engine evaluates per shipment; permission matrix enforced per Section 8.
2. ✓ **State Machines:** Shipment, DDS, Compliance Issue, Yield Exception state machines are immutable; every transition is audited; no missing canonical states.
3. ✓ **MVP Gating:** MVP-only pages shown; Release 2+ pages hidden behind feature flags; no Route 51.1 (post-MVP) features visible by default.
4. ✓ **Blocker/SLA Visibility:** Every critical screen (dashboard, package detail, compliance issues, harvests) shows blocking issues with owner, reason, and next action; SLA badges show due date + days remaining.
5. ✓ **Audit Events:** All compliance-critical actions (shipment sealing, DDS submission, issue assignment, compliance approval) emit audit_events with regulatory_profile_version; audit timeline visible on detail pages.
6. ✓ **Shipment Model:** Shipment assembly produces shipment_headers + shipment_lines + shipment_line_coverages per Section 15; yield-cap pre-flight enforced; liability acknowledgement required for sealing.
7. ✓ **DDS Lifecycle:** dds_records table exists; MANUAL_ASSIST submission path shows DRAFT → READY_TO_SUBMIT → SUBMITTED → ACCEPTED/REJECTED; TRACES reference numbers captured.
8. ✓ **Compliance Issues:** All issues have owner, SLA, severity (BLOCKING/WARNING/INFO), blocking status; 5-day yield exception SLA enforced; escalation works.
9. ✓ **Tenant Isolation:** One tenant cannot access another's data; org switcher visible; active tenant shown in header.
10. ✓ **Accessibility:** All screens WCAG 2.1 AA compliant; keyboard navigation works; screen reader labels present.

**Nice-to-Have (but not blocking V1):**
- Request campaign suppression outcomes visible
- Sponsor network health dashboard
- Deforestation risk engine explainability
- ESG/CSRD metric fields present (but not live calculations)

---

## J. GLOSSARY

- **shipment_headers:** Top-level record for a shipment; contains total weight, legal_role, blocking_issues flag, compliance_package_hash.
- **shipment_lines:** Line item within shipment_headers; one per commodity/source combination.
- **shipment_line_coverages:** Coverage allocation per shipment_line; links to batches; tracks yield_check_status + compliance_issues.
- **dds_records:** Due Diligence Statement for MANUAL_ASSIST filing; links to shipment_headers; tracks submission_status + traces_reference_number.
- **compliance_issues:** Blocking or warning issue that prevents shipment sealing or DDS submission; has owner, SLA, severity.
- **yield_exception_requests:** Request to override yield-cap WARNING/BLOCKED status; has 5-day SLA.
- **audit_events:** Immutable record of every compliance-critical action; includes user, timestamp, event_type, payload, regulatory_profile_version.
- **MANUAL_ASSIST:** Filing mode where human prepares payload, reviews TRACES response; MVP-only mode.
- **API_DIRECT:** Filing mode where system auto-submits; deferred to Release 2+.
- **Zero-Risk Pre-Flight:** Secondary risk assessment for shipment pools; must pass before "Submit to TRACES" unlock.
- **PENDING_MANUAL_CLASSIFICATION:** Hold state when legal role cannot be resolved; blocks all submission.

---

**Next Step:** Use this blueprint to prioritize backlog and begin Step 1 (RBAC expansion).

