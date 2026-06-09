# Dashboard Product Beta Go/No-Go Checklist

Date: 2026-06-02  
Owner: Product + Engineering + Operations

## Purpose

Allow a controlled beta release for `dashboard-product` while official launch gates (`P0-02`, `P0-03`) remain open.

This checklist is for invite-only beta operations and must not be used as an "official worldwide launch" sign-off.

## Beta release stance

- Release label is `Beta` across UI, support, docs, and onboarding.
- Messaging states "evaluation use only" and "not legal/compliance advice".
- Distribution is invite-only to named organizations (cooperatives/exporters/importers).
- Beta participation acknowledgment is signed by each tenant admin before activation.

## Must-pass beta gates

### 1) Permissions and tenant isolation

- [ ] RLS phase-3 script is applied:
  - `tracebud-backend/sql/tb_v16_030_rls_phase3_launch_admin_and_integrations.sql`
- [ ] RLS phase-3 verification script reports pass:
  - `tracebud-backend/sql/tb_v16_030_rls_phase3_launch_admin_and_integrations_verify.sql`
- [ ] Cross-tenant deny paths are tested (`401`/`403`) for admin/onboarding/integration surfaces.
- [ ] Entitlement and route gates fail closed when unavailable or misconfigured.

### 2) Canonical state transitions

- [ ] Onboarding steps remain canonical and deterministic by role.
- [ ] Shipment/package transitions preserve canonical ordering with no bypass paths.
- [ ] Deferred routes keep explicit feature-gate checks at nav and route-entry level.
- [ ] Any beta-only workflow variant is documented with state transition impact as "none" or explicit delta.

### 3) Exception handling and recovery

- [ ] Key page retries and fallback notices are verified (`Packages`, `Compliance`, `Inbox`, `Admin`).
- [ ] Backend-unavailable behavior remains fail-closed (no local success fallback for protected actions).
- [ ] Incident runbook for auth/API/integration failure exists and has owner/escalation path.
- [ ] Rollback path is prepared (deployment rollback + feature flag kill-switch).

### 4) Analytics and audit evidence

- [ ] Onboarding and gated-route telemetry is visible (`onboarding_step_completed`, `onboarding_cta_gated_redirect`).
- [ ] Admin and integration actions emit immutable audit events in tenant scope.
- [ ] Daily beta telemetry review cadence is assigned (errors, auth failures, timeouts, blocked CTA rate).
- [ ] Beta known-issues register is published from current tracked TODO/issue list.

### 5) Acceptance criteria for beta entry

- [ ] Test baseline is green:
  - `npm test --workspace apps/dashboard-product`
  - `npm run test:integration:ownership --prefix tracebud-backend`
- [ ] Invite-only cohort list is approved with owners and support channel.
- [ ] Beta scope matrix is published ("included", "excluded", "flagged").
- [ ] No public "officially launched worldwide" claim in any channel.

## Explicitly waived for beta (not waived for official launch)

- `P0-02` legal memo closeout.
- `P0-03` pilot validation closeout.
- Full official launch announcement.

Waived items must be tracked with owner and target closure date in status logs.

## Seven-day controlled rollout sequence

1. Day 1: freeze beta scope, flags, messaging, and tenant cohort list.
2. Day 2: run security/RLS verification and test baseline.
3. Day 3: internal dogfood tenant validation.
4. Day 4: cohort A enablement (1-2 tenants).
5. Day 5: telemetry review + hotfix window.
6. Day 6: cohort B expansion.
7. Day 7: beta checkpoint decision (`continue`, `hold`, `rollback`).

## Beta stop conditions (auto hold)

- Any cross-tenant data exposure or RLS verification failure.
- Sustained auth/API failure rate above agreed threshold.
- Critical blocked workflow without workaround in active tenant cohort.
- Missing audit evidence for privileged actions.

## Exit criteria to official launch

All must be true:

- `P0-02` closed with signed memo reference.
- `P0-03` closed with required pilot evidence (`>=20` farmers, tier-2 cooperative, tier-3 buyer, completed batch).
- Beta critical defects are resolved or explicitly accepted with mitigation.
- Production launch claims and terms are updated from `Beta` to official status.

## Sign-off block (fill each checkpoint)

- Window date/time: 2026-06-03
- Operator: engineering (automated run)
- Environment: staging / pre-cohort (`uzsktajlnofosxeqwdwl`)
- RLS phase-3 verify result: **pass** (14/14 tables) — see `beta-readiness-evidence-2026-06-03.md`
- Test baseline result: dashboard **225/225 pass**; backend unit **237/237 pass**; backend ownership integration **54/54 pass** (deny runbook still manual in staging)
- Cohort enabled: none (template ready: `beta-cohort-template.md`)
- Critical incidents: none
- Decision (`go_beta` / `hold_beta` / `rollback_beta`): **hold_beta** until cross-tenant deny evidence + cohort A approval
- Evidence links: `product-os/04-quality/beta-readiness-evidence-2026-06-03.md`, `beta-scope-matrix.md`, `beta-cross-tenant-deny-runbook.md`
