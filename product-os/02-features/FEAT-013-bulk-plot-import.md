# FEAT-013: Bulk plot import (Phase A–D)

## Goal

Let cooperatives and exporters onboard existing producer + plot data from CSV, GeoJSON, or tracebud_import_v1 packages without field re-capture — including large cooperative onboarding batches.

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

## Scope (Phase D — shipped)

- Async `bulk_import_jobs` persistence (`bulk_import_jobs` table, Section 50.3 aligned)
- `POST /v1/imports/plots/jobs` queues imports above 500 rows (up to 50,000)
- `GET /v1/imports/plots/jobs/:id` exposes progress counters and terminal status
- In-process background processing in 100-row batches with resumable counters
- Dashboard summary-only preview for large payloads (`summaryOnly: true`)
- Job progress UI with polling on `/plots/bulk-upload`

## Scope (Phase E — shipped)

- KML upload tab on `/plots/bulk-upload`
- Parses `Placemark` elements with `ExtendedData` / `SimpleData` property aliases
- Converts KML `Point` and `Polygon` geometries into the existing GeoJSON import pipeline
- Supports `MultiGeometry` wrappers with a single Point or Polygon child

## Non-goals (later phases)

- Evidence file ZIP import from package references
- Ed2559/RSA package signature verification
- External worker queue / object storage for job payloads

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

### Sync import (≤500 rows)

- Row `VALIDATION_FAILED` → blocked in preview
- Valid row → `IMPORTED` or `DUPLICATE_SKIPPED` (existing `clientPlotId`)

### Async job (&gt;500 rows)

- Job `QUEUED` → `PROCESSING` → `COMPLETED` | `PARTIAL` | `FAILED`
- Counters: `processed_records`, `success_count`, `failure_count`, `duplicate_skipped_count`

Imported plots enter normal compliance pipeline (`pending_check`).

## Acceptance criteria

### Phase D

- [x] Import with 501 rows queues job instead of synchronous execute
- [x] Job status endpoint returns progress counters while processing
- [x] Terminal job status reflects mixed success (`PARTIAL`) and total failure (`FAILED`)
- [x] Dashboard shows progress bar and polls until terminal state
- [x] Sync path still capped at 500 rows with actionable error message

### Phase E

- [x] KML sample with Point + Polygon placemarks maps to import rows
- [x] ExtendedData `client_plot_id` and producer fields mapped like GeoJSON properties
- [x] Invalid KML XML rejected client-side before preview

## Tests

- `tracebud-backend/src/plots/bulk-plot-import.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-job.service.spec.ts`
- `apps/dashboard-product/lib/bulk-plot-import-csv.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-geojson.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-kml.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-package.test.ts`
