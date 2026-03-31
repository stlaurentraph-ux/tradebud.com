# Tracebud Dashboard v0 Design Context

Use this file as the **first input** in Vercel v0 when generating dashboard UI concepts.

## Canonical read order

1. `../../MVP_PRD.md`
2. `../../PRODUCT_PRD.md`
3. `../../JTBD_PRD.md`
4. `../../REQUIREMENTS.md`
5. `../../BUILD_READINESS_ARTIFACTS.md`
6. `./PERMISSIONS_MATRIX.md`

If anything conflicts, follow the read-order priority above.

## What v0 should design

Design the **unified multi-tenant dashboard product** for Tracebud's EUDR-first MVP with these core surfaces:

- Personal work dashboard (tasks, blockers, overdue)
- Supplier onboarding and remediation views
- Field/plot review and verification views
- Shipment readiness and validation views
- Filing pre-flight and submission status views
- Risk review and override views
- Sponsor oversight dashboard (cross-org rollup)
- Record-linked chat/issues panel

## Hard scope constraints (MVP)

- EUDR only (no multi-regulation UX)
- One main filing path
- One primary risk-provider path
- Operational dashboards first (not BI exploration)
- Template-based workflows (not no-code builder canvas)
- Mobile is field-capture-first (dashboard is web-first)

## Canonical roles for UI behavior

Use these role names in UX and role switch mockups:

- Field Agent
- Field Manager
- Supplier User
- Org Admin
- Compliance Analyst
- Compliance Manager
- Risk Reviewer
- Sponsor Admin
- Auditor / Read Only

Permissions and sensitive actions are constrained by `./PERMISSIONS_MATRIX.md`.

## Must-show status language

Do not invent new status taxonomies. Use canonical labels from build readiness artifacts:

- Supplier: `draft`, `invited`, `in_progress`, `submitted`, `under_review`, `approved`, `active`, `changes_requested`, `rejected`, `suspended`
- Plot: `draft`, `captured`, `synced`, `under_review`, `verified`, `rejected`, `archived`
- Shipment: `draft`, `collecting_data`, `validating`, `blocked`, `ready_for_approval`, `approved_for_filing`, `filed`, `filing_failed`, `filing_accepted`
- Filing package: `draft`, `generated`, `preflight_passed`, `preflight_failed`, `submitted`, `accepted`, `failed`, `needs_manual_review`, `regenerated`
- Issue: `open`, `assigned`, `waiting_on_partner`, `updated`, `resolved`, `reopened`, `dismissed`
- Chat thread: `open`, `waiting_internal`, `waiting_partner`, `resolved`, `reopened`

## UX priorities for v0 concepts

- Show blockers and next actions first.
- Keep explicit tenant context visible in header/switcher.
- Make role-sensitive actions obvious (view vs review vs approve vs submit).
- Show risk explanations and override rationale requirements inline.
- Keep submission timeline/audit visibility explicit.
- Support cross-record collaboration through embedded thread panels.

## Required domains to include in page set

- Multi-tenant admin
- Supplier onboarding
- Plot review
- Shipment dossier
- Risk scoring
- Filing submission
- Sponsor oversight
- Audit export

## Error and empty-state cues to include

Use these codes in UX examples where relevant:

- `GEO-001`, `GEO-002`
- `MOB-001`, `MOB-002`
- `DOC-001`, `DOC-002`
- `VAL-001`, `VAL-002`
- `RISK-001`, `RISK-002`
- `WF-001`
- `FIL-001`, `FIL-002`, `FIL-003`
- `AUTH-001`, `TEN-001`

## Analytics-aware component hints

Important interactions should be easily event-instrumentable:

- Tenant switch
- Supplier submitted/approved
- Shipment validation run
- Risk screening completed
- Pre-flight completed
- Filing submitted/response received
- Issue created/resolved
- Audit bundle exported

## Copy-paste prompt for Vercel v0

```text
Design a modern enterprise web dashboard for Tracebud, an EUDR-first multi-tenant compliance platform.

Use this canonical context in priority order:
1) MVP_PRD.md
2) PRODUCT_PRD.md
3) JTBD_PRD.md
4) REQUIREMENTS.md
5) BUILD_READINESS_ARTIFACTS.md
6) PERMISSIONS_MATRIX.md

Design for these roles: Field Agent, Field Manager, Supplier User, Org Admin, Compliance Analyst, Compliance Manager, Risk Reviewer, Sponsor Admin, Auditor/Read Only.

Include these dashboard surfaces:
- Personal task/blocker dashboard
- Supplier onboarding + remediation
- Plot review/verification
- Shipment readiness + validations
- Filing pre-flight + submission timeline
- Risk review + override
- Sponsor cross-org oversight
- Record-linked chat/issues panel

Hard constraints:
- EUDR only in v1
- one filing path, one risk-provider path
- operational dashboards first
- strict tenant isolation and role-scoped actions
- explicit blocker/warning states
- auditable submission + override flows

Use canonical status labels (do not invent new names):
Supplier: draft/invited/in_progress/submitted/under_review/approved/active/changes_requested/rejected/suspended
Plot: draft/captured/synced/under_review/verified/rejected/archived
Shipment: draft/collecting_data/validating/blocked/ready_for_approval/approved_for_filing/filed/filing_failed/filing_accepted
Filing package: draft/generated/preflight_passed/preflight_failed/submitted/accepted/failed/needs_manual_review/regenerated
Issue: open/assigned/waiting_on_partner/updated/resolved/reopened/dismissed
Thread: open/waiting_internal/waiting_partner/resolved/reopened

Generate:
1) information architecture
2) navigation model
3) key screens and states
4) role-based action visibility notes
5) empty/error states (include codes like VAL-001, RISK-002, FIL-002, AUTH-001)
6) reusable component system for status chips, blocker cards, risk cards, submission timeline, and audit panels
```

