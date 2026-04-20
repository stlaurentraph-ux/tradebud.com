# Geospatial mapping

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for geospatial mapping aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Polygon capture/edit/validation/review and source linkage.

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

Scope: geospatial ingestion and validation hardening for plot create/update, with tenant-safe enforcement and evidence-ready telemetry.

### Permission and tenant boundary matrix

- **Producer/Farmer roles:** may create/edit only own-tenant plot geometries.
- **Exporter/Sponsor admin roles:** may review/approve tenant plot geometry state but cannot bypass validation guards.
- **Cross-tenant requests:** must fail closed with tenant-claim enforcement (`TEN-001`).
- **Unsigned/missing tenant claim:** must reject before geometry processing (`AUTH-001`/`TEN-001`).

### State transition matrix

- `draft -> validated` when polygon passes `ST_MakeValid` + area variance guard.
- `draft -> rejected_invalid_geometry` on failed `ST_MakeValid` (`GEO-101`).
- `draft -> rejected_area_variance` when correction exceeds threshold (`GEO-102`).
- `validated -> superseded` only via forward-chained geometry revision (no in-place overwrite).

### Exception handling and recovery

- Invalid/self-intersecting geometry: attempt auto-fix with `ST_MakeValid`; reject if unrecoverable.
- Area variance guard breach: reject with explicit variance details and retry guidance.
- Backend unavailability on geometry write/read: fail closed, no local fallback persistence.
- Parsing/validation failures: emit canonical error codes without leaking tenant data.

### Analytics/event coverage

- Emit geometry lifecycle events aligned to canonical event families:
  - validation pass/fail
  - auto-fix attempted/applied
  - area variance rejection
  - revision supersession
- Capture actor role, tenant scope, plot id, and validation outcome metadata for auditability.

### Acceptance mapping (v1)

- Spatial acceptance aligns to `product-os/04-quality/acceptance-criteria.md` domain lines:
  - spatial integrity (`GEOGRAPHY`, polygon validity, area variance guard)
  - MVP readiness and release gating evidence
- Exception mapping aligns to `product-os/04-quality/exception-catalog.md`:
  - `GEO-101` invalid geometry autofix failed
  - `GEO-102` geometry area variance exceeded
  - `TEN-001` tenant boundary violations
  - `AUTH-001` auth/claim enforcement failures

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** in scope and mandatory (`GEOGRAPHY`, `ST_MakeValid`, area variance guard).
- **Offline HLC integrity:** not changed in S1; existing behavior must remain intact.
- **Lineage performance:** no runtime-lineage behavior changes in S1.
- **TRACES chunking resilience:** not changed in S1.
- **GDPR shredding safety:** no behavior change; ensure no regression in audit references.

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

- Plot create now enforces signed tenant claim fail-closed semantics at controller entry, matching `TEN-001`/`AUTH-001` boundary expectations.
- Polygon normalization rejection now emits explicit canonical codes:
  - `GEO-102` when `ST_MakeValid` correction variance exceeds 5%.
  - `GEO-101` when geometry cannot be normalized into a valid polygon result.
- Unit coverage now asserts both coded failure paths and tenant-claim denial semantics for plot create.
- Plot geometry revision flow now exists at `PATCH /v1/plots/:id/geometry` with immutable supersession audit (`plot_geometry_superseded`) and farmer scope enforcement.
- Geometry revision path reuses canonical coded validation failures (`GEO-101`, `GEO-102`) and tenant-claim fail-closed behavior before processing.
- Geometry revision history read path now exists at `GET /v1/plots/:id/geometry-history`, returning immutable audit-chain events (`plot_created`, `plot_geometry_superseded`) under tenant/scope checks.
- OpenAPI now documents this read contract at `/v1/plots/{id}/geometry-history` (`operationId: getPlotGeometryHistory`).
- Geometry history response is now typed in backend/OpenAPI (`PlotGeometryHistoryEvent` + payload schema) instead of unstructured raw objects, improving contract stability for dashboard consumers.
- Geometry history mapping now has dedicated service-unit coverage for timestamp normalization, event-type coercion fallback, and payload/plotId fallback behavior.
- Geometry history now has DB-backed controller integration coverage for tenant-claim fail-closed behavior and farmer ownership allow/deny boundaries.
- Geometry history OpenAPI now includes concrete `200` examples for both `plot_created` and `plot_geometry_superseded` audit events to improve consumer onboarding and contract review clarity.
- Geometry history controller tests now assert stable camelCase response envelope fields on the allow path (`eventType`, `userId`, `deviceId`, payload shape), preventing accidental snake_case regressions.
- Dashboard now has a dedicated geometry-history proxy route (`/api/plots/[id]/geometry-history`) with fail-closed backend URL enforcement, auth-header pass-through, and contract-preserving response-shape tests.
- Dashboard FEAT-003 read-path usability slice is now active: `usePlotGeometryHistory` hook plus `PlotGeometryHistoryPanel` UI component render loading/error/empty/data states on the plot detail route with component-level test coverage.
- Geometry history panel now supports event-type filtering (`all`/`created`/`revised`) and displays result-cap visibility (`max 100 from API`) so long histories remain scannable.
- Geometry history now supports true server-side pagination (`limit`/`offset`) across backend API, dashboard proxy, and hook/UI state (`items`, `total`, `page`), with updated tests and OpenAPI contract examples.
- Geometry history now supports timeline sort direction (`sort=desc|asc`) end-to-end (backend/proxy/hook/panel), allowing operators to switch between newest-first and oldest-first investigation flows.
- DB-backed controller integration now asserts persisted geometry-history sort behavior (`desc` vs `asc`) to prove chronology ordering semantics beyond unit tests.
- Geometry history UI now resets pagination to page 1 whenever chronology direction is toggled (`Newest`/`Oldest`), preventing stale offset confusion during investigations.
- Hook-level regression coverage now asserts geometry-history query construction across state transitions (`page` + `sort`) including auth-header forwarding and expected `limit/offset/sort` combinations.
- Plot detail route now has integration-level UI test coverage verifying end-to-end request sequence (`desc` first load -> `asc` on Oldest -> next-page offset) when operators interact with chronology + pagination controls.
- Geometry history panel now has lightweight visual snapshot coverage for loading/error/empty states to detect unintended layout/content drift during UI refinements.
- Snapshot governance now includes CI-backed registry validation (`openapi:governance:snapshot:registry:check`) to ensure snapshot-backed feature rows keep required command fields.
- Snapshot governance now emits a versioned JSON compliance report (`openapi-snapshot-registry-report.json`) with schema/assert CI gates and artifact publishing for run-over-run trend visibility.
- Governance trend artifacts now aggregate snapshot-registry telemetry (`PASS/FAIL` counts and row-volume deltas) alongside presentation drift, giving one multi-signal trend surface per contracts run.
- FEAT-003 S2 operational UX slice now persists investigator geometry-history presets (`filter`, `sort`) per user+plot, reducing repetitive control setup during repeated case reviews.
- FEAT-003 S2 anomaly surfacing is now active in geometry history: panel highlights large revision jumps (high `correctionVariancePct`) and frequent supersessions (rapid successive revisions) to accelerate operator triage.
- FEAT-003 S2 analyst timeline grouping now groups geometry events by day with visible investigation signals and preserved immutable chronology controls.
- FEAT-003 S2 investigation regression coverage now includes preset restore behavior, anomaly flag derivation, grouped timeline rendering, and updated snapshot baselines for operator-facing panel states.
- FEAT-003 S2 anomaly contract hardening now computes and returns anomaly metadata server-side in `GET /v1/plots/{id}/geometry-history` (`anomalies[]`), so dashboard and evidence consumers share one canonical triage signal source.
- FEAT-003 S2 anomaly sensitivity controls now support `anomalyProfile` (`strict`, `balanced`, `lenient`) end-to-end (backend/proxy/hook/panel), enabling investigator teams to tune signal density without changing immutable audit data.
- FEAT-003 S2 operator ergonomics now include `Signals only` toggle and automatic page reset when anomaly profile changes, preventing stale-offset confusion during sensitivity-mode transitions.
- FEAT-003 S2 anomaly-focused traversal now supports backend `signalsOnly=true` pagination so operators can review flagged revisions exhaustively across long histories (not only within currently loaded mixed-event pages).
- FEAT-003 S2 anomaly observability now includes `anomalySummary` totals (severity/type breakdown) in geometry-history responses, and the panel surfaces this compact triage context for faster analyst handoffs.
- FEAT-003 S2 summary interpretability now includes `anomalySummaryScope` (`current_page` vs `full_filtered_set`) so operators can distinguish page-local counts from full filtered anomaly counts during handoff/export review.
- FEAT-003 S2 pagination-safety now resets to page 1 when toggling `Signals only`, preventing stale-offset confusion when switching between mixed and anomaly-only timeline views.
- FEAT-003 S2 operator continuity now remembers last page per view mode (`mixed` vs `signalsOnly`) so investigators can toggle focus without losing place in long reviews.
- FEAT-003 S2 continuity-persistence now stores per-mode page memory (`mixed`/`signalsOnly`) in per-user+plot presets with integer/safe-min normalization so investigators keep context across reloads without invalid page bookmarks.
- FEAT-003 S2 continuity-bounds now clamps restored mode bookmarks to current pagination limits so changing result totals do not reopen operators on invalid pages.
- FEAT-003 S2 continuity-governance now centralizes page-bounds clamping in `usePlotGeometryHistory` so mode-restore flows share one canonical pagination-validity rule.
- FEAT-003 S2 pagination-guardrails now route all hook `setPage` transitions through canonical bounds enforcement, preventing out-of-range page state across all pagination controls.
- FEAT-003 S2 filter-pagination safety now resets page to 1 on event-type filter changes, preventing stale offsets when investigators tighten timeline scope.
- FEAT-003 S2 filter continuity now remembers last page per filter view (`all`, `plot_created`, `plot_geometry_superseded`) and restores it on filter switches for faster deep-triage pivots.
- FEAT-003 S2 hybrid-view continuity now tracks page memory per combined filter+signal mode key, so `signalsOnly` toggles and filter switches both restore precise investigation context.
- FEAT-003 S2 hybrid-memory cleanup now uses combined view keys as the active continuity source while legacy mode/filter memories are read only for migration fallback.
- FEAT-003 S2 legacy-memory retirement now removes mode/filter memory fields from active hook contract, keeping hybrid view keys as the sole persisted bookmark model.
- FEAT-003 S2 migration observability now increments a local legacy-fallback counter when old preset fields are used, enabling evidence-based removal timing for compatibility parsing.
- FEAT-003 S2 migration visibility now surfaces legacy fallback count in the geometry-history panel so operators can verify compatibility usage without localStorage inspection.
- FEAT-003 S2 migration operability now includes a panel reset action for legacy fallback counter so operators can clear baseline after review windows.
- FEAT-003 S2 migration reset safety now requires explicit in-panel confirmation before clearing the counter, reducing accidental diagnostic baseline loss.
- FEAT-003 S2 high-signal reset hardening now requires typed `RESET` confirmation when migration count is elevated, preventing accidental clears during sensitive review windows.

## Second execution slice (S2)

Scope: operational investigation UX acceleration for geometry revision analysis while preserving canonical tenant/auth boundaries and immutable audit semantics.

### Permission and tenant boundary matrix

- Preset persistence is scoped by authenticated user id and plot id (`user+plot` keying), preventing cross-user preference leakage.
- No changes to backend role checks or tenant claim enforcement; all history reads still go through authenticated geometry-history route and existing fail-closed guards.

### State transition matrix

- No new plot lifecycle states introduced in S2.
- Investigator interaction state now includes sticky panel preferences (`filter` + `sort`) restored on revisit to the same plot.
- Investigator interaction state now also persists mode bookmarks (`mixed` and `signalsOnly` page positions) per user+plot to survive reloads.
- Timeline presentation state now supports grouped/day-bucket view without mutating canonical event order.

### Exception handling and recovery

- Invalid/missing local preset JSON falls back safely to defaults (`filter=all`, `sort=desc`).
- Invalid/non-finite mode-memory values are sanitized to bounded positive integers before use (`>= 1`) to prevent malformed preset state from breaking pagination.
- Restored mode bookmarks are now clamped to current max page (`ceil(total/pageSize)`) during mode toggles, preventing out-of-range jumps after filtered totals shrink.
- Pagination bound enforcement now routes through hook-level `clampPage(...)`, reducing duplicate UI-level guard logic and future drift risk across investigation controls.
- Hook-level `setPage(...)` now enforces page bounds when totals are known (and minimum-1 when unknown), so pagination controls preserve valid offsets without relying on caller-specific clamping.
- Filter control transitions now align with sort/profile/signals reset semantics by returning to page 1, preserving predictable investigation navigation behavior.
- Filter page-memory is persisted per user+plot preset and sanitized to positive integers, so per-filter bookmarks survive reloads without invalid page values.
- Combined view bookmarks (`<filter>|<mixed|signals>`) are now persisted per user+plot and bounded through canonical clamp logic, avoiding drift between mode-only and filter-only memory paths.
- Legacy preset migration now seeds hybrid view memory from older mode/filter bookmarks, enabling non-breaking continuity when prior sessions lacked combined view keys.
- Hook response contract now excludes legacy memory fields, reducing state duplication and preventing new callers from coupling to deprecated bookmark structures.
- Legacy-fallback telemetry is best-effort and side-effect safe (does not block history load), preserving fail-safe UX while adding migration visibility.
- Hook now exposes `legacyViewFallbackCount` and panel renders it conditionally, keeping migration diagnostics visible yet non-invasive during normal investigations.
- Hook now exposes `resetLegacyViewFallbackCount` to clear local counter state/storage, supporting repeatable release-evidence checkpoints without manual storage edits.
- Reset flow now includes `Confirm reset` / `Cancel` step so destructive diagnostics actions are intentional and reversible before commit.
- Elevated-count reset flow (`>=10`) now enforces typed confirmation before enabling effective reset, adding proportional safety to high-impact telemetry baselines.
- If user identity is unavailable, presets are not written, preserving fail-safe behavior without blocking history retrieval.
- Anomaly extraction tolerates partial payloads and only flags when required fields are present/parseable.

### Analytics/event coverage

- Existing immutable audit events remain source-of-truth for anomaly derivation (`plot_created`, `plot_geometry_superseded`).
- No new backend analytics events added in this slice; S2 focuses on investigator/operator consumption speed and triage fidelity.

### Acceptance mapping (v1)

- Faster operator triage via saved controls and anomaly-first scan supports FEAT-003 usability while respecting immutable audit history requirements.
- S2 tests now tighten investigation workflow acceptance with explicit assertions for preset restore, anomaly flags, and grouped timeline visibility.

### Snapshot review checklist (geometry-history panel)

Use the shared template in `product-os/04-quality/release-qa-evidence.md` (`Snapshot Diff Review Template`) for expected/suspicious snapshot signals and reviewer actions.

FEAT-003 specific commands:

- Snapshot test: `npm test -- "components/plots/plot-geometry-history-panel.test.tsx"`
- Companion behavior test: `npm test -- "app/plots/[id]/page.test.tsx"`

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Post-closeout hardening slice (2026-04-16)

### S3 code slice 1 - historical deforestation decision contract baseline

- Added deterministic decision endpoint at `POST /v1/plots/{id}/deforestation-decision?cutoffDate=YYYY-MM-DD` for agent/exporter roles.
- Decision verdicts are now explicit and auditable:
  - `no_deforestation_detected`
  - `possible_deforestation_detected`
  - `unknown`
- Implementation reuses tenant-safe plot geometry retrieval and executes provider query through GFW historical query mode (with optional SQL-template cutoff injection) plus radar fallback when primary output is unparsable.
- Immutable audit evidence now includes `plot_deforestation_decision_recorded` with `plotId`, `cutoffDate`, verdict, provider mode, and normalized alert summary.
- Added controller/service unit coverage for role gating, cutoff date validation, deterministic verdict mapping, and fallback behavior.
- OpenAPI draft now publishes `/v1/plots/{id}/deforestation-decision` response contract.

### S3 code slice 2 - deforestation decision history read surface

- Added immutable history endpoint at `GET /v1/plots/{id}/deforestation-decision-history` to return `plot_deforestation_decision_recorded` evidence events for operator review.
- Decision history includes event metadata (`timestamp`, `user_id`, `device_id`) and payload fields (`cutoffDate`, `verdict`, provider mode, normalized summary) for audit continuity.
- Added controller unit coverage for service forwarding and OpenAPI publication for the decision history read contract.

### S3 code slice 3 - dashboard decision-evidence visibility + DB integration proof

- Added dashboard proxy route `GET /api/plots/[id]/deforestation-decision-history` with fail-closed backend URL handling and auth-header pass-through tests.
- Added plot-detail operator panel `PlotDeforestationDecisionHistoryPanel` backed by `usePlotDeforestationDecisionHistory`, showing cutoff date, verdict, alert summary, and provider mode per immutable decision event.
- Plot detail route now renders decision history panel alongside geometry and assignment investigation panels.
- Added DB-backed API integration proof asserting `GET /v1/plots/{id}/deforestation-decision-history` returns persisted `plot_deforestation_decision_recorded` audit evidence rows in test schema.

### S3 code slice 4 - plot-detail run-decision action + auto-refresh

- Added dashboard proxy route `POST /api/plots/[id]/deforestation-decision?cutoffDate=YYYY-MM-DD` forwarding to backend decision endpoint with auth pass-through and fail-closed env guard.
- Extended deforestation decision history hook to expose `runDecision(cutoffDate)` and `reload()` so successful decision writes automatically trigger history refresh.
- Added operator action controls in `PlotDeforestationDecisionHistoryPanel`:
  - cutoff date input
  - run decision action button
  - success/error inline feedback
- Added hook and panel test coverage proving run action calls POST endpoint and refreshes decision history after successful response.

### S3 code slice 5 - run retry + last-run metadata chip

- Extended `usePlotDeforestationDecisionHistory.runDecision(cutoffDate)` to return typed run result metadata (`cutoffDate`, `verdict`, `providerMode`) while keeping auto-refresh semantics after successful runs.
- Added decision panel operability hardening:
  - shows a `Last run` metadata chip after successful execution (cutoff, verdict, provider mode)
  - shows a contextual `Retry` action when a run fails, preserving the same cutoff input for rapid re-execution
- Added panel regression coverage for both new behaviors (metadata visibility and retry affordance after failure).

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed for FEAT-003 scope (no unresolved provider/protocol blockers remain in this feature slice).

## Status

Done (TB-V16-002 / FEAT-003)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
