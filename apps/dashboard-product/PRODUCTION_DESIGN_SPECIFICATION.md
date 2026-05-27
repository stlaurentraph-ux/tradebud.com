# TRACEBUD PRODUCTION UI IMPLEMENTATION ROADMAP

## Critical Canonical Constraints
- **Canonical Enums ONLY** (no strings, no aliases)
- **Canonical Roles ONLY**: OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT, BILLING_CONTACT, VIEWER
- **Shipment States**: DRAFT, READY, SEALED, SUBMITTED, ACCEPTED, REJECTED, ARCHIVED, ON_HOLD
- **DDS States**: DRAFT, READY_TO_SUBMIT, SUBMITTED, ACCEPTED, REJECTED, PENDING_CONFIRMATION, AMENDMENT_DRAFT, AMENDED_SUBMITTED, WITHDRAWAL_REQUESTED, WITHDRAWN, SUPERSEDED
- **Compliance Issue States**: OPEN, IN_PROGRESS, RESOLVED, ESCALATED
- **Compliance Severity**: INFO, WARNING, BLOCKING
- **Request Campaign States**: DRAFT, QUEUED, RUNNING, COMPLETED, PARTIAL, EXPIRED, CANCELLED

## A. GLOBAL SHELL ARCHITECTURE
### Components Required:
1. **OrgSwitcher** - Multi-tenant context with active org badge
2. **RoleSwitcher** - Display current canonical role + audit log link
3. **NotificationCenter** - SLA alerts, compliance flags
4. **GlobalNav** - 5 main groups: Operations, Compliance, Requests, Reporting, Admin

### Org Switcher UI Spec:
- Dropdown showing: [OrgName] | Commercial Tier
- On switch: show org context in breadcrumb
- Enforce tenant isolation: hide data from other orgs
- Audit event: "SWITCHED_ORG" with timestamp + user + from/to org

### Role Display:
- Show: "Your Role: [CANONICAL_ROLE]"
- NO persona labels in auth logic
- Persona labels display-only under commercial tier
- Link to: "View Permission Matrix" → `/admin#role-[ROLE]`

## B. NAVIGATION STRUCTURE
```
Operations
  └─ Dashboard (/)
  └─ Shipments (/shipments)
  └─ Farmers (/farmers)
  └─ Plots (/plots)
  └─ Harvests (/harvests)

Compliance
  └─ Queue (/compliance/queue)
  └─ Issues (/compliance/issues)
  └─ FPIC/Evidence (/fpic)
  └─ Audit Log (/audit-log)

Requests
  └─ Outreach (/outreach)
  └─ Inbox (/inbox)
  └─ Role Decisions (/role-decisions)

Reporting
  └─ Reports (/reports)
  └─ Billing (/settings/billing)

Admin
  └─ RBAC Matrix (/admin/rbac)
  └─ Settings (/settings)
```

## C. 10 REQUIRED SCREENS - IMPLEMENTATION ORDER

### Screen 1: Executive Dashboard (/)
**Current Status**: Exists but needs canonical status alignment
**Must Fix**:
- Replace mock metrics with canonical shipment state counts
- Add SLA burndown for each state
- Show BLOCKING compliance issues inline
- Add shipment pipeline kanban (DRAFT → READY → SEALED → SUBMITTED → ACCEPTED)
- Role visibility: OWNER, ADMIN, COMPLIANCE_MANAGER

**Component Stack**:
- StatusChip (ShipmentStatus enum)
- SeverityBadge (ComplianceIssueSeverity enum)
- BlockerCard (for BLOCKING issues)
- TimelineRow (recent events)

---

### Screen 2: Shipments List + Detail + Timeline
**Files**: `/shipments`, `/shipments/[id]`, `/shipments/[id]/timeline`
**State Machine**:
```
DRAFT → READY → SEALED → SUBMITTED → (ACCEPTED | REJECTED | ON_HOLD)
                                         ↓
                                      ARCHIVED
```
**Canonical Status Enum**:
```typescript
type ShipmentStatus = 'DRAFT' | 'READY' | 'SEALED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED' | 'ON_HOLD';
```

**List View** (`/shipments`):
- Table columns: ID | Org | Status (StatusChip) | Created | Modified | Owner
- Filters: Status, Org, Date Range, Owner
- Bulk actions: Archive, Export (role-gated)
- SLA indicator: Red if 7+ days in DRAFT
- Role-based visibility:
  - OWNER: all shipments in org
  - ADMIN: all orgs
  - FIELD_AGENT: read-only
  - VIEWER: read-only

**Detail View** (`/shipments/[id]`):
- Header: Status (StatusChip) | Created | Modified | Owner | Org Context
- Tabs: Overview | DDS Record | Compliance | Timeline
- Overview panel:
  - Producer(s) with photo/wallet
  - Plot(s) with geometry
  - Batch info
  - State transition buttons (if role-permitted)
- Actions toolbar (role-gated):
  - READY → SEALED (requires all compliance checks RESOLVED)
  - SEALED → SUBMITTED (shows liability acknowledgement)
  - On error: show BlockerCard explaining why transition blocked

**Timeline** (`/shipments/[id]/timeline`):
- TimelineRow component for each event:
  - Who changed status (user + role)
  - When
  - From → To state
  - Metadata (e.g., "Blocked by compliance issue C-001")
- Audit events: SHIPMENT_CREATED, SHIPMENT_SEALED, SHIPMENT_SUBMITTED, SHIPMENT_REJECTED, SHIPMENT_ON_HOLD

---

### Screen 3: DDS Workspace
**Files**: `/dds` (list), `/dds/[id]` (detail), `/dds/[id]/submit` (submission)
**Canonical States**:
```typescript
type DDSStatus = 
  | 'DRAFT'
  | 'READY_TO_SUBMIT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING_CONFIRMATION'
  | 'AMENDMENT_DRAFT'
  | 'AMENDED_SUBMITTED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWN'
  | 'SUPERSEDED';
```

**Submission Checklist** (`/dds/[id]/submit`):
1. Deforestation check (PASS | FAIL | MANUAL_REVIEW)
2. Degradation check (PASS | FAIL | MANUAL_REVIEW)
3. Tenure check (PASS | FAIL | MANUAL_REVIEW)
4. Protected area check (PASS | FAIL | MANUAL_REVIEW)
5. FPIC check (PASS | FAIL | MANUAL_REVIEW)
6. Yield capacity check (PASS | WARNING | BLOCKED)
7. Evidence completeness (%)
8. Compliance issues status (all RESOLVED?)

Display as stepper with color-coded states:
- GREEN: PASS
- YELLOW: MANUAL_REVIEW / WARNING
- RED: FAIL / BLOCKED

Pre-submit button shows:
- "Ready to submit" (if all GREEN)
- "Review issues" (if YELLOW or RED)
- Liability acknowledgement checkbox + signature

---

### Screen 4: Compliance Issues Queue
**Files**: `/compliance/queue`
**Canonical Status**: OPEN, IN_PROGRESS, RESOLVED, ESCALATED
**Canonical Severity**: INFO, WARNING, BLOCKING

**Queue View**:
- Default sort: Severity (BLOCKING first), then SLA (overdue first)
- Columns: ID | Entity | Severity (SeverityBadge) | Status | SLA Countdown | Owner | Created | Actions
- Filters: Severity, Status, SLA (Overdue | Due Soon | Healthy), Owner, Entity Type
- Bulk actions (role-gated): Assign, Change Status, Close

**SLA Countdown Widget**:
- Show hours remaining
- Color: RED (overdue), YELLOW (<4h), GREEN (healthy)
- On hover: "Escalated on [date] to [role]"

**Severity Badge Component**:
- BLOCKING: Red bg, white text, icon: 🚫
- WARNING: Yellow bg, dark text, icon: ⚠️
- INFO: Blue bg, dark text, icon: ℹ️

---

### Screen 5: Compliance Issue Detail + Resolve/Escalate
**Files**: `/compliance/issues/[id]`
**Tabs**: Overview | History | Related Shipments | Timeline

**Overview Tab**:
- Header: Status (badge) | Severity (SeverityBadge) | Created | Owner
- Content:
  - Title
  - Description
  - Linked entity (e.g., "Shipment SHP-001")
  - Assigned to: [role]
  - SLA: [countdown + status]

**Action Buttons** (role-gated):
- IN_PROGRESS: "Resolve" (show comment field)
- OPEN: "Take" (assign to self)
- Any: "Escalate" (show escalation ladder modal)

**History Tab**:
- TimelineRow for each state change + comment

**Escalation Ladder Modal**:
- Show 4-tier escalation: L1 → L2 → L3 → L4
- Current level: highlighted
- Button: "Escalate to [Next Level]"
- Comment required
- Audit event: COMPLIANCE_ISSUE_ESCALATED

---

### Screen 6: Request Campaigns
**Files**: `/outreach` (list), `/outreach/[id]` (detail), `/outreach/new` (create), `/inbox` (received requests)
**Canonical States**: DRAFT, QUEUED, RUNNING, COMPLETED, PARTIAL, EXPIRED, CANCELLED

**Campaign List** (`/outreach`):
- Columns: Campaign ID | Type | Targets | Status (StatusChip) | Created | Owner | Progress
- Filters: Status, Type, Owner, Date
- Bulk actions: Cancel, Export (role-gated for ADMIN)

**Campaign Detail** (`/outreach/[id]`):
- Header: Status | Created | Owner | Sent On | Response Deadline
- Tabs: Overview | Targets | Responses | Timeline
- Overview:
  - Campaign name + description
  - Data fields requested
  - Message to recipients
  - Response count: [Responses]/[Targets]
- Targets tab:
  - Table: Recipient | Org | Response Status (OPEN | IN_PROGRESS | FULFILLED | EXPIRED | CANCELLED) | Responded At
- Responses tab:
  - For each response: Who | What data | Timestamp | Download
- Timeline:
  - CAMPAIGN_CREATED, CAMPAIGN_QUEUED, CAMPAIGN_RUNNING, CAMPAIGN_COMPLETED, CAMPAIGN_EXPIRED

---

### Screen 7: Farmers/Producers + Plot Geometry View
**Files**: `/farmers` (list), `/farmers/[id]` (detail), `/farmers/[id]/plots` (geometry)

**Farmers List** (`/farmers`):
- Columns: Name | Org | Plots | Active Plots | Wallet | Compliance Status | Last Active
- Filters: Org, Compliance Status, Has Wallet
- Bulk actions: Invite to wallet, Send request

**Farmer Detail** (`/farmers/[id]`):
- Tabs: Profile | Plots | Consent | Activity | Documents

**Plots Tab** (`/farmers/[id]/plots`):
- Map view with plot boundaries
- Plot list: Name | Area | Status (Complete | Incomplete | Blocked) | Geometry Status
- Completeness checklist:
  - Boundary (COMPLETE | PENDING)
  - Soil data (COMPLETE | PENDING)
  - Crop history (COMPLETE | PENDING)
  - Evidence (photos, docs)
- Action: "Download Geometry" (Shapefile)

---

### Screen 8: FPIC/Evidence Workspace
**Files**: `/fpic` (list), `/fpic/[id]` (detail)

**Evidence Triage View** (`/fpic`):
- Filter tabs: All | Missing | Under Review | Approved | Rejected
- Columns: Document ID | Type | Linked Entity | SHA-256 Hash (truncated) | Status | Uploaded | Owner | Reviewed
- Upload button: "Add Evidence" → Modal with file upload + provenance metadata

**Evidence Detail** (`/fpic/[id]`):
- Document card:
  - Name | Type | Size
  - SHA-256 hash (copyable)
  - Uploaded by | Timestamp
  - Linked to: [Entity type] [Entity ID]
  - Review status: APPROVED | REJECTED | PENDING_REVIEW
  - Review notes (if any)
- Timeline:
  - EVIDENCE_UPLOADED, EVIDENCE_REVIEWED, EVIDENCE_REJECTED, EVIDENCE_RESUBMITTED
- Actions (role-gated for COMPLIANCE_MANAGER):
  - Approve / Reject (with modal for reason)

---

### Screen 9: Audit Log Explorer
**Files**: `/audit-log`

**Query Builder**:
- Filter by:
  - Date range (from/to)
  - Event type (dropdown with all canonical events)
  - Entity type (Shipment, DDS, ComplianceIssue, RequestCampaign, etc.)
  - Entity ID (search)
  - User (dropdown of org users)
  - Role (dropdown of canonical roles)
- Sort: Date DESC (default)

**Results Table**:
- Columns: Timestamp | Event | Entity | User | Role | Change (if applicable)
- Row expansion: Full audit record (JSON viewer)
- Export: CSV, JSON

**Canonical Audit Events**:
- ENTITY_CREATED, ENTITY_UPDATED, ENTITY_DELETED
- STATUS_CHANGED (with from/to)
- COMPLIANCE_CHECK_EXECUTED (with result)
- ESCALATION_TRIGGERED
- ROLE_SWITCHED
- USER_INVITED
- PERMISSION_DENIED
- EXPORT_REQUESTED

---

### Screen 10: Admin / RBAC Matrix
**Files**: `/admin/rbac` (matrix view), `/admin/users` (user mgmt)

**RBAC Matrix** (`/admin/rbac`):
- Rows: Canonical roles (OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT, BILLING_CONTACT, VIEWER)
- Columns: Permissions (grouped by domain)
- Cell: Has permission (✓ | ✗)
- Read-only display for VIEWER, editable only for OWNER/ADMIN

**User Management** (`/admin/users`):
- Table: Email | Name | Org | Assigned Roles | Status | Actions
- Bulk actions: Invite, Revoke Access, Change Role
- Invite modal: Email + select roles + commercial tier confirmation

---

## D. COMPONENT INVENTORY

### StatusChip
**Props**:
```typescript
type StatusChipProps = {
  status: ShipmentStatus | DDSStatus | ComplianceIssueStatus | RequestCampaignStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onClick?: () => void;
};
```
**States**:
- DRAFT: Gray
- READY: Blue
- SEALED: Teal
- SUBMITTED: Purple
- ACCEPTED: Green
- REJECTED: Red
- ON_HOLD: Orange
- etc.

### SeverityBadge
**Props**:
```typescript
type SeverityBadgeProps = {
  severity: ComplianceIssueSeverity;
  slaCountdown?: number; // seconds remaining
  showSLA?: boolean;
  isOverdue?: boolean;
};
```

### BlockerCard
**Props**:
```typescript
type BlockerCardProps = {
  issueID: string;
  title: string;
  description: string;
  severity: ComplianceIssueSeverity;
  owner: string;
  owner_role: CanonicalRole;
  slaCountdown: number;
  actions?: { label: string; onClick: () => void }[];
  onResolve?: () => void;
};
```

### TimelineRow
**Props**:
```typescript
type TimelineRowProps = {
  timestamp: string;
  eventType: AuditEventType;
  actor: { name: string; role: CanonicalRole };
  change: { from: string; to: string };
  metadata?: Record<string, any>;
};
```

---

## E. STATE MANAGEMENT ARCHITECTURE

### Per-Page State Maps

**Shipments List**:
- Loading: skeleton rows
- Empty: "No shipments" message with create button
- Error: retry with error message
- Success: table with filters + pagination

**Compliance Queue**:
- Loading: skeleton cards
- Empty: "All issues resolved!" celebration
- Error: "Failed to load queue. [Retry]"
- Success: queue with SLA countdown

---

## F. ROLE-VISIBILITY MATRIX

| Screen | OWNER | ADMIN | COMPLIANCE_MANAGER | FIELD_AGENT | BILLING_CONTACT | VIEWER |
|--------|-------|-------|-------------------|-------------|-----------------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Shipments List | ✓ (own org) | ✓ (all) | ✓ (own org) | ✓ (read-only) | ✗ | ✓ |
| Shipment Detail | ✓ | ✓ | ✓ | ✓ (read-only) | ✗ | ✓ |
| Compliance Queue | ✓ | ✓ | ✓ | ✓ (read-only) | ✗ | ✗ |
| Compliance Issue Detail | ✓ | ✓ | ✓ | ✓ (read-only) | ✗ | ✗ |
| Request Campaigns | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Farmers/Plots | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| FPIC/Evidence | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Audit Log | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Admin/RBAC | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## G. CRITICAL VALIDATION RULES

### Shipment State Transitions (MUST enforce):
- DRAFT → READY (all compliance checks RESOLVED)
- READY → SEALED (all BLOCKING issues resolved)
- SEALED → SUBMITTED (liability acknowledgement signed)
- SUBMITTED → ACCEPTED (only by system or ADMIN)
- Any state → ON_HOLD (by ADMIN only)
- Any state → REJECTED (by ADMIN only, requires reason)
- Any state → ARCHIVED (by OWNER or ADMIN)

### DDS State Transitions (MUST enforce):
- DRAFT → READY_TO_SUBMIT (pre-flight checks GREEN)
- READY_TO_SUBMIT → SUBMITTED (liability signed)
- SUBMITTED → ACCEPTED (TRACES confirms)
- SUBMITTED → AMENDMENT_DRAFT (if TRACES rejects with amendments)
- AMENDMENT_DRAFT → AMENDED_SUBMITTED (resubmit)
- Any → WITHDRAWAL_REQUESTED (by owner)
- WITHDRAWAL_REQUESTED → WITHDRAWN (by ADMIN)
- Any → SUPERSEDED (when new DDS created for same shipment)

### Compliance Issue State Transitions (MUST enforce):
- OPEN → IN_PROGRESS (someone takes it)
- IN_PROGRESS → RESOLVED (with resolution notes)
- IN_PROGRESS → ESCALATED (with reason + escalation tier)
- ESCALATED → IN_PROGRESS (next tier assigned)
- Any → OPEN (reassign logic)

---

## H. ACCESSIBILITY REQUIREMENTS

✓ Color + Icon for status (not color-alone)
✓ Keyboard navigation (Tab, Enter, Escape)
✓ ARIA labels on all interactive elements
✓ 4.5:1 contrast ratio minimum
✓ Focus visible on buttons/links
✓ Error messages linked to form fields
✓ Loading states announced
✓ Form validation on blur (not just submit)
✓ Sortable tables with skip links
✓ Modal focus trap + auto-focus to primary action

---

## I. OPEN QUESTIONS

1. **DDS Amendment Workflow**: When TRACES returns amendments, how does the UI flow? Manual re-entry or auto-pre-fill?
2. **Evidence Review SLA**: What's the SLA for COMPLIANCE_MANAGER to review evidence? (Currently not specified in spec)
3. **Bulk Reject Logic**: If rejecting multiple shipments, what's the modal UX? Single reason or per-shipment?
4. **Role Switch Audit**: Should we audit every role switch, or only permission-sensitive operations?
5. **Mobile DDS Submission**: Is offline DDS submission in MVP? Or web-only for now?

---

## J. BUILD PRIORITY

**Phase 1 (MVP)**: Screens 1, 2, 8, 9, 10
**Phase 2 (V1.1)**: Screens 3, 4, 5, 6
**Phase 3 (V1.2)**: Screen 7 (farmers/plots geometry mapping)

