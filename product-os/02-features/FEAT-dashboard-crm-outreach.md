# FEAT: Dashboard CRM + outreach structural contracts

Status: **shipped (structural slice)**  
Registry: `apps/dashboard-product/lib/dashboardCrmOutreachRegistry.ts`  
Quality doc: `product-os/04-quality/dashboard-crm-outreach-registry.md`

## Problem

Contacts, farmers, campaigns, and inbox requests were implemented across multiple dashboard pages without a single canonical registry or CI guards. Backend JWT roles for network APIs did not match dashboard tenant roles for cooperative, importer, and country_reviewer.

## Scope (this slice)

- Canonical CRM/outreach registry (statuses, campaign lifecycle, request types, UI mappers)
- Network page permission contracts (`/contacts`, `/farmers`, `/outreach`, `/programmes`, `/inbox`)
- Dashboard ↔ backend network API parity bindings + role alignment
- Send/archive campaign actions with `requests:send` / `requests:archive` gates
- Client analytics for campaign, inbox, and contact lifecycle events
- Playwright golden path #4 (outreach send + archive)
- Structural guards wired into `npm run qa:structural` and `check:dashboard`

## Out of scope (separate tracks)

| Track | Why separate |
|-------|----------------|
| Field app / offline structural work | Different app (`apps/offline-product`), offline sync registries, Maestro device smoke |
| Operational issues (`/compliance/issues`) | Compliance ops domain — issue state machine, not CRM/outreach |
| Full exporter critical-path QA | Manual staging checklist for lineage → seal → handoff, not structural guards |

## Permissions

| Action | Permission |
|--------|------------|
| View contacts / farmers | `contacts:view`, `farmers:view` |
| Create/edit contacts | `contacts:create`, `contacts:edit` |
| View campaigns | `outreach:view` |
| Create campaign (wizard) | `requests:create` |
| Send draft campaign | `requests:send` |
| Archive campaign | `requests:archive` |
| View/respond inbox | `inbox:view`, `requests:respond` |

Deferred feature gate: `request_campaigns` hides `/outreach`, `/inbox`, `/programmes` when disabled.

## State transitions

- Campaign: `DRAFT` → send → `QUEUED`/`RUNNING`; archive → `CANCELLED` (UI tab Archived)
- Contact status: `new` → `invited` → `engaged` → `submitted` | `inactive` | `blocked`
- Inbox: `PENDING` → respond → `RESPONDED`

## Analytics events

See `DASHBOARD_EVENTS` in `lib/observability/analytics.ts` and baseline `qa/automation-baselines/dashboard-analytics-slice-guard.json`.

Backend audit parity (client analytics ↔ server audit): `DASHBOARD_BACKEND_AUDIT_EVENT_PARITY` in registry.

## Acceptance criteria

- [x] `npm run qa:structural -w dashboard-product` passes
- [x] `tracebud-backend npm run qa:structural` passes (network controller roles)
- [x] Playwright outreach send/archive golden path passes
- [x] No duplicate local `CONTACT_STATUSES` arrays — import registry
- [x] Programmes page uses shared campaign client (no duplicate POST after wizard)

## Related guards

- `dashboard-crm-guard.mjs`
- `dashboard-campaign-guard.mjs`
- `dashboard-network-permission-guard.mjs`
- `dashboard-backend-network-parity-guard.mjs`
- `dashboard-feature-gate-guard.mjs`
- `dashboard-audit-parity-guard.mjs`
- `dashboard-analytics-slice-guard.mjs`
