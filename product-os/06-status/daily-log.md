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
