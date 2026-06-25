# Structural contracts runbook

How Tracebud encodes cross-cutting invariants as **contract-as-code** so agents and CI catch class regressions early.

## Registries by surface

### Offline field app (`apps/offline-product`)

| Domain | Markdown | Code mirror | Guard |
|--------|----------|-------------|-------|
| Farmer cross-device artifacts | `farmer-artifact-sync-registry.md` | `features/sync/farmerArtifactRegistry.ts` | `sync-parity-guard.mjs`, `registry-md-parity-guard.mjs`, `pending-sync-registry-guard.mjs`, `ui-reload-guard.mjs` |
| Cross-device smoke wiring | `DEVICE_SMOKE_CHECKLIST.md` §12 | `.maestro/flows/settings-sync-smoke.yaml` | `cross-device-smoke-wiring-guard.mjs` |
| Field regressions | `field-app-regression-ledger.md` | — | `field-regression-guard.mjs` |
| Analytics slices | — | `features/observability/analytics.ts` | `analytics-slice-guard.mjs` (strict in `qa:structural:ci`) |
| Field roles | `field-role-permission-registry.md` | `fieldRolePermissionRegistry.ts` | `role-permission-guard.mjs` |
| State transitions | `field-state-transition-registry.md` | `fieldStateTransitionRegistry.ts` | `state-transition-guard.mjs` |

### Dashboard (`apps/dashboard-product`)

| Domain | Markdown | Code mirror | Guard |
|--------|----------|-------------|-------|
| RBAC + shipment states | `dashboard-rbac-registry.md` | `lib/dashboardRbacRegistry.ts`, `lib/rbac.ts` | `dashboard-rbac-guard.mjs`, `dashboard-shipment-transition-guard.mjs`, `dashboard-permission-matrix-guard.mjs`, `dashboard-backend-role-parity-guard.mjs` |
| Legal workflow + DDS | `dashboard-legal-workflow-registry.md` | `lib/dashboardLegalWorkflowRegistry.ts` | `dashboard-legal-workflow-guard.mjs` |
| CRM + outreach | `dashboard-crm-outreach-registry.md` | `lib/dashboardCrmOutreachRegistry.ts` | `dashboard-crm-guard.mjs`, `dashboard-campaign-guard.mjs`, `dashboard-network-permission-guard.mjs`, `dashboard-backend-network-parity-guard.mjs` |
| Compliance issues | `dashboard-compliance-issues-registry.md` | `lib/dashboardComplianceIssuesRegistry.ts` | `dashboard-compliance-issues-guard.mjs`, `dashboard-compliance-permission-guard.mjs`, `dashboard-compliance-backend-parity-guard.mjs` |
| Exporter critical path | `dashboard-exporter-workflow-registry.md` | `lib/dashboardExporterWorkflowRegistry.ts` | `dashboard-exporter-workflow-guard.mjs` |
| Analytics events | — | `lib/observability/analytics.ts` | `dashboard-analytics-slice-guard.mjs` (strict in `qa:structural:ci`) |
| API regressions / proxy / e2e | — | baselines under `scripts/` | bundled in `run-structural-guards.mjs` |

### Backend (`tracebud-backend`)

| Domain | Markdown | Code mirror | Guard |
|--------|----------|-------------|-------|
| App roles | `backend-structural-contracts.md`, `backend-api-access-registry.md` | `backendRoleRegistry.ts`, `backendApiAccessRegistry.ts` | `backend-role-guard.mjs`, `backend-api-access-guard.mjs` |
| Audit events | `backend-structural-contracts.md` | `backendAuditEventRegistry.ts` | `backend-audit-event-guard.mjs` (strict in CI) |
| Filing states | `backend-structural-contracts.md` | `backendFilingStateRegistry.ts` | `backend-filing-state-guard.mjs` |
| Plot compliance | `backend-plot-compliance-registry.md` | `backendPlotComplianceRegistry.ts` | `backend-plot-compliance-guard.mjs` |
| Cross-surface routing | `network-routing-registry.md` | `network/networkRoutingRegistry.ts`, `network/email-to-tenant-resolution.ts` | `backend-network-routing-guard.mjs` |
| Deploy / billing / tenure | — | — | bundled: deploy smoke, stripe webhook, tenure parse static, benchmark claims (CI) |

### Marketing (`apps/marketing`)

| Domain | Markdown | Guard |
|--------|----------|-------|
| Routes, i18n, analytics, SEO/a11y | `marketing-structural-contracts.md` | `run-structural-guards.mjs` (full locally; doc guard in CI) |

## Commands

```bash
# Offline field app
cd apps/offline-product
npm run qa:structural          # local
npm run qa:structural:ci       # CI strict

# Dashboard
cd apps/dashboard-product
npm run qa:structural

# Backend
cd tracebud-backend
npm run qa:structural

# Marketing
cd apps/marketing
npm run qa:structural          # all assert guards
npm run qa:structural:ci       # doc guard only (CI)

# Monorepo fan-out (all surfaces)
npm run qa:structural:monorepo
npm run qa:structural:monorepo:ci
```

## Adding a farmer artifact (checklist)

1. Run scaffold script (prints checklist + optional restore stub).
2. Implement upload, server store, restore, UI reload.
3. Add row to `farmer-artifact-sync-registry.md` and arrays in `farmerArtifactRegistry.ts`.
4. Wire `restoreFarmerCloudState` and `enqueueFarmerCloudSyncActions` as needed.
5. Add unit test for restore path.
6. Extend `DEVICE_SMOKE_CHECKLIST.md` §12 (cross-device).
7. Update FEAT doc + `daily-log.md`.
8. `npm run qa:structural` green.

## Orchestrator mental model

```
Local mutation → pending_sync / audit enqueue → server truth
Other device   → restoreFarmerCloudState → SQLite → UI reload
```

Settings **cloud parity hint** (`measureCloudParitySummary`) compares server plot/voucher counts vs local after sync — use when debugging “missing on iPad” reports.

## CI

| Job | Structural step |
|-----|-----------------|
| Expo / offline | `qa:structural:ci` |
| Backend | `qa:structural:ci` |
| Dashboard | `qa:structural:ci` |
| Marketing | `qa:structural:ci` (doc guard) |

## Agent rules

- `.cursor/rules/structural-contracts.mdc` — always-on pointer
- `.cursor/rules/cross-device-sync.mdc` — sync/evidence/state paths

## Pre-commit

`.husky/pre-commit` runs `scripts/pre-commit-structural-guard.mjs` for staged changes per app surface.

## PR template

Lane 3 includes a **Structural contracts** subsection — complete when touching offline features, sync, dashboard RBAC, backend audit/filing, or marketing routes/analytics.
