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
