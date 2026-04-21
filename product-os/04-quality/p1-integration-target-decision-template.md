# P1 External API Integration Target Decision Template

Use this one-pager to lock the first 1-2 external integration targets for FEAT-009 follow-on slices.

Draft prefill status: `locked_for_execution` (evidence-linked in FEAT-009 + BLK-003 closure)

## Decision metadata

- Decision ID: `P1-INT-TARGET-001`
- Date: `2026-04-20`
- Owner (Product): `TBD`
- Owner (Engineering): `TBD`
- Reviewers (Security/Compliance/Ops): `TBD`
- Linked blocker: `BLK-003` (`product-os/06-status/blockers.md`)

## Candidate targets

| Candidate | Business outcome | Technical surface | MVP fit (H/M/L) | Decision |
|---|---|---|---|---|
| Target A | EUDR filing submission to regulator surface | TRACES NT filing adapter (`create`, `update`, `submit`, status sync) | H | Proposed |
| Target B | Reduce manual exporter operations and duplicate data entry | ERP outbound adapter (`purchase order`, `shipment`, `invoice traceability refs`) | H | Proposed |
| Target C (optional) | Optional document enrichment and automation | External compliance document provider (read-only pull) | M | Deferred |

## Final selection (lock 1-2)

- Selected target 1: `TRACES NT filing adapter`
- Selected target 2 (optional): `ERP outbound adapter`
- Why these now: They close the highest-friction operational loop (regulatory submission + exporter system interoperability) and directly de-risk MVP handoff work.
- Why others deferred: Additional providers have lower MVP criticality and can reuse the same adapter and evidence framework after first-pair hardening.

## Strategy decision (approved direction)

- Primary integration mode: `Managed EUDR REST API service` (delivery/default path)
- Parallel hedge mode: `Open-source client evaluation lane` (non-production fallback/spike)
- Implementation rule:
  - keep provider adapter boundary explicit (`managed_api` vs `oss_client`) behind feature flags
  - do not copy AGPL source code into production codebase without explicit legal approval.
- Exit criteria for strategy reassessment:
  - pilot KPI breach (`error rate`, `latency`, `support SLA`, `cost variance`)
  - legal/compliance blocker in managed vendor terms
  - proven fallback parity in sandbox.

## Contract baseline per selected target

### 1) Provider and auth contract

- Provider name: `TRACES NT (regulatory system) / ERP partner API (selected tenant pilot partner)`
- Environment(s): `sandbox`, `production`
- Auth method:
  - TRACES/EUDR REST API service: `x-api-key` header (primary), optional `x-api-eudr-version` header, legacy `Authorization: Bearer <API_KEY>` supported
  - ERP adapter: `OAuth2 client credentials` (preferred) unless partner requires API key
- Credential rotation owner and cadence: `Platform Ops + Security`, every `90` days minimum, immediate rotation on incident
- Secret storage path: backend server-side env store (`EUDR_API_KEY`, `EUDR_API_VERSION`, `TRACEBUD_BACKEND_*` scoped secrets), no client exposure

### 2) Endpoint and payload contract

- Base URL:
  - TRACES/EUDR REST API service: `https://www.eudr-api.eu`
  - ERP: `TBD by partner environment pack`
- Endpoint list (method + path):
  - TRACES connectivity check: `GET /api/eudr/echo?message=...`
  - TRACES adapter: `POST /filings`, `PATCH /filings/{id}`, `POST /filings/{id}/submit`, `GET /filings/{id}/status`
  - ERP adapter: `POST /erp/shipments`, `POST /erp/purchase-orders`, `POST /erp/invoices`, `GET /erp/ack/{id}`
- Required request fields:
  - Common: `tenantId`, `packageId`, `idempotencyKey`, `actorId`, `timestamp`
  - TRACES: declaration/filing envelope, validated geospatial and lineage references
  - ERP: order/shipment/invoice refs + package linkage keys
- Response success shape:
  - Deterministic normalized envelope: `{ externalRef, status, acceptedAt, providerMetadata }`
- Error shape + codes:
  - Normalized error envelope: `{ code, message, retryable, providerStatus, providerErrorRef }`
  - TRACES quick-start codes: `200`, `400`, `401`, `403` (EUDR credentials not configured), `408` (timestamp window expired), `500`
- Rate limits and quotas:
  - Provider quota captured per endpoint; adapter throttles and queues on quota breach

### TRACES/EUDR source-backed integration notes

- Documentation source: [EUDR REST API Service Docs](https://www.eudr-api.eu/docs)
- Swagger reference: [Swagger UI](https://www.eudr-api.eu/api-docs)
- Prerequisite: EUDR Web Service credentials from TRACES must be configured before API key calls will succeed.
- Required auth header: `x-api-key: <EUDR_API_KEY>`
- Version header: `x-api-eudr-version: 2` (optional; version 2 is default and recommended)
- Legacy auth compatibility: `Authorization: Bearer <EUDR_API_KEY>` (not preferred for new implementation)
- First smoke test endpoint for setup validation: `GET /api/eudr/echo?message=Hello EUDR API`

### Managed vendor legal checklist (required even with paid API)

- [ ] MSA/ToS reviewed by counsel (liability, SLA, termination, jurisdiction).
- [ ] DPA/GDPR review completed (controller/processor roles, subprocessors, transfer mechanisms).
- [ ] Security clauses reviewed (breach notice windows, incident cooperation duties).
- [ ] Data retention/audit evidence obligations aligned to Tracebud compliance policy.
- [ ] Regulatory accountability boundaries documented (vendor transport vs operator declaration accuracy).
- [ ] Procurement approval recorded with owner + renewal date.
- [ ] If OSS fallback is explored, AGPL implications reviewed and approved scope documented.

### Managed vendor legal checklist tracker (owner + due + evidence)

| Work item | Owner | Due date | Status (`not_started`/`in_progress`/`done`) | Evidence link / artifact |
|---|---|---|---|---|
| MSA/ToS counsel review | `Legal Counsel` | `2026-04-24` | `in_progress` | `product-os/04-quality/p0-02-counsel-response-tracker.md` |
| DPA/GDPR review | `Privacy Counsel + Security Lead` | `2026-04-29` | `in_progress` | `product-os/04-quality/p0-02-counsel-response-tracker.md` |
| Security clause review | `Security Lead` | `2026-04-30` | `not_started` | `TBD (security-review-note.md)` |
| Data retention + audit alignment | `Compliance Lead` | `2026-05-01` | `not_started` | `TBD (retention-audit-alignment-note.md)` |
| Regulatory accountability memo | `Legal Counsel + Product Lead` | `2026-05-02` | `not_started` | `TBD (regulatory-accountability-memo.md)` |
| Procurement approval + renewal date | `Finance/Procurement` | `2026-05-05` | `not_started` | `TBD (vendor-approval-record.md)` |
| AGPL fallback scope review (if OSS lane active) | `Legal Counsel + Engineering Lead` | `2026-05-06` | `not_started` | `TBD (agpl-fallback-scope-note.md)` |

### Secret placement and env contract (authoritative for this integration)

- Local backend runtime secrets:
  - Put EUDR keys in `tracebud-backend/.env` (or `tracebud-backend/.env.local` for local-only override).
  - Backend env load order is `.env.local` then `.env` from backend app root.
- Dashboard app:
  - Do not place EUDR keys in `apps/dashboard-product` env files.
  - Dashboard should only use `TRACEBUD_BACKEND_URL` to call backend APIs.
- Production:
  - Store EUDR secrets in deployment secret manager for backend runtime only.
  - Never commit raw key values to repository files, docs, or PR text.
- Required variable names:
  - `EUDR_API_KEY`
  - `EUDR_API_VERSION=2`
  - `EUDR_BASE_URL=https://www.eudr-api.eu`
- Security guardrail:
  - Never use `NEXT_PUBLIC_*` for EUDR secrets.

### Scheduler token contract and rotation checklist (V2 integration sweeper)

- Scheduler trigger endpoint:
  - `POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger`
- Required auth header:
  - `x-tracebud-scheduler-token: <COOLFARM_SAI_V2_SCHEDULER_TOKEN>`
- Required backend env:
  - `COOLFARM_SAI_V2_SCHEDULER_TOKEN`
- Rotation cadence:
  - rotate every `90` days minimum or immediately on suspected leak.
- Rotation one-pass procedure:
  1. Generate new random token in secret manager.
  2. Deploy backend with new token in target environment.
  3. Update scheduler secret reference.
  4. Run one scheduler trigger smoke check.
  5. Revoke old token.
- Evidence to capture after each rotation:
  - rotation timestamp
  - operator
  - environment
  - successful trigger response code
  - rollback note (if any).

### TRACES/EUDR filing lifecycle endpoint mapping (provisional until Swagger extraction)

- Base API prefix: `https://www.eudr-api.eu/api`
- Proposed DDS lifecycle mapping:
  - Create/submit DDS: `POST /eudr/dds`
  - Amend DDS: `PUT /eudr/dds`
  - Retract DDS: `DELETE /eudr/dds`
- Status/read surface:
  - `TBD` (confirm exact read/status endpoint and query parameters from Swagger)
- Verification gate (required before implementation lock):
  - Confirm all operation paths and request/response schemas against Swagger/OpenAPI export.
  - Record confirmed paths in this section and remove `provisional` marker.

### 3) Idempotency and retries

- Idempotency key strategy (source + TTL):
  - Key source: `tenantId + integrationKey + operation + domainEntityId + version`
  - TTL: minimum `7` days retained for duplicate suppression
- Retry policy (backoff, max attempts, timeout):
  - Exponential backoff with jitter, max `5` attempts, operation timeout `30s` per attempt
- Retryable vs terminal error taxonomy:
  - Retryable: network timeout, `429`, `5xx`, transient provider unavailable
  - Terminal: auth failure, schema validation failure, forbidden, unknown entity reference
- Replay behavior and duplicate suppression rule:
  - Replay always uses original idempotency key lineage; terminal duplicate side effects are blocked and recorded as replay outcomes

### 4) Permission and tenant boundaries

- Allowed roles:
  - Configure/manage integration: `exporter`
  - Read delivery evidence/diagnostics: `exporter`, `agent`
  - Trigger scoped side effects only where explicitly allowed: `farmer` (none by default for these adapters)
- Tenant claim requirements:
  - Signed tenant claim required for all adapter write/read operations
- Fail-closed behavior on missing tenant/auth:
  - `401`/`403` fail-closed; no endpoint metadata, credential details, or payload previews returned
- Cross-tenant leakage prevention checks:
  - Query scope by tenant at every read path; deny mismatched tenant integration IDs and external refs

### 5) State transitions

- `integration_registration_requested -> integration_registered`
- `integration_registered -> integration_delivery_pending`
- `integration_delivery_pending -> integration_delivery_succeeded|integration_delivery_retryable_failed|integration_delivery_terminal_failed`
- Any target-specific additional states:
  - `integration_delivery_pending -> integration_external_ack_pending -> integration_delivery_succeeded`
  - `integration_delivery_pending -> integration_manual_reconciliation_required` (provider accepted request but no deterministic ack within SLA)

### 6) Exception handling and recovery

- Config validation failures:
  - Reject at registration/update with deterministic errors; do not persist partial or invalid credentials
- Provider outage behavior:
  - Queue and mark retryable failure; expose diagnostics with attempt counters and next retry time
- Dead-letter/terminal handling:
  - After max attempts, mark terminal failure and route to operator reconciliation queue
- Operator recovery runbook link:
  - `TBD` (to be authored in FEAT-009 follow-on slice)

### 7) Analytics and immutable evidence

- Required events (minimum):
  - `integration_webhook_registered`
  - `integration_delivery_attempt_queued`
  - `integration_delivery_succeeded`
  - `integration_delivery_retryable_failed`
  - `integration_delivery_terminal_failed`
  - `integration_replay_requested`
  - `integration_replay_succeeded`
  - `integration_replay_failed`
- Required payload keys:
  - `tenantId`, `integrationKey`, `actorRole`, `actorId`, `idempotencyKey`, `attemptCount`, `latencyMs`, `errorClass`, `timestamp`
- Dashboard evidence surface:
  - Existing admin diagnostics tables plus provider filter (`traces`, `erp`) and operation filter (`submit`, `status_sync`, `shipment_push`)

### 8) v1.6 architecture constraints check

- Spatial correctness (`GEOGRAPHY`, `ST_MakeValid`, 5 percent area variance guard) impact:
  - Adapter consumes canonical validated spatial fields only; no adapter-side area recomputation
- Offline conflict integrity (HLC ordering) impact:
  - Outbound ordering uses persisted audit/HLC metadata, never unsynchronized client wall-clock values
- Lineage O(1) materialized fields impact:
  - Payload enrichment reads materialized lineage fields only (no recursive traversal in request path)
- TRACES chunking/reference reconciliation impact:
  - Filing payload supports chunking for size/vertex limits and deterministic reference reconciliation on replay
- GDPR shredding and immutable audit reference impact:
  - Audit retains immutable reference IDs while personal fields remain shred-safe and non-rehydratable

## Acceptance criteria (must all be true)

- [ ] Tenant-safe and role-scoped paths are enforced for all selected targets.
- [ ] Idempotency and retry semantics are deterministic and test-covered.
- [ ] Immutable delivery evidence is queryable in backend and dashboard diagnostics.
- [ ] OpenAPI contracts and examples are published for selected integration endpoints.
- [ ] CI includes adapter contract tests and failure-path coverage.
- [ ] Rollout has sandbox verification and production guardrails.

## Implementation readiness checklist

- [ ] FEAT-009 follow-on slices created with owners and sequence.
- [ ] OpenAPI updates queued with operation IDs and `4xx` contracts.
- [ ] Feature flags defined per target and environment.
- [ ] Runbook and on-call escalation notes drafted.
- [ ] Status docs updated (`current-focus`, `done-log`, `daily-log`).

## Sign-off

- Product sign-off: `Pending`
- Engineering sign-off: `Pending`
- Security/Compliance sign-off: `Pending`
- Date: `Pending`

