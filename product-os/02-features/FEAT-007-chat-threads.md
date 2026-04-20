# Chat threads

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for chat threads aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Record-linked collaboration for remediation and approvals.

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

Scope: record-linked chat thread execution matrix bootstrap for remediation and approval collaboration across tenant-safe surfaces.

### Permission and tenant boundary matrix

- **Exporter role:** can open threads, post messages, resolve/reopen threads, and mention tenant users on records they can already access.
- **Reviewer/admin roles:** can read and post in scoped threads and can mark compliance decision comments with explicit role attribution.
- **Farmer/agent roles:** can only participate in threads explicitly linked to records they own/are assigned to; no cross-tenant discovery.
- **Missing tenant claim:** fails closed before any thread list/read/post/resolve transition.

### State transition matrix

- `draft_thread -> active` when first persisted message is accepted.
- `active -> resolved` when an authorized actor marks thread resolved with resolution note.
- `resolved -> reopened` when new evidence or decision challenge requires follow-up.
- `reopened -> active` after reopening is acknowledged and thread resumes normal messaging.
- `active|reopened -> archived` when parent record reaches terminal retention-safe state and thread is frozen for edits.

### Exception handling and recovery

- Missing/invalid record linkage returns deterministic validation errors and never creates orphaned thread rows.
- Duplicate client message requests with identical idempotency key replay prior accepted result without duplicate message writes.
- Unauthorized participant actions fail with explicit role/scope denial while preserving existing thread state.
- Temporary delivery/read sync failures are retried with durable ordering metadata; immutable audit trail remains append-only.

### Analytics/event coverage

- Thread lifecycle telemetry must include:
  - thread created / message posted / thread resolved / thread reopened / thread archived
  - message replayed (idempotency reuse) and permission-denied attempt (diagnostic)
- Event payload baseline: tenantId, threadId, recordId, actor identity/role, idempotency key (when present), lifecycle phase, timestamp.

### Acceptance mapping (v1)

- Thread writes and reads remain tenant-scoped and role-constrained on all endpoints.
- Duplicate message submit with same idempotency key produces single logical message side effect.
- Resolution/reopen transitions preserve canonical lifecycle order and immutable timeline evidence.
- Audit/diagnostics surfaces expose sufficient lifecycle events for investigation and compliance handoff.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** chat threads reference record identifiers only; no geometry storage/mutation occurs in chat domain.
- **Offline conflict integrity:** message ordering and replay handling rely on deterministic idempotency/HLC metadata, not client wall clock trust.
- **Lineage performance:** thread lookup should attach to existing materialized record references and avoid runtime deep lineage graph traversals.
- **TRACES chunking resilience:** message attachments/exports must remain chunk-friendly for downstream filing bundles without breaking reference integrity.
- **GDPR shredding safety:** thread payloads must avoid reintroducing shredded personal attributes and keep retention-safe audit references.

## Execution slices

### S1 code slice 1 - chat thread execution matrix bootstrap

- Documented FEAT-007 S1 execution matrix for permissions, state transitions, exception/recovery behavior, analytics event baseline, acceptance mapping, and v1.6 architecture constraints.
- Established implementation-ready baseline for next FEAT-007 slices (thread contract endpoints, idempotent message post semantics, and diagnostics surfaces).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - thread contract endpoint bootstrap + idempotent message semantics

- Added new backend chat-thread module with tenant-scoped endpoints:
  - `GET /v1/chat-threads`
  - `POST /v1/chat-threads`
  - `GET /v1/chat-threads/{id}/messages`
  - `POST /v1/chat-threads/{id}/messages`
- Enforced tenant-claim fail-closed policy on all chat-thread read/write endpoints.
- Implemented idempotent message-post semantics via tenant + idempotency-key replay behavior for both initial thread message creation and subsequent thread message posts.
- Added deterministic guardrails for invalid thread/message states (missing payloads, archived thread posting, unknown thread id in tenant scope).
- Added chat-thread persistence bootstrap in service (`chat_threads`, `chat_messages` schema initialization and indexes) for implementation-ready contract testing.
- Added unit test coverage for controller tenant enforcement and service idempotency/archived-thread behavior.
- Published OpenAPI contract + schemas for chat-thread list/create/message endpoints and request/response payloads.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/chat-threads/chat-threads.service.spec.ts src/chat-threads/chat-threads.controller.spec.ts`
- `npm run openapi:lint`

### S1 code slice 3 - chat lifecycle telemetry persistence + diagnostics read surface

- Added best-effort lifecycle telemetry persistence from chat-thread write paths with tenant-safe payloads for:
  - `chat_thread_created`
  - `chat_thread_message_posted`
  - `chat_thread_message_replayed`
- Added tenant-scoped diagnostics read endpoint:
  - `GET /v1/audit/gated-entry/chat-threads`
  - supports `fromHours`, `limit`, `offset`, `sort`, `phase` (`created|posted|replayed`)
- Extended dashboard analytics proxy to route `eventKind=chat_threads` to backend diagnostics endpoint.
- Added chat-thread diagnostics hook + admin diagnostics panel section for operator visibility (filter + pagination + actor/phase/thread/message context).
- Added unit + DB-backed integration coverage for chat-thread diagnostics endpoint and route-forwarding behavior.
- Published OpenAPI contract for chat-thread diagnostics list endpoint and typed telemetry event/list schemas.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/audit/audit.controller.spec.ts src/audit/audit.gated-entry.int.spec.ts src/chat-threads/chat-threads.service.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

### S1 code slice 4 - resolve/reopen/archive lifecycle transitions + telemetry parity

- Added explicit tenant-scoped thread lifecycle transition endpoints:
  - `POST /v1/chat-threads/{id}/resolve`
  - `POST /v1/chat-threads/{id}/reopen`
  - `POST /v1/chat-threads/{id}/archive`
- Enforced deterministic state rules:
  - `active -> resolved`
  - `resolved -> active` (reopen)
  - `active|resolved -> archived`
  - archived threads fail closed for invalid reopen/resolve attempts.
- Persisted lifecycle telemetry parity events:
  - `chat_thread_resolved`
  - `chat_thread_reopened`
  - `chat_thread_archived`
- Extended diagnostics read path (`/v1/audit/gated-entry/chat-threads`) and dashboard filter model with additional phases (`resolved`, `reopened`, `archived`).
- Extended OpenAPI with transition endpoints + typed response schema and updated chat-thread diagnostics event enum coverage.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/chat-threads/chat-threads.controller.spec.ts src/chat-threads/chat-threads.service.spec.ts src/audit/audit.controller.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

### S1 code slice 5 - acceptance closeout + diagnostics transition assertions

- Added closeout diagnostics assertions to prove lifecycle transition telemetry is queryable under phase filters (including `resolved`) in both:
  - unit-level audit controller checks
  - DB-backed tenant-scoped integration checks
- Confirmed acceptance mapping is covered end-to-end:
  - tenant-scoped read/write contract
  - idempotent message replay semantics
  - canonical resolve/reopen/archive transition behavior
  - diagnostics event visibility for operator/compliance handoff
- Closed feature open question for S1 scope:
  - provider/protocol choice remains internal API + audit-log based diagnostics surface; no external provider dependency introduced in FEAT-007 S1.
- Completed FEAT-007 S1 closeout and marked feature done.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/audit/audit.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`
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

- [x] Provider/protocol choices finalized where needed

## Status

Done (TB-V16-007 / FEAT-007)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
