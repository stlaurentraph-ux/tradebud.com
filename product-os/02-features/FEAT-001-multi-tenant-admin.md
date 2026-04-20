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

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

- Inbox proxy routes must fail closed when backend is unavailable (`503`) rather than silently reading/writing local in-memory data.
- Tenant-bound operations (`list`, `respond`, `bootstrap`) must remain signed-claim backed end-to-end (dashboard API proxy to backend controller/service).
- DB-backed inbox controller integration coverage now includes tenant-claim denial/allow and exporter bootstrap role policy assertions (`src/inbox/inbox.controller.int.spec.ts`, env-gated by `TEST_DATABASE_URL`).
- Backend integration scripts now auto-load `TEST_DATABASE_URL` from root `.env.local` when missing in shell (`scripts/run-with-root-test-db.mjs`) for consistent local DB-backed execution.
- DB-backed controller-scope integration now also asserts tenant-claim + exporter-role enforcement for harvest package list/detail/TRACES export endpoints (`src/harvest/controller-scope.int.spec.ts`), closing an additional package-surface policy proof gap.
- DB-backed controller-scope integration now also covers package submit policy (`PATCH /v1/harvest/packages/:id/submit`) with tenant-claim + exporter-role deny/allow assertions, completing package-surface controller policy parity.
- Dashboard RBAC tests now include mixed feature-gate role-path assertions for importer and country-reviewer navigation visibility to prevent deferred-route regressions by role.
- Middleware route-entry redirects for gated paths now carry explicit gate context (`gate=request_campaigns|annual_reporting`) in query params for diagnostics and analytics-safe attribution while preserving existing query params.
- Dashboard landing now emits one-time session-scoped telemetry to dedicated endpoint `/api/analytics/gated-entry` when redirected from deferred routes (`feature=mvp_gated` + known `gate`), enabling gated-entry tracking without duplicate spam.
- Gated-entry telemetry route now forwards events to backend audit ingestion (`/v1/audit`) when `TRACEBUD_BACKEND_URL` is configured and propagates Authorization header from client session token (`tracebud_token`) for tenant-authenticated capture.
- Backend audit API now exposes tenant-scoped gated-entry telemetry listing at `GET /v1/audit/gated-entry`, filtered to `event_type='dashboard_gated_entry_attempt'` and current tenant claim for query-safe diagnostics.
- Dashboard analytics route now also proxies telemetry reads via `GET /api/analytics/gated-entry` to backend `GET /v1/audit/gated-entry` with fail-closed `503` semantics and Authorization header pass-through.
- Admin panel now includes a deferred-route diagnostics card that consumes `GET /api/analytics/gated-entry`, with loading/error/empty states and manual refresh for tenant-level visibility into gated-entry attempts.
- Admin diagnostics card now supports gate/time-window filters, pagination, and token-health hinting for backend auth failures so operators can triage telemetry access issues faster.
- Telemetry read path now supports server-side query controls (`gate`, `fromHours`, `limit`, `offset`) from dashboard proxy through backend `GET /v1/audit/gated-entry`, reducing client-side filtering load for larger datasets.
- Telemetry query controls now include validated timestamp sort order (`sort=desc|asc`) end-to-end (dashboard hook -> analytics proxy -> backend audit endpoint), and admin diagnostics exposes explicit newest/oldest ordering for operator triage.
- Admin telemetry diagnostics now also includes saved filter presets and page-level CSV export to speed incident triage/handoff while keeping tenant-scoped API semantics unchanged.
- Admin telemetry diagnostics now supports full-range "Export All CSV" using paginated backend reads (`limit`/`offset` traversal with active `gate`/`fromHours`/`sort` filters), so operators can hand off complete filtered evidence sets.
- Backend telemetry export path now supports server-generated CSV (`GET /v1/audit/gated-entry/export` proxied by dashboard) so admin "Export All CSV" is filter-aware without client-side pagination loops.
- CSV export path now emits export metadata (`X-Export-Row-Count`, `X-Export-Row-Limit`, `X-Export-Truncated`) so admin diagnostics can warn operators when exports hit safety caps and require narrower filters.
- Backend now appends `dashboard_gated_entry_exported` audit events for CSV exports (tenant/gate/time-window/sort/rowCount/truncated metadata), improving traceability of diagnostics evidence handoffs.
- Admin diagnostics now surfaces recent tenant-scoped export activity (timestamp, gate, rowCount/rowLimit, sort, truncated) by reading `dashboard_gated_entry_exported` events through a dedicated telemetry read path.
- Export activity rows now include actor attribution (`exportedBy` from signed session identity) so operators can see who generated each evidence export.
- Actor attribution now falls back to `user:<id>` and admin table fallback to `user_id` when email is unavailable, reducing unresolved `unknown` export rows.
- Admin diagnostics now enriches `user:<id>` / `user_id` export actors against loaded tenant user directory data, displaying human-friendly `name (email)` where available.
- Export actor enrichment is now hook-level (`useGatedEntryExportEvents`) via directory fetch, so actor resolution no longer depends on any single page-local user snapshot.
- Export actor directory lookups are now cached with a short TTL in the export-events hook and invalidated on manual refresh, reducing repeated user-list fetches during rapid diagnostics polling.
- Export actor directory cache now also invalidates/reacts on admin-data mutation events, so actor labels refresh automatically after user/role/status changes without waiting for TTL expiry.
- Mutation-triggered export-feed reloads are now debounced in the hook to coalesce bursty admin edits into a single refresh and avoid redundant telemetry fetches.
- Added opt-in export-hook debug counters/logging (`tb:debug:telemetry=1` in sessionStorage) to observe mutation events, debounce flushes, and fetch loads during diagnostics tuning.
- Admin diagnostics now includes an explicit debug toggle button (`Debug: On/Off`) that sets session telemetry debug mode without requiring console commands.
- When debug mode is enabled, admin diagnostics now surfaces live export-hook counters (`mutationEvents`, `debounceFlushes`, `fetchLoads`) as an in-card status line for quick tuning feedback.
- Export actor attribution now prefers backend-authoritative resolution via tenant-scoped actor lookup endpoint (`eventKind=actors` -> `/v1/audit/gated-entry/actors`), with local directory map retained only as fallback.
- Debug counter statusline now updates event-driven via export-hook subscriptions (no interval polling), reducing UI refresh overhead while keeping live diagnostics visibility.
- DB-backed audit integration now explicitly covers tenant-scoped actor resolution (`/v1/audit/gated-entry/actors`) to prevent cross-tenant label leakage in export diagnostics.
- Backend actor resolution now enriches from canonical `user_account` name fallback (after `exportedBy`) under tenant-scoped export-event filtering, improving identity quality without weakening isolation.
- Backend actor lookup now validates requested `ids` as UUID-shaped values and rejects malformed input early (`400`) to avoid DB-cast error paths and improve fail-closed behavior.
- Actor lookup contract examples:
  - Valid: `GET /api/analytics/gated-entry?eventKind=actors&ids=11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222` -> `200 { "actors": { "...": "name-or-email", "...": "user:<id>" } }`
  - Invalid: `GET /api/analytics/gated-entry?eventKind=actors&ids=not-a-uuid` -> `400 { "error": "ids must be UUID values." }`
- DB index support for telemetry query paths is now defined in `tracebud-backend/sql/tb_v16_004_audit_gated_entry_index.sql`, and audit integration coverage asserts the index signature used by tenant/gate lookups.
- Telemetry event contract now uses discriminator-based schema typing in OpenAPI (`GatedEntryTelemetryEvent` as `oneOf` `GatedEntryAttemptEvent` / `GatedEntryExportedEvent`), and backend unit coverage asserts export audit payload contract fields to catch shape drift early.
- CI now includes a dedicated OpenAPI contract lint gate (`npm run openapi:lint` in `.github/workflows/ci.yml`) so schema-level contract regressions fail before release packaging.
- Telemetry audit/export OpenAPI operations now include explicit `operationId` values (`listGatedEntryTelemetry`, `exportGatedEntryTelemetryCsv`, `listGatedEntryExportActivity`, `resolveGatedEntryActors`, plus related audit export IDs), establishing stable client codegen-friendly identifiers for this slice.
- OpenAPI warning-debt reduction started for Requests domain: `/v1/requests/campaigns*` operations now include explicit `operationId` values and baseline `4xx` responses, reducing lint warning count while preserving draft-level flexibility elsewhere.
- OpenAPI warning-debt reduction expanded to Plots domain: `/v1/plots` and `/v1/plots/{id}/geometry-versions` now include explicit `operationId` values and baseline `4xx` responses, continuing progressive contract-quality hardening.
- OpenAPI warning-debt reduction expanded to Evidence domain: `/v1/evidence-documents` and `/v1/evidence-documents/{id}/parse-status` now include explicit `operationId` values and baseline `4xx` responses for clearer client/error contracts.
- OpenAPI warning-debt reduction expanded to Consent + Compliance Exports domains: `/v1/consent-grants*` and `/v1/compliance-exports*` now include explicit `operationId` values and baseline `4xx` responses to improve codegen stability and error-contract clarity.
- OpenAPI warning-debt reduction expanded to Batches domain: `/v1/batches*` endpoints now include explicit `operationId` values and baseline `4xx` responses, continuing progressive contract hardening.
- OpenAPI warning-debt reduction expanded to Reviews domain: `yield-exception` and `dedup-review` endpoints now include explicit `operationId` values and baseline `4xx` responses for consistent review-workflow error contracts.
- OpenAPI warning-debt reduction expanded to Shipments domain: `/v1/shipment-headers*` endpoints now include explicit `operationId` values and baseline `4xx` responses, improving shipment workflow contract clarity.
- OpenAPI warning-debt reduction expanded to DDS domain: `/v1/dds-records/*` endpoints now include explicit `operationId` values and baseline `4xx` responses while preserving existing `409`/`422` state-validation semantics.
- OpenAPI warning-debt reduction expanded to Sync domain: `/v1/sync/flush` and `/v1/sync-conflicts/{id}/resolve` now include explicit `operationId` values and baseline `4xx` responses for conflict-recovery workflow clarity.
- OpenAPI warning-debt reduction expanded to Portability domain: `/v1/portability-requests` and `/v1/portability-requests/{id}/download` now include explicit `operationId` values and baseline `4xx` responses for portability flow consistency.
- OpenAPI warning-debt reduction expanded to annual reporting domain: `/v1/annual-reporting-snapshots/generate` and `/v1/annual-reporting-snapshots/{id}` now include explicit `operationId` values and baseline `4xx` responses for snapshot workflow consistency.
- OpenAPI warning-debt reduction expanded to compliance-issues domain: `/v1/compliance-issues*` endpoints now include explicit `operationId` values and baseline `4xx` responses for issue-lifecycle workflow consistency.
- OpenAPI warning-debt reduction expanded to billing + webhooks domains: `/v1/billing*` and `/v1/webhooks*` endpoints now include explicit `operationId` values and baseline `4xx` responses for payment and delivery-observability workflow consistency.
- OpenAPI contract policy is now stricter: `operation-operationId` and `operation-4xx-response` are promoted to error in `.redocly.yaml`; remaining legacy endpoints were aligned (organisations/producers/member invites + audit/access export 4xx coverage) so strict lint remains green.
- OpenAPI metadata baseline is now complete: draft includes explicit license metadata, non-placeholder production/sandbox server URLs, and descriptions for all tags, bringing strict lint to zero warnings.
- CI contract observability is now improved: contracts job publishes OpenAPI lint status and warning count to GitHub job summary for trend tracking across runs.
- OpenAPI CI trend governance is now baseline-aware: contracts summary now reports errors/warnings against `docs/openapi/lint-baseline.json` with deltas, and uploads per-run metrics artifact (`contracts-openapi-lint-metrics`) for auditability.
- OpenAPI baseline refresh is now explicitly guarded: `npm run openapi:baseline:refresh` requires `OPENAPI_BASELINE_APPROVED=true` and a non-trivial `OPENAPI_BASELINE_REASON`, then re-runs strict lint before updating baseline metadata.
- OpenAPI baseline refresh CI lane is now manual-approval-gated: `OpenAPI Baseline Refresh` workflow (`workflow_dispatch`) requires an explicit boolean approval input plus reason, executes the same guarded refresh command, and publishes refreshed baseline as workflow artifact.
- OpenAPI baseline refresh adoption is now PR-controlled in CI: manual refresh workflow auto-opens a review PR with only `docs/openapi/lint-baseline.json` changes, preserving protected-branch governance and audit trail.
- OpenAPI baseline governance now has reviewer ownership enforcement: `.github/CODEOWNERS` requires designated owner review for baseline file and baseline-refresh workflow changes.
- OpenAPI governance ownership scope is now parity-complete: CODEOWNERS also protects `.redocly.yaml` and `docs/openapi/tracebud-v1-draft.yaml` so contract policy/spec edits follow the same reviewer gate as baseline automation.
- OpenAPI governance now includes explicit branch-protection verification guidance: release QA evidence contains a checklist linking CODEOWNERS-protected paths to required-code-owner-review branch settings and PR-level verification evidence.
- OpenAPI governance evidence capture is now template-driven: release QA evidence includes a preformatted “Completed evidence” section (PR URL/timestamps/reviewer outcome) to speed and standardize branch-protection verification signoff.
- OpenAPI governance ownership now has CI drift protection: contracts lane runs `openapi:governance:check` to fail fast if required CODEOWNERS OpenAPI protection entries are removed.
- OpenAPI governance check now hard-pins owner handles: CI fails if protected OpenAPI paths are present but missing expected CODEOWNERS owner (`@stlaurentraph-ux`), reducing reviewer-route drift risk.
- OpenAPI governance owner policy is now single-source: required protected paths and owner handles are externalized to `docs/openapi/governance-codeowners-policy.json`, and the CI check consumes this policy to avoid dual-edit drift during ownership rotations.
- OpenAPI governance policy schema validation is now CI-enforced: contracts lane runs `openapi:governance:policy:validate` against `governance-codeowners-policy.schema.json` before CODEOWNERS verification, catching malformed policy edits early.
- OpenAPI governance evidence is now consolidated per CI run: contracts lane publishes a unified governance summary and `contracts-openapi-governance-metrics` artifact covering policy + CODEOWNERS checks.
- OpenAPI governance summary reliability is now stronger: CI summary status is driven by machine-readable governance report JSON emitted by validation scripts, removing dependence on log phrasing.
- OpenAPI governance evidence depth is now stronger: CI also uploads raw governance report files (`contracts-openapi-governance-reports`) so status decisions can be traced back to original policy/codeowners check outputs.
- OpenAPI governance reviewer UX is now improved: CI summary includes direct run link references next to governance artifact names for faster evidence navigation.
- OpenAPI governance metrics are now inventory-aware: `openapi-governance-metrics.json` includes expected artifact/file inventory so downstream tooling can assert evidence completeness per run.
- OpenAPI governance artifact integrity is now CI-enforced: contracts lane includes explicit inventory assertion before uploads, ensuring all required governance evidence files exist when artifacts are published.
- OpenAPI governance artifact shape integrity is now CI-enforced: contracts lane validates JSON structure/status consistency across metrics and raw policy/CODEOWNERS reports before artifact publication.
- OpenAPI governance script layout is now standardized: policy/check/assert scripts are grouped under `scripts/openapi-governance/` and npm commands target this shared namespace for clearer ownership/discoverability.
- OpenAPI governance operational docs are now in place: `scripts/openapi-governance/README.md` documents command purpose, expected inputs, and CI execution order for faster onboarding.
- OpenAPI governance README drift is now CI-guarded: contracts lane runs `openapi:governance:readme:check` to ensure documented `npm run` commands remain valid against `package.json`.
- OpenAPI governance README integrity is now deeper: README CI check also validates referenced repository file paths exist, preventing stale doc links.
- OpenAPI governance markdown QA is now reusable: shared utility `scripts/openapi-governance/markdown-reference-check.mjs` centralizes command/path reference validation logic used by README governance checks.
- OpenAPI governance markdown QA is now CLI-invocable: npm script `openapi:governance:markdown:check` accepts `--markdown`/`--package-json`/toggle flags so additional docs can adopt the same guard without bespoke scripts.
- OpenAPI governance markdown QA reuse is now CI-proven beyond governance script docs: contracts lane executes generic checker against `product-os/04-quality/release-qa-evidence.md` (`--no-commands`) to enforce path integrity on release evidence documentation.
- OpenAPI governance markdown QA trend visibility is now artifact-backed: contracts lane writes `openapi-markdown-reference-report.json`, publishes `contracts-markdown-reference-metrics`, and adds markdown-reference status/counts to CI summary.
- OpenAPI governance markdown report integrity is now CI-enforced: contracts lane runs `openapi:governance:markdown:report:assert` to validate markdown report schema + status/error consistency before artifact upload.
- OpenAPI governance markdown report contract is now versioned: schema file `docs/openapi/markdown-reference-report.schema.json` (v1) and report payload field `schemaVersion: 1` establish explicit compatibility guardrails for future evolution.
- OpenAPI governance markdown summary now surfaces contract version: CI `Markdown Reference Checks` block includes `Schema version` for reviewer-visible compatibility confirmation.
- OpenAPI governance schema-bump runbook integrity is now CI-guarded: README check now fails if `Markdown Schema Bump Procedure` heading or required numbered steps are missing.
- OpenAPI governance README structure policy is now declarative: required runbook anchors moved to `docs/openapi/governance-readme-policy.json` (schema-backed by `docs/openapi/governance-readme-policy.schema.json`) and enforced by README check.
- OpenAPI governance README evidence is now artifact-backed: README check supports `--report`, and contracts lane uploads `contracts-openapi-readme-governance-metrics` for run-level traceability.
- OpenAPI governance README report contract is now schema-gated: contracts lane runs `openapi:governance:readme:report:assert` against `docs/openapi/governance-readme-report.schema.json` before metrics artifact upload.
- OpenAPI governance metrics are now single-surface: consolidated `openapi-governance-metrics.json` now includes README validation/report status plus artifact inventory entry for `contracts-openapi-readme-governance-metrics`, and artifacts assertion enforces parity.
- OpenAPI governance metrics generation is now script-owned: contracts lane calls `openapi:governance:metrics:generate` instead of inline CI JS for summary/metrics output, reducing workflow drift risk.
- OpenAPI governance metrics generator is now smoke-tested: fixture-based `openapi:governance:metrics:smoke` validates pass/fail folding and expected artifact inventory shape before assertions run.
- OpenAPI governance summary-line regression coverage is now included: metrics smoke test asserts README/policy/CODEOWNERS/overall status lines in generated summary output.
- OpenAPI governance summary templates are now deduplicated: generator and smoke harness both consume `scripts/openapi-governance/metrics-summary-lines.mjs` for consistent summary-line contracts.
- OpenAPI governance smoke strictness is now balanced: fixture harness strictly validates structured metrics/status fields while using ordered summary-line checks to reduce copy-only churn failures.
- OpenAPI governance presentation drift now has warning visibility: contracts lane runs non-blocking `openapi:governance:metrics:presentation:check` to surface summary-format changes without blocking merges.
- OpenAPI governance presentation warnings now surface directly in CI summary: failing non-blocking presentation checks append `Governance Presentation Drift Warning` guidance for operator actionability.
- OpenAPI governance presentation telemetry is now artifact-queryable: metrics JSON now records `presentationValidationStatus`, per-run `presentationDriftWarningCount`, and `presentationValidationRecordedAt` for trend tracking.
- OpenAPI governance trend aggregation helper is now available: `openapi:governance:metrics:trend` rolls up presentation status/warning counts across discovered metrics artifacts for rapid weekly drift analysis.
- OpenAPI governance trend visibility is now CI-published: contracts lane emits `Governance Presentation Drift Trend` summary metrics and uploads `contracts-openapi-governance-presentation-trend` artifact for run-level review.
- OpenAPI governance cross-run delta visibility is now enabled: contracts lane attempts to fetch previous trend artifact and reports `FAIL` / drift-warning deltas versus prior run when historical artifact is present.
- OpenAPI governance delta-baseline quality is now hardened: previous trend selection now prefers same-branch artifacts and skips non-success source runs before computing deltas.
- OpenAPI governance delta-baseline source isolation is now hardened: previous trend selection now additionally filters by matching workflow path (`GITHUB_WORKFLOW_REF`) with workflow-name fallback to prevent cross-workflow artifact contamination.
- OpenAPI governance delta traceability is now explicit: delta payloads and CI summary now include baseline run/workflow metadata (`runId`, `workflowPath`, `workflowName`) for auditability.
- OpenAPI governance trend/delta schema contracts are now enforced in CI: dedicated assert scripts validate trend and delta artifact shapes before upload, including baseline metadata invariants.
- OpenAPI governance assertion drift detection is now smoke-tested: fixture harness validates both trend assert scripts across pass/fail cases to catch checker/schema regressions earlier.
- Core tenant-isolation baseline is now enforced at DB policy level for compliance-linked entities (`user_account`, `farmer_profile`, `plot`, `harvest_transaction`, `voucher`, `dds_package`, `dds_package_voucher`, `audit_log`) via `tracebud-backend/sql/tb_v16_005_rls_baseline.sql`, with own-data `authenticated` RLS policies and service-role backend paths preserved.
- Advisor phase-2 hardening now enables RLS on remaining app-domain public tables (`cadence_settings`, `content_calendar`, `content_ideas`, `content_tasks`, `cooperative_leads`, `country_leads`, `daily_actions`, `exporter_leads`, `farmer_leads`, `importer_leads`, `outreach_activity`, `outreach_templates`, `prospects`, `sinaph_zone`, `indigenous_zone`) and hardens mutable-function `search_path` defaults (`content_tasks_due`, `daily_outreach_actions`, `generate_content_tasks`, `generate_daily_actions`, `update_updated_at_column`) via `tracebud-backend/sql/tb_v16_006_rls_phase2_and_function_hardening.sql`.
- Lead-intake policy hardening is now applied via `tracebud-backend/sql/tb_v16_008_leads_insert_policy_hardening.sql`, replacing permissive `WITH CHECK (true)` public insert behavior with minimal non-empty-field + email-format + default-status guards while preserving public form submission capability.
- Owner-run PostGIS remediation runbook is now captured in `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql` to close residual extension-owned advisor findings (`public.spatial_ref_sys` RLS + `postgis` schema exposure) in a privileged infra change window.
- PostGIS owner remediation runbook is now hardened to revoke broad `anon`/`authenticated` DML grants on `spatial_ref_sys` and apply RLS/policy controls against whichever schema (`public` or `extensions`) currently hosts the extension-managed table, reducing integrity risk during phased infra rollout.
- `public.spatial_ref_sys` is now explicitly treated as a documented advisor exception for current release scope (PostGIS metadata, non-tenant domain data), with runbook retained for future owner-level infra windows.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed (for FEAT-001 slice scope)

## Status

Done (multi-tenant admin v1 scope closed with governance and evidence gates)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
