# Dashboard Auth and Tenant Hardening (1-Week Execution Plan)

## Objective

Convert current dashboard demo-safe behavior into production-safe tenant/auth behavior without breaking the existing UX contract.

## Scope for this week

- Identity contract hardening (signed tenant claims only)
- Inbox persistence migration from audit snapshots to dedicated tables
- Golden-path integration testing for role and state boundaries
- MVP feature-gate enforcement to prevent scope drift

## Guardrails (must hold)

- Keep strict tenant isolation across all endpoints.
- Keep permissions explicit and role-scoped.
- Keep canonical state transitions and audit/event logging.
- Preserve current page-level UI contracts where possible.

---

## Ticket pack

### TB-DBX-001 — Enforce signed tenant claims only

- **Feature:** `FEAT-001`
- **Priority:** P0
- **Owner:** Backend + Auth
- **Estimate:** 1.5 days
- **Dependencies:** none

#### Scope

- Remove email-based tenant fallback in backend inbox auth path.
- Require tenant context from signed claims (`app_metadata`/`user_metadata` policy).
- Reject requests with missing/invalid tenant claim.
- Standardize auth error taxonomy (`401` vs `403`) for dashboard API proxies.

#### Acceptance

- No backend tenant resolution from email/domain patterns.
- Tenant claim is mandatory for all inbox list/respond/bootstrap operations.
- Auth failures return deterministic error codes and messages.
- Dashboard proxy forwards bearer tokens and preserves backend auth semantics.

#### Test plan

- Valid JWT + tenant claim -> access allowed to own tenant records only.
- Valid JWT without tenant claim -> rejected.
- Cross-tenant access attempt -> rejected.
- Missing/invalid token -> rejected.

---

### TB-DBX-002 — Replace inbox snapshot storage with dedicated tables

- **Feature:** `FEAT-001` + `FEAT-008`
- **Priority:** P0
- **Owner:** Backend + Data
- **Estimate:** 2 days
- **Dependencies:** TB-DBX-001

#### Scope

- Add dedicated tables for inbox requests and request events.
- Migrate current seed/bootstrap behavior off `audit_log` snapshot payloads.
- Add tenant-safe query paths and indexes.
- Keep audit trail emission for request response/seed actions.

#### Acceptance

- Inbox endpoints read/write dedicated request tables only.
- Table schema includes tenant ownership, status, due date, sender/recipient IDs, timestamps.
- Bootstrap actions remain available and idempotent.
- Existing dashboard inbox UI works without contract changes.

#### Test plan

- List/respond actions persist and survive service restart.
- Query performance is acceptable on tenant-scoped reads.
- Duplicate response attempts are idempotent.
- Audit events emitted for state-changing operations.

---

### TB-DBX-003 — Golden-path integration tests (role + state + tenant)

- **Feature:** `FEAT-001` + `FEAT-008`
- **Priority:** P0
- **Owner:** QA + Backend + Dashboard
- **Estimate:** 1.5 days
- **Dependencies:** TB-DBX-001, TB-DBX-002

#### Scope

- Add integration tests for core role sequence:
  - Producer inbox action
  - Supplier shipment transition path
  - Buyer decision path
  - Reviewer queue access
  - Sponsor governance visibility
- Cover permission denials and tenant boundary checks.
- Cover request state transitions and retry behavior.

#### Acceptance

- A single test suite verifies role-specific permissions and tenant isolation.
- Canonical shipment/request transitions are validated with expected blockers.
- Regression suite runs in CI for dashboard-backend integration lane.

#### Test plan

- Positive path for each role.
- Negative path (forbidden action) per role.
- Cross-tenant access attempt for every protected endpoint.
- Retry/idempotency checks for respond/bootstrap actions.

---

### TB-DBX-004 — Freeze MVP feature gates in code

- **Feature:** `FEAT-001`
- **Priority:** P1
- **Owner:** Dashboard + Product Eng
- **Estimate:** 1 day
- **Dependencies:** none

#### Scope

- Add explicit feature flags/route guards for post-MVP features.
- Ensure hidden/deferred routes cannot be reached directly without flag.
- Document gate list and ownership in one place.

#### Acceptance

- Deferred routes are gated at navigation and route-entry levels.
- Flags have sane defaults for MVP mode.
- QA checklist includes "deferred route inaccessible" assertions.

#### Test plan

- Disabled flags -> deferred routes blocked.
- Enabled flag in dev mode -> route accessible.
- Sidebar and deep-link behavior are consistent under both states.

---

## Execution schedule (5 days)

- **Day 1:** TB-DBX-001
- **Day 2-3:** TB-DBX-002
- **Day 4:** TB-DBX-003
- **Day 5:** TB-DBX-004 + stabilization buffer

## Definition of done (week)

- Tenant resolution is claim-based only.
- Inbox persistence uses dedicated tables.
- Golden-path integration suite passes in CI.
- MVP gates are enforced and documented.
- Product OS status/feature docs updated.
