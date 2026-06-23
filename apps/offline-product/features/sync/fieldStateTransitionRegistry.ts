/**
 * Canonical offline sync and plot readiness state transitions.
 * Code mirror: product-os/04-quality/field-state-transition-registry.md
 */
import type { SyncQueuePhase } from '@/features/sync/syncQueueMutex';
import { PENDING_SYNC_UPLOAD_ACTION_TYPES } from '@/features/sync/farmerArtifactRegistry';

/** Sync now pipeline phases (must match syncQueueMutex SyncQueuePhase). */
export const SYNC_QUEUE_PHASES = [
  'idle',
  'preparing',
  'waiting_for_lock',
  'checking_connection',
  'restoring_plots',
  'uploading_plots',
  'processing_consent',
  'processing_queue',
] as const satisfies readonly SyncQueuePhase[];

export type CanonicalSyncQueuePhase = (typeof SYNC_QUEUE_PHASES)[number];

/** Pending sync queue action types (upload path). */
export const PENDING_SYNC_TRANSITION_ACTIONS = PENDING_SYNC_UPLOAD_ACTION_TYPES;

/** Plot readiness gates evaluated in plotChecklist (order matters for UX). */
export const PLOT_READINESS_GATES = [
  'geometry',
  'ground_photos',
  'land_documents',
  'producer_declarations',
  'plot_attestations',
] as const;

export type PlotReadinessGate = (typeof PLOT_READINESS_GATES)[number];

/** Restore orchestrator stages (restoreFarmerCloudState). */
export const RESTORE_PIPELINE_STAGES = [
  'declarations',
  'ground_truth_photos',
  'evidence',
  'device_preferences',
  'profile_photo',
  'mapping_draft',
  'offline_tiles',
] as const;

export type RestorePipelineStage = (typeof RESTORE_PIPELINE_STAGES)[number];
