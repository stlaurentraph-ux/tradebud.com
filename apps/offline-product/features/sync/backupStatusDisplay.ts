import type { TranslateFn } from '@/features/i18n/translate';
import { resolveSyncConnectivityUserMessage } from '@/features/sync/syncReachabilityMessage';

export type BackupStatusDisplayInput = {
  isSignedIn: boolean;
  isSyncInProgress: boolean;
  plotsFetchState: 'idle' | 'loading' | 'ok' | 'failed';
  syncAccessFailure: 'network' | 'session_expired' | null;
  totalSyncPending: number;
  plotsCount: number;
  /** When false, a background refresh is in flight — keep the last pill stable. */
  hasSettledMetrics: boolean;
  syncApiBaseUrl: string;
  /** When true, cloud parity detected restore gaps — pill should hint restore, not "all good". */
  cloudParityNeedsRestore?: boolean;
};

export type BackupStatusDisplay = {
  label: string;
  needsAttention: boolean;
};

/** Short backup status chip — detail lives in the card body, not the pill. */
export function resolveBackupStatusDisplay(
  input: BackupStatusDisplayInput,
  t: TranslateFn,
): BackupStatusDisplay {
  if (input.isSyncInProgress) {
    return {
      label: t('backup_pill_syncing'),
      needsAttention: true,
    };
  }

  if (!input.isSignedIn) {
    const needsAttention = input.totalSyncPending > 0;
    return {
      label: needsAttention ? t('backup_pill_pending') : t('backup_pill_ok'),
      needsAttention,
    };
  }

  if (input.syncAccessFailure === 'network') {
    return { label: t('sync_auth_refresh_failed'), needsAttention: true };
  }
  if (input.syncAccessFailure === 'session_expired') {
    return { label: t('sync_session_expired_short'), needsAttention: true };
  }

  if (input.plotsFetchState === 'failed') {
    const needsAttention = input.totalSyncPending > 0;
    return {
      label: needsAttention
        ? t('backup_pill_pending')
        : resolveSyncConnectivityUserMessage(t, input.syncApiBaseUrl),
      needsAttention: true,
    };
  }

  if (
    input.plotsFetchState === 'loading' &&
    input.plotsCount > 0 &&
    !input.hasSettledMetrics
  ) {
    return {
      label: t('backup_pill_checking'),
      needsAttention: true,
    };
  }

  if (input.totalSyncPending > 0) {
    return {
      label: t('backup_pill_pending'),
      needsAttention: true,
    };
  }

  if (input.cloudParityNeedsRestore) {
    return {
      label: t('backup_pill_restore_available'),
      needsAttention: true,
    };
  }

  return {
    label: t('backup_pill_ok'),
    needsAttention: false,
  };
}
