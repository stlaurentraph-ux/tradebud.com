# Risk scoring

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for risk scoring aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Single-provider risk scoring with explainability and override.

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

Scope: deterministic package-level risk scoring contract with explicit exporter-only tenant-safe access and explainability payload.

### Permission and tenant boundary matrix

- **Exporter role:** can request package risk scoring inside signed tenant scope.
- **Farmer/agent roles:** denied package risk score access for v1.
- **Missing tenant claim:** fails closed before scoring execution.

### State transition matrix

- `draft_package -> risk_scored` when risk score endpoint is evaluated.
- `risk_scored -> review_queue` when score band is `high` or `medium`.
- `risk_scored -> submission_candidate` when score band is `low` and readiness blockers are absent.

### Exception handling and recovery

- Missing package identifiers or invalid package context fail with deterministic request errors.
- Scoring uses deterministic rule inputs and returns bounded score range (`0..100`) to avoid unstable operator outcomes.
- Re-scoring is idempotent for unchanged package/voucher inputs.

### Analytics/event coverage

- Risk-score lifecycle events are now persisted for exporter-triggered checks:
  - `dds_package_risk_score_requested`
  - `dds_package_risk_score_evaluated`
  - `dds_package_risk_score_low|medium|high`
- Event payload includes `packageId`, `provider`, `score`, `band`, `reasonCount`, and `scoredAt` for operational diagnostics evidence.
- Tenant-scoped diagnostics read path is now available in audit telemetry (`GET /v1/audit/gated-entry/risk-scores`) and surfaced in dashboard admin diagnostics.

### Acceptance mapping (v1)

- Risk scoring result is deterministic for identical package input.
- Explainability reasons are returned with machine-readable `code` and weighted contribution.
- Access policy is explicit and tenant-safe (`exporter` + tenant claim only).

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** not directly evaluated in this baseline scoring slice.
- **Offline conflict integrity:** score computation is server-side deterministic and does not trust client clocks.
- **Lineage performance:** no runtime lineage traversal introduced in this slice.
- **TRACES chunking resilience:** scoring outcome is intended to feed future pre-flight and chunking decisions.
- **GDPR shredding safety:** response excludes personal data and keeps explainability reason codes generic.

## Execution slices

### S1 code slice 1 - deterministic risk score contract bootstrap

- Added exporter-only, tenant-claim-guarded endpoint: `GET /v1/harvest/packages/{id}/risk-score`.
- Implemented deterministic single-provider scoring (`internal_v1`) in `HarvestService.evaluateDdsPackageRiskScore` with explainability reasons and bounded score banding.
- Published OpenAPI contract with `DdsPackageRiskScoreResponse` and `DdsPackageRiskScoreReason`.
- Added unit coverage for controller access gates and service scoring logic paths.

Verification commands:

- `npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`
- `npm run openapi:lint`

### S1 code slice 2 - risk-score audit lifecycle persistence proof

- Added best-effort audit append lifecycle in `HarvestService.evaluateDdsPackageRiskScore`:
  - `dds_package_risk_score_requested`
  - `dds_package_risk_score_evaluated`
  - band-specific event (`dds_package_risk_score_low|medium|high`)
- Added unit assertions in `harvest.service.spec.ts` to lock lifecycle event emission by risk path.
- Added DB-backed controller integration in `controller-scope.int.spec.ts` proving exporter risk-score checks persist lifecycle events and payload contract fields.

Verification commands:

- `npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`

### S1 code slice 3 - tenant-scoped risk-score diagnostics read + dashboard visibility

- Added tenant-scoped audit telemetry read endpoint: `GET /v1/audit/gated-entry/risk-scores` with paging/sort plus `phase` and `band` filters.
- Risk-score audit payload now includes tenant/actor metadata (`tenantId`, `exportedBy`) and stores originating user id for diagnostics attribution.
- Added DB-backed integration and controller unit coverage for risk-score telemetry reads.
- Dashboard telemetry proxy now supports `eventKind=risk_scores`, and admin diagnostics now renders risk-score activity table with filter + pagination controls.

Verification commands:

- `npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts src/audit/audit.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts src/audit/audit.gated-entry.int.spec.ts`
- `npm test -- app/api/analytics/gated-entry/route.test.ts`

### S1 code slice 4 - risk-score CSV diagnostics export + OpenAPI publication

- Added tenant-scoped CSV endpoint for risk-score telemetry: `GET /v1/audit/gated-entry/risk-scores/export` with `phase`/`band` filters and export metadata headers (`X-Export-Row-*`).
- Dashboard analytics proxy now routes `eventKind=risk_scores&format=csv` and admin diagnostics now supports both page-local and full-filter CSV export for risk-score activity.
- Published OpenAPI contract for risk-score telemetry read + export endpoints and typed schemas (`RiskScoreTelemetryListResponse`, `RiskScoreTelemetryEvent`, `RiskScorePayload`).
- Added HTTP integration coverage for risk-score read/export pipeline and updated route/controller tests.

Verification commands:

- `npm test -- --runTestsByPath src/audit/audit.controller.spec.ts src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts src/audit/audit.risk-scores.api.int.spec.ts`
- `npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

### S1 code slice 5 - architecture-constraint closure + feature closeout

- Confirmed v1.6 architecture constraints for touched risk-scoring surfaces:
  - **Spatial correctness:** risk scoring remains read-only over canonical package/voucher data and does not alter geometry storage/math; no `GEOGRAPHY` bypass introduced.
  - **Offline conflict integrity:** scoring is server-side deterministic and independent of client wall clocks; telemetry ordering relies on persisted server timestamps.
  - **Lineage performance:** no runtime lineage traversal path added in FEAT-005 S1 (package-local scoring only), preserving O(1) lookup assumptions for this slice.
  - **TRACES chunking resilience:** scoring output is bounded and telemetry export supports capped CSV extraction (`5000` rows) for operational handoff without changing TRACES payload generation flow.
  - **GDPR shredding safety:** diagnostics payload keeps machine-safe IDs and aggregated metrics (score/band/reasonCount) without introducing direct personal data fields.
- Completed checklist and status hygiene for FEAT-005 S1.

### S1 post-closeout hardening slice 6 - yield benchmark governance write path (source-reference + dual-control)

- Added internal benchmark administration backend contract:
  - `POST /v1/yield-benchmarks` (create draft, always inactive)
  - `PATCH /v1/yield-benchmarks/{id}` (update draft only, active immutable)
  - `POST /v1/yield-benchmarks/{id}/activate` (dual-control activation)
  - `GET /v1/yield-benchmarks` (internal list with optional `active` filter)
- Enforced permission and state transitions:
  - signed tenant claim required on all routes
  - internal-admin policy enforced (canonical role claims `ADMIN` or `COMPLIANCE_MANAGER`; temporary legacy fallback retained for `exporter` + `@tracebud.com`)
  - state flow locked to `draft -> active`
  - same-user creator/approver activation rejected (`Dual-control violation`).
- Enforced exception handling and recovery semantics:
  - strict source-type validation (`SPONSOR_OVERRIDE|NATIONAL_STATS|USDA_FAS|FAOSTAT`)
  - citable `sourceReference` required for `NATIONAL_STATS`, `USDA_FAS`, `FAOSTAT`
  - `yieldLowerKgHa <= yieldUpperKgHa` and positive `seasonalityFactor`
  - active benchmark edit attempts fail closed.
- Added immutable analytics/audit evidence events:
  - `yield_benchmark_created`
  - `yield_benchmark_updated`
  - `yield_benchmark_activated`.
- Added canonical DB migration baseline:
  - `tracebud-backend/sql/tb_v16_011_yield_benchmarks.sql`
  - includes source-reference check constraint and active-only uniqueness key.
- Published OpenAPI contract entries for all four routes in `docs/openapi/tracebud-v1-draft.yaml`.
- Added unit + DB-backed integration coverage:
  - `src/integrations/yield-benchmarks.controller.spec.ts`
  - `src/integrations/yield-benchmarks.controller.int.spec.ts`.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 7 - canonical benchmark-admin claim mapping

- Upgraded role derivation to recognize canonical Supabase role claims:
  - `ADMIN` -> `admin`
  - `COMPLIANCE_MANAGER` -> `compliance_manager`
  - supports claim lookup in `app_metadata.role` and `user_metadata.role`.
- Yield benchmark admin controller now prefers claim-based authorization (`admin|compliance_manager`) and records authorization mode (`claim` vs `legacy_fallback`) in audit payloads for migration observability.
- Updated yield benchmark unit + DB-backed integration coverage to exercise claim-based creator/approver paths.
- Kept temporary fallback compatibility for existing internal `exporter+@tracebud.com` sessions while claim rollout completed.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts`

### S1 post-closeout hardening slice 8 - claim-only benchmark-admin enforcement

- Removed legacy fallback policy for yield benchmark administration.
- Yield benchmark write/list/activate routes now require canonical Supabase role claims only:
  - `ADMIN`
  - `COMPLIANCE_MANAGER`
- Added regression unit coverage proving `exporter@tracebud.com` without admin/compliance claim is denied.
- Preserved deterministic dual-control and source-reference validation behavior from prior slices.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/yield-benchmarks.controller.int.spec.ts`

### S1 post-closeout hardening slice 9 - benchmark-admin claim health warning surface

- Extended backend health payload (`GET /health`) with benchmark-admin auth diagnostics:
  - `benchmarkAdminAuth.claimEnforced`
  - `benchmarkAdminAuth.configured`
  - `benchmarkAdminAuth.requiredClaims`
  - `warnings[]` for configuration drift.
- Added claim-configuration parser using env `BENCHMARK_ADMIN_ROLE_CLAIMS` (comma-separated), defaulting to `ADMIN,COMPLIANCE_MANAGER`.
- Added fail-safe warning when claim configuration resolves to empty, to reduce silent operator lockout risk after claim-only enforcement.
- Added unit coverage:
  - default configuration path
  - empty config warning path.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/health/health.controller.spec.ts src/integrations/yield-benchmarks.controller.spec.ts src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`

### S1 post-closeout hardening slice 10 - CI benchmark-admin claim preflight gate

- Added backend preflight script:
  - `tracebud-backend/scripts/check-benchmark-admin-claims.mjs`
  - validates `BENCHMARK_ADMIN_ROLE_CLAIMS` is non-empty and contains required canonical claims (`ADMIN`, `COMPLIANCE_MANAGER`).
- Added backend package command:
  - `npm run auth:benchmark-admin:claims:check`
- Wired backend CI job to fail closed when claim config is missing/invalid:
  - requires `BENCHMARK_ADMIN_ROLE_CLAIMS` secret
  - executes preflight check before integration test lane.
- This converts benchmark-admin claim safety from observability-only (`/health` warning) to a blocking CI gate.

Verification commands:

- `cd tracebud-backend && BENCHMARK_ADMIN_ROLE_CLAIMS="ADMIN,COMPLIANCE_MANAGER" npm run auth:benchmark-admin:claims:check`
- `cd tracebud-backend && npm test -- --runTestsByPath src/health/health.controller.spec.ts src/integrations/yield-benchmarks.controller.spec.ts`

### S1 post-closeout hardening slice 11 - benchmark-driven yield-cap enforcement in harvest runtime

- Replaced hardcoded harvest yield-cap enforcement path with active benchmark lookup against `yield_benchmarks`:
  - scope key: `commodity=coffee` + plot-linked geography (`farmer_profile.country_code`)
  - deterministic fallback order: exact geography -> `GLOBAL` benchmark row -> default fallback cap (`1500 kg/ha`)
- Added deterministic benchmark resolution helper in `HarvestService`:
  - applies `yield_upper_kg_ha * seasonality_factor`
  - fail-safe fallback on missing/invalid benchmark rows or query errors.
- Added yield-cap analytics/audit event coverage in harvest runtime:
  - `yield_cap_resolved`
  - `yield_cap_fallback_used`
  - `yield_cap_violation_detected`
- Preserved canonical state behavior and exception semantics:
  - harvest state transition remains unchanged (`create` succeeds or fails with explicit blocker)
  - cap violations continue to fail closed with deterministic `BadRequestException`.
- Updated package-level risk-density check to consume benchmark resolver (with `GLOBAL` geography fallback) instead of hardcoded constant.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts`
- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.controller.spec.ts`

### S1 post-closeout hardening slice 12 - benchmark import draft upsert scaffold

- Added internal-admin benchmark import endpoint:
  - `POST /v1/yield-benchmarks/import`
  - accepts `rows[]` batch payload and enforces non-empty import set.
- Implemented deterministic import validation and state behavior:
  - row-level canonical validation reuses existing create rules (source type, citable source reference, numeric plausibility)
  - import path is draft-only (`active=FALSE`) upsert semantics:
    - update matching inactive draft (`commodity + geography + source_type + source_reference`)
    - otherwise insert a new inactive draft row.
- Added import telemetry events for operations and recovery diagnostics:
  - `yield_benchmark_import_started`
  - `yield_benchmark_import_completed`
- Added focused unit coverage for:
  - create-only import path
  - update-existing-draft import path.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`
- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts`

### S1 post-closeout hardening slice 13 - source-sync adapter boundary + import-run persistence

- Added source-sync ingestion contract:
  - `POST /v1/yield-benchmarks/import/sync-source`
  - supports `sourceType` (`USDA_FAS` or `FAOSTAT`) with optional `commodity` / `geography` filters and `dryRun`.
- Added source-adapter boundary behavior:
  - source endpoints are runtime-configured via `YIELD_BENCHMARKS_USDA_FAS_URL` / `YIELD_BENCHMARKS_FAOSTAT_URL`
  - source pull maps adapter payload rows into canonical benchmark import rows before existing validation/upsert logic.
- Added import-run diagnostics read contract:
  - `GET /v1/yield-benchmarks/import-runs?limit=...`
  - returns recent ingestion runs for replay/operational diagnostics.
- Added import-run persistence baseline:
  - new SQL migration `tracebud-backend/sql/tb_v16_012_yield_benchmark_import_runs.sql`
  - run table tracks `source_type`, `status`, `row_count`, actor attribution, metadata/details payloads, and start/finish timestamps.
- Added deterministic exception/recovery behavior:
  - missing import-run table (`42P01`) fail-softs for reads (empty list) and run-tracking writes (feature continues while migration is pending)
  - source non-2xx responses fail closed with deterministic validation error.
- Added telemetry events for source-sync lifecycle:
  - `yield_benchmark_sync_completed` (plus existing import started/completed events).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`
- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts`

### S1 post-closeout hardening slice 14 - direct FAOSTAT authenticated fetch fallback

- Extended source sync behavior for `FAOSTAT`:
  - when `YIELD_BENCHMARKS_FAOSTAT_URL` is set, existing adapter URL flow is used.
  - when adapter URL is absent, controller now performs direct authenticated fetch against FAOSTAT API.
- Added direct FAOSTAT runtime contract:
  - endpoint default: `https://faostatservices.fao.org/api/v1/en/data/QCL`
  - auth secret: `YIELD_BENCHMARKS_FAOSTAT_API_KEY` sent as `x-api-key`
  - optional override: `YIELD_BENCHMARKS_FAOSTAT_DIRECT_URL`.
- Added direct mapping semantics:
  - FAOSTAT payload `value` (hg/ha) is normalized to kg/ha (`/10`) for benchmark bounds.
  - imports are still persisted through canonical draft upsert path and existing validation rules.
- Added focused unit coverage proving:
  - direct fallback path is used when adapter URL is unset
  - request includes FAOSTAT API key header
  - normalized row is imported and tracked in run lifecycle.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/yield-benchmarks.controller.spec.ts`
- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/integrations/yield-benchmarks.controller.spec.ts`

### S1 post-closeout hardening slice 15 - benchmark activation at scale + dual-control evidence

- Completed FAOSTAT-backed benchmark seeding and activation for the selected non-re-export coffee exporter set:
  - `21, 237, 44, 226, 101, 95, 238, 100, 170, 89, 138, 215, 48, 107, 168, 114`
- Verified import and activation state transitions end-to-end:
  - draft import (`active=false`) -> dual-control activation (`active=true`)
  - second approver enforcement validated (same-user activation blocked with deterministic `403`).
- Confirmed source-sync import-run diagnostics and per-country activation responses are persisted for operational replay/traceability.
- Yearly refresh cadence decision recorded for FAOSTAT benchmark maintenance (aligned with FAOSTAT annual publication cadence):
  - `import/sync-source` execution target cadence: **yearly**
  - activation remains explicit dual-control post-review.

Verification commands:

- `POST /api/v1/yield-benchmarks/import/sync-source` (country-scoped, `dryRun=false`)
- `POST /api/v1/yield-benchmarks/{id}/activate` (second approver JWT)
- `GET /api/v1/yield-benchmarks?active=true`

### S1 post-closeout hardening slice 16 - runtime benchmark-path closure (commodity alias + geography persistence)

- Fixed runtime benchmark lookup mismatch in harvest enforcement:
  - `HarvestService.resolveYieldCapKgPerHa` now resolves commodity aliases (`coffee` <-> `656` / `coffee, green`) so active FAOSTAT benchmark rows are used by harvest runtime.
- Fixed plot creation persistence gap against geography constraints:
  - `PlotsService.create` now writes `plot.geography` on insert (`v.geom::geography`) to satisfy canonical spatial constraint and keep `GEOGRAPHY`-first storage semantics intact.
- Re-validated live harvest enforcement with fake fixture data:
  - below-cap accepted
  - near-cap accepted
  - above-cap blocked
  - audit now shows `yield_cap_resolved` with `sourceType=FAOSTAT` and non-null `benchmarkId` (no longer fallback).

Verification commands:

- `npx jest src/harvest/harvest.service.spec.ts --runInBand`
- `npm test -- plots.service.spec.ts`
- live checks:
  - `POST /api/v1/plots`
  - `POST /api/v1/harvest` (below/near/above)
  - audit verification query for `yield_cap_resolved|yield_cap_violation_detected`.

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed (`internal_v1` scoring provider retained for FEAT-005 S1; no new external provider/protocol dependency introduced).

## Status

Done (TB-V16-005 / FEAT-005)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
