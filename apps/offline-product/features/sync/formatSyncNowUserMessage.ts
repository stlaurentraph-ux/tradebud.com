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
  /** One farmer-facing reason when sync did not finish (plot upload / queue). */
  failureReason?: string;
};

/** One short line after Sync now — success or failure, no debug stats. */
export function formatSyncNowUserMessage(outcome: SyncNowUserOutcome, t: TranslateFn): string {
  if (outcome.sessionExpired) return t('sync_session_expired_short');
  if (outcome.noFarmer) return t('sync_no_farmer_profile');

  const remainingPending = outcome.remainingPending ?? 0;

  if (outcome.queueFetchFailed || outcome.plotsFetchFailed) {
    if (remainingPending > 0) {
      const reason = outcome.failureReason?.trim();
      if (reason) return reason;
      return t('sync_reach_failed_short');
    }
  }

  if (remainingPending === 0) {
    return t('sync_result_complete');
  }

  const reason = outcome.failureReason?.trim();
  if (reason) {
    return reason;
  }

  return t('sync_result_incomplete', { n: remainingPending });
}
