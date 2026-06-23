# Field state transition registry (offline MVP)

Code mirror: `apps/offline-product/features/sync/fieldStateTransitionRegistry.ts`  
Guard: `state-transition-guard.mjs`

## Sync queue phases

Manual Sync now and auto-backup drive these phases via `setSyncQueuePhase`:

```
idle → preparing → waiting_for_lock → checking_connection
  → restoring_plots → uploading_plots → processing_consent → processing_queue → idle
```

Implemented in `runFieldSyncPipeline.ts`. Do not skip `restoring_plots` before upload on cross-device restore.

## Pending sync actions

| actionType | Handler | Idempotent |
|------------|---------|------------|
| harvest | postHarvestToBackend | clientEventId |
| photos_sync | syncGroundTruthPhotos / land title | plot link required |
| evidence_sync | syncPlotEvidenceWithFiles | storage path |
| audit_sync | postAuditEventToBackend | audit dedup key |

## Plot readiness gates

Evaluated in `plotChecklist.ts` / `loadPlotReadiness`:

1. geometry
2. ground_photos
3. land_documents
4. producer_declarations
5. plot_attestations

## Restore pipeline stages

`restoreFarmerCloudState` order (after plot linking):

1. declarations (skipped when mediaOnly)
2. ground_truth_photos + evidence (parallel)
3. device_preferences + profile_photo + mapping_draft (parallel)
4. offline_tiles (via device prefs — `restoreMissingOfflineTilePacksFromServer`)

## Rules

- Do not bypass canonical transitions (upload before declaring sync complete).
- Offline conflicts use HLC ordering on `pending_sync.hlcTimestamp`.
- New restore stage → add to `RESTORE_PIPELINE_STAGES` + orchestrator + farmer artifact registry.
