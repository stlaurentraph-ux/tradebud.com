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

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [ ] Provider/protocol choices finalized where needed

## Status

In progress (2026-04-09)

## 2026-04-09 slice notes

- Added sponsor/governance dashboard visibility and role/tier-aware navigation for `sponsor_org`.
- Added cooperative inbox flow with explicit permission-gated actions (`requests:respond`, `evidence:upload`), async recovery UX, and retry paths.
- Replaced cooperative inbox mock request list with tenant-scoped request data service + hook, including canonical seed/reset behavior in demo bootstrap paths.
- Added dashboard API endpoints for inbox requests (`GET /api/inbox-requests`, `POST /api/inbox-requests/{id}/respond`) and bootstrap state sync endpoint for demo operations.
- Connected dashboard inbox API routes to `tracebud-backend` endpoints (`/api/v1/inbox-requests*`) through `TRACEBUD_BACKEND_URL`, with safe local fallback to preserve demo continuity.
- Enforced authenticated tenant resolution in backend inbox endpoints (tenant derived from auth claims/profile, not client-provided tenant ID) and forwarded bearer tokens through dashboard proxy routes.
- Migrated backend inbox persistence from `audit_log` snapshot payloads to dedicated tables (`inbox_requests`, `inbox_request_events`) with tenant-scoped indexes, preserving existing dashboard API response contracts.
- Added MVP feature-fence enforcement for deferred routes: sidebar gating in RBAC and route-entry blocking in middleware for `/requests` and `/reports` unless explicitly enabled by feature flags.
- Applied UX role naming pass (display labels only): `cooperative->Producer`, `exporter->Supplier`, `importer->Buyer`, `country_reviewer->Reviewer`, `sponsor_org->Sponsor` across badges, login personas, sidebar tier labels, and admin role/org labels.
- Completed secondary copy harmonization pass across active demo/UI flows (runbook/checklist, inbox title/copy, demo-readiness labels, harvest/package/settings/sidebar text) to remove remaining legacy role wording.
- Completed docs-only terminology normalization in historical dashboard markdown artifacts (`DESIGN_AUDIT.md`, `MVP_GAP_ANALYSIS.md`, `V1_REMEDIATION_BLUEPRINT.md`, `GRADING_ANALYSIS.md`, `REQUIREMENTS.md`, `DASHBOARD_MVP_PLAN.md`) to align with Producer/Supplier/Buyer/Sponsor/Reviewer language.
- Added demo-readiness controls (seed/reset) with action-state handling and failure recovery notifications.
- Added audit-event emission for inbox response/evidence actions and demo readiness mutations to keep demo operations traceable.
- Fixed login loading-state recovery on invalid credentials (prevents stuck loading state in auth exception path).
- Acceptance mapping: cooperative request response, evidence upload, and demo bootstrap actions are now actionable with feedback and auditable signals.
- Added Founder OS groundwork for dashboard-adjacent operator workflows: Supabase CRM/content schema + function layer, n8n workflow specs, and additive website lead mirroring into `prospects`/`outreach_activity` for future `/crm/*` and `/content/*` dashboard modules.
- Implemented founder-operator dashboard scaffold in `apps/dashboard-product` for `/crm/prospects`, `/crm/daily-actions`, `/crm/templates`, `/content/calendar`, `/content/tasks`, and `/content/review`, backed by Supabase API routes and role-gated navigation entries (Sponsor persona by default).
- Added Founder OS Lite operating loop for founder execution: `Today` scoreboard with hard targets (3 weekday outreaches/day, 2 posts/week), one-click target bootstrapping, simplified navigation, and direct exchange logging on people records.
- Added idempotent planning helpers in API/service layer to auto-fill missing daily outreach actions and weekly post placeholders while preserving manual override/edit paths.

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
