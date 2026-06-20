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
};

export type BackupStatusDisplay = {
  label: string;
  needsAttention: boolean;
};

/** Farmer-facing backup pill in Settings — avoids transient checking/pending flicker. */
export function resolveBackupStatusDisplay(
  input: BackupStatusDisplayInput,
  t: TranslateFn,
): BackupStatusDisplay {
  if (input.isSyncInProgress) {
    return {
      label: t('settings_backup_status_syncing'),
      needsAttention: true,
    };
  }

  if (!input.isSignedIn) {
    const needsAttention = input.totalSyncPending > 0;
    return {
      label: needsAttention
        ? t('settings_backup_status_pending', { n: input.totalSyncPending })
        : t('up_to_date'),
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
        ? t('backup_waiting', { n: input.totalSyncPending })
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
      label: t('settings_backup_status_checking'),
      needsAttention: true,
    };
  }

  if (input.totalSyncPending > 0) {
    return {
      label: t('backup_waiting', { n: input.totalSyncPending }),
      needsAttention: true,
    };
  }

  return {
    label: t('backup_up_to_date'),
    needsAttention: false,
  };
}
