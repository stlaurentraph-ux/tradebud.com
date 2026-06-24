# FEAT-013: Bulk plot import (Phase A)

## Goal

Let cooperatives and exporters onboard existing producer + plot data from CSV without field re-capture.

## Scope (Phase A — shipped)

- Dashboard `/plots/bulk-upload` wizard: upload/paste CSV → server preview → import
- Backend `POST /v1/imports/plots/preview` and `POST /v1/imports/plots`
- Point plots (&lt;4 ha) via latitude/longitude + declared area
- Cadastral polygons via `cadastral_key` + `country_code` (fixture/registry lookup)
- Producer resolution: match CRM farmer by email or create farmer contact
- Idempotent plot create via existing `clientPlotId` reconciliation
- RBAC: `plots:bulk_upload` (cooperative, exporter, admin, compliance_manager)
- Analytics: `dashboard_bulk_plot_import_preview|success|failure`

## Non-goals (later phases)

- GeoJSON/KML file upload
- Async `bulk_import_jobs` (&gt;500 rows)
- `tracebud_import_v1` signed portability package
- Evidence file ZIP import

## Permissions

| Role | Preview/import |
|------|----------------|
| cooperative | yes |
| exporter | yes |
| compliance_manager | yes |
| admin | yes |
| importer | no (view plots only) |
| farmer | no |

## State transitions

- CSV row `VALIDATION_FAILED` → blocked in preview
- Valid row → `IMPORTED` or `DUPLICATE_SKIPPED` (existing `clientPlotId`)
- Imported plots enter normal compliance pipeline (`pending_check`)

## Acceptance criteria

- [x] Cooperative user uploads template CSV with 2 rows → preview shows READY/FAILED per row
- [x] Import creates CRM farmer contacts when email absent but name present
- [x] Re-import same `client_plot_id` for same producer → `DUPLICATE_SKIPPED`, no error
- [x] Point row ≥4 ha rejected in preview
- [x] Cadastral row hydrates polygon when fixture exists
- [x] Backend API access registry row `bulk_plot_import`

## Tests

- `tracebud-backend/src/plots/bulk-plot-import.service.spec.ts`
- `apps/dashboard-product/lib/bulk-plot-import-csv.test.ts`
