# Field capture quality registry

Cross-surface geometry confidence + shipment approval gates (ADR-008 S6).

## Tiers

| Tier | Meaning |
|------|---------|
| `high` | GNSS / tight trace — no desk approval required for shipment ack policy defaults |
| `moderate` | Fair confidence — desk approval recommended |
| `low` | Weak confidence — desk approval recommended or required per tenant policy |

## Backend policy

- Code: `tracebud-backend/src/plots/plot-capture-quality-policy.ts`
- Columns: `plot.geometry_approved_at`, `plot.geometry_approved_by`
- Tenant overrides: `tenant_geometry_policy.geometry_sync_min_tier`, `shipment_geometry_ack_mode`
- Endpoint: `POST /v1/plots/:id/approve-geometry`
- Audit: `plot_geometry_approved`; cleared on `plot_geometry_superseded`

## Dashboard

- `PlotGeometryApprovalCard` on plot dossier
- Proxy: `/api/plots/[id]/approve-geometry`
- Analytics: `plot_geometry_approved`

## Package readiness codes

- `GEOMETRY_APPROVAL_REQUIRED` (blocker)
- `GEOMETRY_APPROVAL_RECOMMENDED` (warning)

## Guards

- `backend-cadastral-parcel-guard.mjs` (fixture lookup — desk mapping assist)
- `dashboard-mapping-workflow-guard.mjs` (approval card wiring)
