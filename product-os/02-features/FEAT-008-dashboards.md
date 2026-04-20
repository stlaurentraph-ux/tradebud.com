# Dashboards

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for dashboards aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Operational org/sponsor readiness and risk views.

## Non-goals

Anything outside v1 boundaries in `MVP_PRD.md`.

## Dependencies

See `product-os/01-roadmap/dependency-map.md`.

## Key entities

Use entity model in `MVP_PRD.md` and `PRODUCT_PRD.md`.

## UX / operational notes

Use journey and JTBD constraints from `JTBD_PRD.md` and `BUILD_READINESS_ARTIFACTS.md`.

## Tasks checklist

- [x] Confirm permissions and tenant boundaries
- [x] Confirm state transitions
- [x] Confirm exception handling and recovery
- [x] Confirm analytics event coverage
- [x] Confirm acceptance criteria mapping
- [x] Confirm v1.6 architecture constraints for touched areas (spatial, HLC sync, lineage, TRACES chunking, GDPR shredding)
- [x] Update status docs

## First execution slice (S1)

Scope: dashboard execution matrix bootstrap for tenant-safe readiness/risk/filing/chat operational visibility surfaces.

### Permission and tenant boundary matrix

- **Exporter role:** can access org-level readiness/risk/filing summary widgets and drill into package-level dashboard diagnostics within own tenant.
- **Agent role:** can access assigned-operational dashboard views (field progress, assignment throughput) but cannot access exporter filing-only controls.
- **Farmer role:** can access own/assigned production dashboard views only; no cross-farmer or cross-tenant drill-down.
- **Missing tenant claim:** fails closed for all dashboard API/proxy reads before data retrieval or aggregate calculations.

### State transition matrix

- `dashboard_request -> loading` when tenant-scoped filter window/query is accepted.
- `loading -> ready` when all required dashboard data domains resolve with coherent timestamp/filter context.
- `loading -> partial_ready` when one or more optional telemetry domains fail but core readiness view remains available.
- `ready|partial_ready -> refreshed` on manual or scheduled refresh with deterministic filter carry-forward.
- `ready|partial_ready|refreshed -> stale` when source data freshness threshold is exceeded and operator warning is shown.

### Exception handling and recovery

- Invalid filter/query combinations return deterministic validation errors and retain previous good dashboard state client-side.
- Tenant/role authorization failures return explicit deny semantics and never leak aggregate cross-tenant counts.
- Partial backend source outages degrade to partial-ready dashboards with per-panel error messaging and retry controls.
- Export/read retries preserve idempotent semantics for telemetry-backed cards and never duplicate server-side lifecycle events.

### Analytics/event coverage

- Dashboard lifecycle telemetry baseline includes:
  - dashboard load requested / loaded / partial / failed
  - dashboard refresh triggered / completed
  - dashboard export requested / completed / failed
- Event payload baseline: tenantId, actor identity/role, dashboard surface/widget key, filter window, phase, row/summary counts, timestamp.

### Acceptance mapping (v1)

- Dashboard data access remains tenant-scoped and role-constrained for all read/refresh/export paths.
- Dashboard operational summaries are deterministic for same tenant/filter inputs across repeated requests.
- Partial failure behavior preserves operator continuity with explicit warning context and retry path.
- Dashboard diagnostics provide sufficient risk/readiness/filing/chat evidence for investigation and compliance handoff.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** dashboard map/area metrics must be derived from canonical `GEOGRAPHY`-safe upstream outputs; no ad-hoc client geometry math.
- **Offline conflict integrity:** dashboard event chronology must rely on persisted ordering metadata (HLC/audit timestamps), not browser wall clocks.
- **Lineage performance:** dashboard lineage indicators must consume materialized lineage fields and avoid runtime recursive traversal.
- **TRACES chunking resilience:** dashboard filing summaries must tolerate chunked submission lifecycle data without reference-loss in aggregates.
- **GDPR shredding safety:** dashboard actor/user labels must not rehydrate shredded personal attributes; retention-safe audit references remain immutable.

## Execution slices

### S1 code slice 1 - dashboard execution matrix bootstrap

- Documented FEAT-008 S1 execution matrix for permissions, transition states, exception recovery, analytics baseline, acceptance mapping, and v1.6 architecture constraints.
- Established implementation-ready baseline for next FEAT-008 slices (dashboard contract shaping, diagnostics aggregation, and operator UX hardening).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - tenant-scoped dashboard diagnostics summary contract

- Added backend tenant-scoped diagnostics summary endpoint:
  - `GET /v1/audit/gated-entry/dashboard-summary`
  - supports `fromHours` lookback filter
  - returns aggregate counters across dashboard event families:
    - gated-entry attempts
    - assignment export events
    - risk score events
    - filing activity events
    - chat activity events
- Added dashboard analytics proxy routing for `eventKind=dashboard_summary`.
- Added dashboard hook and admin telemetry card summary surface to display aggregate counters for current time window.
- Added unit + DB-backed integration assertions for summary counter behavior and tenant scoping.
- Published OpenAPI contract + schema (`DashboardDiagnosticsSummaryResponse`) for diagnostics summary endpoint.

### S1 code slice 3 - segmented summary drill-down + readiness guardrails

- Expanded backend `GET /v1/audit/gated-entry/dashboard-summary` response to include deterministic drill-down segments used by widget-level triage:
  - assignment export phase buckets (`requested`, `succeeded`, `failed`)
  - assignment export status buckets (`active`, `completed`, `cancelled`)
  - risk score band buckets (`low`, `medium`, `high`)
  - filing family buckets (`generation`, `submission`)
  - chat activity phase buckets (`created`, `posted`, `replayed`, `resolved`, `reopened`, `archived`)
- Added summary-level readiness guardrails in response payload:
  - `hasAnyDiagnostics`
  - `canExportDetailed`
  - `latestEventAt`
- Updated dashboard diagnostics summary UI to show segmented drill-down and readiness state for operator triage/export decisioning in the current tenant/time window.
- Updated summary unit + DB-backed integration assertions for segment/readiness payload parity.
- Updated OpenAPI schema (`DashboardDiagnosticsSummaryResponse`) to publish drill-down + readiness payload contract.

### S1 code slice 4 - widget drill-down interactions + export guardrail assertions

- Added widget-level summary drill actions in admin diagnostics so segmented summary buckets can immediately drive investigation filters:
  - assignment phase/status summary controls set assignment diagnostics filters + reset paging
  - risk band summary controls set risk diagnostics band filter + reset paging
  - filing family summary controls route to generation/submission phase filters + reset paging
  - chat phase summary controls set chat diagnostics phase filter + reset paging
- Tightened export guardrails in admin diagnostics:
  - all “Export All CSV” controls now disable when summary readiness indicates no detailed diagnostics are exportable.
- Tightened acceptance assertions:
  - backend unit + DB-backed integration tests now explicitly assert non-export-ready behavior (`hasAnyDiagnostics=false`, `canExportDetailed=false`, `latestEventAt=null`) when tenant diagnostics are empty.

### S1 code slice 5 - closeout acceptance reconciliation

- Reconciled S1 acceptance mapping against implemented dashboard diagnostics behavior:
  - tenant/role-safe access path enforced through signed-tenant audit reads and dashboard proxy contract
  - deterministic summary + segmented counters proven by repeated filter-bound unit/integration assertions
  - partial/empty diagnostics behavior now explicitly covered by readiness guardrails and non-export-ready assertions
  - investigation handoff support verified via export controls plus widget-to-filter drill pathways
- Closed S1 open question for this feature scope:
  - provider/protocol remains internal API + audit-log telemetry path for FEAT-008 S1; no external provider dependency introduced.
- Marked feature status as done for current roadmap scope.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/audit/audit.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

- Founder OS Lite analytics coverage now includes:
  - daily outreach plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - weekly content plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - outreach daily-action completion emission (`REQUEST_CAMPAIGN_RESPONSE_RECEIVED`)
- Cadence visibility includes streak signals on `Today`:
  - consecutive weekdays meeting outreach target (3 completed actions/day)
  - consecutive weeks meeting content target (2 LinkedIn posts/week)

## Post-closeout hardening slice (2026-04-16)

### S2 code slice 1 - request campaign bulk-contact import UX baseline

- Added dashboard request-campaign dialog bulk target import flow in `apps/dashboard-product/app/requests/page.tsx`:
  - CSV upload (`.csv`) and paste-in CSV text area
  - parser with required columns (`email`, `full_name`)
  - row-level validation and invalid-row diagnostics
  - email deduplication and parsed-target preview
- Draft creation payload now includes parsed `targets` list (currently console-mocked until backend wiring is enabled in this surface).
- Create Draft action is now gated on both campaign metadata and at least one parsed target to prevent empty bulk-send drafts.
- Added page-level regression test coverage in `apps/dashboard-product/app/requests/page.test.tsx` for parse-and-enable flow.

### S2 code slice 2 - request campaign API wiring for bulk targets

- Added dashboard API proxy route `POST /api/requests/campaigns` forwarding to backend `POST /v1/requests/campaigns` with auth pass-through and `X-Idempotency-Key` support.
- Requests page draft creation now submits real payload contract (`request_type`, `campaign_name`, `description_template`, `due_date`, `targets[]`) using parsed bulk targets.
- Added operator feedback states for campaign creation (`Creating...`, success banner, failure banner) to make async send status explicit.
- Added proxy route test coverage in `apps/dashboard-product/app/api/requests/campaigns/route.test.ts` for fail-closed and header forwarding behavior.

### S2 code slice 3 - request draft creation response-state integration tests

- Added Requests page integration-level UI assertions for campaign create outcomes in `apps/dashboard-product/app/requests/page.test.tsx`:
  - success path renders campaign-created banner with returned campaign id
  - failure path renders backend error banner for operator remediation
- Existing parse-and-enable coverage remains in place, so draft creation test flow now validates full front-end journey: parse targets -> submit -> surface result state.

### S2 code slice 4 - bulk target payload mapping contract lock

- Extended Requests page submit integration test to assert exact outbound payload shape for bulk targets:
  - top-level campaign fields (`request_type`, `campaign_name`, `description_template`, `due_date`)
  - per-target mapping (`email`, `full_name`, `organization`, `farmer_id`, `plot_id`)
- Added assertion coverage for submit headers (`Content-Type`, generated `X-Idempotency-Key`) and endpoint path (`/api/requests/campaigns`) to prevent request-contract drift.

### S2 code slice 5 - malformed-row exclusion contract guard

- Added negative-path integration test ensuring malformed CSV rows are excluded before submit:
  - invalid email rows produce validation diagnostics
  - missing required-field rows produce validation diagnostics
  - outbound `targets[]` payload includes only valid parsed contacts
- This guards against accidental inclusion of invalid recipients in bulk request dispatch payloads.

### S2 code slice 6 - parse summary visibility for exclusion confidence

- Added parse summary UI in requests bulk-import flow:
  - `X valid / Y invalid excluded`
  - optional duplicate-row skipped count when deduplication occurs
- Added integration test assertion confirming summary text renders alongside malformed-row diagnostics in negative path.

### S2 code slice 7 - downloadable CSV template helper

- Added `Download CSV template` action directly in the requests bulk-import section to reduce first-time formatting friction.
- Template file includes required header contract plus sample rows and downloads as `tracebud-request-targets-template.csv`.
- Added integration test coverage to assert blob URL generation and download trigger behavior.

### S2 code slice 8 - paste-sample quick-fill helper

- Added `Paste sample CSV` helper action to instantly populate bulk-target textarea with a valid template payload.
- Quick-fill action immediately parses and previews targets so operators can validate/send flow without manual copy/paste during onboarding or demos.
- Added integration test coverage to assert textarea population and parsed-summary visibility after quick-fill trigger.

### S2 code slice 9 - CSV alias compatibility with warning visibility

- Added parser compatibility alias `name -> full_name` for inbound CSV headers to reduce friction with common CRM export formats.
- Added explicit alias-usage visibility in parser UI (`Column aliases applied: ...`) so operators can detect transformed headers before submit.
- Added integration test coverage for alias parsing and warning badge rendering.

### S2 code slice 10 - extended alias map for CRM export variants

- Expanded parser alias map for common external export conventions:
  - `email_address -> email`
  - `farmerid -> farmer_id`
  - `plotid -> plot_id`
- Alias warning badge now reports all applied mappings so transformed columns remain operator-visible before submit.
- Added integration test coverage for multi-alias parsing scenario with combined external-style headers.

### S2 code slice 11 - spaced-header alias interoperability

- Extended header normalization to accept spaced and hyphenated variants (for example `email address`, `full name`, `farmer id`, `plot id`) while preserving canonical field mapping.
- Alias warning visibility remains explicit for transformed headers so operators can verify parser behavior before request submission.
- Added integration test coverage proving spaced-header CSV input parses successfully with expected alias warnings.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed (`internal API + audit-log telemetry path retained for FEAT-008 S1 scope`)

## Status

Done (TB-V16-008 / FEAT-008)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
