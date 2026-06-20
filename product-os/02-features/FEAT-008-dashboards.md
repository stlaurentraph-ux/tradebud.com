# Dashboards

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for dashboards aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Operational org/sponsor readiness and risk views.

## Non-goals

Anything outside v1 boundaries in `MVP_PRD.md`.

## Dependencies

See `product-os/01-roadmap/dependency-map.md`.

## Key entities

Use entity model in `MVP_PRD.md` and `PRODUCT_PRD.md`.

## UX / operational notes

Use journey and JTBD constraints from `JTBD_PRD.md` and `BUILD_READINESS_ARTIFACTS.md`.

### Supabase ops browse (`plot_ops_summary`)

- **Default Table Editor surface** for support/CRM plot triage — bookmark `plot_ops_summary`, not raw `plot`.
- **`plot` table** stays lean: identity, geometry, GFW screening (`status`), overlap flags, capture metadata.
- **`plot_ops_summary` view** joins aggregates from `evidence_documents`, `plot_tenure_verification`, `harvest_transaction`, and `audit_log` (legal + ground-truth photos).
- **Naming guardrails** (documented in Postgres column comments):
  - `deforestation_screening_status` / `deforestation_screening_label` — GFW satellite screening only; **not** land tenure, **not** full EUDR/shipment compliance.
  - `land_tenure_status` / `land_tenure_label` — derived tenure path from legal sync + evidence counts.
  - `eudr_dossier_ready_hint` — approximate sort key for ops; **FALSE does not enumerate gaps** — open CRM plot detail for filing authority.
- Migration: `supabase/migrations/202606200005_plot_ops_summary_view.sql`, mirror `tracebud-backend/sql/tb_v16_051_plot_ops_summary_view.sql`.

### Importer IA baseline (validate, complete, declare, retain, report)

- Importer dashboard navigation is now modeled as a compliance execution workspace, not a generic package list:
  - `Overview`
  - `Network` (`/contacts`)
  - `Shipments` (`/packages`)
  - `Compliance` (`/compliance`)
  - `Evidence` (`/fpic`)
  - `Campaigns` (`/outreach`)
  - `Requests` (`/inbox`)
  - `Reporting` (`/reports`)
  - `Issues` (`/compliance/issues`)
  - `Audit Log` (`/audit-log`)
  - secondary: `Settings`, `Help`
- This aligns importer IA to Tier 3 outcomes:
  - validate role/workflow state and shipment readiness
  - complete missing upstream references/evidence
  - declare through DDS/downstream pathways
  - retain evidence/reference records with auditability
  - report via annual/operational reporting surfaces
- Importer destination framing is now role-specific on shared routes so page headers/use language match importer responsibilities:
  - `Shipments` (`/packages`) focuses on shipment readiness and declaration preparation.
  - `Compliance` (`/compliance`) focuses on role decisions, reference completeness, and submit readiness.
  - `Evidence` (`/fpic`) focuses on evidence retention and declaration defensibility.
  - `Campaigns` (`/outreach`) and `Requests` (`/inbox`) focus on outbound collection and inbound fulfillment workflows.
  - `Reporting` (`/reports`) and `Issues` (`/compliance/issues`) frame annual reporting + exception management.
- Shared UI components now apply importer terminology consistently (not just route pages):
  - package table actions/labels use shipment language for importer users.
  - compliance summary/checklist cards use declaration-readiness language for importer users.
  - plot/evidence breakdown cards and evidence requirement cards use importer-specific readiness wording.
- Importer onboarding copy and sequence are now aligned to the importer IA model:
  - overview tour steps now follow `Network -> Campaigns -> Requests -> Shipments -> Compliance -> Evidence -> Reporting`.
  - welcome modal and checklist language now use importer terms (network/campaigns/shipment readiness/reporting snapshots).
  - guided-tour contextual actions now use importer-relevant CTA wording.
- Request wizard taxonomy is now role-aware and aligned with dashboard IA:
  - importer flow uses campaign terminology (`Campaign Type`, `Campaign Details`, `Launch Campaign`).
  - non-importer flow keeps request terminology (`Request Type`, `Request Details`, `Send Request`).
  - outreach entry now passes role-specific wizard mode/title/description to keep onboarding CTAs and in-flow taxonomy consistent.
- Dashboard BFF routes now consistently use `backendApiUrl()` for backend proxy calls (harvest, plots, requests, launch, admin, integrations, cooperative aggregates, inbox, analytics gated-entry).
- Inbox fulfillment uses real plot and evidence pickers (not package stubs only):
  - `InboxFulfillmentDialog` loads tenant plots and `/api/requests/evidence-feed` (same backend source as FPIC repository rows).
  - multi-select plots and evidence documents; evidence rows with `plot_id` auto-select linked plots for `evidencePlotIds` payload.
- Importer shipments page defaults to shared upstream tab:
  - `defaultPackagesPageTab` returns `shared` for importer/reviewer roles; `/packages` uses override-friendly tab state.
  - assemble and timeline sub-routes now load packages via `usePackageDetail` (backend vouchers/plots) instead of list cache.
- Email campaign CTA accept now ensures recipient inbox rows (not only decision counters):
  - public `POST /v1/public/requests/campaigns/decision-intent` accept path calls `ensureInboxFromEmailCtaAccept` after ledger insert.
  - covers recipients who were unresolved at send-time or missed send fan-out; emits `REQUEST_CREATED_FROM_EMAIL_CTA_ACCEPT` inbox event.
- Outreach campaigns now expose recipient decision timeline UI:
  - sent/completed campaign rows include **View timeline** action opening `CampaignDecisionsDialog`.
  - dialog reads `GET /api/requests/campaigns/:id/decisions` with all/accept/refuse filters, paginated load-more, and source labels (`email_cta`, `inbox_fulfillment`).
- Package detail page (`/packages/[id]`) is now backend-backed for reads and filing transitions:
  - `usePackageDetail` maps backend package + voucher rows into dashboard `DDSPackage` shape (real plot names/areas from vouchers).
  - filing workflow calls `POST /api/harvest/packages/:id/generate` and `PATCH /api/harvest/packages/:id/submit` (BFF proxies to harvest controller).
  - readiness blockers from `/readiness` gate generate/submit; in-memory `transitionPackage` is no longer used on the detail page.
- Importer upstream shipment visibility is now role-scoped before deploy:
  - overview/compliance/DDS surfaces default to `scope=shared` for importer and country reviewer roles via `resolveHarvestPackageScope`.
  - backend package detail/evidence/readiness enforce `canReadPackageForTenant` (own-tenant farmers or inbox-granted sender packages only).
  - outreach campaigns table shows `accepted_count` / `pending_count` response progress (includes `inbox_fulfillment` decisions after recipient Fulfill).
- Inbox fulfillment now closes the recipient loop with evidence + sender campaign reconciliation:
  - `POST /v1/inbox-requests/:id/respond` accepts optional `notes`, `evidencePlotIds`, and `evidencePackageIds`.
  - successful respond emits `inbox_request_responded` and `inbox_request_evidence_attached` audits, then records `inbox_fulfillment` accept in `request_campaign_recipient_decisions` when recipient email resolves.
  - sender campaign `accepted_count` / `pending_count` / status are updated on first inbox fulfillment decision (idempotent if email CTA already recorded).
  - `/inbox` UI exposes Fulfill dialog for pending requests (`requests:respond` permission).
  - dashboard inbox BFF uses `backendApiUrl()` so production `TRACEBUD_BACKEND_URL` values ending in `/api` do not double-prefix paths.
- Campaign send now fans out tenant-scoped inbox rows for registered recipients:
  - on `POST /v1/requests/campaigns/:id/send`, backend resolves recipient emails via `tenant_signup_contacts` and `admin_users`, then inserts `inbox_requests` for each distinct recipient tenant (skips sender tenant and unresolved emails).
  - exporter/importer/cooperative dashboards surface inbound work through `/inbox` and overview `incoming_requests_pending` without demo bootstrap seeding.
  - fan-out failures are audit-logged (`inbox_requests_campaign_fanout_failed`) but do not roll back successful email delivery.
- Importer backend-connectivity slice now extends beyond campaigns/requests list reads:
  - `Reporting` reads tenant-scoped summary telemetry from backend (`/v1/reports/importer-summary`) for readiness rate, compliant evidence count, shipment volume, and readiness distribution.
  - `Issues` reads backend-derived operational issue records (`/v1/requests/issues`) from active/overdue campaigns and inbound request queues.
  - `Evidence` reads backend evidence feed rows (`/v1/requests/evidence-feed`) sourced from immutable `plot_evidence_synced` audit events (tenant-scoped via payload `tenantId`) for importer evidence repository framing.
  - dashboard API proxies were added for all three new backend routes to preserve auth pass-through and fail-closed backend URL handling.

## Tasks checklist

- [x] Confirm permissions and tenant boundaries
- [x] Confirm state transitions
- [x] Confirm exception handling and recovery
- [x] Confirm analytics event coverage
- [x] Confirm acceptance criteria mapping
- [x] Confirm v1.6 architecture constraints for touched areas (spatial, HLC sync, lineage, TRACES chunking, GDPR shredding)
- [x] Update status docs

## First execution slice (S1)

Scope: dashboard execution matrix bootstrap for tenant-safe readiness/risk/filing/chat operational visibility surfaces.

### Permission and tenant boundary matrix

- **Exporter role:** can access org-level readiness/risk/filing summary widgets and drill into package-level dashboard diagnostics within own tenant.
- **Agent role:** can access assigned-operational dashboard views (field progress, assignment throughput) but cannot access exporter filing-only controls.
- **Farmer role:** can access own/assigned production dashboard views only; no cross-farmer or cross-tenant drill-down.
- **Missing tenant claim:** fails closed for all dashboard API/proxy reads before data retrieval or aggregate calculations.

### State transition matrix

- `dashboard_request -> loading` when tenant-scoped filter window/query is accepted.
- `loading -> ready` when all required dashboard data domains resolve with coherent timestamp/filter context.
- `loading -> partial_ready` when one or more optional telemetry domains fail but core readiness view remains available.
- `ready|partial_ready -> refreshed` on manual or scheduled refresh with deterministic filter carry-forward.
- `ready|partial_ready|refreshed -> stale` when source data freshness threshold is exceeded and operator warning is shown.

### Exception handling and recovery

- Invalid filter/query combinations return deterministic validation errors and retain previous good dashboard state client-side.
- Tenant/role authorization failures return explicit deny semantics and never leak aggregate cross-tenant counts.
- Partial backend source outages degrade to partial-ready dashboards with per-panel error messaging and retry controls.
- Export/read retries preserve idempotent semantics for telemetry-backed cards and never duplicate server-side lifecycle events.

### Analytics/event coverage

- Dashboard lifecycle telemetry baseline includes:
  - dashboard load requested / loaded / partial / failed
  - dashboard refresh triggered / completed
  - dashboard export requested / completed / failed
- Event payload baseline: tenantId, actor identity/role, dashboard surface/widget key, filter window, phase, row/summary counts, timestamp.

### Acceptance mapping (v1)

- Dashboard data access remains tenant-scoped and role-constrained for all read/refresh/export paths.
- Dashboard operational summaries are deterministic for same tenant/filter inputs across repeated requests.
- Partial failure behavior preserves operator continuity with explicit warning context and retry path.
- Dashboard diagnostics provide sufficient risk/readiness/filing/chat evidence for investigation and compliance handoff.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** dashboard map/area metrics must be derived from canonical `GEOGRAPHY`-safe upstream outputs; no ad-hoc client geometry math.
- **Offline conflict integrity:** dashboard event chronology must rely on persisted ordering metadata (HLC/audit timestamps), not browser wall clocks.
- **Lineage performance:** dashboard lineage indicators must consume materialized lineage fields and avoid runtime recursive traversal.
- **TRACES chunking resilience:** dashboard filing summaries must tolerate chunked submission lifecycle data without reference-loss in aggregates.
- **GDPR shredding safety:** dashboard actor/user labels must not rehydrate shredded personal attributes; retention-safe audit references remain immutable.

## Execution slices

### S1 code slice 1 - dashboard execution matrix bootstrap

- Documented FEAT-008 S1 execution matrix for permissions, transition states, exception recovery, analytics baseline, acceptance mapping, and v1.6 architecture constraints.
- Established implementation-ready baseline for next FEAT-008 slices (dashboard contract shaping, diagnostics aggregation, and operator UX hardening).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - tenant-scoped dashboard diagnostics summary contract

- Added backend tenant-scoped diagnostics summary endpoint:
  - `GET /v1/audit/gated-entry/dashboard-summary`
  - supports `fromHours` lookback filter
  - returns aggregate counters across dashboard event families:
    - gated-entry attempts
    - assignment export events
    - risk score events
    - filing activity events
    - chat activity events
- Added dashboard analytics proxy routing for `eventKind=dashboard_summary`.
- Added dashboard hook and admin telemetry card summary surface to display aggregate counters for current time window.
- Added unit + DB-backed integration assertions for summary counter behavior and tenant scoping.
- Published OpenAPI contract + schema (`DashboardDiagnosticsSummaryResponse`) for diagnostics summary endpoint.

### S1 code slice 3 - segmented summary drill-down + readiness guardrails

- Expanded backend `GET /v1/audit/gated-entry/dashboard-summary` response to include deterministic drill-down segments used by widget-level triage:
  - assignment export phase buckets (`requested`, `succeeded`, `failed`)
  - assignment export status buckets (`active`, `completed`, `cancelled`)
  - risk score band buckets (`low`, `medium`, `high`)
  - filing family buckets (`generation`, `submission`)
  - chat activity phase buckets (`created`, `posted`, `replayed`, `resolved`, `reopened`, `archived`)
- Added summary-level readiness guardrails in response payload:
  - `hasAnyDiagnostics`
  - `canExportDetailed`
  - `latestEventAt`
- Updated dashboard diagnostics summary UI to show segmented drill-down and readiness state for operator triage/export decisioning in the current tenant/time window.
- Updated summary unit + DB-backed integration assertions for segment/readiness payload parity.
- Updated OpenAPI schema (`DashboardDiagnosticsSummaryResponse`) to publish drill-down + readiness payload contract.

### S1 code slice 4 - widget drill-down interactions + export guardrail assertions

- Added widget-level summary drill actions in admin diagnostics so segmented summary buckets can immediately drive investigation filters:
  - assignment phase/status summary controls set assignment diagnostics filters + reset paging
  - risk band summary controls set risk diagnostics band filter + reset paging
  - filing family summary controls route to generation/submission phase filters + reset paging
  - chat phase summary controls set chat diagnostics phase filter + reset paging
- Tightened export guardrails in admin diagnostics:
  - all “Export All CSV” controls now disable when summary readiness indicates no detailed diagnostics are exportable.
- Tightened acceptance assertions:
  - backend unit + DB-backed integration tests now explicitly assert non-export-ready behavior (`hasAnyDiagnostics=false`, `canExportDetailed=false`, `latestEventAt=null`) when tenant diagnostics are empty.

### S1 code slice 5 - closeout acceptance reconciliation

- Reconciled S1 acceptance mapping against implemented dashboard diagnostics behavior:
  - tenant/role-safe access path enforced through signed-tenant audit reads and dashboard proxy contract
  - deterministic summary + segmented counters proven by repeated filter-bound unit/integration assertions
  - partial/empty diagnostics behavior now explicitly covered by readiness guardrails and non-export-ready assertions
  - investigation handoff support verified via export controls plus widget-to-filter drill pathways
- Closed S1 open question for this feature scope:
  - provider/protocol remains internal API + audit-log telemetry path for FEAT-008 S1; no external provider dependency introduced.
- Marked feature status as done for current roadmap scope.

Verification commands:

- `cd tracebud-backend && npm test -- --runTestsByPath src/audit/audit.controller.spec.ts`
- `cd tracebud-backend && npm run test:integration -- --runTestsByPath src/audit/audit.gated-entry.int.spec.ts`
- `cd apps/dashboard-product && npm test -- app/api/analytics/gated-entry/route.test.ts`
- `npm run openapi:lint`

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

- Founder OS Lite analytics coverage now includes:
  - daily outreach plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - weekly content plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - outreach daily-action completion emission (`REQUEST_CAMPAIGN_RESPONSE_RECEIVED`)
- Cadence visibility includes streak signals on `Today`:
  - consecutive weekdays meeting outreach target (3 completed actions/day)
  - consecutive weeks meeting content target (2 LinkedIn posts/week)

## Post-closeout hardening slice (2026-04-16)

### S2 code slice 1 - request campaign bulk-contact import UX baseline

- Added dashboard request-campaign dialog bulk target import flow in `apps/dashboard-product/app/requests/page.tsx`:
  - CSV upload (`.csv`) and paste-in CSV text area
  - parser with required columns (`email`, `full_name`)
  - row-level validation and invalid-row diagnostics
  - email deduplication and parsed-target preview
- Draft creation payload now includes parsed `targets` list (currently console-mocked until backend wiring is enabled in this surface).
- Create Draft action is now gated on both campaign metadata and at least one parsed target to prevent empty bulk-send drafts.
- Added page-level regression test coverage in `apps/dashboard-product/app/requests/page.test.tsx` for parse-and-enable flow.

### S2 code slice 2 - request campaign API wiring for bulk targets

- Added dashboard API proxy route `POST /api/requests/campaigns` forwarding to backend `POST /v1/requests/campaigns` with auth pass-through and `X-Idempotency-Key` support.
- Requests page draft creation now submits real payload contract (`request_type`, `campaign_name`, `description_template`, `due_date`, `targets[]`) using parsed bulk targets.
- Added operator feedback states for campaign creation (`Creating...`, success banner, failure banner) to make async send status explicit.
- Added proxy route test coverage in `apps/dashboard-product/app/api/requests/campaigns/route.test.ts` for fail-closed and header forwarding behavior.

### S2 code slice 3 - request draft creation response-state integration tests

- Added Requests page integration-level UI assertions for campaign create outcomes in `apps/dashboard-product/app/requests/page.test.tsx`:
  - success path renders campaign-created banner with returned campaign id
  - failure path renders backend error banner for operator remediation
- Existing parse-and-enable coverage remains in place, so draft creation test flow now validates full front-end journey: parse targets -> submit -> surface result state.

## 2026-04-22 launch entitlement admin UI slice

- Added dashboard admin launch-entitlement operations surface in `apps/dashboard-product/app/admin/page.tsx`:
  - tenant entitlement list load action (`Load entitlements`)
  - per-feature status controls (`Enable`, `Trial`, `Disable`)
  - immutable backend-managed status read/write via dashboard API proxy
- Added dashboard API proxy route:
  - `apps/dashboard-product/app/api/launch/entitlements/route.ts` (`GET`, `PATCH`)
  - forwards signed Authorization header and preserves backend error payload/status semantics.
- Permissions and boundary behavior:
  - UI delegates enforcement to backend admin-only launch endpoints (`Only admins can manage feature entitlements`).
  - tenant boundary remains claim-scoped through backend launch controller/service.
- Exception handling and recovery:
  - explicit success/failure toasts for entitlement read/write actions.
  - idempotent reload after mutation to keep UI state authoritative with backend row state.
- Verification commands:
  - `cd apps/dashboard-product && npm run test -- app/admin/page.test.tsx app/api/launch/entitlements/route.test.ts`
- Test additions:
  - `app/api/launch/entitlements/route.test.ts` proxy passthrough coverage.
  - `app/admin/page.test.tsx` coverage for load and mutation UI flows.

### S2 code slice 4 - bulk target payload mapping contract lock

- Extended Requests page submit integration test to assert exact outbound payload shape for bulk targets:
  - top-level campaign fields (`request_type`, `campaign_name`, `description_template`, `due_date`)
  - per-target mapping (`email`, `full_name`, `organization`, `farmer_id`, `plot_id`)
- Added assertion coverage for submit headers (`Content-Type`, generated `X-Idempotency-Key`) and endpoint path (`/api/requests/campaigns`) to prevent request-contract drift.

### S2 code slice 5 - malformed-row exclusion contract guard

- Added negative-path integration test ensuring malformed CSV rows are excluded before submit:
  - invalid email rows produce validation diagnostics
  - missing required-field rows produce validation diagnostics
  - outbound `targets[]` payload includes only valid parsed contacts
- This guards against accidental inclusion of invalid recipients in bulk request dispatch payloads.

### S2 code slice 6 - parse summary visibility for exclusion confidence

- Added parse summary UI in requests bulk-import flow:
  - `X valid / Y invalid excluded`
  - optional duplicate-row skipped count when deduplication occurs
- Added integration test assertion confirming summary text renders alongside malformed-row diagnostics in negative path.

### S2 code slice 7 - downloadable CSV template helper

- Added `Download CSV template` action directly in the requests bulk-import section to reduce first-time formatting friction.
- Template file includes required header contract plus sample rows and downloads as `tracebud-request-targets-template.csv`.
- Added integration test coverage to assert blob URL generation and download trigger behavior.

### S2 code slice 8 - paste-sample quick-fill helper

- Added `Paste sample CSV` helper action to instantly populate bulk-target textarea with a valid template payload.
- Quick-fill action immediately parses and previews targets so operators can validate/send flow without manual copy/paste during onboarding or demos.
- Added integration test coverage to assert textarea population and parsed-summary visibility after quick-fill trigger.

### S2 code slice 9 - CSV alias compatibility with warning visibility

- Added parser compatibility alias `name -> full_name` for inbound CSV headers to reduce friction with common CRM export formats.
- Added explicit alias-usage visibility in parser UI (`Column aliases applied: ...`) so operators can detect transformed headers before submit.
- Added integration test coverage for alias parsing and warning badge rendering.

### S2 code slice 10 - extended alias map for CRM export variants

- Expanded parser alias map for common external export conventions:
  - `email_address -> email`
  - `farmerid -> farmer_id`
  - `plotid -> plot_id`
- Alias warning badge now reports all applied mappings so transformed columns remain operator-visible before submit.
- Added integration test coverage for multi-alias parsing scenario with combined external-style headers.

### S2 code slice 11 - spaced-header alias interoperability

- Extended header normalization to accept spaced and hyphenated variants (for example `email address`, `full name`, `farmer id`, `plot id`) while preserving canonical field mapping.
- Alias warning visibility remains explicit for transformed headers so operators can verify parser behavior before request submission.
- Added integration test coverage proving spaced-header CSV input parses successfully with expected alias warnings.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed (`internal API + audit-log telemetry path retained for FEAT-008 S1 scope`)

## Status

Done (TB-V16-008 / FEAT-008)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated

## 2026-04-22 launch onboarding + trial UX slice

- Dashboard overview now surfaces tenant launch access state (trial/expired/paid/suspended) from backend launch API.
- Dashboard now renders autonomous onboarding checklist cards by role and persists completion state through backend onboarding endpoints.
- Onboarding checklist completion now emits immutable tenant-scoped analytics events (`onboarding_step_completed`) to support activation funnel diagnostics.
- Launch access handling now supports post-trial read-only UX messaging, with premium actions gated server-side.

## 2026-04-22 contacts CRM + campaign target reuse slice

- Added tenant-scoped Contacts CRM module (`/contacts`) with status pipeline (`new`, `invited`, `engaged`, `submitted`, `inactive`, `blocked`) and strict role-scoped access.
- Added backend contacts API (`GET/POST /v1/contacts`, `PATCH /v1/contacts/:id/status`) with tenant isolation, explicit transition validation, and immutable audit events.
- Added dashboard API proxies and shared contact service to keep auth/header and error semantics consistent with existing admin/request patterns.
- Request Campaign creation modal now supports selecting saved CRM contacts, reducing repeated CSV uploads and accelerating importer onboarding activation.

## 2026-04-22 contacts persistence migration + transition tests slice

- Added migration `TB-V16-024` (`tracebud-backend/sql/tb_v16_024_crm_contacts.sql`) so `crm_contacts` schema is provisioned by SQL migration instead of runtime DDL in service code.
- Removed runtime schema bootstrap logic from `ContactsService`; service now assumes migration-applied schema and focuses on tenant-scoped behavior.
- Added targeted service tests (`src/contacts/contacts.service.spec.ts`) covering create audit emission, valid transition, invalid transition rejection, and not-found status update handling.
- Added targeted controller tests (`src/contacts/contacts.controller.spec.ts`) covering role/tenant guardrails and payload validation for status transition endpoint.

## 2026-04-22 request campaigns backend persistence slice

- Added backend request campaigns module with tenant-scoped `GET/POST /v1/requests/campaigns` endpoints and role-scoped access enforcement for admin/exporter/compliance manager flows.
- Added persistence migration `TB-V16-025` (`tracebud-backend/sql/tb_v16_025_request_campaigns.sql`) with idempotency and tenant-index support for reliable draft creation/list retrieval.
- Updated dashboard requests API proxy to support campaign listing and removed synthetic 404 draft fallback now that backend endpoint exists.
- Requests page now loads campaigns from backend on mount and uses local cache only as resilience fallback, so drafts survive refresh and persist server-side.

## 2026-04-22 request campaigns Resend delivery slice

- Request campaign drafts now persist `target_contact_emails` so send actions use explicit recipient scope instead of implicit CRM guesses.
- Added Resend-backed outbound email dispatch on draft send transition (`DRAFT -> RUNNING`) with fail-closed configuration checks (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
- `pending_count` on send now reflects successfully dispatched recipient count, aligning campaign progress and response denominator semantics with actual deliveries.
- Added migration `TB-V16-026` to provision `request_campaigns.target_contact_emails` plus migration apply/verify utility scripts for rollout safety.

## 2026-04-22 request campaign archive confirmation slice

- Added tenant-scoped archive endpoint (`POST /v1/requests/campaigns/:id/archive`) that transitions campaigns to `CANCELLED` for soft-delete behavior.
- Dashboard campaign action menu now prompts for confirmation before archive and then applies archived state in UI with success/error feedback.
- Default campaign list behavior now excludes archived campaigns from `All Status`; archived entries remain accessible using explicit `Archived` status filter.

## 2026-04-22 request campaign outbound email content refinement slice

- Outbound campaign emails now use branded sender formatting (`Tracebud <hello@...>`) so inbox sender identity is explicit.
- Subject line now includes requesting organization context (`Request from <organization>: <campaign title>`).
- Email body now explains compliance/business continuity rationale, 1-month free Tracebud onboarding path, and importer->exporter->farmer evidence chaining expectation.

## 2026-04-22 request campaign CTA email UX slice

- Added recipient-facing CTA buttons in campaign emails: `Accept`, `Refuse`, and `Connect and start your compliance journey`.
- Added explicit documentation deep-link in email body for onboarding/support path.
- Added configurable public URL env hooks for outbound links:
  - `TRACEBUD_DASHBOARD_PUBLIC_URL`
  - `TRACEBUD_DOCS_PUBLIC_URL`

## 2026-04-22 request campaign CTA intent capture reconciliation slice

- Added CTA landing route (`/requests/intent`) that captures pre-login `accept/refuse` decision intent from email links and redirects recipients to authenticated flow.
- Added login `next` redirect support so recipients return to `Requests` after authentication.
- Added authenticated decision-intent reconciliation call (`POST /v1/requests/campaigns/:id/decision-intent` via dashboard proxy) and post-login operator notice in Requests UI.

## 2026-04-22 onboarding optimization phase 1 slice

- Added onboarding best-practice implementation baseline focused on first-value acceleration in Requests operations.
- Added explicit `Onboarding status` dashboard card in Requests with action-validated milestones:
  - Contacts added
  - Campaign sent
  - First decision received
- Added last decision sync timestamp visibility to reduce ambiguity after recipient email CTA actions.
- Added recipient decision timeline in campaign details, sourced from immutable decision ledger records.
- Added backend tenant-scoped decision timeline endpoint:
  - `GET /v1/requests/campaigns/:id/decisions`
  - response includes `last_synced_at` and recipient-level decision events (`accept`/`refuse`, timestamp, source).
- Added dashboard proxy route for timeline retrieval:
  - `GET /api/requests/campaigns/:id/decisions`

## 2026-04-22 role ownership permission alignment slice

- Updated role-to-permission ownership to align filing responsibilities with tenant model:
  - removed `packages:submit_traces` from Tier 2 exporter/cooperative matrix
  - added `packages:submit_traces` to Tier 3 importer/brand matrix
  - removed `harvests:approve_exception` from Tier 3 importer/brand matrix
- Updated dashboard role messaging to match ownership semantics:
  - Exporter dashboard copy now frames readiness as importer handoff readiness.
  - Importer dashboard now labels tenant as final compliance owner and surfaces filing-oriented CTA copy.
- Preserved cooperative nuance: cooperative request orchestration (`requests:create` / `requests:send`) remains enabled for member coordination.

## 2026-06-03 cross-tenant dashboard data connectivity slice

- Added tenant-scoped package listing (`GET /v1/harvest/packages?scope=tenant`) resolved through `tenant_signup_contacts` → `farmer_profile` → `dds_package`, with plot coverage counts for overview metrics.
- Added importer shared shipment listing (`GET /v1/harvest/packages?scope=shared`) sourced from inbox sender grants (`inbox_requests.sender_tenant_id`) so exporter upstream packages appear on importer `Shipments > Shared` tab.
- Added tenant-scoped plot listing (`GET /v1/plots?scope=tenant`) for cooperative insights and member coverage metrics.
- Dashboard BFF maps backend package rows into `DDSPackage` via `lib/harvest-package-mapper.ts`; cooperative insights inbox path corrected to `/v1/inbox-requests`.
- Signup now backfills inbox rows for `RUNNING`/`PARTIAL` campaigns that already targeted the new user's email (`inbox_requests_signup_backfill` audit).

## 2026-04-22 filing endpoint server-policy assertion slice

- Enforced fail-closed filing ownership at backend `POST /v1/integrations/eudr/dds`:
  - exporters/cooperatives are now explicitly denied filing submit.
  - importer/brand ownership is enforced through `compliance_manager`/`admin` role gate.
- Expanded read visibility for filing status endpoint (`GET /v1/integrations/eudr/dds/status`) to include importer/brand owner role while preserving exporter/agent operator access.
- Added/updated controller unit assertions to lock new boundary behavior and prevent future regression toward exporter-side filing submission.
- Added HTTP integration role-matrix coverage (`401 missing token`, `403 exporter forbidden`, `201 importer/brand owner success`) to verify guard + controller behavior end-to-end on `POST /v1/integrations/eudr/dds`.
