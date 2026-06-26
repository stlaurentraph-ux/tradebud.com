# Dashboard exporter workflow registry

Code mirror: `apps/dashboard-product/lib/dashboardExporterWorkflowRegistry.ts`  
Manual QA checklist: `product-os/04-quality/exporter-critical-path-qa.md`

## Critical routes

`/`, `/farmers/new`, `/harvests`, `/packages`, `/packages/[id]`, `/packages/[id]/assemble`, `/compliance/issues`

## Readiness gate surfaces

| Surface | Readiness hook | Blocker UI |
|---------|----------------|------------|
| Package detail | `usePackageReadiness` | `BlockerCard` + disabled Assemble Shipment |
| Assemble wizard | `usePackageReadiness` | Seal disabled when blockers present |
| Exporter detail | — | `PackageLineageSummaryCard` (exporter role only) |

## North-star CTAs (exporter)

| Condition | CTA |
|-----------|-----|
| Blocking issues | `/compliance/issues` |
| Yield failures | `/compliance/issues` |
| Ready to seal | `/packages?status=READY` |
| Default handoff | `/packages?status=SEALED` |

## Handoff copy helpers

`getPackageFilingWorkflowHint`, `getPackagePreflightBlockersDescription`, `getAssembleShipmentSubtitle` — covered by `supply-chain-terminology-handoff.test.ts`

## Guards

- `dashboard-exporter-workflow-guard.mjs`

## Playwright golden path

`e2e/exporter-package-readiness.spec.ts` — assemble disabled with blockers, link enabled when clear (mocked readiness API).

## Manual QA still required (exporter-critical-path-qa.md)

- §1 Full lineage chain on real tenant (producer → plot → batch → shipment)
- §2.4 Resolve blockers via live compliance runs
- §3.3 KPI counts vs backend metrics
- Sign-off table
