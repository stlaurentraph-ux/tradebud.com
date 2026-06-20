import type { PendingSyncAction } from '@/features/state/persistence';
import type { TranslateFn } from '@/features/i18n/translate';
import { classifyQueueSyncFailure } from '@/features/sync/syncFailure';
import { formatSyncFailureUserMessage } from '@/features/sync/mapSyncFailureMessage';
import { mapSyncActionErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';
import {
  formatPendingSyncSummary,
  type SyncPendingSnapshot,
  type SyncNowUserOutcome,
} from '@/features/sync/formatSyncNowUserMessage';
import {
  resolveSyncConnectivityUserMessage,
} from '@/features/sync/syncReachabilityMessage';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

export type SyncAttentionContext = {
  pending: SyncPendingSnapshot;
  t: TranslateFn;
  /** Outcome from the most recent Sync now run, when composing a post-sync line. */
  syncOutcome?: Pick<
    SyncNowUserOutcome,
    | 'failureReason'
    | 'remainingPending'
    | 'syncFailure'
    | 'queueFetchFailed'
    | 'plotsFetchFailed'
    | 'unsyncedPlotCount'
    | 'blockedPlots'
    | 'supportMailto'
  >;
  queueLastError?: string | null;
  queueLastErrorActionType?: PendingSyncAction['actionType'] | null;
  plotsFetchFailed?: boolean;
  syncAccessFailure?: 'network' | 'session_expired' | null;
  /** When upload pass found zero unsynced but server confirmation still pending. */
  plotsUploadNotAttempted?: boolean;
};

export type SyncAttentionMessage = {
  message: string;
  kind: 'success' | 'error';
};

/**
 * Single farmer-facing backup/sync status line.
 * Priority: auth/connectivity → explicit failure → geometry → queue → plots → complete.
 */
export function resolveSyncAttentionMessage(ctx: SyncAttentionContext): SyncAttentionMessage {
  const { pending, t, syncOutcome } = ctx;
  const total = pending.total;

  if (ctx.syncAccessFailure === 'session_expired') {
    return { message: t('sync_session_expired_short'), kind: 'error' };
  }
  if (ctx.syncAccessFailure === 'network') {
    return { message: t('sync_auth_refresh_failed'), kind: 'error' };
  }

  if (syncOutcome?.syncFailure && total > 0) {
    return {
      message: formatSyncFailureUserMessage(syncOutcome.syncFailure, t),
      kind: 'error',
    };
  }

  const explicitReason = syncOutcome?.failureReason?.trim();
  if (explicitReason && total > 0) {
    return { message: explicitReason, kind: 'error' };
  }

  if (
    (syncOutcome?.queueFetchFailed || syncOutcome?.plotsFetchFailed || ctx.plotsFetchFailed) &&
    total > 0
  ) {
    return {
      message: resolveSyncConnectivityUserMessage(t, getTracebudApiBaseUrl()),
      kind: 'error',
    };
  }

  if (total <= 0) {
    return { message: t('sync_result_complete'), kind: 'success' };
  }

  const queuePending = pending.queuePendingCount;
  const queueError = ctx.queueLastError?.trim();
  if (queuePending > 0 && queueError) {
    const classified = classifyQueueSyncFailure({
      error: queueError,
      actionType: ctx.queueLastErrorActionType ?? undefined,
    });
    if (classified) {
      return { message: formatSyncFailureUserMessage(classified, t), kind: 'error' };
    }
    return {
      message: mapSyncActionErrorMessage(queueError, t, 'settings', {
        actionType: ctx.queueLastErrorActionType ?? undefined,
      }),
      kind: 'error',
    };
  }

  if (queuePending > 0) {
    return {
      message: t('sync_result_incomplete_queue', { n: queuePending }),
      kind: 'error',
    };
  }

  if (ctx.plotsUploadNotAttempted && pending.unsyncedPlotCount > 0) {
    const names = pending.unsyncedPlotNames.filter(Boolean).join(', ');
    return {
      message: names
        ? t('settings_sync_plot_not_confirmed_on_server', { names })
        : t('settings_sync_plot_upload_not_attempted'),
      kind: 'error',
    };
  }

  return {
    message: formatPendingSyncSummary(pending, t),
    kind: 'error',
  };
}
