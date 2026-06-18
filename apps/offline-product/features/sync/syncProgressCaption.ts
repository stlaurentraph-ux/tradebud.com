import type { TranslateFn } from '@/features/i18n/translate';

import {
  SYNC_SLOW_HINT_SECONDS,
  SYNC_STOPPING_SOON_SECONDS,
} from './syncOperationLimits';
import type { SyncQueueLockSnapshot, SyncQueuePhase } from './syncQueueMutex';

function phaseStepLabel(t: TranslateFn, phase: SyncQueuePhase): string {
  switch (phase) {
    case 'preparing':
      return t('sync_progress_preparing');
    case 'checking_connection':
      return t('sync_progress_connecting');
    case 'uploading_plots':
      return t('sync_progress_plots');
    case 'processing_consent':
      return t('sync_progress_consent');
    case 'processing_queue':
      return t('sync_progress_queue');
    case 'waiting_for_lock':
      return t('sync_progress_waiting');
    default:
      return t('sync_progress_working');
  }
}

function elapsedSeconds(nowMs: number, startedAt: number | null): number | null {
  if (startedAt == null) return null;
  return Math.max(1, Math.floor((nowMs - startedAt) / 1000));
}

function withElapsed(
  t: TranslateFn,
  step: string,
  seconds: number | null,
  options?: { slow?: boolean; stoppingSoon?: boolean },
): string {
  if (options?.stoppingSoon === true) {
    return t('sync_progress_stopping_soon', { step, seconds: seconds ?? 0 });
  }
  if (options?.slow === true) {
    return t('sync_progress_slow', { step, seconds: seconds ?? 0 });
  }
  if (seconds == null) return step;
  return t('sync_progress_with_elapsed', { step, seconds });
}

/** Live status line for Settings while backup/sync is running. */
export function formatSyncProgressCaption(
  t: TranslateFn,
  snapshot: SyncQueueLockSnapshot,
  options: { syncNowBusy: boolean; nowMs: number },
): string | null {
  if (!snapshot.locked) return null;

  const holderStep = phaseStepLabel(t, snapshot.phase);
  const holderElapsed = elapsedSeconds(options.nowMs, snapshot.lockStartedAt);
  const slow = holderElapsed != null && holderElapsed >= SYNC_SLOW_HINT_SECONDS;
  const stoppingSoon =
    holderElapsed != null && holderElapsed >= SYNC_STOPPING_SOON_SECONDS;

  if (options.syncNowBusy && snapshot.waiterCount > 0) {
    const waitElapsed = elapsedSeconds(options.nowMs, snapshot.waitingSince);
    return withElapsed(
      t,
      t('sync_progress_waiting_for_step', { step: holderStep }),
      waitElapsed,
      { slow, stoppingSoon },
    );
  }

  if (options.syncNowBusy) {
    return withElapsed(t, holderStep, holderElapsed, { slow, stoppingSoon });
  }

  return withElapsed(
    t,
    t('sync_background_in_progress', { step: holderStep }),
    holderElapsed,
    { slow, stoppingSoon },
  );
}
