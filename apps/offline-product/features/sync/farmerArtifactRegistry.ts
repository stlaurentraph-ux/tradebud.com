/**
 * Code mirror of product-os/04-quality/farmer-artifact-sync-registry.md.
 * Used by sync-parity-guard.mjs — keep in sync with the markdown table.
 */

export const PENDING_SYNC_UPLOAD_ACTION_TYPES = [
  'harvest',
  'photos_sync',
  'evidence_sync',
  'audit_sync',
] as const;

export type PendingSyncUploadActionType = (typeof PENDING_SYNC_UPLOAD_ACTION_TYPES)[number];

export const FARMER_ARTIFACT_RESTORE_MODULES = [
  'restoreLocalPlotsFromServer',
  'restoreLocalDeliveryReceiptsFromServer',
  'restoreLocalDeclarationsFromServer',
  'restoreLocalPlotPhotosFromServerAudit',
  'restoreLocalEvidenceFromServer',
  'restoreLocalFieldDevicePreferencesFromServer',
  'restoreLocalFarmerProfilePhotoFromServer',
  'restorePlotMappingDraftFromServer',
] as const;

export const FIELD_CLOUD_AUDIT_EVENT_TYPES = [
  'producer_attestations_updated',
  'plot_compliance_declared',
  'plot_photos_synced',
  'plot_legal_synced',
  'field_device_preferences_updated',
  'farmer_profile_photo_synced',
  'plot_mapping_draft_saved',
  'plot_mapping_draft_cleared',
] as const;

/** Screens that load plot media must react to server restore. */
export const PLOT_MEDIA_UI_FILES = [
  'app/plot/[id].tsx',
  'app/documents.tsx',
] as const;

/**
 * Screens that must reload after cross-device restore.
 * Guard: ui-reload-guard.mjs — each entry needs every pattern (or useFocusEffect for focus-restore).
 */
export const FARMER_ARTIFACT_UI_RELOAD_FILES = [
  {
    file: 'app/plot/[id].tsx',
    patterns: ['useFocusCloudPull', 'useReloadOnServerPlotSyncChanged'],
  },
  {
    file: 'app/documents.tsx',
    patterns: ['useFocusCloudPull', 'useReloadOnServerPlotSyncChanged'],
  },
  {
    file: 'app/(tabs)/harvests.tsx',
    patterns: ['useFocusCloudPull', 'useReloadOnServerPlotSyncChanged'],
  },
  {
    file: 'app/(tabs)/explore.tsx',
    patterns: ['useFocusCloudPull', 'useReloadOnServerPlotSyncChanged'],
  },
  {
    file: 'app/(tabs)/settings.tsx',
    patterns: ['restoreCloudStateOnFocus', 'useReloadOnServerPlotSyncChanged', 'useFocusEffect'],
  },
  {
    file: 'features/mapping/WalkPerimeterScreen.tsx',
    patterns: ['useFocusEffect'],
  },
] as const;

export const FIELD_DEVICE_PREFERENCES_AUDIT = 'field_device_preferences_updated' as const;
export const FARMER_PROFILE_PHOTO_AUDIT = 'farmer_profile_photo_synced' as const;
export const PLOT_MAPPING_DRAFT_AUDIT = 'plot_mapping_draft_saved' as const;
export const PLOT_MAPPING_DRAFT_CLEARED_AUDIT = 'plot_mapping_draft_cleared' as const;
