# Dashboard mapping workflow registry

Code mirror: `apps/dashboard-product/lib/dashboardMappingWorkflowRegistry.ts`  
Guard: `dashboard-mapping-workflow-guard.mjs`

## Surfaces

| ID | UI / route | Notes |
|----|------------|-------|
| `plot-detail-geometry-approval` | `PlotGeometryApprovalCard` on plot detail | Uses `usePlotMapPreview` + approve proxy |
| `cadastral-parcel-lookup-proxy` | `/api/cadastral/parcels/lookup` | Proxies backend demo fixture lookup |

## Test IDs

- `plot-geometry-approval-card`
- `plot-geometry-approval-badge`
- `plot-geometry-approval-action`

## Analytics

- `plot_geometry_approved`

## Playwright

- `e2e/plot-geometry-approval.spec.ts` (golden path `plot_geometry_approval`)
