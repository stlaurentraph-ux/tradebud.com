# EUDR rules engine

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for eudr rules engine aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Completeness + blocker/warning policy checks for v1 EUDR.

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

Scope: rules-evaluation hardening for tenant-safe blocker/warning policy decisions on EUDR readiness checks.

### Permission and tenant boundary matrix

- **Farmer/agent roles:** can trigger pre-submit readiness checks only for records within signed tenant scope.
- **Exporter role:** can trigger and review full readiness detail for owned tenant dossiers/packages.
- **Reviewer/admin roles:** can inspect rule outcomes but cannot bypass canonical blocker checks without explicit state transition path.
- **Missing tenant claim:** must fail closed before rules evaluation and before any persisted decision artifact.

### State transition matrix

- `draft -> readiness_checked` when rules engine evaluates dossier/package inputs.
- `readiness_checked -> blocked` when any blocker rule remains unresolved.
- `readiness_checked -> warning_review` when only warning-grade issues remain.
- `warning_review -> ready_to_submit` when warnings are acknowledged per canonical workflow.
- `blocked -> readiness_checked` on re-evaluation after corrective data updates.

### Exception handling and recovery

- Missing/invalid required evidence inputs return deterministic rule-failure reasons without partial/implicit passes.
- Rule-evaluation infrastructure failures return explicit retryable errors; previous confirmed decision state is preserved.
- Unknown rule identifiers/config mismatch fails closed with auditable diagnostics entry.
- Re-evaluation after data correction is idempotent and must replace stale blocker/warning snapshots.

### Analytics/event coverage

- Rules lifecycle events:
  - readiness check requested
  - readiness check evaluated
  - readiness check blocked
  - readiness check warning-only
  - readiness check passed
- Include tenantId, actor role/user, evaluated entity IDs, blocker/warning counts, and evaluation timestamp for traceability.

### Acceptance mapping (v1)

- Readiness outcomes are deterministic for identical inputs.
- Blockers must prevent transition to submission-ready states until resolved.
- Warning-only outcomes preserve operator visibility and explicit acknowledge/recheck path.
- Tenant isolation and role constraints are explicit for trigger/read actions.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** in scope where rules depend on plot geometry compliance signals; consume canonical validated geometry outputs only.
- **Offline conflict integrity:** in scope for evaluation input freshness; avoid trusting stale client clocks for readiness decisions.
- **Lineage performance:** in scope for batch/package-level rule checks that traverse upstream entities; preserve O(1) runtime traversal assumptions via materialized lineage fields.
- **TRACES chunking resilience:** indirectly in scope for readiness checks that gate downstream submission packaging.
- **GDPR shredding safety:** rule outcomes must retain retention-safe audit references without exposing shredded personal fields.

## Execution slices

### S1 code slice 1 - rules-engine execution matrix bootstrap

- Documented FEAT-004 S1 policy matrix for permissions, state transitions, exception recovery, analytics, acceptance, and v1.6 constraint applicability.
- Established implementation-ready baseline so subsequent FEAT-004 code slices can map directly to explicit gates and evidence expectations.

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - deterministic package readiness evaluation contract

- Added backend readiness evaluation contract at `GET /v1/harvest/packages/{id}/readiness` with tenant fail-closed and exporter-only access policy.
- Implemented deterministic blocker/warning rule outputs in `HarvestService.evaluateDdsPackageReadiness`:
  - blockers for missing vouchers / invalid voucher weight
  - warnings for missing harvest date / missing declared area.
- Readiness state is now explicit and reproducible from input data (`blocked`, `warning_review`, `ready_to_submit`), supporting canonical transition path from draft package checks.
- Added OpenAPI contract publication for readiness endpoint + response schema (`DdsPackageReadinessResponse` and `DdsPackageReadinessIssue`).

Verification commands:

- `npm test -- src/harvest/harvest.controller.spec.ts src/harvest/harvest.service.spec.ts`
- `npm run openapi:lint`

### S1 code slice 3 - readiness analytics event lifecycle

- Readiness evaluation now emits audit lifecycle events:
  - `dds_package_readiness_requested`
  - `dds_package_readiness_evaluated`
  - `dds_package_readiness_blocked` / `dds_package_readiness_warning` / `dds_package_readiness_passed`
- Audit payload includes `packageId`, evaluated status, blocker/warning counts, and readiness evaluation timestamp for diagnostics evidence continuity.
- Analytics append is best-effort to preserve operator responsiveness if audit persistence is temporarily unavailable.

Verification commands:

- `npm test -- src/harvest/harvest.service.spec.ts src/harvest/harvest.controller.spec.ts`

### S1 code slice 4 - readiness audit persistence integration proof

- Added DB-backed controller-scope integration assertion proving readiness checks persist `dds_package_readiness_*` lifecycle events in audit log during exporter-triggered evaluations.
- Integration now validates emitted event sequence includes `requested`, `evaluated`, and outcome phase (`warning` for warning-review path), with payload counters (`blockerCount`, `warningCount`) preserved.
- Also hardened assignment-history integration typing path to explicitly guard JSON vs CSV response branch in tests.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`

### S1 post-closeout hardening slice - compliance-doc reason codes + remediation visibility

- Added deterministic compliance document reason-code evaluator in dashboard (`DOC_MISSING`, `DOC_PENDING_REVIEW`, `DOC_REJECTED`, `DOC_STALE`, `DOC_SOURCE_MISSING`) for autonomous preflight diagnostics.
- Wired evidence verification UI to show computed reason-code outcomes and remediation text per plot evidence set.
- Updated compliance mock scenario to include rejected/stale/missing-source cases so operators can validate remediation visibility in the UI flow.

Verification commands:

- `npm test -- lib/compliance-doc-reason-codes.test.ts components/compliance/evidence-requirement.test.tsx`

### S1 post-closeout hardening slice 2 - backend readiness parity for doc reason codes

- Extended backend readiness evaluation to emit deterministic compliance document reason codes in API output:
  - `DOC_MISSING`
  - `DOC_PENDING_REVIEW`
  - `DOC_REJECTED`
  - `DOC_STALE`
  - `DOC_SOURCE_MISSING`
- Added backend deduplication guard so repeated voucher-level signals are emitted once per code in readiness results.
- Added service unit coverage to lock blocker/warning behavior when voucher status/source/age trigger document reason-code paths.

Verification commands:

- `npm test -- src/harvest/harvest.service.spec.ts`

### S1 post-closeout hardening slice 3 - dashboard consumption of backend readiness reason codes

- Added dashboard proxy route for package readiness reads (`GET /api/harvest/packages/{id}/readiness`) with backend auth/header pass-through and fail-closed behavior when backend URL is unset.
- Added client hook to consume package readiness diagnostics from proxy route and map API reason codes into operator remediation text.
- Compliance page now renders backend readiness status plus reason-code diagnostics (`blocker`/`warning`) so UI reflects API preflight contract directly.

Verification commands:

- `npm test -- app/api/harvest/packages/[id]/readiness/route.test.ts app/compliance/page.test.tsx`

### S1 post-closeout hardening slice 4 - compliance sections consume backend package detail/readiness

- Added dashboard package-detail proxy route (`GET /api/harvest/packages/{id}`) with backend auth pass-through and fail-closed backend URL handling.
- Added package-detail hook and replaced static compliance checks/evidence rows with data derived from backend readiness + package voucher payloads.
- Compliance checks now map blocker/warning reason-code payloads directly; evidence cards now render from voucher-level package detail rows with fallback only when no package diagnostics are available.

Verification commands:

- `npm test -- "app/api/harvest/packages/[id]/route.test.ts" "app/compliance/page.test.tsx"`

### S1 post-closeout hardening slice 5 - typed evidence-documents contract for compliance cards

- Added backend typed read endpoint `GET /v1/harvest/packages/{id}/evidence-documents` (exporter-only, tenant fail-closed) to expose first-class evidence-document diagnostics for package compliance UX.
- Added dashboard proxy route + hook (`/api/harvest/packages/{id}/evidence-documents`, `usePackageEvidenceDocuments`) and switched compliance evidence cards to consume typed evidence-document records instead of inferring from voucher rows.
- Added backend/controller and dashboard route/page test coverage to lock role boundaries, forwarding semantics, and UI consumption parity of evidence-document diagnostics.

Verification commands:

- `npm test -- src/harvest/harvest.controller.spec.ts src/harvest/harvest.service.spec.ts`
- `npm test -- "app/api/harvest/packages/[id]/evidence-documents/route.test.ts" "app/compliance/page.test.tsx"`

### S1 post-closeout hardening slice 6 - OpenAPI publication for evidence-documents diagnostics

- Added OpenAPI path publication for `GET /v1/harvest/packages/{id}/evidence-documents` with explicit `operationId`, role/tenant denial semantics (`403`), and typed `200` response envelope.
- Added `DdsPackageEvidenceDocument` schema contract covering evidence identity, package/plot references, evidence type, review status, source, and capture timestamp/nullability.
- Added concrete `200` example payload so dashboard/backend contract consumers can validate field-level parity and onboarding expectations without reading implementation code.

Verification commands:

- `npm run openapi:lint`

### S1 post-closeout hardening slice 7 - backend Swagger decorator parity for evidence-documents

- Added `@ApiOkResponse` controller annotation on `GET /v1/harvest/packages/{id}/evidence-documents` so code-level Swagger metadata mirrors the published OpenAPI contract for typed evidence-document diagnostics.
- Locked annotation schema parity for evidence identity, package/plot references, evidence type, review status, source, and capture timestamp/nullability, including a concrete response example.
- This keeps backend decorator-generated API metadata aligned with docs-first contract expectations and reduces drift risk for future endpoint decorator edits.

Verification commands:

- `npx jest --runInBand --runTestsByPath src/harvest/harvest.controller.spec.ts`

### S1 post-closeout hardening slice 8 - shared DTO source for evidence-documents Swagger schema

- Added shared backend DTO `DdsPackageEvidenceDocumentDto` (plus enum types) as the canonical schema source for evidence-document response metadata.
- Refactored `HarvestController` evidence-documents `@ApiOkResponse` to reference DTO type (`type + isArray`) instead of duplicating inline schema literals.
- This centralizes schema shape and example metadata in one class, reducing decorator drift risk and improving maintainability for future contract updates.

Verification commands:

- `npx jest --runInBand --runTestsByPath src/harvest/harvest.controller.spec.ts`

### S1 post-closeout hardening slice 9 - service return-type parity with shared evidence-document DTO

- Refactored `HarvestService` evidence-document typing to reuse shared DTO contract (`DdsPackageEvidenceDocumentDto`) as the exported return type alias.
- Updated service mapping branch constants to use DTO enums (`DdsPackageEvidenceDocumentType`, `DdsPackageEvidenceDocumentReviewStatus`) instead of duplicated string literals.
- This extends single-source contract consistency from controller Swagger decorators into service return typings and mapping logic.

Verification commands:

- `npx jest --runInBand --runTestsByPath src/harvest/harvest.service.spec.ts -t "listDdsPackageEvidenceDocuments"`

### S1 post-closeout hardening slice 10 - automated OpenAPI/DTO enum parity guard

- Added governance script `openapi:governance:evidence-doc:parity:check` to assert `DdsPackageEvidenceDocument` enum fields in OpenAPI remain aligned with backend DTO enums (`DdsPackageEvidenceDocumentType`, `DdsPackageEvidenceDocumentReviewStatus`).
- Script parses both sources and fails closed when enum values drift, preventing silent contract divergence between docs and backend type definitions.
- This adds a lightweight machine check for the highest-risk dual-maintenance point while broader schema-generation unification remains out of scope.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 11 - CI enforcement for evidence-document enum parity gate

- Added contracts-workflow blocking step `Enforce evidence-document OpenAPI/DTO enum parity` in `.github/workflows/ci.yml`.
- CI now executes `npm run openapi:governance:evidence-doc:parity:check` before governance metrics publication so enum drift is rejected during PR validation, not only local runs.
- Updated OpenAPI governance script README command catalog and CI usage order to include the parity gate as part of the canonical contracts lane runbook.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`

### S1 post-closeout hardening slice 12 - expanded evidence-document contract parity assertions

- Upgraded `openapi:governance:evidence-doc:parity:check` from enum-only verification to schema-shape parity checks between backend DTO and OpenAPI `DdsPackageEvidenceDocument`.
- Checker now validates required field-set parity and field-level semantics (`type`, `format`, `nullable`, enum values) for each evidence-document property.
- Checker now also validates OpenAPI default response example-row parity (same keys as DTO + enum-valued fields restricted to DTO enums), closing a common documentation drift gap.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`

### S1 post-closeout hardening slice 13 - parser-backed evidence-document parity extraction

- Refactored `openapi:governance:evidence-doc:parity:check` to use parser-backed extraction instead of line-shape regex matching.
- DTO contract extraction now uses TypeScript AST parsing for enums + `@ApiProperty` metadata, and OpenAPI extraction now uses YAML parsing for schema/path/example lookup.
- This lowers false-positive fragility when formatting/indentation changes while preserving fail-closed contract drift detection for required fields, field semantics, and example parity.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`

### S1 post-closeout hardening slice 14 - fixture smoke harness for parity checker behavior

- Added fixture-based smoke harness `openapi:governance:evidence-doc:parity:smoke` with explicit pass/fail scenarios for evidence-document parity validation behavior.
- Added checker CLI path overrides (`--dto`, `--openapi`) so smoke fixtures can validate checker logic independently from live repository contract files.
- Wired smoke command into contracts CI lane and OpenAPI governance runbook order so checker regression coverage runs automatically on every contracts workflow execution.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`

### S1 post-closeout hardening slice 15 - multi-failure smoke matrix coverage

- Expanded evidence-doc parity smoke fixtures to include targeted failure classes beyond enum drift: required-field drift, nullable drift, and example-key drift.
- Updated smoke harness assertions so each failure fixture must emit the expected mismatch signal (`required fields`, `nullable`, or `example keys`) before the suite passes.
- This locks checker diagnostics across multiple contract-drift dimensions and reduces risk of false-green checker behavior when one failure class regresses.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:smoke`

### S1 post-closeout hardening slice 16 - format/null-example smoke coverage completion

- Extended evidence-doc parity smoke matrix with two additional targeted failure classes: field `format` drift and non-nullable example `null` drift.
- Added fixtures and assertions so smoke suite now validates expected mismatch signals for `packageId.format` and `packageId` non-nullable example enforcement.
- This closes coverage for all currently enforced parity dimensions (`enum`, `required`, `nullable`, `format`, example keys, and non-nullable example values) in the fixture-driven smoke envelope.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:smoke`

### S1 post-closeout hardening slice 17 - stable parity error-code contract

- Added stable machine-readable error codes to `openapi:governance:evidence-doc:parity:check` failure paths (for example `EVIDENCE_DOC_PARITY_SET_MISMATCH`, `EVIDENCE_DOC_PARITY_FIELD_MISMATCH`, `EVIDENCE_DOC_PARITY_EXAMPLE_NON_NULLABLE_NULL`).
- Updated smoke harness to assert coded failure markers instead of human-message fragments, reducing test brittleness when diagnostic wording changes.
- Updated governance README to document coded-output behavior as part of checker contract expectations.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`

### S1 post-closeout hardening slice 18 - optional JSON parity output contract

- Added optional `--json` mode to `openapi:governance:evidence-doc:parity:check` so machine consumers can read structured PASS/FAIL payloads without parsing human text.
- JSON FAIL payload now carries `status`, stable `code`, `message`, and structured `details`; JSON PASS payload now carries status plus check summary fields.
- Expanded smoke suite to validate JSON pass and JSON fail behavior in addition to text-mode scenarios, increasing confidence for automation integrations.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`

### S1 post-closeout hardening slice 19 - versioned JSON schema + contract assertion gate

- Added versioned schema `docs/openapi/evidence-doc-parity-report.schema.json` for `openapi:governance:evidence-doc:parity:check --json` output (PASS and FAIL envelopes).
- Added assertion script `openapi:governance:evidence-doc:parity:report:assert` to validate PASS/FAIL JSON payload shape and schema-version compatibility.
- Wired this JSON-contract assertion into contracts CI and governance runbook order so parity output drift fails early during contract validation.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`
- `npm run openapi:governance:evidence-doc:parity:report:assert`

### S1 post-closeout hardening slice 20 - CI artifact evidence for parity JSON contract

- Added contracts-lane payload snapshot step that captures evidence-doc parity `--json` PASS and fixture FAIL payloads into reviewable files.
- Added contracts-lane artifact upload `contracts-openapi-evidence-doc-parity-contract` containing PASS payload, FAIL payload, and schema source for run-level audit evidence.
- Updated governance runbook docs so parity JSON contract validation now explicitly includes artifact-level traceability for reviewer workflows.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`
- `npm run openapi:governance:evidence-doc:parity:report:assert`

### S1 post-closeout hardening slice 21 - CI summary visibility for parity JSON contract

- Added contracts-lane summary publisher that appends an `Evidence-Doc Parity JSON Contract` block to `GITHUB_STEP_SUMMARY`.
- Summary now surfaces parity JSON quick-triage facts (`PASS/FAIL status`, `schemaVersion`, and fixture FAIL `code`) plus artifact reference link.
- This reduces reviewer friction by exposing parity contract evidence signals directly in CI summary without requiring artifact download as first step.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:check`
- `npm run openapi:governance:evidence-doc:parity:smoke`
- `npm run openapi:governance:evidence-doc:parity:report:assert`

### S1 post-closeout hardening slice 22 - parity JSON mini-metrics artifact lane

- Added generator `openapi:governance:evidence-doc:parity:metrics:generate` to emit `openapi-evidence-doc-parity-metrics.json` from parity PASS/FAIL JSON snapshots.
- Contracts CI now runs this metrics generator and uploads dedicated artifact `contracts-openapi-evidence-doc-parity-metrics` for lightweight trend ingestion.
- Metrics payload captures parity schema version, fail code, key check counters, and CI run metadata, complementing full payload artifacts with compact observability data.

Verification commands:

- `npm run openapi:governance:evidence-doc:parity:metrics:generate`
- `npm run openapi:governance:evidence-doc:parity:report:assert`
- `npm run openapi:governance:evidence-doc:parity:smoke`

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

- [x] Provider/protocol choices finalized where needed for FEAT-004 S1 scope (no new external provider/protocol dependency introduced in readiness evaluation slices).

## Status

Done (TB-V16-004 / FEAT-004)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
