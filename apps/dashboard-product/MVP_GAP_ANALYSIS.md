# MVP Gap Analysis: Dashboard Product

## Current Implementation Summary

| Page | Status | Description |
|------|--------|-------------|
| `/` (Dashboard) | Done | Role-adaptive home with 4 dashboards (Supplier/Buyer/Producer/Reviewer) |
| `/packages` | Done | DDS Packages list with create/view actions |
| `/packages/[id]` | Done | Package detail with plots, farmers, status, compliance actions |
| `/packages/new` | Done | New package creation form |
| `/compliance` | Done | Zero-Risk Pre-Flight Check page |
| `/plots` | Done | Plot inventory with deforestation risk breakdown |
| `/farmers` | Done | Farmer registry with compliance status |
| `/reports` | Done | Reports & Analytics dashboard |
| `/admin` | Done | Admin panel with Orgs/Users/Roles tabs |
| `/settings` | Done | User settings page |
| `/login` | Done | Login page |

---

## Step 1: MVP Gaps Identified

### A. Missing Pages (MVP)

| Gap | Requirement | User Role | Priority |
|-----|-------------|-----------|----------|
| **Harvests/Batches Page** | REQUIREMENTS.md VII - Supply chain batches with yield-cap validation | Supplier, Producer | MVP |
| **FPIC Repository Page** | REQUIREMENTS.md VI - Upload FPIC documents, community minutes | Supplier, Producer | MVP |
| **Audit Log Page** | REQUIREMENTS.md IX - 5-year retention, full activity trail | All roles | MVP |
| **Organization Settings Page** | REQUIREMENTS.md II - Delegated admin, invite users | Org Admins | MVP |

### B. Missing Workflows (MVP)

| Gap | Requirement | Current State | Fix Needed |
|-----|-------------|---------------|------------|
| **Yield Cap Validation** | VII - Cross-reference delivery weights vs polygon capacity | Not implemented | Add to batch/harvest creation flow |
| **Pre-Flight Check Integration** | VII - Gate TRACES submission on zero-risk check | Compliance page exists but not linked from package detail | Link from package [id] page |
| **Role Switching** | II - Users can belong to multiple orgs with different roles | Sidebar shows role but no switcher UI | Add role/org switcher |
| **Data Sharing Request/Grant** | II - Request-Grant architecture | Not implemented | Add shared packages view for Buyer |

### C. Missing Role-Specific Views (MVP)

| Gap | Requirement | Role | Current State |
|-----|-------------|------|---------------|
| **Buyer Shared Packages** | II - Buyers see packages shared with them | Buyer | Dashboard exists but no shared-packages list page |
| **Producer Land Dashboard** | II - Producers manage farmers/plots | Producer | Dashboard exists but needs distinct `/producer/land` view |
| **Reviewer Compliance Queue** | II - Reviewers have approval queue | Reviewer | Dashboard exists but no `/review/queue` page |

### D. Missing States/Edge Cases (MVP)

| Gap | Requirement | Location |
|-----|-------------|----------|
| **Amber Flag for Protected Areas** | VI - Overlap with parks/indigenous → Amber review, not auto-reject | Compliance check list |
| **Declaration in Excess Warning** | VII - Excess batching liability warning | Package creation flow |
| **Simplified Declaration for Micro/Small** | I - One-time declaration for small operators | Settings or onboarding |
| **Failed TRACES Submission State** | VIII - Handle TRACES errors gracefully | Package detail page |

### E. Post-MVP / Enterprise-Only (DO NOT BUILD NOW)

| Feature | Reason |
|---------|--------|
| ESG Platform Connectors (EcoVadis, Sustainalytics) | REQUIREMENTS.md X - Future-proofing |
| Cool Farm Tool API Integration | X - Climate metrics |
| AgStack GeoID Integration | X - Open DPI integration |
| GS1 EPCIS Data Export | X - Standardized event sharing |
| National Registry Sync (ICF, IHCAFE) | VIII - Inbound integration |
| TRACES NT SOAP Middleware | VIII - Backend integration, not UI |
| Biodiversity/Climate Metrics (ESRS) | X - Future ESG reporting |

---

## Step 2: MVP Gap Designs

### Gap 1: Harvests/Batches Page (`/harvests`)

**Why needed:** REQUIREMENTS.md VII requires tracking Identity-Preserved batches with yield-cap validation. Currently no way to record harvest weights or validate against plot capacity.

**Requirement:** "The backend must cross-reference delivery weights against the biological carrying capacity of the farmer's verified polygon to flag illicit blending or laundering."

**User roles:** Supplier (full CRUD), Producer (view/create), Buyer (view only)

**Priority:** MVP

**Design spec:**
- Page at `/harvests` with:
  - Summary cards: Total Batches, Total Weight (kg), Avg Yield/Ha, Flagged Batches
  - Table: Batch ID, Plot, Farmer, Weight (kg), Expected Yield, Status (Pass/Warning/Blocked), Date
  - Yield cap warning: If weight > (plot_area * kg_per_ha_cap), show amber badge
  - Filters: By plot, farmer, date range, status
  - Action: "Record Harvest" button opens modal with plot select, weight input, date
- Reuses existing patterns from `/plots` and `/packages`

---

### Gap 2: FPIC Repository Page (`/fpic`)

**Why needed:** REQUIREMENTS.md VI states "A single digital signature is insufficient to prove FPIC during an audit. The app must include a repository module to upload PDFs/photos of community assembly minutes."

**Requirement:** Direct quote from VI.

**User roles:** Supplier (upload/view), Producer (upload/view), Buyer (view only)

**Priority:** MVP

**Design spec:**
- Page at `/fpic` with:
  - Summary cards: Total Documents, Verified, Pending Review, Expired
  - Document list: Name, Type (Minutes, Agreement, Consent Form), Farmer/Community, Upload Date, Expiry, Status
  - Upload action: Modal with document type select, file upload, associated farmer/plot, date
  - Document preview: Click to expand/download
  - Expiration warnings: Documents > 1 year flagged for renewal
- Reuses Card, Table, Badge patterns

---

### Gap 3: Audit Log Page (`/audit-log`)

**Why needed:** REQUIREMENTS.md IX mandates "all due diligence documentation... be stored securely for exactly 5 years." An audit trail is required.

**Requirement:** "5-Year Retention" + Privacy vs Transparency section.

**User roles:** All roles (view), Admin (export)

**Priority:** MVP

**Design spec:**
- Page at `/audit-log` with:
  - Filters: Date range, User, Action type, Entity (Package, Plot, Farmer)
  - Table: Timestamp, User, Action, Entity, Changes (JSON diff preview), IP
  - Export: "Export CSV" button for admins
  - Pagination: Load more / infinite scroll
- Reuses existing Table component

---

### Gap 4: Organization Settings Page (`/settings/organization`)

**Why needed:** REQUIREMENTS.md II states "delegated administration allows individual organizations to independently invite their own employees, assign them specific roles."

**Requirement:** "Delegated Administration" section.

**User roles:** Org Admin only

**Priority:** MVP

**Design spec:**
- Page at `/settings/organization` with:
  - Tabs: Members, Invitations, Settings
  - Members tab: List with Name, Email, Role, Last Active, Actions (Edit Role, Remove)
  - Invitations tab: Pending invites with Resend/Revoke actions
  - Settings tab: Org name, logo, billing info (placeholder for future)
  - Invite flow: Email input, role select, send button
- Reuses existing `/admin` patterns but scoped to current org

---

### Gap 5: Pre-Flight Check Link from Package Detail

**Why needed:** REQUIREMENTS.md VII requires "Zero-Risk Pre-Flight Check" must run BEFORE TRACES submission is enabled.

**Current state:** Compliance page exists at `/compliance` but is standalone. Package detail at `/packages/[id]` has "Run Compliance" button but it links to `/packages/${pkg.id}/compliance` which doesn't exist.

**Fix needed:** Change link to `/compliance?package=${pkg.id}` OR create `/packages/[id]/compliance` page that wraps the compliance components.

**Priority:** MVP

**Design spec:**
- Add query param support to `/compliance` page: read `?package=` and pre-select that package
- OR duplicate compliance components into `/packages/[id]/compliance`
- Recommendation: Use query param approach (less code duplication)

---

### Gap 6: Role/Organization Switcher

**Why needed:** REQUIREMENTS.md II states "Users can belong to multiple Organizations" with different roles.

**Current state:** Sidebar shows active role but no way to switch.

**Priority:** MVP

**Design spec:**
- Add to sidebar footer (above user profile):
  - Current org name + role badge
  - Dropdown to switch org/role
  - Triggers page refresh with new context
- Reuses existing dropdown menu patterns

---

### Gap 7: Buyer Shared Packages View

**Why needed:** REQUIREMENTS.md II describes "Request-Grant" model where suppliers share packages with buyers.

**Current state:** Buyer dashboard exists but has no distinct list of shared packages.

**Priority:** MVP

**Design spec:**
- `/packages` page already exists; add a "Shared With Me" tab for buyers
- Table shows: Package Code, Supplier, Share Date, Status, View button
- Buyer cannot edit, only view and flag for review

---

### Gap 8: Reviewer Compliance Queue

**Why needed:** REQUIREMENTS.md II states Reviewers need to "Review and verify compliance submissions."

**Current state:** Reviewer dashboard exists but no queue page.

**Priority:** MVP

**Design spec:**
- `/compliance/queue` page with:
  - Table: Package, Supplier, Submitted Date, Risk Level, Status, Actions
  - Actions: Approve, Request Changes, Reject
  - Filters: By risk level, date, status
- Only visible to the reviewer role (`country_reviewer` internal key)

---

## Summary: MVP Implementation Order

1. **Fix package.json** (DONE - already restored)
2. **Gap 5: Pre-Flight Check Link** (Quick fix)
3. **Gap 6: Role/Org Switcher** (Sidebar enhancement)
4. **Gap 7: Buyer Shared Packages Tab** (Extend existing page)
5. **Gap 8: Reviewer Compliance Queue** (New page)
6. **Gap 1: Harvests/Batches Page** (New page)
7. **Gap 2: FPIC Repository Page** (New page)
8. **Gap 3: Audit Log Page** (New page)
9. **Gap 4: Organization Settings Page** (New page)

---

*Document version: MVP gap analysis. References REQUIREMENTS.md (repository root).*
