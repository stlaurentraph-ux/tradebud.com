import type { PendingSyncAction } from '@/features/state/persistence';

/** Collapsed backup panel: title + one summary line only. */
export const BACKUP_ATTENTION_MAX_COLLAPSED_LINES = 2;
/** Expanded details: cap technical lines so the card stays scannable. */
export const BACKUP_ATTENTION_MAX_DETAIL_LINES = 5;

export type BackupAttentionSnapshot = {
  isSignedIn: boolean;
  queueLastError: string | null;
  queueLastErrorActionType: PendingSyncAction['actionType'] | null;
  queuePendingCount: number;
  queueRetryingCount: number;
  queueMaxAttempts: number;
  queueNextRetrySeconds: number | null;
  unsyncedPlotCount: number;
  plotsFetchFailed: boolean;
  queuePendingBreakdown: string | null;
};

export type BackupAttentionDetailKind =
  | 'queue_error_full'
  | 'queue_health'
  | 'queue_breakdown'
  | 'unsynced_plots'
  | 'next_retry';

export function shouldShowBackupAttentionPanel(snapshot: BackupAttentionSnapshot): boolean {
  if (!snapshot.isSignedIn) return false;
  if (snapshot.plotsFetchFailed && snapshot.queuePendingCount > 0) return true;
  if (snapshot.queueLastError && snapshot.queuePendingCount > 0) return true;
  if (snapshot.unsyncedPlotCount > 0 && snapshot.plotsFetchFailed) return true;
  return false;
}

export function pickBackupAttentionPrimaryKind(
  snapshot: BackupAttentionSnapshot,
): 'connectivity' | 'queue_error' | 'unsynced_plots' | 'queue_waiting' | null {
  if (!shouldShowBackupAttentionPanel(snapshot)) return null;
  if (
    snapshot.plotsFetchFailed &&
    (snapshot.queuePendingCount > 0 || snapshot.unsyncedPlotCount > 0)
  ) {
    return 'connectivity';
  }
  if (snapshot.queueLastError) return 'queue_error';
  if (snapshot.unsyncedPlotCount > 0) return 'unsynced_plots';
  if (snapshot.queuePendingCount > 0) return 'queue_waiting';
  return null;
}

export function listBackupAttentionDetailKinds(
  _snapshot: BackupAttentionSnapshot,
): BackupAttentionDetailKind[] {
  return [];
}

/** Detail lines shown only after the user expands — never duplicate the collapsed summary. */
export function listBackupAttentionExpandedDetailKinds(
  _snapshot: BackupAttentionSnapshot,
): BackupAttentionDetailKind[] {
  return [];
}

export function shouldOfferBackupAttentionDetails(_snapshot: BackupAttentionSnapshot): boolean {
  return false;
}
