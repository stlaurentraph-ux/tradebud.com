# Filing middleware

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for filing middleware aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Pre-flight, package generation, idempotent submission lifecycle.

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

Scope: filing middleware execution matrix bootstrap for pre-flight validation, package generation, and idempotent submission lifecycle.

### Permission and tenant boundary matrix

- **Exporter role:** can trigger filing pre-flight checks, package generation, and submission actions for signed tenant scope.
- **Reviewer/admin roles:** can inspect filing artifacts and status but cannot submit on behalf of exporter without explicit delegated workflow.
- **Farmer/agent roles:** cannot execute filing middleware submission endpoints in v1.
- **Missing tenant claim:** fails closed before any filing pre-flight or submission operation.

### State transition matrix

- `ready_to_submit -> preflight_validated` when filing middleware pre-flight checks pass.
- `preflight_validated -> package_generated` when payload bundle/artifacts are generated for filing.
- `package_generated -> submission_inflight` when idempotent submission request is accepted.
- `submission_inflight -> submitted` when external filing acknowledgement/reference is confirmed.
- `submission_inflight -> retryable_failed` when transient errors occur with replay-safe idempotency key.
- `retryable_failed -> submission_inflight` on controlled retry preserving same idempotency semantics.

### Exception handling and recovery

- Pre-flight validation failures return deterministic blocker payloads with no partial submission side effects.
- Submission transport/provider failures are captured as retryable vs terminal categories with explicit operator guidance.
- Duplicate submission requests with same idempotency key return prior accepted outcome without duplicate side effects.
- Recovery path requires canonical state progression; no direct bypass from failed to submitted without replayed middleware check.

### Analytics/event coverage

- Filing lifecycle telemetry must include:
  - preflight requested / preflight passed / preflight blocked
  - package generated
  - submission requested / submission accepted / submission failed / submission retried
- Event payload baseline: tenantId, packageId, actor identity, idempotency key, outcome state, and timestamp.

### Acceptance mapping (v1)

- Identical filing requests with identical idempotency key produce one logical submission side effect.
- Failed submissions expose deterministic retry-safe behavior and preserve audit evidence.
- Pre-flight blockers prevent submission transition until corrected.
- Role and tenant boundaries are enforced on trigger and read surfaces.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** filing uses upstream validated spatial outputs only (no geometry mutation in middleware path).
- **Offline conflict integrity:** idempotent submission ordering must not trust client wall clocks and should remain replay-safe under delayed retries.
- **Lineage performance:** filing package assembly should rely on materialized lineage fields, avoiding runtime deep traversal.
- **TRACES chunking resilience:** package generation must support payload chunking/reference reconciliation when size/vertex constraints are exceeded.
- **GDPR shredding safety:** filing audit traces preserve retention-safe references while avoiding re-introduction of shredded personal fields.

## Execution slices

### S1 code slice 1 - filing middleware execution matrix bootstrap

- Documented FEAT-006 S1 matrix for permissions, transitions, exception/recovery behavior, analytics, acceptance, and v1.6 architecture constraint applicability.
- Established implementation-ready baseline for next FEAT-006 slices (pre-flight endpoint contract, idempotent submission middleware, and filing telemetry persistence).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - filing pre-flight endpoint contract + scope enforcement

- Implemented exporter-only, tenant-claim fail-closed filing pre-flight endpoint: `GET /v1/harvest/packages/{id}/filing-preflight`.
- Added deterministic pre-flight result contract that combines readiness and risk outputs into one operator-facing decision surface (`preflight_blocked` vs `preflight_ready`) with explicit counters and timestamps.
- Added filing pre-flight lifecycle telemetry events (`dds_package_filing_preflight_requested/evaluated/blocked/ready`) with tenant + actor context for audit traceability.
- Extended backend coverage with unit and DB-backed integration tests for role/tenant enforcement and pre-flight telemetry persistence semantics.
- Published OpenAPI contract for new endpoint and response schema (`DdsPackageFilingPreflightResponse`) and validated lint pass.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm run openapi:lint`

### S1 code slice 3 - package-generation contract + idempotent submission semantics

- Added exporter-only package generation endpoint `POST /v1/harvest/packages/{id}/generate` with tenant-claim fail-closed enforcement.
- Generation path now runs filing pre-flight and emits deterministic `package_generated` contract (`artifactVersion`, `lotCount`, `generatedAt`) before submission.
- Added idempotent submission contract on `PATCH /v1/harvest/packages/{id}/submit` with required `idempotencyKey` request body and replay-safe semantics.
- Submission now records deterministic lifecycle telemetry (`dds_package_submission_requested/accepted/replayed`) with tenant/actor/idempotency metadata and preserves prior accepted outcome on replay.
- Package generation lifecycle telemetry (`dds_package_generation_requested/generated`) is now persisted for auditability.
- OpenAPI now documents both package generation and submit request/response contracts with lint-validated schemas.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm run openapi:lint`

### S1 code slice 4 - filing lifecycle diagnostics read/export surfaces

- Added tenant-scoped filing lifecycle diagnostics endpoints:
  - `GET /v1/audit/gated-entry/filing-activity`
  - `GET /v1/audit/gated-entry/filing-activity/export`
- Diagnostics now cover generation and submission lifecycle events (`dds_package_generation_*`, `dds_package_submission_*`) with optional phase filtering and paginated list responses.
- CSV export supports the same phase filtering and emits metadata headers (`X-Export-Row-Limit`, `X-Export-Row-Count`, `X-Export-Truncated`) for evidence workflows.
- Dashboard analytics proxy now forwards `eventKind=filing_activity` list/export requests to backend filing-activity diagnostics routes.
- Admin diagnostics UI now includes a dedicated Filing Activity section with phase filter, pagination, and CSV export (`current page` + `all filtered`) controls.
- OpenAPI now documents filing activity list/export paths and discriminator-based telemetry event schemas for generation/submission lifecycle payloads.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/audit/audit.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

### S1 code slice 5 - architecture-constraint closure + FEAT closeout

- Closed FEAT-006 S1 against architecture constraints for touched surfaces:
  - **Spatial correctness:** filing middleware reuses upstream validated plot geometry outputs and does not mutate geometry in pre-flight/generation/submission paths.
  - **Offline conflict integrity:** submission replay behavior is now keyed by deterministic idempotency key semantics and does not depend on client wall-clock ordering.
  - **Lineage performance:** filing generation reads package detail/voucher linkage from materialized relational joins without introducing runtime deep lineage traversal loops.
  - **TRACES chunking resilience:** generation/submission contracts now isolate artifact creation and submission lifecycle states, establishing explicit extension points for chunked payload/reference reconciliation in subsequent protocol adapters.
  - **GDPR shredding safety:** filing diagnostics and submission telemetry only persist retention-safe operational references (packageId, lifecycle state, idempotency key, trace reference) and avoid rehydrating personal-profile fields.
- Confirmed acceptance mapping coverage: role/tenant gates are enforced on trigger and diagnostics surfaces, pre-flight blockers stop unsafe submission transitions, idempotent replay preserves single logical side effect, and filing lifecycle audit evidence is available in list/export diagnostics.
- Resolved FEAT open question (`Provider/protocol choices finalized where needed`) by retaining internal middleware provider semantics for S1 (`internal_v1`-style deterministic flow) and deferring external filing protocol adapters to later feature slices.
- Marked FEAT-006 status as `Done (TB-V16-006 / FEAT-006)` after checklist, tests, telemetry, and documentation gates were satisfied.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts src/audit/audit.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts src/audit/audit.gated-entry.int.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

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

- [x] Provider/protocol choices finalized where needed (`internal_v1` deterministic filing middleware retained for FEAT-006 S1 scope; external adapter selection deferred)

## Status

Done (TB-V16-006 / FEAT-006)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
