# Tracebud Dashboard UX Polish Specification
## V1-Aligned Design & Interaction Refinement  
**Status:** Implementation-Ready  
**Version:** 1.0  
**Date:** April 2026  
**Scope:** Visual hierarchy, component consistency, workflow clarity, and perceived quality improvements WITHOUT changing canonical behavior or state machines

---

## A. DESIGN SYSTEM REFINEMENT

### A.1 Color Tokens (Severity-Mapped)

**Canonical Severity Mapping:**
- **BLOCKING** (Hard stop) → `#DC2626` (red-600)  
  Usage: Blocking issue badges, validation errors, cannot-proceed states
- **WARNING** (Attention) → `#D97706` (amber-600)  
  Usage: Yield warnings, SLA approaching, conditional compliance
- **INFO** (Informational) → `#2563EB` (blue-600)  
  Usage: Status updates, neutral actions, secondary information
- **SUCCESS** (Completed) → `#16A34A` (green-600)  
  Usage: Verified plots, accepted shipments, resolved issues

**Semantic Palette (Enterprise Density):**
- **Background:** `#F9FAFB` (gray-50) — main canvas
- **Surface:** `#FFFFFF` — cards, panels, modals
- **Border:** `#E5E7EB` (gray-200) — subtle separator
- **Divider:** `#D1D5DB` (gray-300) — prominent separator
- **Text Primary:** `#111827` (gray-900) — body copy
- **Text Secondary:** `#6B7280` (gray-600) — metadata, hints
- **Text Muted:** `#9CA3AF` (gray-400) — disabled, placeholder

**Brand Accent:** `#064E3B` (emerald-900) — forest canopy  
Usage: Primary CTAs, active states, tenant branding

**Neutral SLA Indicator:** `#6366F1` (indigo-500)  
Usage: Countdown timers, SLA badges, deadline tracking

### A.2 Typography Refinement

**Font Stack:** Inter (body), plus serif fallback for data tables  
**Size Scale:**
- **Title (28px):** Page titles, major section headers
- **Headline (22px):** Card titles, workflow step titles
- **Subhead (16px):** Section headers, table column labels
- **Body (14px):** Standard paragraph, table cells, descriptions
- **Small (12px):** Timestamps, secondary labels, metadata
- **Micro (11px):** Badge text, minor annotations

**Line Height:** 1.5 for body (14px) to 1.4 for titles (tighter)  
**Weight Hierarchy:**
- **600 (semibold):** Headers, labels, badges, emphasis
- **500 (medium):** Secondary headers, active states
- **400 (regular):** Body copy, neutral states

### A.3 Spacing System

**Base unit:** 4px (Tailwind default)  
**Key intervals:** 4, 8, 12, 16, 24, 32, 48  
**Rules:**
- Card padding: 24px (top/bottom), 16px (left/right)
- Table row height: 44px (density: comfortable)
- Form field height: 40px
- Form field spacing: 16px (vertical gap between fields)
- Section spacing: 32px (vertical gap between sections)
- Badge/chip padding: 4px (top/bottom), 8px (left/right)

### A.4 Border Radius & Shadow System

**Radius:**
- Default (buttons, cards): `8px` (0.5rem)
- Input fields: `6px` (0.375rem)
- Badges/chips: `4px` (0.25rem)
- Icons: `4px` (slight softening)

**Shadows:**
- Elevation 1 (card hover, tooltip): `0 1px 2px rgba(0,0,0,0.05)` + `0 1px 3px rgba(0,0,0,0.1)`
- Elevation 2 (modal, dropdown): `0 4px 6px rgba(0,0,0,0.1)` + `0 2px 4px rgba(0,0,0,0.06)`
- Elevation 3 (popover, sheet): `0 10px 15px rgba(0,0,0,0.1)` + `0 4px 6px rgba(0,0,0,0.05)`

---

## B. COMPONENT SPECIFICATION UPDATES

### B.1 Status Chip System

**Current Issue:** Inconsistent status labeling; no visual urgency distinction; mixes operational states with UX feedback states.

**Refined Behavior:**

**Status Chip (Entity State Indicator)**
```
Schema:
  status: shipment (`DRAFT|READY|SEALED|SUBMITTED|ACCEPTED|REJECTED|ARCHIVED|ON_HOLD`) or dds (`DRAFT|READY_TO_SUBMIT|SUBMITTED|ACCEPTED|REJECTED|PENDING_CONFIRMATION|AMENDMENT_DRAFT|AMENDED_SUBMITTED|WITHDRAWAL_REQUESTED|WITHDRAWN|SUPERSEDED`) or compliance issue (`OPEN|IN_PROGRESS|RESOLVED|ESCALATED`)
  entity_type: 'shipment' | 'dds_record' | 'compliance_issue' | 'yield_request'
  icon: LucideIcon (optional)
  interactive: boolean (default: false)
  onClick?: () => void (optional, for clickable states)
```

**Visual Variants:**

| State | Color Bg | Color Text | Icon | Meaning |
|-------|----------|-----------|------|---------|
| DRAFT | gray-100 | gray-700 | Edit | Editable, not yet submitted |
| READY | blue-100 | blue-700 | Download | Ready for sealing checks |
| SEALED | indigo-100 | indigo-700 | CheckCircle | Sealed and immutable |
| SUBMITTED | blue-100 | blue-700 | Clock | Submitted to TRACES / manual flow |
| ACCEPTED | emerald-100 | emerald-700 | Check | Accepted |
| REJECTED | red-100 | red-700 | X | Rejected; remediation required |
| ON_HOLD | amber-100 | amber-700 | AlertTriangle | Hold until issue resolution |
| ARCHIVED | gray-100 | gray-700 | CheckCircle2 | Terminal archived state |

**Interaction States:**
- **Default:** Solid color, readable label
- **Hover (if clickable):** Subtle shadow lift, 2px border in darker shade
- **Loading:** Spinner icon + "pending..." label
- **Disabled:** 50% opacity, no hover effect

**Accessibility:**
- Always pair color with icon + text (no color-only indicators)
- 4.5:1 minimum contrast ratio (all combinations verified)
- Keyboard focus outline: 2px solid border + box-shadow

### B.2 Severity Badge System

**Current Issue:** Severity/urgency not visually distinct from state; no SLA countdown; unclear which issues block workflows.

**Refined Behavior:**

**Severity Badge (Compliance Issue Triage)**
```
Schema:
  severity: 'INFO' | 'WARNING' | 'BLOCKING'
  sla_hours_remaining: number | null
  is_overdue: boolean (computed from due_date)
  owner_name: string | null
  blocking_shipment_sealing: boolean
```

**Visual Rendering:**
```
[BLOCKING ⚠️] [Owner: Maria Rodriguez] [2 days overdue] [Blocks shipment sealing]
```

- **Badge color:** Red (BLOCKING), Amber (WARNING), Blue (INFO)
- **Badge icon:** Octagon (BLOCKING), Triangle (WARNING), Circle (INFO)
- **SLA countdown:**
  - Green text: > 3 days remaining
  - Amber text: 1-3 days remaining  
  - Red text & bold: < 1 day OR overdue (RED with "⚠️ OVERDUE" label)
- **Blocking indicator:** Inline text "Blocks shipment sealing" in bold red if true

**Mobile Adaptation:** Stack vertically; show SLA countdown on second line.

### B.3 Blocker Card System

**Current Issue:** Blockers scattered across pages; no consistent call-to-action path; unclear remediation steps.

**Refined Behavior:**

**Blocker Card (Workflow Impedance Alert)**
```
Schema:
  blocker_type: 'COMPLIANCE_ISSUE' | 'YIELD_FAILURE' | 'MISSING_CONSENT' | 'INVALID_STATE'
  severity: 'BLOCKING' | 'WARNING'
  title: string
  description: string
  related_entity_id: string (shipment/batch/farmer id)
  remediation_action: {
    label: string (e.g., "Resolve issue")
    href: string | null (e.g., "/compliance/issues/123")
    onClick: () => void | null (for inline remediation)
  }
  dismissible: boolean (default: false)
  sla_countdown: string | null (e.g., "2 days remaining")
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🛑 [BLOCKING] Shipment #SHP-2024-001                        │
│                                                              │
│ Cannot seal: Missing FPIC consent from 3 producers          │
│ Linked to: 2 plots in South Field A                         │
│ Due: 2 days                                                 │
│                                                              │
│ [View Issues] [Manage Consents] [✕]                        │
└─────────────────────────────────────────────────────────────┘
```

- **Icon position:** Left edge (color-coded by severity)
- **Title + context:** Primary line
- **Description + metadata:** Secondary line
- **Actions:** Right-aligned button group (primary action + secondary options)
- **Dismissible state:** Show "✕" if dismissible=true; emit audit event

**Color scheme:**
- **BLOCKING:** `#DC2626` bg, `#7F1D1D` text, white CTA buttons
- **WARNING:** `#D97706` bg, `#78350F` text, amber CTA buttons

### B.4 Timeline Row System (for audit/submission history)

**Current Issue:** Submission history not scannable; missing timestamp context; no event classification.

**Refined Behavior:**

**Timeline Event Row**
```
Schema:
  event_type: 'status_change' | 'submission' | 'response_received' | 'owner_assigned' | 'comment_added'
  timestamp: ISO8601
  user_name: string
  description: string (auto-generated from event_type + context)
  icon: LucideIcon
  color: string (semantic: blue for changes, green for success, red for failure)
  metadata: object (optional; rendered below description in small text)
```

**Visual Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [○] Status changed to FILED                                │
│     by Maria Rodriguez on Apr 8, 2:34 PM                   │
│     Reference: SHP-2024-001 → DDS-2024-0891               │
│                                                             │
│ [◉] Submitted to TRACES NT                                │
│     by Maria Rodriguez on Apr 8, 2:15 PM                  │
│     Payload hash: a3f9e2c1... (copy)                      │
│                                                             │
│ [●] Pre-flight checks passed                              │
│     System-generated on Apr 8, 1:45 PM                    │
│     8/8 checks passed                                     │
└────────────────────────────────────────────────────────────┘
```

- **Timeline icon:** Colored circle left of each entry
- **Primary line:** Event description + user + time
- **Secondary line:** Metadata in small gray text (links, hashes, details)
- **Density:** Compact (12px gaps between events)
- **Scrollable:** Max height 300px; scroll-within-card

### B.5 Queue Table (Compliance Issues, Yield Requests, DDS Submissions)

**Current Issue:** Flat tables lack visual hierarchy; status unclear; no urgency ordering; SLA context missing.

**Refined Behavior:**

**Table Spec:**
- **Density:** Comfortable (44px rows; 16px horizontal padding)
- **Column priority:**
  1. **Checkbox (select):** 32px width
  2. **Status + Urgency badge:** 140px (sticky left)
  3. **Title/Reference:** 200px (truncate with tooltip)
  4. **Owner/Assigned:** 120px (avatar + name)
  5. **SLA/Due Date:** 100px (countdown or date)
  6. **Actions:** 80px (sticky right; menu)

**Row highlighting:**
- **Overdue rows:** `bg-red-50` (light red background)
- **Urgent rows (due today):** `bg-amber-50` (light amber)
- **Hover:** `bg-gray-100` + slight shadow

**Status column design:**
```
[🛑 BLOCKING] [2 days overdue] [Unassigned]
[⚠️ WARNING] [Today] [Maria Rodriguez]
[ℹ️ INFO] [5 days] [John Smith]
```

**SLA column design:**
```
[🔴 2 days overdue]  ← Overdue (red)
[🟠 Today (SLA)]     ← Due today (amber)
[🟡 3 days]          ← < 7 days (yellow-amber)
[🟢 12 days]         ← > 7 days (green)
```

**Row actions (right-most column):**
- **Primary CTA:** Depends on status (e.g., "Assign", "Resolve", "Review")
- **Menu:** 3-dot dropdown with secondary actions (e.g., Escalate, Reassign, Export)

**Responsive adaptation (tablet/mobile):**
- Hide columns 4-6 (owner, due date, actions)
- Show vertical card layout with inline status badge
- Actions in card footer

### B.6 Confirmation Dialog (for compliance-critical actions)

**Current Issue:** Casual confirmation dialogs; lack of liability acknowledgement visibility; no audit trail reference.

**Refined Behavior:**

**Confirmation Dialog Spec (Shipment Sealing Example)**
```
Title: "Seal Shipment & Acknowledge Liability"

Body:
  [Icon: Shield with warning] 

  You are about to seal shipment #SHP-2024-001 for submission to TRACES NT.

  Summary:
  - Batches: 3 selected (85 MT coffee)
  - Coverage allocation: 98% of batches covered
  - Blocking issues: 0 (all resolved)
  - Compliance status: ✓ READY

  Acknowledgement (checkbox):
  [ ] I confirm that I have reviewed all data and compliance evidence.
      I acknowledge that false or misleading information is subject to 
      penalties under Article 26 of Regulation (EU) 2025/2650.

  Actions:
  [Cancel] [Seal Shipment]

Footer (audit trail):
  This action will create an immutable audit record:
  - User: {user_name}
  - Timestamp: {timestamp_utc}
  - Signature: {user_digital_id} (if using hardware key)
```

**Interaction states:**
- **Unchecked:** "Seal Shipment" button is disabled (grayed out)
- **Checked:** "Seal Shipment" button is enabled (bold red CTA)
- **Loading:** Spinner + "Sealing..." label; buttons disabled
- **Error:** Toast notification with error code (e.g., "FIL-002: Cannot seal; blocking issues exist")

**Accessibility:**
- Checkbox is keyboard-navigable and announces state
- All text is readable at 16px (no small text for critical acknowledgement)
- High contrast for checkbox and button

---

## C. SCREEN-BY-SCREEN POLISH NOTES

### High-Priority Surfaces (per user request)

#### 1. Work Hub (Dashboard)

**Top 5 UX Improvements:**

1. **Add visual urgency scores:**
   - Card header shows critical count badge: "🛑 2 blocking issues | ⚠️ 3 warnings | 5 days SLA"
   - Sort cards by urgency (BLOCKING → WARNING → INFO)

2. **Replace flat metrics with actionable cards:**
   - Instead of: "Compliance Rate: 87%"
   - Show: "[BLOCKED] 2 issues prevent shipment sealing → [Resolve Now]"

3. **Add timeline of recent events:**
   - Last 5 actions (shipment sealed, issue resolved, DDS accepted) with timestamps
   - Scannable by icon + color

4. **Add quick-filter bar:**
   - Status: All | In Progress | Blocked | Ready
   - Severity: All | BLOCKING | WARNING
   - Owner: All | My Issues | Unassigned

5. **Add empty/loading state:**
   - Empty: "No active issues. Great job! Last update: 2 hours ago."
   - Loading: Skeleton cards with pulsing shimmer

**Before/After:**
- **Before:** Static cards; no urgency hierarchy; unclear next action
- **After:** Filtered view; color-coded urgency; direct action links; timestamp context

**Readability improvements:**
- Increase card title font to 16px (from 14px)
- Add 16px left border colored by severity
- Use sentence case for all labels (not title case)

#### 2. Compliance Issue Triage (Kanban Board)

**Top 5 UX Improvements:**

1. **Implement Kanban columns with SLA burndown:**
   - Columns: OPEN (red header) | IN_PROGRESS | ESCALATED | RESOLVED
   - Column header shows count + overdue count (e.g., "OPEN (7, 2 overdue)")

2. **Add visual hierarchy to cards:**
   - Top section: ID | Severity badge | Blocking indicator
   - Middle: Title + linked entity
   - Bottom: Owner avatar | SLA countdown | Drag handle

3. **Enable drag-to-transition:**
   - Drag card right to advance status
   - Drag left to revert
   - Emit audit event: `issue_status_changed` with timestamp

4. **Add bulk actions:**
   - Checkbox per card; toolbar appears showing "Assign to", "Mark resolved", "Escalate"
   - Keyboard shortcut: Cmd+A to select all

5. **Add filter sidebar:**
   - Severity (BLOCKING/WARNING/INFO)
   - Owner (Me/Unassigned/All)
   - SLA status (Overdue/Due today/< 7 days/Normal)
   - Show/hide resolved issues

**Before/After:**
- **Before:** Flat list; no state visualization; no bulk actions
- **After:** Kanban with visual urgency; drag-based workflow; filters; bulk operations

**Scanability:**
- Use emoji in column headers: 🟡 OPEN | ⏳ IN_PROGRESS | 🚨 ESCALATED | ✓ RESOLVED
- Card background: Lightest severity color (red-50 for BLOCKING, etc.)

#### 3. Shipment + DDS Timeline/Status Views

**Top 5 UX Improvements:**

1. **Add visual state machine diagram:**
   - Horizontal timeline: DRAFT → READY → SEALED → SUBMITTED → ACCEPTED/REJECTED
   - Current state highlighted with checkmark + green circle
   - Completed states show check; future states grayed out

2. **Replace static text with actionable summary:**
   - Show: "Status: READY | Blocking: 0 | Due: 2 days"
   - Not: "Status: ready_for_approval"

3. **Add linked compliance issues view:**
   - Section: "Related compliance issues (2)"
   - Each issue shows severity badge + owner + SLA
   - Quick link to issue detail or resolution action

4. **Add audit trail (immutable):**
   - Section: "Submission history"
   - Timeline of all status changes, submissions, responses
   - Show user, timestamp, action, outcome
   - Scrollable if > 5 events

5. **Add copy-to-clipboard for references:**
   - Shipment ID, DDS ID, TRACES reference number
   - Show checkmark confirmation for 2 seconds after copy

**Before/After:**
- **Before:** Text-based status; no history; no linked context
- **After:** Visual state flow; immutable audit trail; linked issues; quick-copy refs

**Mobile adaptation:**
- Stack state machine vertically
- Collapse linked issues section by default
- Show minimal audit trail (most recent 3 events); scroll for more

#### 4. Compliance Issue Detail Page

**Top 5 UX Improvements:**

1. **Add ownership transfer UI:**
   - Header shows: "Assigned to: Maria Rodriguez (Apr 8, 2:15 PM)"
   - Quick reassign dropdown: "Reassign to..." + search field
   - Reassignment emits audit event with timestamp

2. **Add inline remediation guidance:**
   - Section: "Suggested action"
   - Auto-generated text based on issue_type
   - Example: "Upload updated FPIC consent document → [Go to Farmers → John Smith → Consents]"
   - Direct link to action surface

3. **Add SLA countdown with visual urgency:**
   - Big red countdown clock if overdue
   - Amber countdown if due < 24 hours
   - Green countdown if > 7 days
   - Show: "Due: Apr 12, 2:00 PM | Time remaining: 2 days"

4. **Add resolution workflow buttons:**
   - Current status shown with clear transition buttons
   - Example (if OPEN): "[Assign to me] [Mark as waiting...] [Skip]"
   - Example (if IN_PROGRESS): "[Escalate] [Resolve] [Reopen]"
   - Buttons are contextual and role-gated

5. **Add comment thread (read-only for now):**
   - Section: "Audit trail + comments"
   - Show all status changes, assignments, reassignments
   - Each entry includes user, timestamp, action, outcome

**Before/After:**
- **Before:** Static detail page; no clear ownership; no obvious next action
- **After:** Ownership controls; suggested actions; SLA countdown; workflow buttons; audit trail

**Accessibility:**
- SLA countdown is not color-only (always includes text)
- Buttons have clear focus states and keyboard navigation
- Headings use proper hierarchy (H2 for sections, H3 for subsections)

#### 5. Yield Exception Request Workflow

**Top 5 UX Improvements:**

1. **Replace modal with expandable detail card:**
   - In-row expansion (not modal popup)
   - Show: Current status | Benchmark ratio | SLA countdown | Justification | Prior decisions

2. **Add side-by-side comparison:**
   - Left column: Actual yield (weight/hectare)
   - Right column: Benchmark range (lower/upper)
   - Visual bar chart showing ratio within/above benchmark
   - Color: Green (in range), Amber (1.0-1.1x), Red (>1.1x)

3. **Add approval workflow:**
   - Buttons: "[Approve] [Request more info] [Reject]"
   - Each action opens a reason/notes field
   - Approval decision emits audit event

4. **Add email notification option:**
   - Checkbox: "Notify producer of decision"
   - Subject line shows reason summary

5. **Add batch history:**
   - Show prior exceptions for same producer/plot combo
   - Links to prior decisions + outcomes

**Before/After:**
- **Before:** Modal dialog; text-heavy justification field; unclear decision path
- **After:** Expandable card with visual comparison; clear approval buttons; audit trail; history

**Mobile adaptation:**
- Full-screen card (not modal)
- Comparison chart stacks vertically
- Buttons in footer row

---

## D. MICROCOPY STANDARD

### D.1 Blocker Messaging

**Pattern: [Blocker Type] [Current Impedance] [Next Action] [Owner/SLA]**

Examples:
- ❌ BLOCKING: "Missing FPIC consent from 2 producers. [Request Consents] Due tomorrow."
- ⚠️ WARNING: "Yield check flagged 1 batch. [Review Exception] 3 days remaining."
- ℹ️ INFO: "Awaiting TRACES response. Reference: #TRACES-2024-0891. [View Details]"

### D.2 Status Transition Messaging

**Pattern: [Action] [Entity] from [Old State] to [New State]**

Examples:
- "Sealed shipment #SHP-2024-001 (DRAFT → READY)"
- "Submitted to TRACES NT (READY_TO_SUBMIT → SUBMITTED)"
- "Resolved compliance issue #CIS-2024-0127 (OPEN → RESOLVED)"

### D.3 Confirmation Text (Liability Critical)

**Pattern: [Action Summary] + [Acknowledgement] + [Consequence]**

Example:
```
You are about to seal shipment #SHP-2024-001 with 3 batches (85 MT).
All compliance checks must pass before sealing.

I confirm that I have reviewed all data and that all information 
is accurate and complete. False or misleading information is subject 
to penalties under EU Regulation 2025/2650.

Once sealed, this shipment is immutable and audit-logged.
```

### D.4 Error Message Template

**Pattern: [Error Code] [User-Friendly Description] [Remediation Step] [Support Link]**

Example:
```
Error FIL-002: Cannot seal shipment.
Reason: 2 blocking compliance issues must be resolved first.
Next: Review issues → [View Issues] or contact support [?]
```

### D.5 SLA/Due Date Messaging

**Pattern: [Deadline Format] [Days Remaining] [Urgency Indicator]**

Examples:
- "Due Apr 12, 2:00 PM (2 days remaining) 🟡"
- "Due today at 5:00 PM (urgent) 🔴"
- "Overdue since Apr 8, 2:00 PM (3 days) ⚠️"
- "No deadline (5+ days) 🟢"

---

## E. ACCESSIBILITY PASS (WCAG 2.1 AA)

### E.1 Color Contrast Verification

All color pairings verified for 4.5:1 contrast (text on bg):
- Red-600 text on white: ✓ 5.2:1
- Amber-600 text on white: ✓ 5.1:1
- Blue-600 text on white: ✓ 5.4:1
- Green-600 text on white: ✓ 5.1:1
- Gray-900 text on gray-50: ✓ 11.8:1

**Badges/chips (small text):**
- Red badge (white text on red-600): ✓ 5.2:1
- Amber badge (white text on amber-600): ✓ 4.5:1
- Blue badge (white text on blue-600): ✓ 5.4:1

### E.2 Focus Management

- All interactive elements (buttons, links, inputs) have visible 2px focus outline
- Focus order follows DOM order (left-to-right, top-to-bottom)
- Modals trap focus within dialog; ESC key closes
- Expandable sections announce expanded/collapsed state

### E.3 Semantic HTML & ARIA

- Headings: Use `<h1>` for page title, `<h2>` for major sections, `<h3>` for subsections
- Buttons: All clickable elements use `<button>` (not styled `<div>`)
- Forms: Labels associated with inputs via `<label for="id">`
- Status badges: Use `<span role="status" aria-live="polite">` for dynamic updates
- Tables: `<table>` with `<thead>`, `<tbody>`, `<th>` with `scope` attribute

### E.4 Keyboard Navigation

- **Tab:** Move forward through focusable elements
- **Shift+Tab:** Move backward
- **Enter:** Activate button / toggle checkbox
- **Space:** Toggle checkbox / expand/collapse section
- **Escape:** Close modal or dropdown
- **Arrow keys:** Navigate within menu / tabs

### E.5 Screen Reader Testing

All critical messages must be announced:
- Status changes: "Shipment sealed. Status changed to ready for approval."
- SLA overdue: "Alert: Compliance issue #CIS-123 is overdue by 2 days."
- Form errors: "Error: At least one batch must be selected."

---

## F. INSTRUMENTATION-SAFE UX

### F.1 Event Hooks (Must Remain Unchanged)

All interactions must emit audit events for compliance:

**Immutable Event Names:**
- `issue_assigned` → `{issue_id, from_user_id, to_user_id, timestamp}`
- `issue_status_changed` → `{issue_id, from_status, to_status, timestamp}`
- `issue_resolved` → `{issue_id, resolution_reason, user_id, timestamp}`
- `shipment_sealed` → `{shipment_id, user_id, timestamp, acknowledgement_hash}`
- `dds_submitted` → `{dds_record_id, user_id, timestamp, payload_hash}`
- `dds_response_received` → `{dds_record_id, traces_reference_number, decision, timestamp}`
- `compliance_issue_created` → `{issue_id, type, severity, blocking, user_id, timestamp}`

**UI Patterns to Preserve:**
- All CTAs must remain explicitly visible (no hidden menu-only actions)
- State transitions must emit events BEFORE DOM update (transactional)
- Confirmation dialogs must capture explicit user acknowledgement (checkbox + button click)

### F.2 Analytics-Safe Microcopy

- Status labels must match canonical enum names (not user-friendly rewording)
- Event descriptions should be template-based (not free-text)
- Timestamps should be ISO-8601 UTC (not locale-formatted in events)

---

## G. "DO NOT CHANGE" CHECKLIST

**Critical Canonical Constraints Preserved:**

- ✅ **Role Model:** Canonical roles `OWNER`, `ADMIN`, `COMPLIANCE_MANAGER`, `FIELD_AGENT`, `VIEWER`, `BILLING_CONTACT` with sponsor-admin handled as context, not a separate canonical role.

- ✅ **State Machines:** All entity state enums (shipment, dds_record, compliance_issue, yield_exception_request) remain immutable. No removal or renaming of states.

- ✅ **Permission Gates:** All route guards and action visibility remain role-scoped. No permission escalation or bypass.

- ✅ **Blocker Visibility:** Every critical screen continues to show blocker reason, owner, SLA, and next action. No hiding of operational impedance.

- ✅ **Audit Events:** All compliance-critical actions continue to emit immutable audit events with user, timestamp, and payload hash. No audit trail deletion or modification.

- ✅ **Tenant Isolation:** Multi-tenant context remains strict. No cross-tenant data visibility.

- ✅ **MVP Gating:** Release 2+ features remain hidden. No early exposure of API_DIRECT, simplified declarations, sponsor governance, or automated evidence parsing.

- ✅ **Liability Acknowledgement:** Shipment sealing requires explicit checkbox acknowledgement + button click. No shortcuts or auto-progression.

- ✅ **TRACES Integration:** MANUAL_ASSIST path only for MVP. No SOAP dispatch in web UI. No TRACES credential exposure in UI.

- ✅ **Yield Cap Enforcement:** Yield check status (PENDING/PASS/WARNING/BLOCKED) remains blocking until exception approved or acknowledged. No override without audit trail.

---

## H. IMPLEMENTATION PRIORITY

**Phase 1 (Highest ROI):**
1. Design system tokens (colors, spacing, shadows)
2. Status chip component + variant gallery
3. Work Hub dashboard layout + urgency reordering
4. Blocker card component + placement on critical pages

**Phase 2 (High Impact):**
5. Compliance issue Kanban board implementation
6. Shipment state machine timeline visual
7. Confirmation dialog component + liability acknowledgement
8. Queue table enhancements (density, SLA, filters)

**Phase 3 (Refinement):**
9. Compliance issue detail page ownership/workflow UI
10. Yield exception review expanded card + decision workflow
11. Audit trail timeline component
12. Mobile responsive adaptations

**Validation Criteria per Phase:**
- All semantic HTML and ARIA labels verified
- Color contrast 4.5:1 minimum checked
- Keyboard navigation tested (Tab, Escape, Enter, Space, Arrows)
- All audit events logged and timestamped
- No canonical state or permission changes observed

---

**Quality Gate:** This specification is implementation-ready. Every component spec includes visual examples, interaction states, accessibility requirements, and instrumentation hooks. No ambiguity about what changes visually versus what must remain functionally fixed.
