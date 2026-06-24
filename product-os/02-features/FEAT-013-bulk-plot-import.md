# FEAT-013: Bulk plot import (Phase A + B + C)

## Goal

Let cooperatives and exporters onboard existing producer + plot data from CSV, GeoJSON, or tracebud_import_v1 packages without field re-capture.

## Scope (Phase A — shipped)

- Dashboard `/plots/bulk-upload` wizard: upload/paste CSV → server preview → import
- Backend `POST /v1/imports/plots/preview` and `POST /v1/imports/plots`
- Point plots (&lt;4 ha) via latitude/longitude + declared area
- Cadastral polygons via `cadastral_key` + `country_code` (fixture/registry lookup)
- Producer resolution: match CRM farmer by email or create farmer contact
- Idempotent plot create via existing `clientPlotId` reconciliation
- RBAC: `plots:bulk_upload` (cooperative, exporter, admin, compliance_manager)
- Analytics: `dashboard_bulk_plot_import_preview|success|failure`

## Scope (Phase B — shipped)

- GeoJSON `FeatureCollection` upload tab on `/plots/bulk-upload`
- Inline `geometry` on import rows: GeoJSON `Point` or `Polygon`
- Feature `properties` mapped with same aliases as CSV (`client_plot_id`, `producer_full_name`, etc.)
- Polygon rows accept optional `declared_area_ha` (defaults to 0.01 ha when omitted)
- Point geometry rows still require `declared_area_ha` and remain capped at &lt;4 ha

## Scope (Phase C — shipped)

- `tracebud_import_v1` JSON import package tab on `/plots/bulk-upload`
- Canonical package fields: `format_version`, `source_system`, `exported_at`, `producers[]`, `plots[]`
- Join plots to producers via `producer_ref`
- Optional `content_hash_sha256` integrity verification (canonical JSON hash)
- `evidence_references[]` surfaced as non-importable metadata notice
- `signature` field rejected until asymmetric verification lands (hash-only integrity for now)

## Non-goals (later phases)

- KML file upload
- Async `bulk_import_jobs` (&gt;500 rows)
- Evidence file ZIP import from package references
- Ed2559/RSA package signature verification

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

- Row `VALIDATION_FAILED` → blocked in preview
- Valid row → `IMPORTED` or `DUPLICATE_SKIPPED` (existing `clientPlotId`)
- Imported plots enter normal compliance pipeline (`pending_check`)

## Acceptance criteria

### Phase A

- [x] Cooperative user uploads template CSV with 2 rows → preview shows READY/FAILED per row
- [x] Import creates CRM farmer contacts when email absent but name present
- [x] Re-import same `client_plot_id` for same producer → `DUPLICATE_SKIPPED`, no error
- [x] Point row ≥4 ha rejected in preview
- [x] Cadastral row hydrates polygon when fixture exists
- [x] Backend API access registry row `bulk_plot_import`

### Phase B

- [x] GeoJSON FeatureCollection with Point + Polygon features maps to import rows
- [x] Polygon feature imports with declared area from properties
- [x] Point feature with GeoJSON geometry respects &lt;4 ha cap
- [x] Invalid GeoJSON root rejected client-side before preview

### Phase C

- [x] tracebud_import_v1 sample package maps producers + plots to import rows
- [x] content_hash_sha256 mismatch rejected before preview
- [x] Unknown producer_ref plots skipped with user-visible notice
- [x] evidence_references counted but not imported

## Tests

- `tracebud-backend/src/plots/bulk-plot-import.service.spec.ts`
- `apps/dashboard-product/lib/bulk-plot-import-csv.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-geojson.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-package.test.ts`
