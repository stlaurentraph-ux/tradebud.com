# Dashboard MVP Implementation Plan

**Based on:** TRACEBUD_V1_2_EUDR_SPEC v1.6 (Section 51 MVP Scope + Section 36 UI/UX Specification)
**Date:** April 2026
**Status:** Gap Analysis Complete

---

## EXECUTIVE SUMMARY

The spec defines MVP as: *"the minimum feature set that enables one Tier 2 producer to capture farmer and plot data, assemble a batch, pass or acknowledge yield checks, build a shipment, and submit a DDS via MANUAL_ASSIST for one commodity in one country before 30 December 2026."*

### Current State (15 pages built)
1. `/` - Dashboard Overview
2. `/login` - Authentication
3. `/packages` - DDS Packages List
4. `/packages/[id]` - Package Detail
5. `/packages/new` - Create Package
6. `/plots` - Plot Management
7. `/farmers` - Farmer/Producer Management
8. `/harvests` - Harvest/Batch Management
9. `/fpic` - FPIC Document Repository
10. `/compliance` - Pre-flight Compliance Check
11. `/compliance/queue` - Reviewer Queue
12. `/reports` - Reporting
13. `/audit-log` - Audit Trail
14. `/admin` - Admin Panel
15. `/settings` - User Settings

---

## GAP ANALYSIS: MVP vs CURRENT IMPLEMENTATION

### A. CRITICAL MVP GAPS (Must Have)

#### GAP-01: Shipment Assembly Flow (Section 36.3)
**Status:** NOT IMPLEMENTED
**Spec Requirement:** 4-step workflow:
1. Select eligible batches
2. Allocate coverage to shipment lines  
3. Validate role classification and blocking issues
4. Seal shipment

**Current:** Package creation exists but lacks:
- Batch selection from harvests
- Coverage allocation with quantity invariants
- Blocking state validation before sealing
- Seal confirmation with liability acknowledgement

**Action:** Create `/packages/[id]/assemble` with step wizard

---

#### GAP-02: DDS Preparation Flow - MANUAL_ASSIST Mode (Section 36.3)
**Status:** PARTIAL
**Spec Requirement:** 
- Generate compliance package
- Download for external submission
- Record reference number after manual submission
- Link reference back to shipment

**Current:** Compliance check exists but no:
- Package generation/download
- Reference number capture after submission
- Status tracking (DRAFT → READY → SUBMITTED → ACCEPTED)

**Action:** Enhance `/packages/[id]` with DDS state machine and download

---

#### GAP-03: Yield Check Integration in Batch Flow (Section 36.3 + Section 20)
**Status:** PARTIAL  
**Spec Requirement:**
- Automatic yield check on batch creation
- PASS (≤1.10) / WARNING (1.10-1.30) / BLOCKED (>1.30) status
- Exception request workflow for BLOCKED/WARNING
- Manual acknowledgement for UNAVAILABLE benchmarks

**Current:** Harvests page exists but yield check is display-only, not enforced

**Action:** Add yield check enforcement + exception request modal

---

#### GAP-04: Producer Consent Management (Section 11)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- Create consent grants per producer
- Revoke consent (prospective only)
- View consent history
- Consent required before data can be used in shipments

**Current:** Farmers page exists but no consent UI

**Action:** Add consent management tab to `/farmers/[id]`

---

#### GAP-05: Evidence Upload with Provenance (Section 13)
**Status:** PARTIAL
**Spec Requirement:**
- Upload evidence documents (land title, harvest record, consent form, etc.)
- SHA-256 hash computed on upload
- Link to producer/plot/batch
- Manual status for low-confidence parses

**Current:** FPIC page exists but general evidence upload missing

**Action:** Create evidence upload component, integrate into plots/farmers

---

#### GAP-06: Compliance Issues Management (Section 17)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- Create compliance issues with severity (INFO/WARNING/BLOCKING)
- Assign owner and resolution path
- Track resolution status
- BLOCKING issues prevent shipment sealing

**Current:** No compliance issues UI

**Action:** Create `/compliance/issues` page + issue creation modals

---

#### GAP-07: Organization Onboarding Flow (Section 28)
**Status:** NOT IMPLEMENTED  
**Spec Requirement:**
- Organization registration with tier selection
- DPA acceptance (required before personal data writes)
- Enterprise size declaration
- Billing contact setup
- Org member invitations

**Current:** No onboarding flow

**Action:** Create `/onboarding` wizard (can be post-MVP if admin-created orgs)

---

#### GAP-08: Billing Events Display (Section 26)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- Display SHIPMENT_FEE_T2, MONTHLY_BASE_T2 billing events
- Show billing history per organization

**Current:** No billing UI

**Action:** Add billing tab to `/settings` or `/admin`

---

### B. IMPORTANT MVP GAPS (Should Have)

#### GAP-09: Dashboard KPIs per Spec (Section 36.3)
**Status:** PARTIAL
**Spec Requirement:**
- Pending compliance issues count
- Shipments by status breakdown
- Yield check failures count
- DDS submission queue
- Open requests with due dates

**Current:** Dashboard has generic stats, not spec KPIs

**Action:** Update `/page.tsx` with exact spec KPIs

---

#### GAP-10: Plot Geometry Versioning Display (Section 12)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- Show geometry version history
- Display area calculation (geography-based)
- Show capture method and quality flags

**Current:** Plots page has map but no version history

**Action:** Add geometry history tab to plot detail

---

#### GAP-11: Producer Wallet View (Section 11)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- View own plots
- View own evidence
- View consent grants
- View contribution summary across batches

**Current:** Farmers page is admin view, not producer self-service

**Action:** This is more for Tier 1 mobile app, lower priority for web

---

#### GAP-12: Dedup Review Tasks (Section 25)
**Status:** NOT IMPLEMENTED
**Spec Requirement:**
- Side-by-side producer/plot comparison
- Merge confirmation with canonical selection
- HIGH confidence blocks until resolved
- MEDIUM shows warning but allows capture

**Current:** No dedup UI

**Action:** Create `/admin/dedup` review interface

---

#### GAP-13: Requests Management (Section 17)
**Status:** NOT IMPLEMENTED  
**Spec Requirement:**
- Evidence requests with deadlines
- Request status tracking
- Reminder and escalation automation

**Current:** No requests UI

**Action:** Create requests inbox component

---

### C. POST-MVP (Explicitly excluded per Section 51.1)

The following are NOT in MVP scope:
- ❌ API_DIRECT DDS submission (Release 2)
- ❌ Simplified declaration flow (Release 2)
- ❌ Downstream/trader workflows (Release 3)
- ❌ Automated evidence parse pipeline (Release 3)
- ❌ Mobile offline sync (Release 2)
- ❌ Deforestation risk engine automation (Release 2)
- ❌ Yield calibration protocol (Release 3)
- ❌ Sponsor governance (Release 3)
- ❌ Annual reporting snapshots (Release 4)
- ❌ Multi-commodity batches (Release 4)
- ❌ Bulk import (Release 4)

---

## IMPLEMENTATION PRIORITY ORDER

### Phase 1: Core Workflow Completion (Week 1-2)
1. **GAP-01** Shipment Assembly Flow - Critical path
2. **GAP-02** DDS MANUAL_ASSIST with state machine
3. **GAP-03** Yield Check enforcement in batches
4. **GAP-06** Compliance Issues management

### Phase 2: Data Completeness (Week 3)
5. **GAP-04** Producer Consent Management
6. **GAP-05** Evidence Upload integration
7. **GAP-09** Dashboard KPIs alignment

### Phase 3: Admin & Compliance (Week 4)
8. **GAP-10** Plot Geometry versioning
9. **GAP-12** Dedup Review interface
10. **GAP-13** Requests Management
11. **GAP-08** Billing display

### Phase 4: Polish (Week 5)
12. **GAP-07** Organization onboarding (if not admin-provisioned)
13. Final UI/UX alignment with Section 36.3

---

## SCREEN-BY-SCREEN SPEC COMPLIANCE CHECKLIST

### Dashboard (/) - Section 36.3
- [ ] Pending compliance issues count
- [ ] Shipments by status (DRAFT/READY/SUBMITTED/ACCEPTED)
- [ ] Yield check failures count  
- [ ] DDS submission queue
- [ ] Open requests with due dates

### Packages (/packages) - Section 36.3
- [ ] Filter by status
- [ ] Show blocking issues inline
- [ ] Quick actions: Seal, Submit, View

### Package Detail (/packages/[id]) - Section 36.3
- [ ] Status state machine display
- [ ] Batch selection/coverage allocation
- [ ] Blocking issues panel
- [ ] Seal shipment with liability acknowledgement
- [ ] DDS download (MANUAL_ASSIST)
- [ ] Reference number capture post-submission

### Harvests (/harvests) - Section 20
- [ ] Yield check result display (PASS/WARNING/BLOCKED/UNAVAILABLE)
- [ ] Benchmark info (commodity, country, yield range)
- [ ] Exception request button for BLOCKED/WARNING
- [ ] Acknowledge UNAVAILABLE checkbox
- [ ] Contributing plots breakdown

### Plots (/plots) - Section 12
- [ ] Geometry version history
- [ ] Area calculation display
- [ ] Capture method indicator
- [ ] Evidence links
- [ ] Deforestation check status

### Farmers (/farmers) - Section 11
- [ ] Consent grants tab
- [ ] Evidence documents tab
- [ ] Contribution summary
- [ ] GeoID external reference display

### Compliance (/compliance) - Section 36.3
- [ ] Pre-flight checklist
- [ ] Blocking issues highlighted
- [ ] Evidence gaps identified
- [ ] Remediation actions

### Compliance Issues (/compliance/issues) - Section 17
- [ ] Create issue form
- [ ] Severity filter (INFO/WARNING/BLOCKING)
- [ ] Assign owner
- [ ] Resolution workflow
- [ ] Linked entity display

### Admin (/admin) - Section 8.1
- [ ] Org member management
- [ ] Role assignment per RBAC matrix
- [ ] Invitation flow
- [ ] Dedup review queue

---

## RBAC ENFORCEMENT CHECKLIST (Section 8.1)

Verify each action is gated by correct permission:

| Action | Required Role | Page |
|--------|---------------|------|
| Seal shipment | OWNER/ADMIN/COMPLIANCE_MANAGER | Package Detail |
| Submit DDS | OWNER/ADMIN/COMPLIANCE_MANAGER | Package Detail |
| Approve yield exception | OWNER/ADMIN/COMPLIANCE_MANAGER | Harvests |
| Revoke consent | OWNER/ADMIN/COMPLIANCE_MANAGER | Farmer Detail |
| Resolve dedup | OWNER/ADMIN/COMPLIANCE_MANAGER (+ conditional FIELD_AGENT) | Admin |
| Capture/edit geometry | OWNER/ADMIN/COMPLIANCE_MANAGER/FIELD_AGENT | Plots |
| Upload evidence | OWNER/ADMIN/COMPLIANCE_MANAGER/FIELD_AGENT | Evidence |
| Create compliance issue | OWNER/ADMIN/COMPLIANCE_MANAGER (+ conditional FIELD_AGENT) | Issues |
| Manage billing | OWNER (+ conditional ADMIN) + BILLING_CONTACT | Settings |
| Invite members | OWNER/ADMIN | Admin |
| View reports | ALL ROLES | Reports |

---

## NORMATIVE RULES REQUIRING UI ENFORCEMENT

From Section 36.3:
> "No compliance-critical transition in web workflows may execute without explicit visibility of current blocking conditions and audit trail context."

**Implementation:**
- All sealing/submission buttons must show blocking issues count
- Modal confirmation must list all blocking issues before allowing override
- Every transition writes audit_events entry

From Section 45.4:
> "This statement must be displayed at shipment sealing and recorded in audit_events with event_type = OPERATOR_LIABILITY_ACKNOWLEDGED"

**Implementation:**
- Add liability disclaimer checkbox to seal confirmation modal
- Record acknowledgement in audit log

---

## NEXT STEPS

1. Review and approve this plan
2. Begin Phase 1 implementation with Shipment Assembly Flow
3. Create mock data structures for DDS state machine
4. Implement compliance issues model in RBAC

---

*This plan is derived from TRACEBUD_V1_2_EUDR_SPEC v1.6 and focuses exclusively on MVP scope as defined in Section 51.1. Post-MVP features are explicitly excluded.*
