# FEAT: Dashboard exporter workflow structural contracts

Status: **shipped (structural slice)**  
Registry: `apps/dashboard-product/lib/dashboardExporterWorkflowRegistry.ts`  
Manual QA: `product-os/04-quality/exporter-critical-path-qa.md`

## Scope

- Registry for exporter critical routes, readiness gates, north-star CTAs, handoff copy helpers
- Structural guard wiring package detail + assemble + exporter home
- Playwright golden path #6 (`exporter_package_readiness`) with mocked readiness API

## Out of scope (manual checklist)

- End-to-end lineage on live tenant (§1)
- Blocker resolution via real compliance runs (§2.4)
- KPI metric parity with backend (§3.3)

## Acceptance criteria

- [x] `dashboard-exporter-workflow-guard.mjs` passes
- [x] Playwright asserts assemble disabled/enabled from readiness mocks
- [x] Handoff copy remains covered by unit tests
