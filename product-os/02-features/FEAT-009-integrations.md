# Integrations

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for integrations aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Public API, webhooks, and first integration adapters.

## V2 parallel delivery lane (not integrated into V1 runtime)

- V2 planning/implementation track is approved to run in parallel as a shadow lane.
- Execution pack: `product-os/01-roadmap/coolfarm-sai-v2-parallel-execution-pack.md`.
- V1 safety boundary:
  - no production-path Cool Farm calls in current V1 flow
  - all V2 writes/reads in isolated integration tables
  - feature-flag off by default with tenant-scoped pilot enablement only.
- V2 acceptance gate minimums:
  - explicit permissions
  - canonical state transitions with immutable audit events
  - deterministic exception handling/recovery
  - analytics event coverage for submit/validate/score lifecycle.

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

Scope: integrations execution matrix bootstrap for tenant-safe public API, webhook delivery, and adapter interoperability surfaces.

### Permission and tenant boundary matrix

- **Exporter role:** can configure and operate tenant-owned outbound integrations (webhook subscriptions, credentialed adapters) within explicit tenant scope.
- **Agent role:** can consume integration-driven operational data where assigned by exporter policy but cannot modify integration endpoint/credential configuration.
- **Farmer role:** can trigger only farmer-scoped integration side effects exposed by canonical field workflows; no tenant-level integration administration access.
- **Missing tenant claim:** all integration API/webhook management paths fail closed before any endpoint secrets, payload snapshots, or delivery metadata are returned.

### State transition matrix

- `integration_registration_requested -> integration_registered` when endpoint + auth material pass policy and connectivity validation.
- `integration_registered -> integration_delivery_pending` when outbound event is queued for adapter/webhook dispatch.
- `integration_delivery_pending -> integration_delivery_succeeded` when remote ack/2xx confirmation is recorded with immutable delivery evidence.
- `integration_delivery_pending -> integration_delivery_retryable_failed` when transient transport/provider failure occurs and bounded retry policy schedules next attempt.
- `integration_delivery_retryable_failed -> integration_delivery_succeeded|integration_delivery_terminal_failed` based on retry outcome and max-attempt policy.

### Exception handling and recovery

- Invalid integration configs (missing auth, malformed URL, unsupported protocol mode) return deterministic validation errors without persisting partial credentials.
- Tenant/role authorization failures return explicit deny semantics and never leak cross-tenant endpoint metadata, payload previews, or secret handles.
- Delivery failures persist immutable attempt evidence with retry/terminal classification and deterministic idempotency keys for replay-safe re-dispatch.
- Adapter/provider outages degrade to queued/retryable state with bounded exponential retry and operator-visible recovery cues.

### Analytics/event coverage

- Integration lifecycle analytics baseline includes:
  - integration registration requested / succeeded / failed
  - delivery attempt queued / succeeded / retryable_failed / terminal_failed
  - replay requested / replay_succeeded / replay_failed
- Event payload baseline: tenantId, integration key/type, actor role/id, event family, idempotency key, delivery attempt count, latency/error class, timestamp.

### Acceptance mapping (v1)

- Integration management and delivery evidence remain tenant-scoped and role-constrained for all register/update/replay paths.
- Repeated delivery submissions preserve idempotent behavior (same idempotency key, no duplicate terminal side effects).
- Retry and terminal failure semantics remain deterministic and auditable with explicit operator recovery context.
- Integration surfaces provide sufficient immutable delivery evidence for compliance handoff and investigation workflows.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** integration payloads carrying plot/area data must consume canonical `GEOGRAPHY`-validated upstream fields only (no adapter-side geometry recomputation).
- **Offline conflict integrity:** integration event ordering must follow persisted audit/HLC metadata, never unsynchronized client wall-clock fields.
- **Lineage performance:** integration payload enrichment requiring lineage must consume materialized lineage fields (O(1) runtime lookup) and avoid recursive traversals.
- **TRACES chunking resilience:** adapter/webhook contracts must tolerate chunked filing payloads and preserve reference reconciliation across retries/replays.
- **GDPR shredding safety:** delivery evidence must preserve immutable reference identifiers while preventing rehydration of shredded personal attributes.

## Execution slices

### S1 post-closeout hardening slice 30 - Cool Farm + SAI V2 schema bootstrap API (shadow mode)

- Added a new tenant-safe V2 schema bootstrap endpoint:
  - `GET /v1/integrations/coolfarm-sai/v2/questionnaire-schema?pathway=annuals|rice`
- Added versioned canonical schema builder artifact:
  - `coolfarm-sai-v2.schema.ts` with `farmQuestionnaireV1` (`0.1.0-draft`) contract
  - initial pathway coverage for `annuals` and `rice`
  - canonical transition model: `draft -> submitted -> validated -> scored -> reviewed`
  - data-quality baseline: `actual|estimated|defaulted`
- Enforced tenant and role boundaries:
  - missing tenant claim fails closed
  - allowed roles: `exporter`, `agent`, `admin`, `compliance_manager`
- Explicitly marked rollout mode in response payload:
  - feature flag key: `coolfarm_sai_v2_enabled`
  - default state: `off`
  - mode: `shadow`
- Added focused controller unit coverage for deny/allow and pathway behavior.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 31 - V2 mapping registry + required-field coverage validator

- Extended V2 schema endpoint payload to include mapping registry:
  - `mappingRegistry.mappingId = farmQuestionnaireMappingV1`
  - `mappingRegistry.mappingVersion = 0.1.0-draft`
  - pathway-specific mapping set (`annuals|rice`)
- Implemented explicit field-level mapping contract:
  - `sectionId + fieldId -> coolfarmPath + saiIndicators[]`
  - includes pathway-specific `rice` paddy mapping.
- Added fail-fast mapping coverage guard:
  - validates every required questionnaire field has a mapping entry
  - throws deterministic error if required-field mapping drift appears.
- Added regression assertions:
  - annuals response includes non-empty mapping registry
  - rice response includes `paddy_management.paddy_water_regime` mapping row.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 32 - V2 isolated persistence + draft save API

- Added V2 isolated SQL persistence baseline:
  - `tracebud-backend/sql/tb_v16_013_coolfarm_sai_v2_questionnaire.sql`
  - tables: `integration_questionnaire_v2`, `integration_runs_v2`, `integration_evidence_v2`, `integration_audit_v2`
  - tenant-scoped indexes and constrained status/run-type enums.
- Added tenant-safe draft save endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts`
  - requires signed tenant claim + role gate (`exporter|agent|admin|compliance_manager`)
  - requires `idempotencyKey`; validates `response`/`metadata` object shape
  - upserts by `(tenant_id, idempotency_key)` for deterministic replay-safe draft writes.
- Added V2 audit write-path:
  - inserts `integration_v2_questionnaire_draft_saved` into `integration_audit_v2`
  - includes schema + mapping version metadata for evidence lineage.
- Added deterministic migration-not-applied handling:
  - returns explicit error guidance when V2 tables are missing (`TB-V16-013` not applied).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 33 - V2 submit transition + validation run lifecycle

- Added V2 submit transition endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/submit`
- Enforced canonical transition guard:
  - allowed: `draft -> submitted`
  - invalid transitions return deterministic `Invalid transition` validation errors.
- Added run lifecycle persistence in `integration_runs_v2`:
  - on submit: insert `validation` run with `status=started`
  - then finalize same run with `status=completed` + `finished_at`.
- Added immutable submit audit evidence:
  - `integration_v2_questionnaire_submitted` event in `integration_audit_v2`
  - payload includes `draftId` and `runId` for trace lineage.
- Preserved migration fail-closed behavior for missing V2 tables (`TB-V16-013` guidance).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 34 - V2 run failure semantics + run-history read surface

- Added explicit V2 run execution endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/runs`
  - supports `runType=validation|scoring` and deterministic completion/failure outcomes.
- Added explicit failed-run path:
  - run rows are now finalized as either `completed` or `failed` in `integration_runs_v2`
  - failure reason can be captured in run details (`reason`).
- Added tenant-safe run-history read endpoint:
  - `GET /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/runs`
  - returns questionnaire-scoped run history ordered by latest run.
- Added immutable run outcome audit events:
  - `integration_v2_run_completed`
  - `integration_v2_run_failed`
- Preserved migration fail-closed guidance when V2 tables are unavailable.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 35 - V2 queue metadata + run summary diagnostics

- Added queue/worker-ready run metadata migration:
  - `tracebud-backend/sql/tb_v16_014_coolfarm_sai_v2_run_queue_metadata.sql`
  - `queued_at`, `attempt_count`, `error_code` on `integration_runs_v2`
  - tenant/status diagnostics index for run monitoring.
- Updated run execution persistence to populate queue metadata:
  - sets `queued_at` and `attempt_count` at run creation
  - records `error_code` (`V2_SHADOW_RUN_FAILED`) on failed runs.
- Extended run history response payload:
  - includes `queued_at`, `attempt_count`, `error_code` fields.
- Added compact run summary endpoint:
  - `GET /v1/integrations/coolfarm-sai/v2/runs/summary`
  - returns tenant-scoped aggregate counts (`started|completed|failed`) and latest run pointer.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 36 - V2 retry lifecycle endpoint

- Added failed-run retry endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/retry`
  - only failed runs are eligible for retry.
- Retry lifecycle behavior:
  - increments `attempt_count`
  - sets `status=started` and refreshes `queued_at`
  - re-finalizes to `completed|failed`
  - clears/sets `error_code` based on retry outcome.
- Added immutable retry lineage events:
  - `integration_v2_run_retry_completed`
  - `integration_v2_run_retry_failed`
- Added guardrails:
  - deterministic error if run missing or not failed
  - tenant/role fail-closed and migration availability checks.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 37 - V2 retry backoff + retry exhaustion guardrail

- Added retry backoff metadata migration:
  - `tracebud-backend/sql/tb_v16_015_coolfarm_sai_v2_retry_backoff.sql`
  - `next_retry_at` column + tenant retry scheduling index.
- Added retry cap policy:
  - max retry attempts set to `5`
  - retries beyond cap are rejected with deterministic error.
- Added retry scheduling semantics:
  - exponential backoff in minutes (`2^(attempt-1)`, capped at `60`)
  - `next_retry_at` now updated on failed retry outcomes.
- Added retry exhaustion evidence event:
  - `integration_v2_run_retry_exhausted` when retry cap is reached.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 38 - V2 retry queue scan endpoint

- Added retry queue scan endpoint:
  - `GET /v1/integrations/coolfarm-sai/v2/runs/retry-queue?limit=...`
- Queue semantics:
  - returns tenant-scoped runs where `status='failed'` and `next_retry_at <= NOW()`
  - ordered by earliest due retry time.
- Added query guardrails:
  - default `limit=50`
  - bounded `limit` validation (`1..200`).
- Added focused tests:
  - due queue read path
  - invalid limit rejection path.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 39 - V2 run claim locking endpoint

- Added claim-lock schema migration:
  - `tracebud-backend/sql/tb_v16_016_coolfarm_sai_v2_run_claim_lock.sql`
  - fields: `claimed_by_user_id`, `claimed_at`
  - tenant claim index for operator diagnostics.
- Added run claim endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/claim`
  - claimable only when run is tenant-scoped, failed, due (`next_retry_at <= now`), and unclaimed.
- Updated retry queue behavior:
  - queue now excludes already claimed runs (`claimed_at IS NULL`).
- Added immutable claim telemetry:
  - event: `integration_v2_run_claimed`.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 40 - V2 claim release endpoint

- Added claimed-run release endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/{runId}/release`
- Release semantics:
  - standard release allowed for claiming actor
  - forced release supported (`force=true`) for stale/orphaned claims.
- Added safety guards:
  - rejects release for unclaimed runs
  - rejects non-owner release unless forced.
- Added immutable release audit event:
  - `integration_v2_run_released` with forced/reason metadata.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 41 - V2 stale-claim sweeper + summary stale counter

- Added stale-claim sweeper endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale`
  - supports `staleMinutes` threshold + `limit` scan cap.
- Sweeper behavior:
  - selects claimed runs older than threshold
  - bulk releases claims
  - emits per-run stale release telemetry (`integration_v2_run_stale_released`).
- Added stale claim visibility in run summary:
  - `GET /v1/integrations/coolfarm-sai/v2/runs/summary`
  - now returns `staleClaimCount` metric.
- Added tests:
  - stale release positive path
  - stale release no-op path
  - summary includes stale count.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 42 - V2 scheduled sweeper contract + last-run summary metadata

- Added cron-compatible sweeper trigger contract:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale`
  - new `triggerSource` input (`manual|scheduled`).
- Added sweeper execution summary event:
  - `integration_v2_stale_sweeper_executed`
  - emitted for both no-op and release paths.
- Extended run summary diagnostics:
  - `GET /v1/integrations/coolfarm-sai/v2/runs/summary`
  - now includes `lastSweeperRun` (timestamp + payload context).
- Added tests:
  - summary includes `lastSweeperRun`
  - stale sweeper supports scheduled trigger source.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 43 - Scheduler trigger endpoint + summary rollup fields

- Added scheduler-friendly trigger endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger`
  - wrapper over stale sweeper with fixed `triggerSource=scheduled`.
- Added compact summary rollup fields:
  - `lastSweeperReleasedCount`
  - `lastSweeperTriggerSource`
  - derived from latest sweeper execution payload.
- Added regression tests:
  - summary includes new rollup fields
  - scheduler trigger wrapper returns expected contract (`schedulerContract=true`).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 44 - Scheduler token auth contract

- Added scheduler token auth guard for trigger endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger`
  - requires header `x-tracebud-scheduler-token`.
- Added backend env contract:
  - `COOLFARM_SAI_V2_SCHEDULER_TOKEN` (required for scheduler trigger path).
- Failure semantics:
  - missing env token -> deterministic bad request
  - invalid/missing request token -> forbidden.
- Added tests:
  - success with valid token
  - missing env token rejection
  - invalid token rejection.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.spec.ts`

### S1 post-closeout hardening slice 45 - DB-backed scheduler wrapper integration coverage

- Added DB-backed integration spec:
  - `src/integrations/coolfarm-sai-v2.controller.int.spec.ts`
- Coverage now includes real-schema scheduler wrapper behavior:
  - missing scheduler token env fail-closed
  - invalid scheduler header token forbidden
  - valid scheduler token executes sweeper and persists rollup event payload.
- Scheduler token-version payload is asserted at DB read level in `integration_audit_v2`.

Verification commands:

- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/coolfarm-sai-v2.controller.int.spec.ts`

### S1 code slice 1 - integrations execution matrix bootstrap

- Documented FEAT-009 S1 execution matrix for permissions, transition states, exception recovery, analytics baseline, acceptance mapping, and v1.6 architecture constraints.
- Established implementation-ready baseline for next FEAT-009 slices (integration contract shaping, delivery telemetry, and adapter safety hardening).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - tenant-safe webhook contract baseline + delivery evidence telemetry

- Implemented backend integrations contract baseline with tenant-safe webhook management endpoints:
  - `POST /v1/webhooks` (exporter-only registration)
  - `GET /v1/webhooks` (exporter/agent tenant-scoped listing)
  - `GET /v1/webhooks/{id}/deliveries` (exporter/agent tenant-scoped immutable delivery evidence view)
- Enforced role and tenant guardrails:
  - missing tenant claim fail-closed on all webhook operations
  - webhook registration restricted to exporter role
  - list/delivery inspection restricted to exporter or agent roles
- Added immutable telemetry evidence events in audit log as baseline integration delivery trace:
  - `integration_webhook_registered`
  - `integration_delivery_attempt_queued`
  - `integration_delivery_succeeded`
  - plus read support for retry/terminal failure evidence event families
- Added unit + DB-backed integration assertions for tenant/role policy and tenant-scoped delivery evidence filtering.
- Updated OpenAPI contracts for webhook list/register/deliveries endpoints with query pagination parameters and explicit policy-failure semantics.

### S1 code slice 3 - dashboard webhook diagnostics proxy + operator evidence surface

- Extended dashboard analytics proxy to route integration diagnostics queries:
  - `eventKind=webhooks` -> `GET /v1/webhooks`
  - `eventKind=webhook_deliveries&webhookId=...` -> `GET /v1/webhooks/{id}/deliveries`
  - added fail-closed validation for missing `webhookId` on delivery evidence reads.
- Added dashboard hook contracts for integration diagnostics:
  - `useWebhookRegistrationEvents` for tenant-scoped webhook registration evidence
  - `useWebhookDeliveryEvents` for selected webhook immutable delivery lifecycle evidence
- Added admin diagnostics UI sections:
  - **Integration Webhook Registrations** table with pagination and click-to-select webhook context
  - **Webhook Delivery Evidence** table with queued/succeeded/retryable/terminal phase visibility and selected-webhook scoped pagination
- Updated dashboard route tests to verify webhook and delivery evidence proxy forwarding behavior and missing-`webhookId` request rejection.
- Preserved readiness guardrail model by keeping this evidence surface read-only (no export action exposed until dedicated export contract exists).

### S1 code slice 4 - closeout acceptance reconciliation

- Reconciled S1 acceptance mapping against implemented integrations behavior:
  - tenant/role-safe integration registration and evidence reads are enforced across backend + dashboard proxy paths
  - webhook registration + delivery evidence telemetry is immutable and deterministically queryable by tenant scope
  - fail-closed behavior is explicitly covered for missing tenant claim and missing `webhookId` delivery requests
  - operator diagnostics handoff baseline is in place via registration/delivery evidence tables and pagination-safe inspection
- Closed S1 open question for this feature scope:
  - provider/protocol remains internal API + audit-log-backed webhook evidence path for FEAT-009 S1; no external integration provider dependency is required for this slice.
- Marked feature status as done for current roadmap scope.

### S1 post-closeout hardening slice 5 - backend EUDR connectivity check (server-side secret path)

- Added authenticated backend connectivity endpoint `GET /v1/integrations/eudr/echo` for exporter/agent roles with mandatory signed tenant claim enforcement.
- Added server-side EUDR credential handling for runtime env contract:
  - reads `EUDR_API_KEY` (required), `EUDR_API_VERSION` (default `2`), and `EUDR_BASE_URL` (default `https://www.eudr-api.eu`)
  - does not expose key material in responses.
- Added deterministic exception handling and recovery semantics:
  - explicit `400` when `EUDR_API_KEY` is missing
  - bounded external request timeout (`10s`) with `502` timeout/transport failure mapping
  - non-2xx provider responses mapped to `502` with capped upstream error context.
- Added immutable analytics evidence for connectivity attempts in audit log:
  - event: `integration_eudr_echo_checked`
  - payload baseline: tenant, actor, phase, provider endpoint, status code, latency, timestamp.
- Added unit coverage for tenant/role policy boundaries, missing-env fail-closed behavior, success path headers/response, and upstream failure mapping.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`

### S1 post-closeout hardening slice 6 - first real DDS write operation (tenant-safe submission path)

- Added first EUDR DDS write operation in backend integrations surface:
  - `POST /v1/integrations/eudr/dds`
  - forwards server-side to EUDR endpoint `/api/eudr/dds` using backend-managed `EUDR_API_*` env vars.
- Enforced role and tenant guardrails on write path:
  - signed tenant claim required (fail-closed)
  - exporter-only submit permission (`Only exporters can submit EUDR DDS payloads`).
- Enforced deterministic request and recovery semantics:
  - required `statement` object and `idempotencyKey`
  - bounded timeout (`10s`) and upstream failure mapping to `502`
  - preserves fail-closed behavior for missing runtime credentials (`EUDR_API_KEY`).
- Added immutable audit telemetry for DDS submission attempts:
  - event: `integration_eudr_dds_submitted`
  - payload includes tenant, actor, phase, endpoint, idempotency key, status code, latency, and timestamp.
- Added unit coverage for policy, validation, success, and failure mapping:
  - non-exporter deny
  - missing idempotency key deny
  - successful submit with header/body forwarding assertions
  - non-2xx upstream mapping to `BadGatewayException`.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`

### S1 post-closeout hardening slice 7 - dashboard proxy for EUDR DDS submit

- Added dashboard server route proxy for DDS submit path:
  - `POST /api/integrations/eudr/dds` -> backend `POST /v1/integrations/eudr/dds`
- Enforced fail-closed and payload guardrails at dashboard boundary:
  - `statement` object required
  - `idempotencyKey` required
  - explicit `503` when `TRACEBUD_BACKEND_URL` is not configured.
- Preserved auth and payload pass-through semantics:
  - forwards `Authorization` header to backend
  - forwards JSON body with `statement` and `idempotencyKey`.
- Added route tests for validation, fail-closed backend-url behavior, and successful proxy forwarding.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/api/integrations/eudr/dds/route.test.ts`

### S1 post-closeout hardening slice 8 - admin UI operator trigger for DDS submit

- Added an admin diagnostics operator card for EUDR DDS submission in `app/admin/page.tsx`:
  - inline idempotency key input
  - editable statement JSON payload textarea
  - `Submit DDS` action button wired to dashboard proxy endpoint.
- Implemented client-side guardrails before submit:
  - valid JSON object required for statement payload
  - non-empty idempotency key required
  - loading-state lock to prevent duplicate concurrent submissions.
- Integrated operator feedback and recovery cues:
  - success toast with backend status
  - error toasts for validation/proxy/backend failures
  - idempotency key auto-refresh after successful submit
  - filing diagnostics refresh trigger (`reloadFiling`) after submit.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/api/integrations/eudr/dds/route.test.ts`

### S1 post-closeout hardening slice 9 - admin sample DDS payload helper

- Added one-click operator helper in admin diagnostics DDS card:
  - `Load sample JSON` action now pre-populates a baseline DDS payload scaffold and refreshes idempotency key.
- Preserved operator safety semantics:
  - sample-load action is disabled during in-flight submit to avoid payload state races
  - existing submit validation and toast feedback flows remain unchanged.
- Improved operator ergonomics for first-run testing:
  - reduces manual JSON authoring friction before invoking `/api/integrations/eudr/dds`.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 10 - admin multi-preset DDS sample selector

- Extended admin DDS sample helper to support multiple operator presets:
  - `import`
  - `export`
  - `domestic_production`
- Added preset selector beside `Load sample JSON` action so operators can choose scenario before payload prefill.
- Preserved submit-safety behavior:
  - selector and loader are disabled while submit is in-flight
  - loader continues to refresh idempotency key on each sample load.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 11 - admin DDS copy-json helper

- Added operator-side `Copy JSON` action in DDS submit card to copy current statement payload to clipboard.
- Added deterministic operator feedback:
  - success toast on clipboard write
  - failure toast when clipboard access is unavailable/denied.
- Kept submit-safety behavior:
  - copy action is disabled while submit request is in-flight.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 12 - admin DDS pre-submit shape validation

- Added lightweight client-side shape checks before DDS submit in admin operator card:
  - required `declarationType`
  - required `referenceNumber`
  - required `operator.name`
  - required `product.commodity`
- Preserved existing JSON parse guardrails while improving early operator feedback:
  - malformed or incomplete payloads now fail fast with targeted toast messages before proxy call.
- Kept backend as source-of-truth validation; this slice adds UX-level preflight checks only.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 13 - admin schema-driven DDS preflight validation

- Replaced ad-hoc required-field checks with schema-driven client preflight validation in admin DDS submit flow.
- Added a lightweight in-file JSON schema + validator supporting nested object requirements and typed value checks.
- Validation now fails fast with path-specific errors (for example `statement.operator.name is required.`), reducing ambiguous operator feedback.
- Kept backend validation authoritative; this slice improves UI-side validation maintainability and consistency.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 14 - shared DDS validation utility across UI + proxy

- Extracted DDS schema and validator into shared module:
  - `apps/dashboard-product/lib/eudr-dds-validation.ts`
- Reused shared validator in:
  - admin submit UI preflight (`app/admin/page.tsx`)
  - dashboard DDS proxy route (`app/api/integrations/eudr/dds/route.ts`)
- Added focused validator tests:
  - `apps/dashboard-product/lib/eudr-dds-validation.test.ts`
  - covers valid minimal payload and nested required-field error path behavior.
- Updated route tests to align with schema-backed statement requirements while preserving existing fail-closed and forwarding semantics.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/api/integrations/eudr/dds/route.test.ts lib/eudr-dds-validation.test.ts`
- `ReadLints(apps/dashboard-product/{app/admin/page.tsx,app/api/integrations/eudr/dds/route.ts,lib/eudr-dds-validation.ts}) -> no errors`

### S1 post-closeout hardening slice 15 - backend DDS status read operation

- Added second real EUDR operation in backend integrations surface:
  - `GET /v1/integrations/eudr/dds/status?referenceNumber=...`
  - forwards to provider path `GET /api/eudr/dds?referenceNumber=...`.
- Enforced same policy and safety guardrails as submit/connectivity paths:
  - signed tenant claim required
  - exporter/agent read permission (`Only exporters or agents can read EUDR DDS status`)
  - required `referenceNumber`
  - timeout + non-2xx upstream mapping to `502`.
- Added immutable audit telemetry for status checks:
  - event: `integration_eudr_dds_status_checked`
  - payload baseline: tenant, actor, phase, endpoint, reference number, status code, latency, timestamp.
- Added unit coverage for role deny, missing-reference validation, success read + payload parse, and upstream-failure mapping.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/eudr.controller.spec.ts src/integrations/integrations.controller.spec.ts`

### Contract lock note (Tracebud OpenAPI surface)

- Tracebud internal EUDR integration contract is now published in `docs/openapi/tracebud-v1-draft.yaml` for the implemented endpoints:
  - `GET /v1/integrations/eudr/echo`
  - `POST /v1/integrations/eudr/dds`
  - `GET /v1/integrations/eudr/dds/status`
- Governance checks for this publication are green (`openapi:lint`, `openapi:governance:policy:validate`, `openapi:governance:check`).

### S1 post-closeout hardening slice 16 - dashboard DDS status proxy + admin status trigger

- Added dashboard status proxy route:
  - `GET /api/integrations/eudr/dds/status?referenceNumber=...`
  - forwards to backend `GET /v1/integrations/eudr/dds/status?referenceNumber=...`
  - preserves auth header pass-through and fail-closed backend-url behavior.
- Added route tests for status proxy behavior:
  - missing `referenceNumber` -> `400`
  - missing `TRACEBUD_BACKEND_URL` -> `503`
  - successful forwarding with Authorization header.
- Added admin operator trigger card for status reads:
  - `EUDR DDS Status Read (Operator Trigger)`
  - reference number input + `Check Status` action
  - loading state and success/error toast feedback.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/api/integrations/eudr/dds/route.test.ts app/api/integrations/eudr/dds/status/route.test.ts lib/eudr-dds-validation.test.ts`
- `ReadLints(apps/dashboard-product/{app/admin/page.tsx,app/api/integrations/eudr/dds/status/route.ts}) -> no errors`

### S1 post-closeout hardening slice 17 - admin DDS status result detail panel

- Added operator-facing status result panel in admin status trigger card:
  - persists last successful status read response
  - displays reference number, HTTP status code, and checked timestamp
  - renders provider payload excerpt as formatted JSON in scrollable panel.
- Added failure-state handling:
  - clears stale result panel when status read fails to avoid misleading diagnostics context.
- Improves operator troubleshooting without requiring network console inspection.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 18 - admin status payload copy/download actions

- Extended DDS status result panel with operator handoff actions:
  - `Copy payload` (clipboard)
  - `Download JSON` (file export)
- Added success/failure toast feedback for clipboard/download flows.
- Keeps operator workflow self-contained for incident handoff without browser devtools.

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 19 - status payload redaction for display/export

- Added lightweight recursive redaction pass for likely sensitive payload keys before operator exposure.
- Redaction now applies consistently to:
  - in-panel JSON display
  - `Copy payload` clipboard output
  - `Download JSON` file export.
- Redacted key classes include likely identifiers/secrets (`name`, `email`, `phone`, `address`, `token`, `secret`, `password`, API key aliases, identifier variants).

Verification commands:

- `ReadLints(apps/dashboard-product/app/admin/page.tsx) -> no errors`

### S1 post-closeout hardening slice 20 - shared payload redaction utility + tests

- Extracted payload redaction logic into shared utility:
  - `apps/dashboard-product/lib/payload-redaction.ts`
- Updated admin status panel to consume shared redaction module instead of in-file duplicate logic.
- Added dedicated unit coverage:
  - `apps/dashboard-product/lib/payload-redaction.test.ts`
  - verifies recursive sensitive-key masking and non-sensitive value pass-through.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/payload-redaction.test.ts app/api/integrations/eudr/dds/status/route.test.ts lib/eudr-dds-validation.test.ts`
- `ReadLints(apps/dashboard-product/{app/admin/page.tsx,lib/payload-redaction.ts}) -> no errors`

### S1 post-closeout hardening slice 21 - deterministic DDS idempotency replay handling

- Hardened backend DDS submit semantics for idempotent duplicate submissions:
  - provider `409` duplicate responses are now treated as deterministic replay success instead of terminal failure.
- Updated DDS submit telemetry parity:
  - audit event `integration_eudr_dds_submitted` now records replay-aware phase (`replayed`) and explicit `replayed` boolean.
  - telemetry `ok` now aligns with replay-safe success (`ok=true` for `200` and replay `409` outcomes).
- Extended DDS submit response contract:
  - backend response now includes `replayed` to make replay outcomes explicit for operator and dashboard consumers.
- Added focused backend unit coverage:
  - validates `409` replay path returns success with `replayed=true`
  - validates audit payload parity (`phase=replayed`, `replayed=true`).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/eudr.controller.spec.ts`

### S1 post-closeout hardening slice 22 - replay-aware dashboard submit messaging + proxy contract pass-through

- Extended dashboard admin DDS submit flow to surface replay-aware operator messaging:
  - when backend returns `replayed=true`, success toast now explicitly confirms replay acknowledgement and no duplicate side effects.
- Extended dashboard DDS proxy contract test coverage:
  - route now has explicit pass-through assertion for replay payload shape (`statusCode: 409`, `replayed: true`, same idempotency key).
- Preserved existing fail-closed and auth/header forwarding semantics.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/api/integrations/eudr/dds/route.test.ts`

### S1 post-closeout hardening slice 23 - replay-message regression helper tests

- Extracted DDS submit success-message branching into shared helper:
  - `apps/dashboard-product/lib/eudr-dds-submit-feedback.ts`
- Admin DDS submit flow now uses shared helper for replay/non-replay success toasts, reducing inline branch drift risk.
- Added focused regression tests for replay wording and default-status behavior:
  - `apps/dashboard-product/lib/eudr-dds-submit-feedback.test.ts`
- Keeps proxy replay pass-through coverage intact while adding dedicated message-branch unit checks.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-submit-feedback.test.ts app/api/integrations/eudr/dds/route.test.ts`

### S1 post-closeout hardening slice 24 - deterministic malformed-status-payload handling

- Hardened backend DDS status read behavior for malformed provider payloads:
  - successful non-empty status responses now require valid JSON payload format
  - malformed payloads are mapped to deterministic `BadGatewayException` message (`EUDR DDS status response was not valid JSON`).
- Added focused backend unit coverage for malformed JSON status body handling while preserving existing success/failure paths.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/eudr.controller.spec.ts`

### S1 post-closeout hardening slice 25 - malformed-status operator guidance messaging

- Added dashboard operator-facing status-error guidance mapping helper:
  - `apps/dashboard-product/lib/eudr-dds-status-feedback.ts`
- Admin status-read flow now maps malformed provider payload failures to explicit operator guidance message:
  - `EUDR returned malformed status payload. Retry the check or escalate to integration support.`
- Added focused utility tests for mapped/non-mapped/default status-read error messaging.
- Extended status proxy route coverage to assert backend non-2xx malformed-payload error pass-through contract.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 26 - status retry/escalation hint block

- Extended admin DDS status-read UX with compact retry/escalation hint block shown for malformed provider payload failures.
- Added helper predicate export (`isMalformedEudrDdsStatusPayloadError`) to drive deterministic hint branching in UI.
- Status read flow now:
  - clears hint on successful checks
  - shows retry/escalation guidance only for mapped malformed-payload errors.
- Expanded status-feedback utility tests to cover malformed-error predicate behavior.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 27 - status last-error badge and timestamp context

- Added persistent admin DDS status-read error context state (`message`, `occurredAt`, `referenceNumber`) for operator handoff continuity.
- Status read flow now records the mapped toast error into last-error state on failures and clears it after successful checks.
- DDS status panel now renders compact inline last-error badge with timestamp and reference number for quick triage context.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 28 - status error-context clipboard export

- Added one-click `Copy error context` action to DDS status panel when last-error context is present.
- Clipboard payload now includes mapped error message, occurrence timestamp, and reference number for support/escalation handoff.
- Added success/failure toast feedback for error-context copy action to keep operator flow deterministic.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 29 - status error-context JSON download export

- Added one-click `Download error JSON` action to DDS status last-error panel for attachment-ready support packets.
- Downloaded JSON artifact includes mapped error message, occurrence timestamp, and reference number (same normalized payload as clipboard export).
- Added operator success toast feedback after download completion to confirm artifact capture.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 30 - status export destination helper note

- Added compact inline helper note in DDS status last-error panel clarifying that browser exports are saved to the default Downloads folder.
- Keeps error-context export flow self-explanatory during escalations without changing payload shape or API behavior.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 31 - status error-export filename preview

- Added deterministic filename preview text in DDS status last-error panel for download traceability (`eudr-dds-status-error-<reference>-<timestamp>.json`).
- Keeps operator escalation prep faster by showing expected artifact naming before download.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 32 - status error-export copy filename action

- Added compact `Copy filename` action beside suggested error-export filename preview in DDS status last-error panel.
- Clipboard export now supports filename-only copy flow for escalation templates that require prefilled artifact naming.
- Added deterministic success/failure toast feedback for filename copy action.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 34 - status filename timestamp placeholder clarification

- Added tiny inline clarification in DDS status last-error panel that `<timestamp>` in suggested filename is resolved at download time.
- Reduces operator ambiguity when pre-filling escalation templates with filename previews.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 35 - status error-export filename builder de-duplication

- Added shared local filename builder in admin DDS status panel and reused it for both filename preview and download action.
- Removes filename-shape drift risk between preview text and actual downloaded artifact naming.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 36 - status error-context utility extraction

- Extracted DDS status error-context helpers to shared utility (`lib/eudr-dds-status-error-context.ts`) for filename generation and normalized payload serialization.
- Updated admin status panel to consume shared utility for preview, download filename, and context serialization.
- Added dedicated utility tests to lock helper behavior and reduce future admin-page drift risk.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 37 - status filename timestamp-token constant alignment

- Added shared timestamp placeholder constant (`EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN`) in DDS status error-context utility.
- Updated admin status panel to consume the same token constant for filename preview and explanatory note text.
- Expanded utility tests to lock the timestamp-token constant and prevent copy drift.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 38 - status error-export accessibility labels

- Added explicit `aria-label` attributes for DDS status error-export action controls (`Copy error context`, `Download error JSON`, `Copy filename`).
- Improves assistive-technology clarity in the last-error export helper cluster without altering existing behavior.

Verification commands:

- `cd apps/dashboard-product && npm test -- lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 39 - admin interaction coverage for status export accessibility

- Added focused admin page interaction test (`app/admin/page.test.tsx`) that simulates DDS status-read failure and asserts accessible names for last-error export controls.
- Locked explicit control-name expectations for `Copy DDS status error context JSON`, `Download DDS status error context JSON`, and `Copy DDS status error export filename`.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 40 - admin interaction coverage for timestamp helper note

- Extended admin DDS status last-error interaction test to assert timestamp helper note rendering alongside export control accessible-name checks.
- Locked helper-note presence (`is replaced at download time.`) and timestamp placeholder rendering in the same failure-path interaction flow.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 41 - admin interaction test split for DDS status export helpers

- Refactored admin DDS status interaction coverage into two focused tests: one for accessible export-control names and one for timestamp helper-note rendering.
- Added shared failure-path render helper to keep test setup deterministic while narrowing failure blast radius.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 42 - reusable admin status-failure test helper extraction

- Extracted shared failure-path interaction setup into reusable admin test helper (`app/admin/test-helpers.tsx`).
- Updated admin page test suite to consume helper export and keep per-test assertions focused on behavior under test.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 43 - admin copy-filename interaction toast/clipboard coverage

- Extended admin DDS status interaction coverage to assert `Copy filename` action writes to clipboard and emits success toast.
- Added `sonner` toast mock plus clipboard mock in admin page test to lock operator feedback behavior.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 44 - admin copy-filename failure-path toast coverage

- Extended admin DDS status interaction tests with clipboard rejection branch for `Copy filename`.
- Locked failure behavior to show deterministic error toast (`Failed to copy EUDR status error filename.`) when clipboard write fails.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 45 - admin copy-error-context failure-path toast coverage

- Extended admin DDS status interaction tests with clipboard rejection branch for `Copy error context`.
- Locked failure behavior to show deterministic error toast (`Failed to copy EUDR status error context.`) when clipboard write fails.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 46 - admin copy-error-context success-path payload coverage

- Extended admin DDS status interaction tests to assert `Copy error context` success branch writes normalized JSON payload and emits success toast.
- Locked expected payload fields (`message`, `referenceNumber`, `occurredAt`) for malformed-status failure scenario in the same interaction flow.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 47 - admin download-error-json interaction semantics coverage

- Extended admin DDS status interaction tests to assert `Download error JSON` semantics: filename pattern, object URL lifecycle, and success toast feedback.
- Locked download artifact naming contract (`eudr-dds-status-error-<reference>-<timestamp>.json`) and URL cleanup behavior.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 48 - admin download-error-json payload-content coverage

- Extended `Download error JSON` interaction test to validate downloaded payload content keys (`message`, `referenceNumber`, `occurredAt`) in addition to filename/lifecycle semantics.
- Added deterministic Blob stub inside test harness to assert serialized JSON payload content in jsdom runtime.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 49 - reusable download mock helper extraction for admin tests

- Extracted URL/Blob/anchor download-path stubbing into shared admin test helper (`setupDownloadMocks`) to reduce repeated mock boilerplate.
- Updated admin page interaction tests to consume helper and keep download-assertion test focused on behavior semantics.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 50 - admin status-payload download interaction coverage

- Added reusable success-path admin status-read helper (`renderAdminWithStatusReadSuccess`) to support payload-download interaction tests.
- Extended admin interaction coverage for main `Download JSON` status payload export: filename contract, payload content assertions, URL lifecycle, and success toast.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 51 - admin status-download control visibility gating coverage

- Added explicit interaction assertion that main status-payload `Download JSON` control is absent before successful status read and appears only after success-path completion.
- Keeps status-download affordance gating deterministic without relying on unstable unhandled exception branches in jsdom.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 52 - admin status-read success toast assertion coverage

- Extended success-path interaction coverage to assert deterministic status-read completion toast after successful `Check Status` flow.
- Completes visibility + feedback pairing in admin DDS status-read interaction matrix by locking both control gating and operator success confirmation.

Verification commands:

- `cd apps/dashboard-product && npm test -- app/admin/page.test.tsx lib/eudr-dds-status-feedback.test.ts lib/eudr-dds-status-error-context.test.ts app/api/integrations/eudr/dds/status/route.test.ts`

### S1 post-closeout hardening slice 33 - EUDR integration OpenAPI contract publication + governance evidence

- Published implemented EUDR integration routes in Tracebud OpenAPI draft:
  - `GET /v1/integrations/eudr/echo`
  - `POST /v1/integrations/eudr/dds`
  - `GET /v1/integrations/eudr/dds/status`
- Added dedicated `Integrations` tag for external provider bridge operations.
- Executed governance gates to lock publication quality and CODEOWNERS policy parity.

Verification commands:

- `npm run openapi:lint`
- `npm run openapi:governance:policy:validate`
- `npm run openapi:governance:check`

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/integrations.controller.int.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 53 - external partner reporting and analytics data platform contract (MVP)

- Added execution-ready external partner data platform contract for third-party software analytics/reporting consumption:
  - partner pull API (`/v1/partner-data/*`) for tenant-scoped incremental extraction
  - partner webhook push model for near-real-time state/event synchronization
  - scheduled bulk export contract (CSV/Parquet object delivery with signed URL retrieval).
- Defined strict permission and tenant boundaries for external consumers:
  - integration administration remains exporter-scoped
  - read-only partner access remains explicit-scope (`read:lineage`, `read:compliance`, `read:risk`, `read:shipments`)
  - all partner paths fail closed on missing tenant claim or scope mismatch.
- Defined canonical partner state transitions:
  - `partner_connection_requested -> partner_connection_active`
  - `partner_connection_active -> partner_sync_pending`
  - `partner_sync_pending -> partner_sync_succeeded|partner_sync_retryable_failed|partner_sync_terminal_failed`
  - `partner_sync_retryable_failed -> partner_sync_succeeded|partner_sync_terminal_failed`.
- Defined deterministic exception handling and recovery:
  - idempotent replay keys required for export job start and webhook replay
  - retryable classes (`429`, `5xx`, transient network/provider) use bounded exponential retry
  - terminal failures route to explicit reconciliation queue with immutable evidence.
- Defined analytics and immutable evidence baseline:
  - required events: `partner_dataset_requested`, `partner_dataset_exported`, `partner_webhook_delivered`, `partner_webhook_retryable_failed`, `partner_webhook_terminal_failed`, `partner_sync_replayed`
  - required payload baseline: `tenantId`, `partnerKey`, `scope`, `dataset`, `cursor`, `idempotencyKey`, `attemptCount`, `latencyMs`, `timestamp`.
- Added acceptance mapping for MVP partner consumption:
  - third-party analytics tools can pull or receive data without direct DB access
  - tenant isolation, role scope, idempotency, and immutable evidence are test-covered
  - OpenAPI and partner event schema contracts are published before pilot onboarding.
- v1.6 architecture constraints applicability:
  - spatial payload fields must originate from canonical `GEOGRAPHY` + `ST_MakeValid` validated sources only
  - partner sync ordering must use persisted HLC/audit chronology, never client wall-clock precedence
  - lineage payloads must consume materialized O(1) lineage fields only
  - TRACES-related partner exports must support chunk/reference reconciliation metadata
  - GDPR shredding must preserve immutable audit references while preventing PII rehydration.

Verification commands:

- `n/a (documentation slice)`

### S1 post-closeout hardening slice 54 - backend partner-data API skeleton + contract publication

- Added tenant-safe partner-data backend controller:
  - `GET /v1/partner-data/datasets?scope=...`
  - `POST /v1/partner-data/exports`
- Enforced explicit permissions and tenant boundaries:
  - missing tenant claim fails closed on both endpoints
  - `datasets` endpoint role gate: `exporter|agent`
  - `exports` endpoint role gate: `exporter` only.
- Enforced deterministic input contracts:
  - `scope` must be one of `read:lineage|read:compliance|read:risk|read:shipments`
  - export start requires `dataset`, `format(csv|parquet)`, and `idempotencyKey`.
- Added immutable analytics evidence baseline:
  - dataset reads write `partner_dataset_requested`
  - export starts write `partner_dataset_exported`
  - both include tenant, actor role/id, scope, and capture timestamp context.
- Published OpenAPI draft paths for partner-data endpoints:
  - `GET /v1/partner-data/datasets`
  - `POST /v1/partner-data/exports`
  - includes request/response contracts and `400/401/403` policy semantics.
- Added focused controller unit test coverage for deny/allow paths and audit evidence behavior.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/integrations.controller.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 55 - persistent idempotency replay + export status/download retrieval

- Added partner export persistence migration:
  - `tracebud-backend/sql/tb_v16_018_partner_data_exports.sql`
  - table: `integration_partner_exports`
  - includes tenant + idempotency uniqueness (`UNIQUE (tenant_id, idempotency_key)`), status/state constraints, artifact URL storage, and update timestamp trigger.
- Upgraded `POST /v1/partner-data/exports` to deterministic replay behavior:
  - checks existing `(tenant_id, idempotency_key)` before insert
  - returns existing export row with `replayed=true` for duplicate requests
  - returns newly queued export row with `replayed=false` for first request.
- Added tenant-safe export status endpoint:
  - `GET /v1/partner-data/exports/{id}`
  - role gate: `exporter|agent`
  - returns immutable export state + created/updated timestamps.
- Added tenant-safe export artifact endpoint:
  - `GET /v1/partner-data/exports/{id}/download`
  - role gate: `exporter|agent`
  - returns signed artifact URL contract only when export is `completed`; otherwise deterministic fail-closed validation error.
- Added migration-availability fail-closed semantics:
  - endpoints return deterministic guidance when `TB-V16-018` has not been applied.
- Extended OpenAPI contract publication for new partner export status and download paths.
- Extended controller unit coverage for replay behavior and status/download retrieval.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/integrations.controller.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 56 - export lifecycle finalize endpoint + DB-backed integration coverage

- Added worker-style export lifecycle finalization endpoint:
  - `POST /v1/partner-data/exports/{id}/finalize`
  - allows deterministic transition from `queued` to `completed|failed`
  - role gate: `exporter|admin|compliance_manager`.
- Added immutable lifecycle telemetry for finalize outcomes:
  - success path emits `partner_webhook_delivered`
  - terminal failure path emits `partner_webhook_terminal_failed`
  - replay path now emits `partner_sync_replayed` when duplicate idempotency export starts are detected.
- Added DB-backed integration test suite:
  - `src/integrations/partner-data.controller.int.spec.ts`
  - covers missing-tenant fail-closed, persisted replay semantics, and queued->completed finalize + download retrieval flow.
- Extended OpenAPI contract publication with finalize path:
  - `POST /v1/partner-data/exports/{id}/finalize`
  - explicit outcome/body and response state contracts.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 57 - retry queue metadata + retry endpoint operability

- Added retry/backoff persistence migration:
  - `tracebud-backend/sql/tb_v16_019_partner_data_export_retry_queue.sql`
  - new columns: `attempt_count`, `error_code`, `next_retry_at`
  - queue index: `idx_partner_exports_retry_queue`.
- Extended export finalize behavior:
  - failed finalize now persists `error_code` and computes initial `next_retry_at` backoff window
  - completed finalize clears retry schedule through success-state transition.
- Added tenant-safe retry queue read endpoint:
  - `GET /v1/partner-data/exports/retry-queue?limit=...`
  - returns due failed exports (`next_retry_at <= now`) with deterministic ordering.
- Added failed-export retry endpoint:
  - `POST /v1/partner-data/exports/{id}/retry`
  - allowed only for failed tenant-scoped exports
  - increments `attempt_count`, clears `error_code`, clears `next_retry_at`, re-queues to `partner_sync_pending`.
- Added retry lifecycle telemetry:
  - emits `partner_webhook_retryable_failed` on retry actions with attempt context.
- Extended OpenAPI contracts for retry queue and retry action paths and updated export response schema fields (`attemptCount`, `errorCode`, `nextRetryAt`).

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/partner-data.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 58 - retry-cap policy + exponential backoff + summary diagnostics

- Added retry-cap policy migration:
  - `tracebud-backend/sql/tb_v16_020_partner_data_export_retry_policy.sql`
  - column: `retry_exhausted_at` + index for exhausted-run diagnostics.
- Implemented bounded exponential retry backoff policy:
  - failed finalize computes `next_retry_at` via `2^(attempt-1)` minutes, capped at 60 minutes
  - max retry attempts fixed at `5`
  - exhausted retries set `retry_exhausted_at` and produce terminal telemetry.
- Hardened retry endpoint behavior:
  - `POST /v1/partner-data/exports/{id}/retry` now blocks retries at cap with deterministic error
  - emits terminal telemetry when retry exhaustion is reached.
- Added retry summary diagnostics endpoint:
  - `GET /v1/partner-data/exports/retry-summary`
  - returns `dueRetryCount`, `failedCount`, `exhaustedCount`, `maxAttempts`, and latest retry activity pointer.
- Extended export/status/finalize response contract to include `retryExhaustedAt`.
- Extended unit + DB-backed integration coverage for retry-cap and summary behavior.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/partner-data.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 59 - scheduler-triggered retry sweep + sweep telemetry

- Added scheduler-triggered retry sweep endpoint:
  - `POST /v1/partner-data/exports/retry-sweep/trigger?schedulerToken=...`
  - requires configured scheduler secret (`PARTNER_EXPORT_RETRY_SWEEP_TOKEN`)
  - enforces role + tenant fail-closed behavior.
- Sweep execution behavior:
  - scans due failed exports up to bounded `limit`
  - retries eligible exports (below retry cap) to `queued/partner_sync_pending`
  - returns deterministic sweep summary (`scannedCount`, `retriedCount`, `retriedExportIds`).
- Added immutable sweep telemetry:
  - event: `partner_retry_sweep_executed`
  - payload includes actor, scanned/retried counts, selected IDs, and limit.
- Added unit and DB-backed integration coverage:
  - scheduler trigger success path
  - due-failure retry transition verification.
- Published OpenAPI contract for retry-sweep trigger path and response shape.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/partner-data.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 60 - sweep execution lifecycle taxonomy + summary rollups

- Extended sweep telemetry to explicit lifecycle taxonomy:
  - `partner_retry_sweep_started`
  - `partner_retry_sweep_completed`
  - `partner_retry_sweep_failed`
  - retained compatibility event: `partner_retry_sweep_executed`.
- Added deterministic sweep execution IDs:
  - each trigger call now generates `sweepExecutionId`
  - included in trigger response and sweep lifecycle telemetry payloads.
- Added retry summary rollups for latest sweep execution:
  - `GET /v1/partner-data/exports/retry-summary` now returns `lastSweepRun`
  - includes execution id, status, scanned/retried counts, and failure message when present.
- Extended OpenAPI contracts:
  - retry sweep trigger response now includes `sweepExecutionId` and `status`
  - retry summary now includes `lastSweepRun` object contract.
- Extended unit + integration coverage:
  - scheduler sweep response assertions now include execution id + status
  - retry summary unit coverage now validates `lastSweepRun`.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/partner-data.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 61 - scheduler header auth + token-version rollups

- Hardened scheduler trigger auth contract:
  - changed sweep trigger token from query parameter to required header
  - header: `x-tracebud-scheduler-token`
  - keeps fail-closed behavior on missing/invalid token.
- Added scheduler token-version rollout visibility:
  - reads optional `PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION`
  - includes token version in sweep lifecycle telemetry payloads
  - includes token version in trigger response and retry-summary `lastSweepRun`.
- Extended OpenAPI contract publication:
  - sweep trigger now documents header auth parameter and `schedulerTokenVersion` response field
  - retry summary `lastSweepRun` now documents `schedulerTokenVersion`.
- Extended tests:
  - unit and DB-backed integration assertions now validate `schedulerTokenVersion` propagation.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/integrations/partner-data.controller.spec.ts src/integrations/partner-data.controller.int.spec.ts src/integrations/integrations.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/partner-data.controller.int.spec.ts`
- `npm run openapi:lint`

### S1 post-closeout hardening slice 62 - assessment request workflow backbone (dashboard -> farmer)

- Added new tenant-scoped assessment request contract for SAI + Cool Farm workflow handoff:
  - `POST /v1/integrations/assessments/requests` (dashboard sends farmer request)
  - `GET /v1/integrations/assessments/requests` (dashboard list + farmer assigned feed)
  - status transitions for field execution and review lifecycle (`sent/opened/in_progress/submitted/reviewed/needs_changes/cancelled`).
- Added dedicated persistence migration:
  - `TB-V16-021` creating `integration_assessment_requests` with pathway, assignment, due date, metadata, and tenant/farmer indexes.
- Added immutable telemetry events for critical lifecycle checkpoints:
  - `integration_assessment_request_sent`
  - `integration_assessment_request_status_updated`.
- Added unit regression coverage for role guards, create/list flow, and status validation.

Verification commands:

- `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`

### S1 post-closeout hardening slice 63 - assessment workflow UI wiring (dashboard + offline app)

- Wired dashboard request operations to live backend assessment contract:
  - added proxy routes:
    - `GET/POST /api/integrations/assessments/requests`
    - `PATCH /api/integrations/assessments/requests/:id/status`
  - updated dashboard requests page with a dedicated assessment section:
    - send assessment request to farmer (`title`, `pathway`, `farmerUserId`, `dueAt`, `instructions`)
    - list recent requests with status chips
    - manager review actions (`submitted -> reviewed | needs_changes`).
- Wired offline app farmer task feed to assessment request lifecycle:
  - added mobile API helpers for assigned requests + status transitions.
  - home tab now surfaces `Assessment Tasks` card with next-step action buttons:
    - `sent -> opened`
    - `opened|needs_changes -> in_progress`
    - `in_progress -> submitted`.
- Preserved tenant isolation and explicit role/status transition boundaries through backend contract reuse (no local bypass flow).

Verification commands:

- `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`

### S1 post-closeout hardening slice 64 - request-to-questionnaire linkage + submit gate

- Added assessment-request to questionnaire linkage persistence:
  - migration `TB-V16-022` adds `questionnaire_id` FK on `integration_assessment_requests`.
- Extended assessment request contract:
  - create endpoint accepts optional `questionnaireDraftId`.
  - list/get responses now include `questionnaire_id` for dashboard/offline visibility.
- Enforced farmer submit gate on linked questionnaire readiness:
  - `PATCH /v1/integrations/assessments/requests/:id/submitted` now checks linked questionnaire status first.
  - allowed questionnaire statuses for submit: `submitted`, `validated`, `scored`, `reviewed`.
  - reject when linkage is missing or still in `draft`.
- Extended UI visibility:
  - dashboard request cards display linked questionnaire draft id.
  - offline assessment task card shows linked questionnaire id context.
- Added controller regression coverage for submit-gate denial when linked questionnaire is not submitted.

Verification commands:

- `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`
- `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`

### S1 post-closeout hardening slice 65 - auto-link questionnaire draft on request creation

- Added backend auto-link behavior for assessment dispatch:
  - when `questionnaireDraftId` is omitted, request creation now auto-creates a tenant-scoped questionnaire draft in `integration_questionnaire_v2` and links it via `questionnaire_id`.
  - preserves explicit linkage when `questionnaireDraftId` is provided and tenant-valid.
- Strengthened audit payload for dispatch visibility:
  - `integration_assessment_request_sent` now records whether questionnaire linkage was auto-created.
- Updated controller regression setup to validate new auto-create query sequence while keeping prior role/validation coverage.

Verification commands:

- `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`
- `cd apps/dashboard-product && npm test -- app/requests/page.test.tsx`

### S1 post-closeout hardening slice 66 - migration guidance cleanup + DB proof for auto-linking

- Harmonized stale migration guidance strings in `AssessmentRequestsController`:
  - replaced residual `TB-V16-019` guidance with correct assessment workflow migrations (`TB-V16-021`, `TB-V16-022`).
- Added DB-backed integration proof for auto-link persistence:
  - new spec `assessment-requests.controller.int.spec.ts` validates that request creation without `questionnaireDraftId`:
    - creates an `integration_questionnaire_v2` draft,
    - persists `integration_assessment_requests.questionnaire_id`,
    - keeps linked questionnaire status at `draft`.
- Confirmed integration path is executable in targeted mode using `--runTestsByPath` to isolate new coverage from unrelated suite failures.

### S1 post-closeout hardening slice 67 - assessment API alias reduction

- Reduced assessment request API surface to canonical routes only:
  - removed redundant alias endpoints for duplicated status/meta/path/detail actions
  - retained primary explicit routes (`opened`, `in-progress`, `submitted`, `reviewed`, `needs-changes`, `cancelled`, `sent`, etc.).
- Verified no runtime references remain for removed alias URLs outside feature documentation.
- Keeps behavior unchanged while reducing long-term maintenance overhead and route confusion risk.

Verification commands:

- `cd tracebud-backend && npm test -- src/integrations/assessment-requests.controller.spec.ts --runInBand`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/integrations/assessment-requests.controller.int.spec.ts`

### S1 post-closeout hardening slice 68 - canonical endpoint map publication

- Published a single-source endpoint map for assessment workflow contracts:
  - new quality artifact: `product-os/04-quality/assessment-workflow-endpoint-map.md`.
- Documented canonical backend + dashboard proxy routes, roles, transition semantics, and submit-gate requirements.
- Explicitly marks alias endpoints as removed and sets canonical path usage expectation for frontend/integration consumers.

### S1 post-closeout hardening slice 69 - CI guardrail for removed assessment aliases

- Added automated governance guardrail to prevent route-surface regression:
  - new script: `scripts/openapi-governance/assessment-route-alias-check.mjs`
  - new npm command: `openapi:governance:assessment:aliases:check`
  - new contracts CI step: `Enforce assessment canonical route aliases`.
- Guardrail fail-closes when deprecated alias routes are detected in `assessment-requests.controller.ts`.
- Verified guardrail passes on current canonical route set.

Verification commands:

- `npm run openapi:governance:assessment:aliases:check`

### S1 post-closeout hardening slice 70 - OpenAPI parity for canonical assessment routes

- Extended assessment route governance guardrail to validate OpenAPI parity against canonical workflow operations.
- Added canonical assessment request path inventory to `docs/openapi/tracebud-v1-draft.yaml` for:
  - create/list/get
  - manager and farmer status transitions
  - title/farmer/pathway/metadata/touch update routes.
- Updated contracts CI to enforce alias removal and canonical OpenAPI route coverage in one blocking check:
  - `Enforce assessment canonical route aliases and OpenAPI parity`.

Verification commands:

- `npm run openapi:governance:assessment:aliases:check`
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

- [x] Provider/protocol choices finalized where needed (`internal API + audit-log webhook evidence path retained for FEAT-009 S1 scope`)

## Status

Done (TB-V16-009 / FEAT-009)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
