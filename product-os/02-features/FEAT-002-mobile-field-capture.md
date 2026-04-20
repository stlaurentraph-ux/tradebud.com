# Mobile field capture

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for mobile field capture aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Offline assignment, farmer/farm/plot capture, sync lifecycle.

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

Scope: mobile offline capture hardening for assignment-aware farmer/farm/plot data entry and sync lifecycle integrity under tenant-safe controls.

### Permission and tenant boundary matrix

- **Farmer role:** can capture/edit only own-tenant assignment-scoped field data.
- **Agent role:** can assist capture within explicitly assigned tenant/farmer scopes; no cross-tenant overrides.
- **Exporter/admin roles:** may review synced outputs but cannot bypass mobile capture validation/sync guards.
- **Missing or unsigned tenant claim:** must fail closed before assignment fetch, offline queue enqueue, or sync flush.

### State transition matrix

- `assigned -> in_capture` when mobile user opens an active assignment.
- `in_capture -> queued_offline` when capture is saved locally without network.
- `queued_offline -> synced` when server acknowledges accepted payload/idempotency envelope.
- `queued_offline -> sync_failed_retryable` on transient transport/server failures (kept for retry).
- `queued_offline -> sync_rejected` on canonical validation/policy rejection (requires operator correction).

### Exception handling and recovery

- Offline mode: queue locally with deterministic order and retry semantics; no silent data loss.
- HLC malformed/missing envelope: reject server-side with canonical validation errors; retain local retry context.
- Assignment scope mismatch (farmer/plot not owned/assigned): fail closed with explicit scope-denial response.
- Duplicate client event replay: preserve idempotent behavior and avoid duplicate write side effects.

### Analytics/event coverage

- Capture lifecycle events:
  - assignment opened
  - record saved offline
  - sync attempted/succeeded/failed
  - sync rejected (validation/policy)
- Include actor role, tenant scope, assignment id, client event id, and HLC metadata for auditability.

### Acceptance mapping (v1)

- Offline-first capture remains usable without connectivity and preserves deterministic eventual sync.
- Sync conflict ordering aligns with HLC/idempotency acceptance requirements.
- Tenant/assignment boundary enforcement is explicit and testable for deny/allow paths.

### v1.6 architecture constraints (S1 applicability)

- **Offline conflict integrity:** in scope and mandatory (HLC ordering + idempotent sync behavior).
- **Spatial correctness:** not changed in this slice (no new polygon math/storage behavior).
- **Lineage performance:** not changed in this slice.
- **TRACES chunking resilience:** not changed in this slice.
- **GDPR shredding safety:** no behavior change; ensure no audit-link regression from capture telemetry.

## Execution slices

### S1 code slice 1 - sync envelope fail-closed + HLC validation coverage

- Backend sync endpoints now fail closed on missing tenant claim for `photos-sync`, `legal-sync`, and `evidence-sync`.
- Controller-level DB-backed integration coverage now asserts deny-without-tenant and allow-with-tenant behavior for those mobile sync metadata paths.
- DTO validation coverage now explicitly locks malformed HLC rejection and valid HLC acceptance for photos/legal/evidence sync envelopes.
- Idempotency envelope continuity is verified in tests by ensuring `clientEventId` fields are forwarded through sync controller calls.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts src/plots/dto/sync-envelope-validation.spec.ts`
- `npm run test:integration:ownership`

### S1 code slice 2 - API pipeline proof for tenant + HLC envelope

- Added DB-backed API integration coverage through Nest HTTP request pipeline (controller + guard override + ValidationPipe) for plot sync metadata endpoints.
- New integration assertions now verify:
  - missing tenant claim is denied (`403`) before sync writes
  - malformed HLC envelope is rejected (`400`) through DTO validation
  - valid sync envelope is accepted and persisted with `hlcTimestamp` + `clientEventId` metadata in audit payload.
- Ownership integration lane now includes this API-level sync envelope spec as a required run path.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/plots/sync-envelope.api.int.spec.ts`
- `npm run test:integration:ownership`

### S1 code slice 3 - sync ownership scope enforcement

- Plot sync metadata endpoints now enforce role + scope policy consistently:
  - only `farmer`/`agent` roles can execute sync metadata writes
  - farmer sync requests require owned plot scope (`isPlotOwnedByUser`) and fail closed on mismatch.
- DB-backed controller-scope integration now verifies farmer foreign-plot denial and agent allow behavior for sync metadata paths.
- API-level integration now includes ownership deny/allow flow through Nest HTTP pipeline (foreign farmer `403`, agent allow `201`) with tenant-safe context.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/plots/sync-envelope.api.int.spec.ts src/harvest/controller-scope.int.spec.ts`
- `npm run test:integration:ownership`

### S1 code slice 4 - assignment-aware agent sync scope

- Sync metadata DTO contracts now accept optional `assignmentId` so offline sync envelopes can carry explicit assignment scope context.
- Sync scope enforcement now requires:
  - `farmer`: owned plot scope (existing behavior)
  - `agent`: active assignment row matching `agent_user_id + plot_id (+ assignmentId when provided)`.
- Assignment check is fail-closed when assignment relation is unavailable, preventing role-only agent bypass on sync metadata writes.
- Integration suites now seed/verify assignment-bound agent allow paths and assignment-missing denial behavior.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts src/plots/dto/sync-envelope-validation.spec.ts`
- `npm run test:integration -- --runTestsByPath src/plots/sync-envelope.api.int.spec.ts src/harvest/controller-scope.int.spec.ts`
- `npm run test:integration:ownership`

### S1 code slice 5 - canonical assignment schema + contract publication

- Added canonical migration `tb_v16_010_agent_plot_assignment_scope.sql` to define `agent_plot_assignment` assignment scope relation and supporting indexes (`active` uniqueness + lookup composite index).
- OpenAPI draft now documents sync metadata endpoints:
  - `POST /v1/plots/{id}/photos-sync`
  - `POST /v1/plots/{id}/legal-sync`
  - `POST /v1/plots/{id}/evidence-sync`
- Request schemas now explicitly include sync envelope fields (`hlcTimestamp`, `clientEventId`) and optional `assignmentId` for assignment-aware policy semantics.
- Service-level regression coverage now includes fail-closed behavior when assignment relation is missing and positive assignment-match behavior.

Verification commands:

- `npm test -- src/plots/plots.service.spec.ts src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/plots/sync-envelope.api.int.spec.ts`
- `npm run test:integration:ownership`
- `npm run openapi:lint`

### S1 code slice 6 - assignment lifecycle transitions + typed error codes

- Added assignment lifecycle endpoints for management workflows:
  - `POST /v1/plots/{id}/assignments`
  - `PATCH /v1/plots/assignments/{assignmentId}/complete`
  - `PATCH /v1/plots/assignments/{assignmentId}/cancel`
- Role/tenant guardrails:
  - missing tenant claim fails closed
  - only `agent`/`exporter` roles can manage assignment lifecycle transitions.
- State transition semantics are now explicit and enforced with typed errors:
  - `ASN-001`: duplicate/active assignment conflict
  - `ASN-002`: assignment not found
  - `ASN-003`: invalid state transition (for example completed -> cancelled)
  - `ASN-004`: assignment relation unavailable (fail-closed infrastructure state).
- Added service/controller/unit + DB-backed integration coverage for lifecycle transitions and deny/allow policy boundaries.
- OpenAPI contract now includes assignment lifecycle paths and typed request/response schemas (`CreatePlotAssignmentRequest`, `UpdatePlotAssignmentStatusRequest`, `PlotAssignmentResponse`).

Verification commands:

- `npm test -- src/plots/plots.service.spec.ts src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm run test:integration:ownership`
- `npm run openapi:lint`

### S1 code slice 7 - dashboard lifecycle operator controls

- Plot detail page now includes an `Assignment Lifecycle` operator panel with create/complete/cancel controls wired to dashboard proxy routes.
- Added dashboard API proxies for assignment lifecycle backend paths:
  - `POST /api/plots/{id}/assignments`
  - `PATCH /api/plots/assignments/{assignmentId}/complete`
  - `PATCH /api/plots/assignments/{assignmentId}/cancel`
- Added ASN-aware operator guidance mapping in UI:
  - `ASN-001` duplicate assignment
  - `ASN-002` missing assignment
  - `ASN-003` invalid transition
  - `ASN-004` assignment relation unavailable.
- Added route/component test coverage for proxy behavior and UI error/success states, while preserving existing plot detail geometry-history integration coverage.

Verification commands:

- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "app/api/plots/assignments/[assignmentId]/complete/route.test.ts" "app/api/plots/assignments/[assignmentId]/cancel/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`

### S1 code slice 8 - assignment history listing + selection UX

- Backend now exposes assignment history read path for plot scope:
  - `GET /v1/plots/{id}/assignments`
  - role/tenant guarded to assignment-management roles.
- Dashboard proxy for plot assignments now supports both `GET` (history/list) and `POST` (create).
- Assignment lifecycle panel now loads and renders assignment history table (status/agent/timestamp) and supports click-to-fill assignment IDs for follow-up complete/cancel actions.
- Plot detail integration tests were updated to focus geometry-history request sequence even with additional assignment-history fetches.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 9 - assignment history pagination + filters

- Backend assignment history endpoint now supports server-side filtering/pagination:
  - `status` (`all|active|completed|cancelled`)
  - `fromDays` window
  - `agentUserId`
  - `limit` / `offset`
- Dashboard proxy now forwards assignment history query params to backend list endpoint.
- Assignment panel now includes:
  - status filter chips (`All/Active/Completed/Cancelled`)
  - agent ID text filter
  - `fromDays` numeric window control
  - previous/next pagination controls using backend totals.
- Plot detail integration test was hardened to target geometry-history request assertions without coupling to additional assignment-list fetches.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 10 - agent label enrichment + filter consistency checks

- Assignment history backend now enriches rows with `agentName` from `user_account` join to improve operator readability.
- Dashboard assignment table now displays `agentName (agentUserId)` when available, with UUID fallback otherwise.
- Added backend filter consistency assertions:
  - unit-level paged envelope expectations for status/fromDays/agent filters
  - DB-backed controller integration assertion that filtered totals remain consistent with returned rows.
- OpenAPI assignment response schema now includes nullable `agentName` for client contract parity.

Verification commands:

- `npm test -- src/plots/plots.service.spec.ts src/plots/plots.controller.spec.ts`
- `npm run test:integration -- --runTestsByPath src/harvest/controller-scope.int.spec.ts`
- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 11 - operator readability polish (email + status chips)

- Assignment history now includes optional `agentEmail` enrichment from backend assignment list responses when available.
- Operator table now renders visual status badges (`active/completed/cancelled`) for faster scanability under dense histories.
- Agent column now surfaces `agentName (UUID)` plus secondary email line when present, while retaining UUID fallback for sparse records.
- OpenAPI assignment response schema now includes nullable `agentEmail` for contract parity.

Verification commands:

- `npm test -- src/plots/plots.service.spec.ts src/plots/plots.controller.spec.ts`
- `npm test -- "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 12 - legend cues + filtered CSV handoff

- Assignment history now includes a compact status legend with inline tooltip guidance so operators can interpret `active/completed/cancelled` chips at a glance.
- Added `Export CSV` action that exports the currently filtered assignment history (status/fromDays/agent scope) by paging backend responses and producing a single downloadable handoff file.
- Export remains tenant-safe and filter-consistent because it reuses the same server-side filtered endpoint contract used by on-screen pagination.

Verification commands:

- `npm test -- "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 13 - backend CSV streaming path for assignments

- Added backend CSV mode to `GET /v1/plots/{id}/assignments` via `format=csv`, including tenant/role gates and export metadata header (`X-Export-Row-Count`).
- CSV export now pages server-side through filtered assignment history so exports can include full filtered sets beyond a single UI page.
- Dashboard proxy route now passes through CSV responses and headers, and panel export now requests backend CSV directly instead of rebuilding CSV in browser.
- OpenAPI now documents `format` query support (`json|csv`) for assignment history endpoint.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts src/harvest/controller-scope.int.spec.ts`
- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx" "app/plots/[id]/page.test.tsx"`
- `npm run openapi:lint`

### S1 code slice 14 - assignment export telemetry lifecycle

- Assignment CSV export now emits audit telemetry lifecycle events: `plot_assignment_export_requested`, `plot_assignment_export_succeeded`, and `plot_assignment_export_failed`.
- Telemetry payload captures tenant/user context, export filters (`status`, `fromDays`, `agentUserId`), row count on success, and error text on failures.
- Export telemetry is best-effort and non-blocking so operator export flow remains resilient even if telemetry persistence is temporarily unavailable.

Verification commands:

- `npm test -- src/plots/plots.controller.spec.ts src/harvest/controller-scope.int.spec.ts`
- `npm test -- "app/api/plots/[id]/assignments/route.test.ts" "components/plots/plot-assignment-lifecycle-panel.test.tsx"`

### S1 code slice 15 - assignment export diagnostics visibility

- Backend audit telemetry now exposes tenant-scoped assignment export activity reads at `GET /v1/audit/gated-entry/assignment-exports` for `plot_assignment_export_*` events.
- Dashboard analytics proxy now supports `eventKind=assignment_exports` and forwards paging/sort/time-window parameters to backend.
- Admin diagnostics now renders assignment export activity table with actor label, phase (`requested/succeeded/failed`), filter context, row count, and failure reason visibility.
- Assignment export telemetry now carries `exportedBy` identity metadata to improve actor attribution in diagnostics views.

Verification commands:

- `npm test -- src/audit/audit.controller.spec.ts src/plots/plots.controller.spec.ts`
- `npm test -- "app/api/analytics/gated-entry/route.test.ts"`

### S1 code slice 16 - assignment export diagnostics filtering + CSV

- Assignment export diagnostics now support backend/API filter forwarding for `phase` (`requested/succeeded/failed`) and assignment `status` (`active/completed/cancelled`).
- Admin diagnostics table now includes filter controls for assignment export phase/status, enabling targeted triage for failed or status-specific export traces.
- Added page-level CSV export for the filtered assignment export diagnostics table (`captured_at`, actor, phase, status, fromDays, agent, rowCount, error) for compliance handoff.

Verification commands:

- `npm test -- src/audit/audit.controller.spec.ts src/plots/plots.controller.spec.ts`
- `npm test -- "app/api/analytics/gated-entry/route.test.ts"`

### S1 code slice 17 - full filtered assignment-export CSV endpoint

- Backend now exposes full-range CSV export for assignment export telemetry at `GET /v1/audit/gated-entry/assignment-exports/export`.
- Export endpoint supports tenant-safe filters (`fromHours`, `sort`, `phase`, `status`) and returns row-count/truncation headers for operator observability.
- Dashboard analytics proxy now routes `eventKind=assignment_exports&format=csv` to this dedicated backend export endpoint.
- Admin diagnostics now supports both page-local CSV and full filtered export-all CSV for assignment export activity handoff.

Verification commands:

- `npm test -- src/audit/audit.controller.spec.ts`
- `npm test -- "app/api/analytics/gated-entry/route.test.ts"`

### S1 code slice 18 - assignment-export diagnostics pagination visibility

- Admin diagnostics assignment-export table now uses explicit server-driven pagination state (`page`, `pageSize`) instead of fixed first-page reads.
- Assignment export filters (`phase`, `status`) now reset diagnostics pagination to page 1 to avoid stale offsets after scope changes.
- Admin UI now surfaces total matching assignment export events and previous/next controls with page indicator for high-volume tenant triage.
- OpenAPI draft now publishes assignment export diagnostics endpoint contracts:
  - `GET /v1/audit/gated-entry/assignment-exports`
  - `GET /v1/audit/gated-entry/assignment-exports/export`
  including pagination/filter query params and CSV metadata response headers.

Verification commands:

- `npx eslint "apps/dashboard-product/app/admin/page.tsx"`
- `npm run openapi:lint`

### S1 code slice 19 - assignment-export OpenAPI typed event contract

- OpenAPI now defines dedicated assignment export telemetry schemas instead of reusing generic gated-entry telemetry event unions.
- `GET /v1/audit/gated-entry/assignment-exports` now returns `AssignmentExportTelemetryListResponse` with event discriminator mapping for:
  - `plot_assignment_export_requested`
  - `plot_assignment_export_succeeded`
  - `plot_assignment_export_failed`
- Added typed `AssignmentExportPayload` schema (`plotId`, `tenantId`, `exportedBy`, `rowCount`, `status`, `fromDays`, `agentUserId`, `error`) for stronger admin diagnostics/client contract validation.
- Published concrete example payload for assignment export list response aligned to the dedicated discriminator schema.

Verification commands:

- `npm run openapi:lint`

### S1 code slice 20 - assignment-export payload parity assertions

- Added backend service unit coverage to assert `appendAssignmentExportAuditEvent` persists assignment export telemetry payload fields exactly as documented (`status`, `fromDays`, `agentUserId`, `rowCount`, `error`, plus `plotId`, `tenantId`, `exportedBy`).
- Added normalization assertion to ensure optional payload values are explicitly emitted as `null` when omitted, preserving stable diagnostics/OpenAPI contract behavior.
- This locks runtime payload semantics for `plot_assignment_export_*` events against accidental drift in future refactors.

Verification commands:

- `npm test -- src/plots/plots.service.spec.ts`

### S1 code slice 21 - assignment-export query-surface parity integration

- Added DB-backed audit integration coverage proving `GET /v1/audit/gated-entry/assignment-exports` returns tenant-scoped `plot_assignment_export_*` events with expected payload contract keys.
- Integration assertion now verifies assignment export diagnostics payload fields at read surface (`tenantId`, `plotId`, `exportedBy`, `rowCount`, `status`, `fromDays`, `agentUserId`, `error`) and filters out cross-tenant telemetry rows.
- This complements service-unit payload assertions by validating end-to-end parity through persisted audit rows and controller query mapping.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`

### S1 code slice 22 - assignment-export combined filter integration

- Extended DB-backed audit integration coverage to assert combined `phase + status` filtering on assignment export diagnostics reads.
- New integration test now seeds mixed tenant/phase/status events and verifies `listAssignmentExports(..., phase='failed', status='active')` returns only the matching signed-tenant row.
- This locks SQL clause behavior for multi-filter diagnostics triage and prevents regressions where phase/status predicates could drift independently.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`

### S1 code slice 23 - assignment-export HTTP pipeline integration

- Added API-level integration coverage for `GET /v1/audit/gated-entry/assignment-exports` using a Nest app + auth-guard override + real Postgres-backed reads.
- New HTTP integration assertions cover:
  - `403` fail-closed behavior when tenant claim is missing.
  - combined `phase=failed` + `status=active` filtering across mixed tenant/phase/status seeded rows.
- This locks end-to-end request pipeline behavior (header claim parsing, query parsing, controller filtering, and response shape) beyond direct controller invocation tests.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/audit/audit.assignment-exports.api.int.spec.ts`

### S1 code slice 24 - assignment-export CSV HTTP pipeline integration

- Extended assignment-export API integration suite to cover `GET /v1/audit/gated-entry/assignment-exports/export` end-to-end.
- New HTTP assertion validates:
  - filtered CSV output for combined `phase=failed` + `status=active`
  - CSV response content shape (`captured_at,actor,phase,status,from_days,agent_user_id,row_count,error`)
  - export metadata headers (`X-Export-Row-Limit`, `X-Export-Row-Count`, `X-Export-Truncated`).
- This closes the API-lane contract gap for assignment-export diagnostics handoff and aligns backend runtime behavior with published OpenAPI export semantics.

Verification commands:

- `npm run test:integration -- --runTestsByPath src/audit/audit.assignment-exports.api.int.spec.ts`

### S1 post-closeout hardening slice 25 - offline queue retry visibility + local queue telemetry

- Offline app settings sync card now surfaces queue retry health (`pending`, `retrying`, `highest attempts`) and latest queue error context (action type + message) so field operators can distinguish transient offline backlog from repeatedly failing records.
- Pending sync processor now emits local audit telemetry for queue action outcomes:
  - `sync_queue_action_succeeded`
  - `sync_queue_action_failed`
  - `sync_queue_action_dropped_invalid`
- Queue drop paths now explicitly log reason codes (`invalid_payload_json`, `missing_plot_or_reason`, `unknown_action_type`) to support deterministic remediation and reduce opaque “silent drop” behavior in offline troubleshooting.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/sync/processPendingSyncQueue.ts"`

### S1 post-closeout hardening slice 26 - selective queue retry filters by action type

- Offline app Settings now includes queue retry action filters (`Harvest`, `Photos`, `Evidence`) so operators can target retries when bandwidth or time is constrained.
- Sync queue processor now accepts optional action-type scope and drains only selected queue actions while preserving canonical HLC ordering inside that subset.
- Sync feedback now includes retry-filter context to make selective retry runs explicit in operator-visible status messages.
- This improves exception recovery ergonomics without bypassing tenant/sync envelope controls: excluded queue actions remain pending for later retries.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/sync/processPendingSyncQueue.ts"`

### S1 post-closeout hardening slice 27 - per-action queue counts for selective retry planning

- Settings queue filter chips now show per-action pending counts (`Harvest (n)`, `Photos (n)`, `Evidence (n)`), computed from the current SQLite pending queue snapshot.
- Operators can now choose retry scope with immediate volume visibility, reducing guesswork during constrained-connectivity sync windows.
- This keeps selective retry state explicit and minimizes accidental starvation of high-priority queue classes by making backlog distribution visible before sync.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx"`

### S1 post-closeout hardening slice 28 - retry attempt-scope presets

- Settings sync queue controls now include attempt-scope presets:
  - `All attempts`
  - `Only retrying`
  - `Only first-attempt`
- Pending queue processing now accepts an attempt-scope parameter and filters queue rows before HLC-ordered drain, enabling targeted recovery sweeps without mutating queue state for excluded rows.
- Sync status feedback now includes both action-type filter and attempt-scope context, so operators can confirm exactly what subset was retried in each run.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/sync/processPendingSyncQueue.ts"`

### S1 post-closeout hardening slice 29 - smart retry sweep mode

- Settings now includes a `Smart sweep` queue mode that performs two ordered retry passes in one run:
  1) `retrying_only`
  2) `first_attempt_only`
- Smart sweep preserves existing queue safeguards by reusing the same queue processor and fail-closed behavior; excluded/remaining rows stay queued for future retries.
- Sync feedback now includes explicit pass labels (`pass 1/2`, `pass 2/2`) and scope context so operators can verify sweep sequencing and outcomes under weak connectivity.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/sync/processPendingSyncQueue.ts"`

### S1 post-closeout hardening slice 30 - smart sweep cap guardrail

- Smart sweep now supports a max-items guardrail per run (`Cap 25/50/100/200`) to prevent very large offline queues from triggering long blocking retries in one action.
- Queue processor now accepts optional `maxActions` and applies deterministic HLC-ordered truncation after action/attempt scoping, preserving stable processing semantics.
- Smart sweep pass budgeting now carries remaining capacity from pass `1/2` to pass `2/2`; when cap is fully consumed in pass 1, pass 2 is skipped with explicit operator feedback.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/sync/processPendingSyncQueue.ts"`

### S1 post-closeout hardening slice 31 - persisted smart-retry operator preferences

- Offline settings now persist sync queue retry preferences across sessions:
  - attempt scope (`syncQueueAttemptScope`)
  - smart sweep enabled flag (`syncQueueSmartSweepEnabled`)
  - smart sweep cap (`syncQueueSmartSweepCap`)
- On settings focus, stored preferences are re-hydrated before operator actions, preventing repeated manual reconfiguration after app restarts or navigation.
- Preference writes are best-effort and non-blocking (`setSetting(...)` fire-and-forget), preserving offline UX responsiveness while keeping default-safe fallback behavior.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx"`

### S1 post-closeout hardening slice 32 - one-tap retry preference reset

- Settings queue controls now include `Reset preferences` to instantly restore default retry profile:
  - attempt scope `all`
  - smart sweep disabled
  - smart sweep cap `100`
- Reset updates in-memory state and persisted settings keys in one action so operators can recover from stale or overly restrictive retry profiles without manual chip-by-chip changes.
- Reset behavior is non-blocking and local-only, preserving offline responsiveness while ensuring deterministic fallback defaults.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx"`

### S1 post-closeout hardening slice 33 - reset confirmation feedback

- Retry preference reset now emits immediate operator-visible confirmation in the sync status message area (`Queue retry preferences reset to defaults.`).
- This closes the feedback loop for local settings actions, reducing uncertainty about whether reset writes were applied on-device.
- Confirmation remains local/UI-only and does not alter queue contents or sync ordering semantics.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx"`

### S1 post-closeout hardening slice 34 - localized reset confirmation

- Queue retry reset confirmation now uses localized string resources (`sync_queue_preferences_reset`) instead of hard-coded English text.
- Added EN/ES translation entries so reset feedback remains language-consistent with existing sync status messaging.
- This keeps operator feedback parity across supported locales without changing queue behavior.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/state/LanguageContext.tsx"`

### S1 post-closeout hardening slice 35 - queue panel localization parity

- Migrated remaining queue-panel helper strings to i18n keys (retry filter summary, attempt-scope summary, smart-sweep pass labels, cap-reached note, queue-health summary, control labels).
- Added EN/ES translation coverage for queue action labels, attempt chips, and smart-sweep/reset controls to keep settings sync UX language-consistent.
- Queue processing behavior is unchanged; this slice is presentation/UX parity hardening only.

Verification commands:

- `npx eslint "apps/offline-product/app/(tabs)/settings.tsx" "apps/offline-product/features/state/LanguageContext.tsx"`

### S1 post-closeout hardening slice 36 - queue i18n smoke guard

- Added a lightweight queue-panel localization smoke script at `apps/offline-product/scripts/i18n-queue-panel.smoke.mjs`.
- Smoke script validates required queue i18n keys exist in both EN and ES locale maps inside `LanguageContext.tsx`, preventing accidental partial-key regressions.
- Added npm command `npm run i18n:queue:smoke` in `apps/offline-product/package.json` for quick local/CI invocation.

Verification commands:

- `npm run i18n:queue:smoke` (from `apps/offline-product`)

### S1 post-closeout hardening slice 37 - queue i18n smoke CI gate

- CI `app` lane now executes queue localization smoke command after lint:
  - `npm run i18n:queue:smoke`
- This upgrades queue i18n parity from local-only validation to automated pipeline enforcement in the Expo app quality lane.
- Gate sequencing remains lightweight (`lint` then smoke) and keeps offline app localization regressions fail-fast.

Verification commands:

- CI workflow: `Expo app lint` job in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 38 - queue i18n smoke CI summary visibility

- Expo app CI lane now appends a concise step summary block for queue i18n smoke gate execution (`Offline App Queue i18n Smoke`).
- Summary includes command reference and PASS status so reviewers can confirm localization gate execution without expanding raw logs.
- This improves CI observability while keeping gate behavior unchanged.

Verification commands:

- CI workflow summary output for `Expo app lint` job in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 39 - queue i18n smoke metadata summary

- Queue i18n smoke script now supports `--summary-json` and emits structured metadata:
  - `smokeVersion`
  - `requiredKeyCount`
  - locale set
- Expo app CI summary step now renders smoke version + required key count, improving drift visibility when queue localization scope expands.
- Human-readable smoke output now also includes smoke version marker (`v1`) to align local and CI evidence surfaces.

Verification commands:

- `npm run i18n:queue:smoke` (from `apps/offline-product`)
- `node ./scripts/i18n-queue-panel.smoke.mjs --summary-json` (from `apps/offline-product`)

### S1 post-closeout hardening slice 40 - queue i18n summary artifact lane

- Expo app CI lane now uploads queue i18n summary JSON as dedicated artifact:
  - `offline-app-queue-i18n-smoke-summary`
  - payload file: `apps/offline-product/queue-i18n-smoke-summary.json`
- This preserves machine-readable smoke metadata per run for easy longitudinal diffing (`smokeVersion`, `requiredKeyCount`, locale set).
- Artifact lane is non-invasive to gate semantics and runs after summary generation.

Verification commands:

- CI artifact list for `Expo app lint` job in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 41 - queue i18n previous-run delta summary

- Expo app CI lane now attempts to fetch the previous non-expired queue i18n summary artifact for the current branch.
- Summary publishing now includes previous-run availability plus key-count delta and previous smoke version, making localization-scope drift visible without downloading artifacts.
- Comparison logic is fail-safe: when no baseline artifact is found, summary reports `n/a` deltas and continues.

Verification commands:

- CI workflow summary output for `Expo app lint` job in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 42 - successful-run baseline filter for i18n delta

- Previous queue i18n baseline selection now inspects candidate workflow runs and accepts only artifacts from runs with `conclusion=success`.
- This reduces noisy drift baselines caused by failed/cancelled runs while preserving same-branch and non-expired artifact constraints.
- On run-inspection API errors, selection remains resilient by skipping the faulty candidate and continuing with older artifacts.

Verification commands:

- CI workflow baseline selection logs in `Fetch previous queue i18n smoke summary artifact` step (`.github/workflows/ci.yml`)

### S1 post-closeout hardening slice 43 - workflow-source baseline matching

- Previous queue i18n baseline selection now requires workflow-source affinity, preferring artifacts from runs whose workflow path matches the current workflow (`GITHUB_WORKFLOW_REF` path extraction).
- Added workflow-name fallback matching (`GITHUB_WORKFLOW`) when path metadata is unavailable, reducing cross-workflow baseline noise while preserving resilience.
- Combined with success-only + same-branch filtering, this narrows baseline provenance to comparable CI contexts for delta reporting.

Verification commands:

- CI workflow baseline selection logs in `Fetch previous queue i18n smoke summary artifact` step (`.github/workflows/ci.yml`)

### S1 post-closeout hardening slice 44 - baseline provenance in CI summary

- Queue i18n baseline fetch step now captures selected baseline metadata (`artifactId`, `runId`, `workflowPath`, `workflowName`) into a local metadata file.
- Queue i18n summary block now publishes baseline provenance fields directly:
  - baseline run id
  - baseline workflow path
  - baseline workflow name
- This makes previous-run delta context auditable without downloading artifacts or inspecting API traces.

Verification commands:

- CI workflow summary output for `Expo app lint` job in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 45 - baseline provenance artifact packaging

- Queue i18n CI artifact bundle now includes both:
  - `queue-i18n-smoke-summary.json` (current run snapshot)
  - `queue-i18n-baseline-metadata.json` (selected previous-baseline provenance)
- This keeps current metrics and comparison provenance co-located for downstream audit/evidence workflows.
- Artifact upload remains resilient even when baseline metadata is absent (fresh branch/no prior artifact).

Verification commands:

- CI artifact contents for `offline-app-queue-i18n-smoke-summary` in `.github/workflows/ci.yml`

### S1 post-closeout hardening slice 46 - queue i18n summary/baseline contract assertion

- Added assertion script `apps/offline-product/scripts/i18n-queue-summary-assert.mjs` to validate JSON contract shape for:
  - required current summary payload (`queue-i18n-smoke-summary.json`)
  - optional baseline metadata payload (`queue-i18n-baseline-metadata.json`) when present
- Added npm command `npm run i18n:queue:summary:assert` and wired CI Expo app lane to execute it after baseline fetch and before summary publishing.
- This locks machine-readable queue i18n artifact schema expectations for downstream automation consumers.

Verification commands:

- `node ./scripts/i18n-queue-panel.smoke.mjs --summary-json > queue-i18n-smoke-summary.json && npm run i18n:queue:summary:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 47 - baseline metadata schema versioning

- Queue i18n baseline metadata now includes explicit `schemaVersion` field (`1`) when emitted during CI baseline selection.
- Queue summary assertion now enforces `schemaVersion` presence/non-empty semantics for baseline payloads when baseline metadata exists.
- CI queue i18n summary now surfaces baseline metadata schema version for quick contract-evolution visibility.

Verification commands:

- `node ./scripts/i18n-queue-panel.smoke.mjs --summary-json > queue-i18n-smoke-summary.json && npm run i18n:queue:summary:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 48 - baseline metadata schema file + assert gate

- Added dedicated schema contract for queue i18n baseline metadata:
  - `docs/openapi/queue-i18n-baseline-metadata.schema.json`
- Added standalone baseline schema assertion script:
  - `apps/offline-product/scripts/i18n-queue-baseline-schema-assert.mjs`
  - npm command: `npm run i18n:queue:baseline:schema:assert`
- Wired assertion into Expo app CI lane after summary/baseline payload assertions, establishing governance-style contract enforcement for baseline metadata payload evolution.

Verification commands:

- `node ./scripts/i18n-queue-panel.smoke.mjs --summary-json > queue-i18n-smoke-summary.json && npm run i18n:queue:summary:assert && npm run i18n:queue:baseline:schema:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 49 - combined queue i18n report contract

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added a single combined queue i18n report payload (`queue-i18n-report.json`) that merges:
  - current smoke summary,
  - previous-run comparison fields,
  - selected baseline metadata provenance.
- Added report generator and schema assertion commands:
  - `npm run i18n:queue:report:generate`
  - `npm run i18n:queue:report:assert`
- Added schema contract file:
  - `docs/openapi/queue-i18n-report.schema.json`
- Wired generation + assertion steps into the Expo app CI lane and switched summary publication to read from the combined report.
- Extended artifact bundle so downstream consumers can fetch one machine-readable report file instead of assembling multiple payloads.

Verification commands:

- `node ./scripts/i18n-queue-panel.smoke.mjs --summary-json > queue-i18n-smoke-summary.json && npm run i18n:queue:summary:assert && npm run i18n:queue:baseline:schema:assert && npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 50 - combined report schema co-packaging

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Updated CI artifact packaging so the queue i18n combined report schema is uploaded with report payloads:
  - `docs/openapi/queue-i18n-report.schema.json`
- Added explicit CI presence guard before publishing artifact bundle:
  - `test -f ../../docs/openapi/queue-i18n-report.schema.json` (from Expo app lane working directory).
- Extended CI step summary to include the schema file reference used for the combined report contract.
- Keeps report consumer flow deterministic: one artifact now contains the report JSON and the exact schema contract used to validate it.

Verification command:

- `test -f ../../docs/openapi/queue-i18n-report.schema.json` (from `apps/offline-product`)

### S1 post-closeout hardening slice 51 - schema fingerprint provenance

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added deterministic schema fingerprint (`sha256`) to combined report payload:
  - new `schemaSha256` field in `queue-i18n-report.json`.
- Updated report schema contract to require fixed-length `schemaSha256`.
- Report generator now computes digest from `docs/openapi/queue-i18n-report.schema.json`.
- Report assertion now recomputes digest and fail-closes on mismatch.
- CI summary block now shows `Combined report schema sha256` for quick review provenance.

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 52 - digest format guardrail

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Tightened combined report digest validation in assertion script:
  - `schemaSha256` must match lowercase hex format `^[a-f0-9]{64}$`.
- Retains existing digest parity check against computed schema-file SHA-256.
- This adds early payload hygiene detection before parity comparison and keeps machine-consumer contract strict.

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 53 - digest algorithm contract field

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added explicit digest algorithm field to combined report contract:
  - new required `schemaDigestAlgorithm` field.
- Schema now locks digest algorithm to `sha256` (`const`) for deterministic contract semantics.
- Report generator now emits `schemaDigestAlgorithm: "sha256"` alongside `schemaSha256`.
- Report assertion now fail-closes unless `schemaDigestAlgorithm` equals `sha256`.
- CI summary block now publishes digest algorithm and digest value together.

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 54 - compact digest reference token

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added compact schema provenance field:
  - new required `schemaDigestRef` with format `sha256:<64-hex>`.
- Schema contract now requires `schemaDigestRef` pattern to match canonical token shape.
- Report generator now emits `schemaDigestRef` derived from `schemaDigestAlgorithm` + `schemaSha256`.
- Report assertion now validates `schemaDigestRef` shape and exact parity with computed schema digest.
- CI summary now includes digest reference token for low-friction copy/paste consumer checks.

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 55 - primary provenance key for consumers

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Documented and surfaced `schemaDigestRef` as the primary contract pin for downstream tooling; `schemaSha256` is explicitly compatibility-only.
- JSON Schema (`queue-i18n-report.schema.json`) now includes `description` on digest fields clarifying preferred vs compatibility semantics.
- CI step summary reorders combined-report lines: `schemaDigestRef` first, then schema file/version/algorithm, then raw hex last.
- Report assertion order updated to validate `schemaDigestRef` parity before raw hex (same logical gates, clearer consumer story).

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 56 - previous-run schema digest drift

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Baseline artifact download step now also extracts `queue-i18n-report.json` from the previous zip when present (`apps/offline-product/...` path first, then repo-root fallback), writing `queue-i18n-report-previous.json` beside the offline app working directory.
- Combined report `comparison` block now includes:
  - `previousReportAvailable` (parsed previous report object),
  - `previousSchemaDigestRef` (valid prior primary digest token, or null),
  - `schemaDigestRefChanged` (null when no comparable previous ref; otherwise boolean drift vs current `schemaDigestRef`).
- Report envelope `schemaVersion` bumped to `2` for this contract extension.
- CI summary publishes previous digest + drift fields for quick schema-evolution visibility.
- Assertion script enforces `schemaDigestRefChanged` null-iff semantics against `previousSchemaDigestRef`.

Verification command:

- `npm run i18n:queue:report:generate && npm run i18n:queue:report:assert` (from `apps/offline-product`)

### S1 post-closeout hardening slice 57 - previous smoke summary zip path parity

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Baseline artifact unzip step now resolves `queue-i18n-smoke-summary.json` using the same path strategy as `queue-i18n-report.json`:
  - prefer `apps/offline-product/queue-i18n-smoke-summary.json` (matches `upload-artifact` repo-root paths),
  - fallback to repo-root `queue-i18n-smoke-summary.json` for older or alternate layouts.
- If neither entry exists, the step removes any partial `queue-i18n-smoke-summary-previous.json` and logs a warning so downstream treat the run as having no previous smoke snapshot (consistent with missing file semantics).

Verification:

- CI: Expo app lane `Fetch previous queue i18n smoke summary artifact` step (see `.github/workflows/ci.yml`).

### S1 post-closeout hardening slice 58 - baseline zip listing when extract misses (step debug)

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- When either previous smoke summary or previous combined report path misses inside the downloaded baseline zip, and `ACTIONS_STEP_DEBUG` is `true`, CI now prints `unzip -l` for `queue-i18n-smoke-previous.zip` inside a collapsible log group.
- Uses a single `QUEUE_I18N_EXTRACT_FAIL` flag so listing runs at most once per step when any extraction failed.
- Intended for rare artifact layout surprises without noisy default logs.

Verification:

- Enable repository secret `ACTIONS_STEP_DEBUG` = `true` (GitHub docs: step debug logging), re-run workflow, inspect the Expo app baseline fetch step when extraction warnings occur.

### S1 post-closeout hardening slice 59 - ACTIONS_STEP_DEBUG env wiring for baseline diagnostics

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- The baseline artifact fetch step now passes `ACTIONS_STEP_DEBUG` from repository secrets into the step `env` so the shell guard (`[ "${ACTIONS_STEP_DEBUG}" = "true" ]`) matches GitHub’s documented step-debug switch. Without this, the secret is not visible to `run:` bash by default.
- Operator note: set repository secret `ACTIONS_STEP_DEBUG` to the literal string `true` when investigating zip layout; remove or clear when finished to avoid extra log volume elsewhere.

Verification:

- Confirm in `.github/workflows/ci.yml` that `Fetch previous queue i18n smoke summary artifact` includes `ACTIONS_STEP_DEBUG: ${{ secrets.ACTIONS_STEP_DEBUG }}` under `env:`.

### S1 post-closeout hardening slice 60 - single local verify command

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added npm script `i18n:queue:verify` in `apps/offline-product/package.json` that runs the full offline queue i18n gate chain in CI order:
  - smoke → summary JSON → summary assert → baseline schema assert (no-op if no baseline file) → combined report generate → report assert.
- Gives engineers one command parity with the documented manual pipe without re-typing redirects.
- Implementation note: slice 61 replaced the initial shell-chained `verify` with `scripts/i18n-queue-verify.mjs` (Node orchestration, no `>` redirect) for reliable local runs.

Verification command:

- `npm run i18n:queue:verify` (from `apps/offline-product`)

### S1 post-closeout hardening slice 61 - verify artifact clean

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added `apps/offline-product/scripts/i18n-queue-verify.mjs` to orchestrate the verify chain in Node (writes `queue-i18n-smoke-summary.json` from captured `--summary-json` stdout), avoiding shell redirects that can flake under nested `npm run`.
- Added `apps/offline-product/scripts/i18n-queue-verify-clean.mjs` to remove generated workspace JSON from the verify pipeline:
  - `queue-i18n-smoke-summary.json`
  - `queue-i18n-report.json`
- Added npm scripts:
  - `i18n:queue:clean` — remove those files if present (safe no-op when absent).
  - `i18n:queue:verify:clean` — run full `i18n:queue:verify` then clean.

Verification commands:

- `npm run i18n:queue:verify:clean` (from `apps/offline-product`)
- `npm run i18n:queue:clean` (after a manual verify, to drop artifacts only)

### S1 post-closeout hardening slice 62 - clean `--all` for optional replay artifacts

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Extended `i18n-queue-verify-clean.mjs` with `--all` to also remove optional local CI-parity files when present:
  - `queue-i18n-baseline-metadata.json`
  - `queue-i18n-smoke-summary-previous.json`
  - `queue-i18n-report-previous.json`
  - `queue-i18n-artifacts.json`
  - `queue-i18n-smoke-previous.zip`
- Added npm scripts: `i18n:queue:clean:all`, `i18n:queue:verify:clean:all`.
- Default clean (no flag) unchanged: only verify-generated summary + report JSON.

Verification commands:

- `npm run i18n:queue:clean:all` (from `apps/offline-product`)
- `npm run i18n:queue:verify:clean:all`

### S1 post-closeout hardening slice 63 - gitignore queue i18n local outputs

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added ignore rules in `apps/offline-product/.gitignore` for all known queue i18n local artifact filenames (verify outputs, baseline metadata, previous extracts, artifacts list, baseline zip) so routine `npm run i18n:queue:verify` does not dirty `git status`.
- Matches the cleanup lists in `i18n-queue-verify-clean.mjs` (default + `--all`).

Verification:

- Run `npm run i18n:queue:verify` from `apps/offline-product`, then `git status` — generated JSON/zip should not appear as untracked (same for optional replay files if created).

### S1 post-closeout hardening slice 64 - root npm scripts for queue i18n

Date: 2026-04-18  
Owner: Product engineering (offline sync lane)

Scope:

- Added repository-root `package.json` scripts that delegate to `apps/offline-product` via `npm run <script> --prefix apps/offline-product`:
  - `i18n:queue:smoke`
  - `i18n:queue:verify`
  - `i18n:queue:verify:clean`
  - `i18n:queue:verify:clean:all`
- Lets engineers run the same queue i18n gates from the monorepo root without `cd` (working directory for generated files remains `apps/offline-product`).

Verification:

- From repository root: `npm run i18n:queue:verify:clean` (expect PASS; artifacts under `apps/offline-product/` and gitignored there).

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

- Missing tenant claim on capture/sync routes must fail closed (`TEN-001`/`AUTH-001` alignment).
- Malformed HLC/client event envelope must reject with canonical validation semantics.
- Retryable sync failures must not drop queued records; terminal rejects must preserve correction context.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed for FEAT-002 S1 scope (no additional provider/protocol dependency introduced beyond existing platform stack).

## Status

Done (TB-V16-001 / FEAT-002)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
