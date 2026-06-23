# Farmer artifact sync registry

Canonical inventory of everything a farmer **uploads or generates** in the field app. Every row must have symmetric **upload** and **restore** paths before merge.

**Code mirror:** `apps/offline-product/features/sync/farmerArtifactRegistry.ts`  
**CI guard:** `npm run qa:regression` → `sync-parity-guard.mjs`

## How to use

1. New farmer-facing data? Add a row here **and** in `farmerArtifactRegistry.ts`.
2. Wire upload (queue or immediate audit) and restore (called from `restoreFarmerCloudState`).
3. Add/extend unit test + DEVICE_SMOKE §12 checkbox if cross-device.
4. Run `node scripts/sync-parity-guard.mjs` locally.

## Registry

| Artifact | Local store | Upload | Server canonical | Restore | UI refresh |
|----------|-------------|--------|------------------|---------|------------|
| Plot boundary | `plots` | plot upload | `plot` + GeoJSON | `restoreLocalPlotsFromServer` | `reloadFromDisk`, plot list |
| Plot ↔ server link | `plot_server_links` | plot upload | `client_plot_id` | `warmPlotServerLinks` | plot detail |
| Ground-truth photos | `plot_photos` | `photos_sync` | Storage + `plot_photos_synced` audit | `restoreLocalPlotPhotosFromServerAudit` | plot detail photos |
| Land title photos | `plot_title_photos` | `photos_sync` | Storage + audit + tenure | audit + `restoreLocalEvidenceFromServer` | plot detail documents |
| Tenure / FPIC / permit | `plot_evidence` | `evidence_sync` | `evidence_documents` + Storage | `restoreLocalEvidenceFromServer` | documents, plot detail |
| Producer supporting | `plot_evidence` (scope) | `evidence_sync` | same | same | documents |
| Producer declarations | `farmer` | `audit_sync` | `producer_attestations_updated` | `restoreLocalDeclarationsFromServer` | documents |
| Plot attestations | `plots` flags | `audit_sync` | `plot_compliance_declared` | same | plot detail |
| Cadastral / informal tenure | `plot_legal` | legal + land upload | `plot_legal_synced` audit | same | plot detail |
| Delivery receipts | `local_delivery_receipts` | `harvest` | vouchers | `restoreLocalDeliveryReceiptsFromServer` | harvests |
| Delivery dates | receipt + `harvest_date` | backfill / PATCH | voucher column | `supplementVoucherHarvestDates` | harvests |
| **Declaration GPS + prefs** | `farmer` + `settings` | `audit_sync` | `field_device_preferences_updated` | `restoreLocalFieldDevicePreferencesFromServer` | settings advanced |
| **Farmer profile photo** | settings + `farmer` | `audit_sync` + Storage | `farmer_profile_photo_synced` | `restoreLocalFarmerProfilePhotoFromServer` | settings profile |
| **Offline map packs** | filesystem packs | `audit_sync` (manifest) | prefs audit + local re-download | `restoreMissingOfflineTilePacksFromServer` | walk/map |
| **In-progress walk trace** | `plot_mapping_drafts` | `audit_sync` | `plot_mapping_draft_saved` | `restorePlotMappingDraftFromServer` | walk perimeter |

## Supabase / API subtleties

- **Storage vs metadata:** bytes in `plot-evidence` bucket; list rows in Postgres or audit payloads.
- **Multiple sources:** land titles may appear in audit, tenure API, and synced-evidence — dedupe by `storagePath`.
- **Audit is append-only:** restore uses **latest** event per `(farmerId, kind)` or `(serverPlotId, photo kind)`.
- **Plot link gate:** without `plot_server_links`, plot-scoped restore skips (`skippedUnlinked`).
- **Farmer scope:** always `prepareFieldSyncContext` / `ownedFarmerIds`.
- **Offline tiles:** cross-device syncs **manifest + active pack id**; device re-downloads tiles (not full binary upload).

## Intentional exclusions

None for v1.6 field app — all farmer artifacts above are cross-device.
