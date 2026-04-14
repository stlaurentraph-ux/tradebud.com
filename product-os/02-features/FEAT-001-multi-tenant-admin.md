# Multi-tenant admin

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for multi-tenant admin aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Tenanting, RBAC, delegated admin, tenant switch context.

## Non-goals

Anything outside v1 boundaries in `MVP_PRD.md`.

## Dependencies

See `product-os/01-roadmap/dependency-map.md`.
Execution plan: `product-os/01-roadmap/dashboard-auth-tenant-hardening-week-plan.md`.

## Key entities

Use entity model in `MVP_PRD.md` and `PRODUCT_PRD.md`.

## UX / operational notes

Use journey and JTBD constraints from `JTBD_PRD.md` and `BUILD_READINESS_ARTIFACTS.md`.

## Tasks checklist

- [ ] Confirm permissions and tenant boundaries
- [ ] Confirm state transitions
- [ ] Confirm exception handling and recovery
- [ ] Confirm analytics event coverage
- [ ] Confirm acceptance criteria mapping
- [ ] Confirm v1.6 architecture constraints for touched areas (spatial, HLC sync, lineage, TRACES chunking, GDPR shredding)
- [ ] Update status docs

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

- [ ] Provider/protocol choices finalized where needed

## Status

In progress (2026-04-09)

## 2026-04-09 planning slice notes

- Established 1-week hardening sequence for auth and tenant isolation in dashboard/backend integration.
- Ticketized work into TB-DBX-001..004 covering claim-only tenant resolution, dedicated inbox persistence, golden-path integration tests, and MVP route gating.
- Kept scope aligned to permissions, state transitions, exception handling/recovery, analytics/audit events, and acceptance gates.

## 2026-04-09 implementation slice — TB-DBX-001

- Removed backend email/domain tenant fallback from inbox auth path.
- Enforced signed tenant-claim requirement (`app_metadata.tenant_id` or `user_metadata.tenant_id`) for inbox list/respond/bootstrap operations.
- Standardized dashboard inbox proxy behavior to preserve backend auth semantics (`401`/`403` pass-through; no auth-error fallback masking).
- Kept local fallback path only for backend-unavailable/demo continuity, while backend-bound requests no longer trust client-supplied tenant IDs.

## 2026-04-09 implementation slice — TB-DBX-002 (backend data path)

- Replaced inbox snapshot persistence in `audit_log` with dedicated relational tables: `inbox_requests` and `inbox_request_events`.
- Added tenant-scoped query/index path (`recipient_tenant_id`, `status`, `due_at`) to keep read access isolated and performant.
- Preserved canonical request state transitions (`PENDING` -> `RESPONDED`) with idempotent respond behavior.
- Kept analytics/audit coverage by emitting `inbox_requests_seeded` and `inbox_request_responded` events to `audit_log` for state-changing operations.
- Preserved dashboard contract shape (`requests`, `request`) so FEAT-008 UI flows continue without API contract breakage.

## 2026-04-09 implementation slice — TB-DBX-003 (test harness)

- Added inbox tenant/state integration tests (`inbox.service.int.spec.ts`) covering tenant-scoped list, idempotent respond, cross-tenant rejection, and missing-tenant rejection.
- Added controller auth-claim guard tests (`inbox.controller.spec.ts`) covering missing signed tenant claim, signed-claim tenant pass-through, and exporter-only bootstrap enforcement.
- Kept integration suite environment-gated through `TEST_DATABASE_URL` to align with existing backend integration test patterns.

## 2026-04-09 implementation slice — TB-DBX-004 (MVP feature fences)

- Added central feature-gate registry in `apps/dashboard-product/lib/feature-gates.ts` with MVP-safe defaults.
- Added route-entry guard in `apps/dashboard-product/middleware.ts` to block deep links to deferred routes when flags are disabled.
- Added navigation-level gating in `apps/dashboard-product/lib/rbac.ts` so deferred routes are hidden from sidebar when disabled.
- Added single-source gate documentation in `product-os/01-roadmap/dashboard-mvp-feature-gates.md` (env vars, ownership, deferred routes, QA assertions).
- Added dashboard automated checks for gate behavior using Vitest (`apps/dashboard-product/lib/feature-gates.test.ts`, `apps/dashboard-product/middleware.test.ts`) and wired `npm test` in dashboard package scripts.

## 2026-04-13 implementation slice — report endpoint role hardening

- Added explicit exporter-only authorization checks to backend reports endpoints (`GET /api/v1/reports/plots`, `GET /api/v1/reports/harvests`) to prevent farmer/agent access to report exports.
- Added regression tests in `tracebud-backend/src/reports/reports.controller.spec.ts` for deny/allow behavior so CI fails on role-boundary regressions.
- Permissions and tenant boundary note: report access now requires authenticated exporter role and no longer relies on guard-only authentication for authorization.

## 2026-04-13 implementation slice — farmer scope enforcement beyond inbox

- Added controller-level farmer ownership checks in harvest and plot flows so farmer-role users cannot access another farmer's records by passing arbitrary IDs.
- New scope checks enforce:
  - `HarvestController`: farmer ownership required for `POST /v1/harvest` and `GET /v1/harvest/vouchers?farmerId=...`.
  - `PlotsController`: farmer ownership required for `GET /v1/plots?farmerId=...` and farmer-role plot actions by `plotId` (`PATCH /v1/plots/:id`, sync endpoints, GFW check, compliance history).
- Tightened DDS package access surface in harvest controller: list/detail/TRACES export are now exporter-only.
- Added controller regression tests:
  - `tracebud-backend/src/harvest/harvest.controller.spec.ts`
  - `tracebud-backend/src/plots/plots.controller.spec.ts`

## 2026-04-13 implementation slice — ownership integration coverage

- Added env-gated integration coverage for ownership helper joins in `tracebud-backend/src/harvest/ownership-scope.int.spec.ts`.
- Test uses isolated schema fixtures (`tb_scope_test`) to validate:
  - farmer ownership allow/deny for `isFarmerOwnedByUser` (harvest + plots services),
  - plot ownership allow/deny for `isPlotOwnedByUser` via `plot -> farmer_profile` join.
- Coverage is aligned with `TEST_DATABASE_URL` gating and is intended to run in CI/DB-enabled local environments.

## 2026-04-13 implementation slice — controller-level ownership integration

- Added controller integration coverage in `tracebud-backend/src/harvest/controller-scope.int.spec.ts` with real DB-backed ownership checks and isolated fixture schema (`tb_controller_scope_test`).
- Coverage validates deny/allow behavior at controller boundary:
  - `HarvestController.listVouchers` denies farmer access for foreign `farmerId` and allows own `farmerId`.
  - `PlotsController.listByFarmer` denies foreign `farmerId` and allows own `farmerId`.
  - `PlotsController.updateMetadata` denies foreign `plotId` and allows own `plotId`.

## 2026-04-13 implementation slice — CI ownership execution gate

- Added dedicated backend npm script `test:integration:ownership` to run ownership-focused integration specs explicitly.
- Updated CI backend job to run a required step `Ownership integration tests (required)` after main integration tests.
- This makes ownership scope coverage visible and mandatory as a separate execution gate rather than relying only on broad `**/*.int.spec.ts` runs.

## 2026-04-13 implementation slice — signed tenant-claim enforcement expansion

- Extended signed tenant-claim requirement to additional backend controllers (`harvest`, `plots`, `reports`) so requests without `tenant_id` in signed token metadata are rejected.
- Added/updated regression tests to enforce missing-tenant-claim denial behavior:
  - `tracebud-backend/src/reports/reports.controller.spec.ts`
  - `tracebud-backend/src/harvest/harvest.controller.spec.ts`
  - `tracebud-backend/src/plots/plots.controller.spec.ts`
  - `tracebud-backend/src/harvest/controller-scope.int.spec.ts` (controller integration fixture updates).

## 2026-04-13 implementation slice — audit controller tenant-claim closure

- Completed authenticated-controller inventory and closed the remaining gap in `audit` controller by requiring signed `tenant_id` claim on create/list paths.
- Added regression tests in `tracebud-backend/src/audit/audit.controller.spec.ts` for:
  - missing-claim denial (`create`, `list`),
  - allowed list behavior when claim is present.

## 2026-04-13 implementation slice — package/report export access integration tests

- Added DB-backed API integration coverage in `tracebud-backend/src/reports/package-report-access.int.spec.ts` with isolated schema fixtures (`tb_api_access_test`).
- Coverage validates combined tenant-claim + role policy for:
  - `HarvestController.listPackages`
  - `HarvestController.getPackage`
  - `HarvestController.getPackageTracesJson`
  - `ReportsController.plotsReport`
  - `ReportsController.harvestsReport`
- Scenarios covered:
  - deny when tenant claim missing (even exporter role),
  - deny when tenant claim present but role is non-exporter,
  - allow when tenant claim present and role is exporter.
- Added this test to required CI ownership integration script (`test:integration:ownership`) for explicit execution under DB-enabled environments.

## 2026-04-13 implementation slice — CI ownership evidence publishing

- Enhanced backend CI ownership step to capture and publish execution evidence:
  - test run output persisted to `ownership-integration-output.txt`,
  - key result lines appended to GitHub job summary,
  - raw log uploaded as artifact `backend-ownership-integration-log`.
- This makes ownership-policy integration execution auditable from PR checks without opening full backend logs.
- Added hard fail guard in CI when ownership suite output contains non-zero skipped counts, so ownership policy coverage cannot silently bypass enforcement.

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
