# FEAT-013: Bulk plot import (Phase A–G2+)

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

## Scope (Phase F — shipped)

- Optional evidence ZIP upload on the import package tab
- `evidence_references[]` require `client_plot_id` and match ZIP entries by `document_ref` or `file_name`
- Optional `file_hash_sha256` verification before upload
- `POST /v1/imports/plots/evidence` uploads files to plot-evidence storage and registers documents via existing sync path
- Evidence import runs after plot import completes (sync and async job paths)

## Scope (Phase G — shipped)

- Tenant-scoped Ed25519 public key registry (`tenant_import_signing_keys`)
- Settings page `/settings/import-signing-keys` for `admin` / `compliance_manager`
- `GET/POST /v1/imports/plots/signing-keys` and `POST .../signing-keys/:id/revoke`
- `POST /v1/imports/plots/packages/verify` validates hash + optional signature
- Unsigned packages import with warning; invalid signatures block import
- Preview/execute/job endpoints re-verify signed packages server-side

## Scope (Phase G2 — shipped)

- Tenant policy toggles on `tenant_bulk_import_policy`
- `require_signed_packages` blocks unsigned tracebud_import_v1 packages (package tab only)
- `GET/PATCH /v1/imports/plots/policy` for admin / compliance_manager

## Scope (Phase G3 — shipped)

- Global `integrator_import_signing_keys` allowlist (Tracebud-maintained)
- `accept_integrator_signatures` tenant toggle opts into integrator verification
- `GET /v1/imports/plots/integrator-keys` read-only catalog for dashboard
- Verification response includes `signerType` (`tenant` | `integrator`)

## Scope (Phase G4 — shipped)

- Large async job payloads (&gt;=512 KiB serialized) stored in Supabase object storage
- `bulk_import_jobs.file_storage_key` populated; inline `payload_jsonb` holds metadata stub
- Graceful fallback to inline storage when bucket credentials are unavailable

## Non-goals (later phases)

- External worker queue (Redis/Bull) separate from API process
- Integrator self-service key registration UI

## Scope (Observability hardening — shipped)

- `BulkPlotImportObservabilityService` for structured JSON logs (`scope: bulk_plot_import`)
- Backend audit events: `bulk_import_execute_completed`, `bulk_import_job_completed`, `bulk_import_job_crashed`, `bulk_import_job_payload_storage_fallback`
- Job lifecycle logs include `tenantId`, `jobId`, `storageMode`, counters
- Shared `@tracebud/import-v1-canonical` package + golden fixture parity tests (backend + dashboard)
- Dashboard analytics: `dashboard_bulk_plot_import_policy_updated`

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

### Phase F

- [x] Evidence ZIP entries matched to `evidence_references` by `document_ref`
- [x] Evidence files uploaded and linked to plots by `client_plot_id` after plot import
- [x] Hash mismatch and missing plot/reference failures surfaced per file

### Phase G

- [x] Tenant admin can register/revoke Ed25519 public keys with stable `kid`
- [x] Signed packages verify against tenant keys; unsigned packages warn but import
- [x] Invalid or revoked-key signatures block preview and import
- [x] Audit events for key lifecycle and signature verification outcomes

### Phase G2+

- [x] Tenant admin can require signed packages for tracebud_import_v1 imports
- [x] Tenant can opt into Tracebud-approved integrator signatures
- [x] Integrator keys resolve by `kid` with optional `source_system` allowlist
- [x] Async jobs spill large payloads to object storage with inline fallback

### Observability hardening

- [x] Sync execute and async job terminal states write backend audit events
- [x] Storage fallback and job crashes are auditable with structured logs
- [x] Dashboard/backend canonical hash parity guarded by shared golden fixture
- [x] Policy updates emit dashboard analytics event

## Tests

- `tracebud-backend/src/plots/bulk-plot-import.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-job.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-job-storage.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-evidence.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-package.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-policy.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-observability.service.spec.ts`
- `tracebud-backend/src/plots/bulk-plot-import-package-canonical.parity.spec.ts`
- `apps/dashboard-product/lib/bulk-plot-import-package-canonical.parity.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-csv.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-geojson.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-kml.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-evidence.test.ts`
- `apps/dashboard-product/lib/bulk-plot-import-package.test.ts`
