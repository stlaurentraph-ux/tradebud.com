import type { TranslateFn } from '@/features/i18n/translate';

export type SyncNowUserOutcome = {
  sessionExpired?: boolean;
  noFarmer?: boolean;
  plotsNone?: boolean;
  plotsAlreadySynced?: boolean;
  plotsUploadedAll?: { uploaded: number; total: number };
  plotsPartial?: { uploaded: number; total: number; failed: number };
  queueCompleted?: number;
  queueFailed?: number;
  queueFetchFailed?: boolean;
  plotsFetchFailed?: boolean;
  /** Measured after the run — queue + unsynced plots still on device. */
  remainingPending?: number;
};

/** One farmer-facing line after Sync now — never queue debug stats. */
export function formatSyncNowUserMessage(outcome: SyncNowUserOutcome, t: TranslateFn): string {
  if (outcome.sessionExpired) return t('sync_session_expired_short');
  if (outcome.noFarmer) return t('sync_no_farmer_profile');

  const queueFailed = outcome.queueFailed ?? 0;
  const plotsFailed = outcome.plotsPartial?.failed ?? 0;
  const hadFailure = queueFailed > 0 || plotsFailed > 0;
  const queueCompleted = outcome.queueCompleted ?? 0;
  const remainingPending = outcome.remainingPending ?? 0;

  if (outcome.queueFetchFailed) {
    return t('settings_sync_reach_failed');
  }

  if (hadFailure) {
    if (remainingPending > 0) {
      return t('settings_sync_still_pending', { n: remainingPending });
    }
    return t('settings_sync_result_partial');
  }

  if (outcome.plotsUploadedAll) {
    if (remainingPending > 0) {
      return t('settings_sync_still_pending', { n: remainingPending });
    }
    return t('sync_plots_uploaded_all', {
      uploaded: outcome.plotsUploadedAll.uploaded,
      total: outcome.plotsUploadedAll.total,
    });
  }

  if (queueCompleted > 0) {
    if (remainingPending > 0) {
      return t('settings_sync_result_sent_with_remaining', {
        sent: queueCompleted,
        n: remainingPending,
      });
    }
    return t('settings_sync_result_sent', { n: queueCompleted });
  }

  if (outcome.plotsFetchFailed) {
    return t('sync_plots_fetch_failed');
  }

  if (remainingPending > 0) {
    return t('settings_sync_still_pending', { n: remainingPending });
  }

  if (outcome.plotsAlreadySynced || outcome.plotsNone) {
    return t('backup_up_to_date');
  }

  return t('backup_up_to_date');
}
