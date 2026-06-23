# Backend plot compliance registry

Code mirror: `tracebud-backend/src/compliance/backendPlotComplianceRegistry.ts`  
Canonical logic: `src/compliance/plot-compliance-status.ts`  
Guard: `backend-plot-compliance-guard.mjs`

## Plot compliance statuses

| Status | Meaning |
|--------|---------|
| `pending_check` | Awaiting GFW / screening |
| `deforestation_clear` | Cleared for harvest bundling |
| `under_review` | Amber tier — ground-truth photos may be required |
| `degradation_risk` | Overlap / degradation signal |
| `deforestation_detected` | Red tier — blocked |

Severity rank increases monotonically (`mergePlotComplianceStatus`).

## Harvest bundling aliases

`isPlotDeforestationFreeVerified` also accepts legacy aliases: `verified`, `compliant`.

## Audit events (plot domain)

`plot_compliance_checked`, `plot_deforestation_decision_recorded`, `plot_review_cleared`, `plot_review_upheld`, `gfw_check_run`, `gfw_check_failed` — see `backendAuditEventRegistry.ts`.

## When changing compliance logic

1. Update `plot-compliance-status.ts` + registry mirror.
2. Ensure `plots.service.ts` audit emits remain wired.
3. Run `npm run qa:structural`.
