### 2026-04-22 (execution: onboarding taxonomy bridge + role-aware wizard mode)
- Focus: make onboarding task taxonomy and overview-step taxonomy consistent with the new dashboard IA and request-wizard vocabulary.
- Files changed: `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/app/outreach/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Backend-driven onboarding dialog copy now uses importer taxonomy overrides (`network`, `campaigns`, `issues`, `compliance`, `reporting`) instead of legacy package/request phrasing.
  - `create_first_campaign` CTA now lands on canonical campaigns route (`/outreach`) to match new IA language and routing.
  - Outreach now passes role-aware wizard mode/labels (`campaign` for importer, `request` otherwise) so onboarding CTA intent and wizard terminology stay aligned.
- Permissions/tenant boundaries:
  - No permission or tenant model changes; copy and entry-mode wiring only.
- Exception handling/recovery:
  - No transition logic changes; existing action-validation semantics remain unchanged.
- Verification:
  - `ReadLints` on touched files (no lints).
  - `npm run -s test -- app/page.test.tsx app/create-account/page.test.tsx` (pass).
- Blockers: none.

### 2026-04-22 (execution: importer onboarding microcopy alignment)
- Focus: align importer onboarding narrative and step copy with the finalized importer IA and terminology.
- Files changed: `apps/dashboard-product/lib/onboarding-config.ts`, `apps/dashboard-product/components/onboarding/onboarding-welcome-modal.tsx`, `apps/dashboard-product/components/onboarding/onboarding-checklist-card.tsx`, `apps/dashboard-product/components/onboarding/guided-tour-overlay.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Replaced importer overview-tour steps to match IA flow: `Network -> Campaigns -> Requests -> Shipments -> Compliance -> Evidence -> Reporting`.
  - Updated importer welcome-card highlights and checklist task labels/CTA copy to remove legacy package/request phrasing drift.
  - Added importer contextual guided-tour CTA labels for network/campaign actions.
- Permissions/tenant boundaries:
  - No role/tenant authorization changes; this slice updates onboarding content and labels only.
- Exception handling/recovery:
  - No state-machine changes; onboarding completion behavior and action keys remain deterministic.
- Verification:
  - `ReadLints` on touched onboarding files (no lints).
- Blockers: none.

### 2026-04-22 (execution: importer shared-component terminology alignment)
- Focus: remove residual package/compliance vocabulary drift in reusable UI components used by importer flows.
- Files changed: `apps/dashboard-product/components/packages/packages-table.tsx`, `apps/dashboard-product/components/compliance/compliance-check-list.tsx`, `apps/dashboard-product/components/compliance/plot-compliance-breakdown.tsx`, `apps/dashboard-product/components/compliance/evidence-requirement.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added importer-aware wording in shared package table actions/labels (`Shipment` terminology where relevant).
  - Added importer-aware wording in reusable compliance summary/check cards and evidence/plot breakdown cards.
  - Kept data model and route behavior unchanged; this slice is copy/framing only.
- Permissions/tenant boundaries:
  - No permission changes; existing role/tenant gate behavior remains unchanged.
- Exception handling/recovery:
  - No state-transition changes; only display language adjusted for importer context.
- Verification:
  - `ReadLints` on all touched shared components (no lints).
- Blockers: none.

### 2026-04-22 (execution: importer destination framing alignment)
- Focus: align shared importer destination pages with Tier 3 language (`validate, complete, declare, retain, report`) after sidebar IA rollout.
- Files changed: `apps/dashboard-product/app/packages/page.tsx`, `apps/dashboard-product/app/compliance/page.tsx`, `apps/dashboard-product/app/fpic/page.tsx`, `apps/dashboard-product/app/outreach/page.tsx`, `apps/dashboard-product/app/inbox/page.tsx`, `apps/dashboard-product/app/reports/page.tsx`, `apps/dashboard-product/app/compliance/issues/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added role-aware page framing for importer on shared routes without changing route bindings or permission gates.
  - Importer-facing names now match sidebar IA (`Shipments`, `Compliance`, `Evidence`, `Campaigns`, `Requests`, `Reporting`, `Issues`) while non-importer roles retain existing labels.
- Permissions/tenant boundaries:
  - No auth policy changes; existing role/tenant checks remain enforced by current gates and backend contracts.
- Exception handling/recovery:
  - No state transition changes; this slice is presentation-only and fail-closed behavior is unchanged.
- Verification:
  - `ReadLints` on all touched dashboard pages (no lints).
- Blockers: none.

### 2026-04-22 (execution: importer dashboard IA foundation alignment)
- Focus: align importer dashboard IA to Tier 3 operating responsibilities (validate, complete, declare, retain, report).
- Files changed: `apps/dashboard-product/lib/rbac.ts`, `apps/dashboard-product/components/layout/app-sidebar.tsx`, `apps/dashboard-product/app/help/page.tsx`, `apps/dashboard-product/lib/rbac.test.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Importer sidebar now uses section model `Overview -> Network -> Shipments -> Compliance -> Evidence -> Campaigns -> Requests -> Reporting -> Issues -> Audit Log`.
  - Added importer-specific nav aliases mapped to current routes (`Network=/contacts`, `Shipments=/packages`, `Evidence=/fpic`, `Campaigns=/outreach`, `Requests=/inbox`, `Reporting=/reports`, `Issues=/compliance/issues`).
  - Added `/help` dashboard page stub so Help route resolves in-app.
- Permissions/tenant boundaries:
  - Existing role-scoped permission checks and route feature-gate checks remain enforced via `getVisibleNavItems` and `isRouteEnabled`.
- Exception handling/recovery:
  - No state-transition changes; IA slice is navigation/view-layer only and fail-closed on gated routes.
- Verification:
  - `cd apps/dashboard-product && npm run -s test -- lib/rbac.test.ts app/page.test.tsx` (expected green for touched areas).
- Blockers: none.

### 2026-04-22 (execution: onboarding gated-CTA telemetry instrumentation)
- Focus: instrument gated onboarding CTA fallbacks so blocked-route frequency is measurable.
- Files changed: `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `product-os/04-quality/event-tracking.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added telemetry event type `onboarding_cta_gated_redirect` to gated-entry analytics POST contract.
  - Dashboard onboarding CTA now emits this event when navigation target is feature-gated and fallback redirect is applied.
  - Preserved existing `dashboard_gated_entry_attempt` default event behavior for all existing callers.
- Verification:
  - `cd apps/dashboard-product && npm run -s test -- app/api/analytics/gated-entry/route.test.ts app/page.test.tsx` (pass, `2 suites / 26 tests`).
  - `ReadLints` on touched files (no lints).
- Risks: telemetry relies on tenant/role context availability at click time; when unavailable, event is skipped by design to avoid malformed analytics writes.
- Blockers: none.
- Next step: optionally surface this new event in admin diagnostics event-kind filters for operator visibility without raw audit inspection.

### 2026-04-22 (execution: onboarding CTA guard for gated routes)
- Focus: prevent onboarding CTA click loops when a step route is feature-gated in the current environment.
- Files changed: `apps/dashboard-product/app/page.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added client-side gate check (`getDeferredGateForPath`) before onboarding CTA navigation.
  - When target route is gated, CTA now redirects to `/` and shows a clear in-dialog notice (`route is currently gated`) instead of silently bouncing.
  - Preserved existing onboarding progression and action-validation semantics.
- Verification:
  - `cd apps/dashboard-product && npm run -s test -- app/page.test.tsx` (pass, `1 suite / 3 tests`).
  - `ReadLints` on `apps/dashboard-product/app/page.tsx` (no lints).
- Risks: notice is currently dialog-local only; if users click CTA after closing dialog they still rely on global route middleware behavior.
- Blockers: none.
- Next step: optionally add lightweight telemetry event for `onboarding_cta_gated_redirect` to quantify how often environment gates block onboarding steps.

### 2026-04-22 (execution: importer onboarding sequencing adjustment)
- Focus: align importer onboarding with real first-value action (send request first) before compliance checks.
- Files changed: `tracebud-backend/src/launch/launch.service.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Restored `create_first_campaign` as first compliance-manager/importer onboarding step.
  - Kept template-scoped onboarding read filter/order so stale DB rows cannot reintroduce deprecated ordering.
- Verification:
  - `cd tracebud-backend && npm run -s build` (pass).
  - live endpoint check confirms importer/compliance-manager first actionable step is `create_first_campaign`.
- Risks: if `/requests` gate is disabled in an environment, CTA can still redirect; this ordering change assumes request workflow is intended/available for importer launch flow.
- Blockers: none.
- Next step: optionally add frontend CTA guard/fallback for gated routes to avoid redirect loops when feature flags differ by environment.

### 2026-04-22 (execution: onboarding CTA routing hardening for importer/compliance-manager path)
- Focus: fix onboarding UX where "Open campaigns" from importer onboarding bounced back to overview due MVP route gating.
- Files changed: `tracebud-backend/src/launch/launch.service.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Updated compliance-manager onboarding defaults to avoid gated request-campaign route in MVP.
  - Compliance-manager step sequence is now: `create_account` -> `review_first_submission` -> `run_first_compliance_check` -> `generate_first_insight`.
  - Preserved action-validated steps and existing event semantics; no new analytics event types introduced.
- Verification:
  - `cd tracebud-backend && npm run -s build` (pass).
  - `ReadLints` on `src/launch/launch.service.ts` (no lints).
- Risks: existing tenant rows for old step keys remain in DB history; API response now follows current template set so obsolete gated step is not returned in onboarding checklist.
- Blockers: none.
- Next step: run dashboard UX smoke with importer session to confirm onboarding CTA now routes only to accessible pages.

### 2026-04-22 (execution: FEAT-001 onboarding hardening - backend-persistent admin role/status mutations)
- Focus: complete admin onboarding persistence so role/status changes are backend-written and tenant-auditable.
- Files changed: `tracebud-backend/src/admin/admin.controller.ts`, `tracebud-backend/src/admin/admin.service.ts`, `apps/dashboard-product/app/api/admin/users/[id]/role/route.ts`, `apps/dashboard-product/app/api/admin/users/[id]/status/route.ts`, `apps/dashboard-product/lib/admin-service.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added backend tenant-scoped admin mutation endpoints: `PATCH /v1/admin/users/:id/role` and `PATCH /v1/admin/users/:id/status`.
  - Enforced explicit admin role + tenant claim checks before mutations; non-matching tenant/user IDs fail closed.
  - Converted dashboard role/status actions from in-memory cache mutation to backend API persistence via new proxy routes.
- Verification:
  - `cd apps/dashboard-product && npm run -s test -- app/admin/page.test.tsx` (pass, `1 suite / 11 tests`).
  - `ReadLints` on touched backend/frontend files (no lints).
- Risks: backend full build remains blocked by pre-existing launch-controller TS4053 export issues unrelated to this admin slice.
- Blockers: none for admin mutation persistence flow.
- Next step: run live manual admin smoke (`invite -> change role -> suspend/reactivate`) in dashboard with a real tenant token to confirm UX messaging against backend responses.

### 2026-04-22 (execution: FEAT-001 onboarding hardening - backend-persistent admin invite/org flows)
- Focus: remove remaining dashboard in-memory admin mocks so onboarding actions (`team_invited`) are validated by real backend writes.
- Files changed: `tracebud-backend/src/admin/admin.module.ts`, `tracebud-backend/src/admin/admin.controller.ts`, `tracebud-backend/src/admin/admin.service.ts`, `tracebud-backend/src/app.module.ts`, `apps/dashboard-product/app/api/admin/organizations/route.ts`, `apps/dashboard-product/app/api/admin/users/route.ts`, `apps/dashboard-product/app/api/admin/users/invite/route.ts`, `apps/dashboard-product/lib/admin-service.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added authenticated backend admin API surface (`/v1/admin/organizations`, `/v1/admin/users`, `/v1/admin/users/invite`) with explicit admin-role and tenant-claim enforcement.
  - Persisted organizations/users to DB-backed tables (`admin_organizations`, `admin_users`) and removed dashboard in-memory seed dependency for admin operations.
  - Added dashboard proxy routes for admin reads/writes with auth pass-through and fail-closed behavior when backend URL is missing.
  - Rewired dashboard admin service to call backend-proxied APIs so invite/create flows are action-validated by persisted backend state.
- Verification:
  - `cd apps/dashboard-product && npm run -s test -- app/admin/page.test.tsx` (pass, `1 suite / 11 tests`).
  - `ReadLints` on touched backend/frontend files (no lints).
- Risks: backend full build currently fails on pre-existing launch controller type-export issues unrelated to this slice (`TS4053` in `src/launch/launch.controller.ts`).
- Blockers: none for admin onboarding flow.
- Next step: add backend update endpoints for user role/status so admin role/status mutations also move from optimistic client-only updates to persisted backend writes.

### 2026-04-21 (execution: FEAT-005 benchmark-path runtime closure + yearly cadence lock)
- Focus: close the live runtime gap between activated FAOSTAT benchmarks and harvest yield-cap enforcement, then finalize ops cadence.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/plots/plots.service.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Added commodity alias resolution in harvest benchmark lookup (`coffee` <-> `656` / `coffee, green`) so activated FAOSTAT rows are used in live cap checks.
  - Fixed plot insert path to persist `plot.geography` (`GEOGRAPHY`) and satisfy `plot_geography_present_check`.
  - Executed live below/near/above harvest validations and confirmed benchmark-path audit evidence (`yield_cap_resolved`, non-null `benchmarkId`, `sourceType=FAOSTAT`).
  - Locked FAOSTAT sync cadence to yearly, consistent with FAOSTAT annual publication cadence.
- Verification:
  - `npx jest src/harvest/harvest.service.spec.ts --runInBand` (pass)
  - `npm test -- plots.service.spec.ts` (pass)
  - live API checks: `POST /api/v1/plots`, `POST /api/v1/harvest` (below/near/above), audit-log verification query for yield-cap events.
- Risks: one broad backend test command currently fails on pre-existing FEAT-009 Cool Farm V2 spec drift unrelated to FEAT-005 runtime fix; targeted FEAT-005/plots suites are green.
- Blockers: none for FEAT-005 benchmark runtime path.
- Next step: schedule yearly FAOSTAT sync runbook execution and optional integration-test coverage for live benchmark-path API flow.

### 2026-04-21 (execution: FEAT-009 scheduler token auth contract for stale sweeper trigger)
- Focus: secure scheduler-triggered stale sweeper path with explicit non-user token contract.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger` now requires header `x-tracebud-scheduler-token` and backend env `COOLFARM_SAI_V2_SCHEDULER_TOKEN`; missing env yields deterministic config error, invalid/missing token yields deterministic forbidden response.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 28 tests`).
- Risks: low-medium; secure trigger contract is now in place, but production secret rotation and scheduler secret distribution still require deployment runbook alignment.
- Blockers: none new.
- Next step: add scheduler secret rotation checklist entry and optional hash-based token metadata telemetry (without logging raw secret).

### 2026-04-21 (execution: FEAT-009 scheduler token rotation runbook documentation)
- Focus: complete operations guidance for secure scheduler token lifecycle management.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added scheduler token contract + rotation checklist (required header/env, 90-day cadence, one-pass rotation procedure, and evidence capture fields) for V2 stale-sweeper trigger operations.
- Verification: docs-only update; no runtime behavior changes.
- Risks: low; operational guidance update only.
- Blockers: none new.
- Next step: optionally add token-version telemetry field (non-secret) to scheduler sweeper execution payload for audit-friendly rotation traceability.

### 2026-04-21 (execution: FEAT-009 DB-backed scheduler wrapper integration coverage)
- Focus: validate scheduler wrapper auth and telemetry behavior against real DB tables rather than unit-only mocks.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.int.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added isolated-schema integration spec covering missing env token fail-closed, invalid scheduler token forbidden path, and successful scheduler execution with DB assertion for `integration_v2_stale_sweeper_executed` payload including scheduler token-version lineage.
- Verification: `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.int.spec.ts` (pass, `1 suite / 3 tests`).
- Risks: low; coverage-only slice with no runtime behavior change.
- Blockers: none new.
- Next step: expand DB-backed suite to claim/retry/release path assertions for full worker lifecycle integration proof.

### 2026-04-21 (execution: release hygiene + FAOSTAT yearly ops automation + governance cleanup)
- Focus: complete post-benchmark-slice hardening by validating full backend quality gates, automating yearly FAOSTAT workflow, and standardizing benchmark dimensions.
- Files changed: `.github/workflows/faostat-yearly-sync-dry-run.yml`, `tracebud-backend/scripts/run-faostat-yearly-sync.mjs`, `tracebud-backend/scripts/cleanup-yield-cap-fixtures.mjs`, `tracebud-backend/package.json`, `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/sql/tb_v16_017_yield_benchmarks_canonicalize_dimensions.sql`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/04-quality/faostat-yearly-sync-runbook.md`, `product-os/01-roadmap/next-milestone-decision-pack.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions:
  - Ran backend full test matrix once (`unit + integration`) and recorded green baseline.
  - Added yearly FAOSTAT dry-run automation (workflow + script) with explicit human review and dual-control activation runbook.
  - Standardized benchmark keys toward canonical runtime format: commodity `coffee` and geography ISO-2 uppercase; added migration to backfill existing benchmark rows.
  - Chose fixture hygiene strategy as scripted cleanup-by-default after QA runs (`npm run fixtures:yield-cap:cleanup`).
  - Published next milestone decision pack with explicit FEAT-009 (integrations-first) vs FEAT-004 (compliance UX-first) fork.
- Verification:
  - `cd tracebud-backend && npm test` (pass)
  - `cd tracebud-backend && npm run test:integration` (pass)
- Risks:
  - Yearly workflow depends on repository secrets (`TRACEBUD_API_BASE_URL`, `TRACEBUD_BENCHMARK_ADMIN_JWT`) and operational token rotation discipline.
  - Geography canonicalization currently includes the active exporter-country mapping set; additional country mappings should be added as scope expands.
- Blockers: none.
- Next step: choose and lock the next milestone lane from decision pack, then start targeted implementation.

### 2026-04-20 (execution: FEAT-009 V2 parallel execution pack for Cool Farm + SAI)
- Focus: convert Cool Farm + SAI implementation planning into in-repo Product OS execution management (non-Jira) while preserving V1 boundaries.
- Files changed: `product-os/01-roadmap/coolfarm-sai-v2-parallel-execution-pack.md`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: published a track-based execution pack with non-Jira backlog IDs (`TB-CFSAI-V2-*`), isolated persistence + feature-flag guardrails, shadow adapter strategy, pathway-first implementation ordering (`annuals`, `rice` first), and explicit readiness gates before any real provider enablement.
- Verification: docs-only update; no runtime behavior changes.
- Risks: low; planning/governance artifact only, implementation still pending.
- Blockers: none new.
- Next step: start `TB-CFSAI-V2-001..004` (schema, mapping register, transition model, flag policy) as first implementation slice.

### 2026-04-20 (execution: FEAT-009 scheduler trigger wrapper + sweeper rollup summary fields)
- Focus: provide a clean scheduler entrypoint and simplify sweeper result interpretation in summary output.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger` (scheduled wrapper), and `GET /v1/integrations/coolfarm-sai/v2/runs/summary` now includes `lastSweeperReleasedCount` + `lastSweeperTriggerSource` derived from latest sweeper rollup event.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 26 tests`).
- Risks: low; scheduler wrapper is additive and reuses existing stale-release flow, but production cron/auth boundary policy still needs deployment-level setup.
- Blockers: none new.
- Next step: add optional endpoint auth token contract for non-user scheduler invocations if required by deployment architecture.

### 2026-04-20 (execution: FEAT-009 V2 scheduled sweeper trigger contract + last-run metadata)
- Focus: make stale-claim sweeper schedule-friendly and expose last sweeper execution context in diagnostics.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: stale sweeper now accepts `triggerSource` (`manual|scheduled`) and always emits execution rollup event `integration_v2_stale_sweeper_executed`; run summary now includes `lastSweeperRun` payload for operator context on latest cleanup execution.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 25 tests`).
- Risks: low-medium; contract is schedule-ready but actual cron runner wiring/deployment policy remains environment-level configuration work.
- Blockers: none new.
- Next step: wire a real scheduled trigger job and add summary fields for last sweeper release count + trigger source breakdown trends.

### 2026-04-20 (execution: FEAT-009 V2 stale-claim sweeper + summary stale counter)
- Focus: automate stale-claim cleanup and expose stuck-claim visibility in run diagnostics summary.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale` with `staleMinutes` + `limit` controls and per-run `integration_v2_run_stale_released` telemetry; `GET /v1/integrations/coolfarm-sai/v2/runs/summary` now returns `staleClaimCount`.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 24 tests`).
- Risks: low-medium; sweeper endpoint is manual/triggered and would benefit from scheduled cron orchestration and environment-specific thresholds.
- Blockers: none new.
- Next step: wire sweeper into scheduled job path and include last-sweeper-run metadata in summary endpoint for operator context.

### 2026-04-20 (execution: FEAT-009 V2 claim release endpoint)
- Focus: add safe claim-release handling so orphaned or stale claims can be returned to queue processing.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/release`; releases are owner-only by default and support `force=true` for stale claims held by other actors; added immutable release event `integration_v2_run_released` with forced/reason context.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 22 tests`).
- Risks: low-medium; claim-release now handles stale lock recovery, but automatic stale-claim timeout scanning is still manual/endpoint-driven.
- Blockers: none new.
- Next step: add scheduled stale-claim sweeper policy (release claims older than threshold) and expose stale-claim diagnostics counter in run summary.

### 2026-04-20 (execution: FEAT-009 V2 run claim locking)
- Focus: prevent duplicate worker processing by introducing explicit run claim semantics.
- Files changed: `tracebud-backend/sql/tb_v16_016_coolfarm_sai_v2_run_claim_lock.sql`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added claim metadata (`claimed_by_user_id`, `claimed_at`) and `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/claim`; claims are allowed only for tenant-scoped due failed unclaimed runs; retry queue now excludes claimed rows; immutable claim event `integration_v2_run_claimed` added for lineage.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 19 tests`).
- Risks: low-medium; claim lock now prevents duplicate processing at app level, but row-level transactional claim/execute bundling is still recommended for distributed multi-worker race hardening.
- Blockers: none new.
- Next step: add claim timeout/release endpoint (`/runs/{runId}/release`) for orphaned claims when worker crashes mid-processing.

### 2026-04-20 (execution: FEAT-009 V2 retry queue scan endpoint)
- Focus: expose worker-friendly polling surface for runs that are due for retry.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/integrations/coolfarm-sai/v2/runs/retry-queue` to return tenant-scoped due retries (`status='failed'` and `next_retry_at<=now`) with deterministic ordering and limit guardrails (`default=50`, range `1..200`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 17 tests`).
- Risks: low-medium; polling endpoint is in place but queue worker execution coordination (claim/lock semantics) is still pending for concurrent processors.
- Blockers: none new.
- Next step: add run-claim endpoint (`claimed_by`, `claimed_at`) to prevent duplicate worker processing under parallel pollers.

### 2026-04-20 (execution: FEAT-009 V2 retry backoff + max-attempt guardrail)
- Focus: make retry behavior safer and more realistic by adding scheduling metadata and retry exhaustion limits.
- Files changed: `tracebud-backend/sql/tb_v16_015_coolfarm_sai_v2_retry_backoff.sql`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `next_retry_at` column/index; retry now computes exponential backoff (`2^(attempt-1)` minutes, capped at `60`), enforces `maxRetryAttempts=5`, emits `integration_v2_run_retry_exhausted` when cap reached, and returns deterministic cap error.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 15 tests`).
- Risks: medium; backoff is calculated in controller path and should later move into dedicated queue worker/scheduler for distributed execution consistency.
- Blockers: none new.
- Next step: add admin endpoint for retry queue scan (`next_retry_at <= now`) and lock max-attempt policy into config/env contract.

### 2026-04-20 (execution: FEAT-009 V2 run retry lifecycle endpoint)
- Focus: add deterministic retry execution path for failed V2 runs with auditable attempt lineage.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/retry`; retries are allowed only for failed runs, increment `attempt_count`, refresh queue metadata, and finalize with deterministic `completed|failed` status plus retry lineage events (`integration_v2_run_retry_completed|integration_v2_run_retry_failed`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 14 tests`).
- Risks: medium; retry is synchronous and still relies on simulated execution semantics rather than true asynchronous worker scheduling/backoff policy.
- Blockers: none new.
- Next step: add backoff metadata (`next_retry_at`) and max-attempt guardrail policy for fail-safe retry exhaustion behavior.

### 2026-04-20 (execution: FEAT-009 V2 queue metadata + run summary diagnostics)
- Focus: make V2 runs operationally monitorable with queue metadata and a compact tenant summary surface.
- Files changed: `tracebud-backend/sql/tb_v16_014_coolfarm_sai_v2_run_queue_metadata.sql`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added queue metadata columns (`queued_at`, `attempt_count`, `error_code`) and status index on `integration_runs_v2`; run execution now writes these fields and failed runs set deterministic code (`V2_SHADOW_RUN_FAILED`); added `GET /v1/integrations/coolfarm-sai/v2/runs/summary` returning tenant-scoped status counts plus latest run pointer.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 12 tests`).
- Risks: medium; queue metadata is now available but a real async worker/queue orchestrator is still needed for production-grade throughput and retries.
- Blockers: none new.
- Next step: add explicit retry endpoint that increments `attempt_count` and records retry audit lineage before rerun.

### 2026-04-20 (execution: FEAT-009 V2 run failure semantics + run-history API)
- Focus: complete V2 run lifecycle semantics by adding explicit failure outcomes and run diagnostics read surface.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/runs` for `validation|scoring` execution with deterministic `completed|failed` finalization in `integration_runs_v2`, plus `GET /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/runs` diagnostics read path and immutable outcome events (`integration_v2_run_completed|integration_v2_run_failed`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 11 tests`).
- Risks: medium; run execution is currently synchronous/simulated and should be replaced by queue-backed worker execution for production-scale scoring complexity.
- Blockers: none new.
- Next step: add async worker contract + run polling fields (`queued_at`, `attempt_count`, `error_code`) and expose run status summaries for admin/operator surfaces.

### 2026-04-20 (execution: FEAT-009 V2 submit transition + run lifecycle persistence)
- Focus: implement canonical `draft->submitted` transition with auditable run lifecycle evidence for V2 shadow flow.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/submit` with tenant/role fail-closed policy, transition guard (`draft` required), `integration_runs_v2` validation lifecycle persistence (`started` then `completed`), and submit audit event (`integration_v2_questionnaire_submitted`) linked to `runId`.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 8 tests`).
- Risks: medium; submit flow currently performs lightweight lifecycle completion in-process and does not yet enqueue async validator/scorer workers for non-trivial workloads.
- Blockers: none new.
- Next step: add explicit validation/scoring worker trigger contract and represent failure path with `integration_runs_v2.status=failed` when validator rejects payload.

### 2026-04-20 (execution: FEAT-009 V2 isolated persistence + draft save API)
- Focus: implement first real V2 write-path with isolated tables and replay-safe draft persistence.
- Files changed: `tracebud-backend/sql/tb_v16_013_coolfarm_sai_v2_questionnaire.sql`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added isolated V2 tables (`integration_questionnaire_v2`, `integration_runs_v2`, `integration_evidence_v2`, `integration_audit_v2`) and `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts` endpoint with tenant fail-closed checks, role-scoped write policy, required `idempotencyKey`, `(tenant_id,idempotency_key)` upsert semantics, and audit event persistence (`integration_v2_questionnaire_draft_saved`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 6 tests`).
- Risks: medium; migration must be applied in target environments before write path can execute, and current API does not yet expose submit/validate/score transitions.
- Blockers: none new.
- Next step: implement `submit` transition endpoint and `integration_runs_v2` lifecycle writes (`started/completed/failed`) for validation/scoring shadow jobs.

### 2026-04-20 (execution: FEAT-009 V2 mapping registry + required-field coverage guard)
- Focus: implement executable field mapping contract from questionnaire to Cool Farm + SAI for V2 shadow lane.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.schema.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: endpoint now returns `mappingRegistry` (`farmQuestionnaireMappingV1`) with explicit `sectionId.fieldId -> coolfarmPath + saiIndicators[]` entries and pathway-specific rice mapping; added required-field mapping coverage validation to fail fast if any required question is missing a mapping entry.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 4 tests`).
- Risks: low-medium; SAI indicator set is initial scaffold taxonomy and will need product/compliance refinement before scoring policy lock.
- Blockers: none new.
- Next step: implement `TB-CFSAI-V2-010` SQL migration for isolated questionnaire/run/evidence/audit tables and add save-draft API contract.

### 2026-04-20 (execution: FEAT-009 V2 Cool Farm + SAI schema bootstrap API)
- Focus: start executable V2 development with a tenant-safe, versioned questionnaire contract endpoint in shadow mode.
- Files changed: `tracebud-backend/src/integrations/coolfarm-sai-v2.schema.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.ts`, `tracebud-backend/src/integrations/coolfarm-sai-v2.controller.spec.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/integrations/coolfarm-sai/v2/questionnaire-schema` with tenant fail-closed policy and role-scoped access (`exporter|agent|admin|compliance_manager`); endpoint returns versioned `farmQuestionnaireV1` (`0.1.0-draft`) schema for `annuals`/`rice`, canonical transition model (`draft->submitted->validated->scored->reviewed`), data-quality baseline (`actual|estimated|defaulted`), and rollout metadata (`coolfarm_sai_v2_enabled`, `off`, `shadow`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts` (pass, `1 suite / 4 tests`).
- Risks: low-medium; schema currently bootstrap-level and intentionally narrow (`annuals`, `rice`) pending mapping-register and persistence slices.
- Blockers: none new.
- Next step: implement `TB-CFSAI-V2-002` mapping registry artifact and `TB-CFSAI-V2-010` isolated SQL persistence tables.

### 2026-04-20 (execution: FEAT-005 direct FAOSTAT authenticated fetch fallback)
- Focus: make FAOSTAT source sync operational without requiring a separate adapter URL service.
- Files changed: `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `FAOSTAT` sync now uses adapter URL mode when `YIELD_BENCHMARKS_FAOSTAT_URL` is configured, otherwise falls back to direct authenticated fetch (`x-api-key` from `YIELD_BENCHMARKS_FAOSTAT_API_KEY`) against default `https://faostatservices.fao.org/api/v1/en/data/QCL`; direct payload mapping now normalizes FAOSTAT `value` from hg/ha to kg/ha benchmark bounds before canonical draft import validation/upsert.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`; `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts` (pass, `2 suites / 26 tests`).
- Risks: medium; direct FAOSTAT path depends on valid API key provisioning and upstream schema continuity.
- Blockers: no new blockers introduced.
- Next step: add OpenAPI contract entries for `import/sync-source` and `import-runs`, then run real FAOSTAT dry-run in environment with key configured.

### 2026-04-20 (execution: FEAT-005 source-sync adapter boundary + import-run persistence)
- Focus: continue Sprint 2 by introducing source-driven ingestion scaffolding and auditable import-run tracking.
- Files changed: `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `tracebud-backend/sql/tb_v16_012_yield_benchmark_import_runs.sql`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/yield-benchmarks/import/sync-source` (`USDA_FAS`/`FAOSTAT`, optional commodity/geography filters, dry-run mode), `GET /v1/yield-benchmarks/import-runs` diagnostics read, and import-run persistence schema (`yield_benchmark_import_runs`) for `started/completed/failed` run lifecycle metadata.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`; `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts` (pass, `2 suites / 25 tests`).
- Risks: medium; source-sync currently depends on external adapter endpoint shape/availability and does not yet include built-in scheduler/retry policy orchestration.
- Blockers: no new blockers introduced.
- Next step: add scheduled execution wrapper (cron-triggered sync jobs with bounded retries) and publish OpenAPI updates for new source-sync/import-run routes.

### 2026-04-20 (execution: FEAT-005 benchmark import draft-upsert scaffold)
- Focus: start Sprint 2 ingestion lane with a deterministic benchmark batch import write-path for inactive drafts.
- Files changed: `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/yield-benchmarks/import` for internal benchmark admins; row validation reuses canonical source/citation/numeric checks; import behavior is deterministic inactive-draft upsert (update matching draft by `(commodity, geography, source_type, source_reference)`, otherwise insert new draft); import lifecycle telemetry now records `yield_benchmark_import_started` and `yield_benchmark_import_completed`.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`; `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts` (pass, `2 suites / 23 tests`).
- Risks: medium; import is currently request-driven/manual (no scheduler/source pull yet), and import matching relies on exact `source_reference` identity.
- Blockers: no new blockers introduced.
- Next step: add source-adapter pull + scheduled ingestion job wrapper (FAOSTAT/USDA lanes), plus explicit import-run report persistence for replay/debug workflows.

### 2026-04-20 (execution: FEAT-005 benchmark-driven harvest yield-cap runtime enforcement)
- Focus: replace hardcoded harvest yield cap with active benchmark-driven runtime resolution while preserving deterministic fail-closed behavior.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: harvest create path now resolves cap from active `yield_benchmarks` using `commodity=coffee` + plot-linked geography (`farmer_profile.country_code`) with deterministic fallback chain (exact geography -> `GLOBAL` -> default `1500 kg/ha`); package risk-density cap check now uses the same resolver (`GLOBAL`-scoped).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts`; `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.controller.spec.ts` (pass, `2 suites / 26 tests`).
- Risks: low-medium; resolver currently depends on available active benchmark data quality, but explicit fallback path keeps runtime deterministic under missing/invalid benchmark rows.
- Blockers: no new blockers introduced.
- Next step: wire tenant-aware commodity/geography benchmark selection into harvest/package contexts and add ingest-backed benchmark freshness controls to reduce fallback usage in production.

### 2026-04-20 (execution: remaining-execution scorecard blocked-vs-ready checkpoint refresh)
- Focus: make handoff state explicit by separating closed in-repo lanes from external blockers.
- Files changed: `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: replaced stale two-week in-repo plan section with explicit `Ready now` vs `Blocked now` checkpoint, confirming only remaining blocker is owner-level `spatial_ref_sys` remediation plus Supabase ticket follow-through.
- Verification: docs-only update; no runtime/test behavior changed.
- Risks: low; status/reporting clarity change only.
- Blockers: external privileged operator dependency remains unchanged (`42501 must be owner of table spatial_ref_sys`, project `uzsktajlnofosxeqwdwl`).
- Next step: execute owner-window runbook + verifier and replace scorecard ticket placeholder (`TBD`) with actual support ticket ID.

### 2026-04-20 (execution: FEAT-009 admin status-read success toast assertion coverage)
- Focus: complete success-path operator-feedback test coverage for DDS status reads.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extended existing success helper flow assertion to verify deterministic completion toast text (`EUDR DDS status read completed (status 200).`) in the same test that validates `Download JSON` visibility gating.
- Verification: `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts` (pass, `4 files / 20 tests`).
- Risks: low; test-only assertion expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed; external privileged `spatial_ref_sys` owner remediation/support ticket lane remains unchanged.
- Next step: FEAT-009 admin DDS status interaction matrix is fully covered for current post-closeout scope; remaining outstanding execution items are external operational blockers (owner-level staging remediation + Supabase support ticket follow-through).

### 2026-04-20 (execution: FEAT-009 admin status-download control visibility gating coverage)
- Focus: lock UI gating semantics for main status payload `Download JSON` control.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: replaced unstable jsdom failure-branch approach with deterministic visibility-gating assertion (`Download JSON` absent before success, present after successful status read).
- Risks: low; test-only interaction assertion update, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add explicit success-path assertion for status-read success toast text in same helper flow to complete visibility + feedback pairing.

### 2026-04-20 (execution: FEAT-009 admin status-payload download interaction coverage)
- Focus: extend admin interaction matrix from last-error exports to main status-payload `Download JSON` path.
- Files changed: `apps/dashboard-product/app/admin/test-helpers.tsx`, `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `renderAdminWithStatusReadSuccess` helper and asserted download filename contract, payload content, URL lifecycle, and success toast for status payload export.
- Risks: low; test-only interaction coverage expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add failure-path test for status payload download if object URL creation fails (for parity with copy-action failure branches).

### 2026-04-20 (execution: FEAT-009 reusable download mock helper extraction)
- Focus: reduce download-test boilerplate by centralizing URL/Blob/anchor mock setup.
- Files changed: `apps/dashboard-product/app/admin/test-helpers.tsx`, `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extracted `setupDownloadMocks` helper and updated admin download interaction test to consume helper + restore function.
- Risks: low; test-harness refactor only, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally reuse `setupDownloadMocks` for future download action tests (telemetry CSV/JSON export paths) to keep patterns consistent.

### 2026-04-20 (execution: FEAT-009 admin download-error-json payload-content coverage)
- Focus: close download-action contract by asserting serialized error JSON payload content in interaction tests.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added Blob stub in test runtime and asserted downloaded JSON payload keys/content (`message`, `referenceNumber`, `occurredAt`) alongside existing filename/lifecycle assertions.
- Risks: low; test-only assertion expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally extract URL/Blob mocking helpers into reusable test utilities if more download-path tests are added.

### 2026-04-20 (execution: FEAT-009 admin download-error-json interaction semantics coverage)
- Focus: complete export-action matrix by locking `Download error JSON` semantics in admin interaction tests.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added assertions for download filename pattern, object URL creation/revocation, anchor lifecycle (`append/remove/click`), and success toast (`EUDR status error context downloaded.`).
- Risks: low; test-only assertion expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add focused guard that confirms downloaded blob JSON payload contains expected keys (`message`, `referenceNumber`, `occurredAt`) once blob-content introspection is needed.

### 2026-04-20 (execution: FEAT-009 admin copy-error-context success-path payload coverage)
- Focus: complete copy-action matrix by locking `Copy error context` success payload semantics and operator feedback.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added success-branch assertion for clipboard payload JSON (`message`, `referenceNumber`, `occurredAt`) and success toast (`EUDR status error context copied to clipboard.`).
- Risks: low; test-only assertion expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add branch-specific coverage for `Download error JSON` filename/payload semantics to complete full export-action matrix.

### 2026-04-20 (execution: FEAT-009 admin copy-error-context failure-path toast coverage)
- Focus: lock deterministic operator feedback when `Copy error context` clipboard write fails.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added clipboard rejection test branch and asserted error toast text (`Failed to copy EUDR status error context.`).
- Risks: low; test-only branch coverage addition, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add parity success-path assertion for `Copy error context` payload shape + success toast to fully close copy-action matrix.

### 2026-04-20 (execution: FEAT-009 admin copy-filename failure-path toast coverage)
- Focus: lock deterministic operator feedback when `Copy filename` clipboard write fails.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added clipboard rejection test branch and asserted error toast text (`Failed to copy EUDR status error filename.`); added toast mock reset per test for isolation.
- Risks: low; test-only branch coverage addition, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally mirror this failure-branch coverage for `Copy error context` control to complete last-error copy-action parity.

### 2026-04-20 (execution: FEAT-009 admin copy-filename interaction toast/clipboard coverage)
- Focus: lock operator feedback behavior for DDS status `Copy filename` action.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added clipboard mock + `sonner` toast mock assertions to verify filename copy writes expected value and emits success toast.
- Risks: low; test-only assertion expansion, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add complementary failure-branch assertion for clipboard rejection -> error toast behavior.

### 2026-04-20 (execution: FEAT-009 admin reusable failure-path test helper extraction)
- Focus: reduce duplication in admin DDS status interaction tests by extracting shared failure-path setup.
- Files changed: `apps/dashboard-product/app/admin/test-helpers.tsx`, `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: moved failure-path render/click/wait setup into `renderAdminWithStatusReadFailure` helper and updated page tests to consume helper.
- Risks: low; test-structure refactor only, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally reuse this helper in future admin diagnostics panel tests (copy/download telemetry/export actions).

### 2026-04-20 (execution: FEAT-009 admin interaction test split for status export helpers)
- Focus: reduce diagnosis time by splitting DDS status export-helper coverage into narrow tests.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced shared failure-path render helper and split assertions into two tests (accessible export controls vs timestamp helper note).
- Risks: low; test-structure refactor only, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally promote the shared failure-path helper into a reusable admin test utility if more panel interaction tests are added.

### 2026-04-20 (execution: FEAT-009 admin timestamp-helper interaction coverage)
- Focus: lock DDS status timestamp helper-note rendering in panel interaction test flow.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extended admin failure-path interaction test assertions to include timestamp helper-note content (`is replaced at download time.`) plus placeholder presence.
- Risks: low; test-only assertion expansion, no runtime behavior change.
- Blockers: `BLK-003` remains closed.
- Next step: optionally split this combined accessibility-helper test into two focused cases (controls vs helper note) if future failures need narrower fault isolation.

### 2026-04-20 (execution: FEAT-009 admin accessibility interaction test for status exports)
- Focus: lock accessible-name behavior for DDS status last-error export controls with panel interaction coverage.
- Files changed: `apps/dashboard-product/app/admin/page.test.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added admin jsdom interaction test that triggers DDS status-read failure path and asserts accessible names for copy/download filename/context controls.
- Risks: low; test-only addition, runtime behavior unchanged.
- Blockers: `BLK-003` remains closed.
- Next step: optionally expand this harness to also assert timestamp-token helper note rendering alongside control presence.

### 2026-04-20 (execution: FEAT-009 DDS status export-control accessibility labels)
- Focus: improve assistive-technology clarity for DDS status last-error export controls.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added explicit `aria-label` attributes to `Copy error context`, `Download error JSON`, and `Copy filename` controls in last-error panel.
- Risks: low; accessibility metadata only, no backend/API/permission/state behavior changes.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add panel-level interaction tests that verify accessible names for the export helper controls once admin UI test harness is expanded.

### 2026-04-20 (execution: FEAT-005 CI claim-preflight fail-closed gate)
- Focus: make benchmark-admin claim safety blocking in CI instead of observability-only.
- Files changed: `.github/workflows/ci.yml`, `tracebud-backend/scripts/check-benchmark-admin-claims.mjs`, `tracebud-backend/package.json`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: backend CI now requires `BENCHMARK_ADMIN_ROLE_CLAIMS` secret and runs `npm run auth:benchmark-admin:claims:check`, which fails if claim list is empty or missing required canonical claims (`ADMIN`, `COMPLIANCE_MANAGER`).
- Verification: `cd tracebud-backend && BENCHMARK_ADMIN_ROLE_CLAIMS="ADMIN,COMPLIANCE_MANAGER" npm run auth:benchmark-admin:claims:check`; `cd tracebud-backend && npm test -- --runTestsByPath src/health/health.controller.spec.ts src/integrations/yield-benchmarks.controller.spec.ts` (pass).
- Risks: medium; CI will now hard-fail until repository secret `BENCHMARK_ADMIN_ROLE_CLAIMS` is configured with required claims.
- Blockers: configure CI secret to avoid expected fail on next backend workflow run.
- Next step: set repository secret `BENCHMARK_ADMIN_ROLE_CLAIMS=ADMIN,COMPLIANCE_MANAGER` and re-run backend CI lane.

### 2026-04-20 (execution: FEAT-005 benchmark-admin claim health diagnostics)
- Focus: reduce operational lockout risk after claim-only enforcement by surfacing benchmark-admin claim config status in health checks.
- Files changed: `tracebud-backend/src/health/health.controller.ts`, `tracebud-backend/src/health/health.controller.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `/health` now returns `benchmarkAdminAuth` diagnostics (`claimEnforced`, `configured`, `requiredClaims`) and emits warning when `BENCHMARK_ADMIN_ROLE_CLAIMS` resolves empty; defaults to `ADMIN,COMPLIANCE_MANAGER`.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/health/health.controller.spec.ts src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts` (pass).
- Risks: low; additive health payload change only.
- Blockers: none new.
- Next step: wire this health diagnostic into deployment/runbook checks so empty-claim config fails pre-release validation.

### 2026-04-20 (execution: FEAT-005 claim-only benchmark-admin enforcement)
- Focus: finalize auth hardening by removing legacy fallback from yield benchmark admin routes.
- Files changed: `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: removed `exporter+@tracebud.com` legacy fallback; benchmark admin operations now require canonical claims (`ADMIN` / `COMPLIANCE_MANAGER`) only.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`; `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts` (all pass).
- Risks: low-medium; stricter auth may deny users missing claims until identity provisioning is fully aligned.
- Blockers: none new.
- Next step: ensure internal benchmark operators in Supabase auth have `ADMIN` or `COMPLIANCE_MANAGER` claim configured.

### 2026-04-20 (execution: FEAT-005 canonical benchmark-admin claim mapping)
- Focus: shift yield benchmark admin authorization from identity-domain proxy to canonical role claims.
- Files changed: `tracebud-backend/src/auth/roles.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.int.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `deriveRoleFromSupabaseUser` now parses canonical claim roles (`ADMIN`, `COMPLIANCE_MANAGER` plus existing roles), yield-benchmark route auth is claim-first with temporary legacy fallback, and audit payload now captures `policyMode` for rollout observability.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`; `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts` (all pass).
- Risks: low-medium; broader role derivation changed globally but claim parsing is additive and existing email-prefix fallback remains in place.
- Blockers: no new blockers introduced.
- Next step: phase out legacy fallback once canonical claims are guaranteed across internal benchmark-admin sessions.

### 2026-04-20 (execution: FEAT-005 yield-benchmark governance write path)
- Focus: implement runtime enforcement for Section 37 benchmark source-traceability and dual-control activation semantics.
- Files changed: `tracebud-backend/src/integrations/yield-benchmarks.controller.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.spec.ts`, `tracebud-backend/src/integrations/yield-benchmarks.controller.int.spec.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `tracebud-backend/sql/tb_v16_011_yield_benchmarks.sql`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added internal-admin-only yield benchmark contract (create/update/list/activate), enforced citable `sourceReference` checks for `NATIONAL_STATS`/`USDA_FAS`/`FAOSTAT`, enforced draft-only updates and creator!=approver dual-control activation, and appended benchmark lifecycle audit events.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`; `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts`; `npm run openapi:lint` (all pass).
- Risks: low-medium; new contract is implemented and tested, but external role taxonomy still uses internal `exporter+@tracebud.com` proxy until dedicated admin/compliance role claims are introduced.
- Blockers: no new blockers introduced; external infra blocker remains `spatial_ref_sys` owner execution window.
- Next step: add dedicated auth claim mapping for `ADMIN`/`COMPLIANCE_MANAGER` and migrate endpoint policy check from email-domain proxy to canonical claims.

### 2026-04-20 (execution: Section 37 source-verified benchmark seed hardening)
- Focus: advance P2 spec hardening by replacing provisional benchmark seed framing with source-verified bootstrap rules.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: updated Section 37.1 to define explicit bootstrap derivation rule (rolling recent-series envelope, conservative rounding), added `source_reference_baseline` field in benchmark table, and aligned source strategy to FAOSTAT primary with USDA FAS cross-check lane for soy rows.
- Risks: low-medium; this is spec-governance hardening and still requires data-ingest implementation to enforce row-level `source_reference` capture in operational tables.
- Blockers: none new; external privileged `spatial_ref_sys` owner window remains the only infra-coupled lane blocker.
- Next step: implement/verify ingest-side enforcement that persists row-level `yield_benchmarks.source_reference` values consistent with Section 37.1/37.2 requirements.

### 2026-04-20 (execution: FEAT-009 DDS status timestamp-token constant alignment)
- Focus: prevent `<timestamp>` copy drift across filename preview and helper note.
- Files changed: `apps/dashboard-product/lib/eudr-dds-status-error-context.ts`, `apps/dashboard-product/lib/eudr-dds-status-error-context.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced shared timestamp-token constant and switched admin panel preview/note rendering to use the same exported value; added utility assertion for token stability.
- Risks: low; utility/UI copy alignment only, no backend/API/permission/state behavior changes.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add tiny accessibility label refinement on filename helper controls if panel-level interaction tests flag wording friction.

### 2026-04-20 (execution: FEAT-009 DDS status error-context utility extraction)
- Focus: reduce admin-panel helper drift by centralizing DDS status error-export utility logic.
- Files changed: `apps/dashboard-product/lib/eudr-dds-status-error-context.ts`, `apps/dashboard-product/lib/eudr-dds-status-error-context.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extracted shared filename builder + context serializer utility and switched admin flow to consume it for preview/download/copy paths; added focused utility unit coverage.
- Risks: low; refactor + tests only, no backend/API/permission/state behavior changes.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add admin interaction tests around the last-error export controls once panel-level UI test harness is available.

### 2026-04-20 (execution: FEAT-009 DDS status filename builder de-duplication)
- Focus: prevent preview/download filename drift for DDS status error exports.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added shared local filename builder and reused it for suggested filename preview plus download action naming.
- Risks: low; refactor-only change in UI helper path, no API/runtime/permission/state behavior changes.
- Blockers: `BLK-003` remains closed.
- Next step: optionally extract DDS status error-context helpers into a tiny dedicated utility once admin panel interaction tests are introduced.

### 2026-04-20 (execution: TB-V16-009 owner-remediation deterministic verifier)
- Focus: remove ambiguity from privileged `spatial_ref_sys` remediation handoff by adding one-command post-run PASS/FAIL evidence output.
- Files changed: `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_verify.sql`, `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql`, `product-os/04-quality/remaining-lanes-final-execution-pack.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added standalone verification SQL that emits extension/table/policy/grant snapshots plus deterministic `remediation_status` (`PASS`/`FAIL`) row; updated runbook and operator packet to use this verifier as the primary post-run check.
- Risks: low; verification-only addition, no runtime app behavior changes.
- Blockers: privileged owner execution window still required to run remediation and verifier against target.
- Next step: run owner remediation in privileged window, execute verifier script, and paste PASS/FAIL output into scorecard evidence lines.

### 2026-04-20 (execution: FEAT-009 OpenAPI contract lock + BLK-003 closure evidence)
- Focus: publish implemented EUDR integration contract in Tracebud OpenAPI and close integration-target blocker with governance evidence.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/blockers.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Integrations` OpenAPI tag and published `GET /v1/integrations/eudr/echo`, `POST /v1/integrations/eudr/dds`, `GET /v1/integrations/eudr/dds/status`; updated FEAT-009 contract note to reflect published Tracebud contract; closed `BLK-003` with linked evidence trail.
- Verification: `npm run openapi:lint`, `npm run openapi:governance:policy:validate`, `npm run openapi:governance:check` (all pass).
- Risks: low-medium; internal Tracebud contract is locked for implemented routes, while external provider Swagger extraction remains a separate upstream visibility dependency.
- Blockers: `BLK-003` closed.
- Next step: capture provider-side Swagger JSON/YAML artifact when accessible and append to FEAT-009/P1 evidence register for cross-contract traceability.

### 2026-04-20 (execution: FEAT-009 DDS status filename timestamp clarification)
- Focus: remove ambiguity in filename preview placeholder semantics during escalation prep.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added inline note in DDS status last-error panel clarifying `<timestamp>` token is replaced at actual download time.
- Risks: low; UI-copy clarification only, no backend/API/runtime/permission/state changes.
- Blockers: `BLK-003` remains closed.
- Next step: optionally add lightweight UI test coverage around the last-error helper copy text/action cluster once admin panel interaction tests are introduced.

### 2026-04-20 (execution: FEAT-009 DDS status copy-filename action)
- Focus: streamline escalation template completion with filename-only clipboard export.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `handleCopyEudrStatusErrorFilename` and inline `Copy filename` action beside suggested filename preview; emits deterministic success/failure clipboard toasts.
- Risks: low; UI ergonomics improvement only, no backend/API/permission/state behavior changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add a tiny tooltip clarifying that `<timestamp>` resolves at download time in the actual file.

### 2026-04-20 (execution: FEAT-009 DDS status filename preview helper)
- Focus: improve operator traceability by previewing expected error-export artifact name before download.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added computed `eudrStatusErrorFilenamePreview` and inline monospace helper text (`eudr-dds-status-error-<reference>-<timestamp>.json`) in last-error panel.
- Risks: low; UI helper-only addition, no API/runtime/permission/state changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add compact `Copy filename` action for escalation templates that require prefilled artifact names.

### 2026-04-20 (execution: FEAT-009 DDS status export destination helper note)
- Focus: remove operator ambiguity about where downloaded error-context artifacts land.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added inline helper text in last-error panel stating downloads are saved by browser to default Downloads folder; no changes to export payload fields or route behavior.
- Risks: low; UI copy-only enhancement, no permission/state/exception/runtime behavior changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add an auto-generated suggested filename preview near error-export actions for easier operator traceability.

### 2026-04-20 (execution: FEAT-009 DDS status download-error-json action)
- Focus: provide attachment-ready escalation artifact export directly from DDS status last-error panel.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `handleDownloadEudrStatusErrorContext` and inline `Download error JSON` control; export payload mirrors normalized error context fields (`message`, `occurredAt`, `referenceNumber`) and emits deterministic success toast.
- Risks: low; UI-only export enhancement, no backend/API/permission/state-transition changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add tiny helper label clarifying where browser-downloaded escalation artifacts are stored.

### 2026-04-20 (execution: FEAT-009 DDS status copy-error-context action)
- Focus: speed support escalation by allowing one-click copy of normalized DDS status error context.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `handleCopyEudrStatusErrorContext` and inline `Copy error context` control in last-error panel; copied payload includes mapped message, occurrence timestamp, and reference number; success/failure clipboard toasts added.
- Risks: low; operator UX-only enhancement, no backend/API/permission/state-transition changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add “Download error context JSON” companion action for attachment-ready escalation artifacts.

### 2026-04-20 (execution: FEAT-009 DDS status last-error context badge)
- Focus: improve operator handoff speed by preserving last status-read failure context directly in DDS panel.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `eudrStatusLastError` state (`message`, `occurredAt`, `referenceNumber`), set on status-read failures using mapped toast message, cleared on successful checks, and rendered as compact inline badge in panel.
- Risks: low; UI-only observability enhancement with no API contract, permission, or state transition changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add one-click “Copy error context” action for support escalation packets.

### 2026-04-20 (execution: FEAT-009 DDS status retry/escalation hint block)
- Focus: complete operator guidance UX for malformed DDS status payload failures with inline next-step hinting.
- Files changed: `apps/dashboard-product/lib/eudr-dds-status-feedback.ts`, `apps/dashboard-product/lib/eudr-dds-status-feedback.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added shared malformed-payload predicate helper and used it in admin status-read flow to conditionally render compact retry/escalation hint block; hint clears on successful status checks.
- Risks: low; UI/helper hardening only, no backend contract or permission/state transition changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: optionally add status-read last-error badge/timestamp for faster operator handoff context.

### 2026-04-20 (execution: P1 legal tracker owner/due prefill)
- Focus: turn legal/procurement checklist into a schedule-ready work plan with concrete role ownership and dates.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: prefilled tracker rows with role-based owners, staged due dates (`2026-04-24`..`2026-05-06`), initial status states (`in_progress` for counsel lanes), and starter evidence artifact placeholders.
- Risks: low-medium; owner names are role-based placeholders and should be swapped for actual people before dispatch.
- Blockers: `BLK-003` remains open pending sign-off and tracker completion.
- Next step: replace role placeholders with named assignees and attach first evidence links after kickoff.

### 2026-04-20 (execution: P1 legal checklist owner/due/evidence tracker)
- Focus: make managed-vendor legal checklist execution-ready for deterministic closeout ownership.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added legal checklist tracker table with explicit owner, due date, status, and evidence artifact fields for each managed-vendor legal/procurement item.
- Risks: low; documentation/governance-only update.
- Blockers: `BLK-003` remains open pending sign-off and tracker completion.
- Next step: assign named owners + due dates and attach first evidence links in tracker rows.

### 2026-04-20 (execution: P1 managed-primary strategy lock + legal checklist)
- Focus: formalize integration strategy choice to keep delivery speed while preserving fallback and legal governance.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: locked strategy to managed EUDR REST API as primary with open-source fallback evaluation lane; added explicit adapter-boundary constraints and required managed-vendor legal checklist (MSA/DPA/security/accountability/procurement + AGPL fallback review).
- Risks: low-medium; strategy clarity improved, but production gate still depends on completing legal checklist and final endpoint contract confirmation.
- Blockers: `BLK-003` remains open pending final lock sign-off workflow completion.
- Next step: complete checklist owners/dates and record sign-off evidence in the template.

### 2026-04-20 (execution: FEAT-009 malformed-status operator guidance UX)
- Focus: improve operator clarity when DDS status reads fail due to malformed provider payload bodies.
- Files changed: `apps/dashboard-product/lib/eudr-dds-status-feedback.ts`, `apps/dashboard-product/lib/eudr-dds-status-feedback.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/api/integrations/eudr/dds/status/route.test.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added shared status-error feedback helper and mapped malformed payload backend error (`EUDR DDS status response was not valid JSON`) to explicit operator guidance message; added utility tests plus status-route non-2xx malformed-payload pass-through assertion.
- Risks: low; UI messaging/test hardening only, no backend contract or policy behavior changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: add a compact “retry + escalation” UI hint block near status-read controls when this mapped malformed-payload message is encountered.

### 2026-04-20 (execution: FEAT-009 malformed-status-payload deterministic mapping)
- Focus: make DDS status read failure behavior deterministic when provider returns malformed JSON body on successful HTTP status.
- Files changed: `tracebud-backend/src/integrations/eudr.controller.ts`, `tracebud-backend/src/integrations/eudr.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: backend now maps malformed JSON status payloads to explicit `BadGatewayException` message (`EUDR DDS status response was not valid JSON`) and includes focused unit test coverage for this branch.
- Risks: low; hardening narrows ambiguous failure surface and does not alter success or non-2xx mapping semantics.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: extend dashboard status UI to surface this deterministic malformed-payload error text with operator guidance when encountered.

### 2026-04-20 (execution: FEAT-009 replay-message regression helper extraction)
- Focus: lock replay toast wording branch with focused tests and reduce future drift in admin DDS submit messaging.
- Files changed: `apps/dashboard-product/lib/eudr-dds-submit-feedback.ts`, `apps/dashboard-product/lib/eudr-dds-submit-feedback.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extracted replay/non-replay success message logic into shared helper consumed by admin submit flow, and added dedicated regression tests for replay wording and default status fallback while keeping DDS proxy replay pass-through coverage green.
- Risks: low; refactor is behavior-preserving for non-replay paths and explicitly regression-tested for replay semantics.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: add integration-level admin page test harness coverage for submit toast branches once admin page test surface is introduced.

### 2026-04-20 (execution: FEAT-009 replay-aware dashboard submit messaging)
- Focus: surface backend idempotency replay outcomes clearly in operator DDS submit UX and lock proxy replay pass-through semantics.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/api/integrations/eudr/dds/route.test.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: DDS submit success toast now differentiates replay outcomes (`replayed=true`) from first-pass submissions, and route tests now assert replay payload pass-through (`statusCode=409`, `replayed=true`, idempotency key preserved).
- Risks: low; UI/test hardening only, backend contract remains authoritative.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: add focused admin UI tests for replay toast branch to guard operator-facing replay wording against future regressions.

### 2026-04-20 (execution: FEAT-009 DDS idempotency replay semantics hardening)
- Focus: make DDS submit idempotency behavior deterministic when provider returns duplicate submission signal.
- Files changed: `tracebud-backend/src/integrations/eudr.controller.ts`, `tracebud-backend/src/integrations/eudr.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: provider `409` responses on `POST /v1/integrations/eudr/dds` are now treated as replay-safe success (`ok=true`, `replayed=true`) with replay-aware audit telemetry (`phase=replayed`, `replayed=true`), while non-replay non-2xx responses remain fail-mapped to `BadGatewayException`.
- Risks: low-medium; behavior assumes provider `409` is duplicate/idempotent replay class and should be revalidated if provider contract changes.
- Blockers: `BLK-003` remains open pending final external target lock/sign-off.
- Next step: propagate replay flag handling to dashboard DDS operator surfaces for explicit replay user messaging and add route/UI assertions.

### 2026-04-20 (execution: final blocker escalation status pin)
- Focus: make the last non-100 blocker explicitly support-escalation tracked in status artifacts.
- Files changed: `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: recorded Supabase owner-only blocker status as `pending_ticket` with project ref and exact error (`42501 must be owner of table spatial_ref_sys`) plus ticket ID placeholder (`TBD`) for immediate fill-in after support submission.
- Risks: low; status/doc-only update, no runtime behavior change.
- Blockers: awaiting Supabase support/owner-side action for `spatial_ref_sys` remediation.
- Next step: submit support ticket, paste ticket ID into scorecard escalation line, then run post-remediation verification queries and flip remaining lane to 100.

### 2026-04-20 (execution: FEAT-009 shared redaction utility extraction)
- Focus: reduce redaction drift risk by centralizing payload-masking logic and adding direct unit tests.
- Files changed: `apps/dashboard-product/lib/payload-redaction.ts`, `apps/dashboard-product/lib/payload-redaction.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extracted recursive sensitive-key masking to shared utility and replaced inline admin implementation; added focused tests for recursive masking and benign pass-through behavior.
- Risks: low; behavior-preserving refactor with test coverage added.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: switch from heuristic-key masking to schema-driven redact policy once provider payload schema is finalized.

### 2026-04-20 (execution: FEAT-009 admin status payload redaction)
- Focus: reduce accidental exposure risk when operators inspect/copy/export provider status payloads.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added recursive payload redaction utility keyed on common sensitive field patterns, and applied redaction uniformly to status panel display, copy action, and JSON download output.
- Risks: low-medium; heuristic key-based masking can over-mask some benign fields and should be refined against final provider payload schema.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: convert heuristic redaction to schema-aware allowlist/mask policy once Swagger payload structure is finalized.

### 2026-04-20 (execution: FEAT-009 admin status payload handoff actions)
- Focus: streamline operator evidence handoff from DDS status result panel.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Copy payload` and `Download JSON` actions to status panel with success/failure toasts for clipboard/export workflows.
- Risks: low; UI-only enhancement with no API behavior changes.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: optionally add redaction mask rules for sensitive fields before copy/download if provider payload includes PII.

### 2026-04-20 (execution: FEAT-009 admin DDS status result panel)
- Focus: improve operator observability by surfacing status-read response details directly in admin UI.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added persisted last-result panel for DDS status reads (reference, HTTP status, checked timestamp, formatted payload JSON) and clear-on-failure behavior to prevent stale-result confusion.
- Risks: low; UI-only enhancement with no API contract changes.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: add copy/export action for status payload panel if operators need handoff artifacts.

### 2026-04-20 (execution: FEAT-009 dashboard DDS status read flow)
- Focus: expose backend DDS status operation to dashboard operator workflows with parity guardrails.
- Files changed: `apps/dashboard-product/app/api/integrations/eudr/dds/status/route.ts`, `apps/dashboard-product/app/api/integrations/eudr/dds/status/route.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added status proxy route with reference-number validation + backend-url fail-closed checks, added admin status-trigger card (`Check Status`) with reference input + loading/success/error toasts, and verified route/test lanes are green.
- Risks: low-medium; provider operation path remains provisional until direct Swagger contract extraction is captured.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: add status result detail rendering (parsed provider payload excerpt) in admin card for richer operator troubleshooting.

### 2026-04-20 (execution: FEAT-009 backend DDS status read + Swagger retry)
- Focus: ship a second concrete EUDR operation (`status` read) and re-attempt provider contract extraction from Swagger.
- Files changed: `tracebud-backend/src/integrations/eudr.controller.ts`, `tracebud-backend/src/integrations/eudr.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/integrations/eudr/dds/status?referenceNumber=...` with exporter/agent + tenant-claim policy, required query validation, timeout/non-2xx mapping, and immutable audit event `integration_eudr_dds_status_checked`; unit suite now passes with expanded status-read coverage.
- Risks: medium; provider path remains provisional (`/api/eudr/dds` + `referenceNumber`) until direct Swagger schema/path extraction is available from environment.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: capture/ingest provider Swagger operation list out-of-band (browser export) and finalize endpoint/schema mapping in FEAT-009 + shared validator.

### 2026-04-20 (execution: FEAT-009 shared DDS validation utility reuse)
- Focus: remove duplicated DDS validation logic by centralizing schema checks across admin UI and dashboard proxy route.
- Files changed: `apps/dashboard-product/lib/eudr-dds-validation.ts`, `apps/dashboard-product/lib/eudr-dds-validation.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/api/integrations/eudr/dds/route.ts`, `apps/dashboard-product/app/api/integrations/eudr/dds/route.test.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: extracted schema/validator to shared utility, reused it in both submit entry points, and added utility tests for valid payload + nested required-field error path.
- Risks: low; validation behavior is now more consistent, but final schema still needs alignment to confirmed Swagger/OpenAPI contract.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: align shared schema exactly to provider Swagger contract and surface any newly required fields in presets/UI hints.

### 2026-04-20 (execution: FEAT-009 admin DDS schema-driven preflight)
- Focus: improve maintainability and operator feedback quality by moving DDS pre-submit checks to schema-driven validation.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added lightweight JSON schema + validator for DDS payload preflight (required keys + nested type checks), and now surface path-specific validation errors before API submit.
- Risks: low; no backend contract changes, and backend remains source-of-truth for final validation.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: align UI schema exactly with confirmed Swagger/OpenAPI contract once endpoint schema extraction is finalized.

### 2026-04-20 (execution: FEAT-009 admin DDS pre-submit shape checks)
- Focus: catch incomplete DDS payloads earlier in admin UI before proxy/backend roundtrip.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added targeted pre-submit checks for `declarationType`, `referenceNumber`, `operator.name`, and `product.commodity` with explicit operator-facing toast errors.
- Risks: low; UI preflight only, backend validation remains authoritative.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: replace lightweight checks with schema-driven validation once final Swagger contract is confirmed.

### 2026-04-20 (execution: FEAT-009 admin DDS copy-json helper)
- Focus: improve operator ergonomics for payload verification by adding one-click JSON copy from DDS submit card.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Copy JSON` action wired to clipboard API with success/failure toast feedback and in-flight submit disable behavior.
- Risks: low; UI-only utility with no backend contract impact.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: add schema-aware field hints once Swagger contract is finalized to reduce malformed manual edits.

### 2026-04-20 (execution: FEAT-009 admin DDS preset selector)
- Focus: improve DDS operator testing flow by supporting multiple one-click payload presets instead of a single sample.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: replaced single sample object with preset map (`import`, `export`, `domestic`), added preset dropdown in DDS card, and updated load action to prefill selected payload + regenerate idempotency key.
- Risks: low; UI helper only, no backend contract changes.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: align preset payload examples with confirmed Swagger schema once final operation contract is locked.

### 2026-04-20 (execution: FEAT-009 admin DDS sample loader)
- Focus: reduce operator friction by adding a one-click payload scaffold for the new admin DDS submit flow.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Load sample JSON` action to DDS submit card to prefill a baseline statement object + regenerate idempotency key, and kept existing submit validation/loading/feedback semantics unchanged.
- Risks: low; helper is UI-only and does not alter backend submission contract.
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: add canonical schema-backed sample presets once Swagger endpoint contract is confirmed.

### 2026-04-20 (execution: FEAT-009 admin DDS submit operator UI)
- Focus: make the new EUDR DDS submit path usable by operators directly from admin diagnostics without manual API calls.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added an `EUDR DDS Submit (Operator Trigger)` card with idempotency key + statement JSON inputs, wired submit action to `/api/integrations/eudr/dds`, and added validation/error/success toast flows with filing diagnostics reload on successful submit.
- Risks: low-medium; UI currently accepts free-form JSON (intended for operator diagnostics), and strict schema-level field validation is deferred to backend/provider contracts.
- Blockers: `BLK-003` remains open pending final contract lock/sign-off.
- Next step: add backend Swagger contract + UI helper templates for canonical DDS statement shapes once endpoint schema is fully confirmed.

### 2026-04-20 (execution: FEAT-009 dashboard DDS submit proxy route)
- Focus: expose the first EUDR DDS write path through dashboard server routes so UI and operator workflows can call backend integration safely.
- Files changed: `apps/dashboard-product/app/api/integrations/eudr/dds/route.ts`, `apps/dashboard-product/app/api/integrations/eudr/dds/route.test.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /api/integrations/eudr/dds` proxy with statement/idempotency validation, fail-closed `TRACEBUD_BACKEND_URL` check, Authorization pass-through, and backend body forwarding to `/v1/integrations/eudr/dds`.
- Risks: low-medium; route is backend-dependent and currently not surfaced in admin UI yet (API path is ready for next UI integration slice).
- Blockers: `BLK-003` remains open pending final endpoint contract lock/sign-off.
- Next step: add admin UI trigger/form for DDS submit flow and capture operator-visible success/failure diagnostics.

### 2026-04-20 (execution: FEAT-009 first EUDR DDS write operation)
- Focus: ship first non-echo external integration write path with the same tenant/role/audit guardrail model used in EUDR connectivity checks.
- Files changed: `tracebud-backend/src/integrations/eudr.controller.ts`, `tracebud-backend/src/integrations/eudr.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/integrations/eudr/dds` (exporter-only, tenant-claim required), required `statement` + `idempotencyKey` validation, server-side call to `/api/eudr/dds`, and immutable submission telemetry event `integration_eudr_dds_submitted` with status/latency metadata.
- Risks: medium; DDS endpoint path is still tied to provisional mapping and should be re-confirmed against Swagger endpoint schema before broader rollout.
- Blockers: `BLK-003` remains open pending final target lock and endpoint contract confirmation.
- Next step: add dashboard proxy/admin trigger for DDS submit diagnostics and confirm payload schema with Swagger/OpenAPI extraction.

### 2026-04-20 (execution: FEAT-009 backend EUDR connectivity endpoint)
- Focus: move from planning-only integration prep to a safe runtime connectivity path that validates backend secret wiring against EUDR API.
- Files changed: `tracebud-backend/src/integrations/eudr.controller.ts`, `tracebud-backend/src/integrations/eudr.controller.spec.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/integrations/eudr/echo` with tenant claim + exporter/agent gating, server-side `EUDR_API_*` env contract, 10s timeout, non-2xx provider mapping to `502`, and immutable audit event `integration_eudr_echo_checked`.
- Risks: low-medium; endpoint currently validates connectivity only (not full DDS lifecycle operation contracts), and provider path/schema lock is still gated by Swagger verification.
- Blockers: `BLK-003` remains open pending target sign-off and finalized endpoint mapping.
- Next step: add controller/integration coverage for first concrete DDS operation(s) after confirmed Swagger contract extraction.

### 2026-04-20 (execution: staging migration completion + owner-remediation isolation)
- Focus: complete TB-V16-003 execution on staging target and isolate final blocker to owner-level remediation only.
- Files changed: `tracebud-backend/sql/tb_v16_003_geography_migration.sql`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: updated TB-V16-003 migration script to handle optional `plot_geometry_version` table existence safely (no hard failure when absent), executed migration successfully on staging pooler target, and verified core outcomes (`plot.geography` column present, backfill missing count `0`, `idx_plot_geography_gist` exists). Re-ran TB-V16-009 owner remediation and confirmed unchanged hard blocker (`42501 must be owner of table spatial_ref_sys`).
- Risks: low for completed migration lane; medium for final owner-remediation dependency since completion now requires privileged operator credentials/window.
- Blockers: owner-level privileges are still required to execute `tb_v16_009_postgis_owner_remediation_runbook.sql` against `spatial_ref_sys`.
- Next step: run TB-V16-009 in the same staging target with owner/superuser credentials, capture verification query outputs, then flip remaining scorecard lane(s) to 100.

### 2026-04-20 (execution: operator packet live-run checkpoint)
- Focus: execute the prepared external-window closeout packet and capture real blocker/error evidence for final-to-100 path.
- Files changed: `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: ran TB-V16-003 migration against reachable DB target and captured fail-fast blocker (`42P01 relation "plot_geometry_version" does not exist`); ran TB-V16-009 owner runbook and captured privilege blocker (`42501 must be owner of table spatial_ref_sys`); completed cooperative inbox verification command path with green dashboard tests (`31 files / 130 tests`).
- Risks: medium-high for external lanes; DB target/schema mismatch and owner privilege dependency now represent the sole hard blockers to literal overall 100%.
- Blockers: staging target does not currently expose expected `plot_geometry_version` relation for TB-V16-003 script; owner-level privileges are required for `spatial_ref_sys` remediation.
- Next step: run TB-V16-003 on the intended staging schema/database where plot-version tables exist, and hand TB-V16-009 to privileged DB owner/operator for execution in approved window.

### 2026-04-20 (execution: final external-window closeout packet prepared)
- Focus: prepare one operator-run packet to close remaining non-code scorecard lanes in a single controlled execution window.
- Files changed: `product-os/04-quality/remaining-lanes-final-execution-pack.md`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added strict run-order execution pack for TB-V16-003 staging migration + owner-level `spatial_ref_sys` remediation + cooperative inbox backend-only closeout checks, including preconditions, exact verification queries/commands, go/no-go gates, rollback criteria, and fill-once evidence template.
- Risks: medium; remaining completion still depends on privileged/staging window availability and coordinated operator execution quality.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`; staging execution window remains required for TB-V16-003 run evidence.
- Next step: execute this packet in approved staging/privileged windows, then immediately update scorecard/status logs from packet evidence block.

### 2026-04-20 (execution: in-repo CI/OpenAPI lane closeout to 100)
- Focus: finish remaining in-repo scorecard lanes to full completion for CI/test and OpenAPI contract depth.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added/normalized endpoint-level examples for audit diagnostics routes (`filing-activity`, `filing-activity/export`, `chat-threads`, `workflow-activity`, `dashboard-summary`), resolved lint-example schema warnings, re-validated `openapi:lint`, and confirmed ownership lane remains green (`11/11 suites`, `54/54 tests`).
- Risks: medium; overall scorecard completion still depends on external windows (staging migration execution + privileged PostGIS owner remediation) and cooperative inbox operational closure sequencing.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`; staging execution window remains required for TB-V16-003 parity run evidence.
- Next step: treat CI/OpenAPI lanes as maintenance-complete, then execute migration/infra windows and cooperative closeout steps to move the remaining non-100 lanes.

### 2026-04-20 (execution: ownership lane dashboard-summary API coverage expansion)
- Focus: complete authenticated diagnostics route-group parity by adding API-level coverage for dashboard summary behavior.
- Files changed: `tracebud-backend/src/audit/audit.dashboard-summary.api.int.spec.ts`, `tracebud-backend/package.json`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added HTTP integration coverage for `GET /v1/audit/gated-entry/dashboard-summary` (missing tenant claim `403`, tenant-scoped aggregate counters/readiness result, empty-tenant non-export-ready result) and included the suite in required `test:integration:ownership`.
- Risks: low; additive tests only, with expected CI runtime growth as required ownership lane depth increases.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: pivot CI/test lane effort from route-group parity expansion to maintenance mode (keep non-skipped evidence stable while prioritizing OpenAPI example-depth and migration prep lanes).

### 2026-04-20 (execution: ownership lane workflow-activity API coverage expansion)
- Focus: extend authenticated API-level diagnostics coverage to workflow telemetry route filtering behavior.
- Files changed: `tracebud-backend/src/audit/audit.workflow-activity.api.int.spec.ts`, `tracebud-backend/package.json`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added HTTP integration coverage for `GET /v1/audit/gated-entry/workflow-activity` (missing tenant claim `403`, tenant-scoped `phase=sla_warning`, tenant-scoped `slaState=breached`) and included the suite in required `test:integration:ownership`.
- Risks: low; additive test hardening only, with incremental CI duration increase.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: complete this authenticated diagnostics route-group parity push with API-level integration coverage for `GET /v1/audit/gated-entry/dashboard-summary`.

### 2026-04-20 (execution: ownership lane chat-thread API coverage expansion)
- Focus: extend authenticated API-level diagnostics coverage to chat-thread activity route behavior.
- Files changed: `tracebud-backend/src/audit/audit.chat-threads.api.int.spec.ts`, `tracebud-backend/package.json`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added HTTP integration coverage for `GET /v1/audit/gated-entry/chat-threads` (missing tenant claim `403`, tenant-scoped `phase=created` filtering, tenant-scoped `phase=resolved` filtering) and included the suite in required `test:integration:ownership`.
- Risks: low; additive tests only, with expected CI runtime increase as ownership lane depth grows.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: continue API-level authenticated coverage expansion for remaining audit diagnostics endpoints (`workflow-activity`, `dashboard-summary`) to complete route-group parity.

### 2026-04-20 (execution: ownership lane filing-activity API coverage expansion)
- Focus: expand authenticated API-level policy evidence to filing lifecycle diagnostics and export routes.
- Files changed: `tracebud-backend/src/audit/audit.filing-activity.api.int.spec.ts`, `tracebud-backend/package.json`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added HTTP integration coverage for `GET /v1/audit/gated-entry/filing-activity` and `GET /v1/audit/gated-entry/filing-activity/export` (missing tenant claim `403`, phase-filtered tenant-scoped reads, CSV export metadata/header/content checks) and included this suite in required `test:integration:ownership`.
- Risks: low; additive test hardening only, but ownership lane runtime grows with each added suite and should stay monitored for CI duration creep.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: continue authenticated API-level coverage expansion for remaining audit diagnostics routes (`chat-threads`, `workflow-activity`, `dashboard-summary`) to close week-1 parity target.

### 2026-04-20 (execution: ownership lane API coverage expansion for actors route)
- Focus: close another authenticated-route policy gap by adding API-level integration evidence for gated-entry actor resolution.
- Files changed: `tracebud-backend/src/audit/audit.gated-entry-actors.api.int.spec.ts`, `tracebud-backend/package.json`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: added dedicated HTTP integration coverage for `GET /v1/audit/gated-entry/actors` (missing tenant claim `403`, invalid/missing ids `400`, tenant-scoped actor resolution), and promoted this suite into required `test:integration:ownership`.
- Risks: low; slice is additive test hardening, but shared-schema integration suites remain sensitive to fixture-id collisions and require test-owned UUID discipline.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: continue ownership lane expansion with the next authenticated audit/export route not yet covered by API-level integration tests.

### 2026-04-20 (execution: remaining execution scorecard evidence advance)
- Focus: move execution scorecard lanes forward with fresh CI/test and OpenAPI governance evidence.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: fixed ownership-lane integration regressions (readiness warning payload expectation + unique package-id insertion in controller-scope test), re-ran ownership suites to green (`6/6`, `39/39`), and re-ran OpenAPI lint/governance/metrics trend checks to green.
- Risks: medium; OpenAPI example-depth and role/scope extension cleanup are still pending, and infra-window migration/remediation lanes remain schedule-coupled.
- Blockers: privileged owner-level remediation window remains required for `public.spatial_ref_sys`.
- Next step: use this green ownership baseline to extend one additional authenticated API-level integration slice and then execute the next OpenAPI example-depth pass.

### 2026-04-20 (execution: remaining execution scorecard checkpoint refresh)
- Focus: recalibrate recurring completion percentages and tighten near-term deliverables to reflect current execution state.
- Files changed: `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: updated baseline completion to `inbox 88%`, `CI 84%`, `OpenAPI 86%`, `P2 52%`, `TB-V16-003 20%`, `spatial_ref_sys remediation 65%`; refreshed week-1/week-2 targets and added explicit cycle checkpoint risk notes.
- Risks: medium; migration/remediation lanes remain infra-window dependent and can slip if privileged execution scheduling is delayed.
- Blockers: privileged owner-level remediation window is still required for `public.spatial_ref_sys`.
- Next step: run next checkpoint against CI ownership artifacts, OpenAPI governance trend/delta outputs, and staging migration prep evidence.

### 2026-04-20 (execution: P1 integration secret placement contract)
- Focus: eliminate ambiguity on where EUDR API keys must live before implementation starts.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented backend-only secret placement (`tracebud-backend/.env` or `.env.local`), dashboard non-secret boundary (`TRACEBUD_BACKEND_URL` only), production secret-manager requirement, and required env names (`EUDR_API_KEY`, `EUDR_API_VERSION`, `EUDR_BASE_URL`) with `NEXT_PUBLIC_*` prohibition.
- Risks: low; documentation-only clarification aligned to existing runtime env loading behavior.
- Blockers: `BLK-003` remains open pending final target/contract sign-off.
- Next step: add backend config consumption path for `EUDR_API_*` variables in implementation slice once endpoint contract is confirmed.

### 2026-04-20 (execution: P1 TRACES provisional lifecycle endpoint mapping)
- Focus: unblock endpoint-level planning by adding a provisional DDS lifecycle path mapping while preserving a strict verification gate.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: seeded provisional TRACES mapping (`POST/PUT/DELETE /eudr/dds` under `/api` base URL) and added mandatory Swagger confirmation step before implementation lock.
- Risks: medium; status/read endpoint and schema details are still unconfirmed until direct Swagger extraction succeeds.
- Blockers: `BLK-003` remains open; endpoint contract lock requires verified Swagger path/schema capture.
- Next step: export or screenshot endpoint list from Swagger UI and replace provisional markers with confirmed operation contracts.

### 2026-04-20 (execution: P1 integration target lock TRACES source hardening)
- Focus: replace draft TRACES assumptions with source-backed EUDR REST API quick-start contract fields so sign-off can proceed with fewer unknowns.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: updated auth and contract notes to use documented TRACES/EUDR REST headers (`x-api-key`, optional `x-api-eudr-version`, legacy bearer), fixed base URL (`https://www.eudr-api.eu`), added echo smoke endpoint, and captured documented quick-start response code semantics (`200/400/401/403/408/500`).
- Risks: low-medium; this is docs-driven hardening, but exact filing operation paths still need Swagger extraction and mapping to internal adapter endpoints.
- Blockers: `BLK-003` remains open pending owner sign-off and final endpoint-level mapping confirmation.
- Next step: extract filing lifecycle endpoints from Swagger (`/api-docs`) and finalize operation-level OpenAPI adapter mapping.

### 2026-04-20 (execution: P1 integration target lock draft prefill)
- Focus: reduce decision latency by pre-populating the integration target lock artifact with concrete first-pair proposals and draft contract assumptions.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: prefilled candidate and selected targets to `TRACES NT filing adapter` + `ERP outbound adapter` (proposed), with draft baseline for auth, endpoint normalization, idempotency/retry, tenant-safe access, failure handling, analytics evidence, and v1.6 architecture constraints.
- Risks: medium; provider URLs, exact auth variant, rate limits, and operation paths are still draft assumptions pending external docs and owner sign-off.
- Blockers: `BLK-003` remains open until Product/Engineering confirm or adjust proposed targets and approve final contract baseline.
- Next step: run a sign-off pass and convert draft placeholders (`TBD`, pending runbook link, provider-specific endpoint details) into approved values.

### 2026-04-20 (execution: P1 external integration target lock template)
- Focus: unblock FEAT-009 follow-on execution by standardizing a one-pass decision artifact for selecting the first 1-2 external API targets.
- Files changed: `product-os/04-quality/p1-integration-target-decision-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added a decision-ready template that forces provider/auth, endpoint/error contracts, idempotency/retry policy, tenant/role boundaries, state transitions, exception/recovery handling, analytics evidence coverage, and v1.6 architecture constraints before sign-off.
- Risks: low; this slice is documentation/process only and does not change runtime behavior.
- Blockers: `BLK-003` remains open until Product/Engineering complete the template and lock selected targets.
- Next step: run a 30-minute Product/Engineering decision pass using this template and update `product-os/06-status/blockers.md` with selected targets and status change.

### 2026-04-20 (execution: remaining execution recurring scorecard)
- Focus: create a standing weekly reference for remaining engineering themes with measurable completion percentages.
- Files changed: `product-os/06-status/remaining-execution-scorecard.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: track six recurring lanes (inbox/requests, CI-test depth, OpenAPI 32.8 hardening, P2 hardening bundle, TB-V16-003 staging migration, PostGIS owner remediation) with explicit baseline percentages and a two-week ROI-first plan.
- Risks: medium; percentages are directional and should be recalibrated weekly against CI evidence and migration outcomes.
- Blockers: external privileged infra window still required for `public.spatial_ref_sys` remediation.
- Next step: run first weekly checkpoint update against CI artifacts and OpenAPI warning deltas.

### 2026-04-18 (execution: FEAT-002 queue i18n root npm script aliases)
- Focus: run queue i18n smoke/verify/clean from monorepo root without changing directory.
- Files changed: `package.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: root scripts use `npm run <script> --prefix apps/offline-product`; generated files still land under offline app cwd (gitignored per slice 63).
- Risks: low; duplicate script names at root vs offline package are intentional pass-throughs.
- Blockers: none.
- Next step: none for queue i18n root aliases unless additional offline-only scripts need forwarding.

### 2026-04-18 (execution: FEAT-002 queue i18n gitignore local artifacts)
- Focus: keep git working trees quiet when developers run queue i18n verify or replay baseline steps locally.
- Files changed: `apps/offline-product/.gitignore`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: ignore explicit `queue-i18n-*` filenames under offline app root (aligned with clean script lists).
- Risks: low; if a future tracked file reused these exact names, it would be ignored (unlikely by convention).
- Blockers: none.
- Next step: none (slice 64 adds optional root `npm run i18n:queue:*` aliases for the same offline scripts).

### 2026-04-18 (execution: FEAT-002 queue i18n clean --all optional artifacts)
- Focus: allow one-shot removal of optional local CI-parity files (baseline/previous/zip) without widening default clean scope.
- Files changed: `apps/offline-product/scripts/i18n-queue-verify-clean.mjs`, `apps/offline-product/package.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `--all` deletes additional names only when present; added `i18n:queue:clean:all` and `i18n:queue:verify:clean:all`.
- Risks: low; `--all` is opt-in and only removes known filenames under `apps/offline-product` cwd.
- Blockers: none.
- Next step: superseded by slice 63 (gitignore for same artifact names).

### 2026-04-18 (execution: FEAT-002 queue i18n verify artifact clean)
- Focus: keep working trees tidy after local `i18n:queue:verify` without hand-deleting JSON; harden verify itself against shell redirect flakiness.
- Files changed: `apps/offline-product/scripts/i18n-queue-verify.mjs`, `apps/offline-product/scripts/i18n-queue-verify-clean.mjs`, `apps/offline-product/package.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `i18n:queue:verify` now runs `i18n-queue-verify.mjs` (Node orchestration, no `>` redirect); `i18n:queue:clean` removes `queue-i18n-smoke-summary.json` and `queue-i18n-report.json`; `i18n:queue:verify:clean` runs verify then clean.
- Risks: low; does not delete optional local CI-parity files (`queue-i18n-baseline-metadata.json`, `*-previous.json`) to avoid surprising devs replaying baseline fetches.
- Blockers: none.
- Next step: superseded by slice 62 (`--all` + `clean:all` / `verify:clean:all`).

### 2026-04-18 (execution: FEAT-002 queue i18n single verify npm script)
- Focus: reduce operator friction when running the full queue i18n local gate chain before push.
- Files changed: `apps/offline-product/package.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `npm run i18n:queue:verify` chaining smoke, summary generation, summary/baseline/report asserts in documented order; does not replace CI baseline zip fetch (local has no previous artifact unless supplied manually).
- Risks: low; leaves `queue-i18n-smoke-summary.json` / `queue-i18n-report.json` in cwd like manual commands.
- Blockers: none.
- Next step: superseded by slice 61 (`i18n:queue:clean` / `i18n:queue:verify:clean`).

### 2026-04-18 (execution: FEAT-002 queue i18n ACTIONS_STEP_DEBUG env wiring)
- Focus: make slice 58 zip-listing diagnostics reachable from bash by forwarding the repository secret GitHub documents for step debug.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `Fetch previous queue i18n smoke summary artifact` step `env` now includes `ACTIONS_STEP_DEBUG: ${{ secrets.ACTIONS_STEP_DEBUG }}`; FEAT-002 notes operator should use literal string `true` and clear when done.
- Risks: low; empty secret preserves prior no-op behavior.
- Blockers: none.
- Next step: none for this lane unless queue i18n governance scope expands again.

### 2026-04-18 (execution: FEAT-002 queue i18n baseline zip debug listing)
- Focus: give operators a one-shot artifact layout view when baseline zip extraction misses expected paths, without noisy default CI logs.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: if smoke summary or report extraction fails, set `QUEUE_I18N_EXTRACT_FAIL=1`; when `ACTIONS_STEP_DEBUG=true`, print `unzip -l` for `queue-i18n-smoke-previous.zip` inside a log group once per step.
- Risks: low; no behavior change unless step debug is on and extraction already failed.
- Blockers: none.
- Next step: superseded by slice 59 (FEAT-002 operator note + `env` wiring for `ACTIONS_STEP_DEBUG`).

### 2026-04-18 (execution: FEAT-002 queue i18n previous smoke summary zip path parity)
- Focus: align previous-run smoke summary extraction with artifact path layout (`apps/offline-product/...` vs root) so key-count deltas stay reliable.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: unzip tries `apps/offline-product/queue-i18n-smoke-summary.json` first, then root `queue-i18n-smoke-summary.json`; on total miss, remove partial file and warn (same pattern as report extraction).
- Risks: low; improves compatibility with upload-artifact path preservation.
- Blockers: none.
- Next step: superseded by slice 58 (`ACTIONS_STEP_DEBUG` zip listing on extraction miss).

### 2026-04-18 (execution: FEAT-002 queue i18n previous-run schema digest drift)
- Focus: surface schema contract evolution across CI runs by diffing primary digest tokens when the previous artifact includes a combined report.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: CI baseline zip step extracts optional `queue-i18n-report-previous.json`; report `schemaVersion` `2` adds comparison drift fields; assertion enforces null-iff rules for digest drift vs previous ref.
- Risks: low; first run or legacy artifacts without embedded report yield `n/a` drift fields only.
- Blockers: none.
- Next step: superseded by slice 57 (smoke summary path prefix fallback).

### 2026-04-18 (execution: FEAT-002 queue i18n primary provenance key)
- Focus: align downstream consumer guidance with a single primary contract pin while keeping raw hex for compatibility.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: JSON Schema digest fields now carry descriptions (primary vs compatibility); CI summary lists `schemaDigestRef` first with explicit consumer note; assertion validates digest ref parity before raw hex parity.
- Risks: low; field set unchanged, ordering and documentation only.
- Blockers: none.
- Next step: optionally add optional `previousSchemaDigestRef` comparison when previous artifact includes `queue-i18n-report.json` for schema drift deltas across runs.

### 2026-04-18 (execution: FEAT-002 queue i18n compact digest reference token)
- Focus: simplify contract provenance handoff by shipping a single digest token field that encodes algorithm + digest in one value.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added required `schemaDigestRef` field with regex `^sha256:[a-f0-9]{64}$`; generator now emits `schemaDigestRef`; assertion enforces both format and computed parity (`sha256:<expectedDigest>`); CI summary now includes digest ref line.
- Risks: low; digest ref is deterministic composition of already-validated digest fields.
- Blockers: none.
- Next step: optionally expose `schemaDigestRef` as the primary provenance key in downstream trend/baseline consumers and keep `schemaSha256` as compatibility field.

### 2026-04-18 (execution: FEAT-002 queue i18n digest algorithm metadata)
- Focus: make schema fingerprint semantics explicit for machine consumers by encoding digest algorithm in the combined report contract.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added required `schemaDigestAlgorithm` field with schema const `sha256`; generator now emits `schemaDigestAlgorithm: "sha256"`; assertion enforces algorithm equality; CI summary now includes digest algorithm line.
- Risks: low; algorithm value is fixed and backward-compatible with current SHA-256 digest path.
- Blockers: none.
- Next step: optionally emit the schema digest algorithm + hash pair as a compact provenance token in summary/report (`sha256:<digest>`).

### 2026-04-18 (execution: FEAT-002 queue i18n digest format guard)
- Focus: tighten payload hygiene for schema fingerprint provenance by rejecting malformed digest strings early.
- Files changed: `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: assertion now requires `schemaSha256` to match lowercase 64-hex regex (`^[a-f0-9]{64}$`) before schema-file digest parity check.
- Risks: very low; generated digest is already canonical lowercase hex from Node crypto and passes unchanged.
- Blockers: none.
- Next step: optionally encode digest algorithm id (`sha256`) in report for future multi-algorithm contract evolution.

### 2026-04-18 (execution: FEAT-002 queue i18n schema fingerprint provenance)
- Focus: strengthen machine/audit provenance for combined queue i18n report consumers by pinning payload to schema digest.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added required report field `schemaSha256` (64-char SHA-256 hex); generator computes digest from schema file; assertion now recomputes and enforces digest match; CI summary now includes schema digest.
- Risks: low; digest calculation uses local schema file bytes and is deterministic for a given schema revision.
- Blockers: none.
- Next step: optionally add explicit digest format regex guard (`^[a-f0-9]{64}$`) in assertion for stricter payload hygiene.

### 2026-04-18 (execution: FEAT-002 queue i18n report schema co-packaging)
- Focus: make queue i18n artifact consumers self-sufficient by shipping the combined report payload and its exact schema contract together.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: app CI artifact now uploads `docs/openapi/queue-i18n-report.schema.json` together with queue i18n JSON payloads; added pre-upload guard (`test -f ../../docs/openapi/queue-i18n-report.schema.json`); summary now cites schema file path explicitly.
- Risks: low; changes are additive and preserve existing payload contracts while tightening publish-time safety.
- Blockers: none.
- Next step: optionally include schema fingerprint (`sha256`) in the summary block and combined report for immutable contract provenance.

### 2026-04-18 (execution: FEAT-002 queue i18n combined report schema gate)
- Focus: publish one stable queue i18n artifact contract (`summary + baseline + comparison`) for simpler downstream CI/report consumers.
- Files changed: `docs/openapi/queue-i18n-report.schema.json`, `apps/offline-product/scripts/i18n-queue-report-generate.mjs`, `apps/offline-product/scripts/i18n-queue-report-assert.mjs`, `apps/offline-product/package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `queue-i18n-report.json` generator; added schema-backed assertion gate; CI summary now reads combined report; artifact upload now includes combined report file.
- Risks: low; report is additive and generated from existing validated summary/baseline payloads.
- Blockers: none.
- Next step: optionally publish the combined report schema alongside the artifact bundle for direct consumer pinning.

### 2026-04-18 (execution: FEAT-002 queue baseline schema file + standalone assertion gate)
- Focus: align queue baseline metadata governance with schema-file + assertion-gate pattern used in broader OpenAPI governance lanes.
- Files changed: `docs/openapi/queue-i18n-baseline-metadata.schema.json`, `apps/offline-product/scripts/i18n-queue-baseline-schema-assert.mjs`, `apps/offline-product/package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added baseline metadata schema file; added `i18n:queue:baseline:schema:assert` command; app CI lane now runs this assertion after summary contract assert.
- Risks: low; assertion is fail-soft when baseline metadata file is absent and strict when present.
- Blockers: none.
- Next step: optionally add a single combined report JSON containing both summary and baseline sections to simplify future consumers.

### 2026-04-18 (execution: FEAT-002 queue i18n baseline schema version contract)
- Focus: add explicit versioning to baseline metadata payload and enforce it in queue artifact contract checks.
- Files changed: `.github/workflows/ci.yml`, `apps/offline-product/scripts/i18n-queue-summary-assert.mjs`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: baseline selector now emits `schemaVersion: "1"` in metadata JSON; assertion now requires non-empty baseline `schemaVersion`; queue summary now reports baseline metadata schema version.
- Risks: low; schema version is additive and backward-safe for fresh runs; old baseline artifacts without version remain non-selected until refreshed.
- Blockers: none.
- Next step: optionally add baseline metadata schema file + standalone schema assert script for consistency with other governance artifact contracts.

### 2026-04-18 (execution: FEAT-002 queue i18n artifact JSON contract assertion)
- Focus: enforce stable machine-readable contracts for queue i18n summary and optional baseline metadata payloads.
- Files changed: `apps/offline-product/scripts/i18n-queue-summary-assert.mjs`, `apps/offline-product/package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `i18n:queue:summary:assert` script; CI app lane now executes assertion after baseline fetch; local verification command passes for summary-only scenario.
- Risks: low; assertion is strict on required summary fields and optional-baseline shape only when file exists.
- Blockers: none.
- Next step: optionally add schema-version field into baseline metadata payload and assert it for explicit contract evolution support.

### 2026-04-18 (execution: FEAT-002 queue i18n baseline metadata artifact bundling)
- Focus: keep current queue i18n smoke snapshot and selected baseline provenance in one artifact bundle.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `offline-app-queue-i18n-smoke-summary` artifact now uploads both `queue-i18n-smoke-summary.json` and `queue-i18n-baseline-metadata.json`.
- Risks: baseline metadata file may be absent on fresh/no-baseline runs; artifact upload remains tolerant and still provides current summary JSON.
- Blockers: none.
- Next step: optionally add artifact schema assertion for baseline metadata JSON shape.

### 2026-04-18 (execution: FEAT-002 queue i18n baseline provenance summary fields)
- Focus: make previous-run delta provenance explicit in CI summary output.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: baseline fetch now writes `queue-i18n-baseline-metadata.json` with selected artifact/run/workflow metadata; summary now includes baseline run id, workflow path, and workflow name fields.
- Risks: minimal; provenance metadata is informational and uses already-fetched run details.
- Blockers: none.
- Next step: optionally upload baseline metadata JSON alongside current summary artifact for complete evidence packaging.

### 2026-04-18 (execution: FEAT-002 queue i18n workflow-source baseline filter)
- Focus: reduce baseline noise by constraining previous-run queue i18n artifacts to comparable workflow sources.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: baseline selector now checks current workflow path from `GITHUB_WORKFLOW_REF` and requires candidate run path match, with workflow-name fallback (`GITHUB_WORKFLOW`) when path metadata is unavailable.
- Risks: stricter filtering can reduce baseline availability on heavily refactored workflow histories; summary still falls back safely to `n/a`.
- Blockers: none.
- Next step: optionally expose selected baseline run id/workflow path directly in queue i18n summary block for explicit provenance.

### 2026-04-18 (execution: FEAT-002 queue i18n successful-baseline filter)
- Focus: improve previous-run delta reliability by requiring successful source runs for baseline artifacts.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: baseline selector now inspects candidate run details via GitHub Actions Runs API and keeps only `conclusion=success` artifacts before choosing previous queue i18n summary.
- Risks: extra API calls in baseline lookup step; failures are fail-soft and continue scanning older candidates.
- Blockers: none.
- Next step: optionally align workflow-path/workflow-name filtering with governance trend lane to further reduce cross-workflow baseline noise.

### 2026-04-18 (execution: FEAT-002 queue i18n previous-run delta summary)
- Focus: surface run-to-run queue localization smoke drift directly in CI summary.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: app CI lane now fetches prior `offline-app-queue-i18n-smoke-summary` artifact (branch-aware, non-expired) and summary now reports previous availability, required-key delta, and previous smoke version.
- Risks: API artifact lookup may return no baseline on new branches or artifact retention expiry; summary gracefully reports `n/a` deltas.
- Blockers: none.
- Next step: optionally filter baseline candidates to successful runs only for tighter delta provenance parity with governance trend lane.

### 2026-04-18 (execution: FEAT-002 queue i18n summary artifact upload)
- Focus: preserve machine-readable queue i18n smoke metadata per CI run for longitudinal comparison.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Expo app CI lane now uploads `offline-app-queue-i18n-smoke-summary` artifact from `apps/offline-product/queue-i18n-smoke-summary.json` after summary generation.
- Risks: minimal; artifact upload is append-only evidence and does not affect gate pass/fail behavior.
- Blockers: none.
- Next step: optionally add historical comparison step that reads previous artifact and reports key-count deltas in summary.

### 2026-04-18 (execution: FEAT-002 queue i18n smoke metadata in CI summary)
- Focus: make localization-smoke scope drift auditable by exposing smoke version and required key count in CI summary.
- Files changed: `apps/offline-product/scripts/i18n-queue-panel.smoke.mjs`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: smoke script now supports `--summary-json`; CI summary step parses metadata and appends `Smoke version` + `Required key count`; local PASS output now includes version marker (`v1`).
- Risks: minimal; summary metadata is derived from same smoke script used for gate execution.
- Blockers: none.
- Next step: optionally upload the summary JSON as a tiny artifact for longitudinal diffing across runs.

### 2026-04-18 (execution: FEAT-002 queue i18n smoke CI summary)
- Focus: improve CI reviewer ergonomics by surfacing queue i18n smoke execution status in workflow summary.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: app CI lane now writes `Offline App Queue i18n Smoke` summary section with command and PASS status after smoke step.
- Risks: minimal; summary step is informational and runs only after gate success.
- Blockers: none.
- Next step: optionally include smoke script version/key-count in summary for quicker drift audits.

### 2026-04-18 (execution: FEAT-002 queue i18n smoke CI wiring)
- Focus: enforce queue localization parity in CI rather than relying only on local smoke execution.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Expo app CI job now runs `npm run i18n:queue:smoke` immediately after lint in `apps/offline-product`.
- Risks: minor CI duration increase; gate remains lightweight and deterministic.
- Blockers: none.
- Next step: optionally add CI step-summary line for queue i18n smoke status in app lane.

### 2026-04-18 (execution: FEAT-002 queue i18n smoke test guard)
- Focus: add a lightweight regression guard to keep EN/ES queue settings localization keys in parity.
- Files changed: `apps/offline-product/scripts/i18n-queue-panel.smoke.mjs`, `apps/offline-product/package.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `i18n:queue:smoke` npm script and locale-key smoke validator for required queue panel keys across `en` and `es`; verified locally with PASS output.
- Risks: low; script is read-only and fails fast on missing keys.
- Blockers: none.
- Next step: wire `apps/offline-product` smoke command into CI lane once offline app quality gate sequencing is finalized.

### 2026-04-18 (execution: FEAT-002 queue panel full i18n parity)
- Focus: complete EN/ES localization coverage for remaining queue settings helper labels and status summaries.
- Files changed: `apps/offline-product/features/state/LanguageContext.tsx`, `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: moved retry filter, attempt scope, smart-sweep pass, cap warning, queue-health summary, and queue control labels to translation keys; wired settings queue panel to use `t(...)` for these strings.
- Risks: minimal; key fallback behavior remains intact if future locales are incomplete.
- Blockers: none.
- Next step: optionally add a tiny localization smoke test for key queue labels in both EN/ES to prevent accidental regressions.

### 2026-04-18 (execution: FEAT-002 reset confirmation i18n parity)
- Focus: align queue reset confirmation feedback with EN/ES localization standards.
- Files changed: `apps/offline-product/features/state/LanguageContext.tsx`, `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `sync_queue_preferences_reset` key to EN/ES translation maps; settings reset action now uses `t('sync_queue_preferences_reset')` instead of hardcoded text.
- Risks: minimal; translation fallback still resolves to English/key if future locale entries are missing.
- Blockers: none.
- Next step: migrate remaining hardcoded queue-panel helper strings (`Retry filter`, `Attempt scope`, smart-sweep labels) into translation keys for full localization parity.

### 2026-04-18 (execution: FEAT-002 retry reset confirmation feedback)
- Focus: provide immediate user acknowledgment after retry preference reset.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: reset action now sets sync status message to `Queue retry preferences reset to defaults.` immediately after applying local state and persisted key resets.
- Risks: minimal; message reuses existing sync status area and does not affect sync execution.
- Blockers: none.
- Next step: optionally add i18n key coverage for reset confirmation string to keep parity with broader translation surface.

### 2026-04-18 (execution: FEAT-002 retry preference reset action)
- Focus: provide a fast fallback path to default queue-retry behavior when operators inherit stale or over-tuned retry settings.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Reset preferences` control in queue panel; reset restores defaults (`attemptScope=all`, smart sweep off, cap=100) and writes those defaults to local settings keys immediately.
- Risks: low; reset is explicit user action and only affects local retry preferences.
- Blockers: none.
- Next step: add optional confirmation toast/snackbar after reset so operators get immediate UX acknowledgment.

### 2026-04-18 (execution: FEAT-002 smart-retry preference persistence)
- Focus: reduce repetitive setup work by persisting queue retry preferences across app sessions.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: persisted `syncQueueAttemptScope`, `syncQueueSmartSweepEnabled`, and `syncQueueSmartSweepCap` via local settings storage; re-hydrated values on settings focus with safe defaults when absent/invalid.
- Risks: stale local settings values may survive longer than expected in shared/test devices; defaults remain safe and editable in UI.
- Blockers: none.
- Next step: add a single `Reset queue retry preferences` action for quick return to default profile.

### 2026-04-18 (execution: FEAT-002 smart sweep cap guardrails)
- Focus: prevent oversized smart-retry runs by adding per-run queue caps and remaining-budget pass sequencing.
- Files changed: `apps/offline-product/features/sync/processPendingSyncQueue.ts`, `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added optional `maxActions` queue processor parameter; smart sweep UI now exposes `Cap 25/50/100/200`; pass 2 executes only with remaining cap budget and emits skip feedback when pass 1 consumes full cap.
- Risks: capped runs may require multiple sync attempts to clear very large queues; behavior remains explicit and deterministic.
- Blockers: none.
- Next step: persist smart sweep cap and mode preferences in local settings so operator defaults survive app restarts.

### 2026-04-18 (execution: FEAT-002 smart retry sweep mode)
- Focus: reduce repeated operator sync actions by running retrying and first-attempt queue passes in one guided sweep.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Smart sweep` control in settings queue panel; smart mode executes pass `1/2` (`retrying_only`) then pass `2/2` (`first_attempt_only`), with explicit pass labels in sync status feedback.
- Risks: smart sweep increases single-run sync duration on large queues; sequencing remains deterministic and non-destructive.
- Blockers: none.
- Next step: add optional cap/guardrail for smart sweep total processed items per run to avoid long-running retries on very large queues.

### 2026-04-18 (execution: FEAT-002 retry attempt-scope presets)
- Focus: reduce tap-heavy retry workflows by adding queue retry presets for attempt scope (`all`, `retrying only`, `first-attempt only`).
- Files changed: `apps/offline-product/features/sync/processPendingSyncQueue.ts`, `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: queue processor now supports `attemptScope`; settings queue health panel now renders preset chips for attempt scope and sync feedback now includes both action and attempt filter context.
- Risks: narrow presets can delay processing of excluded queue rows if operators repeatedly run targeted sweeps; excluded rows remain visible and queued.
- Blockers: none.
- Next step: add one-tap “smart retry” mode that prioritizes retrying rows first, then first-attempt rows if bandwidth remains.

### 2026-04-18 (execution: FEAT-002 per-action queue count chips)
- Focus: improve selective retry planning by exposing pending queue distribution per action type directly in settings.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `queueCountByActionType` state derived from pending queue rows and rendered counts on filter chips (`Harvest (n)`, `Photos (n)`, `Evidence (n)`).
- Risks: minimal; count display is read-only and sourced from existing local queue rows.
- Blockers: none.
- Next step: add quick-select presets (for example `All`, `Only failed/retrying`) to reduce tap count in field operations.

### 2026-04-18 (execution: FEAT-002 selective queue retry filters)
- Focus: improve offline recovery control by allowing operators to retry only selected pending sync action types.
- Files changed: `apps/offline-product/features/sync/processPendingSyncQueue.ts`, `apps/offline-product/app/(tabs)/settings.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: queue processor now supports optional `actionTypes` scope; settings sync status now exposes filter chips for `Harvest`, `Photos`, and `Evidence`; sync status feedback now includes retry-filter context.
- Risks: operators may temporarily skip some pending action classes by filter choice; skipped items remain queued and visible for later retries.
- Blockers: none.
- Next step: add per-action pending counts on filter chips to improve selective retry planning in poor-connectivity windows.

### 2026-04-18 (execution: FEAT-002 offline queue retry observability + telemetry)
- Focus: reduce offline sync ambiguity by surfacing queue retry health in-app and emitting explicit local telemetry for queue action outcomes.
- Files changed: `apps/offline-product/app/(tabs)/settings.tsx`, `apps/offline-product/features/sync/processPendingSyncQueue.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added sync queue health block in Settings (`pending`, `retrying`, `highest attempts`, latest queue error + action type); added local audit events `sync_queue_action_succeeded`, `sync_queue_action_failed`, and `sync_queue_action_dropped_invalid` with explicit drop-reason payloads.
- Risks: local telemetry volume increases during unstable connectivity; events remain local best-effort and non-blocking.
- Blockers: none.
- Next step: add per-action retry filter view in settings so operators can retry only a selected queue action type when bandwidth is constrained.

### 2026-04-16 (execution: FEAT-003 run-decision action + auto-refresh wiring)
- Focus: complete operator write-path loop in plot detail so users can run cutoff-date deforestation decisions and immediately inspect refreshed immutable decision evidence.
- Files changed: `apps/dashboard-product/app/api/plots/[id]/deforestation-decision/route.ts`, `apps/dashboard-product/app/api/plots/[id]/deforestation-decision/route.test.ts`, `apps/dashboard-product/lib/use-plot-deforestation-decision-history.ts`, `apps/dashboard-product/lib/use-plot-deforestation-decision-history.test.tsx`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added decision POST proxy route and panel controls (`cutoffDate`, run button, inline success/error feedback); hook now exposes `runDecision` and auto-refreshes history after successful write.
- Risks: write-path outcome still depends on backend role/policy enforcement and upstream provider availability; UI now surfaces these errors explicitly.
- Blockers: none.
- Next step: optionally add retry action + last-run metadata chip for faster repeat investigations.

### 2026-04-16 (execution: FEAT-008 spaced-header alias interoperability)
- Focus: finish CSV parser interoperability hardening by accepting common spaced/hyphenated header variants from spreadsheet exports.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: parser now normalizes spaced/hyphenated headers into canonical form before alias mapping; integration test now covers spaced-header import path with expected alias-warning display.
- Risks: low; normalization is deterministic and alias transformations remain explicitly visible to operators.
- Blockers: none.
- Next step: consider additional alias variants (`producer id`, `organization name`) if customer CSV samples reveal repeat patterns.

### 2026-04-16 (execution: FEAT-008 extended alias map for external CSV variants)
- Focus: improve import interoperability with external CRM exports by accepting common non-canonical header forms while preserving explicit alias visibility.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added alias mappings `email_address->email`, `farmerid->farmer_id`, `plotid->plot_id`; extended test coverage for multi-alias parse flow and warning badge assertions.
- Risks: minimal; alias handling remains explicit and user-visible through warning text before campaign submission.
- Blockers: none.
- Next step: optionally support spaced header variants (e.g., `full name`, `farmer id`, `plot id`) with same warning semantics.

### 2026-04-16 (execution: FEAT-008 CSV alias compatibility + warning badge)
- Focus: improve interoperability with external CRM CSV exports by accepting common header aliases while preserving operator visibility of transformed fields.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added parser alias mapping `name -> full_name`, persisted alias usage state, and rendered alias-warning badge in parser UI; added integration test for alias parse + warning rendering.
- Risks: low; alias mapping is explicit and surfaced to users to avoid silent schema assumptions.
- Blockers: none.
- Next step: expand alias map for additional common headers (`email_address`, `farmerid`, `plotid`) behind the same visible-warning pattern.

### 2026-04-16 (execution: FEAT-008 paste-sample quick-fill helper)
- Focus: accelerate first-run and demo workflows by allowing one-click sample CSV insertion with immediate parse feedback.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Paste sample CSV` action in bulk-import controls; helper fills textarea with canonical template and immediately computes parsed targets + summary.
- Risks: no runtime risk introduced; helper reuses existing parser/validation path.
- Blockers: none.
- Next step: add optional column-hint tooltip with accepted aliases (`full_name` vs `name`) if needed for interoperability imports.

### 2026-04-16 (execution: FEAT-008 downloadable CSV template helper)
- Focus: reduce first-time bulk-import formatting errors by giving operators an in-context downloadable CSV template.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Download CSV template` button that emits a sample file with required headers/rows and verified blob-download trigger behavior in integration tests.
- Risks: no runtime risk introduced; helper is client-side only and does not alter API payload semantics.
- Blockers: none.
- Next step: add optional inline “paste sample” quick-fill action for demo/training sessions.

### 2026-04-16 (execution: FEAT-008 parse summary visibility for malformed-row review)
- Focus: improve operator confidence during bulk import by surfacing explicit valid/invalid exclusion counts before submit.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added parse summary line (`valid / invalid excluded`) and duplicate-skip detail in bulk-target parser UI; extended malformed-row integration test to assert summary rendering.
- Risks: none added; this is UX observability hardening for existing validation behavior.
- Blockers: none.
- Next step: add explicit CSV template download helper to reduce formatting errors in first-time imports.

### 2026-04-16 (execution: FEAT-008 malformed-row exclusion contract test)
- Focus: prevent invalid contacts from leaking into bulk campaign payloads by locking malformed-row exclusion in submit-path tests.
- Files changed: `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added negative test asserting row-level diagnostics for invalid/missing CSV rows and verifying outbound `targets[]` includes only valid contacts.
- Risks: no new runtime risk introduced; this slice reduces accidental invalid-recipient dispatch risk.
- Blockers: none.
- Next step: add UI summary badge for `invalid rows excluded` count during parse so operators can quickly confirm exclusion totals before submit.

### 2026-04-16 (execution: FEAT-008 request payload contract-lock test)
- Focus: prevent silent request contract regressions in bulk-target campaign creation by asserting exact outbound body/header mapping.
- Files changed: `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added submit-test assertions for endpoint path, `Content-Type`, generated `X-Idempotency-Key`, and full `targets[]` payload field mapping (`full_name`, `organization`, `farmer_id`, `plot_id`).
- Risks: no new runtime risk introduced; this slice improves detection of UI/API schema drift before release.
- Blockers: none.
- Next step: add one contract-negative test ensuring malformed CSV rows are excluded from outbound `targets[]` payload during submit.

### 2026-04-16 (execution: FEAT-008 request draft submit response-state tests)
- Focus: harden bulk-target request creation UX by proving operator-visible success/failure outcomes after submit.
- Files changed: `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added test coverage for successful draft creation banner and backend error banner path, preserving parse-and-enable precondition flow in the same suite.
- Risks: no new product risk introduced; runtime success still depends on backend role/policy/env configuration.
- Blockers: none.
- Next step: add contract-level assertion for `targets[]` payload shape in page submit test to lock request body field mapping.

### 2026-04-16 (execution: FEAT-008 request campaign API wiring for bulk targets)
- Focus: move request bulk-import flow from UI-only draft prep to real campaign creation call path with explicit async feedback.
- Files changed: `apps/dashboard-product/app/api/requests/campaigns/route.ts`, `apps/dashboard-product/app/api/requests/campaigns/route.test.ts`, `apps/dashboard-product/app/requests/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added proxy route forwarding to backend `/v1/requests/campaigns` with auth + `X-Idempotency-Key`; wired page create action to submit parsed targets contract and surface `Creating`/success/error status to operators.
- Risks: backend request campaign endpoint availability/role enforcement still governs end-to-end success at runtime; UI now surfaces upstream errors instead of silent failure.
- Blockers: none in UI/proxy scope.
- Next step: add end-to-end test covering successful draft submission state transition in requests page with mocked API response.

### 2026-04-16 (execution: FEAT-008 request bulk-contact import UX baseline)
- Focus: enable operator-friendly bulk contact import for request campaigns so users can parse targets and prepare outbound requests in one flow.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added CSV upload/paste parser requiring `email` + `full_name`, row-level validation messages, email deduplication, parsed-target preview, and draft create gating on non-empty parsed target list.
- Risks: current requests surface remains frontend-mocked for persistence/sending; targets are now structured for backend handoff but not yet posted to live campaign endpoint in this UI route.
- Blockers: no blocker for UX baseline; backend campaign creation integration in this page remains a subsequent slice.
- Next step: wire parsed targets into real request-campaign API call (`POST /v1/requests/campaigns`) with idempotency key + optimistic UI response handling.

### 2026-04-16 (execution: FEAT-003 decision-history dashboard visibility + DB proof)
- Focus: make historical deforestation decisions operationally visible in plot detail and prove persisted retrieval path with DB-backed API integration coverage.
- Files changed: `apps/dashboard-product/app/api/plots/[id]/deforestation-decision-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/deforestation-decision-history/route.test.ts`, `apps/dashboard-product/lib/use-plot-deforestation-decision-history.ts`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.tsx`, `tracebud-backend/src/plots/sync-envelope.api.int.spec.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added dashboard proxy/hook/panel for immutable `plot_deforestation_decision_recorded` evidence visibility, and added DB-backed integration assertion for `GET /v1/plots/{id}/deforestation-decision-history` retrieval semantics.
- Risks: decision panel currently renders backend event naming as-is (no additional dashboard-level filters yet); future UX slices may add verdict/date filters and export controls.
- Blockers: none for this slice.
- Next step: add dashboard-triggered decision run action (`cutoffDate` input -> POST decision endpoint) and expose decision-history export/read surface in admin diagnostics.

### 2026-04-16 (execution: FEAT-003 deforestation decision history read surface)
- Focus: expose immutable deforestation decision evidence retrieval so operators can review cutoff-date verdict history directly by plot.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/plots/{id}/deforestation-decision-history` querying `plot_deforestation_decision_recorded` events (latest first, capped) and published read contract in OpenAPI; added controller test for forwarding behavior.
- Risks: history endpoint currently mirrors raw audit row naming (`user_id`, `event_type`) and is not yet dashboard-wired; UI consumption contract normalization can be added in next slice.
- Blockers: none for backend read surface; dashboard integration remains pending.
- Next step: wire dashboard plot detail compliance panel to consume decision-history endpoint and add DB-backed integration coverage for persisted event retrieval.

### 2026-04-16 (execution: FEAT-003 historical deforestation decision baseline)
- Focus: establish a deterministic, auditable historical deforestation decision contract for plot polygons using cutoff-date evaluation semantics.
- Files changed: `tracebud-backend/src/compliance/gfw.service.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/plots/{id}/deforestation-decision?cutoffDate=YYYY-MM-DD` (agent/exporter only); introduced explicit verdicts (`no_deforestation_detected|possible_deforestation_detected|unknown`); persisted immutable `plot_deforestation_decision_recorded` telemetry with provider mode and normalized alert summary.
- Risks: verdict remains alert-signal based and depends on configured provider SQL template for strict date-field semantics; legal-grade adjudication still requires policy/legal gate alignment.
- Blockers: none for this contract slice; downstream calibration/threshold policy and legal sign-off remain external.
- Next step: add DB-backed integration coverage for the new decision event and wire dashboard evidence read-surface for decision history alongside existing compliance history.

### 2026-04-16 (execution: P0-02 dispatch reset to not-sent)
- Focus: align legal-gate tracking with real-world state after confirming no external counsel is currently appointed.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: reverted tracker from `sent_assumed` to `not_sent`, restored blank dispatch placeholders, and updated current focus to reflect counsel onboarding as prerequisite.
- Risks: P0-02 remains blocked until counsel onboarding + signed memo; no additional technical risk introduced.
- Blockers: External counsel not yet appointed.
- Next step: appoint counsel, fill/send `product-os/04-quality/p0-02-send-packet.md`, then start dispatch tracking with real metadata.

### 2026-04-16 (execution: P0-02 assumed-dispatch overwrite checklist)
- Focus: ensure provisional dispatch metadata can be replaced with confirmed values quickly and safely.
- Files changed: `product-os/04-quality/p0-02-assumed-dispatch-overwrite-checklist.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added explicit overwrite flow (`sent_assumed -> sent`) with target files, required confirmed inputs, and no-`assumed:*` validation gate.
- Risks: no new risk introduced; closeout evidence still depends on receiving confirmed dispatch metadata and signed counsel memo.
- Blockers: Confirmed dispatch metadata still pending.
- Next step: provide real dispatch metadata and execute overwrite checklist in one pass.

### 2026-04-16 (execution: P0-02 assumed dispatch logging)
- Focus: advance P0-02 operational state with explicit placeholder dispatch metadata so follow-up workflow can proceed while real send details are pending.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: moved tracker to `sent_assumed`, populated assumed recipient/timestamp/expected-response placeholders, and seeded next follow-up date with clear `assumed` markers for later overwrite.
- Risks: metadata is not yet authoritative; this state must be replaced with real dispatch details before legal gate closeout evidence is finalized.
- Blockers: Confirmed dispatch metadata still pending.
- Next step: replace assumed values with actual recipient/sent timestamp/expected date/thread reference, then continue memo follow-up cadence.

### 2026-04-16 (execution: P0-02 final send packet)
- Focus: provide a single-file dispatch packet so counsel outreach and immediate post-send logging can be executed from one artifact.
- Files changed: `product-os/04-quality/p0-02-send-packet.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added fill-once send packet with subject/body/source pack/output contract and post-send tracker payload; linked status focus to this final packet as primary send artifact.
- Risks: no new technical risk introduced; legal completion remains external to repo until signed memo is received.
- Blockers: Signed counsel memo pending.
- Next step: fill/send `p0-02-send-packet.md`, then record dispatch metadata in tracker and status logs.

### 2026-04-16 (execution: P0-02 readiness index)
- Focus: consolidate P0-02 gate state and all prepared legal artifacts into a single operator-facing index for fast execution continuity.
- Files changed: `product-os/04-quality/p0-02-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added one-page readiness index with current gate status, ordered artifact chain, immediate next action, and explicit close-definition criteria.
- Risks: no new risk introduced; external legal dependency remains the only blocker.
- Blockers: Signed counsel memo pending.
- Next step: execute outbound dispatch and transition tracker to `sent` with expected response date.

### 2026-04-16 (execution: P0-02 counsel dispatch example)
- Focus: provide a nearly filled outbound legal request example to minimize send-time edits and reduce dispatch friction.
- Files changed: `product-os/04-quality/p0-02-counsel-dispatch-example.md`, `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added copy-edit/send template (subject/body) and paired dispatch metadata block for immediate tracker entry; linked checklist optional fast path to example.
- Risks: no technical risk introduced; legal gate remains external until signed memo arrival.
- Blockers: Signed counsel memo pending.
- Next step: copy-edit/send dispatch example, update tracker to `sent`, and apply post-send status snippet with real timestamps.

### 2026-04-16 (execution: P0-02 post-send status snippet)
- Focus: standardize immediate post-dispatch status updates so counsel send event is logged consistently across active status artifacts.
- Files changed: `product-os/04-quality/p0-02-post-send-status-snippet.md`, `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: created reusable `current-focus` + `daily-log` snippet template and wired it into dispatch checklist to reduce wording drift during outbound legal-request logging.
- Risks: no new execution risk introduced; external legal dependency still controls gate completion timeline.
- Blockers: Signed counsel memo pending.
- Next step: send counsel request and apply snippet with real dispatch metadata (`timestamp`, `recipient`, `expected response date`).

### 2026-04-16 (execution: P0-02 response tracker initialization)
- Focus: pre-initialize counsel response tracker so dispatch can be recorded immediately with minimal operational delay.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: set tracker default state to `not_sent`, added dispatch placeholders (`recipient`, `sent time`, `expected date`), fixed follow-up cadence baseline (`every 3 business days`), and seeded initial pending follow-up row.
- Risks: external legal dependency remains unchanged; initialization primarily reduces process friction during first outbound send.
- Blockers: Signed counsel memo still pending.
- Next step: send counsel request, replace placeholders with real dispatch metadata, and transition tracker status to `sent`.

### 2026-04-16 (execution: P0-02 counsel response tracker)
- Focus: add outbound legal-request response tracking so follow-up cadence and memo receipt handoff are explicitly managed.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added response tracker with request state model, follow-up log, memo receipt record, and explicit bridge to intake/scaffold/closeout artifacts; extended dispatch checklist to require tracker initialization post-send.
- Risks: external legal dependency remains; tracker reduces silent-delay risk by making follow-up cadence explicit.
- Blockers: Signed counsel memo pending.
- Next step: send request, initialize tracker with sent timestamp/expected response date, and run follow-up cadence until memo receipt.

### 2026-04-16 (execution: P0-02 counsel dispatch checklist)
- Focus: prepare send-ready operational checklist so counsel request can be dispatched with complete artifact set and immediate status traceability.
- Files changed: `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added pre-send verification list, attachment/reference manifest, send-record block, and explicit post-send status update steps; linked dispatch checklist to intake/scaffold/closeout sequence for receipt-driven execution.
- Risks: external response timing remains a gate; dispatch checklist lowers omission risk during outbound legal request.
- Blockers: Signed counsel memo still pending.
- Next step: send counsel request, record expected response date, and update status logs with send metadata.

### 2026-04-16 (execution: P0-02 counsel handoff draft)
- Focus: prepare counsel-facing outreach message so legal opinion request can be sent immediately with complete output contract.
- Files changed: `product-os/04-quality/p0-02-counsel-handoff-message-draft.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: created email-ready handoff with explicit 3-question legal scope, canonical source pack, signed-memo requirements, and tracking fields (sent date, expected response date, memo ID).
- Risks: legal gate timing remains external; draft reduces communication ambiguity but response cadence still depends on counsel availability.
- Blockers: Signed counsel memo pending.
- Next step: send handoff message, record expected response date, and execute intake/patch/closeout artifacts once memo is received.

### 2026-04-16 (execution: P0-02 single-shot closeout checklist)
- Focus: create a deterministic one-pass P0-02 closure runbook with exact file sequence and validation steps.
- Files changed: `product-os/04-quality/p0-02-closeout-checklist.md`, `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added closeout checklist defining strict update order (canonical spec -> execution board -> status logs), line-level touchpoint index, and final validation stamp; linked scaffold to closeout runbook to keep memo-to-spec flow unified.
- Risks: closure remains dependent on external signed memo; runbook reduces operator error risk during final gate close.
- Blockers: Signed counsel memo not yet received.
- Next step: receive signed memo, fill intake + scaffold, execute closeout checklist, and mark P0-02 complete.

### 2026-04-16 (execution: P0-02 legal spec-delta patch scaffold)
- Focus: pre-stage legal-sensitive canonical spec sections so signed counsel memo deltas can be applied quickly and traceably.
- Files changed: `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`, `product-os/04-quality/p0-02-counsel-memo-intake-template.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: created patch scaffold with pre-labeled legal-sensitive sections (29, 22, 23, 45.4), row-based memo finding -> section mapping table, and patch acceptance checklist; linked intake template to scaffold for deterministic memo-to-spec execution flow.
- Risks: external counsel dependency still gates completion; scaffold accelerates implementation but cannot substitute signed legal interpretation.
- Blockers: Signed counsel memo not yet received.
- Next step: ingest signed memo into intake template, execute section deltas via scaffold, then mark P0-02 complete in execution board and status logs.

### 2026-04-16 (execution: P0-02 legal memo intake template)
- Focus: create structured intake artifact so signed P0-02 counsel memo can be evaluated and closed with consistent legal/spec traceability.
- Files changed: `product-os/04-quality/p0-02-counsel-memo-intake-template.md`, `product-os/04-quality/p0-02-counsel-memo-commissioning-brief.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added intake template with memo metadata, three-question legal decision matrix, spec delta table, and closure checklist; linked commissioning brief to intake workflow for deterministic handoff from counsel response to gate closeout.
- Risks: P0-02 remains blocked on external legal turnaround; template reduces closure ambiguity but does not remove counsel dependency.
- Blockers: Signed counsel memo not yet received.
- Next step: receive signed memo, complete intake template, apply legal wording deltas to canonical spec sections, and mark P0-02 complete.

### 2026-04-16 (execution: P0-02 legal memo commissioning prep)
- Focus: prepare legal commissioning artifact for P0-02 so counsel opinion can be requested with explicit output contract and closure criteria.
- Files changed: `product-os/04-quality/p0-02-counsel-memo-commissioning-brief.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: created structured P0-02 commissioning brief with legal questions, source input pack, required memo output contract, and closeout checklist; status updated to reflect P0-02 remains open until signed counsel memo is received.
- Risks: legal gate remains external dependency and blocks formal P0 completion; timeline risk persists until memo turnaround date is confirmed.
- Blockers: Signed counsel memo not yet received.
- Next step: submit commissioning brief to counsel, capture signed memo identifier/date, then update execution board/status logs and spec sections with any required legal constraints.

### 2026-04-16 (execution: FEAT-010 S1 code slice 5)
- Focus: complete FEAT-010 closeout reconciliation with acceptance mapping and done-state governance hygiene.
- Files changed: `product-os/02-features/FEAT-010-workflow-templates.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: reconciled FEAT-010 S1 acceptance to implemented tenant/role guards, deterministic stage + SLA transitions, immutable telemetry evidence, and workflow diagnostics read surfaces; resolved open question to internal API + audit-log telemetry protocol for workflow templates scope; set feature status to `Done (TB-V16-010 / FEAT-010)`.
- Risks: no new runtime risk introduced in closeout slice; future enhancement risk remains for scheduler-driven automatic SLA breach detection and additional UX polish for workflow operator tooling.
- Blockers: None.
- Next step: begin next roadmap feature execution slice after FEAT-010 handoff.

### 2026-04-16 (execution: FEAT-010 S1 code slice 4)
- Focus: implement workflow SLA warning/breach/escalation write-path telemetry with deterministic recovery guardrails.
- Files changed: `tracebud-backend/src/workflow-templates/workflow-templates.controller.ts`, `tracebud-backend/src/workflow-templates/workflow-templates.controller.spec.ts`, `tracebud-backend/src/workflow-templates/workflow-templates.controller.int.spec.ts`, `tracebud-backend/src/audit/audit.controller.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-010-workflow-templates.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `POST /v1/workflow-templates/{id}/stages/{stageId}/sla-transitions` enforcing deterministic SLA state edges (`on_track -> warning -> breached -> escalated -> on_track` with constrained recovery branches), exporter-only escalation, and non-farmer write restrictions; persisted immutable SLA telemetry events including recovery (`workflow_stage_sla_recovered`); extended workflow diagnostics contracts to include recovery phase for operator evidence continuity.
- Risks: SLA lifecycle is currently driven by explicit API transitions (operator-initiated) rather than scheduler-driven breach detection; future slices may still need automatic timer-based detection to reduce manual operational load.
- Blockers: None.
- Next step: FEAT-010 S1 code slice 5 closeout reconciliation (acceptance mapping, open-question resolution, done-state pass).

### 2026-04-16 (execution: FEAT-010 S1 code slice 3)
- Focus: expose tenant-safe workflow diagnostics read surfaces and operator dashboard evidence visibility for template/stage/SLA lifecycle review.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-010-workflow-templates.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/audit/gated-entry/workflow-activity` with deterministic phase/SLA filtering and tenant paging; dashboard proxy now forwards `eventKind=workflow_activity`; new `useWorkflowActivityEvents` hook and admin workflow diagnostics panel now render actor/template/stage/SLA evidence with operator filters and pagination.
- Risks: workflow SLA events are queryable now (`workflow_stage_sla_*`) but write-path instrumentation for warning/breach/escalation remains pending, so SLA-focused tables may stay sparse until next slice.
- Blockers: None.
- Next step: FEAT-010 S1 code slice 4 to implement SLA warning/breach/escalation write-path telemetry with deterministic remediation transitions and acceptance assertions.

### 2026-04-16 (execution: FEAT-010 S1 code slice 2)
- Focus: implement tenant-safe workflow template/stage contract baseline with deterministic transition semantics and immutable audit evidence.
- Files changed: `tracebud-backend/src/workflow-templates/workflow-templates.module.ts`, `tracebud-backend/src/workflow-templates/workflow-templates.controller.ts`, `tracebud-backend/src/workflow-templates/workflow-templates.controller.spec.ts`, `tracebud-backend/src/workflow-templates/workflow-templates.controller.int.spec.ts`, `tracebud-backend/src/app.module.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-010-workflow-templates.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added workflow template create/list endpoints with tenant-claim fail-closed and explicit role policy (`exporter` create, `exporter|agent` list); added stage transition endpoint with deterministic state machine (`pending -> in_progress -> completed -> approved|rejected`, `rejected -> in_progress`) and role restrictions (`approved|rejected` exporter-only); persisted immutable workflow telemetry (`workflow_template_created`, `workflow_stage_transitioned`) in `audit_log`; published OpenAPI contracts for workflow templates + transition requests.
- Risks: workflow slice currently stores contract evidence in audit events without dedicated normalized template/stage tables; future slices should add diagnostics read surfaces and SLA breach lifecycle events to complete operator visibility and escalation behavior.
- Blockers: None.
- Next step: FEAT-010 S1 code slice 3 to expose workflow diagnostics read/export surfaces and dashboard integration for assignment/approval/SLA telemetry.

### 2026-04-16 (execution: FEAT-010 S1 code slice 1)
- Focus: bootstrap workflow templates feature execution matrix for tenant-safe stage orchestration, assignments, approvals, and SLA semantics.
- Files changed: `product-os/02-features/FEAT-010-workflow-templates.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented FEAT-010 S1 permissions/tenant boundaries, canonical template/stage transition model, deterministic exception recovery behavior, analytics baseline events, acceptance mapping, and v1.6 architecture-constraint applicability.
- Risks: FEAT-010 remains documentation-only at this slice; concrete workflow template/stage API contracts and runtime telemetry implementation are pending subsequent slices.
- Blockers: None.
- Next step: FEAT-010 S1 code slice 2 to implement tenant-safe workflow template/stage contract baseline with deterministic transition semantics.

### 2026-04-16 (execution: FEAT-009 S1 code slice 4)
- Focus: complete integrations feature closeout by reconciling acceptance mapping, resolving open question, and updating done-state tracking.
- Files changed: `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: FEAT-009 S1 acceptance mapping is now explicitly reconciled to tenant-safe webhook registration/delivery evidence behavior across backend + dashboard proxy surfaces; open question is resolved to retain internal API + audit-log webhook evidence protocol for S1 scope; feature status moved to `Done (TB-V16-009 / FEAT-009)`.
- Risks: no new implementation risk introduced in closeout slice; future scope remains for real adapter execution telemetry replacing synthetic baseline evidence and for dedicated export/replay controls.
- Blockers: None.
- Next step: begin FEAT-010 S1 code slice 1 execution matrix bootstrap for workflow templates scope.

### 2026-04-16 (execution: FEAT-009 S1 code slice 3)
- Focus: expose integration webhook registration and delivery evidence diagnostics in dashboard proxy/admin operator surfaces.
- Files changed: `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added proxy routing for webhook and delivery evidence reads (`eventKind=webhooks|webhook_deliveries`) with fail-closed `webhookId` validation; admin diagnostics now includes clickable webhook registration rows and selected-webhook delivery evidence lifecycle table with pagination; route test suite expanded for forwarding and validation semantics.
- Risks: webhook diagnostics currently remain read-only and rely on event-log-derived evidence snapshots; dedicated export surfaces and richer delivery replay controls remain future-slice scope.
- Blockers: None.
- Next step: FEAT-009 S1 code slice 4 closeout pass for acceptance reconciliation and provider/protocol open-question resolution.

### 2026-04-16 (execution: FEAT-009 S1 code slice 2)
- Focus: implement tenant-safe webhook contract baseline and immutable delivery evidence telemetry for integrations scope.
- Files changed: `tracebud-backend/src/integrations/integrations.controller.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `tracebud-backend/src/integrations/integrations.controller.spec.ts`, `tracebud-backend/src/integrations/integrations.controller.int.spec.ts`, `tracebud-backend/src/app.module.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added exporter-scoped webhook registration plus exporter/agent webhook and delivery evidence list endpoints with tenant-claim fail-closed behavior; registration now appends immutable integration delivery evidence events to `audit_log` (`registered`, `attempt_queued`, `succeeded`) and delivery read path supports retry/terminal-failure event families for future slices.
- Risks: registration currently records baseline synthetic first delivery evidence to establish immutable trace contract; future slices should replace this with adapter-driven real delivery execution telemetry while preserving event semantics.
- Blockers: None.
- Next step: FEAT-009 S1 code slice 3 to wire dashboard proxy/admin diagnostics views for webhook/delivery evidence and export/readiness controls.

### 2026-04-16 (execution: FEAT-009 S1 code slice 1)
- Focus: bootstrap integrations feature execution matrix for tenant-safe API/webhook/adapter delivery behavior.
- Files changed: `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented FEAT-009 S1 permissions/tenant boundaries, canonical integration lifecycle transitions, deterministic exception recovery, analytics baseline events, acceptance mapping, and v1.6 architecture-constraint applicability.
- Risks: FEAT-009 remains documentation-only at this slice; concrete integration registration/delivery/replay contracts and evidence surfaces are pending implementation slices.
- Blockers: None.
- Next step: FEAT-009 S1 code slice 2 to implement tenant-safe integration contract baseline with delivery-evidence telemetry.

### 2026-04-16 (execution: FEAT-008 S1 code slice 5)
- Focus: complete dashboards feature closeout pass by reconciling acceptance mapping, resolving open question, and updating done-state tracking.
- Files changed: `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: FEAT-008 S1 acceptance mapping is now explicitly reconciled to implemented tenant-safe diagnostics, segmented summary behavior, and readiness/export guardrails; open question is resolved to retain internal API + audit-log telemetry protocol for S1 scope; feature status moved to `Done (TB-V16-008 / FEAT-008)`.
- Risks: no new implementation risk introduced in closeout slice; future enhancement risk remains for deeper interactive drill UX (auto-scroll/focus and richer segment-to-widget navigation states).
- Blockers: None.
- Next step: begin FEAT-009 S1 code slice 1 execution matrix bootstrap for integrations scope.

### 2026-04-16 (execution: FEAT-008 S1 code slice 4)
- Focus: wire summary-driven drill-down interactions and tighten diagnostics export guardrail behavior.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: summary segment controls now apply assignment/risk/filing/chat diagnostics filters with page resets for faster investigator pivots; export-all actions now respect summary readiness (`canExportDetailed`) to fail closed on empty diagnostics windows; acceptance tests now explicitly lock zero-diagnostics readiness behavior.
- Risks: drill actions currently prioritize fast filter pivots but do not auto-scroll/focus target widget sections, so operators still navigate manually within the diagnostics panel.
- Blockers: None.
- Next step: FEAT-008 S1 code slice 5 closeout pass to reconcile acceptance matrix, resolve open question status, and assess feature done-state readiness.

### 2026-04-16 (execution: FEAT-008 S1 code slice 3)
- Focus: extend dashboard diagnostics summary with widget-level segmented drill-down counters and summary readiness/export guardrails.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: dashboard summary contract now returns deterministic segment buckets for assignment phase/status, risk band, filing family, and chat phase alongside `readiness` guardrails (`hasAnyDiagnostics`, `canExportDetailed`, `latestEventAt`); admin diagnostics summary card now renders segmented counters and readiness state for faster triage/export decisions.
- Risks: summary segmentation currently remains aggregate-only and does not yet provide interactive click-through drill paths per segment in this slice.
- Blockers: None.
- Next step: FEAT-008 S1 code slice 4 to wire segment-driven drill interactions and tighten acceptance assertions around export/readiness workflow behavior.

### 2026-04-16 (execution: FEAT-008 S1 code slice 2)
- Focus: implement tenant-scoped dashboard diagnostics summary baseline and initial admin visibility surface.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/audit/gated-entry/dashboard-summary` returning tenant-scoped aggregate counters for gated-entry/assignment/risk/filing/chat event families; dashboard analytics proxy now routes `eventKind=dashboard_summary`; admin telemetry card now renders summary counters for current time window; OpenAPI now publishes typed summary response schema.
- Risks: summary counters currently provide aggregate-level visibility only and do not yet include widget-level phase/status drilldowns or export metadata slices.
- Blockers: None.
- Next step: FEAT-008 S1 code slice 3 to add widget-level drill-down contracts (phase/status segmented counters) and optional summary export/readiness guardrails.

### 2026-04-16 (execution: FEAT-008 S1 code slice 1)
- Focus: bootstrap dashboards feature execution matrix for tenant-safe operational readiness/risk/filing/chat visibility.
- Files changed: `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented FEAT-008 S1 permissions/tenant boundaries, dashboard state transitions (`loading/ready/partial_ready/refreshed/stale`), deterministic exception recovery expectations, analytics baseline events, acceptance mapping, and v1.6 architecture-constraint applicability.
- Risks: FEAT-008 remains documentation-only at this slice; concrete dashboard backend/frontend contract implementation and aggregation semantics are pending next slices.
- Blockers: None.
- Next step: FEAT-008 S1 code slice 2 to implement tenant-scoped dashboard contract baseline and initial diagnostics aggregation/API surface.

### 2026-04-16 (execution: FEAT-007 S1 code slice 5)
- Focus: close FEAT-007 with acceptance-aligned diagnostics assertions and feature hygiene completion.
- Files changed: `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-007-chat-threads.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added explicit transition-phase diagnostics coverage (`resolved`) in unit + DB-backed integration tests; closed FEAT-007 open question by confirming internal contract/audit protocol remains the selected S1 provider path; set feature status to `Done (TB-V16-007 / FEAT-007)`.
- Risks: collaboration authorization is currently tenant+role scoped at endpoint level; future slices may still require stricter record-participant policy constraints for large enterprise reviewer networks.
- Blockers: None.
- Next step: begin next roadmap feature (FEAT-008) with S1 execution matrix bootstrap and architecture-constraint applicability pass.

### 2026-04-16 (execution: FEAT-007 S1 code slice 4)
- Focus: implement explicit chat-thread resolve/reopen/archive lifecycle transitions with telemetry/diagnostics parity.
- Files changed: `tracebud-backend/src/chat-threads/chat-threads.service.ts`, `tracebud-backend/src/chat-threads/chat-threads.controller.ts`, `tracebud-backend/src/chat-threads/chat-threads.service.spec.ts`, `tracebud-backend/src/chat-threads/chat-threads.controller.spec.ts`, `tracebud-backend/src/audit/audit.controller.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-007-chat-threads.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added tenant-scoped transition endpoints (`POST /v1/chat-threads/{id}/resolve|reopen|archive`) and deterministic transition guards (`active->resolved`, `resolved->active`, `active|resolved->archived`, archived fail-closed on invalid transitions); added lifecycle telemetry events (`chat_thread_resolved`, `chat_thread_reopened`, `chat_thread_archived`) and extended diagnostics phase filters/contracts to include new lifecycle states.
- Risks: transition endpoints currently rely on role derivation without additional per-record collaborator scope constraints; future slices may need tighter record-level participant authorization for non-exporter roles.
- Blockers: None.
- Next step: FEAT-007 S1 code slice 5 for acceptance closeout assertions, including diagnostics/integration parity checks for transition events and feature checklist/open-question closure.

### 2026-04-16 (execution: FEAT-007 S1 code slice 3)
- Focus: persist chat-thread lifecycle telemetry and expose tenant-safe diagnostics read surface for operator visibility.
- Files changed: `tracebud-backend/src/chat-threads/chat-threads.service.ts`, `tracebud-backend/src/chat-threads/chat-threads.service.spec.ts`, `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-007-chat-threads.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: chat-thread writes now append best-effort lifecycle audit events (`chat_thread_created`, `chat_thread_message_posted`, `chat_thread_message_replayed`) with tenant/actor/message context; added `GET /v1/audit/gated-entry/chat-threads` with phase filtering and pagination; dashboard diagnostics now includes chat-thread activity table driven by `eventKind=chat_threads` proxy routing.
- Risks: chat-thread lifecycle diagnostics currently covers create/post/replay phases only; resolve/reopen/archive transitions remain pending in next slice and should be added before feature closeout.
- Blockers: None.
- Next step: FEAT-007 S1 code slice 4 to implement thread lifecycle state transitions (`resolve/reopen/archive`) with explicit policy checks, telemetry parity, and diagnostics/OpenAPI expansion.

### 2026-04-16 (execution: FEAT-006 S1 code slice 1)
- Focus: bootstrap filing middleware execution matrix for tenant-safe pre-flight, package generation, and idempotent submission lifecycle.
- Files changed: `product-os/02-features/FEAT-006-filing-middleware.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented FEAT-006 S1 permission/tenant gates, canonical transition path (`ready_to_submit -> preflight_validated -> package_generated -> submission_inflight -> submitted/retryable_failed`), deterministic recovery/idempotency expectations, analytics lifecycle coverage, acceptance mapping, and v1.6 architecture constraint applicability.
- Risks: execution matrix is established but no runtime filing middleware endpoint/implementation landed yet; next slice must translate matrix into concrete backend contract and tests.
- Blockers: None.
- Next step: FEAT-006 S1 code slice 2 to implement filing pre-flight endpoint contract + tenant/exporter scope enforcement with unit and integration coverage.

### 2026-04-16 (execution: FEAT-005 closeout slice)
- Focus: complete FEAT-005 feature hygiene by closing remaining architecture-constraint and provider/protocol checklist gates.
- Files changed: `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: marked v1.6 architecture-constraint checklist item complete with explicit applicability notes for spatial/HLC/lineage/TRACES/GDPR; resolved open question confirming `internal_v1` risk provider remains in-scope for S1 with no new external dependency; updated feature status to `Done (TB-V16-005 / FEAT-005)`.
- Risks: no new technical risk introduced in closeout pass; remaining FEAT-005 expansion (e.g., explicit override workflow) is optional follow-on scope rather than blocker for S1 Done criteria.
- Blockers: None.
- Next step: move to next priority FEAT (likely FEAT-006) and start S1 execution matrix/bootstrap slice.

### 2026-04-16 (execution: FEAT-005 S1 code slice 4)
- Focus: ship risk-score diagnostics CSV handoff path and publish audit/OpenAPI contract for risk-score telemetry reads/exports.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.risk-scores.api.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/audit/gated-entry/risk-scores/export` with `phase`/`band` filtering and standard export metadata headers; dashboard analytics proxy now routes risk-score CSV export requests and admin diagnostics exposes `Export CSV` + `Export All CSV` for risk-score activity; OpenAPI now includes risk-score telemetry list/export paths and typed schemas.
- Risks: risk-score CSV exports currently use synchronous request-time generation with fixed cap (`5000` rows); if tenant event volume spikes, async export jobs may be needed later.
- Blockers: None.
- Next step: FEAT-005 S1 code slice 5 to close remaining architecture-constraint checklist item and decide whether FEAT-005 can be marked Done vs requiring override workflow slice.

### 2026-04-16 (execution: FEAT-005 S1 code slice 3)
- Focus: expose tenant-scoped risk-score diagnostics read path and surface risk-score activity in admin telemetry UX.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: risk-score audit payload now carries tenant/actor attribution fields for tenant-safe diagnostics; added `GET /v1/audit/gated-entry/risk-scores` with `phase` and `band` filtering; dashboard analytics proxy now routes `eventKind=risk_scores`; admin diagnostics now includes risk-score activity table with server-side paging/filter controls.
- Risks: risk-score diagnostics are currently read-only and dashboard-only; CSV export for risk-score evidence handoff is not yet implemented in this slice.
- Blockers: None.
- Next step: FEAT-005 S1 code slice 4 to add risk-score diagnostics CSV export path and OpenAPI publication for the new audit read contract.

### 2026-04-16 (execution: FEAT-005 S1 code slice 2)
- Focus: persist and verify risk-score audit lifecycle evidence for exporter-triggered package scoring checks.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: risk scoring now emits best-effort lifecycle events (`dds_package_risk_score_requested`, `dds_package_risk_score_evaluated`, `dds_package_risk_score_<band>`) with contract payload fields (`packageId`, `provider`, `score`, `band`, `reasonCount`, `scoredAt`); added DB-backed integration assertion for exporter risk-score path to prove persisted evidence shape.
- Risks: lifecycle events are currently audit-log only and not yet exposed through admin diagnostics read endpoints; visibility/UI surfacing remains a follow-up slice.
- Blockers: None.
- Next step: FEAT-005 S1 code slice 3 to expose tenant-scoped risk-score audit read endpoint + dashboard diagnostics panel integration for operator visibility.

### 2026-04-16 (execution: FEAT-005 S1 code slice 1)
- Focus: bootstrap deterministic risk-scoring baseline contract for DDS packages under explicit tenant-safe exporter scope.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-005-risk-scoring.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added exporter-only endpoint `GET /v1/harvest/packages/{id}/risk-score`; implemented deterministic single-provider scoring (`internal_v1`) with bounded score (`0..100`), explicit banding (`low|medium|high`), and weighted explainability reasons; published OpenAPI response schemas for risk score and reason payload.
- Risks: scoring logic is intentionally conservative and rule-light in this bootstrap slice; additional domain signals and dedicated risk-score lifecycle analytics events are still pending next slices.
- Blockers: None.
- Next step: FEAT-005 S1 code slice 2 to persist risk-score audit lifecycle events (`requested/evaluated/band`) and add DB-backed integration proof for tenant-scoped evidence reads.

### 2026-04-16 (execution: FEAT-002 S1 code slice 17)
- Focus: enable full filtered assignment-export diagnostics handoff via backend CSV export path.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added tenant-safe backend CSV export endpoint for assignment export telemetry (`assignment-exports/export`) with phase/status filters and row headers; analytics proxy now routes assignment CSV requests to the dedicated endpoint; admin diagnostics now includes `Export All CSV` for assignment activity.
- Risks: backend export currently uses fixed row cap (`5000`) and synchronous generation; extreme-volume tenants may require asynchronous export jobs later.
- Blockers: None.
- Next step: add explicit assignment export diagnostics pagination controls + total counts in admin UI and publish endpoint contract in OpenAPI draft.

### 2026-04-16 (execution: FEAT-002 S1 code slice 16)
- Focus: improve assignment export diagnostics usability with targeted filters and direct CSV handoff.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added assignment export `phase` + `status` filtering from admin UI through proxy to backend audit read path, and introduced assignment-export diagnostics CSV export for current filtered table contents.
- Risks: diagnostics CSV export is currently page-local (table scope), not full historical traversal; large compliance exports may still require paginated backend export endpoint follow-up.
- Blockers: None.
- Next step: add dedicated backend CSV endpoint for assignment export activity history (full filtered set) and optional actor/plotId search filters.

### 2026-04-16 (execution: FEAT-002 S1 code slice 15)
- Focus: expose assignment export telemetry in admin diagnostics for operator-visible evidence and troubleshooting.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added backend list endpoint for `plot_assignment_export_*` events under tenant-claim guards, extended analytics proxy with `eventKind=assignment_exports`, and added admin table for actor/phase/filter/row/error visibility.
- Risks: diagnostics currently reuses existing admin telemetry card and can become dense as event volume grows; may need dedicated tab or stronger server-side filters in follow-up.
- Blockers: None.
- Next step: add assignment-export activity filters (phase/status) and optional CSV export of assignment diagnostics table for compliance handoff.

### 2026-04-16 (execution: FEAT-002 S1 code slice 14)
- Focus: add assignment CSV export lifecycle telemetry for operational evidence and failure diagnostics.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added best-effort audit event writer for assignment exports and instrumented controller CSV flow to emit `requested`, `succeeded` (with row count), and `failed` (with error) events while preserving export response behavior.
- Risks: telemetry writes are intentionally non-blocking; temporary audit-log write outages may create visibility gaps even when export responses succeed.
- Blockers: None.
- Next step: surface assignment export telemetry in admin diagnostics (eventKind + actor/date filters) for operator-accessible observability.

### 2026-04-16 (execution: FEAT-002 S1 code slice 13)
- Focus: move assignment export from browser-built CSV to backend streamed CSV while preserving tenant-safe filters.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.test.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `format=csv` support on assignment list endpoint, looped backend paging for full filtered export coverage, returned export row-count header, and updated dashboard proxy to pass CSV content/headers through.
- Risks: very large exports still run in request lifecycle and may need dedicated async/export-job flow later if tenant volumes spike.
- Blockers: None.
- Next step: add assignment-export analytics events (`requested`, `succeeded`, `failed`) and dashboard counters for operational evidence tracking.

### 2026-04-16 (execution: FEAT-002 S1 code slice 12)
- Focus: improve assignment triage handoff with explicit status semantics and exportable filtered history.
- Files changed: `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced reusable filtered query builder for assignment list/export parity, added status legend badge tooltips, and implemented paged CSV export to include all records matching current filters.
- Risks: CSV export can generate larger browser-memory blobs on very high totals; current paging guard (100 rows/request) limits request count but not absolute export size.
- Blockers: None.
- Next step: add backend-side CSV streaming endpoint for very large export volumes and include row-count telemetry in operator analytics.

### 2026-04-16 (execution: FEAT-002 S1 code slice 11)
- Focus: polish assignment table readability for operator triage with richer identity/status cues.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: assignment list now returns optional `agentEmail` (via safe row-json extraction), panel now renders status badges and email secondary line when present, and tests/assertions confirm UI contract remains stable under fallback/no-email cases.
- Risks: `agentEmail` availability depends on `user_account` row shape and data completeness; missing email remains expected and should still degrade gracefully.
- Blockers: None.
- Next step: add compact legend/tooltips for status badges and optional CSV export for filtered assignment history handoff.

### 2026-04-16 (execution: FEAT-002 S1 code slice 10)
- Focus: improve assignment history readability with agent labels and tighten filter-total consistency evidence.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: assignment list query now left-joins `user_account` for optional `agentName` enrichment; panel now renders `agentName (UUID)` when available; backend unit+integration assertions expanded to validate filtered list envelope metadata and total-vs-items consistency expectations.
- Risks: `agentName` enrichment depends on `user_account.name` completeness; missing names still degrade to UUID-only display.
- Blockers: None.
- Next step: add optional backend enrichment with agent email (when available) and badge-style status/agent chips to further improve high-volume scanning ergonomics.

### 2026-04-16 (execution: FEAT-002 S1 code slice 9)
- Focus: scale assignment history operations with server-side filters and pagination for operator workflows.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.test.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: assignment list endpoint now returns paged envelope with query filters (`status`, `fromDays`, `agentUserId`, `limit`, `offset`); dashboard proxy forwards these params; panel adds filter chips, window/agent controls, and previous/next pagination while preserving click-to-fill assignment convenience.
- Risks: current panel still uses raw agent UUID filter input; directory-backed agent picker and richer display labels remain follow-up UX improvements.
- Blockers: None.
- Next step: enrich assignment panel with agent directory lookup + status badge styling and add backend list integration assertions for filter combinations/total consistency.

### 2026-04-16 (execution: FEAT-002 S1 code slice 8)
- Focus: add assignment history listing and selection ergonomics for operator lifecycle workflows.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.test.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added backend list endpoint (`GET /v1/plots/{id}/assignments`) under existing assignment-management role gate; dashboard proxy now supports assignment history reads; lifecycle panel now renders assignment table and supports click-to-fill assignment ID, reducing manual ID transcription errors.
- Risks: Assignment history currently renders as a simple table without pagination/filtering; very large assignment volumes may need paging/search in a follow-up slice.
- Blockers: None.
- Next step: add assignment history pagination/filter controls (status/date/agent) plus optional agent-directory label enrichment for operator readability.

### 2026-04-16 (execution: FEAT-002 S1 code slice 7)
- Focus: expose assignment lifecycle controls in dashboard operator UX with actionable ASN recovery guidance.
- Files changed: `apps/dashboard-product/app/api/plots/[id]/assignments/route.ts`, `apps/dashboard-product/app/api/plots/[id]/assignments/route.test.ts`, `apps/dashboard-product/app/api/plots/assignments/[assignmentId]/complete/route.ts`, `apps/dashboard-product/app/api/plots/assignments/[assignmentId]/complete/route.test.ts`, `apps/dashboard-product/app/api/plots/assignments/[assignmentId]/cancel/route.ts`, `apps/dashboard-product/app/api/plots/assignments/[assignmentId]/cancel/route.test.ts`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.tsx`, `apps/dashboard-product/components/plots/plot-assignment-lifecycle-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.tsx`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dedicated dashboard proxy routes for assignment create/complete/cancel with fail-closed backend URL behavior and denial pass-through; added plot detail lifecycle panel with create/complete/cancel actions and ASN-to-operator guidance mapping (`ASN-001..004`); preserved geometry-history page test coverage while extending assignment-specific test lane.
- Risks: Operator panel currently depends on manual assignment IDs and agent UUID entry; user-directory-assisted selection and assignment history visualization are not yet included.
- Blockers: None.
- Next step: add assignment list/history API + UI table so operators can discover active/completed assignments without manually tracking IDs.

### 2026-04-16 (execution: FEAT-002 S1 code slice 6)
- Focus: implement canonical assignment lifecycle transitions with typed transition errors and contract publication.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/dto/create-plot-assignment.dto.ts`, `tracebud-backend/src/plots/dto/update-plot-assignment-status.dto.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added assignment lifecycle APIs (`create`, `complete`, `cancel`) guarded to `agent/exporter` roles with tenant-claim fail-closed behavior; service now enforces state transitions and emits typed `ASN-001..004` errors for duplicate/not-found/invalid-transition/relation-missing paths; controller-scope DB integration now asserts deny/allow plus invalid-transition handling.
- Risks: Typed assignment errors are currently surfaced via `BadRequestException` message strings; if frontend/error analytics need structured machine fields, add explicit `{code,message}` response envelope in follow-up.
- Blockers: None.
- Next step: add frontend/dashboard assignment-management surface (operator controls + status history) and wire typed assignment errors to UI guidance/retry actions.

### 2026-04-16 (execution: FEAT-002 S1 code slice 5)
- Focus: publish canonical assignment scope schema and sync endpoint API contracts.
- Files changed: `tracebud-backend/sql/tb_v16_010_agent_plot_assignment_scope.sql`, `docs/openapi/tracebud-v1-draft.yaml`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/sync-envelope.api.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added canonical assignment relation migration (`agent_plot_assignment`) with active-assignment uniqueness and lookup indexes; updated OpenAPI to include sync metadata endpoints and request schemas carrying `hlcTimestamp`, `clientEventId`, and optional `assignmentId`; shifted assignment relation availability check to query-time fail-closed handling (`42P01`) for robust runtime behavior.
- Risks: OpenAPI contract currently captures `403` assignment/ownership scope denial semantics descriptively; if client surfaces require granular machine-readable error codes, a follow-up contract enhancement is still needed.
- Blockers: None.
- Next step: add explicit `assignment_status` enum and lifecycle transition API slice (activate/complete/cancel) so sync authorization references canonical assignment state transitions instead of table-level status literals only.

### 2026-04-16 (execution: FEAT-002 S1 code slice 4)
- Focus: enforce assignment-aware agent scope for mobile sync metadata writes.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/dto/sync-plot-photos.dto.ts`, `tracebud-backend/src/plots/dto/sync-plot-legal.dto.ts`, `tracebud-backend/src/plots/dto/sync-plot-evidence.dto.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `tracebud-backend/src/plots/sync-envelope.api.int.spec.ts`, `tracebud-backend/src/harvest/ownership-scope.int.spec.ts`, `tracebud-backend/src/reports/package-report-access.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added optional `assignmentId` to sync envelopes and new service-level assignment verifier (`isAgentAssignedToPlot`) that fail-closes when assignment relation is unavailable; sync controller scope helper now enforces assignment-bound allow for agent role and owned-plot allow for farmer role.
- Risks: Assignment enforcement currently expects relation name `agent_plot_assignment`; migration-level canonicalization is still needed to align this temp contract with final schema naming and lifecycle fields.
- Blockers: None.
- Next step: add canonical assignment table migration + API/docs contract updates (including explicit assignment status lifecycle) so assignment scope no longer relies on relation-presence probing.

### 2026-04-16 (execution: FEAT-002 S1 code slice 3)
- Focus: enforce assignment-like plot ownership boundaries on sync metadata endpoints for farmer mobile flows.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `tracebud-backend/src/plots/sync-envelope.api.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added shared controller scope helper for sync metadata endpoints to enforce `farmer|agent` role policy and farmer-owned plot checks; expanded controller/API DB-backed integration coverage to assert foreign-farmer denial (`Plot scope violation`) and agent allow behavior under tenant-safe context.
- Risks: Agent allow-path is currently role-based and tenant-claim-bound; explicit assignment-table checks are not yet wired in this slice.
- Blockers: None.
- Next step: add assignment-id aware sync contract fields and DB-backed assignment-join checks so agent sync writes are constrained to explicit assignment scope rather than role-only allow.

### 2026-04-16 (execution: FEAT-002 S1 code slice 2)
- Focus: prove mobile sync envelope policy through DB-backed Nest HTTP integration path.
- Files changed: `tracebud-backend/src/plots/sync-envelope.api.int.spec.ts`, `tracebud-backend/package.json`, `tracebud-backend/package-lock.json`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added end-to-end sync API integration spec with guard override + global ValidationPipe to assert missing-tenant deny (`403`), malformed HLC reject (`400`), and valid envelope acceptance with audit payload persistence (`hlcTimestamp`, `clientEventId`); expanded ownership integration required path list to include new sync API spec.
- Risks: Integration test currently overrides auth guard to isolate policy/validation behavior, so it does not validate Supabase token verification mechanics in this slice.
- Blockers: None.
- Next step: extend FEAT-002 with assignment-scope denial/allow API integration assertions so tenant safety also enforces farmer/plot ownership scope during offline sync replay.

### 2026-04-16 (execution: FEAT-002 S1 code slice 1)
- Focus: enforce fail-closed tenant boundaries and offline HLC envelope validation for mobile plot sync metadata paths.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/dto/sync-envelope-validation.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added tenant-claim fail-closed enforcement to `photos-sync`, `legal-sync`, and `evidence-sync`; added DB-backed controller-scope deny/allow coverage for these endpoints; added DTO validation tests locking malformed-vs-valid `hlcTimestamp` semantics across photos/legal/evidence envelopes and retained idempotency key (`clientEventId`) forwarding assertions.
- Risks: DTO-level validation coverage verifies envelope format contract directly but does not yet exercise full HTTP pipeline wiring through global Nest validation in a DB-backed API test harness.
- Blockers: None.
- Next step: add one DB-backed API-level integration lane that hits sync routes through Nest HTTP layer to assert tenant-claim denial + malformed HLC (`400`) + valid envelope allow behavior in one end-to-end slice.

# Daily Log

Append-only session log.

## Template

### YYYY-MM-DD
- Focus
- Files changed
- Decisions
- Risks
- Blockers
- Next step

### 2026-04-07
- Focus: Reorganized Cursor rules, command playbooks, and Product OS docs for v1.6 execution quality.
- Files changed: `.cursor/rules/*`, `.cursor/commands/*`, `product-os/README.md`, `product-os/06-status/current-focus.md`.
- Decisions: Keep `TRACEBUD_V1_2_EUDR_SPEC.md` as canonical filename alias while treating contents as v1.6; enforce v1.6 architecture constraints in always-on guidance.
- Risks: Historical docs may still contain legacy wording until feature/workflow docs are progressively refreshed.
- Blockers: None.
- Next step: Apply the same v1.6 guardrails to active feature docs and quality matrices in `product-os/02-features` and `product-os/04-quality`.

### 2026-04-07 (phase 2)
- Focus: Align all feature templates and quality artifacts with v1.6 enterprise architecture constraints.
- Files changed: `product-os/02-features/*.md`, `product-os/04-quality/*.md`.
- Decisions: v1.6 checks are now mandatory in feature checklists, release gates, exceptions, event families, and QA scenarios.
- Risks: Existing implementation may still lag newly documented gates and should be reviewed slice-by-slice.
- Blockers: None.
- Next step: Run per-feature implementation gap review against updated quality and acceptance artifacts.

### 2026-04-07 (phase 3)
- Focus: Produce execution-ready v1.6 feature gap matrix with priorities and rollout waves.
- Files changed: `product-os/04-quality/v1-6-feature-gap-matrix.md`, `product-os/06-status/current-focus.md`.
- Decisions: P0 rollout starts with FEAT-002, FEAT-003, FEAT-005, FEAT-006 for compliance-critical risk reduction.
- Risks: Prioritization still needs team capacity and dependency validation in sprint planning.
- Blockers: None.
- Next step: Convert Wave 1 rows into implementation tickets with owners and sprint targets.

### 2026-04-07 (phase 4)
- Focus: Convert Wave 1 priorities into sprint-ready ticket pack with acceptance and tests.
- Files changed: `product-os/01-roadmap/v1-6-wave-1-ticket-pack.md`, `product-os/06-status/current-focus.md`.
- Decisions: Established TB-V16-001..006 sequence and dependencies for HLC, spatial correctness, risk compatibility, and TRACES chunking.
- Risks: Owners/estimates remain TBD until team assignment session.
- Blockers: None.
- Next step: Assign owners/estimates and open implementation branches for TB-V16-001 and TB-V16-002.

### 2026-04-07 (phase 5)
- Focus: Implement TB-V16-001 in offline sync queue and drain flow.
- Files changed: `apps/offline-product/features/sync/hlc.ts`, `apps/offline-product/features/state/persistence.native.ts`, `apps/offline-product/features/state/persistence.web.ts`, `apps/offline-product/features/sync/processPendingSyncQueue.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`.
- Decisions: Added HLC timestamp generation on enqueue, deterministic HLC-first queue ordering, and createdAt fallback with audit event on malformed HLC.
- Risks: Server-side HLC rejection endpoint behavior still pending backend API contract update.
- Blockers: None.
- Next step: Implement backend-side HLC validation/rejection path to complete TB-V16-001 acceptance.

### 2026-04-07 (phase 6)
- Focus: Complete TB-V16-001 backend validation slice and wire HLC/idempotency envelope through sync API calls.
- Files changed: `tracebud-backend/src/plots/dto/sync-plot-photos.dto.ts`, `tracebud-backend/src/plots/dto/sync-plot-evidence.dto.ts`, `tracebud-backend/src/plots/dto/sync-plot-legal.dto.ts`, `tracebud-backend/src/harvest/dto/create-harvest.dto.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/harvest/harvest.service.ts`, `apps/offline-product/features/api/postPlot.ts`, `apps/offline-product/features/sync/processPendingSyncQueue.ts`.
- Decisions: Server now rejects malformed HLC format via DTO validation; sync/harvest audit payloads persist `hlcTimestamp` and `clientEventId`.
- Risks: Strict `clientEventId` uniqueness enforcement is not yet persisted server-side and should be implemented in a dedicated idempotency store slice.
- Blockers: None.
- Next step: Implement TB-V16-002 (polygon validity and variance guard path) while defining server-side idempotency persistence design.

### 2026-04-07 (phase 7)
- Focus: Implement TB-V16-002 polygon normalization and correction variance guard in plot ingestion.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`.
- Decisions: Plot create path now applies `ST_MakeValid` for polygons and rejects geometry where correction variance exceeds 5%; audit payload records normalization metrics.
- Risks: GEOGRAPHY column migration and full v1.6 storage model upgrade are still pending dedicated migration slice.
- Blockers: None.
- Next step: Add automated tests for malformed/self-intersecting polygons and start GEOGRAPHY migration planning (TB-V16-003).

### 2026-04-07 (phase 8)
- Focus: Prepare TB-V16-003 migration execution artifacts and decision record.
- Files changed: `tracebud-backend/sql/tb_v16_003_geography_migration.sql`, `product-os/05-decisions/ADR-003-geography-migration-strategy.md`, `product-os/01-roadmap/v1-6-wave-1-ticket-pack.md`, `product-os/06-status/current-focus.md`.
- Decisions: Adopt additive migration path (`geography` columns + backfill + index + staged cutover) with rollback-safe dual-column transition.
- Risks: Data-volume-dependent backfill runtime and lock behavior must be measured in staging before production.
- Blockers: Backend automated test harness still absent; runtime validation will rely on staging migration checks unless test framework is added.
- Next step: Execute migration in staging snapshot and record parity/latency validation results.

### 2026-04-07 (phase 9)
- Focus: Add backend test harness and automate TB-V16-002 polygon normalization guard verification.
- Files changed: `tracebud-backend/package.json`, `tracebud-backend/jest.config.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `product-os/04-quality/qa-scenarios.md`.
- Decisions: Added Jest/ts-jest test pipeline and service-level tests for <=5% accepted and >5% rejected polygon correction variance.
- Risks: Current tests are service-unit level with mocked DB responses; integration-level DB tests remain a future enhancement.
- Blockers: None.
- Next step: Add integration test lane for PostGIS-backed geometry normalization in staging CI.

### 2026-04-07 (phase 10)
- Focus: Add PostGIS-backed integration test lane for spatial validation.
- Files changed: `tracebud-backend/package.json`, `tracebud-backend/src/plots/plots.postgis.int.spec.ts`, `product-os/04-quality/qa-scenarios.md`.
- Decisions: Added `test:integration` script and environment-gated integration tests (`TEST_DATABASE_URL`) for geography area and invalid polygon normalization checks.
- Risks: Integration suite is skipped without `TEST_DATABASE_URL`; CI environment wiring is required for full execution.
- Blockers: None.
- Next step: Wire `TEST_DATABASE_URL` in CI/staging pipeline and enforce `npm run test:integration` as a required gate for spatial changes.

### 2026-04-07 (phase 11)
- Focus: Wire CI enforcement for backend PostGIS integration tests.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-checklist.md`.
- Decisions: Backend CI job now runs unit tests plus integration tests and fails fast if `TEST_DATABASE_URL` is not configured.
- Risks: CI will fail until repository secrets include a valid `TEST_DATABASE_URL`.
- Blockers: Pending secret provisioning in CI environment.
- Next step: Add `TEST_DATABASE_URL` secret in GitHub Actions settings and validate end-to-end pipeline on next PR.

### 2026-04-08 (spec cleanup)
- Focus: Remove historical critique noise from canonical spec and keep v1.6 file execution-focused.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`, `docs/archive/v1-5-redline-critique.md`.
- Decisions: Archived v1.5 redline critique into `docs/archive` and kept canonical spec as normative v1.6 content only.
- Risks: Any links that referenced the old in-file critique block should now point to the archive doc.
- Blockers: None.
- Next step: Optionally rename canonical spec filename to v1.6 and update references across rules/commands.

### 2026-04-08 (spec execution board + P2 hardening)
- Focus: Convert proposed task list into sprint-ready execution board and apply non-blocking P2 spec hardening.
- Files changed: `product-os/01-roadmap/v1-6-spec-execution-board.md`, `TRACEBUD_V1_2_EUDR_SPEC.md`, `product-os/06-status/current-focus.md`.
- Decisions: Added execution board by priority/owner/dependency and implemented spec additions for API error taxonomy, notification delivery model, JSONB canonical contracts, Stripe integration section, portability export schema, audit partitioning strategy, and risk intersection scoring.
- Risks: Some values remain provisional pending external inputs (TRACES exact XSD mapping, verified benchmark source values, Stripe live IDs, approved EU regions).
- Blockers: External decision gates P1-01..P1-05 still open.
- Next step: Resolve P1 gates, then replace provisional spec placeholders with externally verified values via P3 tasks.

### 2026-04-08 (spec sections 51-55 + priority-0 gate)
- Focus: Add final structural sections 51-55, extend open questions, and add Priority 0 human-only prerequisites before engineering use.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`, `product-os/01-roadmap/v1-6-spec-execution-board.md`, `product-os/01-roadmap/contradiction-log.md`.
- Decisions: Added MVP deadline phasing, commodity-specific due diligence model, data-reality constraints, continuity/escrow obligations, and internal consistency validation rules; introduced Priority 0 gates (full contradiction review, external legal opinion, 3-month pilot).
- Risks: New section mandates create additional unresolved external dependencies (OQ-09, OQ-10) and reinforce legal gating before implementation.
- Blockers: Priority 0 tasks are unresolved and must be completed before using the spec as an engineering execution baseline.
- Next step: Execute P0-01 contradiction review using `product-os/01-roadmap/contradiction-log.md`, then commission P0-02 counsel opinion.

### 2026-04-08 (P0-01 contradiction pass 2 — state machines)
- Focus: Run contradiction sweep pass focused on state-machine and lifecycle consistency for shipment, DDS, requests, and compliance issues.
- Files changed: `product-os/01-roadmap/contradiction-log.md`, `product-os/06-status/current-focus.md`.
- Decisions: Logged CL-013..CL-016 covering missing/weak lifecycle contracts (manual hold issue ownership fields, shipment package transitions, requests transitions, compliance issue open/escalation semantics).
- Risks: Without lifecycle normalization, services may implement divergent transition behavior and create audit/regulatory inconsistencies.
- Blockers: None (analysis complete); resolution drafting still pending section-level spec edits.
- Next step: Execute pass 3 (API contract vs schema vs RBAC) and then prepare a single normalization patch set for all OPEN CL items accepted by owners.

### 2026-04-08 (P0-01 contradiction pass 3 — API vs RBAC vs schema)
- Focus: Validate API endpoint coverage and contract completeness against RBAC actions and schema-backed workflows.
- Files changed: `product-os/01-roadmap/contradiction-log.md`, `product-os/06-status/current-focus.md`.
- Decisions: Logged CL-017..CL-020 covering missing endpoint contracts for compliance issue lifecycle and review workflows, billing-permission/API mismatch, and missing per-endpoint auth/idempotency/schema details despite Section 32 template requirement.
- Risks: API implementation may diverge by team if unresolved, creating authorization gaps and non-uniform error/idempotency behavior.
- Blockers: None (analysis complete); owner-level acceptance of contradictions required before spec patching.
- Next step: Run Pass 4 normalization drafting and apply accepted CL resolutions directly in `TRACEBUD_V1_2_EUDR_SPEC.md`.

### 2026-04-08 (P0-01 contradiction pass 4 — normalization patch)
- Focus: Apply normalization patch in canonical spec for state-machine and API/RBAC contradictions logged as CL-013..CL-020.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`, `product-os/01-roadmap/contradiction-log.md`, `product-os/06-status/current-focus.md`.
- Decisions: Added request/compliance issue lifecycle contracts, shipment package transition map, `yield_exception_requests.appeal_task_id`, expanded API endpoint groups for review/compliance/billing workflows, and added minimum endpoint contract matrix with auth/idempotency/request/response fields.
- Risks: Endpoint matrix currently covers minimum mandatory routes, not yet full exhaustive per-route contract blocks for every path in Section 32.6.
- Blockers: None.
- Next step: Execute CL-001..CL-012 closure pass and align any remaining TOC/scope/export contradictions with the same normalization pattern.

### 2026-04-08 (P0-01 contradiction pass 5 — CL-001..CL-012 closure)
- Focus: Close remaining contradiction batch by normalizing schema/API/scope wording and aligning MVP gates with phase criteria.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`, `product-os/01-roadmap/contradiction-log.md`, `product-os/06-status/current-focus.md`.
- Decisions: Added `PROCESSING_FACILITY` lineage support + manifest evidence field, added canonical `enterprise_size_assessments` schema, introduced explicit MVP-vs-full-v1 acceptance-gate applicability, narrowed Section 17 MVP subset, added full compliance export API endpoints/contracts, clarified TRACES drift blocking to `API_DIRECT` only, and aligned import dedup thresholds with missing-ID policy.
- Risks: Section 32 still has a mixed style (endpoint groups + minimum matrix) and may need future expansion to fully detailed per-endpoint contract blocks for every route.
- Blockers: None.
- Next step: Optional polish pass to harmonize Section 32 formatting and convert all OPEN questions tied to external dependencies into tracked decision tickets.

### 2026-04-08 (Section 32 harmonization pass)
- Focus: Normalize API contract presentation so every endpoint listed in Section 32.6 uses one consistent mini-contract row style.
- Files changed: `TRACEBUD_V1_2_EUDR_SPEC.md`.
- Decisions: Replaced the partial/minimum matrix with a full endpoint contract catalog covering all listed routes with standardized columns (`Auth scope`, `Idempotency`, `Request schema`, `Success response`).
- Risks: Catalog is intentionally concise and may still require per-endpoint deep payload examples in implementation-phase API docs.
- Blockers: None.
- Next step: If needed, generate OpenAPI-aligned contract artifacts from Section 32 catalog as implementation input.

### 2026-04-08 (OpenAPI draft generation)
- Focus: Create machine-readable API contract draft from Section 32.8 endpoint catalog.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Added OpenAPI 3.0.3 draft with all Section 32.6 routes, standard auth/idempotency handling, and baseline response/error envelopes.
- Risks: Request/response schemas are intentionally minimal for speed and require endpoint-by-endpoint tightening before implementation lock.
- Blockers: None.
- Next step: Align each operation schema with database constraints, state-machine rules, and canonical enum sets from Sections 8-17.

### 2026-04-08 (OpenAPI tightening pass 1)
- Focus: Tighten high-risk API schemas in OpenAPI draft using canonical enums and lifecycle constraints from spec sections 8-17.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`.
- Decisions: Added canonical enum schemas (request types, consent purpose codes, geolocation modes, shipment/DDS/compliance statuses), conditional requirement for processing-facility batch inputs, and specific request/response schemas for compliance issues, DDS, shipment seal, dedup decisions, and yield exception decisions.
- Risks: Remaining endpoints still use generic payload objects and need full field-level schema hardening in a second pass.
- Blockers: None.
- Next step: Complete schema tightening for onboarding, portability/compliance exports, billing/webhooks, and add endpoint examples + error-code mappings.

### 2026-04-08 (OpenAPI tightening pass 2)
- Focus: Replace remaining generic payloads for shipment/sync/portability/export/billing/webhook routes and improve error contract explicitness.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`.
- Decisions: Added dedicated request schemas for shipment header/line, sync flush/conflict resolution, portability and compliance exports, annual reporting generation, payment method creation, and webhook registration; added reusable `Conflict` and `UnprocessableEntity` responses and wired them to critical state-transition operations; added top-level error-code mapping extension aligned to Section 32.10 taxonomy.
- Risks: Some endpoints still intentionally use flexible object payloads for list/export responses until backend DTO contracts are finalized.
- Blockers: None.
- Next step: Add per-operation request/response examples and map expected error codes per endpoint in `x-error-codes` extensions.

### 2026-04-08 (dashboard canonical-state alignment pass 1)
- Focus: Align high-impact dashboard runtime types/components to canonical v1.6 status and request taxonomy after latest v0 import.
- Files changed: `apps/dashboard-product/types/index.ts`, `apps/dashboard-product/components/ui/status-chip.tsx`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/components/dashboards/exporter-dashboard.tsx`.
- Decisions: Replaced legacy/non-canonical shipment/DDS/compliance/request status unions with canonical sets, updated shared `StatusChip` to canonical labels, normalized request campaign statuses/types to spec-compatible values, and remapped exporter dashboard stage chips to canonical statuses.
- Risks: Supporting design/reference docs in `apps/dashboard-product/*.md` and `lib/audit-events.ts` still contain legacy naming and should be aligned in a second pass to avoid future regression by regeneration prompts.
- Blockers: None.
- Next step: Run alignment pass 2 on `lib/audit-events.ts` plus design-spec markdown files so generated UI and analytics events remain canonically consistent.

### 2026-04-08 (dashboard canonical-state alignment pass 2)
- Focus: Eliminate legacy status/role vocabulary in audit payload definitions and dashboard design artifacts that drive future v0 generations.
- Files changed: `apps/dashboard-product/lib/audit-events.ts`, `apps/dashboard-product/UX_POLISH_SPECIFICATION.md`, `apps/dashboard-product/V1_REMEDIATION_BLUEPRINT.md`, `apps/dashboard-product/GRADING_ANALYSIS.md`.
- Decisions: Updated request campaign event naming to `STARTED/COMPLETED/PARTIAL`, aligned request type enums to canonical Section 17 vocabulary, normalized shipment/compliance status references in design docs to canonical enums, and updated grading notes to reflect current canonical-role baseline.
- Risks: `apps/dashboard-product/types/index.ts` still contains some intentional compatibility scaffolding/legacy aliases and should be pruned in a dedicated cleanup pass after UI merge stabilizes.
- Blockers: None.
- Next step: run a compatibility-cleanup pass to remove deprecated aliases and update `lib/audit-events.ts` consumers accordingly.

### 2026-04-09 (dashboard resume: inbox/demo hardening)
- Focus: Resume dashboard-product demo slice and close reliability gaps in cooperative inbox, demo readiness controls, and auth loading recovery.
- Files changed: `apps/dashboard-product/app/inbox/page.tsx`, `apps/dashboard-product/app/demo-readiness/page.tsx`, `apps/dashboard-product/lib/auth-context.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit async state transitions and retry-safe UI feedback for inbox response/evidence actions and demo bootstrap actions; emitted audit events for key actions to preserve operational traceability.
- Risks: Inbox data is still mock-seeded and not yet connected to backend request entities, so audit entity IDs are currently demo-local.
- Blockers: None.
- Next step: Wire cooperative inbox actions to backend request/evidence endpoints and replace mock request list with tenant-isolated API data.

### 2026-04-09 (dashboard resume: tenant-scoped inbox data service)
- Focus: Replace inbox page mock requests with tenant-scoped request data service and reactive hook.
- Files changed: `apps/dashboard-product/lib/request-service.ts`, `apps/dashboard-product/lib/use-requests.ts`, `apps/dashboard-product/app/inbox/page.tsx`, `apps/dashboard-product/lib/demo-bootstrap.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Introduced in-memory request service APIs (`listInboxRequests`, `respondToInboxRequest`) with subscription updates and tenant isolation by `recipient_tenant_id`; wired seed/reset flows into demo bootstrap so readiness actions now include request state.
- Risks: This is still local service-backed state (no external API persistence) and should be swapped to backend endpoints in the next slice.
- Blockers: None.
- Next step: Add backend request/evidence endpoints and switch `useInboxRequests` data source from local service to API calls without changing page-level UX contract.

### 2026-04-09 (dashboard resume: inbox API endpoints + hook migration)
- Focus: Migrate inbox request reads/actions to API endpoints while preserving `useInboxRequests` contract and demo UX.
- Files changed: `apps/dashboard-product/app/api/inbox-requests/route.ts`, `apps/dashboard-product/app/api/inbox-requests/[id]/respond/route.ts`, `apps/dashboard-product/app/api/inbox-requests/bootstrap/route.ts`, `apps/dashboard-product/lib/use-requests.ts`, `apps/dashboard-product/lib/demo-bootstrap.ts`, `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/demo-readiness/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Added API layer for tenant-scoped inbox listing/respond action and switched hook to API-first with local fallback; demo bootstrap now syncs request seed/reset to API bootstrap endpoint.
- Risks: Endpoints currently use in-process in-memory storage and are not yet persisted to the main backend datastore.
- Blockers: None.
- Next step: Move inbox request persistence to `tracebud-backend` storage and point API routes to backend service calls.

### 2026-04-09 (dashboard resume: tracebud-backend inbox persistence path)
- Focus: Add backend inbox-request service/controller/module and proxy dashboard API routes to backend for persistent storage path.
- Files changed: `tracebud-backend/src/inbox/inbox.module.ts`, `tracebud-backend/src/inbox/inbox.service.ts`, `tracebud-backend/src/inbox/inbox.controller.ts`, `tracebud-backend/src/app.module.ts`, `apps/dashboard-product/app/api/inbox-requests/route.ts`, `apps/dashboard-product/app/api/inbox-requests/[id]/respond/route.ts`, `apps/dashboard-product/app/api/inbox-requests/bootstrap/route.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Backend now persists inbox snapshots in `audit_log` as immutable `inbox_requests_snapshot` events and exposes `/api/v1/inbox-requests` list/respond/bootstrap endpoints; dashboard routes call backend via `TRACEBUD_BACKEND_URL` and safely fallback to local service if unavailable.
- Risks: Backend lint baseline still contains unrelated pre-existing violations; full backend lint does not pass globally yet.
- Blockers: `TRACEBUD_BACKEND_URL` must be configured in dashboard runtime to activate backend proxy path.
- Next step: add dedicated request tables/DTOs in backend schema (replacing snapshot-in-audit-log approach) and enforce authenticated tenant claims on backend inbox endpoints.

### 2026-04-09 (dashboard resume: backend tenant-auth enforcement)
- Focus: Enforce tenant context from authenticated backend user claims and remove tenant trust from client payload/query in inbox endpoints.
- Files changed: `tracebud-backend/src/inbox/inbox.controller.ts`, `tracebud-backend/src/inbox/inbox.service.ts`, `apps/dashboard-product/lib/use-requests.ts`, `apps/dashboard-product/lib/demo-bootstrap.ts`, `apps/dashboard-product/app/api/inbox-requests/route.ts`, `apps/dashboard-product/app/api/inbox-requests/[id]/respond/route.ts`, `apps/dashboard-product/app/api/inbox-requests/bootstrap/route.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Backend inbox list/respond now derive tenant from auth profile (`app_metadata`/`user_metadata`/mapped demo emails) under `SupabaseAuthGuard`; dashboard API routes now forward bearer tokens to backend, while fallback local behavior remains for offline/demo continuity.
- Risks: Demo session tokens (`demo_token_*`) are not valid Supabase JWTs, so backend auth path will activate only with real bearer tokens unless local fallback is used.
- Blockers: None.
- Next step: replace email-based tenant fallback mapping with signed tenant claims only, and move inbox state from audit snapshots to dedicated relational tables.

### 2026-04-09 (dashboard resume: role naming UX pass)
- Focus: Align user-facing role/dashboard naming to product language (`Producer`, `Supplier`, `Buyer`, `Sponsor`, `Reviewer`) without changing internal role keys.
- Files changed: `apps/dashboard-product/lib/rbac.ts`, `apps/dashboard-product/components/common/role-badge.tsx`, `apps/dashboard-product/app/login/page.tsx`, `apps/dashboard-product/components/layout/app-header.tsx`, `apps/dashboard-product/components/layout/app-sidebar.tsx`, `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/demo-readiness/page.tsx`, `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/components/auth/login-form.tsx`, `product-os/02-features/FEAT-008-dashboards.md`.
- Decisions: Kept authorization/state model stable (`TenantRole` keys unchanged) and applied naming only in display layers to minimize regression risk.
- Risks: Some long-tail copy in markdown/spec artifacts may still use legacy terms and can be harmonized in a docs-only sweep.
- Blockers: None.
- Next step: run a global copy/style pass for remaining legacy role terms in non-functional docs and helper text.

### 2026-04-09 (dashboard resume: legacy wording cleanup sweep)
- Focus: Harmonize remaining legacy role copy in active dashboard UI/help artifacts after initial label pass.
- Files changed: `apps/dashboard-product/DEMO_RUNBOOK.md`, `apps/dashboard-product/DEMO_READINESS_CHECKLIST.md`, `apps/dashboard-product/app/inbox/page.tsx`, `apps/dashboard-product/app/demo-readiness/page.tsx`, `apps/dashboard-product/app/settings/page.tsx`, `apps/dashboard-product/components/dashboard/sidebar.tsx`, `apps/dashboard-product/app/harvests/new/page.tsx`, `apps/dashboard-product/app/packages/new/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated role wording in runbook/checklist and visible page copy to Producer/Supplier/Buyer/Sponsor/Reviewer while preserving canonical internal keys and seed persona emails.
- Risks: Deep historical artifacts (`DESIGN_AUDIT.md`, `MVP_GAP_ANALYSIS.md`) still contain legacy terminology and may require a docs-only migration pass to fully normalize repository language.
- Blockers: None.
- Next step: optional docs-only pass for legacy terminology in archived/design analysis markdown files.

### 2026-04-09 (dashboard resume: historical docs terminology migration)
- Focus: Execute docs-only normalization in historical dashboard markdown docs to complete role-language migration.
- Files changed: `apps/dashboard-product/DESIGN_AUDIT.md`, `apps/dashboard-product/MVP_GAP_ANALYSIS.md`, `apps/dashboard-product/V1_REMEDIATION_BLUEPRINT.md`, `apps/dashboard-product/GRADING_ANALYSIS.md`, `apps/dashboard-product/REQUIREMENTS.md`, `apps/dashboard-product/DASHBOARD_MVP_PLAN.md`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/done-log.md`.
- Decisions: Replaced legacy role wording (Exporter/Importer/Cooperative/Sponsor Org/Country Reviewer) with Producer/Supplier/Buyer/Sponsor/Reviewer in non-functional markdown artifacts; restored literal example email addresses where terminology replacement accidentally altered domains.
- Risks: Because this pass was lexical and docs-only, some context may still intentionally reference canonical legal terms in quoted spec excerpts.
- Blockers: None.
- Next step: optional editorial pass to tune sentence-level readability where term substitutions made long legacy paragraphs less natural.

### 2026-04-09 (dashboard resume: docs readability polish)
- Focus: Editorially polish the two highest-impact historical docs after terminology replacement.
- Files changed: `apps/dashboard-product/DESIGN_AUDIT.md`, `apps/dashboard-product/MVP_GAP_ANALYSIS.md`.
- Decisions: Smoothed role-section headings and role references for readability (e.g., SUPPLIER/BUYER/PRODUCER/REVIEWER nav blocks, reviewer queue wording) while preserving internal-key notes where relevant.
- Risks: Remaining historical docs may still benefit from sentence-level polishing, but terminology consistency is now stable.
- Blockers: None.
- Next step: optional final copyedit pass for style/tone consistency across all dashboard markdown artifacts.

### 2026-04-09 (dashboard resume: final markdown style pass)
- Focus: Apply final tone/readability normalization on remaining dashboard markdown docs after terminology migration.
- Files changed: `apps/dashboard-product/V1_REMEDIATION_BLUEPRINT.md`, `apps/dashboard-product/DASHBOARD_MVP_PLAN.md`, `apps/dashboard-product/GRADING_ANALYSIS.md`.
- Decisions: Applied non-functional wording cleanup only (sentence flow, heading casing consistency, component naming consistency in documentation) without changing technical requirements or implementation scope.
- Risks: None material; changes are editorial and docs-only.
- Blockers: None.
- Next step: Switch focus to next engineering task.

### 2026-04-09 (strategy handoff: 1-week hardening plan)
- Focus: Define next strategic execution plan to productionize tenant/auth boundaries and stabilize dashboard-backend integration.
- Files changed: `product-os/01-roadmap/dashboard-auth-tenant-hardening-week-plan.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Created TB-DBX-001..004 ticket pack with owners/estimates/dependencies/acceptance/tests covering claim-only tenant resolution, dedicated inbox persistence, golden-path integration tests, and MVP gate enforcement.
- Risks: Delivery risk depends on auth claim readiness and backend schema migration sequencing.
- Blockers: None.
- Next step: Start TB-DBX-001 implementation and wire CI checks for cross-tenant access denial tests.

### 2026-04-09 (execution: TB-DBX-001 signed-claim tenant enforcement)
- Focus: Enforce signed tenant claims in backend inbox endpoints and preserve backend auth semantics in dashboard proxy routes.
- Files changed: `tracebud-backend/src/inbox/inbox.controller.ts`, `apps/dashboard-product/app/api/inbox-requests/route.ts`, `apps/dashboard-product/app/api/inbox-requests/[id]/respond/route.ts`, `apps/dashboard-product/app/api/inbox-requests/bootstrap/route.ts`, `apps/dashboard-product/lib/use-requests.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Removed email-based tenant fallback and root tenant fallback from backend inbox auth path; tenant claim now required for list/respond/bootstrap via signed claim lookup; dashboard proxy now forwards auth and returns backend `401/403` responses directly instead of masking with local fallback.
- Risks: Demo `demo_token_*` values remain non-Supabase JWTs, so backend-auth path still requires real signed tokens outside fallback/demo mode.
- Blockers: None.
- Next step: Execute TB-DBX-002 (replace inbox snapshot persistence with dedicated relational request tables).

### 2026-04-09 (execution: TB-DBX-002 dedicated inbox tables)
- Focus: Replace inbox snapshot-in-audit persistence with dedicated tenant-scoped request/event tables while preserving dashboard API contracts.
- Files changed: `tracebud-backend/src/inbox/inbox.service.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added schema bootstrap for `inbox_requests` + `inbox_request_events`, tenant-scoped indexes, idempotent respond transition handling, and explicit audit emission (`inbox_requests_seeded`, `inbox_request_responded`) for state-changing operations.
- Risks: Current table DDL is service-managed (`CREATE TABLE IF NOT EXISTS`) and should be moved to formal migration artifacts before production rollout.
- Blockers: None.
- Next step: Execute TB-DBX-003 integration tests for role/state/tenant boundaries across dashboard-backend lane.

### 2026-04-09 (execution: TB-DBX-003 inbox role/state/tenant tests)
- Focus: Add golden-path tenant and state boundary tests for inbox paths.
- Files changed: `tracebud-backend/src/inbox/inbox.service.int.spec.ts`, `tracebud-backend/src/inbox/inbox.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added env-gated integration tests for tenant-scoped list/respond flows and idempotency; added controller-level auth claim enforcement tests for missing tenant claim and exporter-only bootstrap policy.
- Risks: Full DB-backed integration coverage executes only when `TEST_DATABASE_URL` is configured in CI/local test env.
- Blockers: None.
- Next step: Wire `TEST_DATABASE_URL` in CI lane for mandatory execution and expand role-path tests across shipment/reviewer/sponsor endpoints.

### 2026-04-09 (execution: TB-DBX-004 MVP route/feature gating)
- Focus: Freeze deferred post-MVP dashboard routes behind explicit feature flags with navigation + route-entry enforcement.
- Files changed: `apps/dashboard-product/lib/feature-gates.ts`, `apps/dashboard-product/lib/rbac.ts`, `apps/dashboard-product/middleware.ts`, `product-os/01-roadmap/dashboard-mvp-feature-gates.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added central gate registry and default-disabled flags for deferred routes (`/requests`, `/reports`); gated sidebar visibility via RBAC; blocked direct deep-link access via middleware redirect when feature flags are off.
- Risks: Route gating currently covers deferred routes present in this dashboard package; additional Release 2+ screens should be appended to the same registry as they are introduced.
- Blockers: None.
- Next step: Add CI assertions for "deferred route inaccessible" in dashboard lane and extend gate registry as new deferred routes are added.

### 2026-04-09 (execution: TB-DBX-004 gate assertions)
- Focus: Add automated dashboard assertions for deferred-route accessibility under MVP/default and enabled-flag modes.
- Files changed: `apps/dashboard-product/package.json`, `apps/dashboard-product/lib/feature-gates.ts`, `apps/dashboard-product/middleware.ts`, `apps/dashboard-product/lib/feature-gates.test.ts`, `apps/dashboard-product/middleware.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Introduced Vitest in dashboard package and added tests validating default-disabled behavior for `/requests` and `/reports`, enabled-flag behavior, and middleware redirect decision logic.
- Risks: Test lane is currently package-local; CI wiring is still needed if dashboard tests should become mandatory in pipeline.
- Blockers: None.
- Next step: Wire dashboard `npm test` into CI and extend gate assertions as additional deferred routes are added.

### 2026-04-09 (execution: TB-DBX-004 CI enforcement)
- Focus: Make dashboard feature-gate tests a required CI lane.
- Files changed: `.github/workflows/ci.yml`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `dashboard` CI job in root workflow, running `npm install` and `npm test` in `apps/dashboard-product` using cached npm dependencies.
- Risks: CI runtime increases slightly due to additional job.
- Blockers: None.
- Next step: Extend dashboard test suite to cover newly deferred routes as they are introduced.

### 2026-04-13 (founder-os foundation slice)
- Focus: Add Founder OS data model, SQL functions, seed templates, and safe website lead mirroring for outreach intelligence and content cadence.
- Files changed: `supabase/migrations/20260413_001_founder_os_tables.sql`, `supabase/migrations/20260413_002_founder_os_functions.sql`, `supabase/seeds/20260413_001_founder_os_seed.sql`, `supabase/README.md`, `apps/marketing/lib/founder-os-mapper.ts`, `apps/marketing/app/api/leads/route.ts`, `apps/marketing/README.md`, `automation/n8n/founder-os/*`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Existing per-form lead tables remain canonical intake path; Founder OS writes run as additive mirror (`prospects`, `outreach_activity`) with best-effort resilience to avoid breaking active forms during rollout.
- Risks: Founder OS mirror inserts require new tables/functions to be deployed first in Supabase; until migration application, mirror path will warn and skip while intake still succeeds.
- Blockers: None.
- Next step: Apply migrations + seeds in Supabase, validate daily/content function outputs with real data, then scaffold dashboard CRM/content pages behind explicit permissions.

### 2026-04-13 (founder-os dashboard phase 4)
- Focus: Deliver lightweight internal Founder OS dashboard modules with API routes, hooks, and role-gated navigation.
- Files changed: `apps/dashboard-product/app/api/crm/*`, `apps/dashboard-product/app/api/content/*`, `apps/dashboard-product/lib/supabase-admin.ts`, `apps/dashboard-product/lib/crm-service.ts`, `apps/dashboard-product/lib/content-service.ts`, `apps/dashboard-product/lib/use-crm.ts`, `apps/dashboard-product/lib/use-content.ts`, `apps/dashboard-product/app/crm/*`, `apps/dashboard-product/app/content/*`, `apps/dashboard-product/lib/rbac.ts`, `apps/dashboard-product/types/index.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Exposed minimal founder UI slice first (prospects, daily actions, templates, calendar, tasks, review) using additive Supabase-backed API routes and existing dashboard architecture, with nav visibility scoped to sponsor role path.
- Risks: API routes currently assume valid Supabase env vars and table availability in dashboard runtime; if absent, pages return explicit API errors.
- Blockers: None.
- Next step: Add task/action analytics events and tighten permission split for read vs write actions if founder access expands beyond sponsor role.

### 2026-04-13 (founder-os lite execution loop)
- Focus: Narrow Founder OS to a founder-operating system with explicit daily/weekly targets and exchange tracking.
- Files changed: `apps/dashboard-product/app/founder-os/page.tsx`, `apps/dashboard-product/components/layout/founder-os-shell.tsx`, `apps/dashboard-product/app/founder-os/crm/daily-actions/page.tsx`, `apps/dashboard-product/app/founder-os/crm/prospects/page.tsx`, `apps/dashboard-product/app/founder-os/content/calendar/page.tsx`, `apps/dashboard-product/app/api/crm/daily-actions/route.ts`, `apps/dashboard-product/app/api/crm/exchanges/route.ts`, `apps/dashboard-product/app/api/content/calendar/route.ts`, `apps/dashboard-product/lib/crm-service.ts`, `apps/dashboard-product/lib/content-service.ts`, `apps/dashboard-product/lib/use-crm.ts`, `apps/dashboard-product/lib/use-content.ts`, `apps/dashboard-product/types/index.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: Enforced simple operating targets in product surface (3 outreach weekday actions/day, 2 posts/week), added bootstrap planners for missing actions/posts, and introduced per-person outreach exchange logs to keep conversation context auditable and actionable.
- Risks: Planner currently assumes single-operator context (`owner=raph`) and generic priority heuristics; multi-operator scoring and analytics events remain follow-up work.
- Blockers: None.
- Next step: Add analytics event emission for plan bootstrap/action completion and introduce weekly review streak signals.

### 2026-04-13 (execution: backend report role boundary hardening)
- Focus: tighten MVP authorization boundaries by enforcing explicit role checks on report exports.
- Files changed: `tracebud-backend/src/reports/reports.controller.ts`, `tracebud-backend/src/reports/reports.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added exporter-only guard logic inside reports controller methods and regression tests for deny (farmer/agent) and allow (exporter) paths.
- Risks: Report endpoints still filter by `farmerId` query; full tenant-claim scoping for non-inbox modules remains an open hardening lane.
- Blockers: None.
- Next step: Extend signed-tenant-claim and cross-tenant denial patterns into additional backend modules (reports/harvest/plots) where tenant context is currently query-driven.

### 2026-04-13 (execution: harvest/plots farmer scope enforcement)
- Focus: extend cross-tenant denial coverage beyond inbox/reports by enforcing farmer ownership on farmerId/plotId-driven endpoints.
- Files changed: `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added ownership-check helpers against `farmer_profile.user_id` and enforced them for farmer-role calls on harvest create/list and plot list/mutation/history paths; tightened harvest package list/detail/TRACES export access to exporter role only.
- Risks: Ownership checks are currently controller-level and role-conditional; full service-layer tenant-claim propagation and DB-level row security remain future hardening lanes.
- Blockers: None.
- Next step: Add integration tests using `TEST_DATABASE_URL` fixtures to validate farmer-ownership deny paths and exporter allow paths through real DB joins.

### 2026-04-13 (execution: ownership integration fixtures)
- Focus: add DB-backed integration coverage for newly introduced farmer ownership join checks.
- Files changed: `tracebud-backend/src/harvest/ownership-scope.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added env-gated integration tests that use an isolated schema (`tb_scope_test`) and minimal fixture tables to validate `isFarmerOwnedByUser` and `isPlotOwnedByUser` behavior against real Postgres joins without polluting shared tables.
- Risks: In local environments without `TEST_DATABASE_URL`, integration suite remains skipped; CI execution with DB secret remains required for enforcement.
- Blockers: None.
- Next step: Add controller/API-level integration assertions (not only service helper joins) for deny/allow ownership paths under DB-enabled CI.

### 2026-04-13 (execution: controller ownership integration fixtures)
- Focus: add DB-backed controller-level integration assertions for farmer scope deny/allow paths.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added env-gated integration test with isolated schema (`tb_controller_scope_test`) validating `HarvestController.listVouchers`, `PlotsController.listByFarmer`, and `PlotsController.updateMetadata` deny/allow behavior through real ownership joins.
- Risks: Local runs without `TEST_DATABASE_URL` still skip integration suites; CI DB-backed execution remains the enforcement path.
- Blockers: None.
- Next step: Add CI-level evidence step/reporting for ownership integration slices and expand to package/report endpoints with full tenant-claim fixture coverage.

### 2026-04-13 (execution: ownership CI evidence gate)
- Focus: make ownership integration execution explicit and required in CI.
- Files changed: `tracebud-backend/package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dedicated script `test:integration:ownership` and a required backend CI step `Ownership integration tests (required)` after baseline integration tests.
- Risks: Without `TEST_DATABASE_URL`, ownership integration suites remain skipped locally; CI secret remains mandatory for non-skipped execution.
- Blockers: None.
- Next step: Extend explicit CI integration gate pattern to additional tenant-claim API slices (reports/harvest package/export paths) and capture pass/fail metrics in release QA artifacts.

### 2026-04-13 (execution: signed tenant-claim expansion to harvest/plots/reports)
- Focus: enforce signed tenant claim requirement consistently across additional authenticated backend controllers.
- Files changed: `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/reports/reports.controller.ts`, `tracebud-backend/src/reports/reports.controller.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `tenant_id`-claim requirement checks in controller entry paths and updated regression suites to explicitly validate missing-claim denial while preserving role/scope checks.
- Risks: Some authenticated endpoints may still rely on role checks without explicit tenant-claim enforcement and require follow-up inventory.
- Blockers: None.
- Next step: complete endpoint inventory for missing claim checks and add DB-backed API integration tests for package/report export paths under tenant-claim policy.

### 2026-04-13 (execution: audit tenant-claim closure)
- Focus: close remaining authenticated-controller tenant-claim gap discovered by controller inventory.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added signed `tenant_id` claim requirement for `AuditController.create` and `AuditController.list`; added regression tests for missing-claim denial and allow path when claim is present.
- Risks: API-level integration coverage for package/report export paths under tenant-claim policy is still pending.
- Blockers: None.
- Next step: add DB-backed API integration tests for package/report export deny/allow paths with tenant-claim + role requirements.

### 2026-04-13 (execution: package/report export access integration)
- Focus: add DB-backed API integration tests for export/report endpoints under combined tenant-claim + role policy.
- Files changed: `tracebud-backend/src/reports/package-report-access.int.spec.ts`, `tracebud-backend/package.json`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added isolated schema fixture test (`tb_api_access_test`) validating deny/allow for `HarvestController.getPackageTracesJson` and `ReportsController.plotsReport` across missing-claim, non-exporter, and exporter-with-claim paths; included test in required `test:integration:ownership` script.
- Risks: Local execution remains skipped without `TEST_DATABASE_URL`; CI execution is the enforcement path for non-skipped verification.
- Blockers: None.
- Next step: extend integration coverage to additional report/export surfaces and capture execution evidence in CI artifacts when DB-backed suites run.

### 2026-04-13 (execution: report harvest endpoint access coverage)
- Focus: extend DB-backed export/report access integration to include harvest report endpoint.
- Files changed: `tracebud-backend/src/reports/package-report-access.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Expanded deny/allow matrix in integration test to include `ReportsController.harvestsReport` with the same missing-claim, non-exporter, and exporter-with-claim policy assertions used for package TRACES export and plots report.
- Risks: Execution remains env-gated by `TEST_DATABASE_URL`; local runs still skip without DB secret.
- Blockers: None.
- Next step: add CI artifact evidence for non-skipped execution and extend access integration coverage to any remaining export/report surfaces.

### 2026-04-13 (execution: ownership CI evidence publishing)
- Focus: publish explicit CI evidence for ownership/access integration execution.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: updated ownership integration CI step to tee output to log file, append key test summary lines to `$GITHUB_STEP_SUMMARY`, and upload raw output artifact (`backend-ownership-integration-log`) for PR review/auditability.
- Risks: Evidence quality depends on DB-backed suite running non-skipped with `TEST_DATABASE_URL` in CI.
- Blockers: None.
- Next step: verify first CI run includes non-skipped ownership suites and attach screenshot/link to artifact in release QA notes.

### 2026-04-13 (execution: package list/detail access coverage)
- Focus: extend DB-backed package/report access integration to include package list and package detail endpoints.
- Files changed: `tracebud-backend/src/reports/package-report-access.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: expanded integration matrix to validate `HarvestController.listPackages` and `HarvestController.getPackage` deny/allow under missing-claim, non-exporter, and exporter-with-claim paths in the same fixture suite as TRACES and reports access tests.
- Risks: still env-gated by `TEST_DATABASE_URL`; local runs skip without DB secret.
- Blockers: None.
- Next step: validate first CI run with non-skipped ownership suite and archive evidence artifact link in release QA notes.

### 2026-04-13 (execution: ownership skip hard-fail gate)
- Focus: prevent silent CI pass when ownership integration suites are skipped.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`, `product-os/04-quality/qa-scenarios.md`.
- Decisions: Added CI check that fails ownership step if run output contains non-zero skipped counts; updated QA scenario to require non-skipped ownership/access policy suite execution evidence.
- Risks: If CI DB secret/config is missing or unstable, backend lane will fail by design until corrected.
- Blockers: None.
- Next step: run CI and record first non-skipped ownership evidence artifact link in QA notes.

### 2026-04-13 (execution: release QA evidence scaffold)
- Focus: create explicit release-QA evidence handoff template for ownership/access lane.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added structured evidence template with required fields for CI run URL, commit SHA, artifact URL, summary snapshot, and reviewer signoff.
- Risks: Template remains unpopulated until CI run with non-skipped DB-backed ownership suite is available.
- Blockers: Local environment lacks `TEST_DATABASE_URL`; cannot produce non-skipped local evidence.
- Next step: populate template from first successful CI run artifact (`backend-ownership-integration-log`) and mark reviewer decision.

### 2026-04-13 (validation: ownership non-skipped local execution)
- Focus: verify DB-backed ownership/access integration suites execute non-skipped locally with `TEST_DATABASE_URL`.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Confirmed local run executes all required suites with no skips (`3 passed suites`, `7 passed tests`) using inline `TEST_DATABASE_URL` injection from root `.env.local`.
- Risks: Release signoff still requires CI-hosted evidence (run URL + artifact link), not only local terminal output.
- Blockers: None.
- Next step: trigger CI on current branch and populate evidence template with CI run URL, artifact URL, and reviewer decision.

### 2026-04-14 (validation: ownership CI evidence captured)
- Focus: capture first CI-hosted non-skipped ownership/access run with artifact proof for release QA.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Verified backend CI run `24401646754` executes ownership integration lane non-skipped (`3 passed suites`, `7 passed tests`) and uploads artifact `backend-ownership-integration-log` (`6428758408`).
- Risks: CI still emits Node 20 deprecation warnings for `actions/checkout@v4` and `actions/setup-node@v4`; workflow runtime remains functional but should be upgraded before forced Node 24 cutoff.
- Blockers: None.
- Next step: complete reviewer signoff section in `product-os/04-quality/release-qa-evidence.md` and schedule CI action-runtime upgrade task.

### 2026-04-14 (follow-up: CI runtime modernization tracking)
- Focus: link post-merge CI deprecation cleanup work to explicit tracker item.
- Files changed: `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Opened issue #22 (`https://github.com/stlaurentraph-ux/tradebud.com/issues/22`) to remove Node 20 deprecation risk in GitHub Actions while preserving current CI lane behavior.
- Risks: None new; deprecation warning remains until issue #22 is implemented.
- Blockers: None.
- Next step: execute issue #22 in a workflow-only PR and verify warning-free CI runs.

### 2026-04-14 (execution: CI runtime modernization)
- Focus: implement issue #22 by updating CI action runtime settings and Node version baseline.
- Files changed: `.github/workflows/ci.yml`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added workflow-level `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` and upgraded CI job Node versions from 18 to 20 for backend/app lanes to align with dependency engine requirements and deprecation guidance.
- Risks: Expo lint lane may still surface package-specific Node constraints and should be validated in the next CI run.
- Blockers: None.
- Next step: run CI and confirm Node 20 deprecation warnings are removed while ownership evidence artifact behavior remains unchanged.

### 2026-04-14 (execution: Founder OS analytics + streak visibility)
- Focus: implement Founder OS Lite analytics instrumentation and cadence streak visibility in `Today` + daily actions workflow.
- Files changed: `apps/dashboard-product/app/founder-os/page.tsx`, `apps/dashboard-product/app/founder-os/crm/daily-actions/page.tsx`, `apps/dashboard-product/app/api/crm/daily-actions/route.ts`, `apps/dashboard-product/lib/crm-service.ts`, `apps/dashboard-product/lib/use-crm.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added history query mode (`historyDays`) for daily actions so outreach streak can be computed from recent data; reused existing audit event helper to emit founder analytics on plan bootstrap and completion actions.
- Risks: Streak values depend on historic data availability in `daily_actions`/calendar tables and weekday-only outreach cadence assumptions.
- Blockers: None.
- Next step: validate with seeded historical data and add small UI tests for streak rendering + planning/completion interaction.

### 2026-04-14 (execution: inbox backend-only hardening)
- Focus: prioritize customer product by removing dashboard inbox local fallback paths and enforcing backend-authoritative request operations.
- Files changed: `apps/dashboard-product/app/api/inbox-requests/route.ts`, `apps/dashboard-product/app/api/inbox-requests/[id]/respond/route.ts`, `apps/dashboard-product/app/api/inbox-requests/bootstrap/route.ts`, `apps/dashboard-product/lib/use-requests.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Inbox API routes now fail closed (`503`) when `TRACEBUD_BACKEND_URL` is absent and no longer read/write in-memory request-service data; client hook now reports API errors directly instead of fallbacking to local mock state.
- Risks: Local/demo sessions without backend connectivity will now show explicit errors until backend URL/auth is configured.
- Blockers: None.
- Next step: add regression tests for dashboard inbox API proxy routes to verify fail-closed behavior and auth header pass-through.

### 2026-04-14 (validation: inbox proxy regression coverage)
- Focus: add automated dashboard regression tests for inbox proxy fail-closed and auth pass-through behavior.
- Files changed: `apps/dashboard-product/app/api/inbox-requests/routes.test.ts`, `apps/dashboard-product/vitest.config.ts`, `apps/dashboard-product/app/founder-os/page.test.tsx`, `apps/dashboard-product/app/founder-os/crm/daily-actions/page.test.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Kept default Vitest environment as `node` for API route tests and pinned jsdom only on UI test files via per-file environment headers.
- Risks: None new.
- Blockers: None.
- Next step: extend inbox test matrix to include backend non-2xx propagation assertions for permission and tenant-claim failures.

### 2026-04-14 (validation: inbox proxy auth error propagation)
- Focus: extend inbox proxy route tests to verify backend denial semantics propagate unchanged.
- Files changed: `apps/dashboard-product/app/api/inbox-requests/routes.test.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added assertions for backend `401` and `403` responses (status + payload body) across list/respond/bootstrap routes.
- Risks: None.
- Blockers: None.
- Next step: add backend integration assertions that tie these denial payloads to signed tenant-claim and exporter-role policy branches.

### 2026-04-14 (validation: backend inbox controller denial/allow assertions)
- Focus: extend backend inbox controller tests to lock signed tenant-claim and exporter-role policy semantics.
- Files changed: `tracebud-backend/src/inbox/inbox.controller.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit assertions for missing tenant claim denial on `respond`, non-exporter bootstrap denial message, and positive bootstrap path for exporter with signed tenant claim.
- Risks: Existing unrelated backend tests still need separate stabilization (`audit.controller.spec.ts`, `harvest.controller.spec.ts`) when running broad `npm test` target.
- Blockers: None.
- Next step: add API-level integration assertions that validate end-to-end denial payload parity from backend controller through dashboard proxy.

### 2026-04-14 (stabilization: backend controller policy regressions)
- Focus: resolve backend unit test regressions in `audit` and `harvest` controllers while preserving tenant/role scope semantics.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Restored signed tenant-claim enforcement in `AuditController` create/list paths and restored farmer ownership enforcement in `HarvestController.create` plus tenant claim checks on create/createPackage/submitPackage.
- Risks: None new after validation (`npm test` now green for backend unit suite).
- Blockers: None.
- Next step: extend inbox API-level integration assertions from backend through dashboard proxy once DB-backed lane scope is finalized.

### 2026-04-14 (execution: inbox DB-backed controller integration)
- Focus: add DB-backed inbox controller integration assertions for signed tenant claim and bootstrap role policy.
- Files changed: `tracebud-backend/src/inbox/inbox.controller.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added env-gated controller integration suite validating deny/allow on list/respond/bootstrap with real Postgres-backed `InboxService` state and tenant-bound respond enforcement.
- Risks: Local run is skipped without `TEST_DATABASE_URL`; CI evidence is still required for non-skipped confirmation.
- Blockers: No DB URL in active local shell context for immediate non-skipped execution.
- Next step: run this suite in CI (or locally with `TEST_DATABASE_URL`) and attach non-skipped proof alongside existing ownership/access evidence.

### 2026-04-14 (execution: ownership CI lane expanded with inbox controller integration)
- Focus: make inbox DB-backed policy integration mandatory in the required ownership CI lane.
- Files changed: `tracebud-backend/package.json`, `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `src/inbox/inbox.controller.int.spec.ts` to `test:integration:ownership` runTestsByPath list and updated QA evidence requirements to expect the 4-spec ownership/access suite set.
- Risks: CI will now fail if inbox integration spec skips/fails, by design.
- Blockers: Need first CI run artifact proving non-skipped 4-suite execution for evidence refresh.
- Next step: run CI and update `release-qa-evidence.md` with new run URL/artifact and 4-suite summary snapshot.

### 2026-04-14 (stabilization: controller-scope schema reset)
- Focus: eliminate stale-schema foreign-key failures in `controller-scope.int.spec.ts` during full integration runs.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit `DROP SCHEMA IF EXISTS ... CASCADE` before schema creation in `beforeAll` to guarantee fresh relational metadata each run.
- Risks: Local verification of non-skipped behavior still depends on `TEST_DATABASE_URL` being loaded in current shell.
- Blockers: None.
- Next step: rerun full `test:integration` in the same DB-enabled shell and capture output for CI parity.

### 2026-04-14 (execution: automatic root env loading for backend integration tests)
- Focus: remove manual shell export friction for DB-backed backend integration commands.
- Files changed: `tracebud-backend/scripts/run-with-root-test-db.mjs`, `tracebud-backend/package.json`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added a Node runner that injects `TEST_DATABASE_URL` from root `.env.local` only when missing from current shell, and wired it into `test:integration` + `test:integration:ownership`.
- Risks: If `.env.local` is missing `TEST_DATABASE_URL`, env-gated integration specs will still skip (expected behavior).
- Blockers: None.
- Next step: capture CI evidence for the expanded 4-suite ownership lane and refresh `release-qa-evidence.md`.

### 2026-04-15 (validation + hardening: ownership evidence refresh and CI lane stability)
- Focus: refresh ownership/access QA evidence to 4-suite CI baseline and remove remaining backend/offline-product CI blockers.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`, `tracebud-backend/src/inbox/inbox.service.ts`, `tracebud-backend/src/inbox/inbox.service.int.spec.ts`, `apps/offline-product/app/(tabs)/index.tsx`, `apps/offline-product/app/documents.tsx`, `apps/offline-product/app/modal.tsx`, `apps/offline-product/app/plot/[id].tsx`.
- Decisions: Updated QA evidence to CI run `24407562162` + artifact `6431368794` (`4 suites`, `10 tests`) including inbox controller integration in required lane; hardened inbox schema bootstrapping with serialized verification and one-time undefined-table retry; removed remaining offline-product lint blockers and raised inbox service integration test timeout for stability.
- Risks: GitHub-hosted Node 20 action-runtime deprecation warning remains non-blocking and intentionally deferred.
- Blockers: None.
- Next step: merge branch and continue next customer-product slice with CI currently green on backend integration + offline-product lint lanes.

### 2026-04-15 (validation: dashboard role-path gate coverage)
- Focus: extend dashboard access-control regression coverage for mixed feature-gate states across role-specific navigation paths.
- Files changed: `apps/dashboard-product/lib/rbac.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added importer and country-reviewer role-path assertions under split gate toggles so deferred routes (`/requests`, `/reports`) remain role-aware and gate-aware in combination.
- Risks: None.
- Blockers: None.
- Next step: expand this same role-path matrix to runtime route-entry enforcement if role-aware middleware redirects are introduced.

### 2026-04-15 (validation: middleware gated-route context markers)
- Focus: strengthen runtime route-entry enforcement observability for deferred routes in dashboard middleware.
- Files changed: `apps/dashboard-product/middleware.ts`, `apps/dashboard-product/middleware.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Middleware redirect URLs now include explicit gate identifiers (`request_campaigns`/`annual_reporting`) in addition to `feature=mvp_gated`, while preserving existing query params; tests now assert both gate variants.
- Risks: None.
- Blockers: None.
- Next step: wire lightweight client analytics on homepage banner parsing (`feature` + `gate`) if we need aggregate counts of gated-entry attempts.

### 2026-04-15 (execution: dashboard gated-entry analytics capture)
- Focus: instrument dashboard landing to capture deferred-route redirect attempts for product diagnostics and gating analytics.
- Files changed: `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/lib/gated-entry-analytics.ts`, `apps/dashboard-product/lib/gated-entry-analytics.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added strict parser for redirect markers (`feature=mvp_gated` + known `gate`) and sessionStorage-based dedupe keying so analytics emits once per gate per session; dashboard overview now emits audit helper event with gate/role context when redirected.
- Risks: Event currently reuses existing audit event family (`ORG_SETTINGS_CHANGED`) as analytics transport and should move to a dedicated dashboard telemetry endpoint if backend audit ingestion becomes strict on event taxonomy.
- Blockers: None.
- Next step: add backend-facing analytics endpoint/event type for gated-entry tracking to avoid overloading generic organization settings events.

### 2026-04-15 (execution: dedicated dashboard gated-entry telemetry endpoint)
- Focus: replace reused audit-helper transport with a dedicated dashboard telemetry route and explicit event typing for deferred-route redirects.
- Files changed: `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/app/page.test.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `/api/analytics/gated-entry` POST route with payload validation (`feature`, `gate`, `tenantId`, `role`) and dedicated event type (`DASHBOARD_GATED_ENTRY_ATTEMPT`); switched landing-page telemetry emit to this route while preserving per-session dedupe.
- Risks: Route currently logs telemetry locally (`console.info`) and should be wired to persistent backend storage/stream in a follow-up slice.
- Blockers: None.
- Next step: connect gated-entry telemetry route to persistent backend sink (audit table or analytics stream) with tenant-authenticated ingestion semantics.

### 2026-04-15 (execution: gated-entry telemetry backend persistence proxy)
- Focus: connect dashboard gated-entry telemetry route to persistent backend ingestion with tenant-authenticated forwarding semantics.
- Files changed: `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/app/page.test.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Route now forwards validated telemetry to `${TRACEBUD_BACKEND_URL}/v1/audit` as `dashboard_gated_entry_attempt` payloads and passes through Authorization header; dashboard page now includes bearer token from `tracebud_token` when available; local console sink remains as explicit fallback only when backend URL is missing.
- Risks: Demo token values are non-Supabase JWTs, so backend auth may reject these in strict environments; production sessions with valid tokens are expected path.
- Blockers: None.
- Next step: add backend-side dedicated telemetry event taxonomy/table (or strict allowlist update) so dashboard gating analytics can be queried separately from generic audit events.

### 2026-04-15 (execution: backend gated-entry telemetry query surface)
- Focus: make gated-entry analytics queryable through a dedicated backend audit endpoint with tenant-safe filtering.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `GET /v1/audit/gated-entry` that enforces signed tenant claim and filters `audit_log` to `event_type='dashboard_gated_entry_attempt'` + matching payload `tenantId`; controller tests now cover missing-claim denial and tenant-filtered query behavior.
- Risks: Current persistence still relies on generic `audit_log` JSON payload fields and should evolve to dedicated analytics schema/indexes if query volume grows.
- Blockers: None.
- Next step: add integration coverage for gated-entry endpoint with real DB fixtures and consider indexing strategy for `(event_type, payload->>'tenantId')`.

### 2026-04-15 (validation: gated-entry telemetry DB integration coverage)
- Focus: add DB-backed integration coverage for tenant-safe gated-entry telemetry reads and fold it into required ownership lane execution.
- Files changed: `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `tracebud-backend/package.json`, `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added env-gated integration test using isolated schema (`tb_audit_gated_entry_test`) to verify missing-claim rejection and tenant-filtered `dashboard_gated_entry_attempt` listing; expanded `test:integration:ownership` to include the new audit suite and validated local non-skipped run (`5 suites`, `13 tests`).
- Risks: CI-hosted release evidence still reflects prior 4-suite ownership baseline and must be refreshed for the expanded 5-suite contract.
- Blockers: None.
- Next step: run CI and capture updated ownership/access artifact evidence for expanded suite set.

### 2026-04-15 (validation: dashboard telemetry read-proxy coverage)
- Focus: complete dashboard-side telemetry read path by proxying gated-entry analytics GET requests to backend tenant-scoped endpoint.
- Files changed: `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `GET /api/analytics/gated-entry` with fail-closed `503` when backend URL is missing, auth-header pass-through, backend status/payload propagation, and non-JSON fallback/error handling aligned with existing proxy patterns.
- Risks: No dashboard UI consumer for this read path yet; endpoint is ready for future diagnostics/ops surfaces.
- Blockers: None.
- Next step: add a lightweight internal diagnostics panel or admin card that consumes `GET /api/analytics/gated-entry` for tenant-level gate-attempt visibility.

### 2026-04-15 (validation: ownership evidence refreshed to 5-suite CI baseline)
- Focus: finalize release-QA ownership/access evidence after expanded audit telemetry suite was added to required lane.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated evidence to successful CI run `24445875783` on merge commit `2fa86a90e2ab32399e943955c7e1ac80c0300e5b` with artifact `6446796613`; ownership summary now reflects expanded non-skipped lane (`5 suites`, `13 tests`) including `src/audit/audit.gated-entry.int.spec.ts`.
- Risks: None.
- Blockers: None.
- Next step: continue next customer-product hardening slice with ownership/access CI evidence now aligned to expanded required lane.

### 2026-04-15 (execution: admin gated-entry diagnostics panel)
- Focus: expose tenant-scoped gated-entry telemetry in dashboard admin surface for operational visibility of deferred-route access attempts.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added reusable gated-entry telemetry hook and integrated an admin diagnostics card with manual refresh plus loading/error/empty states, showing latest gate/role/feature/redirect entries.
- Risks: Diagnostics card currently depends on authenticated backend telemetry read path; in demo contexts with invalid tokens it may show backend auth errors by design.
- Blockers: None.
- Next step: add lightweight filtering (gate type/time window) and pagination if telemetry volume grows beyond top-10 visibility.

### 2026-04-15 (execution: admin telemetry diagnostics UX hardening)
- Focus: improve operator ergonomics for gated-entry diagnostics with filter/pagination controls and clearer auth-failure guidance.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added gate selector, time-window selector (`24h`/`7d`/`30d`), paginated table navigation, and explicit auth-health hint when telemetry read errors indicate token problems.
- Risks: Client-side filtering assumes backend returns recent enough baseline data (`LIMIT 100`); deeper history still requires backend query parameters in future.
- Blockers: None.
- Next step: extend telemetry read endpoint with server-side filters/pagination params once usage volume justifies API-level querying controls.

### 2026-04-15 (execution: telemetry server-side query controls)
- Focus: move admin telemetry filtering/pagination to backend query layer for scalable diagnostics reads.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added backend query params (`gate`, `fromHours`, `limit`, `offset`) with validation and paginated envelope response (`items`, `total`, `limit`, `offset`); dashboard proxy now forwards these params; admin telemetry hook/card now consumes server-side paging/filtering and total counts.
- Risks: `timestamp` + JSON payload filtering on `tenantId`/`gate` is still index-light; if volume grows, dedicated index strategy should be applied.
- Blockers: None.
- Next step: add DB index for `event_type` + payload tenant/gate access path and optional backend-side sort/filter extensions if diagnostics usage increases.

### 2026-04-15 (validation: telemetry query index definition + assertion)
- Focus: close telemetry query performance follow-up by defining index artifact and validating index signature in DB-backed tests.
- Files changed: `tracebud-backend/sql/tb_v16_004_audit_gated_entry_index.sql`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added SQL migration artifact for composite gated-entry lookup index and expanded audit integration suite with index-definition assertion (`payload->>'tenantId'`, `payload->>'gate'`) to prevent accidental regression in query-path support.
- Risks: Index artifact is currently staged as SQL file and still needs migration-application scheduling in deployment workflow.
- Blockers: None.
- Next step: include `tb_v16_004_audit_gated_entry_index.sql` in staging/prod DB migration rollout and capture execution evidence in release QA notes.

### 2026-04-15 (execution: telemetry index apply script + QA evidence)
- Focus: operationalize telemetry index rollout with executable backend script and attach concrete verification evidence in QA notes.
- Files changed: `tracebud-backend/scripts/apply-audit-gated-entry-index.mjs`, `tracebud-backend/package.json`, `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `db:apply:audit-index` command (auto-loading `TEST_DATABASE_URL`) that executes SQL artifact and verifies index existence via `pg_indexes`; local execution completed with output `Applied and verified audit gated-entry index.` and was recorded in release QA evidence.
- Risks: Staging/prod still require explicit execution in deployment pipeline (local validation is not sufficient for production signoff).
- Blockers: None.
- Next step: run the same script (or equivalent migration pipeline step) in staging/prod and attach logs/query output as final rollout evidence.

### 2026-04-15 (execution: telemetry index verify-mode + env-agnostic rollout)
- Focus: make telemetry index rollout commands directly usable across staging/prod environments without relying on root local test env fallback.
- Files changed: `tracebud-backend/scripts/apply-audit-gated-entry-index.mjs`, `tracebud-backend/package.json`, `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added DB URL resolution precedence (`AUDIT_INDEX_DATABASE_URL` -> `DATABASE_URL` -> `TEST_DATABASE_URL`) and `--verify-only` mode; introduced `db:verify:audit-index` command and validated output `Verified audit gated-entry index.`.
- Risks: Production signoff still depends on capturing staging/prod command outputs, not only local verification.
- Blockers: None.
- Next step: execute apply+verify commands in staging/prod and attach both logs in release QA evidence.

### 2026-04-15 (execution: telemetry sort-order hardening)
- Focus: extend gated-entry telemetry query controls with explicit server-side sort order and expose sort choice in admin diagnostics.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added validated backend query param `sort` (`desc` default, `asc` optional) for `GET /v1/audit/gated-entry`; dashboard telemetry proxy now forwards `sort`; admin diagnostics now includes newest/oldest selector wired to server-side pagination/filter query flow.
- Risks: None material; sort input is validated server-side and route test coverage now includes `sort` forwarding.
- Blockers: None.
- Next step: if diagnostics volume keeps growing, add saved filter presets and CSV export for operator handoff workflows.

### 2026-04-15 (execution: telemetry diagnostics presets + CSV export)
- Focus: reduce operator toil during telemetry triage by adding one-click query presets and downloadable page-level CSV evidence.
- Files changed: `apps/dashboard-product/lib/gated-entry-diagnostics.ts`, `apps/dashboard-product/lib/gated-entry-diagnostics.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added reusable diagnostics preset catalog (`latest_blocks`, `weekly_volume`, `campaign_focus`, `reporting_focus`) and CSV builder helper with escape handling; admin diagnostics now applies presets to gate/time/sort controls and exports currently loaded telemetry rows to CSV.
- Risks: CSV export is intentionally page-scoped for quick handoff and does not yet auto-fetch/export all pages.
- Blockers: None.
- Next step: add optional "export all matching rows" flow using backend pagination traversal if operators request full-range exports.

### 2026-04-15 (execution: telemetry full-range CSV export)
- Focus: complete operator handoff flow by exporting all matching telemetry rows (not only the visible page) under active filters.
- Files changed: `apps/dashboard-product/lib/gated-entry-diagnostics.ts`, `apps/dashboard-product/lib/gated-entry-diagnostics.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added paginated fetch helper (`fetchAllTelemetryEvents`) that traverses backend `limit`/`offset` pages with active `gate`/`fromHours`/`sort` params and shared auth headers; admin diagnostics now includes `Export All CSV` with loading state and success/error toasts.
- Risks: Full export size is bounded by helper safety caps (`pageSize`/`maxPages`) to avoid runaway requests; very large datasets may require a server-side export job in future.
- Blockers: None.
- Next step: if exports exceed operator browser tolerance, add backend async export endpoint and signed URL delivery.

### 2026-04-15 (execution: telemetry server-generated CSV export path)
- Focus: move full-range telemetry export to backend-generated CSV so admin exports stay filter-aware without browser pagination loops.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/lib/gated-entry-diagnostics.ts`, `apps/dashboard-product/lib/gated-entry-diagnostics.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added backend endpoint `GET /v1/audit/gated-entry/export` (tenant-claim enforced, `gate`/`fromHours`/`sort` validated, CSV output capped at 5000 rows); dashboard analytics proxy now forwards `format=csv` reads to backend export endpoint and returns `text/csv`; admin `Export All CSV` now uses this server path with existing auth pass-through semantics.
- Risks: Export endpoint currently applies a fixed server-side max row cap (`5000`) for safety; very high-volume tenants may need async/background export in a follow-up.
- Blockers: None.
- Next step: add optional export metadata header (`X-Export-Row-Limit`) and/or async export job when row-cap hit warnings are requested by operators.

### 2026-04-15 (execution: telemetry export cap observability headers)
- Focus: make CSV export cap behavior explicit to operators so truncated exports are visible and actionable.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Backend export now sets `X-Export-Row-Limit`, `X-Export-Row-Count`, and `X-Export-Truncated`; dashboard proxy forwards these headers; admin export flow now uses metadata for success messaging and warns when results are truncated at cap.
- Risks: Header-based truncation visibility is advisory and still depends on operators acting on warnings by narrowing filters.
- Blockers: None.
- Next step: if needed, add persisted export audit event (with row count/truncated flag) for compliance traceability of operator evidence exports.

### 2026-04-15 (execution: telemetry export audit-event traceability)
- Focus: persist an immutable audit breadcrumb whenever operators export gated-entry CSV evidence.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: `GET /v1/audit/gated-entry/export` now appends `dashboard_gated_entry_exported` with tenant-scoped export metadata (`gate`, `fromHours`, `sort`, `rowCount`, `rowLimit`, `truncated`, `format`) while keeping export delivery resilient if audit append fails.
- Risks: Export metadata event currently reuses `audit_log` JSON payload model; if downstream analytics need stronger schema guarantees, add typed export-event DTO/materialized table in a future slice.
- Blockers: None.
- Next step: optionally surface recent export audit events in admin diagnostics to show who exported what/when during incident handoffs.

### 2026-04-15 (execution: admin export-activity diagnostics feed)
- Focus: expose recent gated-entry CSV export activity directly in admin diagnostics for operator context and handoff validation.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added backend `GET /v1/audit/gated-entry/exports` tenant-scoped endpoint over `dashboard_gated_entry_exported` events with pagination/sort controls; dashboard analytics proxy now routes `eventKind=exports`; admin diagnostics now renders recent export rows (timestamp/gate/rows/sort/truncated) and refreshes this feed alongside gated-entry attempts.
- Risks: Export-activity panel currently shows most recent rows (page size 5) and does not yet include user-email resolution for actor attribution.
- Blockers: None.
- Next step: if needed, enrich export activity rows with user identity lookups and add dedicated pagination controls for long export histories.

### 2026-04-15 (execution: export activity actor attribution)
- Focus: improve export handoff traceability by attaching actor identity to export activity rows.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Export audit events now persist `exportedBy` (signed session email when available), and admin export-activity table now displays actor column with graceful `unknown` fallback.
- Risks: Identity source currently depends on auth-session email presence; service-token/non-email contexts may still display `unknown`.
- Blockers: None.
- Next step: add optional actor enrichment fallback (for example by joining profile directory by `user_id`) if unknown actor frequency becomes operationally problematic.

### 2026-04-15 (execution: export actor fallback hardening)
- Focus: reduce unresolved actor values in export activity without adding new profile-lookup dependencies.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Backend export audit payload now falls back to `user:<id>` when session email is absent; admin export table now also falls back to event `user_id` before rendering `unknown`.
- Risks: Fallback identifiers may be less human-friendly than email addresses; still acceptable for traceability until profile joins are added.
- Blockers: None.
- Next step: if operator UX requires friendlier names, add optional user directory lookup map in admin diagnostics for known actor IDs.

### 2026-04-15 (execution: export actor directory enrichment)
- Focus: improve admin readability by resolving actor fallback IDs into human-friendly user identities when possible.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added local `userIdentityById` map from `useAdminData` users and actor resolver that transforms `user:<id>` / `user_id` to `name (email)` when present; preserves deterministic fallback to `user:<id>` then `unknown`.
- Risks: Enrichment depends on users currently loaded in admin context; stale/missing directory entries still show fallback IDs.
- Blockers: None.
- Next step: if required, fetch/export actor directory from backend directly to avoid dependence on current admin user list hydration.

### 2026-04-15 (execution: export actor enrichment decoupled from page snapshot)
- Focus: reduce coupling between actor resolution and admin page state by moving enrichment into telemetry hook fetch path.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: `useGatedEntryExportEvents` now fetches user directory data and attaches `actorLabel` per export event; admin table consumes pre-enriched labels directly with deterministic fallback chain.
- Risks: Directory fetch still relies on current admin data service availability; if user listing fails, hook gracefully falls back to raw actor IDs.
- Blockers: None.
- Next step: if needed, cache directory map in hook-level memo/store to avoid repeated list fetches across rapid reloads.

### 2026-04-15 (execution: actor directory cache for export hook)
- Focus: reduce redundant user-directory lookups when export diagnostics are refreshed repeatedly.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added module-level actor directory cache with short TTL (`60s`) and explicit invalidation on export-hook manual reload; hook now reuses cached identity map for actor-label enrichment between rapid refresh cycles.
- Risks: Cached actor labels may be briefly stale (up to TTL) after user profile edits; manual refresh invalidation is available when precision is needed.
- Blockers: None.
- Next step: if staleness becomes problematic, subscribe cache invalidation to admin-data mutation events rather than TTL-only expiry.

### 2026-04-15 (execution: actor cache invalidation on admin mutations)
- Focus: keep export actor labels fresh immediately after admin/user data changes without waiting on cache TTL.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: `useGatedEntryExportEvents` now subscribes to admin-data updates (`subscribeAdminData`) and clears actor cache + reloads export activity on mutation events.
- Risks: Mutation-heavy admin sessions may trigger more frequent export-hook reloads; bounded by current lightweight query volume.
- Blockers: None.
- Next step: if needed, debounce mutation-triggered reloads to coalesce rapid successive admin edits.

### 2026-04-15 (execution: debounced mutation-triggered export reloads)
- Focus: reduce redundant telemetry refreshes during bursts of admin mutations while preserving near-real-time actor label updates.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added short debounce window (`200ms`) around mutation-triggered reload tick updates in `useGatedEntryExportEvents`; cleanup now clears pending timers on unmount.
- Risks: Very short-lived intermediate mutation states may be skipped in favor of coalesced final state, which is acceptable for diagnostics feed use.
- Blockers: None.
- Next step: if needed, tune debounce duration based on observed admin edit cadence and UX responsiveness.

### 2026-04-15 (execution: debounce debug observability)
- Focus: provide lightweight runtime visibility into export-hook debounce behavior for tuning/verification in real admin sessions.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added opt-in debug counters/logging in export hook (`mutationEvents`, `debounceFlushes`, `fetchLoads`) gated by `sessionStorage['tb:debug:telemetry']='1'` so production remains quiet by default.
- Risks: Debug logs are session-scoped and manual; if forgotten enabled, local console noise can increase during heavy admin activity.
- Blockers: None.
- Next step: if needed, add a small admin toggle/button to enable/disable this debug mode without manual console commands.

### 2026-04-15 (execution: admin telemetry debug toggle)
- Focus: make debounce diagnostics easier to use by exposing a first-class admin control for session debug mode.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added exported debug helpers (`getTelemetryDebugEnabled`, `setTelemetryDebugEnabled`) and wired a `Debug: On/Off` button in admin diagnostics that toggles session-level telemetry debug state with user feedback toast.
- Risks: Debug toggle is session-scoped and not persisted across browser/session resets by design.
- Blockers: None.
- Next step: if needed, persist toggle state per tenant/user preference in settings for repeated diagnostics sessions.

### 2026-04-15 (execution: live debug counter status line)
- Focus: make debounce/debug behavior immediately observable in the admin UI without relying only on console output.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added exported debug counter getter and an in-card debug status line that polls/render counters (`mutationEvents`, `debounceFlushes`, `fetchLoads`) while debug mode is active.
- Risks: 1s polling for debug counters is intentionally lightweight but still adds minor UI churn when debug mode is on.
- Blockers: None.
- Next step: if needed, replace polling with event-driven counter updates to remove interval-based refresh overhead.

### 2026-04-15 (execution: backend-authoritative actor resolution path)
- Focus: make export actor attribution rely on tenant-scoped backend identity resolution rather than frontend-only directory state.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added backend endpoint `GET /v1/audit/gated-entry/actors` (tenant-claim enforced) resolving labels for requested `user_id` values from export events; dashboard proxy now routes `eventKind=actors` and forwards `ids`; export hook now queries backend actor map first and only falls back to cached local directory map.
- Risks: Actor lookup currently resolves from audit export-event payload history; if an actor has no prior export metadata, fallback labels still apply.
- Blockers: None.
- Next step: if needed, back this endpoint with canonical tenant user directory tables once backend admin identity APIs are formalized.

### 2026-04-15 (execution: event-driven debug counter delivery)
- Focus: remove interval polling overhead from telemetry debug statusline while keeping live counter visibility.
- Files changed: `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added telemetry debug counter subscription API in hook module and switched admin debug statusline updates to event-driven listener callbacks instead of 1s interval polling.
- Risks: Event-driven updates depend on hook emitting counter events on all relevant mutation/debounce/fetch paths; current coverage includes all known increments.
- Blockers: None.
- Next step: if needed, add a minimal hook unit test around debug counter subscriptions when test harness for client hooks is expanded.

### 2026-04-15 (validation: actor lookup tenant-isolation integration)
- Focus: harden backend actor-resolution assurance with DB-backed integration checks for mixed-tenant export events.
- Files changed: `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added integration assertion ensuring `/v1/audit/gated-entry/actors` resolves actor labels only for signed tenant export events and falls back to `user:<id>` for cross-tenant IDs; reran required ownership integration lane (`5 suites`, `15 tests`, non-skipped).
- Risks: Actor resolver still derives labels from export audit payload history until canonical backend user directory APIs are introduced.
- Blockers: None.
- Next step: migrate actor resolution backend path to canonical tenant user directory source once available, retaining audit-history fallback for resilience.

### 2026-04-15 (execution: canonical user_account fallback in actor resolver)
- Focus: improve actor label quality by incorporating canonical backend user directory fields in actor lookup path.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: `/v1/audit/gated-entry/actors` now left-joins `user_account` and uses `user_account.name` fallback when export payload lacks `exportedBy`; integration fixture seeding now upserts `user_account` rows (`role` + `name`) to remain compatible with shared FK constraints in ownership lane.
- Risks: `user_account.name` may still be incomplete for some identities; fallback to `user:<id>` remains for resilience.
- Blockers: None.
- Next step: once backend admin identity APIs are formalized, extend resolver to include canonical email/organization metadata instead of name-only fallback.

### 2026-04-15 (hardening: actor lookup ids validation)
- Focus: fail malformed actor lookup requests fast and explicitly before database query execution.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added UUID-shape validation + dedupe for `/v1/audit/gated-entry/actors?ids=...`; invalid IDs now return `400` (`ids must be UUID values.`) and skip DB calls.
- Risks: Validation currently enforces UUID text shape but not semantic UUID version constraints, which is acceptable for this resolver path.
- Blockers: None.
- Next step: if needed, add explicit API docs examples for valid/invalid `ids` requests and expected `400` payloads.

### 2026-04-15 (validation/docs: actor lookup contract examples + error paths)
- Focus: make actor lookup contract explicit and ensure invalid/missing ID behavior remains regression-proof across backend and proxy layers.
- Files changed: `tracebud-backend/src/audit/audit.controller.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added backend unit assertion for missing `ids` rejection (`ids is required.`), added dashboard proxy test for backend `400` pass-through on invalid actor IDs, and documented valid/invalid actor lookup request examples in FEAT-001.
- Risks: None material; this slice is contract/coverage clarity and should reduce future client misuse.
- Blockers: None.
- Next step: optionally mirror these examples into OpenAPI draft once actor lookup endpoint is formally included there.

### 2026-04-15 (docs: OpenAPI actor lookup contract)
- Focus: make actor lookup API machine-readable for clients/tooling by adding explicit endpoint contract in OpenAPI draft.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `GET /v1/audit/gated-entry/actors` path with required `ids` query parameter, `200` success schema (`GatedEntryActorLookupResponse`), and `400` examples for invalid/missing IDs.
- Risks: OpenAPI draft remains a working artifact and may lag implementation if not kept in lockstep in future slices.
- Blockers: None.
- Next step: if needed, extend OpenAPI with the related telemetry export/list actor endpoints as a cohesive audit telemetry section.

### 2026-04-15 (docs: complete telemetry OpenAPI section)
- Focus: make the full gated-entry telemetry API surface machine-readable, not only actor lookup.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added OpenAPI paths for `GET /v1/audit/gated-entry`, `GET /v1/audit/gated-entry/export`, and `GET /v1/audit/gated-entry/exports`; introduced shared `GatedEntryTelemetryListResponse` schema and documented CSV export metadata headers.
- Risks: As draft evolves, endpoint examples/field details may require periodic sync with implementation changes.
- Blockers: None.
- Next step: optionally add explicit response examples for list/exports payloads to further improve client onboarding clarity.

### 2026-04-15 (docs: telemetry response examples + typed event schema)
- Focus: improve consumer readiness by adding concrete telemetry payload examples and typed event envelope in OpenAPI draft.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `200` response examples for `/v1/audit/gated-entry` and `/v1/audit/gated-entry/exports`; refined list response items to use new `GatedEntryTelemetryEvent` schema instead of generic object placeholders.
- Risks: `payload` remains intentionally flexible (`additionalProperties`) to accommodate evolving telemetry fields and may need stricter schemas later.
- Blockers: None.
- Next step: when payload contracts stabilize, split `GatedEntryTelemetryEvent` into dedicated typed schemas for attempt vs export events.

### 2026-04-15 (execution: Supabase advisor-driven RLS baseline rollout)
- Focus: close highest-risk tenant isolation gaps by enabling RLS and adding own-data policies for compliance-linked tables flagged by advisors.
- Files changed: `tracebud-backend/sql/tb_v16_005_rls_baseline.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added and applied migration `tb_v16_005_rls_baseline` to enable RLS and create `authenticated` own-data policies for `user_account`, `farmer_profile`, `plot`, `harvest_transaction`, `voucher`, `dds_package`, `dds_package_voucher`, and `audit_log`.
- Risks: Policy model is intentionally conservative (farmer-owned paths + self-owned account/audit rows) and may require explicit admin/exporter policy expansion before direct client access for non-farmer personas.
- Blockers: None.
- Next step: run phase-2 policy expansion for remaining public tables (including lead/content/outreach domains), then harden mutable `search_path` functions and re-run advisors to clear residual security warnings.

### 2026-04-15 (execution: Supabase advisor phase-2 RLS + function hardening)
- Focus: remove remaining app-domain `rls_disabled_in_public` and `function_search_path_mutable` advisor findings with minimal-risk schema controls.
- Files changed: `tracebud-backend/sql/tb_v16_006_rls_phase2_and_function_hardening.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Applied `tb_v16_006_rls_phase2_and_function_hardening` to enable RLS on 15 remaining app-domain public tables and set explicit `search_path` on flagged public functions; advisor rerun now leaves `rls_disabled_in_public` only on `public.spatial_ref_sys` (extension-owned) with no remaining mutable-function warnings.
- Risks: Newly RLS-enabled app-domain tables currently default deny (no permissive table policies), which is secure-by-default but may require explicit read/write policies if future direct client access is needed.
- Blockers: `public.spatial_ref_sys` ownership prevents alteration from current role (`must be owner of table spatial_ref_sys`).
- Next step: apply owner-level PostGIS/schema exposure remediation for `spatial_ref_sys`, then optionally add least-privilege policies for phase-2 app tables where direct client reads/writes are intentionally required.

### 2026-04-15 (execution: lead intake permissive policy hardening)
- Focus: remove permissive public lead insert policy (`WITH CHECK (true)`) while preserving marketing form ingestion.
- Files changed: `tracebud-backend/sql/tb_v16_008_leads_insert_policy_hardening.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Applied `tb_v16_008_leads_insert_policy_hardening`; replaced policy `Allow public form submissions` with guarded `leads_public_insert_guarded` policy enforcing non-empty required text fields, email-format regex, and `status='New'`.
- Risks: Public insert path now rejects malformed/blank payloads at RLS boundary; if frontend validation drifts, malformed submissions will be denied (fail-closed behavior is intentional).
- Blockers: None.
- Next step: keep phase-2 app-domain tables deny-by-default until explicit ownership/tenant keys are introduced, and handle `spatial_ref_sys` owner-level remediation in infra/postgis change window.

### 2026-04-15 (execution: owner-run postgis remediation runbook)
- Focus: prepare privileged SQL runbook to close the last extension-owned advisor findings that cannot be changed by app migration role.
- Files changed: `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added owner-executed SQL plan to move `postgis` extension to `extensions` schema and enforce `public.spatial_ref_sys` RLS + read policy, with explicit post-run verification queries.
- Risks: Extension schema moves are infra-sensitive and may impact objects/functions relying on implicit `public` resolution if not validated in staging.
- Blockers: Requires DB owner/superuser privileges not available to current migration role.
- Next step: execute runbook in staging/prod under owner credentials during maintenance window, then rerun Supabase security advisors.

### 2026-04-15 (decision: accept spatial_ref_sys advisor exception for release window)
- Focus: formalize low-risk exception handling to avoid unnecessary extension-level infra churn while preserving tenant-data security posture.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Documented `public.spatial_ref_sys` (`rls_disabled_in_public`) as accepted exception for current release because table is PostGIS SRID metadata (non-tenant), current role lacks ownership, and core business tables remain RLS-hardened; retained owner-run runbook for future infra window.
- Risks: Advisor retains one `ERROR` until owner-level PostGIS remediation is executed; mitigated via explicit release exception record and backend-mediated data access.
- Blockers: None.
- Next step: enable Supabase leaked-password protection and design explicit ownership/tenant columns for phase-2 app tables before introducing any direct client policies.

### 2026-04-15 (execution: telemetry contract typing + backend contract assertion)
- Focus: reduce integration drift risk by making telemetry event contracts explicitly discriminated and asserting export payload shape in backend tests.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Upgraded `GatedEntryTelemetryEvent` to a discriminator-based `oneOf` (`dashboard_gated_entry_attempt` vs `dashboard_gated_entry_exported`) with typed payload schemas; added backend unit assertion for export audit payload contract fields (`gate`, `fromHours`, `sort`, `rowCount`, `rowLimit`, `truncated`, `exportedAt`).
- Risks: Payload schemas intentionally allow extra fields (`additionalProperties`) to preserve forward compatibility; stricter lock-down may be required once telemetry payload evolution slows.
- Blockers: None.
- Next step: add a lightweight CI check that validates OpenAPI doc structure against a schema/linter to catch discriminator/spec regressions automatically.

### 2026-04-15 (execution: OpenAPI CI lint gate)
- Focus: enforce automated contract validation in CI so OpenAPI structural regressions are blocked before merge/release.
- Files changed: `.github/workflows/ci.yml`, `package.json`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added root script `openapi:lint` (`@redocly/cli lint`) and a dedicated `contracts` CI job to execute it; adjusted `AddBatchInputRequest` conditional schema to OAS 3.0-compatible `oneOf` pattern so lint passes without structural errors.
- Risks: Current lint run reports many non-blocking warnings (missing tag descriptions/operationIds/etc.); they are informational for now and should be reduced gradually to improve contract quality.
- Blockers: None.
- Next step: introduce a scoped `.redocly.yaml` policy to progressively enforce high-signal warnings (e.g., operationId) as errors while suppressing low-signal draft placeholders.

### 2026-04-15 (execution: OpenAPI policy file + telemetry operation IDs)
- Focus: make contract linting policy explicit in-repo and lock stable operation identifiers for telemetry/audit endpoints.
- Files changed: `.redocly.yaml`, `package.json`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `.redocly.yaml` with baseline rule severities and updated lint script to use explicit config path; added operation IDs for `/v1/audit/gated-entry*`, `/v1/audit-events/export`, and `/v1/access-logs/export`.
- Risks: Broad spec still carries warning debt (e.g., missing operation IDs outside telemetry scope and missing 4xx responses on draft endpoints), so operation-ID enforcement remains progressive rather than global-fail.
- Blockers: None.
- Next step: incrementally add operation IDs + 4xx responses for the next highest-traffic endpoint groups (requests, compliance exports) and then raise those rules to `error`.

### 2026-04-15 (execution: requests OpenAPI warning-debt reduction)
- Focus: continue progressive contract quality enforcement by hardening the requests endpoint cluster first.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit operation IDs for `/v1/requests/campaigns`, `/v1/requests/campaigns/{id}`, `/v1/requests/campaigns/{id}/targets`; added baseline `4xx` responses for these operations to satisfy lint policy expectations.
- Risks: Some response placeholders still reference generic `BadRequest` envelope for `404` paths in draft mode; endpoint-specific not-found schemas should be introduced before strict API contract freeze.
- Blockers: None.
- Next step: apply the same operationId + 4xx pass to compliance exports and plots endpoints, then consider promoting `operation-operationId` to `error` for those stabilized groups.

### 2026-04-15 (execution: plots OpenAPI warning-debt reduction)
- Focus: continue progressive lint-warning burn-down by hardening the plots endpoint cluster.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit operation IDs for `/v1/plots` and `/v1/plots/{id}/geometry-versions`; added baseline `4xx` responses (`400/401` and `404` where path lookup is involved) to satisfy progressive rule expectations.
- Risks: `404` currently maps to generic `BadRequest` response schema in draft mode; should be split to endpoint-specific not-found response as contract matures.
- Blockers: None.
- Next step: run the same pass on compliance exports and evidence endpoints, then raise `operation-operationId` severity for hardened groups only.

### 2026-04-15 (execution: evidence OpenAPI warning-debt reduction)
- Focus: continue progressive contract hardening by bringing evidence endpoints up to operationId/4xx baseline.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `operationId` for `/v1/evidence-documents` and `/v1/evidence-documents/{id}/parse-status`; added baseline `4xx` responses (`400/401` on upload and `401/404` on parse-status read).
- Risks: `404` still references generic `BadRequest` response envelope in draft mode and should be split into endpoint-specific not-found errors before strict freeze.
- Blockers: None.
- Next step: apply same pass to compliance exports and consent endpoints, then start promoting rules to stricter severities on hardened groups.

### 2026-04-15 (execution: consent + compliance-exports OpenAPI warning-debt reduction)
- Focus: execute both requested domain hardening passes in one slice to accelerate contract warning burn-down.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/consent-grants`, `/v1/consent-grants/{id}/revoke`, `/v1/compliance-exports`, `/v1/compliance-exports/{id}`, and `/v1/compliance-exports/{id}/download`.
- Risks: `404` responses remain mapped to generic draft `BadRequest` envelope; as endpoint contracts mature, introduce dedicated not-found schema/response components per domain.
- Blockers: None.
- Next step: harden batches endpoints next (`/v1/batches*`) and then begin promoting operationId/4xx rules toward stricter enforcement for fully-covered endpoint clusters.

### 2026-04-15 (execution: batches OpenAPI warning-debt reduction)
- Focus: continue high-signal warning burn-down by hardening the batches endpoint family.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/batches`, `/v1/batches/{id}/inputs`, and `/v1/batches/{id}/lock-lineage`.
- Risks: `404` responses still reuse generic `BadRequest` draft envelope; endpoint-specific not-found schemas should be introduced before strict contract freeze.
- Blockers: None.
- Next step: harden review endpoints (`yield-exception` + `dedup-review`) and then start enforcing stricter lint severities for fully covered endpoint groups.

### 2026-04-15 (execution: reviews OpenAPI warning-debt reduction)
- Focus: harden review workflow endpoints to keep high-signal OpenAPI warning burn-down momentum.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit operation IDs + baseline `4xx` responses for `/v1/yield-exception-requests/{id}/approve`, `/v1/yield-exception-requests/{id}/reject`, `/v1/dedup-review-tasks/{id}/merge`, `/v1/dedup-review-tasks/{id}/mark-distinct`, and `/v1/dedup-review-tasks/{id}/escalate`.
- Risks: Draft still maps `404` to generic `BadRequest` response component; introduce domain-specific not-found contracts before API freeze.
- Blockers: None.
- Next step: harden shipments endpoints next, then begin raising lint severities for fully covered endpoint clusters.

### 2026-04-15 (execution: shipments OpenAPI warning-debt reduction)
- Focus: harden shipment workflow endpoints for stronger operation identity and baseline error-contract consistency.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit operation IDs + baseline `4xx` responses for `/v1/shipment-headers`, `/v1/shipment-headers/{id}/lines`, and `/v1/shipment-headers/{id}/seal` (retaining existing `409` conflict contract on seal).
- Risks: `404` currently points to generic `BadRequest` envelope in draft mode; endpoint-specific not-found components should be introduced before API freeze.
- Blockers: None.
- Next step: harden DDS endpoints and then begin promoting lint severities for fully covered endpoint clusters.

### 2026-04-15 (execution: DDS OpenAPI warning-debt reduction)
- Focus: harden DDS endpoint contracts with explicit operation IDs and baseline auth/validation error coverage.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/dds-records/{id}/submit`, `/v1/dds-records/{id}/amend`, and `/v1/dds-records/{id}/retract`; preserved existing `409` conflict and `422` validation semantics on submit path.
- Risks: `404` responses still map to generic `BadRequest` envelope in draft mode; domain-specific not-found contracts should be introduced pre-freeze.
- Blockers: None.
- Next step: harden sync endpoints next and then start progressively raising lint severities on fully covered endpoint groups.

### 2026-04-15 (execution: sync OpenAPI warning-debt reduction)
- Focus: harden sync and conflict-resolution endpoint contracts for clearer operation identity and baseline error handling.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/sync/flush` and `/v1/sync-conflicts/{id}/resolve`.
- Risks: `404` responses still use generic `BadRequest` envelope in draft mode; endpoint-specific not-found schemas should be introduced before strict API freeze.
- Blockers: None.
- Next step: harden portability endpoints and then start incrementally raising lint severities for clusters that are fully covered.

### 2026-04-15 (execution: portability OpenAPI warning-debt reduction)
- Focus: harden portability workflow endpoint contracts with explicit operation IDs and baseline auth/validation errors.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/portability-requests` and `/v1/portability-requests/{id}/download`.
- Risks: `404` continues to reuse generic `BadRequest` envelope in draft mode; domain-specific not-found response components should be introduced before API freeze.
- Blockers: None.
- Next step: harden annual-reporting endpoints and then begin progressively raising lint severities for endpoint clusters that are fully covered.

### 2026-04-15 (execution: annual reporting OpenAPI warning-debt reduction)
- Focus: harden annual reporting snapshot endpoint contracts with explicit operation IDs and baseline auth/validation errors.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/annual-reporting-snapshots/generate` and `/v1/annual-reporting-snapshots/{id}`.
- Risks: `404` still maps to generic `BadRequest` envelope in draft mode; endpoint-specific not-found schemas should be introduced before strict contract freeze.
- Blockers: None.
- Next step: harden compliance issues endpoints next and then start progressively raising lint severities for fully covered endpoint groups.

### 2026-04-15 (execution: compliance-issues OpenAPI warning-debt reduction)
- Focus: harden issue-lifecycle endpoint contracts with explicit operation IDs and baseline auth/validation errors.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/compliance-issues`, `/v1/compliance-issues/{id}`, `/v1/compliance-issues/{id}/assign-owner`, `/v1/compliance-issues/{id}/resolve`, and `/v1/compliance-issues/{id}/escalate`.
- Risks: `404` continues to map to generic `BadRequest` envelope in draft mode; endpoint-specific not-found error schemas should be introduced before strict API freeze.
- Blockers: None.
- Next step: harden billing + webhooks endpoints to finish operationId/4xx coverage of remaining warning-heavy clusters, then begin raising lint severities.

### 2026-04-15 (execution: billing + webhooks OpenAPI warning-debt reduction)
- Focus: finish remaining warning-heavy contract clusters by hardening payment and webhook observability endpoint families.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added operation IDs + baseline `4xx` responses for `/v1/billing-events`, `/v1/billing/payment-methods`, `/v1/billing/payment-methods/{id}/set-default`, `/v1/webhooks`, and `/v1/webhooks/{id}/deliveries`.
- Risks: Remaining warnings are now concentrated in foundational doc metadata and a few low-priority legacy paths; stricter rule rollout should be staged to avoid blocking unrelated endpoint work.
- Blockers: None.
- Next step: promote selected Redocly rules (`operation-operationId`, `operation-4xx-response`) to `error` now that most endpoint clusters are covered, and address remaining exceptions in a short cleanup pass.

### 2026-04-15 (execution: promote operation lint rules to error)
- Focus: lock operation-level OpenAPI quality gates by making operation identity and 4xx coverage mandatory.
- Files changed: `.redocly.yaml`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Promoted `operation-operationId` and `operation-4xx-response` from warning to error; fixed remaining strict violations by adding operation IDs for `/v1/organisations`, `/v1/producers`, `/v1/organisations/{id}/members/invitations` and adding baseline `4xx` responses for member invites plus `/v1/audit-events/export` and `/v1/access-logs/export`.
- Risks: Remaining warning set is now mostly documentation-quality debt (`info.license`, `tag-description`, placeholder server URLs) rather than operation contract correctness.
- Blockers: None.
- Next step: clear remaining metadata warnings (license, tag descriptions, non-placeholder server URLs) and then consider promoting those selected rules as well.

### 2026-04-15 (execution: OpenAPI metadata warning closure)
- Focus: close remaining non-structural OpenAPI warnings so strict lint is fully clean.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `info.license`, replaced example server URLs with production/sandbox Tracebud domains, and added descriptions for all tag entries.
- Risks: Server URLs are now non-placeholder; if environment hostnames change, OpenAPI servers section must stay synchronized with deployment configuration.
- Blockers: None.
- Next step: maintain strict rule set and add a lightweight CI check-summary note that reports OpenAPI warning/error counts over time for governance trend visibility.

### 2026-04-15 (execution: OpenAPI CI check-summary trend note)
- Focus: add governance trend visibility directly in CI output while preserving strict contract gate behavior.
- Files changed: `.github/workflows/ci.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated contracts lint step to capture Redocly output and added an always-run summary step that writes status + warning count to GitHub step summary.
- Risks: Summary parser keys off Redocly output text and may need adjustment if CLI wording changes in future versions.
- Blockers: None.
- Next step: optionally expand summary with historical baseline deltas once persistent metrics storage/reporting is introduced.

### 2026-04-15 (execution: OpenAPI baseline-delta CI metrics)
- Focus: make CI contract trend reporting actionable by adding explicit baseline deltas and durable run-level metrics artifacts.
- Files changed: `.github/workflows/ci.yml`, `docs/openapi/lint-baseline.json`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added repo baseline file (`docs/openapi/lint-baseline.json`), updated contracts summary step to parse both errors and warnings and report baseline+delta values, and uploaded `openapi-lint-metrics.json` as CI artifact (`contracts-openapi-lint-metrics`) on every run.
- Risks: Baseline drift must be managed intentionally (refresh baseline only after approved quality-gate changes) to keep deltas meaningful.
- Blockers: None.
- Next step: optionally automate baseline refresh workflow behind explicit maintainer approval once release-governance process defines trigger criteria.

### 2026-04-15 (execution: guarded OpenAPI baseline refresh command)
- Focus: prevent accidental baseline drift by requiring explicit operator intent before baseline mutation.
- Files changed: `package.json`, `scripts/openapi-refresh-lint-baseline.mjs`, `docs/openapi/lint-baseline.json`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `npm run openapi:baseline:refresh` command that fail-closes unless `OPENAPI_BASELINE_APPROVED=true` and `OPENAPI_BASELINE_REASON` are set; command re-runs strict OpenAPI lint and only then rewrites baseline with refresh metadata (`refreshedAt`, `refreshedBy`, reason, previous counts).
- Risks: Baseline file now carries refresh metadata fields, so any downstream tooling must treat unknown keys as non-breaking.
- Blockers: None.
- Next step: if desired, align CI baseline refresh to this same guard contract under workflow-dispatch approval.

### 2026-04-15 (execution: workflow-dispatch baseline refresh lane)
- Focus: provide a CI-native, manually approved path to execute guarded baseline refresh without weakening governance controls.
- Files changed: `.github/workflows/openapi-baseline-refresh.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added dedicated `OpenAPI Baseline Refresh` workflow with `workflow_dispatch` inputs (`approved` boolean + `reason` string); workflow fail-closes if approval input is false, runs `npm run openapi:baseline:refresh` with guard env contract, writes job summary metadata, and uploads `docs/openapi/lint-baseline.json` as artifact.
- Risks: Workflow currently publishes refreshed baseline as artifact only; repository baseline file still requires explicit commit flow to take effect on default branch.
- Blockers: None.
- Next step: optionally add protected-branch PR automation for baseline file updates after manual dispatch execution.

### 2026-04-15 (execution: baseline refresh PR automation lane)
- Focus: close the manual-adoption gap by making approved baseline refreshes land through protected-branch review flow automatically.
- Files changed: `.github/workflows/openapi-baseline-refresh.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Elevated workflow permissions (`contents` + `pull-requests` write) and added `peter-evans/create-pull-request` step to open a dedicated branch/PR containing only `docs/openapi/lint-baseline.json`, with dispatch reason/actor/run metadata in PR body.
- Risks: PR auto-creation depends on repository policy allowing Actions-created PRs and action token write scopes.
- Blockers: None.
- Next step: optionally add CODEOWNERS enforcement for baseline file to require contracts/governance reviewers on these automated PRs.

### 2026-04-15 (execution: OpenAPI baseline CODEOWNERS enforcement)
- Focus: ensure governance-critical baseline changes always receive explicit designated-owner review before merge.
- Files changed: `.github/CODEOWNERS`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added CODEOWNERS rules for `docs/openapi/lint-baseline.json` and `.github/workflows/openapi-baseline-refresh.yml` to require governance-owner review on both baseline content updates and automation workflow edits.
- Risks: Reviewer-handle changes require CODEOWNERS updates to avoid stalled PR approvals.
- Blockers: None.
- Next step: optionally broaden OpenAPI governance ownership to `.redocly.yaml` and `docs/openapi/tracebud-v1-draft.yaml` if the team wants the same review gate for contract policy/spec edits.

### 2026-04-15 (execution: OpenAPI CODEOWNERS parity extension)
- Focus: unify governance review controls so baseline, lint policy, and spec-draft changes all require the same designated-owner approval path.
- Files changed: `.github/CODEOWNERS`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Extended CODEOWNERS coverage to `.redocly.yaml` and `docs/openapi/tracebud-v1-draft.yaml` in addition to existing baseline/workflow entries.
- Risks: If governance ownership changes, all protected OpenAPI paths in CODEOWNERS must be updated together to avoid inconsistent reviewer routing.
- Blockers: None.
- Next step: optionally add branch-protection rule check to confirm CODEOWNERS approvals are required on target branch.

### 2026-04-15 (execution: branch-protection verification checklist)
- Focus: make CODEOWNERS enforcement auditable by defining an explicit verification path in release evidence.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `OpenAPI Governance Branch-Protection Checklist` covering required branch settings (`Require review from Code Owners`), protected OpenAPI paths, PR-level verification steps, and concrete evidence fields to capture for release signoff.
- Risks: Checklist value depends on periodic execution in repo settings that can drift outside code review.
- Blockers: None.
- Next step: run one test PR against a protected OpenAPI file and attach evidence details (URL/timestamp/reviewer outcome) to the checklist section.

### 2026-04-16 (execution: Supabase `spatial_ref_sys` owner-run hardening update)
- Focus: remove residual integrity exposure from extension-managed `spatial_ref_sys` by hardening owner-run remediation semantics before infra-window execution.
- Files changed: `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated runbook to (1) detect `spatial_ref_sys` location in `public`/`extensions`, (2) enable RLS on discovered table path, (3) revoke `INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` from `anon` and `authenticated`, and (4) keep explicit read compatibility via `spatial_ref_sys_public_read` policy.
- Risks: Requires privileged extension/table owner execution window; if infra ownership context differs between environments, dry-run verification queries must be executed before/after apply.
- Blockers: Owner-level credentials/window still required for production execution; direct execution via MCP confirmed platform returns `extension "postgis" does not support SET SCHEMA` and non-owner sessions fail `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with `must be owner of table spatial_ref_sys`.
- Next step: execute hardened runbook in staging then production owner window, rerun Supabase security advisors, and replace temporary exception note once `rls_disabled_in_public` / grant exposure findings clear.

### 2026-04-15 (execution: branch-protection completed-evidence template)
- Focus: reduce operational friction by providing a ready-to-fill evidence block for branch-protection verification runs.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `Completed evidence (fill after verification run)` subsection with placeholders for settings evidence, PR URL, protected file touched, reviewer request/approval timestamps, decision status, and pre/post approval mergeability outcome.
- Risks: Template is only effective if evidence fields are completed after each verification run and kept current with branch policy changes.
- Blockers: None.
- Next step: execute one protected-path test PR and populate the new template with real values.

### 2026-04-15 (execution: OpenAPI CODEOWNERS CI drift check)
- Focus: prevent silent governance-regression by enforcing required OpenAPI CODEOWNERS entries in automated contracts CI.
- Files changed: `package.json`, `scripts/openapi-governance-codeowners-check.mjs`, `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:check` script that validates required `.github/CODEOWNERS` path entries; wired new CI contracts step `Verify OpenAPI governance CODEOWNERS`; updated release checklist verification flow to include this CI step.
- Risks: Check currently enforces path presence only (not owner-handle value), so reviewer-handle drift still requires periodic human settings review.
- Blockers: None.
- Next step: optionally extend the check to assert approved owner handles for each protected path if governance policy requires hard pinning.

### 2026-04-15 (execution: OpenAPI CODEOWNERS owner-handle pinning)
- Focus: strengthen governance drift defense by asserting reviewer identity, not just protected-path presence.
- Files changed: `scripts/openapi-governance-codeowners-check.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Upgraded `openapi:governance:check` to parse CODEOWNERS owners per protected path and fail when expected owner handle (`@stlaurentraph-ux`) is missing; updated release checklist to explicitly verify owner-handle assertions in CI output.
- Risks: Owner-handle rotations now require synchronized updates in both CODEOWNERS and check-script expectations to avoid intentional-change false failures.
- Blockers: None.
- Next step: optionally externalize expected owner handles into a small JSON policy file to reduce dual-edit drift when governance ownership rotates.

### 2026-04-15 (execution: OpenAPI governance policy externalization)
- Focus: reduce governance-maintenance drift by centralizing protected-path/owner requirements into a single policy artifact consumed by CI.
- Files changed: `docs/openapi/governance-codeowners-policy.json`, `scripts/openapi-governance-codeowners-check.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `governance-codeowners-policy.json` as source of truth for required CODEOWNERS path/owner mappings; refactored governance check script to read policy file and validate policy structure (`requiredEntries`, `path`, non-empty `owners`) before evaluating CODEOWNERS state.
- Risks: Policy/schema drift could break checks if malformed; script now fail-closes with explicit validation errors to surface misconfiguration early.
- Blockers: None.
- Next step: optionally add JSON schema validation in CI for `governance-codeowners-policy.json` if policy complexity grows.

### 2026-04-15 (execution: governance policy schema validation gate)
- Focus: make policy-format failures explicit and deterministic by validating governance policy against a dedicated schema before ownership checks.
- Files changed: `docs/openapi/governance-codeowners-policy.schema.json`, `scripts/openapi-governance-policy-validate.mjs`, `package.json`, `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added schema file + validator script (`openapi:governance:policy:validate`) and wired CI contracts step `Validate OpenAPI governance policy` to run before CODEOWNERS checks.
- Risks: Validator is custom lightweight logic aligned to the local schema; if schema semantics expand, validator and schema must stay synchronized.
- Blockers: None.
- Next step: optionally migrate validator to a JSON Schema engine (Ajv) if policy constraints become more complex than the current lightweight checks.

### 2026-04-15 (execution: unified governance CI summary artifact)
- Focus: consolidate governance evidence into one per-run report so policy and CODEOWNERS checks are auditable together.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated contracts lane governance steps to capture command output logs, publish a combined `OpenAPI Governance Checks` summary block, and upload `openapi-governance-metrics.json` as `contracts-openapi-governance-metrics` artifact.
- Risks: Summary status currently infers pass/fail from command output markers; wording changes in scripts may require parser update.
- Blockers: None.
- Next step: optionally emit machine-readable status JSON directly from governance scripts to remove string-matching dependency.

### 2026-04-15 (execution: governance summary machine-readable sourcing)
- Focus: remove fragile log-text parsing by sourcing governance summary status from structured report files.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance-policy-validate.mjs`, `scripts/openapi-governance-codeowners-check.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `--report` output support to both governance scripts and updated CI to pass report paths; governance summary now reads `openapi-governance-policy-report.json` + `openapi-governance-codeowners-report.json` to derive status and include full report payload inside `openapi-governance-metrics.json`.
- Risks: Report-argument contract now becomes part of CI-script compatibility surface; future script refactors must preserve this CLI option or update workflow accordingly.
- Blockers: None.
- Next step: optionally standardize `--report` handling across all policy/check scripts in repo for consistency.

### 2026-04-15 (execution: governance raw-report artifact upload)
- Focus: improve audit traceability by preserving the exact per-check JSON report inputs alongside consolidated governance metrics.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added CI artifact upload `contracts-openapi-governance-reports` containing `openapi-governance-policy-report.json` and `openapi-governance-codeowners-report.json`; updated release evidence checklist to require presence of this raw-report artifact.
- Risks: Artifact retention window in GitHub may expire before long-tail audits; mirror critical evidence externally if long-term retention is required.
- Blockers: None.
- Next step: optionally include artifact URLs in the governance summary block for faster reviewer navigation.

### 2026-04-15 (execution: governance summary artifact-link hints)
- Focus: reduce reviewer friction by surfacing direct run-link navigation for governance artifacts inside summary output.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Extended `OpenAPI Governance Checks` summary block with run-link references for `contracts-openapi-governance-metrics` and `contracts-openapi-governance-reports`; updated release QA verification checklist accordingly.
- Risks: Run-level links remain stable, but artifact-level direct links are still one click deeper in GitHub UI.
- Blockers: None.
- Next step: optionally enrich metrics JSON with artifact names/expected file list so downstream tooling can assert artifact completeness.

### 2026-04-15 (execution: governance metrics artifact inventory metadata)
- Focus: make governance evidence machine-auditable by embedding expected artifact/file inventory in metrics output.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `expectedArtifacts` array to `openapi-governance-metrics.json` listing artifact names and required file payloads; updated release checklist to verify inventory presence.
- Risks: Inventory list is currently static in workflow script and must be updated if artifact naming conventions change.
- Blockers: None.
- Next step: optionally add a follow-up CI assertion that checks generated artifacts against this inventory before upload.

### 2026-04-15 (execution: governance artifact inventory assertion gate)
- Focus: enforce evidence completeness by failing CI when expected governance artifact files are missing before upload.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added contracts step `Assert OpenAPI governance artifact inventory` that reads `openapi-governance-metrics.json` `expectedArtifacts` and verifies required files exist (`openapi-governance-metrics.json`, `openapi-governance-policy-report.json`, `openapi-governance-codeowners-report.json`) before upload.
- Risks: Assertion currently validates file existence, not file schema/content integrity.
- Blockers: None.
- Next step: optionally add JSON-shape sanity assertions on generated report artifacts to catch truncated/invalid JSON outputs.

### 2026-04-15 (execution: governance artifact JSON-shape assertion gate)
- Focus: ensure evidence files are not just present but structurally valid/consistent before upload.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added contracts step `Assert OpenAPI governance artifact JSON shapes` validating PASS/FAIL enums, required arrays/fields, and cross-file status consistency (`metrics.policyReport.status` / `metrics.codeownersReport.status` must match raw reports).
- Risks: Shape assertions currently validate key fields, not every nested optional field; future report schema expansion may require assertion updates.
- Blockers: None.
- Next step: optionally move this assertion logic into a dedicated script file to simplify workflow readability and reuse in local QA runs.

### 2026-04-15 (execution: governance script namespace standardization)
- Focus: improve script discoverability/maintenance by grouping related governance tooling under one directory namespace.
- Files changed: `scripts/openapi-governance/policy-validate.mjs`, `scripts/openapi-governance/codeowners-check.mjs`, `scripts/openapi-governance/artifacts-assert.mjs`, `package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Moved governance scripts into `scripts/openapi-governance/`, updated npm command targets, and removed legacy script paths from `scripts/` root.
- Risks: Any external/local automation invoking old script paths directly (instead of npm scripts) will fail until updated.
- Blockers: None.
- Next step: optionally add a short `scripts/openapi-governance/README.md` documenting command purpose and expected inputs/outputs.

### 2026-04-15 (execution: governance assertion script extraction)
- Focus: reduce CI workflow complexity by extracting artifact assertion logic into reusable script tooling.
- Files changed: `scripts/openapi-governance/artifacts-assert.mjs`, `package.json`, `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added script `openapi:governance:artifacts:assert` to validate inventory + JSON shape consistency and switched CI assertion step(s) to call this script; release QA checklist now references the script-backed step.
- Risks: Assertion behavior now depends on script availability/path integrity; CI will fail closed if script is renamed or removed without workflow updates.
- Blockers: None.
- Next step: optionally merge policy/schema/check/assert scripts under a shared `scripts/openapi-governance/` namespace for clearer ownership and discoverability.

### 2026-04-15 (execution: governance scripts quick-reference README)
- Focus: improve operational onboarding by documenting governance script purposes and execution order next to implementation.
- Files changed: `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added concise script-folder README covering command responsibilities, report flags, CI run order, and source-of-truth inputs.
- Risks: README can drift from behavior if commands/arguments change without doc updates.
- Blockers: None.
- Next step: optionally add a tiny CI doc-check that validates README command names exist in `package.json`.

### 2026-04-22 (execution: account creation slice A - dashboard route + signup proxy)
- Focus: implement the first code tranche of account-creation commercialization flow in dashboard app.
- Files changed: `apps/dashboard-product/app/create-account/page.tsx`, `apps/dashboard-product/components/auth/create-account-wizard.tsx`, `apps/dashboard-product/app/login/page.tsx`, `apps/dashboard-product/app/api/auth/signup/route.ts`, `apps/dashboard-product/app/api/auth/signup/route.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added a 4-step create-account wizard UI with value reinforcement and optional commercial-profile skip path; introduced guarded `POST /api/auth/signup` proxy contract with fail-closed backend URL handling and workspace-setup auth requirement.
- Risks: `/api/launch/commercial-profile` and backend `/v1/launch/signup` are referenced by new UI/proxy contracts but not yet implemented in this slice.
- Blockers: None.
- Next step: implement commercial-profile proxy + backend launch signup/commercial-profile endpoints and migration (`TB-V16-028`), then add UI integration tests.

### 2026-04-22 (execution: account creation slice B - commercial profile + backend launch signup APIs)
- Focus: complete account-creation backend contracts and tenant-scoped commercial-profile persistence.
- Files changed: `apps/dashboard-product/app/api/launch/commercial-profile/route.ts`, `apps/dashboard-product/app/api/launch/commercial-profile/route.test.ts`, `apps/dashboard-product/components/auth/create-account-wizard.tsx`, `tracebud-backend/src/launch/launch.public.controller.ts`, `tracebud-backend/src/launch/launch.public.controller.spec.ts`, `tracebud-backend/src/launch/launch.service.ts`, `tracebud-backend/src/launch/launch.module.ts`, `tracebud-backend/sql/tb_v16_028_tenant_commercial_profiles.sql`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: implemented backend public launch endpoints for create-account/workspace-setup and commercial-profile persistence, added migration-backed tenant commercial-profile storage contract, and expanded dashboard proxy/test coverage for optional-profile path.
- Risks: OpenAPI contract updates and DB-backed integration tests for new launch endpoints are still pending.
- Blockers: None.
- Next step: add OpenAPI definitions for new launch endpoints, add UI flow tests for create-account wizard, and add DB-backed integration tests for tenant-scoped commercial-profile persistence paths.

### 2026-04-22 (execution: account creation slice C - OpenAPI, UI tests, DB-backed integration)
- Focus: close contract/test gaps for account-creation launch onboarding surfaces.
- Files changed: `apps/dashboard-product/app/create-account/page.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `tracebud-backend/src/launch/launch.public.controller.ts`, `tracebud-backend/src/launch/launch.commercial-profile.api.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: published OpenAPI tag/path/schema coverage for launch signup + commercial profile, added create-account UI behavior test coverage, and added DB-backed API integration test proving tenant-scoped commercial-profile write path and fail-closed missing-auth behavior.
- Risks: role-aware post-signup redirect/onboarding continuity wiring is still pending in app auth/layout paths.
- Blockers: None.
- Next step: optionally add role-aware post-signup redirect wiring in auth/layout layer and extend onboarding continuity assertions.

### 2026-04-22 (execution: account creation slice D - session continuity + role-aware redirect)
- Focus: remove post-signup auth continuity gap and route users to role-relevant first-value destination.
- Files changed: `apps/dashboard-product/lib/auth-context.tsx`, `apps/dashboard-product/components/auth/create-account-wizard.tsx`, `apps/dashboard-product/components/layout/dashboard-layout.tsx`, `apps/dashboard-product/app/create-account/page.test.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added auth-context token hydrator for immediate in-memory session materialization, made `/create-account` a public route in layout guard, and implemented role-aware post-signup redirect (`admin` -> users admin, others -> campaign creation flow).
- Risks: onboarding checklist continuity through explicit onboarding action markers is still pending for complete first-step auto-validation coverage.
- Blockers: None.
- Next step: optionally wire onboarding action markers on role-first destination pages (`/admin/users`, `/requests`) to auto-complete first onboarding step without manual validation click.

### 2026-04-22 (execution: account creation slice E - cross-page onboarding action sync)
- Focus: ensure onboarding completions are persisted from any page where onboarding actions are performed.
- Files changed: `apps/dashboard-product/lib/onboarding-actions.ts`, `apps/dashboard-product/lib/onboarding-actions.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: upgraded shared onboarding action helper to post canonical role+step completion payloads to `/api/launch/onboarding` whenever an onboarding action marker is set, while preserving existing sessionStorage marker + event behavior.
- Risks: completion sync is best-effort and intentionally non-blocking; transient API failures still rely on local markers and subsequent dashboard validation pass.
- Blockers: None.
- Next step: optionally add page-level smoke tests around major action flows (`requests` draft create, admin invite) asserting completion sync call count when required.

### 2026-04-22 (execution: account creation slice F - page-level onboarding smoke coverage)
- Focus: add high-signal smoke tests proving major UI action flows trigger onboarding markers.
- Files changed: `apps/dashboard-product/app/requests/page.test.tsx`, `apps/dashboard-product/app/admin/users/page.test.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: requests page success path now asserts `campaign_created` and `contacts_uploaded` marker calls; new admin users test asserts successful invite triggers `team_invited`.
- Risks: smoke tests currently validate marker invocation and shared helper sync path separately; they do not assert end-to-end network side-effects from those pages in one combined integration test.
- Blockers: None.
- Next step: optional combined integration-style test for one role flow (`create account -> first action -> onboarding list reflects completion`) if we want end-to-end UI-to-API proof in a single scenario.

### 2026-04-22 (execution: account creation slice G - integration-style onboarding proof path)
- Focus: prove one continuous onboarding completion path from create-account flow into first-value completion sync payload semantics.
- Files changed: `apps/dashboard-product/app/create-account/page.test.tsx`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: create-account test now executes importer path across steps 1-4, validates post-setup redirect target, and asserts `markOnboardingAction('campaign_created')` emits `POST /api/launch/onboarding` with role mapping `compliance_manager` and canonical step key `create_first_campaign`.
- Risks: this remains a jsdom integration-style test with mocked network boundaries rather than a live backend e2e run.
- Blockers: None.
- Next step: optional backend+dashboard environment smoke run against live staging tenant to validate same payload contract under real auth/session decoding.

### 2026-04-22 (execution: account creation slice H - onboarding proxy boundary verification)
- Focus: validate dashboard onboarding proxy semantics for both status reads and completion writes.
- Files changed: `apps/dashboard-product/app/api/launch/onboarding/route.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added dedicated route tests for onboarding proxy `GET`/`POST` fail-closed env behavior and forwarding contract (`role` query, authorization header, completion payload).
- Risks: still test-environment verification; no live staging HTTP evidence captured yet.
- Blockers: None.
- Next step: run scripted staging smoke (dashboard proxy -> backend onboarding endpoints) with a temporary tenant token and capture request/response evidence in release QA artifacts.

### 2026-04-22 (execution: account creation slice I - staging onboarding smoke runbook automation)
- Focus: prepare deterministic staging evidence collection for onboarding proxy read/write contracts.
- Files changed: `apps/dashboard-product/scripts/launch-onboarding-proxy-smoke.mjs`, `apps/dashboard-product/package.json`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added a token-driven smoke script (`qa:launch:onboarding:smoke`) to call both onboarding proxy endpoints and emit status/payload snapshots suitable for QA evidence logs.
- Risks: script execution requires valid staging dashboard URL + tenant bearer token; until those are supplied, this slice provides runbook automation rather than captured live evidence.
- Blockers: None.
- Next step: execute the smoke command with staging credentials and paste output snapshots into `product-os/04-quality/release-qa-evidence.md`.

### 2026-04-23 (execution: account creation slice J - local dev signup bypass for QA)
- Focus: unblock manual create-account UX testing under Supabase email throttle constraints.
- Files changed: `apps/dashboard-product/app/api/auth/signup/route.ts`, `apps/dashboard-product/app/api/launch/commercial-profile/route.ts`, `apps/dashboard-product/app/api/auth/signup/route.test.ts`, `apps/dashboard-product/app/api/launch/commercial-profile/route.test.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced `TRACEBUD_DEV_SIGNUP_BYPASS=true` (non-production only) to return synthetic local signup/workspace/profile success payloads for create-account steps 1-3 without requiring upstream Supabase signup emails.
- Risks: bypass mode is for local QA only and should remain disabled in shared/prod environments.
- Blockers: None.
- Next step: set bypass flag in local dashboard env and perform manual end-to-end create-account click-through validation.

### 2026-04-22 (execution: account creation implementation checklist publication)
- Focus: convert account-creation commercial onboarding specification into an execution-ready file-by-file delivery checklist.
- Files changed: `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added explicit dashboard/backend/OpenAPI/test task breakdown for create-account flow, including route/component targets, proxy contracts, telemetry instrumentation points, migration naming, and verification commands.
- Risks: checklist references planned migration `TB-V16-028` and new dashboard routes not yet implemented; sequence and ownership should be confirmed before coding start.
- Blockers: None.
- Next step: start implementation with dashboard create-account route + signup proxy, then land backend commercial-profile API/migration in parallel.

### 2026-04-22 (execution: account creation + commercial onboarding spec publication)
- Focus: define a conversion-efficient create-account journey that reinforces commercial value while preserving low-friction signup and fast first-value.
- Files changed: `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/04-quality/acceptance-criteria.md`, `product-os/04-quality/event-tracking.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: published a 4-step canonical flow (`Create account` -> `Workspace setup` -> optional `Commercial profile` -> `First value checklist`) with explicit copy, CTA labels, minimum required fields, skippable progressive profiling, tenant/role permission boundaries, lifecycle transitions, recovery behavior, and event taxonomy additions.
- Risks: current slice is specification-only; UX and API implementation still require build/test evidence before production rollout.
- Blockers: None.
- Next step: implement the screen and API contracts in dashboard/backend, then verify event payload completeness and checklist personalization in staging.

### 2026-04-22 (execution: request campaign CTA intent capture and post-login reconciliation)
- Focus: make email `Accept/Refuse` CTA clicks survive pre-auth and resolve consistently after login.
- Files changed: `tracebud-backend/src/requests/requests.controller.ts`, `tracebud-backend/src/requests/requests.service.ts`, `apps/dashboard-product/app/requests/intent/page.tsx`, `apps/dashboard-product/app/login/page.tsx`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/api/requests/campaigns/[id]/decision-intent/route.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: CTA links now target `/requests/intent` for pre-login session capture, login now honors sanitized `next` redirect, and requests page now records decision intent through authenticated backend endpoint with user-facing confirmation notice.
- Risks: decision intent is currently acknowledged but not yet persisted as recipient-level immutable event ledger for compliance exports.
- Blockers: None.
- Next step: add immutable decision-intent audit event persistence keyed by campaign + recipient to support downstream reporting and dispute resolution.

### 2026-04-22 (execution: request campaign email CTA button UX)
- Focus: improve recipient decision flow from campaign emails with clear action controls and help links.
- Files changed: `tracebud-backend/src/requests/requests.service.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `Accept`, `Refuse`, and `Connect and start your compliance journey` button links plus docs deep-link; introduced env-configurable public URL inputs (`TRACEBUD_DASHBOARD_PUBLIC_URL`, `TRACEBUD_DOCS_PUBLIC_URL`) with safe defaults.
- Risks: current accept/refuse links carry URL intent only and are not yet bound to dedicated backend decision endpoints; recipients still complete decisions after login within app flow.
- Blockers: None.
- Next step: wire CTA decision endpoints/events so accept/refuse clicks can be captured pre-auth as intent telemetry and reconciled after login.

### 2026-04-22 (execution: request campaign outbound email copy/branding refinement)
- Focus: improve recipient-facing email clarity and trust signals for campaign requests.
- Files changed: `tracebud-backend/src/requests/requests.service.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: sender now uses branded display format (`Tracebud <...>`), subject now includes requesting organization context, and body now explains compliance/business continuity rationale with explicit 1-month free account onboarding guidance and downstream evidence-chain continuation flow.
- Risks: organization label currently falls back to env/tenant id; canonical tenant display-name source should replace fallback in a follow-up slice.
- Blockers: None.
- Next step: wire sender-organization label to canonical tenant profile metadata and add localized email templates.

### 2026-04-22 (execution: request campaign archive confirmation + soft-delete behavior)
- Focus: make campaign delete/cancel action functional with explicit confirmation and archive semantics.
- Files changed: `tracebud-backend/src/requests/requests.service.ts`, `tracebud-backend/src/requests/requests.controller.ts`, `apps/dashboard-product/app/api/requests/campaigns/[id]/archive/route.ts`, `apps/dashboard-product/app/requests/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added backend archive endpoint (`POST /v1/requests/campaigns/:id/archive`) setting status to `CANCELLED`; dashboard now shows confirmation prompt before archive and hides archived campaigns from default `All Status` list while preserving visibility via `Archived` filter.
- Risks: archive is status-based (soft-delete) and currently reversible only via direct DB/API mutation, not dedicated unarchive UI.
- Blockers: None.
- Next step: optionally add an explicit archived-campaign tab and unarchive action if ops workflows require restoration.

### 2026-04-22 (execution: request campaigns Resend email delivery)
- Focus: enable real outbound campaign invite delivery and remove no-email send behavior for draft campaigns.
- Files changed: `tracebud-backend/src/requests/requests.service.ts`, `tracebud-backend/sql/tb_v16_026_request_campaign_contact_targets.sql`, `tracebud-backend/scripts/apply-request-campaign-contact-targets-migration.mjs`, `tracebud-backend/package.json`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added persisted `target_contact_emails` campaign field (`TB-V16-026`), wired `sendDraft` to dispatch emails via Resend (`RESEND_API_KEY` + `RESEND_FROM_EMAIL` required), and set `pending_count` from successful recipient dispatch count.
- Risks: partial delivery currently proceeds when at least one email succeeds; failed recipients are not yet persisted with per-recipient failure telemetry.
- Blockers: None.
- Next step: add requests service tests that mock Resend outcomes (full success, partial failure, full failure) and consider recipient-level delivery audit events.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 67)
- Focus: simplify assessment API contract by removing duplicated alias routes and keeping canonical endpoints only.
- Files changed: `tracebud-backend/src/integrations/assessment-requests.controller.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: removed alias endpoints (`open/submit/cancel/...` variants) that forwarded to canonical handlers, retaining explicit lifecycle and update routes to reduce route-surface ambiguity and future maintenance load.
- Verification: `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`; repository search confirms removed alias URL paths have no runtime callers.
- Risks: Any undocumented external consumers using deleted alias paths would now fail; no in-repo callers were detected.
- Next step: publish an internal endpoint map for assessment workflow to align frontend and partner clients on canonical routes.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 68)
- Focus: publish a single-source canonical endpoint map so frontend/integration teams align on stable assessment workflow routes.
- Files changed: `product-os/04-quality/assessment-workflow-endpoint-map.md`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented canonical backend/proxy routes, role requirements, status transition semantics, and questionnaire submit-gate behavior; explicitly marks alias endpoints as removed to prevent re-adoption drift.
- Verification: doc publication slice; no runtime code changes in this step.
- Risks: without automation, documentation can drift if future route changes are introduced without updating the map.
- Next step: add optional OpenAPI/CI contract guardrail to fail when removed alias routes are reintroduced.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 69)
- Focus: harden workflow contract by adding CI enforcement that blocks reintroduction of deprecated assessment alias routes.
- Files changed: `scripts/openapi-governance/assessment-route-alias-check.mjs`, `package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added dedicated governance checker scanning `assessment-requests.controller.ts` for removed alias decorators and wired it into contracts CI as blocking step (`Enforce assessment canonical route aliases`).
- Verification: `npm run openapi:governance:assessment:aliases:check`.
- Risks: checker currently validates controller route decorators only (not generated OpenAPI path inventory), so parity with OpenAPI publication remains a separate optional hardening.
- Next step: optionally extend guardrail to assert canonical assessment path inventory directly against `docs/openapi/tracebud-v1-draft.yaml`.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 70)
- Focus: close route-doc drift by enforcing canonical assessment operation parity directly against `tracebud-v1-draft.yaml`.
- Files changed: `scripts/openapi-governance/assessment-route-alias-check.mjs`, `docs/openapi/tracebud-v1-draft.yaml`, `package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: upgraded assessment guardrail to fail when canonical OpenAPI operations are missing, and to fail when deprecated alias paths are present in either controller decorators or OpenAPI paths; published canonical assessment route inventory in OpenAPI draft under integrations.
- Verification: `npm run openapi:governance:assessment:aliases:check`; `npm run openapi:lint`.
- Risks: newly published assessment path blocks currently use broad response payload schemas (`additionalProperties`) and should be tightened over time to reduce contract ambiguity.
- Next step: introduce stricter schema refs for assessment request payloads/responses and add OpenAPI snapshot coverage for this path group.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 63)
- Focus: wire the new assessment-request backend contract into both operator surfaces so dashboard can dispatch/review and offline app can progress farmer execution states.
- Files changed: `apps/dashboard-product/app/api/integrations/assessments/requests/route.ts`, `apps/dashboard-product/app/api/integrations/assessments/requests/[id]/status/route.ts`, `apps/dashboard-product/app/requests/page.tsx`, `apps/offline-product/features/api/postPlot.ts`, `apps/offline-product/app/(tabs)/index.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dashboard proxy routes to preserve auth/session patterns while delegating to backend assessment APIs; added a dedicated assessment panel in dashboard requests for send + review transitions; added offline `Assessment Tasks` card + API helpers so farmers can step through `sent/opened/in_progress/submitted` without leaving the app home flow.
- Verification: `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`.
- Risks: Mobile UI currently exposes only linear progression controls and does not yet deep-link to the full questionnaire form sections; linkage remains pending in next slice.
- Next step: connect request records to questionnaire draft IDs and block `submitted` transitions until required questionnaire sections are complete.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 64)
- Focus: enforce request-to-questionnaire linkage integrity so farmer submission cannot close before linked questionnaire content is ready.
- Files changed: `tracebud-backend/sql/tb_v16_022_integration_assessment_request_questionnaire_link.sql`, `tracebud-backend/src/integrations/assessment-requests.controller.ts`, `tracebud-backend/src/integrations/assessment-requests.controller.spec.ts`, `apps/dashboard-product/app/requests/page.tsx`, `apps/offline-product/features/api/postPlot.ts`, `apps/offline-product/app/(tabs)/index.tsx`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `questionnaire_id` FK linkage for assessment requests and fail-closed submit guard that requires linked questionnaire state to be at least submitted; request create now accepts optional `questionnaireDraftId` while submit transition enforces readiness to preserve backward-compatible request creation and strict completion controls.
- Verification: `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`; `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`.
- Risks: Dashboard currently allows creating assessment requests without a questionnaire link (for backward compatibility), which defers strict linkage to submit-time validation rather than create-time prevention.
- Next step: auto-create/link questionnaire drafts at dashboard request creation so operators no longer need manual draft ID management and submit gate failures are minimized.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 65)
- Focus: remove manual draft-link friction by auto-creating questionnaire drafts during assessment request dispatch when no draft id is provided.
- Files changed: `tracebud-backend/src/integrations/assessment-requests.controller.ts`, `tracebud-backend/src/integrations/assessment-requests.controller.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: request creation now attempts tenant-validated explicit `questionnaireDraftId` when supplied, otherwise generates a draft in `integration_questionnaire_v2` (`status=draft`) and links it automatically before writing assessment request; audit payload now includes `questionnaireAutoCreated` for operator traceability.
- Verification: `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`; `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`.
- Risks: auto-created drafts currently use generated idempotency keys and minimal metadata, so downstream analytics may need additional metadata enrichment fields for stronger lineage traceability.
- Next step: harmonize stale migration guidance strings in controller error branches (`TB-V16-019` remnants) and add integration test coverage for auto-created draft linkage persistence.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 66)
- Focus: close reliability cleanup by removing stale migration guidance text and proving auto-link behavior against a real DB schema.
- Files changed: `tracebud-backend/src/integrations/assessment-requests.controller.ts`, `tracebud-backend/src/integrations/assessment-requests.controller.int.spec.ts`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: replaced remaining `TB-V16-019` guidance strings with `TB-V16-021/TB-V16-022` in assessment controller error paths; added DB-backed integration case that creates assessment request without draft id and asserts linked questionnaire draft persistence and `draft` status in `integration_questionnaire_v2`.
- Verification: `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`; `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/assessment-requests.controller.int.spec.ts`.
- Risks: Full integration suite currently contains unrelated failing specs, so verification is intentionally path-scoped for this feature slice.
- Next step: trim duplicate alias endpoints in assessment controller to reduce API surface and harden long-term maintainability.

### 2026-04-20 (execution: FEAT-009 S1 post-closeout hardening slice 62)
- Focus: implement the missing assessment handoff backbone so dashboard users can request farmer execution of SAI + Cool Farm assessments through app workflow states.
- Files changed: `tracebud-backend/src/integrations/assessment-requests.controller.ts`, `tracebud-backend/src/integrations/assessment-requests.controller.spec.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `tracebud-backend/sql/tb_v16_021_integration_assessment_requests.sql`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added tenant-safe assessment request API (`create/list/get/status transitions`) and persisted lifecycle states (`sent/opened/in_progress/submitted/reviewed/needs_changes/cancelled`) in dedicated V2 table indexed by tenant/status and tenant/farmer assignment; dashboard manager roles can create/manage, farmers can access assigned requests and progress execution states.
- Verification: `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`.
- Risks: Request-to-questionnaire linkage is not yet enforced in this slice, so status transitions are contract-ready but not yet hard-coupled to completed questionnaire payload validation.
- Next step: wire dashboard-product send-request UI and offline-product assigned-task execution screens to this backend contract, then attach questionnaire draft IDs for end-to-end submission traceability.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 53)
- Focus: define execution-ready external partner data platform contract so third-party software can consume Tracebud data for reporting and analytics without direct database access.
- Files changed: `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added FEAT-009 partner contract slice covering pull API, webhook push, and scheduled bulk export modes with explicit scope-based permissions, canonical sync transitions, deterministic retry/recovery semantics, immutable analytics evidence events, and v1.6 architecture gate applicability (GEOGRAPHY/ST_MakeValid, HLC ordering, O(1) lineage, TRACES chunk reconciliation, GDPR shredding safety).
- Risks: This is a documentation contract slice only; backend endpoint implementation, OpenAPI path publication, and partner portal operational controls are not yet shipped in code.
- Blockers: None.
- Next step: implement backend `partner-data` endpoint skeletons and webhook delivery contracts, then publish OpenAPI and add controller/integration tests for tenant-scope + idempotency behavior.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 54)
- Focus: ship first backend/API implementation slice for external partner reporting access with tenant-safe controller endpoints and OpenAPI publication.
- Files changed: `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/integrations.module.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `GET /v1/partner-data/datasets` and `POST /v1/partner-data/exports` with fail-closed tenant claim checks, explicit role gates, strict scope/format/idempotency validation, and immutable audit evidence events (`partner_dataset_requested`, `partner_dataset_exported`); published matching OpenAPI contracts and wired controller into integrations module.
- Risks: Export endpoint currently queues/audits intent only (no external object storage dispatch or webhook delivery worker yet); replay suppression is contracted through required idempotency key but not yet backed by persistent idempotency store.
- Blockers: None.
- Next step: add DB-backed idempotency ledger + replay behavior (`replayed=true`) and implement export artifact retrieval/status endpoints for partner pull workflows.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 55)
- Focus: harden partner export API with persistent idempotency replay and retrieval surfaces for status/download workflows.
- Files changed: `tracebud-backend/sql/tb_v16_018_partner_data_exports.sql`, `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added migration-backed `integration_partner_exports` table with tenant+idempotency uniqueness and status/state constraints; upgraded export start endpoint to return deterministic replay outcomes from persisted rows; added `GET /v1/partner-data/exports/{id}` and `GET /v1/partner-data/exports/{id}/download` with tenant+role fail-closed policy and completed-only artifact URL semantics.
- Risks: Download response currently returns stored artifact URL contract only; signed URL generation/rotation and worker-driven export completion remain pending implementation slices.
- Blockers: None.
- Next step: add DB-backed controller integration coverage with migration-applied test schema and implement worker path that transitions `queued -> completed|failed` while appending `partner_webhook_*` delivery lifecycle events.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 56)
- Focus: implement worker-style export completion transition and validate it with DB-backed integration tests.
- Files changed: `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/partner-data.controller.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `POST /v1/partner-data/exports/{id}/finalize` for canonical queued-to-terminal transitions (`completed|failed`) with role-scope enforcement; added immutable telemetry events (`partner_webhook_delivered`, `partner_webhook_terminal_failed`) and replay telemetry (`partner_sync_replayed`) on duplicate idempotency starts.
- Risks: Finalize endpoint currently performs direct state updates from API calls; background worker orchestration, retry backoff, and dead-letter handling are not yet modeled as separate runtime components.
- Blockers: None.
- Next step: add queue metadata (`attempt_count`, `next_retry_at`, `error_code`) to partner export persistence and introduce retry/release endpoints mirroring existing V2 run-operability patterns.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 57)
- Focus: implement partner-export retry queue operability with persisted retry metadata and deterministic retry endpoint behavior.
- Files changed: `tracebud-backend/sql/tb_v16_019_partner_data_export_retry_queue.sql`, `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/partner-data.controller.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added retry metadata columns/index (`attempt_count`, `error_code`, `next_retry_at`), retry queue read endpoint (`GET /v1/partner-data/exports/retry-queue`), and failed-export retry endpoint (`POST /v1/partner-data/exports/{id}/retry`) with role+tenant fail-closed guards and re-queue semantics.
- Risks: Retry backoff policy is currently fixed at a single computed window on failure finalize; dynamic exponential policy and retry-cap exhaustion telemetry are not yet implemented for partner exports.
- Blockers: None.
- Next step: add retry-cap + exponential backoff policy (`maxAttempts`, bounded next-retry growth) and expose compact retry summary diagnostics for operator runbooks.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 58)
- Focus: introduce deterministic retry-cap policy and compact retry summary diagnostics for partner export operations.
- Files changed: `tracebud-backend/sql/tb_v16_020_partner_data_export_retry_policy.sql`, `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/partner-data.controller.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added max-attempt retry policy (`5`) with bounded exponential backoff on failed finalize, exhaustion marker persistence (`retry_exhausted_at`), retry-cap guard on retry action, and new retry diagnostics surface (`GET /v1/partner-data/exports/retry-summary`).
- Risks: Retry scheduling is still API-driven and not yet delegated to a dedicated queue worker/cron trigger lane for autonomous processing.
- Blockers: None.
- Next step: add scheduler trigger contract for due retry queue processing and append per-run execution telemetry (`retry sweep started/completed/failed`) for operator runbook evidence.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 59)
- Focus: add scheduler-safe retry sweep trigger for due partner export retries with immutable sweep telemetry.
- Files changed: `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/partner-data.controller.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `POST /v1/partner-data/exports/retry-sweep/trigger` with scheduler token contract and bounded queue scan/retry behavior; added sweep telemetry event `partner_retry_sweep_executed` and response summary fields for deterministic runbook evidence.
- Risks: Sweep trigger currently uses query token contract (`schedulerToken`) and API-invoked execution; migration to header-based scheduler auth and cron ownership workflow remains a follow-up hardening option.
- Blockers: None.
- Next step: add sweep failure taxonomy (`started/completed/failed`) with per-run execution IDs and optional stale-claim style rollup fields in retry summary.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 60)
- Focus: add explicit retry-sweep lifecycle taxonomy and expose latest sweep rollups in retry diagnostics.
- Files changed: `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Retry sweep now emits lifecycle events (`started/completed/failed`) with deterministic `sweepExecutionId`; retry summary now includes `lastSweepRun` payload (execution id, status, scanned/retried counts, failure context) for operator runbook visibility.
- Risks: Sweep lifecycle events currently share `audit_log` without dedicated retention partitioning; high-volume production rollouts may require event partition or archive policy to keep query costs predictable.
- Blockers: None.
- Next step: add summary counters for sweep success/failure trend windows (`24h`, `7d`) and optional scheduler token version rollup for cross-environment diagnostics.

### 2026-04-21 (execution: FEAT-009 S1 post-closeout hardening slice 61)
- Focus: harden scheduler trigger auth contract and surface scheduler token-version rollups in sweep diagnostics.
- Files changed: `tracebud-backend/src/integrations/partner-data.controller.ts`, `tracebud-backend/src/integrations/partner-data.controller.spec.ts`, `tracebud-backend/src/integrations/partner-data.controller.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: migrated sweep auth token from query parameter to required header (`x-tracebud-scheduler-token`), and propagated `PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION` through sweep lifecycle telemetry, trigger response, and retry-summary `lastSweepRun` rollups.
- Risks: Header/token contract is now explicit but still env-driven; managed secret rotation automation and token-version policy enforcement cadence remain operational follow-up tasks.
- Blockers: None.
- Next step: add `24h/7d` sweep trend counters (started/completed/failed) into retry summary for higher-level operator reliability tracking.

### 2026-04-16 (execution: FEAT-004 compliance-section backend parity)
- Focus: remove remaining static compliance checks/evidence rows from package compliance workflow path.
- Files changed: `apps/dashboard-product/app/api/harvest/packages/[id]/route.ts`, `apps/dashboard-product/app/api/harvest/packages/[id]/route.test.ts`, `apps/dashboard-product/lib/use-package-detail.ts`, `apps/dashboard-product/app/compliance/page.tsx`, `apps/dashboard-product/app/compliance/page.test.tsx`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added package-detail proxy/hook and mapped compliance checks/evidence rows from backend readiness + voucher payloads, preserving fallback only when package diagnostics are not selected.
- Risks: Voucher status/source fields are still proxies for full document metadata; richer backend evidence endpoints should replace proxy mapping for production-grade semantics.
- Blockers: None for dashboard parity slice.
- Next step: add backend evidence-document endpoint and replace voucher-proxy mapping with typed evidence artifact records.

### 2026-04-16 (execution: FEAT-004 readiness reason-code dashboard consumption)
- Focus: align compliance UI with backend readiness diagnostics contract for operator remediation parity.
- Files changed: `apps/dashboard-product/app/api/harvest/packages/[id]/readiness/route.ts`, `apps/dashboard-product/app/api/harvest/packages/[id]/readiness/route.test.ts`, `apps/dashboard-product/lib/use-package-readiness.ts`, `apps/dashboard-product/app/compliance/page.tsx`, `apps/dashboard-product/app/compliance/page.test.tsx`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added backend readiness proxy + hook and rendered blocker/warning reason-code remediation directly in compliance page using API payloads instead of mock-only diagnostics.
- Risks: Current page still includes static compliance sections; full production parity requires replacing remaining mock check/evidence data with backend-backed contracts.
- Blockers: None for this dashboard wiring slice.
- Next step: migrate compliance check list + evidence requirement sections to backend-backed package readiness/evidence endpoints for full page contract parity.

### 2026-04-16 (execution: FEAT-004 backend reason-code parity)
- Focus: align API preflight readiness diagnostics with dashboard compliance-document reason codes.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added deterministic backend readiness reason codes (`DOC_MISSING`, `DOC_PENDING_REVIEW`, `DOC_REJECTED`, `DOC_STALE`, `DOC_SOURCE_MISSING`) with deduplicated emission and unit assertions for blocked/warning paths.
- Risks: Voucher-status/source fields are currently proxies for full document-review state; richer document metadata should replace proxies in production hardening.
- Blockers: None for backend parity slice.
- Next step: expose these reason codes in dashboard API consumption path and replace mock compliance page inputs with backend readiness payloads.

### 2026-04-16 (execution: FEAT-004 compliance-doc reason-code hardening)
- Focus: add deterministic autonomous evidence-document diagnostics with actionable remediation guidance.
- Files changed: `apps/dashboard-product/lib/compliance-doc-reason-codes.ts`, `apps/dashboard-product/lib/compliance-doc-reason-codes.test.ts`, `apps/dashboard-product/components/compliance/evidence-requirement.tsx`, `apps/dashboard-product/components/compliance/evidence-requirement.test.tsx`, `apps/dashboard-product/app/compliance/page.tsx`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added deterministic reason-code evaluator for missing/pending/rejected/stale/source-missing documents and wired remediation output directly into evidence cards; added unit/UI tests to lock behavior.
- Risks: Current evaluator uses fixed staleness threshold and mock-time assumptions; backend parity will be needed before production policy enforcement.
- Blockers: None for dashboard hardening slice.
- Next step: mirror reason-code contract into backend readiness evaluation so preflight API and dashboard diagnostics stay in strict parity.

### 2026-04-16 (execution: P1 cycle-close checklist standardization)
- Focus: prevent P1 cycle closure when artifact metrics are out of sync.
- Files changed: `product-os/04-quality/p1-cycle-close-checklist.md`, `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added cycle-close reconciliation checklist and made it a required final P1 cycle step; checklist now gates pass/fail based on one-pass/evidence/tracker/snapshot/ledger/weekly-summary alignment.
- Risks: If operators mark checklist pass without validating source artifacts, false confidence can mask drift.
- Blockers: External dependencies still constrain true closure speed even when reconciliation process is hardened.
- Next step: run next live P1 cycle and enforce checklist pass before declaring cycle closed.

### 2026-04-16 (execution: P1 weekly summary block standardization)
- Focus: eliminate manual phrasing drift in weekly P1 leadership updates.
- Files changed: `product-os/04-quality/p1-weekly-summary-block-template.md`, `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added paste-ready weekly summary template sourced from cycle snapshot + decision-history ledger fields and made it a required publication step in P1 cycle flow.
- Risks: Weekly summary quality degrades if source snapshot/ledger rows are incomplete before summary generation.
- Blockers: External dependencies still determine when reported trend deltas can materially improve.
- Next step: publish next live weekly P1 block using real counts/deltas from the latest snapshot and ledger row.

### 2026-04-16 (execution: P1 decision-history ledger standardization)
- Focus: make cross-cycle P1 drift and blocker recurrence auditable through append-only trend records.
- Files changed: `product-os/04-quality/p1-decision-history-ledger.md`, `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added append-only P1 ledger with cycle totals, delta fields, reopened-gate tracking, and blocker-theme trend notes; linked ledger as required step in one-pass/runbook/readiness cycle flow.
- Risks: Ledger loses trend signal if cycles are skipped or prior rows are edited instead of appended.
- Blockers: External partner/legal response timing still controls when trend lines can move materially.
- Next step: run next P1 cycle and append first live ledger row with real delta values versus prior cycle.

### 2026-04-16 (execution: P1 cycle snapshot template standardization)
- Focus: produce a concise leadership-ready P1 rollup each decision cycle.
- Files changed: `product-os/04-quality/p1-cycle-snapshot-template.md`, `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added reusable cycle snapshot template (gate status, risk status, escalation level, rollup counters, and 3-line leadership summary) and wired it into canonical P1 cycle flow.
- Risks: Snapshot summaries can diverge from source boards if one-pass/evidence/tracker sync steps are skipped before publication.
- Blockers: External dependencies still determine the pace of status movement from `pending` to `decided`.
- Next step: run the next live P1 cycle and publish one completed snapshot with real owners/SLA/escalation fields.

### 2026-04-16 (execution: P1 operator runbook standardization)
- Focus: make P1 decision cycles repeatable with explicit phase gates and escalation rules.
- Files changed: `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added P1 operator runbook with preflight, evidence verification, decision publication, and follow-up escalation phases; linked runbook into readiness and one-pass flow as canonical execution path.
- Risks: If cycle owners skip phase-1 evidence verification, gate states may appear complete without durable source proof.
- Blockers: External responders remain required to convert pending gates into decided/verified outcomes.
- Next step: run the next live P1 cycle strictly through the runbook and publish resolved owner/due dates for any remaining pending gates.

### 2026-04-16 (execution: P1 pending-gate tracker board standardization)
- Focus: tighten unresolved P1 follow-up execution with explicit owner/SLA/escalation tracking.
- Files changed: `product-os/04-quality/p1-pending-gate-tracker-board.md`, `product-os/04-quality/p1-external-decision-operator-runbook.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dedicated pending-gate tracker board and made tracker synchronization mandatory inside P1 one-pass/runbook/readiness cycle flow.
- Risks: Tracker can become stale if owners do not refresh SLA/escalation fields each cycle.
- Blockers: External dependencies still govern closure speed for `P1-01..P1-05`.
- Next step: run next P1 cycle and populate tracker owners/blocker classes/SLA dates with live values.

### 2026-04-16 (execution: P0-02 one-pass dispatch update hardening)
- Focus: eliminate post-send status drift by centralizing dispatch metadata into a single fill-once block.
- Files changed: `product-os/04-quality/p0-02-dispatch-one-pass-update-block.md`, `product-os/04-quality/p0-02-send-packet.md`, `product-os/04-quality/p0-02-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added one-pass dispatch block with single-source fields and paste-ready outputs for tracker active request, follow-up first row, current-focus line, and daily-log entry; linked the new artifact from send packet and readiness index.
- Risks: Incorrectly filled one-pass block can propagate the same bad value across multiple docs; operator must validate timestamp/date once before paste.
- Blockers: Still waiting for counsel appointment and first real dispatch event.
- Next step: once counsel is appointed and request is sent, use one-pass block as canonical source and paste outputs into tracker/current-focus/daily-log in one operation.

### 2026-04-16 (execution: P0-02 memo-receipt one-pass closeout hardening)
- Focus: reduce closeout friction and cross-file drift when signed counsel memo arrives.
- Files changed: `product-os/04-quality/p0-02-memo-received-one-pass-closeout-block.md`, `product-os/04-quality/p0-02-readiness-index.md`, `product-os/04-quality/p0-02-send-packet.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added memo-received one-pass block with fill-once metadata and paste-ready outputs for response tracker, intake template metadata, scaffold traceability record, and status log closures; linked artifact into readiness and send-packet chains.
- Risks: If memo ID/date is entered incorrectly once, the mistake can propagate across multiple closure artifacts.
- Blockers: Waiting on signed counsel memo receipt.
- Next step: on memo receipt, use one-pass closeout block as canonical source, then execute closeout checklist and mark `P0-02` complete on execution board.

### 2026-04-16 (execution: P0-02 operator runbook consolidation)
- Focus: provide one canonical playbook for executing P0-02 from dispatch through final closure.
- Files changed: `product-os/04-quality/p0-02-operator-runbook.md`, `product-os/04-quality/p0-02-readiness-index.md`, `product-os/04-quality/p0-02-send-packet.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added phased operator runbook with explicit branches for dispatch failure, follow-up cadence, revised response dates, unsigned memo handling, and closeout validation gating; linked runbook from readiness index and send packet as canonical flow reference.
- Risks: Operators may bypass runbook if they directly edit artifacts out-of-order; keep runbook link visible in primary packet/index docs.
- Blockers: None on documentation; operational blocker remains external counsel appointment.
- Next step: when counsel is appointed, execute P0-02 strictly through runbook phases and capture real dispatch metadata.

### 2026-04-16 (execution: P0-03 pilot gate bootstrap)
- Focus: prepare execution-ready artifacts for the required pre-release pilot gate.
- Files changed: `product-os/04-quality/p0-03-pilot-kickoff-checklist.md`, `product-os/04-quality/p0-03-pilot-evidence-log.md`, `product-os/04-quality/p0-03-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added pilot kickoff checklist (cooperative/buyer confirmation, scope, owners), evidence log (weekly metrics + acceptance table + spec-delta candidates), and readiness index with close definition tied directly to board criteria.
- Risks: Pilot gate remains execution-dependent on real partner participation and sustained 3-month tracking.
- Blockers: External partner confirmations (Tier 2 cooperative + Tier 3 buyer) still pending.
- Next step: confirm partner identities and dates, then initialize kickoff record + weekly checkpoint cadence.

### 2026-04-16 (execution: P0-03 one-pass kickoff + operator runbook hardening)
- Focus: reduce operational drift at pilot start and across weekly execution.
- Files changed: `product-os/04-quality/p0-03-kickoff-one-pass-update-block.md`, `product-os/04-quality/p0-03-operator-runbook.md`, `product-os/04-quality/p0-03-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added fill-once kickoff block for evidence/status synchronization and a phased runbook covering preconditions, kickoff, weekly cadence, spec feedback loop, and closure gates with explicit if/then escalation paths.
- Risks: Over-reliance on templated updates may hide weak qualitative signals unless weekly risk notes are kept specific.
- Blockers: Real partner confirmation still required before kickoff status can move to active.
- Next step: once cooperative and buyer are confirmed, run kickoff one-pass block and start week-1 checkpoint entries.

### 2026-04-16 (execution: P0-03 weekly checkpoint template standardization)
- Focus: ensure week-by-week pilot evidence quality and comparability across full 12-week window.
- Files changed: `product-os/04-quality/p0-03-weekly-checkpoint-template-pack.md`, `product-os/04-quality/p0-03-pilot-evidence-log.md`, `product-os/04-quality/p0-03-operator-runbook.md`, `product-os/04-quality/p0-03-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added standardized week 1-12 checkpoint table, gate-progress scoreboard (`farmers/20`, `batches/1`, `buyer/1`), status semantics (`pending/met/at_risk`), and midpoint escalation rules; linked pack as canonical reference in evidence log/runbook/readiness chain.
- Risks: Rigid templates can mask context if teams skip narrative risk/action notes; maintain qualitative commentary in each weekly row.
- Blockers: Pilot execution still blocked on confirmed cooperative and buyer.
- Next step: when kickoff is confirmed, pre-fill week-ending dates for all 12 rows and begin weekly updates using canonical scoreboard fields.

### 2026-04-16 (execution: P0-03 midpoint review packet standardization)
- Focus: make week-6 pilot decisions explicit, evidence-based, and operationally actionable.
- Files changed: `product-os/04-quality/p0-03-midpoint-review-packet.md`, `product-os/04-quality/p0-03-operator-runbook.md`, `product-os/04-quality/p0-03-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added midpoint packet with mandatory decision branch (`continue/recover/escalate`), objective criteria, required owner/action fields, and status-update touchpoints; linked packet into runbook and readiness artifact chain.
- Risks: Midpoint decisions can still drift if numeric evidence is stale at review time; ensure week-6 metrics are updated before selecting path.
- Blockers: External pilot kickoff dependencies remain unresolved.
- Next step: on week-6 checkpoint, run midpoint packet first, then apply resulting branch actions in evidence/status logs.

### 2026-04-16 (execution: P0-03 closeout one-pass standardization)
- Focus: reduce week-12 closeout friction and cross-file inconsistency.
- Files changed: `product-os/04-quality/p0-03-closeout-one-pass-update-block.md`, `product-os/04-quality/p0-03-pilot-evidence-log.md`, `product-os/04-quality/p0-03-operator-runbook.md`, `product-os/04-quality/p0-03-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added fill-once closeout artifact for final counters/report/decision and paste-ready updates across evidence log, execution board note, and status logs; linked closeout block into evidence/runbook/readiness chain.
- Risks: If final counters are entered incorrectly once, erroneous values can propagate into multiple closeout artifacts.
- Blockers: Pilot not yet active; closure artifact remains preparatory until execution evidence exists.
- Next step: at week 12, fill closeout one-pass block first, then apply updates in listed order and mark `P0-03` complete only if acceptance statuses are met.

### 2026-04-16 (execution: P1 external decision-gate one-pass standardization)
- Focus: reduce operational drift while tracking all P1 external decisions in one cycle.
- Files changed: `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added fill-once P1 decision-cycle template covering `P1-01..P1-05` with board/status paste blocks; added readiness index with close definition and execution chain.
- Risks: A single stale decision-cycle entry can propagate incorrect status across board and logs if not verified before paste.
- Blockers: External confirmations still required (cloud region finalization, TRACES endpoints, GeoID access model, and legal sign-off).
- Next step: execute one live P1 cycle with real evidence links and drive all remaining `pending` gates to explicit `decided` state.

### 2026-04-16 (execution: P1 evidence-register standardization)
- Focus: make P1 gate closure auditable through explicit evidence verification and freshness tracking.
- Files changed: `product-os/04-quality/p1-external-decision-evidence-register.md`, `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/04-quality/p1-external-decision-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added per-gate evidence register with verification states (`pending|verified|superseded`) and freshness dates; updated one-pass and readiness flow to require register sync before marking decisions complete.
- Risks: Evidence can still drift if stale rows are not superseded during subsequent decision cycles.
- Blockers: External source confirmations remain prerequisite for moving all rows to `verified`.
- Next step: run next P1 cycle with real references and advance each gate to `verified` evidence status.

### 2026-04-16 (execution: FEAT-003 post-closeout run-action UX hardening)
- Focus: reduce operator friction after failed deforestation decision runs and improve immediate evidence readability after successful runs.
- Files changed: `apps/dashboard-product/lib/use-plot-deforestation-decision-history.ts`, `apps/dashboard-product/lib/use-plot-deforestation-decision-history.test.tsx`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-deforestation-decision-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Hook `runDecision` now returns typed decision metadata (`cutoffDate`, `verdict`, `providerMode`) while preserving history auto-refresh; panel now displays a `Last run` metadata chip after successful execution and shows a contextual `Retry` action when run attempts fail.
- Risks: Retry currently reuses the same cutoff field and does not introduce exponential backoff; if backend instability becomes frequent, retry throttling may be needed.
- Blockers: None.
- Next step: optionally add a small run-attempt counter/timestamp in panel state for deeper operator troubleshooting context.

### 2026-04-16 (execution: P0-02 dispatch operability hardening)
- Focus: make legal memo dispatch execution fail-safe and one-shot once counsel is appointed.
- Files changed: `product-os/04-quality/p0-02-send-packet.md`, `product-os/04-quality/p0-02-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Expanded final send packet with strict preflight checklist, explicit source-pack manifest section, channel/thread metadata fields, and copy-ready post-send status snippet; readiness index now points directly to final packet + dispatch checklist as immediate execution pair.
- Risks: Dispatch remains externally blocked until counsel appointment; placeholders still require real values at send time.
- Blockers: Awaiting counsel onboarding.
- Next step: appoint counsel, fill packet placeholders once, send, then paste real send metadata into tracker + status logs immediately.

### 2026-04-16 (execution: P0-02 follow-up cadence hardening)
- Focus: reduce delay risk after dispatch by making legal-gate follow-ups fast and standardized.
- Files changed: `product-os/04-quality/p0-02-counsel-follow-up-templates.md`, `product-os/04-quality/p0-02-send-packet.md`, `product-os/04-quality/p0-02-readiness-index.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added copy-ready follow-up templates for D+3, D+6, and escalation scenarios; documented tracker action labels for consistent follow-up log entries; linked template artifact into send packet and readiness index.
- Risks: Template misuse is possible if expected response date is not updated after counsel date changes.
- Blockers: Awaiting initial counsel appointment and first dispatch event.
- Next step: once request is sent, execute D+3 template cadence and record each action in response tracker with thread continuity.

### 2026-04-16 (execution: FEAT-002 S1 code slice 18)
- Focus: make assignment export diagnostics operationally usable at higher volumes with explicit pagination and count visibility.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Assignment export diagnostics now tracks page state in admin UI, resets pagination when phase/status filters change, and shows total matching records plus previous/next navigation; OpenAPI now includes `GET /v1/audit/gated-entry/assignment-exports` and `/v1/audit/gated-entry/assignment-exports/export` with filter/pagination and CSV-header contract details.
- Risks: Assignment export list contract currently reuses generic gated-entry telemetry list schema, so assignment-specific event-type strictness is not yet represented as a dedicated typed OpenAPI schema.
- Blockers: None.
- Next step: optionally add a dedicated assignment-export telemetry schema in OpenAPI (with `plot_assignment_export_*` discriminator mapping) to fully type-check assignment-specific examples.

### 2026-04-16 (execution: FEAT-002 S1 code slice 19)
- Focus: close assignment-export diagnostics contract gap by publishing typed OpenAPI event schemas for assignment export telemetry.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `AssignmentExportTelemetryListResponse`, `AssignmentExportTelemetryEvent` discriminator mapping (`plot_assignment_export_requested|succeeded|failed`), typed event variants, and `AssignmentExportPayload`; assignment-export list path now references this dedicated schema and includes a valid typed example.
- Risks: Assignment payload keeps `additionalProperties: true` for forward compatibility, so strict unknown-field rejection is intentionally not enforced at contract layer.
- Blockers: None.
- Next step: optionally add backend unit assertions that OpenAPI-listed assignment payload keys (`status`, `fromDays`, `agentUserId`, `rowCount`, `error`) remain present in emitted audit payloads to guard docs/runtime parity.

### 2026-04-16 (execution: FEAT-002 S1 code slice 20)
- Focus: enforce runtime/OpenAPI parity for assignment export telemetry payload keys.
- Files changed: `tracebud-backend/src/plots/plots.service.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added service-level assertions for `appendAssignmentExportAuditEvent` to validate persisted payload key set/value mapping (`plotId`, `tenantId`, `exportedBy`, `rowCount`, `status`, `fromDays`, `agentUserId`, `error`) and explicit null normalization when optional fields are omitted.
- Risks: Coverage currently validates payload structure at service boundary, not downstream DB JSON schema constraints.
- Blockers: None.
- Next step: optionally add an audit-controller-level integration assertion reading back emitted `plot_assignment_export_*` payload rows to prove end-to-end parity through query surfaces.

### 2026-04-16 (execution: FEAT-002 S1 code slice 21)
- Focus: validate assignment export payload parity at audit query surface with tenant-isolated integration evidence.
- Files changed: `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added DB-backed integration test seeding mixed-tenant `plot_assignment_export_*` rows and asserting `listAssignmentExports` returns only signed-tenant rows with full expected payload contract keys (`tenantId`, `plotId`, `exportedBy`, `rowCount`, `status`, `fromDays`, `agentUserId`, `error`).
- Risks: Integration check currently validates one representative phase (`succeeded`) in returned row shape; additional explicit phase-specific assertions can be added later if needed.
- Blockers: None.
- Next step: optionally add a second integration assertion that applies phase/status filters together (`failed` + `active/cancelled`) to lock multi-filter query behavior against future SQL-clause regressions.

### 2026-04-16 (execution: FEAT-002 S1 code slice 22)
- Focus: lock assignment-export diagnostics multi-filter SQL behavior with DB-backed evidence.
- Files changed: `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added integration assertion seeding mixed-tenant rows across `failed/succeeded` phases and `active/cancelled` statuses, then validated `listAssignmentExports(..., phase='failed', status='active')` returns exactly the matching signed-tenant row.
- Risks: Assertion currently validates one combined filter pairing; expanding to additional pairings may still be useful if future query clauses become more complex.
- Blockers: None.
- Next step: optionally add API-level (HTTP/supertest) integration that hits `/v1/audit/gated-entry/assignment-exports` with phase/status query params to validate the full controller pipeline (query parsing + guard + response shape) in one lane.

### 2026-04-16 (execution: FEAT-002 S1 code slice 23)
- Focus: validate assignment-export diagnostics behavior through full HTTP request pipeline.
- Files changed: `tracebud-backend/src/audit/audit.assignment-exports.api.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added Nest API integration suite with guard override for `/v1/audit/gated-entry/assignment-exports`, asserting both missing-tenant `403` fail-closed behavior and combined `phase=failed` + `status=active` filter results over mixed seeded rows.
- Risks: API integration currently uses dedicated test harness table setup and does not yet exercise assignment-export CSV endpoint over HTTP in the same suite.
- Blockers: None.
- Next step: optionally extend this API suite with `/v1/audit/gated-entry/assignment-exports/export` assertion to validate CSV header contract (`X-Export-Row-Limit`, `X-Export-Row-Count`, `X-Export-Truncated`) through the same HTTP lane.

### 2026-04-16 (execution: FEAT-002 closeout slice)
- Focus: complete feature-level checklist hygiene and formal FEAT-002 status closure.
- Files changed: `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Marked remaining FEAT checklist items complete (state transitions, analytics coverage, v1.6 constraints, status-doc updates), resolved scope-level open question in-feature, and moved FEAT status to `Done (TB-V16-001 / FEAT-002)`.
- Risks: Remaining optional hardening slices (for example assignment-export CSV endpoint API-lane integration) are now treated as post-closeout improvements rather than FEAT-blocking requirements.
- Blockers: None.
- Next step: start FEAT-002 post-closeout hardening backlog only if desired (for example CSV export API-lane assertions), otherwise proceed to next priority FEAT.

### 2026-04-16 (execution: FEAT-002 S1 code slice 24)
- Focus: close assignment-export CSV endpoint HTTP-lane verification gap.
- Files changed: `tracebud-backend/src/audit/audit.assignment-exports.api.int.spec.ts`, `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Extended API integration suite with `/v1/audit/gated-entry/assignment-exports/export` assertion validating filtered CSV content plus metadata headers (`X-Export-Row-Limit`, `X-Export-Row-Count`, `X-Export-Truncated`) for combined `phase/status` filters.
- Risks: API-lane CSV assertion currently validates one representative filter pairing and one-row output shape; broader matrix coverage may still be added if endpoint logic expands.
- Blockers: None.
- Next step: proceed to the next FEAT priority unless additional FEAT-002 post-closeout hardening is explicitly requested.

### 2026-04-16 (execution: FEAT-004 S1 code slice 1)
- Focus: bootstrap rules-engine implementation with explicit execution matrix and gate mapping.
- Files changed: `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added FEAT-004 S1 baseline covering permissions/tenant boundaries, canonical state transitions, exception handling/recovery, analytics events, acceptance mapping, and v1.6 architecture-constraint applicability; moved FEAT-004 status from `Planned` to `In progress`.
- Risks: This is documentation-only kickoff and does not yet enforce runtime rules-evaluation logic in code paths.
- Blockers: None.
- Next step: implement FEAT-004 S1 first code slice by adding tenant-claim fail-closed + deterministic blocker/warning evaluation contract in backend rules endpoint/service, with unit tests.

### 2026-04-16 (execution: FEAT-004 S1 code slice 2)
- Focus: implement first runtime rules-engine contract for deterministic DDS package readiness evaluation.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `/v1/harvest/packages/{id}/readiness` endpoint with missing-tenant fail-closed + exporter-only policy and deterministic `blocked|warning_review|ready_to_submit` output from explicit blocker/warning rules; published OpenAPI path + response schemas and added controller/service unit coverage.
- Risks: Analytics emission for readiness lifecycle events is not yet implemented, so FEAT-004 analytics checklist item remains open pending telemetry slice.
- Blockers: None.
- Next step: add readiness analytics audit events (`requested/evaluated/blocked/warning/passed`) with unit assertions so FEAT-004 analytics coverage checklist can be closed.

### 2026-04-16 (execution: FEAT-004 S1 code slice 3)
- Focus: add readiness analytics lifecycle events for operational traceability.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `evaluateDdsPackageReadiness` now emits best-effort `dds_package_readiness_requested/evaluated/blocked|warning|passed` audit events with payload counters (`blockerCount`, `warningCount`) and status metadata; service tests now assert event emission semantics for blocked/warning/passed outcomes.
- Risks: Readiness analytics events currently persist with `user_id = null`; actor attribution can be added in a follow-up slice if required for compliance evidence depth.
- Blockers: None.
- Next step: optionally extend controller/API integration lane to assert readiness event persistence on live DB-backed calls and close FEAT-004 open-question/status hygiene if no further scope is required.

### 2026-04-16 (execution: FEAT-004 S1 code slice 4)
- Focus: prove readiness analytics persistence via DB-backed controller integration.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added controller-scope integration assertion that triggers `getPackageReadiness` under exporter role and verifies `dds_package_readiness_requested/evaluated/warning` events are persisted with expected payload counters; hardened assignment-list integration typing guard for JSON-vs-CSV union response.
- Risks: Integration currently validates warning-path lifecycle persistence; explicit blocked/passed lifecycle persistence checks can be added if stricter matrix evidence is needed.
- Blockers: None.
- Next step: close FEAT-004 remaining open-question/status hygiene (if scope is considered complete) or continue with actor-attribution enrichment for readiness audit events.

### 2026-04-16 (execution: FEAT-004 closeout slice)
- Focus: close feature-level FEAT-004 checklist hygiene and status.
- Files changed: `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Marked scope-level open question as resolved for FEAT-004 S1 boundaries and moved FEAT status from `In progress` to `Done (TB-V16-004 / FEAT-004)`.
- Risks: Optional post-closeout hardening (for example readiness actor attribution in audit payloads and blocked/passed integration matrix expansion) remains available but is not FEAT-blocking.
- Blockers: None.
- Next step: move to next priority FEAT or take optional FEAT-004 post-closeout hardening if explicitly requested.

### 2026-04-16 (execution: FEAT-003 S2 operational UX slice 1)
- Focus: accelerate geometry-history investigation workflows for operators and analysts.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/components/plots/__snapshots__/plot-geometry-history-panel.test.tsx.snap`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added per-user+plot persisted presets (`filter`, `sort`) for geometry-history panel, anomaly signals for high correction-variance revisions and rapid supersession cadence, and day-grouped timeline rendering for analyst scan speed; tightened hook/component regression tests and refreshed panel snapshots.
- Risks: Presets currently use browser localStorage and do not roam across devices; if cross-device continuity becomes required, server-side preference storage should be added in a follow-up slice.
- Blockers: None.
- Next step: extend backend geometry-history contract with optional typed anomaly metadata so investigator flags can be computed consistently across clients and exported evidence views.

### 2026-04-16 (execution: FEAT-003 S2 anomaly contract slice 2)
- Focus: centralize investigator anomaly-signal logic in backend geometry-history contract.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/dto/plot-geometry-history-response.dto.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `GET /v1/plots/:id/geometry-history` now returns typed `anomalies[]` metadata (large revision jump + frequent supersession) computed from immutable audit payload/timestamp context; dashboard hook now prefers backend anomalies for cross-client consistency with local fallback behavior retained for backward compatibility.
- Risks: Anomaly thresholds remain static (`>=3%` variance, `<=120min` cadence window); if operator feedback varies by commodity/region, threshold parameterization may be needed in a future slice.
- Blockers: None.
- Next step: add optional query controls for anomaly sensitivity profiles (`strict|balanced|lenient`) if investigation teams request tunable signal density.

### 2026-04-16 (execution: FEAT-003 S2 anomaly profile slice 3)
- Focus: make anomaly signal density tunable for investigator/operator workflows without changing immutable geometry history.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/components/plots/__snapshots__/plot-geometry-history-panel.test.tsx.snap`, `apps/dashboard-product/app/plots/[id]/page.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `anomalyProfile` query contract (`strict|balanced|lenient`) to geometry-history endpoint and OpenAPI; backend anomaly thresholds now profile-dependent, proxy forwards profile, hook includes/persists profile, and panel now exposes profile controls for analyst workflows.
- Risks: Profile thresholds are currently static constants in service code; if domain calibration changes frequently, they should move to config/policy source in a future hardening slice.
- Blockers: None.
- Next step: if needed, add profile usage telemetry (which profile chosen, anomaly count returned) to support data-driven threshold tuning.

### 2026-04-16 (execution: FEAT-003 S2 investigation ergonomics slice 4)
- Focus: reduce investigator friction when working with anomaly-heavy revision timelines.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/components/plots/__snapshots__/plot-geometry-history-panel.test.tsx.snap`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `Signals only` view-mode toggle to hide non-flagged events during triage; anomaly-profile switch now resets page to 1 (matching sort-change behavior) and panel now surfaces active sensitivity label for operator context.
- Risks: `Signals only` currently filters events client-side from loaded page data, so anomaly-only views still depend on current pagination window.
- Blockers: None.
- Next step: if required, add backend query support for anomaly-only pagination to guarantee exhaustive flagged-event traversal across large histories.

### 2026-04-16 (execution: FEAT-003 S2 anomaly-only pagination slice 5)
- Focus: make anomaly-focused investigations exhaustive across full geometry history timelines.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `signalsOnly` query contract end-to-end; backend now computes anomalies on full history when `signalsOnly=true`, filters to flagged events, and paginates that subset; proxy/hook forward and persist `signalsOnly` state to keep operator triage sessions consistent.
- Risks: Full-history anomaly computation path currently loads all geometry-history events for a plot before filtering, which may need SQL/window optimization if event volume grows significantly.
- Blockers: None.
- Next step: if needed, optimize `signalsOnly` with SQL-native anomaly predicates/window functions for very large audit histories.

### 2026-04-16 (execution: FEAT-003 S2 anomaly summary slice 6)
- Focus: improve investigation handoff speed with compact anomaly mix telemetry alongside timeline rows.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `anomalySummary` response metadata (`total`, `highSeverity`, `mediumSeverity`, and `byType` counts) with backend fallback-safe derivation in hook; panel now renders severity and type summary badges so analysts can assess risk mix before row-by-row review.
- Risks: Summary currently reflects returned anomaly set semantics; when using non-default filters/slices this remains correct for backend-calculated anomalies but may still require explicit “scope” labels if future views aggregate cross-plot data.
- Blockers: None.
- Next step: optionally add `anomalySummaryScope` metadata (e.g., `current_page`, `full_filtered_set`) if operators ask for stronger interpretability cues in exports and screenshots.

### 2026-04-16 (execution: FEAT-003 S2 anomaly summary scope slice 7)
- Focus: remove ambiguity in anomaly summary interpretation during operator handoffs.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `anomalySummaryScope` to geometry-history response (`current_page` for mixed timeline mode, `full_filtered_set` for `signalsOnly` mode) and surfaced a matching panel label (`Summary scope: ...`) so summary counters are explicitly scoped.
- Risks: Scope currently captures response semantics only; if future cross-plot aggregation is introduced, an additional aggregate scope class may be required.
- Blockers: None.
- Next step: optionally include scope metadata in CSV/export surfaces so offline handoff artifacts preserve the same interpretation hints.

### 2026-04-16 (execution: FEAT-003 S2 signals-only reset slice 8)
- Focus: eliminate stale pagination offsets when toggling between mixed-event and anomaly-only timeline views.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `Signals only` toggle now resets page to 1 via explicit handler, matching existing chronology/profile reset behavior and reducing operator confusion during rapid mode switches.
- Risks: Reset occurs on every toggle, including when users intentionally toggle repeatedly while mid-review; accepted for consistency with other control transitions.
- Blockers: None.
- Next step: if requested, preserve last page per mode (`mixed` vs `signalsOnly`) as an advanced preference without violating clarity defaults.

### 2026-04-16 (execution: FEAT-003 S2 mode-memory slice 9)
- Focus: preserve investigator context when switching repeatedly between mixed and anomaly-only timeline modes.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added per-mode in-panel page memory (`mixed`, `signalsOnly`) so toggling modes restores the last known page for each mode while still defaulting to page 1 on first switch.
- Risks: Mode page-memory is session-local component state; navigation reload resets bookmarks unless persisted in a future UX extension.
- Blockers: None.
- Next step: if beneficial, persist mode page-memory in per-user plot presets with safe bounds checks against changing totals.

### 2026-04-16 (execution: FEAT-003 S2 mode-memory persistence slice 10)
- Focus: persist mixed/signals-only mode page memory across reloads so investigators keep long-review context between sessions.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `modePageMemory` to persisted geometry-history preset payload (user+plot scoped) and sanitized stored values to positive integers (`>=1`) before read/apply to avoid malformed local preset breakage.
- Risks: Stored page bookmarks may exceed a future smaller result set after data changes; current behavior relies on existing pagination boundary guards and can be tightened with optional max-page clamping.
- Blockers: None.
- Next step: optionally add max-page clamp when toggling modes so restored bookmarks snap to current total-page bounds.

### 2026-04-16 (execution: FEAT-003 S2 mode-memory bounds slice 11)
- Focus: prevent invalid mode-bookmark restores when filtered totals/page counts shrink between investigation sessions.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Mode toggle flow now computes current max page (`ceil(total/pageSize)`, minimum 1) and clamps both stored current-mode page and restored target-mode page, preserving continuity while enforcing pagination validity.
- Risks: Clamp targets current loaded totals and may still briefly diverge from backend if totals change between rapid toggles and reloads; accepted as consistent with existing page-state semantics.
- Blockers: None.
- Next step: optionally centralize page-clamp helper in hook layer so pagination validity rules are reused across future controls that restore saved page state.

### 2026-04-16 (execution: FEAT-003 S2 mode-memory clamp centralization slice 12)
- Focus: eliminate duplicate page-bound logic by moving clamp behavior into the shared geometry-history hook contract.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added hook-level `clampPage(candidate)` derived from current `total/pageSize`; panel mode-toggle restore/save paths now use this canonical helper and hook tests now assert clamp behavior directly.
- Risks: Consumers must use hook-provided helper (not local ad-hoc clamping) to keep semantics aligned; mitigated by panel migration and regression coverage in this slice.
- Blockers: None.
- Next step: optionally route `setPage` transitions through clamp helper to guarantee bounded page updates on every pagination control path.

### 2026-04-16 (execution: FEAT-003 S2 bounded setPage slice 13)
- Focus: guarantee valid page transitions across all geometry-history pagination controls, not only mode-toggle restores.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Hook now wraps internal page state with bounded `setPage` semantics (min 1 always; max-page clamp when totals are known) and exposes this guarded setter as the public pagination contract.
- Risks: In unknown-total states, setter permits forward page intents with min-only guard until total is known; accepted to avoid premature over-clamping before first payload.
- Blockers: None.
- Next step: optionally apply the same bounded-setter convention to other dashboard investigation hooks with paged contracts for cross-panel consistency.

### 2026-04-16 (execution: FEAT-003 S2 filter-pagination reset slice 14)
- Focus: prevent stale pagination jumps when investigators switch timeline event filters mid-review.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Event-type filter actions (`all`, `plot_created`, `plot_geometry_superseded`) now route through a shared handler that also resets page to 1, aligning with existing sort/profile/signals reset ergonomics.
- Risks: Users changing filters while intentionally browsing higher pages are returned to page 1; accepted for consistency with other scope-changing controls.
- Blockers: None.
- Next step: optionally add persisted per-filter page memory if future operator feedback prefers deep-page continuity over strict reset consistency.

### 2026-04-16 (execution: FEAT-003 S2 filter-page-memory slice 15)
- Focus: preserve deep investigation context when analysts switch between `all`/`created`/`revised` filters repeatedly.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added per-filter page memory (`all`, `plot_created`, `plot_geometry_superseded`) to user+plot presets with integer sanitization; panel filter toggles now save current filter page and restore target filter page through canonical clamp guards.
- Risks: Preset payload size increases slightly with additional per-filter state; accepted as negligible compared to UX continuity gains.
- Blockers: None.
- Next step: optionally extend this memory model to combined filter+signals mode keys if operators need independent bookmarks per cross-filter mode combination.

### 2026-04-16 (execution: FEAT-003 S2 hybrid-view page-memory slice 16)
- Focus: preserve investigator position independently for each combined filter+signals view to avoid cross-mode bookmark collisions.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added persisted `viewPageMemory` keyed by `<filter>|<mixed|signals>` and updated filter/signal toggle handlers to save current key + restore target key with canonical clamp fallback to prior mode/filter memories.
- Risks: Additional memory dimensions increase preset complexity; mitigated with bounded integer sanitization and regression coverage on key restoration paths.
- Blockers: None.
- Next step: optionally deprecate older mode/filter-only memory structures after migration window if hybrid keys fully cover operator continuity use-cases.

### 2026-04-16 (execution: FEAT-003 S2 hybrid-memory cleanup slice 17)
- Focus: remove duplicate continuity paths so panel bookmark restore logic follows one canonical memory model.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Panel toggles now restore exclusively from `viewPageMemory`; hook adds `buildInitialViewPageMemory(...)` to migrate old `modePageMemory`/`filterPageMemory` presets into hybrid keys and writes only the hybrid memory going forward.
- Risks: Legacy-only memory keys are no longer actively updated, so rollback paths relying on them may observe stale values; accepted since hybrid keys are now authoritative and migration preserves continuity.
- Blockers: None.
- Next step: optionally remove legacy preset fields from read contract once migration horizon is complete and no rollback dependency remains.

### 2026-04-16 (execution: FEAT-003 S2 legacy-memory retirement slice 18)
- Focus: finalize bookmark-contract simplification by removing deprecated mode/filter memory fields from active hook surfaces.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Hook now returns only hybrid `viewPageMemory` for bookmark state while still accepting legacy persisted fields as one-time read fallback during preset parse; panel tests/mocks were aligned to the reduced contract.
- Risks: Any external callers that still expected legacy memory fields from hook return would break; mitigated by current in-repo consumer coverage and green hook/panel suites.
- Blockers: None.
- Next step: optionally add telemetry counter for legacy-fallback read path usage to decide when dead-code removal of fallback parsing is safe.

### 2026-04-16 (execution: FEAT-003 S2 legacy-fallback telemetry slice 19)
- Focus: add lightweight migration visibility for legacy preset fallback usage before removing compatibility parsing.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Hook now increments local counter key `tb:geometry-history:legacy-view-fallback-count` whenever `viewPageMemory` requires fallback to legacy mode/filter values; logic is best-effort and non-blocking.
- Risks: Counter is localStorage-scoped and not centrally aggregated, so rollout decisions still require manual evidence collection; accepted as low-cost migration signal.
- Blockers: None.
- Next step: optionally surface this counter in admin diagnostics/export to enable cross-session trend review before deleting legacy fallback parser code.

### 2026-04-16 (execution: FEAT-003 S2 legacy-fallback visibility slice 20)
- Focus: make compatibility migration activity visible to investigators/operators directly in geometry-history UX.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Hook now exposes `legacyViewFallbackCount` from local storage and panel renders a muted diagnostics line only when count > 0 (`Legacy preset fallback migrations: N`).
- Risks: Counter is cumulative per browser profile and may not reflect tenant/session partitioning; accepted for temporary migration-monitoring use.
- Blockers: None.
- Next step: optionally add a reset control (admin-only) or export metadata hook for this counter if ops needs runbook-grade evidence capture.

### 2026-04-16 (execution: FEAT-003 S2 legacy-counter reset slice 21)
- Focus: improve migration diagnostics operability by enabling in-panel counter reset without manual localStorage edits.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Hook now provides `resetLegacyViewFallbackCount()` that clears both local storage key and in-memory state; panel renders `Reset migration counter` button when count is visible.
- Risks: Counter reset is local browser/profile scoped and can hide historical migration evidence if used prematurely; accepted because reset is explicit and intended for controlled baselining.
- Blockers: None.
- Next step: optionally guard reset action behind admin role gate or confirmation dialog if broader user personas gain access to this panel.

### 2026-04-16 (execution: FEAT-003 S2 legacy-counter reset confirmation slice 22)
- Focus: reduce accidental diagnostics baseline loss by adding confirmation UX to migration counter reset.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Reset action now enters confirmation state (`Confirm reset` + `Cancel`) and only clears telemetry after explicit confirmation.
- Risks: Adds one extra click to reset workflow; accepted to protect migration diagnostics evidence from unintended clearing.
- Blockers: None.
- Next step: optionally require typed confirmation when counter exceeds threshold if ops wants stronger safety for high-signal periods.

### 2026-04-16 (execution: FEAT-003 S2 legacy-counter typed-confirmation slice 23)
- Focus: add proportional reset safety for high-signal migration periods where accidental counter reset has larger evidence impact.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Counter reset now requires typed `RESET` input whenever `legacyViewFallbackCount >= 10`; lower counts keep click-confirm UX for speed.
- Risks: Additional friction for high-count resets may slow operator workflows; accepted because high-count windows have higher evidence sensitivity.
- Blockers: None.
- Next step: optionally make threshold configurable (env or admin setting) if teams want stricter/looser reset controls by environment.

### 2026-04-16 (execution: FEAT-003 closeout slice 24)
- Focus: finalize FEAT-003 completion state by closing checklist/open-question items and flipping feature status to Done.
- Files changed: `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Marked all feature checklist gates complete, closed remaining open question for FEAT-003 scope, and set feature status to `Done (TB-V16-002 / FEAT-003)`.
- Risks: None for implementation behavior; this is a documentation/state closure slice.
- Blockers: None.
- Next step: optional post-closeout hygiene pass to archive any no-longer-needed migration diagnostics controls once operations signoff confirms low fallback usage.

### 2026-04-16 (execution: tenant-hardening controller policy coverage slice)
- Focus: extend harvest/plots tenant-boundary integration proof for exporter-only package surfaces at controller level.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added controller-scope integration assertions for tenant-claim and exporter-role enforcement across `listPackages`, `getPackage`, and `getPackageTracesJson`; also updated existing geometry-history controller calls in this suite to pass new params (`anomalyProfileRaw`, `signalsOnlyRaw`) after signature drift.
- Risks: None; added coverage strengthens policy regression detection and suite remains green.
- Blockers: None.
- Next step: optionally add submit-path policy assertion (`PATCH /v1/harvest/packages/:id/submit`) in the same DB-backed controller scope suite for full package-surface parity.

### 2026-04-16 (execution: tenant-hardening package-submit parity slice)
- Focus: complete package-surface controller policy parity by adding submit-path tenant/role enforcement integration coverage.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added DB-backed deny/allow assertions for `submitPackage` under missing tenant claim, non-exporter with tenant claim, and exporter with tenant claim; ownership lane now passes with expanded count (`5 suites`, `19 tests`).
- Risks: None; this is additive policy regression coverage.
- Blockers: None.
- Next step: optionally publish refreshed ownership lane evidence in release QA notes if this slice is intended for immediate release-gate signoff.

### 2026-04-16 (execution: ownership-evidence refresh slice)
- Focus: update release QA evidence with latest ownership/access lane snapshot after tenant-hardening policy coverage expansion.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added a `Latest local validation snapshot` section documenting `npm run test:integration:ownership` results (`5 suites`, `19 tests`) and explicitly flagged pending CI artifact refresh.
- Risks: Local snapshot is not a substitute for CI artifact evidence; release signoff still requires next CI run baseline update.
- Blockers: None.
- Next step: run/collect next CI ownership lane artifact and update `Latest validated run` block from `13/13` to `19/19`.

### 2026-04-16 (execution: FEAT-002 S1 matrix bootstrap)
- Focus: make FEAT-002 implementation-ready by defining explicit S1 execution gates before code slices begin.
- Files changed: `product-os/02-features/FEAT-002-mobile-field-capture.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added FEAT-002 S1 matrix covering permissions, state transitions, exception handling/recovery, analytics coverage, acceptance mapping, and v1.6 architecture-constraint applicability (with offline HLC/idempotency marked mandatory).
- Risks: None; this is planning/traceability hardening to reduce ambiguity during upcoming implementation slices.
- Blockers: None.
- Next step: implement first FEAT-002 code slice by extending DB-backed/controller-level integration coverage for offline sync envelope fail-closed tenant + HLC/idempotency enforcement.

### 2026-04-15 (execution: governance README command CI gate)
- Focus: fail fast on documentation drift by checking README command references against actual npm scripts.
- Files changed: `scripts/openapi-governance/readme-commands-check.mjs`, `scripts/openapi-governance/README.md`, `package.json`, `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:readme:check` command and CI step `Validate OpenAPI governance README commands`; README now includes this command and updated CI order.
- Risks: Parser currently extracts `npm run <name>` via regex and may need updates if README command formatting style changes.
- Blockers: None.
- Next step: optionally extend the doc-check to verify referenced file paths in README also exist.

### 2026-04-15 (execution: governance README path-existence gate)
- Focus: strengthen doc integrity by ensuring README references only valid repository paths.
- Files changed: `scripts/openapi-governance/readme-commands-check.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Extended README check to parse backticked path-like tokens and fail when referenced files/paths do not exist; updated governance README/checklist wording to reflect path validation behavior.
- Risks: Path-detection heuristic is regex-based and may require tuning if README formatting conventions become more complex.
- Blockers: None.
- Next step: optionally formalize README lint rules (command + path references) as a reusable markdown QA utility beyond governance scripts.

### 2026-04-15 (execution: reusable markdown reference QA utility)
- Focus: convert one-off governance README linting logic into reusable markdown QA utility for future doc-governance checks.
- Files changed: `scripts/openapi-governance/markdown-reference-check.mjs`, `scripts/openapi-governance/readme-commands-check.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added shared `runMarkdownReferenceCheck` helper that enforces command/script existence + referenced path existence; wired existing README governance check to consume utility without changing CI contract.
- Risks: Utility uses regex extraction and may need parser expansion if markdown conventions evolve significantly.
- Blockers: None.
- Next step: optionally generalize utility invocation via CLI arguments to support additional markdown docs with zero-wrapper scripts.

### 2026-04-15 (execution: markdown QA CLI generalization)
- Focus: enable zero-wrapper adoption of markdown governance checks across additional docs by adding argument-driven CLI support.
- Files changed: `scripts/openapi-governance/markdown-reference-check.mjs`, `package.json`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:markdown:check` script and CLI flags (`--markdown`, `--package-json`, `--no-commands`, `--no-paths`) while preserving existing README-specific wrapper for CI stability.
- Risks: CLI argument parser is intentionally minimal and should be extended if future docs require richer include/exclude semantics.
- Blockers: None.
- Next step: optionally add one additional non-governance markdown doc invocation in CI to prove multi-doc reuse in production workflows.

### 2026-04-15 (execution: markdown QA multi-doc CI proof)
- Focus: validate generic markdown QA utility in production CI flow against a non-governance operations doc.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added contracts lane step `Validate release QA doc references (path integrity)` running `openapi:governance:markdown:check -- --markdown product-os/04-quality/release-qa-evidence.md --no-commands`; tightened path-token extraction to exclude command text false positives by matching only no-whitespace path-like backtick tokens.
- Risks: Path extraction remains regex-based and may need adjustment if markdown path-token conventions evolve.
- Blockers: None.
- Next step: optionally add structured `--report <path>` output mode for markdown checker and publish a dedicated artifact for multi-doc doc-governance trend tracking.

### 2026-04-15 (execution: markdown reference report artifacting)
- Focus: convert markdown reference checks from pass/fail-only to measurable CI evidence with report artifact outputs.
- Files changed: `scripts/openapi-governance/markdown-reference-check.mjs`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `--report` support to markdown checker JSON output; contracts lane now emits `openapi-markdown-reference-report.json`, appends markdown-reference summary counters, and uploads `contracts-markdown-reference-metrics`.
- Risks: Report schema is currently unversioned and should be versioned if consumed by downstream automation.
- Blockers: None.
- Next step: optionally add a small schema validator for markdown-reference report JSON before artifact upload, mirroring existing governance artifact-shape enforcement.

### 2026-04-15 (execution: markdown report schema assertion gate)
- Focus: enforce markdown-reference artifact quality with explicit schema/invariant checks before publication.
- Files changed: `scripts/openapi-governance/markdown-report-assert.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:markdown:report:assert` to validate required fields/types and PASS/FAIL consistency (`errors` empty on PASS, non-empty on FAIL) for `openapi-markdown-reference-report.json`; contracts lane now runs assertion before uploading markdown metrics artifact.
- Risks: Report validator is hand-rolled and may require updates if report contract evolves.
- Blockers: None.
- Next step: optionally add a markdown-report JSON schema file and update validator to check schema version + backward compatibility during contract changes.

### 2026-04-15 (execution: markdown report schema versioning)
- Focus: formalize markdown report contract evolution with explicit schema versioning and compatibility checks.
- Files changed: `docs/openapi/markdown-reference-report.schema.json`, `scripts/openapi-governance/markdown-reference-check.mjs`, `scripts/openapi-governance/markdown-report-assert.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added versioned markdown report schema (`schemaVersion: 1`), updated report producer to emit `schemaVersion`, and hardened assertion to enforce schema-defined required keys/allowed keys plus version compatibility.
- Risks: Schema evolution requires coordinated updates between report producer and assertion script to avoid false CI failures.
- Blockers: None.
- Next step: optionally expose schemaVersion in CI summary output and add a policy to require explicit migration notes for schema-version increments.

### 2026-04-15 (execution: markdown schema-version observability runbook)
- Focus: make markdown report contract version explicitly visible in CI and document a repeatable schema-bump procedure for operators.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `Schema version` line to markdown summary block and documented 5-step schema bump procedure (schema update, producer update, validator update, local checks, CI confirmation).
- Risks: Procedure can drift if command names or CI step names change without README updates.
- Blockers: None.
- Next step: optionally add a CI README check assertion that required schema-bump procedure section headings are present.

### 2026-04-15 (execution: schema-bump README structure gate)
- Focus: prevent schema-bump runbook drift by enforcing required README section/step structure in CI.
- Files changed: `scripts/openapi-governance/readme-commands-check.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Extended README check to assert presence of `Markdown Schema Bump Procedure` heading and required five numbered step anchors; failure now blocks contracts lane if structure regresses.
- Risks: String-match assertions are intentionally strict and may require updates if procedure wording is intentionally revised.
- Blockers: None.
- Next step: optionally convert required step anchors into a dedicated JSON policy file consumed by README check to reduce hardcoded strings.

### 2026-04-15 (execution: README structure policy externalization)
- Focus: convert hardcoded README structure assertions into declarative policy inputs for safer maintenance.
- Files changed: `docs/openapi/governance-readme-policy.json`, `docs/openapi/governance-readme-policy.schema.json`, `scripts/openapi-governance/readme-commands-check.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added README policy + schema files and updated README checker to validate policy shape and enforce `requiredAnchors` from policy file instead of inline constants.
- Risks: Policy and README can still drift if policy anchors are updated without corresponding README updates.
- Blockers: None.
- Next step: optionally add a dedicated CI report artifact for README policy validation results to mirror governance policy/codeowners reporting patterns.

### 2026-04-15 (execution: README governance metrics artifacting)
- Focus: provide first-class artifact evidence for README governance checks, matching other governance lanes.
- Files changed: `scripts/openapi-governance/readme-commands-check.mjs`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `--report` output support to README checker, contracts summary block for README governance status/counters, and `contracts-openapi-readme-governance-metrics` artifact upload.
- Risks: README report schema is currently implicit and may need explicit schema/validator if downstream consumers depend on strict contract guarantees.
- Blockers: None.
- Next step: optionally add a dedicated README-report assertion script + schema and include it in contracts checks before artifact upload.

### 2026-04-15 (execution: README report schema assertion gate)
- Focus: enforce explicit contract integrity for README governance report prior to artifact publication.
- Files changed: `docs/openapi/governance-readme-report.schema.json`, `scripts/openapi-governance/readme-report-assert.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added README report schema + assertion script, introduced `openapi:governance:readme:report:assert`, and wired contracts lane to run assertion before uploading `contracts-openapi-readme-governance-metrics`.
- Risks: README report schema is versionless today and should be versioned if fields become consumer-facing.
- Blockers: None.
- Next step: optionally include README report metrics in consolidated governance metrics JSON and artifact inventory assertions for single-surface evidence completeness.

### 2026-04-16 (execution: governance metrics unification with README lane)
- Focus: unify governance evidence so consolidated metrics/inventory assertions include README governance status alongside policy/CODEOWNERS.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/artifacts-assert.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated governance summary/metrics generation to include `readmeValidationStatus` + `readmeReport`, expanded `expectedArtifacts` inventory with README metrics artifact, and tightened artifacts assertion to validate README report parity.
- Risks: Consolidated metrics generation currently resides in CI inline script and should remain synchronized with future report-schema changes.
- Blockers: None.
- Next step: optionally extract governance metrics generation from CI inline script into dedicated script under `scripts/openapi-governance/` for easier testability/versioning.

### 2026-04-16 (execution: governance metrics generator extraction)
- Focus: reduce CI workflow drift by centralizing consolidated governance summary/metrics assembly in a dedicated script.
- Files changed: `scripts/openapi-governance/metrics-generate.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:metrics:generate` and replaced inline CI JS in governance summary step; script now writes `openapi-governance-metrics.json` and appends `OpenAPI Governance Checks` summary using report inputs.
- Risks: Script behavior now depends on CI env vars for run links/metadata and should be smoke-tested when workflow context variables change.
- Blockers: None.
- Next step: optionally add dedicated unit-style smoke test for `metrics-generate.mjs` with fixture reports to prevent regressions in summary/metrics output shape.

### 2026-04-16 (execution: governance metrics generator smoke coverage)
- Focus: add fixture-based regression safety for consolidated governance metrics generation.
- Files changed: `scripts/openapi-governance/metrics-generate.smoke.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:metrics:smoke` with 2 fixture scenarios (all-pass/readme-fail), asserting overall status folding, expected artifact inventory count, and summary heading generation; CI now runs smoke step before artifact assertions.
- Risks: Smoke harness validates high-value invariants but not full summary-line content, so wording regressions in summary text may still pass.
- Blockers: None.
- Next step: optionally extend smoke harness to assert selected summary lines (README/policy/codeowners statuses) for stronger regression coverage.

### 2026-04-16 (execution: governance summary-line smoke assertions)
- Focus: catch human-facing governance summary regressions by asserting key status lines in smoke fixtures.
- Files changed: `scripts/openapi-governance/metrics-generate.smoke.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Expanded smoke harness to assert README/policy/CODEOWNERS/overall status lines in generated summary for both fixture scenarios.
- Risks: Assertions intentionally pin summary wording and may require updates if summary phrasing is intentionally revised.
- Blockers: None.
- Next step: optionally move expected summary-line templates into a shared constants module used by both generator and smoke test to reduce duplication.

### 2026-04-16 (execution: governance summary template deduplication)
- Focus: remove summary-line duplication between generator and smoke harness to reduce wording-drift maintenance overhead.
- Files changed: `scripts/openapi-governance/metrics-summary-lines.mjs`, `scripts/openapi-governance/metrics-generate.mjs`, `scripts/openapi-governance/metrics-generate.smoke.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Introduced shared summary-lines builder/heading constant and updated both metrics generation + smoke assertions to consume shared templates.
- Risks: Shared template changes now simultaneously affect generator output and smoke expectations, so updates must still preserve human-readable CI summary quality.
- Blockers: None.
- Next step: optionally add a snapshot fixture for full summary block content to detect accidental line-order changes.

### 2026-04-16 (execution: governance summary full-block snapshot enforcement)
- Focus: increase smoke-test strictness by validating exact governance summary block content/ordering/newline semantics.
- Files changed: `scripts/openapi-governance/metrics-generate.smoke.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added strict `summary === expectedSummaryBlock` assertion in smoke scenarios while retaining per-line checks for easier failure diagnosis.
- Risks: Strict snapshot assertions intentionally fail on benign formatting changes and require coordinated updates when summary formatting is intentionally revised.
- Blockers: None.
- Next step: optionally split summary builder into a structured data model + renderer to allow format evolution with clearer compatibility checks.

### 2026-04-16 (execution: governance smoke strictness balancing)
- Focus: preserve strong regression detection while reducing flaky failures from non-semantic summary formatting changes.
- Files changed: `scripts/openapi-governance/metrics-generate.smoke.mjs`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Replaced exact full-summary equality assertion with stricter structured metrics/status assertions plus ordered summary-line presence checks driven by shared templates.
- Risks: Pure formatting-only regressions outside key lines may no longer fail smoke checks by design.
- Blockers: None.
- Next step: optionally add dedicated presentation snapshot test with lower severity (non-blocking warning lane) if full formatting governance is still desired.

### 2026-04-16 (execution: non-blocking presentation snapshot lane)
- Focus: surface governance-summary formatting drift without adding blocker noise to contracts enforcement.
- Files changed: `scripts/openapi-governance/metrics-presentation-check.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added non-blocking CI step `Presentation snapshot check (non-blocking)` with `continue-on-error: true` to run `openapi:governance:metrics:presentation:check`, warning on summary-template drift while preserving blocking structured governance gates.
- Risks: Non-blocking warning can be ignored if teams do not routinely review warning statuses in contracts lane.
- Blockers: None.
- Next step: optionally auto-append a warning summary subsection when presentation check fails to make drift visibility unavoidable in job summary output.

### 2026-04-16 (execution: presentation warning summary UX)
- Focus: improve operator visibility by surfacing non-blocking presentation drift directly in contracts summary output.
- Files changed: `.github/workflows/ci.yml`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added CI step `Publish presentation drift warning` conditioned on `metrics_presentation_check` failure, appending `Governance Presentation Drift Warning` with remediation hints to `GITHUB_STEP_SUMMARY`.
- Risks: Warning section depends on step outcome wiring; workflow refactors must preserve `metrics_presentation_check` step id semantics.
- Blockers: None.
- Next step: optionally include warning occurrence count in governance metrics JSON for trend tracking of presentation drift over time.

### 2026-04-16 (execution: presentation drift telemetry artifacting)
- Focus: make non-blocking presentation drift queryable from governance artifacts, not only human-readable summary text.
- Files changed: `scripts/openapi-governance/metrics-generate.mjs`, `scripts/openapi-governance/artifacts-assert.mjs`, `scripts/openapi-governance/metrics-generate.smoke.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `presentationDriftWarningCount` and `presentationValidationRecordedAt` fields to `openapi-governance-metrics.json`, retained `presentationValidationStatus`, and tightened artifact assertions to enforce type + status/count consistency.
- Risks: Local runs that invoke artifact assertions without CI-style `PRESENTATION_VALIDATION_STATUS` annotation will fail as intended; operators must keep local verification command parity with CI sequence.
- Blockers: None.
- Next step: optionally add lightweight rollup query/documentation showing how to aggregate presentation drift counts across retained governance artifacts.

### 2026-04-16 (execution: presentation drift trend rollup helper)
- Focus: reduce operator friction by adding a one-command rollup for presentation drift trend telemetry.
- Files changed: `scripts/openapi-governance/metrics-trend-summary.mjs`, `package.json`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:metrics:trend` to recursively discover `openapi-governance-metrics.json` from provided inputs, aggregate PASS/FAIL/UNKNOWN counts plus drift warning totals, and optionally emit JSON output (`--json`) for downstream reporting.
- Risks: Recursive directory scans can include stale local artifacts if users point the tool at very broad paths; operators should scope `--input` to intended artifact roots.
- Blockers: None.
- Next step: optionally add a small CI post-processing lane that runs trend rollup across downloaded historical artifacts and publishes a compact weekly delta summary.

### 2026-04-16 (execution: CI presentation trend publishing)
- Focus: make drift telemetry operationally visible in each contracts run without requiring manual artifact parsing.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added contracts steps to generate `openapi-governance-presentation-trend.json` via `openapi:governance:metrics:trend -- --input . --json`, append `Governance Presentation Drift Trend` summary lines, and upload artifact `contracts-openapi-governance-presentation-trend`.
- Risks: Trend section currently reflects files present in current run workspace, not cross-run history unless historical artifacts are explicitly downloaded into the scanned path.
- Blockers: None.
- Next step: optionally add artifact download/merge flow to produce true multi-run weekly deltas in CI.

### 2026-04-16 (execution: CI presentation trend delta lane)
- Focus: move from single-run trend visibility to prior-run delta visibility for faster operator triage.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/metrics-trend-delta.mjs`, `package.json`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added non-blocking contracts step to fetch previous `contracts-openapi-governance-presentation-trend` artifact via GitHub Artifacts API, compute deltas using new `openapi:governance:metrics:trend:delta`, and publish `FAIL delta vs previous` plus `Drift warning delta vs previous` summary lines.
- Risks: Artifact lookup can return none for first-run or retention-expired history; summary now explicitly reports previous availability so missing baseline is visible.
- Blockers: None.
- Next step: optionally constrain prior-artifact selection to branch-matched successful runs if historical volume starts producing noisy baseline choices.

### 2026-04-16 (execution: branch-aware delta baseline hardening)
- Focus: improve trend-delta signal quality by reducing cross-branch or failed-run baseline noise.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Updated previous-artifact retrieval to prefer same-branch candidates (`GITHUB_HEAD_REF`/`GITHUB_REF_NAME`) and verify source workflow run conclusion is `success` before accepting baseline for delta computation.
- Risks: Branch names diverging across forks/renames can reduce baseline hit rate; summary availability line remains the operator signal for this condition.
- Blockers: None.
- Next step: optionally enrich artifact selection with workflow-name filtering if additional jobs begin producing similarly named trend artifacts.

### 2026-04-16 (execution: workflow-name delta baseline filtering)
- Focus: prevent delta baselines from accidentally sourcing artifacts from unrelated workflows.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added workflow-name filter (`GITHUB_WORKFLOW`) in prior-artifact selection, while preserving same-branch and successful-run constraints.
- Risks: Workflow renames can reduce baseline availability until new artifact history accumulates under the updated name.
- Blockers: None.
- Next step: optionally pin by workflow file path/id when GitHub API payload includes stable identifiers across display-name changes.

### 2026-04-16 (execution: stable workflow-path baseline matching)
- Focus: improve baseline stability across workflow display-name changes.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Prior-artifact workflow filtering now prefers workflow file path resolved from `GITHUB_WORKFLOW_REF` (for example `.github/workflows/ci.yml`) and falls back to `GITHUB_WORKFLOW` name only when path resolution is unavailable.
- Risks: If `workflow_runs.path` is absent in API responses for older runs, fallback-to-name path is used and may be less stable during rename windows.
- Blockers: None.
- Next step: optionally persist chosen baseline metadata (run id + workflow path/name) into trend-delta JSON for audit traceability.

### 2026-04-16 (execution: baseline metadata traceability)
- Focus: make trend-delta baseline selection auditable without inspecting CI logs manually.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/metrics-trend-delta.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added baseline metadata file generation in fetch step, extended `metrics-trend-delta` with `--baseline-metadata`, and surfaced `runId`/`workflowPath`/`workflowName` in delta JSON plus CI summary lines.
- Risks: Baseline metadata remains null when no prior artifact is available, so downstream dashboards must treat null as a valid no-baseline state.
- Blockers: None.
- Next step: optionally add schema/assertion checks for trend and delta artifacts to enforce metadata shape contracts in CI.

### 2026-04-16 (execution: trend/delta schema assertion gates)
- Focus: harden governance artifact contracts by validating trend and delta JSON shapes before publication.
- Files changed: `.github/workflows/ci.yml`, `package.json`, `docs/openapi/governance-presentation-trend.schema.json`, `docs/openapi/governance-presentation-trend-delta.schema.json`, `scripts/openapi-governance/trend-report-assert.mjs`, `scripts/openapi-governance/trend-delta-report-assert.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added explicit schemas and assert scripts for presentation trend + delta artifacts, wired new npm commands and CI assertion steps, and uploaded dedicated delta artifact `contracts-openapi-governance-presentation-trend-delta`.
- Risks: Assertion strictness can fail runs if future trend fields are added without synchronized schema updates.
- Blockers: None.
- Next step: optionally add small fixture smoke tests for both new assert scripts to detect schema/checker drift earlier in local dev loops.

### 2026-04-16 (execution: trend assertion smoke coverage)
- Focus: detect checker/schema regressions earlier using fixture-driven assertion smoke tests.
- Files changed: `.github/workflows/ci.yml`, `package.json`, `scripts/openapi-governance/trend-assertions.smoke.mjs`, `scripts/openapi-governance/README.md`, `product-os/04-quality/release-qa-evidence.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added `openapi:governance:metrics:trend:assertions:smoke` to run valid+invalid fixture scenarios against both trend assertion scripts, and wired it into contracts lane after schema assertions.
- Risks: Smoke fixtures can become stale if assertion semantics evolve; requires coordinated fixture updates with assertion changes.
- Blockers: None.
- Next step: optionally include smoke execution stats in governance summary for quicker reviewer visibility.

### 2026-04-16 (execution: FEAT-001 close-out pack)
- Focus: close FEAT-001 formally by converting implemented coverage into checklist-complete done state.
- Files changed: `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Marked FEAT-001 checklist items complete, closed FEAT-001-scoped open question, and set feature status to Done with explicit linkage to accumulated governance/quality evidence.
- Risks: Remaining non-FEAT infrastructure items (for example owner-level PostGIS remediation) remain tracked separately and should not be conflated with FEAT-001 closure scope.
- Blockers: None.
- Next step: run one final CI governance pass and capture resulting run URL/artifacts as post-closure evidence snapshot if desired.

### 2026-04-16 (execution: post-FEAT-001 priority handoff)
- Focus: shift active delivery focus from completed FEAT-001 to FEAT-003 geospatial mapping execution.
- Files changed: `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: Updated active focus and `Open first` pointer to `product-os/02-features/FEAT-003-geospatial-mapping.md` and added FEAT-003 kickoff item in current work queue.
- Risks: If kickoff tasks are not concretized quickly, focus can drift back to residual FEAT-001 maintenance instead of net-new FEAT-003 progress.
- Blockers: None.
- Next step: define FEAT-003 first executable slice (permissions/state/exception/analytics/acceptance gate matrix) and begin implementation.

### 2026-04-16 (execution: FEAT-003 S1 matrix definition)
- Focus: convert FEAT-003 from generic in-progress status into an executable first slice with explicit quality gates.
- Files changed: `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added FEAT-003 S1 execution matrix covering tenant/permission boundaries, canonical geometry state transitions, fail-closed exception handling, required analytics events, acceptance/exception-code mapping, and v1.6 architecture applicability.
- Risks: S1 is planning-complete but implementation remains pending; delivery risk shifts to execution throughput on backend geometry validation paths.
- Blockers: None.
- Next step: implement FEAT-003 S1 in code (plot geometry create/update path) with DB-backed tests for `GEO-101`, `GEO-102`, and tenant-claim denial semantics.

### 2026-04-16 (execution: FEAT-003 S1 code slice 1)
- Focus: implement first enforceable geospatial hardening path from S1 matrix in backend plot ingestion.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added tenant-claim requirement on plot create path and standardized geometry normalization failures to canonical coded responses (`GEO-101`, `GEO-102`) with explicit unit assertions.
- Risks: Plot metadata update path still remains metadata-only; full geometry-edit state transition coverage is a subsequent FEAT-003 slice.
- Blockers: None.
- Next step: implement FEAT-003 S1 code slice 2 for geometry update/revision flow with immutable supersession semantics and matching coded validation paths.

### 2026-04-16 (execution: FEAT-003 S1 code slice 2)
- Focus: deliver geometry revision path with immutable supersession semantics and canonical spatial validation outcomes.
- Files changed: `tracebud-backend/src/plots/dto/update-plot-geometry.dto.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `PATCH /v1/plots/:id/geometry` with tenant-claim and farmer ownership gates, introduced `plot_geometry_superseded` audit event payload containing previous/next geometry context, and preserved coded `GEO-101`/`GEO-102` fail-closed behavior on normalization failures.
- Risks: Supersession is currently represented through immutable audit chaining on a single plot row rather than a dedicated geometry-version table; future slice should externalize versions if required for richer revision queries.
- Blockers: None.
- Next step: add dedicated geometry-revision history read endpoint (or version table) and corresponding OpenAPI contract updates for FEAT-003 evidence completeness.

### 2026-04-16 (execution: FEAT-003 S1 code slice 3)
- Focus: complete FEAT-003 S1 evidence read surface by exposing immutable geometry revision history retrieval.
- Files changed: `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `GET /v1/plots/:id/geometry-history` with tenant-claim fail-closed behavior and farmer ownership boundary checks; service returns immutable `plot_created` + `plot_geometry_superseded` audit-chain events ordered by latest first; OpenAPI now documents `/v1/plots/{id}/geometry-history` with `operationId: getPlotGeometryHistory`.
- Risks: Read response is currently a raw audit-event array and may require a typed DTO schema in a follow-up slice for stricter contract governance.
- Blockers: None.
- Next step: add response DTO typing for geometry-history payload and extend automated tests to cover farmer scope violation and positive-path query forwarding.

### 2026-04-16 (execution: FEAT-003 S1 code slice 4)
- Focus: harden geometry-history read API contract with explicit typed response semantics and stronger controller branch coverage.
- Files changed: `tracebud-backend/src/plots/dto/plot-geometry-history-response.dto.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Introduced typed geometry-history DTO (`PlotGeometryHistoryEventDto`), mapped audit rows into normalized API shape in service, added controller tests for farmer scope-violation + successful forwarding path, and aligned OpenAPI with `PlotGeometryHistoryEvent` / `PlotGeometryHistoryPayload` schemas.
- Risks: `payload.details` remains intentionally flexible (`additionalProperties`) while source audit payload evolves; if strict downstream typing is required, introduce event-type-discriminated payload schemas in a follow-up.
- Blockers: None.
- Next step: add dedicated service-level tests for geometry-history mapping behavior (timestamp normalization + eventType coercion + payload fallback handling).

### 2026-04-16 (execution: FEAT-003 S1 code slice 5)
- Focus: prevent geometry-history response drift by codifying service-level mapping invariants in unit tests.
- Files changed: `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/dto/plot-geometry-history-response.dto.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dedicated `getGeometryHistory` tests for timestamp normalization (`Date|string` to ISO), unknown-event coercion to stable contract value, and payload fallback semantics when audit payload is missing; corrected Swagger DTO `details` metadata type to maintain TS compatibility (`type: Object`).
- Risks: Event payload remains intentionally open (`details`) and could still vary by event producer; stricter discriminated payload typing is a future hardening option.
- Blockers: None.
- Next step: add API-level integration coverage for `GET /v1/plots/:id/geometry-history` with tenant-claim denial/allow and farmer ownership enforcement against a real DB fixture.

### 2026-04-16 (execution: FEAT-003 S1 code slice 6)
- Focus: validate geometry-history access policy at integration level using persisted DB fixtures and real controller/service wiring.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Extended controller-scope integration schema with `audit_log` fixture table and added geometry-history test covering (1) missing tenant-claim rejection, (2) farmer non-owner rejection, and (3) farmer owner allow path returning immutable `plot_created`/`plot_geometry_superseded` events.
- Risks: Integration coverage currently validates controller/service behavior directly (not HTTP transport/middleware chain); if needed, add E2E Nest app test for route-level wiring in a follow-up.
- Blockers: None.
- Next step: add explicit OpenAPI response examples for `PlotGeometryHistoryEvent` (`plot_created` and `plot_geometry_superseded`) to improve consumer onboarding and contract review clarity.

### 2026-04-16 (execution: FEAT-003 S1 code slice 7)
- Focus: improve geometry-history API consumability by documenting concrete response payload examples in the OpenAPI contract.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `200` examples under `/v1/plots/{id}/geometry-history` showing both `plot_created` and `plot_geometry_superseded` event payloads with realistic immutable-audit context fields (`plotId`, actor/device, reason, normalization metadata).
- Risks: Example payload fields in `details` are illustrative and may evolve with future audit producers; API contract remains authoritative on required envelope fields.
- Blockers: None.
- Next step: add a lightweight backend controller test asserting geometry-history response serialization shape (camelCase envelope fields) on the allow path to guard DTO/service/controller drift.

### 2026-04-16 (execution: FEAT-003 S1 code slice 8)
- Focus: harden client-facing geometry-history serialization guarantees at controller-test level.
- Files changed: `tracebud-backend/src/plots/plots.controller.spec.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added allow-path controller assertion that geometry-history responses preserve camelCase envelope fields (`eventType`, `userId`, `deviceId`, nested payload shape) and do not expose snake_case variants (`event_type`, `user_id`, `device_id`).
- Risks: This guard focuses on controller output shape with mocked service output; DB serialization drift is separately covered by integration/service mapping slices.
- Blockers: None.
- Next step: add one narrow dashboard-proxy contract test for `/api/.../geometry-history` shape pass-through (if/when that proxy endpoint is introduced) to extend this guarantee across backend-to-frontend boundaries.

### 2026-04-16 (execution: FEAT-003 S1 code slice 9)
- Focus: extend geometry-history contract guarantees across dashboard boundary via API proxy route.
- Files changed: `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dashboard `GET /api/plots/[id]/geometry-history` proxy with fail-closed behavior when backend URL is unset, auth-header pass-through, backend error status/payload propagation, and route tests asserting camelCase response shape preservation.
- Risks: Proxy currently forwards backend payload as-is; if UI-specific shaping is introduced later, additional explicit contract tests will be required to avoid drift.
- Blockers: None.
- Next step: add minimal dashboard consumer hook (`usePlotGeometryHistory`) with loading/error/empty states and one component-level test to complete end-to-end FEAT-003 read-path usability on the frontend.

### 2026-04-16 (execution: FEAT-003 S1 code slice 10)
- Focus: complete FEAT-003 frontend read-path usability by wiring geometry-history into plot detail UX.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/app/plots/[id]/page.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added reusable `usePlotGeometryHistory` hook that calls dashboard proxy with auth header support and retry trigger; added `PlotGeometryHistoryPanel` with explicit loading/error/empty/data rendering; mounted panel on plot detail route to expose immutable geometry timeline directly in FEAT-003 UI.
- Risks: Current UI shows raw event labels and actor IDs for speed-to-value; follow-up UX slice can add friendlier labels/date formatting and role-aware redaction if required.
- Blockers: None.
- Next step: add a small filter control (for example event-type filter) and optional pagination cap in the panel to keep long plot histories scannable at scale.

### 2026-04-16 (execution: FEAT-003 S1 code slice 11)
- Focus: improve geometry-history panel operability for larger event sets.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added event-type filters (`All`, `Created`, `Revised`) with client-side derived counts and visible cap context (`Showing X of Y events (max 100 from API)`), plus UI tests validating filter behavior and count text.
- Risks: Filtering is client-side on currently loaded rows (capped by backend limit); if requirements expand to deep-history exploration, server-side pagination/filter params should be added.
- Blockers: None.
- Next step: expose backend `limit`/`offset` query support through the plots geometry-history route and hook to enable true server-side pagination for long-lived plots.

### 2026-04-16 (execution: FEAT-003 S1 code slice 12)
- Focus: deliver true server-side pagination for geometry-history across backend, proxy, and frontend UX.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Backend geometry-history now accepts `limit`/`offset`, computes total rows, and returns paginated envelope (`items`, `total`, `limit`, `offset`); dashboard proxy forwards pagination params; hook now manages page state with page-size requests; panel now exposes previous/next controls while preserving event-type filtering.
- Risks: Pagination currently remains offset-based; if event volume grows substantially, cursor-based pagination may be needed later for stable high-offset performance.
- Blockers: None.
- Next step: add lightweight panel sorting control (newest/oldest) and wire to backend query so investigators can traverse chronology in either direction without client-side resorting.

### 2026-04-16 (execution: FEAT-007 S1 code slice 2)
- Focus: implement chat-thread backend contract endpoints with tenant enforcement and replay-safe idempotent message behavior.
- Files changed: `tracebud-backend/src/chat-threads/chat-threads.module.ts`, `tracebud-backend/src/chat-threads/chat-threads.controller.ts`, `tracebud-backend/src/chat-threads/chat-threads.service.ts`, `tracebud-backend/src/chat-threads/dto/create-chat-thread.dto.ts`, `tracebud-backend/src/chat-threads/dto/post-chat-message.dto.ts`, `tracebud-backend/src/chat-threads/chat-threads.controller.spec.ts`, `tracebud-backend/src/chat-threads/chat-threads.service.spec.ts`, `tracebud-backend/src/app.module.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-007-chat-threads.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced `v1/chat-threads` endpoint set (list/create/messages/post) with tenant-claim fail-closed behavior and deterministic idempotency replay semantics keyed by tenant + idempotency key; service now bootstraps `chat_threads` and `chat_messages` persistence schema and blocks archived-thread writes; OpenAPI now documents chat-thread request/response contracts.
- Risks: slice currently establishes contract and replay semantics only; thread resolve/reopen/archive state transitions and diagnostics telemetry read/export surfaces are deferred to next slices.
- Blockers: None.
- Next step: FEAT-007 S1 code slice 3 to persist thread lifecycle telemetry events and expose initial diagnostics read surface for operator visibility.

### 2026-04-16 (execution: FEAT-007 S1 code slice 1)
- Focus: bootstrap chat-threads execution matrix for tenant-safe collaboration lifecycle before endpoint implementation.
- Files changed: `product-os/02-features/FEAT-007-chat-threads.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented FEAT-007 S1 permission/tenant boundaries, canonical thread lifecycle transitions, deterministic exception/recovery expectations, analytics event baseline, acceptance mapping, and v1.6 architecture constraint applicability; moved FEAT-007 status from `Planned` to `In progress`.
- Risks: runtime chat-thread endpoints and persistence contracts are not implemented yet; next slice must convert matrix assumptions into concrete backend API contract and tests.
- Blockers: None.
- Next step: FEAT-007 S1 code slice 2 to implement thread contract endpoint bootstrap with tenant/role enforcement and idempotent message-post semantics.

### 2026-04-16 (execution: FEAT-006 closeout slice)
- Focus: close FEAT-006 by finalizing architecture-constraint applicability, acceptance mapping evidence, and open-question/status hygiene.
- Files changed: `product-os/02-features/FEAT-006-filing-middleware.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: documented explicit closure notes for spatial correctness, offline idempotency integrity, lineage runtime constraints, TRACES chunking extension path, and GDPR-safe telemetry references; resolved provider/protocol open question to retain deterministic internal middleware semantics for S1 scope; moved FEAT-006 status to `Done (TB-V16-006 / FEAT-006)`.
- Risks: external filing protocol adapter and chunked payload transport are intentionally deferred beyond FEAT-006 S1 and should be tracked in downstream filing integration slices.
- Blockers: None.
- Next step: start FEAT-007 S1 code slice 1 (chat-threads execution matrix bootstrap for permissions/state transitions/exceptions/analytics/acceptance/v1.6 constraints).

### 2026-04-16 (execution: FEAT-006 S1 code slice 4)
- Focus: expose filing generation/submission lifecycle diagnostics with tenant-scoped list and CSV export surfaces for operator evidence workflows.
- Files changed: `tracebud-backend/src/audit/audit.controller.ts`, `tracebud-backend/src/audit/audit.controller.spec.ts`, `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.ts`, `apps/dashboard-product/app/api/analytics/gated-entry/route.test.ts`, `apps/dashboard-product/lib/use-gated-entry.ts`, `apps/dashboard-product/app/admin/page.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-006-filing-middleware.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added backend diagnostics endpoints `GET /v1/audit/gated-entry/filing-activity` and `/filing-activity/export` with optional phase filter across `dds_package_generation_*` and `dds_package_submission_*`; dashboard analytics proxy now forwards `eventKind=filing_activity`; admin diagnostics now renders Filing Activity table with phase filter/pagination and CSV export controls; OpenAPI now publishes filing-activity list/export paths and typed discriminator event schema.
- Risks: filing diagnostics currently reuse shared audit_log reads and synchronous CSV generation (cap: 5000 rows); if event volume grows materially, asynchronous export jobs may be required.
- Blockers: None.
- Next step: FEAT-006 S1 code slice 5 to close filing middleware architecture-constraint checklist, verify acceptance mapping evidence, and prepare FEAT-006 closeout readiness.

### 2026-04-16 (execution: FEAT-006 S1 code slice 3)
- Focus: implement package-generation contract and replay-safe submission idempotency semantics for filing middleware lifecycle.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/dto/submit-dds-package.dto.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-006-filing-middleware.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `POST /v1/harvest/packages/:id/generate` (exporter-only, tenant-claim required) and enhanced `PATCH /v1/harvest/packages/:id/submit` to require `idempotencyKey`; submission now replays previously accepted outcome for same package+key and logs `dds_package_submission_replayed` instead of reapplying side effects.
- Risks: Idempotency replay currently keys on audit-log lookup (`packageId` + `idempotencyKey`), which is sufficient for v1 slice but may later move to dedicated submission ledger if throughput/query volume grows.
- Blockers: None.
- Next step: FEAT-006 S1 code slice 4 to expose filing lifecycle diagnostics read/export surfaces (generation/submission phases) for operator evidence and handoff workflows.

### 2026-04-16 (execution: FEAT-006 S1 code slice 2)
- Focus: implement filing pre-flight endpoint contract with explicit tenant/exporter scope enforcement and audit-ready lifecycle telemetry.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-006-filing-middleware.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `GET /v1/harvest/packages/:id/filing-preflight` as exporter-only + tenant-claim fail-closed surface; pre-flight now composes deterministic readiness/risk outputs and emits `dds_package_filing_preflight_requested/evaluated/blocked/ready` events with tenant and actor context.
- Risks: Pre-flight currently composes existing readiness+risk evaluations sequentially, which duplicates lower-level readiness/risk lifecycle events; if event volume becomes noisy, we may consolidate to a single composed-evaluation path in later slice.
- Blockers: None.
- Next step: FEAT-006 S1 code slice 3 to introduce package-generation contract and idempotency key semantics aligned with submission lifecycle transitions.

### 2026-04-16 (execution: FEAT-003 S1 code slice 13)
- Focus: enable chronology-direction control for geometry-history investigations.
- Files changed: `tracebud-backend/src/plots/plots.service.ts`, `tracebud-backend/src/plots/plots.controller.ts`, `tracebud-backend/src/plots/plots.service.spec.ts`, `tracebud-backend/src/plots/plots.controller.spec.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.ts`, `apps/dashboard-product/app/api/plots/[id]/geometry-history/route.test.ts`, `apps/dashboard-product/lib/use-plot-geometry-history.ts`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `sort` (`desc`/`asc`) query handling in backend geometry-history endpoint and paginated response metadata; wired proxy pass-through for `sort`; hook now tracks `sort` state; panel now exposes `Newest`/`Oldest` controls and displays current sort mode.
- Risks: Current sort uses timestamp ordering only; if same-timestamp event ties become common, a secondary deterministic sort key (for example `id`) may be needed.
- Blockers: None.
- Next step: add tiny backend integration assertion that verifies asc/desc ordering behavior on persisted geometry audit events to complement existing unit coverage.

### 2026-04-16 (execution: FEAT-003 S1 code slice 14)
- Focus: prove chronology ordering semantics with DB-backed evidence instead of unit-only SQL-string assertions.
- Files changed: `tracebud-backend/src/harvest/controller-scope.int.spec.ts`, `tracebud-backend/src/plots/plots.service.ts`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Updated controller-scope integration to new paginated geometry-history signature and added persisted-event ordering assertion for both `sort=desc` and `sort=asc`; fixed service event-type literal typing to keep strict TS compatibility in integration compile path.
- Risks: Ordering still keys solely on timestamp; rare equal-timestamp collisions may need a deterministic tie-breaker column in future if forensic workflows require strict total ordering.
- Blockers: None.
- Next step: add one UI regression assertion that toggling `Newest`/`Oldest` resets panel page to 1, preventing stale pagination offsets when changing chronology direction.

### 2026-04-16 (execution: FEAT-003 S1 code slice 15)
- Focus: remove pagination-offset ambiguity when users switch chronology direction in geometry-history panel.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.tsx`, `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Sort control handler now explicitly resets page to 1 whenever `Newest`/`Oldest` is selected, and component test now asserts both sort update and page reset callback behavior.
- Risks: This behavior currently resets page even if the user re-selects the already active sort mode; acceptable for now, but can be optimized later if needed.
- Blockers: None.
- Next step: add tiny hook-level test coverage for sort/page state interplay to complement component-level callback assertions.

### 2026-04-16 (execution: FEAT-003 S1 code slice 16)
- Focus: protect hook-level request semantics for geometry-history pagination/sort state transitions.
- Files changed: `apps/dashboard-product/lib/use-plot-geometry-history.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added hook regression test validating fetch URL/query composition (`limit=20`, `offset` changes by page, `sort` changes on toggle) and auth-header forwarding from session token across sequential state updates.
- Risks: Hook test currently checks query generation behavior rather than visual UI outcomes; UI behavior remains covered in panel/component tests.
- Blockers: None.
- Next step: optionally add one end-to-end dashboard route test mounting plot detail with mocked network to assert panel controls trigger expected hook state transitions in sequence.

### 2026-04-16 (execution: FEAT-003 S1 code slice 17)
- Focus: validate full plot-detail geometry-history control flow with route-level UI integration test.
- Files changed: `apps/dashboard-product/app/plots/[id]/page.test.tsx`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added plot-detail test that renders page with real panel/hook stack and asserts request progression under user actions: initial `sort=desc` load, `Oldest` toggle to `sort=asc`, then `Next` pagination to `offset=20`, including auth-header forwarding.
- Risks: Test uses mocked network responses and mocked route params, so it validates frontend orchestration semantics rather than backend availability.
- Blockers: None.
- Next step: optionally add one compact visual regression snapshot for geometry-history panel states if UI layout churn becomes a recurring review friction point.

### 2026-04-16 (execution: FEAT-003 S1 code slice 18)
- Focus: add lightweight UI drift detection for geometry-history panel baseline states.
- Files changed: `apps/dashboard-product/components/plots/plot-geometry-history-panel.test.tsx`, `apps/dashboard-product/components/plots/__snapshots__/plot-geometry-history-panel.test.tsx.snap`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added snapshot assertions for core panel states (`empty`, `loading`, `error`) to catch unintentional content/layout changes while keeping interaction tests as primary behavior guard.
- Risks: Snapshot assertions can become noisy if frequent cosmetic tweaks occur; keep snapshots intentionally scoped to a few high-signal states only.
- Blockers: None.
- Next step: optionally add CI visibility note for snapshot updates in FEAT-003 frontend lane if reviewer churn on snapshot diffs increases.

### 2026-04-16 (execution: FEAT-003 S1 code slice 19)
- Focus: reduce reviewer ambiguity around snapshot diffs by documenting explicit FEAT-003 review heuristics.
- Files changed: `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `Snapshot review checklist (geometry-history panel)` to FEAT-003 with expected-change patterns, suspicious-diff signals, and standard reviewer actions including local test command.
- Risks: Checklist can drift if panel controls or test command names change; keep this section updated alongside snapshot/test refactors.
- Blockers: None.
- Next step: optionally mirror the same checklist pattern into other snapshot-backed FEAT docs if this review model proves effective.

### 2026-04-16 (execution: FEAT-003 S1 code slice 20)
- Focus: standardize snapshot-diff review workflow beyond a single feature doc.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added reusable `Snapshot Diff Review Template` under release QA evidence with expected/suspicious diff signals and reviewer actions; embedded FEAT-003 applied example commands to anchor immediate usage.
- Risks: Template guidance can become stale if command paths or component names move; keep FEAT-specific example pointers updated with refactors.
- Blockers: None.
- Next step: if additional features adopt snapshot-backed tests, reference this template directly in their feature docs instead of duplicating full checklist text.

### 2026-04-16 (execution: FEAT-003 S1 code slice 21)
- Focus: reduce snapshot-review documentation drift by deduplicating FEAT-local checklist content.
- Files changed: `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Replaced FEAT-003 inline snapshot checklist details with reference to shared `Snapshot Diff Review Template` in release QA evidence, while preserving FEAT-specific test command pointers in-feature.
- Risks: Readers may miss the shared template if they skip linked quality docs; mitigated by explicit section name and path in FEAT-003.
- Blockers: None.
- Next step: when the next snapshot-backed feature appears, apply the same “shared template + feature-specific commands only” pattern from day one.

### 2026-04-16 (execution: FEAT-003 S1 code slice 22)
- Focus: make snapshot-governance adoption repeatable by tracking snapshot-backed features in one quality reference.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `Snapshot-Backed Feature Registry` table to release QA evidence and seeded FEAT-003 with snapshot + companion behavior commands plus template-link status.
- Risks: Registry can become stale if commands/paths change without updates; keep feature rows refreshed during snapshot test refactors.
- Blockers: None.
- Next step: when FEATs add snapshot coverage, append one row to registry as part of that slice’s doc update checklist.

### 2026-04-16 (execution: FEAT-003 S1 code slice 23)
- Focus: make snapshot registry adoption operationally repeatable for future feature slices.
- Files changed: `product-os/04-quality/release-qa-evidence.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `Registry update procedure` under snapshot-backed feature registry defining required row fields plus mandatory linked updates in feature doc and status logs.
- Risks: Procedure steps can drift if file paths/sections are renamed; keep references aligned during product-os structure changes.
- Blockers: None.
- Next step: if desired, add a lightweight markdown QA assertion that the registry keeps at least one FEAT row with both snapshot and companion behavior commands.

### 2026-04-16 (execution: FEAT-003 S1 code slice 24)
- Focus: enforce snapshot-governance registry integrity automatically in CI.
- Files changed: `scripts/openapi-governance/snapshot-registry-check.mjs`, `package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added dedicated checker script and npm command (`openapi:governance:snapshot:registry:check`) that validates registry section/table presence, at-least-one feature row, backticked FEAT id format, snapshot/behavior `npm test` commands, and `Yes/No` template-link field; wired as a contracts-lane CI step.
- Risks: Validator currently enforces command formatting conventions (`npm test -- "..."`); if command style intentionally changes, script patterns must be updated in lockstep.
- Blockers: None.
- Next step: optionally emit JSON report output for this checker and include it in governance artifacts if trend telemetry on registry compliance becomes useful.

### 2026-04-16 (execution: FEAT-003 S1 code slice 25)
- Focus: add trend telemetry and artifact governance for snapshot-registry compliance.
- Files changed: `scripts/openapi-governance/snapshot-registry-check.mjs`, `scripts/openapi-governance/snapshot-registry-report-assert.mjs`, `docs/openapi/snapshot-registry-report.schema.json`, `scripts/openapi-governance/README.md`, `package.json`, `.github/workflows/ci.yml`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Extended snapshot-registry checker with `--report` output (`openapi-snapshot-registry-report.json`, `schemaVersion: 1`), added dedicated report schema + assertion script, and wired contracts CI to publish a Snapshot Registry summary block plus artifact `contracts-openapi-snapshot-registry-metrics`.
- Risks: Report assertion expects fixed schema/version and PASS/FAIL invariants; intentional report-shape changes require synchronized updates across producer, schema, and assert script.
- Blockers: None.
- Next step: optionally aggregate this snapshot-registry report alongside existing governance trend metrics to produce a single multi-signal trend artifact.

### 2026-04-16 (execution: FEAT-003 S1 code slice 26)
- Focus: unify governance trend artifacts so snapshot-registry compliance trends with presentation drift in one contract.
- Files changed: `scripts/openapi-governance/metrics-trend-summary.mjs`, `scripts/openapi-governance/metrics-trend-delta.mjs`, `scripts/openapi-governance/trend-report-assert.mjs`, `scripts/openapi-governance/trend-delta-report-assert.mjs`, `scripts/openapi-governance/trend-assertions.smoke.mjs`, `docs/openapi/governance-presentation-trend.schema.json`, `docs/openapi/governance-presentation-trend-delta.schema.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-003-geospatial-mapping.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Extended trend/delta payloads with snapshot-registry PASS/FAIL totals, row totals, and previous-run deltas; updated schemas/assertions/smoke fixtures and CI trend summary lines to keep artifact contracts strict and reviewer-visible.
- Risks: Trend schema evolution now spans producer, delta, assert, smoke, and workflow summary paths; future field changes must update all five surfaces in lockstep.
- Blockers: None.
- Next step: optionally publish compact sparkline-style trend visualization in release QA evidence if operator demand for historical readability increases.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 5)
- Focus: replace voucher-derived compliance evidence rows with first-class typed evidence-document diagnostics.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `tracebud-backend/src/harvest/harvest.service.spec.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `tracebud-backend/src/harvest/harvest.controller.spec.ts`, `apps/dashboard-product/app/api/harvest/packages/[id]/evidence-documents/route.ts`, `apps/dashboard-product/app/api/harvest/packages/[id]/evidence-documents/route.test.ts`, `apps/dashboard-product/lib/use-package-evidence-documents.ts`, `apps/dashboard-product/app/compliance/page.tsx`, `apps/dashboard-product/app/compliance/page.test.tsx`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added exporter-scoped backend endpoint `GET /v1/harvest/packages/{id}/evidence-documents` and service mapper for typed evidence-document rows; added dashboard proxy + hook and moved compliance evidence rendering to consume typed records directly.
- Risks: Evidence-document rows are currently mapped from package voucher data as transitional source-of-truth; once dedicated evidence-document persistence is introduced, mapping logic should be replaced with direct table reads.
- Blockers: None.
- Next step: publish OpenAPI path/schema for `/v1/harvest/packages/{id}/evidence-documents` and retire remaining static compliance fallback blocks when package selection UX is finalized.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 6)
- Focus: publish explicit OpenAPI contract coverage for package evidence-document diagnostics.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added OpenAPI path `GET /v1/harvest/packages/{id}/evidence-documents` with operation ID, typed array response, and role/tenant denial semantics; added reusable `DdsPackageEvidenceDocument` schema and concrete response example to lock field-level contract expectations.
- Risks: OpenAPI schema currently marks `capturedAt` as nullable string without `format` to align transitional data shape; once timestamp canonicalization is finalized, this can be tightened to `date-time`.
- Blockers: None.
- Next step: add backend controller `@ApiOkResponse` annotation for evidence-documents endpoint so code-level Swagger decorators mirror the published OpenAPI contract source.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 7)
- Focus: ensure code-level Swagger decorators match evidence-documents OpenAPI contract semantics.
- Files changed: `tracebud-backend/src/harvest/harvest.controller.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added explicit `@ApiOkResponse` schema/example annotation on `GET /v1/harvest/packages/{id}/evidence-documents` with typed evidence-document fields and enum/nullability parity.
- Risks: Decorator schema currently encodes `capturedAt` as nullable string (non-`date-time`) to match transitional contract; tighten both decorator and OpenAPI draft together once timestamp canonicalization is finalized.
- Blockers: None.
- Next step: optionally refactor repeated evidence-document schema literals into a shared backend DTO class so controller decorator and OpenAPI draft can reference a single typed source.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 8)
- Focus: centralize evidence-documents Swagger response metadata in a shared DTO class.
- Files changed: `tracebud-backend/src/harvest/dto/dds-package-evidence-document.dto.ts`, `tracebud-backend/src/harvest/harvest.controller.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added canonical `DdsPackageEvidenceDocumentDto` + enum types and switched `@ApiOkResponse` on `GET /v1/harvest/packages/{id}/evidence-documents` to `type/isArray` DTO reference, removing inline schema duplication.
- Risks: OpenAPI draft and backend DTO are still maintained in separate files; if field naming evolves, both sources must be updated together until full generation-from-decorator or single-source contract tooling is adopted.
- Blockers: None.
- Next step: optionally reuse the same DTO type in `HarvestService` return typing to extend single-source schema consistency beyond Swagger decorators.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 9)
- Focus: extend evidence-document contract single-sourcing from controller decorators into service return typing.
- Files changed: `tracebud-backend/src/harvest/harvest.service.ts`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `HarvestService` now aliases `DdsPackageEvidenceDocument` to shared `DdsPackageEvidenceDocumentDto` and uses DTO enums for mapped `type` and `reviewStatus` values, removing duplicated service-level string literal contracts.
- Risks: Focused test lane was used (`-t listDdsPackageEvidenceDocuments`) because unrelated pre-existing assertions in the broader service spec remain unstable; full-file green run should be restored in a separate stabilization slice.
- Blockers: None.
- Next step: optionally align OpenAPI `DdsPackageEvidenceDocument` schema enum/value references with backend DTO enum definitions via generated or shared schema tooling.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 10)
- Focus: add machine-enforced parity guard between backend evidence-document enums and OpenAPI contract schema values.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `package.json`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `openapi:governance:evidence-doc:parity:check` script that parses backend DTO enums and OpenAPI `DdsPackageEvidenceDocument` schema enums (`type`, `reviewStatus`) and fails when value sets diverge.
- Risks: Checker currently validates enum-set parity only (not property descriptions/examples/nullability), so additional drift dimensions still rely on lint/review until broader schema parity tooling is introduced.
- Blockers: None.
- Next step: optionally wire this new parity check into the contracts CI lane alongside existing OpenAPI governance assertions.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 11)
- Focus: promote evidence-document enum parity from local governance script to mandatory contracts CI gate.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added blocking contracts-lane step `Enforce evidence-document OpenAPI/DTO enum parity` that runs `npm run openapi:governance:evidence-doc:parity:check` before governance metrics/trend publication; updated governance README command inventory and CI-order runbook to include the new gate.
- Risks: This guard remains enum-scope only; field-description/example/nullability drift still relies on existing OpenAPI lint and review discipline.
- Blockers: None.
- Next step: optionally expand parity automation from enum fields to full evidence-document schema field/nullable/example parity once shared schema generation tooling is in place.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 12)
- Focus: expand evidence-document parity gate from enum-only checks to broader schema and example-shape verification.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Checker now validates required fields parity and field-level parity (`type`, `format`, `nullable`, enums) for `DdsPackageEvidenceDocument`, and validates default `200` example row keys + enum-value validity against DTO constraints.
- Risks: Checker still uses contract-specific text parsing heuristics for DTO decorators/OpenAPI YAML shape, so large formatting refactors may require parser adjustments even when semantics stay equivalent.
- Blockers: None.
- Next step: optionally migrate this parity checker to AST/YAML parser-backed extraction for lower formatting sensitivity while keeping the same fail-closed semantics.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 13)
- Focus: reduce evidence-document parity checker fragility by replacing text-shape regex extraction with parser-backed contract reads.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `scripts/openapi-governance/README.md`, `package.json`, `package-lock.json`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: DTO extraction now uses TypeScript AST (`typescript`) for enums + `@ApiProperty` metadata; OpenAPI extraction now uses YAML parser (`yaml`) for schema required/properties and endpoint example payload lookup.
- Risks: AST extraction currently assumes `@ApiProperty({...})` object-literal usage and string-compatible DTO field types; if decorator style/type modeling shifts materially, parser rules may need targeted extension.
- Blockers: None.
- Next step: optionally add focused smoke fixtures for the parity checker so AST/YAML extraction behavior is regression-tested independently from live contract files.

### 2026-04-20 (execution: marketing standalone demo atlas MVP)
- Focus: add an isolated demo-only landing surface that explains the Tracebud ecosystem in one detailed visual narrative without coupling to main marketing navigation.
- Files changed: `apps/marketing/app/demo-ecosystem/page.tsx`, `apps/marketing/components/tracebud/demo-ecosystem-view.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: implemented a static diagram-first page at `/demo-ecosystem` with noindex metadata, sticky presenter map, and four walkthrough sections (ecosystem map, data flow, state transitions, exception/recovery) including concise demo talk tracks.
- Risks: current diagrams are static cards (not interactive graph controls), so deeper animated step-through and PDF export remain optional follow-up improvements.
- Blockers: None.
- Next step: optionally add presenter modes (`90-second`, `5-minute`, `deep dive`) and a print/PDF export stylesheet for sales handoff.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 14)
- Focus: add independent regression coverage for evidence-document parity checker behavior using fixture-driven smoke scenarios.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `scripts/openapi-governance/evidence-doc-contract-parity.smoke.mjs`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/dto.ts`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-pass.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail.yaml`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `package.json`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added checker CLI path overrides (`--dto`, `--openapi`) and fixture smoke command `openapi:governance:evidence-doc:parity:smoke` with one pass-case and one fail-case assertion; contracts CI now executes this smoke command immediately after the blocking parity check.
- Risks: Smoke harness currently asserts representative pass/fail paths only; broader negative-path matrix (for example nullable/required/example-key drift variants) can be added if checker logic scope expands.
- Blockers: None.
- Next step: optionally expand smoke fixtures to cover additional failure classes (required-field drift, nullable drift, and example-key drift) to lock multi-dimension checker diagnostics.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 15)
- Focus: widen parity checker smoke coverage to lock mismatch diagnostics across multiple contract-drift failure classes.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity.smoke.mjs`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-enum.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-required.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-nullable.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-example-keys.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail.yaml` (removed), `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Smoke suite now runs one pass-case plus four targeted fail-cases (enum mismatch, required mismatch, nullable mismatch, example-key mismatch), each asserting expected failure-detail text before passing suite.
- Risks: Failure-detail assertions are message-string based; if checker message wording changes intentionally, smoke expectations must be updated in lockstep.
- Blockers: None.
- Next step: optionally add format-drift and nullability-example mismatch fixtures (`format` mismatch, non-nullable example `null`) to further tighten checker regression envelope.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 16)
- Focus: complete smoke-fixture coverage for remaining evidence-doc parity dimensions (`format` drift and non-nullable example `null` drift).
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity.smoke.mjs`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-format.yaml`, `scripts/openapi-governance/fixtures/evidence-doc-contract-parity/openapi-fail-example-null-nonnullable.yaml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Smoke suite now runs seven scenarios total (1 pass + 6 fail), adding targeted mismatch assertions for `packageId.format mismatch` and `packageId example value cannot be null`.
- Risks: As with other smoke cases, mismatch-detail assertions are coupled to error-message wording and will need synchronized updates if checker phrasing is intentionally changed.
- Blockers: None.
- Next step: optionally add a compact checker output contract helper (stable error codes alongside human text) to reduce future smoke fragility against wording edits.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 17)
- Focus: stabilize checker-failure contract by introducing machine-readable error codes for parity mismatches.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `scripts/openapi-governance/evidence-doc-contract-parity.smoke.mjs`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added coded error envelope (`[EVIDENCE_DOC_PARITY_*]`) for DTO/OpenAPI parse and parity mismatch failures; smoke suite now asserts codes (`EVIDENCE_DOC_PARITY_SET_MISMATCH`, `EVIDENCE_DOC_PARITY_FIELD_MISMATCH`, `EVIDENCE_DOC_PARITY_EXAMPLE_NON_NULLABLE_NULL`) instead of text-fragment diagnostics.
- Risks: Code taxonomy is intentionally compact at this stage; if finer-grained downstream automation is needed, additional specific codes may be required for each mismatch subtype.
- Blockers: None.
- Next step: optionally expose checker output in optional JSON mode (`--json`) including `code`, `message`, and structured mismatch payload for machine consumers beyond smoke assertions.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 18)
- Focus: add machine-consumable JSON output mode for evidence-doc parity checker and validate it via smoke coverage.
- Files changed: `scripts/openapi-governance/evidence-doc-contract-parity-check.mjs`, `scripts/openapi-governance/evidence-doc-contract-parity.smoke.mjs`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added `--json` flag for structured output (`status`, `checks` on PASS; `status`, `code`, `message`, `details` on FAIL) and added JSON-mode smoke assertions for both pass and fail cases.
- Risks: Current JSON schema is intentionally lightweight and implicit; if downstream tooling grows, a versioned JSON schema artifact may be needed to manage compatibility explicitly.
- Blockers: None.
- Next step: optionally add `docs/openapi/*` governance schema for parity-check JSON output (`schemaVersion`) and a dedicated assertion script to prevent output-contract drift.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 19)
- Focus: formalize parity `--json` output as a versioned governance contract with explicit schema assertion.
- Files changed: `docs/openapi/evidence-doc-parity-report.schema.json`, `scripts/openapi-governance/evidence-doc-parity-report-assert.mjs`, `.github/workflows/ci.yml`, `package.json`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added schema v1 for PASS/FAIL JSON envelopes and assertion command `openapi:governance:evidence-doc:parity:report:assert` that validates both live PASS output and fixture-driven FAIL output; contracts CI now runs this assertion after parity smoke.
- Risks: Assertion script currently implements schema/invariant checks directly rather than full JSON-schema runtime validation; if schema complexity expands, a dedicated JSON-schema validator may be preferable.
- Blockers: None.
- Next step: optionally add parity JSON contract metrics artifact publication in contracts CI for run-to-run observability of output envelope changes.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 20)
- Focus: publish parity JSON contract evidence as a dedicated contracts-lane artifact for reviewer traceability.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Contracts lane now captures `openapi-evidence-doc-parity-pass.json` and fixture-driven `openapi-evidence-doc-parity-fail.json` snapshots and uploads artifact `contracts-openapi-evidence-doc-parity-contract` with schema source.
- Risks: Artifact snapshots currently represent one canonical fail fixture (`format` mismatch); additional fixture snapshots may be needed if reviewers require full failure-class artifact coverage each run.
- Blockers: None.
- Next step: optionally append a short CI summary block for parity JSON artifact status (`schemaVersion`, pass/fail codes) to reduce reviewer clicks during contract audits.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 21)
- Focus: surface parity JSON contract evidence directly in CI summary for faster reviewer triage.
- Files changed: `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Contracts lane now appends `Evidence-Doc Parity JSON Contract` summary block with PASS/FAIL status, schema versions, fail code, and artifact run link (`contracts-openapi-evidence-doc-parity-contract`).
- Risks: Summary currently reflects one canonical fail fixture code from the artifact capture step; if fail-fixture selection changes, summary expectations should be reviewed for continued relevance.
- Blockers: None.
- Next step: optionally extend summary block to include both assertion status and fixture-path metadata for clearer provenance when multiple fail fixtures are used.

### 2026-04-17 (execution: FEAT-004 S1 post-closeout hardening slice 22)
- Focus: add compact parity JSON mini-metrics artifact to support lightweight trend ingestion and downstream automation.
- Files changed: `scripts/openapi-governance/evidence-doc-parity-metrics-generate.mjs`, `package.json`, `.github/workflows/ci.yml`, `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-004-eudr-rules-engine.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: Added command `openapi:governance:evidence-doc:parity:metrics:generate` to produce `openapi-evidence-doc-parity-metrics.json` from PASS/FAIL snapshots and wired CI artifact upload `contracts-openapi-evidence-doc-parity-metrics`.
- Risks: Metrics currently summarize one fail-fixture snapshot path and selected counters; if analytics consumers require richer dimensions, payload schema will need explicit versioned expansion.
- Blockers: None.
- Next step: optionally add parity-metrics schema + assertion gate (similar to report schema assertion) to lock mini-metrics payload contract before broader trend consumers depend on it.

### 2026-04-22 (execution: dashboard + app public launch implementation)
- Focus: implement no-card 30-day dashboard trial lifecycle, strict server-side monetization/data-egress gates, and autonomous onboarding scaffolding for public launch.
- Files changed: `tracebud-backend/src/launch/*`, `tracebud-backend/src/app.module.ts`, `tracebud-backend/src/harvest/*`, `tracebud-backend/src/reports/*`, `tracebud-backend/src/integrations/*`, `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/app/api/launch/*`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/02-features/FEAT-009-integrations.md`, `product-os/04-quality/acceptance-criteria.md`, `product-os/04-quality/event-tracking.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`.
- Decisions: added tenant trial state machine (`trial_active`, `trial_expired`, `paid_active`, `suspended`) with idempotent auto-provision + expiry evaluation; added tenant onboarding progress persistence and role templates; enforced server-side launch entitlement checks on premium reporting/compliance/export APIs; dashboard now surfaces trial state and role onboarding checklist with persisted completion actions.
- Risks: trial gating currently returns generic forbidden responses (not dedicated billing error type), and dashboard onboarding/checklist is functional but intentionally lightweight UI (no contextual walkthrough overlays yet).
- Blockers: none.
- Next step: run staging validation for trial-expiry/read-only behavior, conversion telemetry coverage, and post-expiry upgrade UX continuity.

### 2026-04-22 (execution: tenant feature entitlement persistence + enforcement)
- Focus: upgrade launch gating from lifecycle-only checks to tenant-scoped persisted feature entitlements for dashboard module packaging.
- Files changed: `tracebud-backend/sql/tb_v16_023_tenant_feature_entitlements.sql`, `tracebud-backend/src/launch/launch.service.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added canonical table `tenant_feature_entitlements` (`feature_key`, `entitlement_status`, effective window) and enforced entitlement-aware checks in `LaunchService.requireFeatureAccess`; default trial provisioning now seeds entitlement rows and paid upgrade normalizes tenant entitlements to `enabled`.
- Risks: entitlement lifecycle currently uses a compact status model (`enabled|disabled|trial`) without explicit scheduled/future package change jobs; future entitlement-ops workflows may need an admin mutation API and richer policy metadata.
- Blockers: None.
- Next step: add targeted launch-service/controller tests for entitlement denial/allow matrix across `trial_active`, `paid_active`, and `trial_expired` states, including one disabled-feature override fixture.

### 2026-04-22 (execution: launch entitlement matrix test hardening)
- Focus: add deterministic unit coverage for lifecycle + feature-entitlement gate behavior in launch service.
- Files changed: `tracebud-backend/src/launch/launch.service.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced focused `LaunchService.requireFeatureAccess` matrix tests covering allow paths (`trial_active+trial`, `paid_active+enabled`) and deny paths (`trial_expired`, `suspended`, `disabled entitlement`) to lock intended monetization and package-gate semantics.
- Risks: coverage is service-layer and mock-driven; controller-level matrix assertions for feature-denied responses across all gated endpoints can be added later if we need stronger HTTP-path proof.
- Blockers: None.
- Next step: optionally add a compact entitlement admin mutation endpoint (tenant-scoped, role-restricted) plus controller tests to support operational package toggles without direct SQL edits.

### 2026-04-22 (execution: launch entitlement admin ops API)
- Focus: add role-scoped operational endpoints so tenant feature packages can be managed without direct SQL edits.
- Files changed: `tracebud-backend/src/launch/launch.service.ts`, `tracebud-backend/src/launch/launch.controller.ts`, `tracebud-backend/src/launch/launch.controller.spec.ts`, `tracebud-backend/src/launch/launch.service.spec.ts`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/launch/entitlements` and `PATCH /v1/launch/entitlements` with strict `admin` role gate; launch service now supports listing/upserting entitlement rows and emits immutable `feature_entitlement_updated` audit events with actor metadata.
- Risks: entitlement mutation path currently uses direct admin authority without an additional dual-control approval workflow; if enterprise governance requirements tighten, an approval queue can be layered on top.
- Blockers: None.
- Next step: optionally expose a dashboard admin proxy/UI for entitlement toggles so support operations do not require direct backend API tooling.

### 2026-04-22 (execution: dashboard launch entitlement admin UI)
- Focus: expose launch entitlement operations in dashboard admin so feature-package toggles are operable without direct backend API tooling.
- Files changed: `apps/dashboard-product/app/admin/page.tsx`, `apps/dashboard-product/app/admin/page.test.tsx`, `apps/dashboard-product/app/api/launch/entitlements/route.ts`, `apps/dashboard-product/app/api/launch/entitlements/route.test.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added admin-panel entitlement table with explicit load + per-feature status mutation controls; introduced dashboard proxy route for launch entitlement GET/PATCH passthrough with auth header forwarding and backend-status preservation.
- Risks: dashboard lint run remains blocked by pre-existing unrelated lint issues in `app/page.tsx` (`react-hooks/set-state-in-effect`) and `components/layout/app-sidebar.tsx` unused imports; entitlement slice files are clean and targeted tests pass.
- Blockers: None for entitlement slice itself; global app lint remains branch-blocked by prior unrelated issues.
- Next step: optionally add lightweight confirmation dialog before entitlement status mutation and/or role badge that clarifies current admin claim context.

### 2026-04-22 (execution: dashboard lint stabilization pass)
- Focus: clear remaining dashboard lint blockers so full `dashboard-product` lint gate passes after launch entitlement UI rollout.
- Files changed: `apps/dashboard-product/app/page.tsx`, `apps/dashboard-product/components/layout/app-sidebar.tsx`, `apps/dashboard-product/components/layout/app-header.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: removed effect-time state priming in dashboard page to satisfy `react-hooks/set-state-in-effect`; removed unused icon/import debris in sidebar/header to eliminate warning-only lint blockers under `--max-warnings 0`.
- Risks: dashboard onboarding now relies on backend onboarding API response instead of temporary local defaults during initial fetch, so any backend outage can keep onboarding list empty until retry.
- Blockers: None.
- Next step: optionally add an explicit loading/skeleton state for onboarding checklist while launch onboarding API is in-flight to preserve perceived continuity.

### 2026-04-22 (execution: tenant contacts CRM and request-campaign reuse)
- Focus: deliver a production-data contacts workspace and connect it to request campaign creation so onboarding can reuse saved recipients.
- Files changed: `tracebud-backend/src/contacts/*`, `tracebud-backend/src/app.module.ts`, `apps/dashboard-product/app/api/contacts/*`, `apps/dashboard-product/lib/contact-service.ts`, `apps/dashboard-product/app/contacts/page.tsx`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/lib/rbac.ts`, `apps/dashboard-product/app/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/04-quality/acceptance-criteria.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced tenant-scoped `crm_contacts` persistence with explicit status transition rules and audit-log events; added role-scoped contacts permissions/navigation and a new Contacts page; campaign modal now supports selecting existing CRM contacts.
- Risks: contacts schema currently self-initializes from service startup path instead of migration-backed SQL artifact, so CI/prod rollout should add a dedicated migration next.
- Blockers: None.
- Next step: add migration-backed DDL for `crm_contacts` and targeted unit/integration coverage for contacts controller/service paths.

### 2026-04-22 (execution: contacts migration-backed schema + transition tests)
- Focus: remove runtime DDL dependency for contacts and add focused regression coverage for contact lifecycle guardrails.
- Files changed: `tracebud-backend/sql/tb_v16_024_crm_contacts.sql`, `tracebud-backend/src/contacts/contacts.service.ts`, `tracebud-backend/src/contacts/contacts.service.spec.ts`, `tracebud-backend/src/contacts/contacts.controller.spec.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: moved `crm_contacts` provisioning to migration (`TB-V16-024`) and removed service-level schema bootstrap; added service/controller unit tests for permissions, payload validation, and status transition integrity.
- Risks: migration must be applied in each environment before contacts endpoints are used.
- Blockers: None.
- Next step: optionally add DB-backed integration tests for contacts endpoints under migration-applied test DB to validate full controller->DB behavior.

### 2026-04-22 (execution: crm_contacts migration utility scripts)
- Focus: add operational scripts to apply/verify `TB-V16-024` consistently across environments.
- Files changed: `tracebud-backend/scripts/apply-crm-contacts-migration.mjs`, `tracebud-backend/package.json`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `db:apply:crm-contacts` and `db:verify:crm-contacts` commands using the existing `run-with-root-test-db.mjs` pattern and env fallback contract (`CRM_CONTACTS_DATABASE_URL` -> `DATABASE_URL` -> `TEST_DATABASE_URL`).
- Risks: verify fails until migration has been applied at least once in a target environment.
- Blockers: None.
- Next step: optionally wire these commands into CI migration checks for early drift detection.

### 2026-04-22 (execution: contacts 500 error hardening + migration apply)
- Focus: resolve dashboard Contacts load failure (`Contact request failed (status 500)`).
- Files changed: `tracebud-backend/src/contacts/contacts.service.ts`, `tracebud-backend/src/contacts/contacts.service.spec.ts`, `apps/dashboard-product/app/api/contacts/route.ts`, `apps/dashboard-product/app/api/contacts/[id]/status/route.ts`, `apps/dashboard-product/lib/contact-service.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: backend contacts service now maps missing-table PG errors to actionable API response (`Apply TB-V16-024 migration first`) instead of opaque 500; dashboard proxy/client now surfaces role/auth/service-availability specific messages.
- Operations: applied `TB-V16-024` against backend `DATABASE_URL` using `apply-crm-contacts-migration.mjs` so `crm_contacts` is now present.
- Blockers: None.
- Next step: restart backend process if currently running stale code, then retry `/contacts` and contact creation flow.

### 2026-04-22 (execution: request campaign refresh persistence fix)
- Focus: resolve campaign disappearance on refresh by implementing backend persistence instead of UI-only fallback drafts.
- Files changed: `tracebud-backend/src/requests/requests.module.ts`, `tracebud-backend/src/requests/requests.service.ts`, `tracebud-backend/src/requests/requests.controller.ts`, `tracebud-backend/src/app.module.ts`, `tracebud-backend/sql/tb_v16_025_request_campaigns.sql`, `apps/dashboard-product/app/api/requests/campaigns/route.ts`, `apps/dashboard-product/app/requests/page.tsx`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added tenant-safe backend list/create endpoints with idempotency-key replay support; dashboard now fetches campaigns from backend on load and retains local cache only as resilience fallback.
- Operations: applied `TB-V16-025` migration to configured backend database.
- Risks: running backend process must be restarted to load new requests module/controller before endpoint is reachable.
- Blockers: None.
- Next step: restart backend + dashboard servers, create a draft, then verify it remains after hard refresh and new login.

### 2026-04-22 (execution: campaign target to CRM contact sync)
- Focus: ensure manual contacts entered during campaign creation are visible in Contacts CRM without duplicate entry.
- Files changed: `tracebud-backend/src/requests/requests.service.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: request campaign create flow now upserts valid target emails/full names into `crm_contacts` with status progression to `invited` for `new`/`inactive` records, preserving existing engaged/submitted/blocked statuses.
- Risks: contact sync runs after campaign insert and assumes `crm_contacts` migration (`TB-V16-024`) is present.
- Blockers: None.
- Next step: validate CRM contact dedupe under repeated draft edits and mixed CSV/manual target paths.

### 2026-04-22 (execution: onboarding optimization phase 1 kickoff)
- Focus: start onboarding optimization implementation with first-value activation visibility and decision observability in Requests.
- Files changed: `tracebud-backend/src/requests/requests.controller.ts`, `tracebud-backend/src/requests/requests.service.ts`, `apps/dashboard-product/app/api/requests/campaigns/[id]/decisions/route.ts`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/types/index.ts`, `product-os/02-features/FEAT-008-dashboards.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added tenant-scoped decision timeline API (`GET /v1/requests/campaigns/:id/decisions`) backed by immutable `request_campaign_recipient_decisions`; Requests UI now renders onboarding status card for `Contacts added`, `Campaign sent`, `First decision received` and campaign-details timeline with `last decision sync` context.
- Permissions/tenant boundaries: timeline endpoint uses existing requests role gate (`admin`, `exporter`, `compliance_manager`) and tenant claim scoping before data retrieval.
- State transitions: onboarding status derives directly from persisted contacts/campaign/decision counters and updates as operators move from draft-only to sent to first recipient decision.
- Exception handling and recovery: timeline fetch fails closed to empty-state UI without blocking core campaign management workflows.
- Analytics note: this slice consumes existing onboarding/campaign events; no new event schema introduced yet.
- Acceptance note: phase-1 baseline now surfaces deterministic first-value progress and recipient decision visibility required for onboarding confidence.
- Blockers: None.
- Next step: add targeted backend/frontend tests for decision timeline endpoint and rendering states (loading, empty, populated).

### 2026-04-22 (execution: onboarding phase 1.1 timeline filter + pagination)
- Focus: improve decision observability ergonomics in campaign details by reducing timeline scan friction.
- Files changed: `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added recipient decision timeline filters (`All`, `Accepted`, `Refused`) with per-filter counts, plus incremental pagination (`Load more` in +10 batches) inside campaign details.
- State transitions: filter changes reset visible batch size to preserve deterministic pagination behavior per selected decision view.
- Exception handling and recovery: empty-state copy now reflects active filter context (`No recipient decisions recorded for this filter yet.`) while preserving non-blocking campaign-details rendering.
- Analytics note: no new event schema added yet; this is a UX hardening slice over existing decision-ledger data flow.
- Blockers: None.
- Next step: optionally add server-side timeline pagination/filter query support if campaign decision volumes exceed client-side modal ergonomics.

### 2026-04-22 (execution: onboarding phase 1.2 server-side timeline pagination/filtering)
- Focus: make recipient decision timeline retrieval scalable for high-volume campaigns by moving filter/pagination mechanics to API query contract.
- Files changed: `tracebud-backend/src/requests/requests.controller.ts`, `tracebud-backend/src/requests/requests.service.ts`, `tracebud-backend/src/requests/requests.service.spec.ts`, `apps/dashboard-product/app/api/requests/campaigns/[id]/decisions/route.ts`, `apps/dashboard-product/app/api/requests/campaigns/[id]/decisions/route.test.ts`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/requests/page.test.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: `GET /v1/requests/campaigns/:id/decisions` now accepts `decision`, `limit`, and `offset`; response now includes decision counts + pagination metadata (`has_more`) so the UI can render deterministic filter chips and incremental `Load more`.
- Permissions/tenant boundaries: existing requests role guard and tenant claim scoping remain enforced before decision query execution.
- State transitions: campaign details now fetches timeline on open/filter change and appends next pages using server `offset`, preserving continuity as decision ledgers grow.
- Exception handling and recovery: timeline fetch remains fail-closed to safe empty-state rendering and does not block campaign-details visibility.
- Verification note: targeted backend and dashboard tests updated to cover query forwarding and paginated/filtered timeline behavior.
- Blockers: None.
- Next step: optional OpenAPI contract update for decision timeline query/response metadata and query-usage telemetry events.

### 2026-04-22 (execution: decision timeline OpenAPI contract publication)
- Focus: publish the new decision timeline query/pagination behavior to API contract docs for QA and integration alignment.
- Files changed: `docs/openapi/tracebud-v1-draft.yaml`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `GET /v1/requests/campaigns/{id}/decisions` OpenAPI path with query parameters (`decision`, `limit`, `offset`) and explicit response schemas for decision records, timeline counts, and pagination metadata.
- Verification: `npm run openapi:lint` now passes with the updated contract.
- Blockers: None.
- Next step: optional contract-level integration tests that assert runtime response shape parity with published OpenAPI schemas.

### 2026-04-22 (execution: decision timeline runtime contract-parity guard)
- Focus: enforce API/runtime consistency by locking required decision timeline response keys in backend tests.
- Files changed: `tracebud-backend/src/requests/requests.service.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added explicit contract-shape assertion for `RequestsService.listDecisions` covering required OpenAPI fields (`campaign_id`, `tenant_id`, `last_synced_at`, `counts`, `pagination`, `decisions`) and pagination semantics (`has_more`, `returned`).
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/requests/requests.service.spec.ts` (pass, 4/4).
- Blockers: None.
- Next step: optional controller/integration test to validate serialized HTTP response parity against OpenAPI contract from endpoint surface (not only service layer).

### 2026-04-22 (execution: decision timeline controller parity coverage)
- Focus: add controller-level contract checks for decision timeline endpoint input parsing and guarded forwarding.
- Files changed: `tracebud-backend/src/requests/requests.controller.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added `RequestsController` tests for `/v1/requests/campaigns/:id/decisions` covering role denial, missing tenant denial, numeric query parsing (`limit`, `offset`), invalid query fallback to `undefined`, and response envelope pass-through parity.
- Verification: `cd tracebud-backend && npm test -- --runTestsByPath src/requests/requests.service.spec.ts src/requests/requests.controller.spec.ts` (pass, 8/8).
- Blockers: None.
- Next step: optional full Nest integration test to assert middleware/auth/guard + serialized response parity end-to-end over HTTP.

### 2026-04-22 (execution: decision timeline DB-backed integration parity)
- Focus: validate decision timeline contract against real database query execution under tenant guard behavior.
- Files changed: `tracebud-backend/src/requests/requests.controller.int.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added integration coverage for `RequestsController.listDecisions` with ephemeral schema setup, tenant-scoped campaigns/decisions fixtures, filter+pagination query path (`decision=accept`, `limit=1`, `offset=0`), and missing-tenant denial.
- Verification: `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/requests/requests.controller.int.spec.ts` (pass, 2/2).
- Blockers: None.
- Next step: optional full Nest HTTP e2e test harness to include middleware/guard wiring and serialized endpoint path verification over `supertest`.

### 2026-04-22 (execution: decision timeline HTTP e2e parity)
- Focus: validate decision timeline endpoint contract through full Nest HTTP stack (guard + controller + service + serialization) using `supertest`.
- Files changed: `tracebud-backend/src/requests/requests.decisions.api.int.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: added HTTP integration coverage for `GET /v1/requests/campaigns/:id/decisions` including:
  - missing bearer token rejection (`401`)
  - tenant-scoped filtered/paginated response (`decision=accept`, `limit=1`, `offset=0`) with serialized envelope parity.
- Verification: `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/requests/requests.decisions.api.int.spec.ts` (pass, 2/2).
- Blockers: None.
- Next step: optional HTTP negative-case expansion for `Invalid token` and forbidden role scenarios to complete guard-path matrix.

### 2026-04-22 (execution: decision timeline HTTP negative-case matrix)
- Focus: complete HTTP guard-path matrix for decision timeline endpoint access control outcomes.
- Files changed: `tracebud-backend/src/requests/requests.decisions.api.int.spec.ts`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: expanded e2e coverage for `GET /v1/requests/campaigns/:id/decisions` to include:
  - `401` when token is invalid (`Invalid token`)
  - `403` when authenticated role is outside requests access policy.
- Reliability note: raised test/hook timeout budget in this integration file (`jest.setTimeout(60_000)`, hook-level 20s) to avoid false negatives under slower DB/test container startup.
- Verification: `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/requests/requests.decisions.api.int.spec.ts` (pass, 4/4).
- Blockers: None.
- Next step: optional abuse-path/rate-limit hardening and tests for public decision-intent endpoint (`/v1/public/requests/campaigns/decision-intent`).
- Next step: add targeted requests service tests for target-to-contact sync behavior and status preservation edge cases.

### 2026-04-22 (execution: draft edit endpoint + CRM suggested targets + contacts table UI)
- Focus: make draft campaign actions functional and improve CRM usability for operators.
- Files changed: `tracebud-backend/src/requests/requests.controller.ts`, `tracebud-backend/src/requests/requests.service.ts`, `apps/dashboard-product/app/api/requests/campaigns/route.ts`, `apps/dashboard-product/app/requests/page.tsx`, `apps/dashboard-product/app/contacts/page.tsx`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: introduced backend `PATCH /v1/requests/campaigns/:id` restricted to editable `DRAFT` rows; wired edit-draft flow in campaign modal; pre-selected CRM suggestions (`new/invited/engaged`) when opening create/edit dialog; replaced contacts card-list layout with explicit table rows/columns + inline status control.
- Risks: backend watch process currently shows intermittent `EADDRINUSE` during hot-restart loops if stale node process still holds port `4000`.
- Blockers: None.
- Next step: clear stale backend process on `4000` if needed, then validate edit draft + suggested targets + contacts table behavior in-browser.

### 2026-04-15 (execution: governance scripts quick-reference README)
- Focus: improve operational onboarding by documenting governance script purposes and execution order next to implementation.
- Files changed: `scripts/openapi-governance/README.md`, `product-os/02-features/FEAT-001-multi-tenant-admin.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`, `product-os/06-status/done-log.md`.
- Decisions: Added concise script-folder README covering command responsibilities, report flags, CI run order, and source-of-truth inputs.
- Risks: README can drift from behavior if commands/arguments change without doc updates.
- Blockers: None.
- Next step: optionally add a tiny CI doc-check that validates README command names exist in `package.json`.
