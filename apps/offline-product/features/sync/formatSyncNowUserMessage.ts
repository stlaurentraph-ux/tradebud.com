import type { TranslateFn } from '@/features/i18n/translate';
import type { PlotSyncBlockInfo } from '@/features/sync/plotSyncPending';
import type { SyncFailure } from '@/features/sync/syncFailure';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import { resolveSyncReachFailedShortMessage } from '@/features/sync/syncReachabilityMessage';
import { formatSyncFailureUserMessage } from '@/features/sync/mapSyncFailureMessage';

export type SyncPendingSnapshot = {
  total: number;
  unsyncedPlotCount: number;
  blockedPlotCount?: number;
  queuePendingCount: number;
  unsyncedPlotNames: string[];
  blockedPlots?: PlotSyncBlockInfo[];
};

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
  plotsRestored?: number;
  receiptsRestored?: number;
  receiptsRequeued?: number;
  evidenceRestored?: number;
  groundTruthPhotosRestored?: number;
  declarationsRestored?: number;
  evidenceFetchFailed?: boolean;
  evidenceDownloadFailed?: number;
  declarationsFetchFailed?: boolean;
  /** Measured after the run — queue + plots still needing attention on device. */
  remainingPending?: number;
  unsyncedPlotCount?: number;
  blockedPlotCount?: number;
  unsyncedPlotNames?: string[];
  blockedPlots?: PlotSyncBlockInfo[];
  queuePendingCount?: number;
  /** One farmer-facing reason when sync did not finish (plot upload / queue). */
  failureReason?: string;
  /** Typed failure from the queue or plot fetch — preferred for farmer copy. */
  syncFailure?: SyncFailure;
  /** Prefilled mailto when overlap looks wrong on the map. */
  supportMailto?: string;
};

function formatBlockedPlotMessage(block: PlotSyncBlockInfo, t: TranslateFn): string {
  if (block.code === 'GEO-105' && block.overlapPlotName) {
    return t('geo_quality_overlap_upload', {
      plotName: block.plotName,
      otherPlotName: block.overlapPlotName,
    });
  }
  return block.message;
}

/** Farmer-facing line for anything still waiting after sync or on Settings refresh. */
export function formatPendingSyncSummary(
  pending: SyncPendingSnapshot,
  t: TranslateFn,
  failureReason?: string,
): string {
  const reason = failureReason?.trim();
  if (reason) return reason;

  if (pending.total <= 0) {
    return t('sync_result_complete');
  }

  const blocked = pending.blockedPlots ?? [];
  if (blocked.length === 1) {
    const block = blocked[0];
    const blockedMessage = formatBlockedPlotMessage(block, t);
    if (block.code === 'GEO-105') {
      return `${blockedMessage} ${t('geo_quality_overlap_upload_support')}`;
    }
    return blockedMessage;
  }

  if (pending.queuePendingCount > 0) {
    return t('sync_result_incomplete_queue', { n: pending.queuePendingCount });
  }

  const plotNames = pending.unsyncedPlotNames.filter(Boolean);
  if (plotNames.length > 0) {
    return t('sync_result_incomplete_plots', {
      n: pending.unsyncedPlotCount || plotNames.length,
      names: plotNames.join(', '),
    });
  }

  if ((pending.blockedPlotCount ?? 0) > 0) {
    return t('sync_result_incomplete_plot_count', { n: pending.blockedPlotCount ?? blocked.length });
  }

  if (pending.unsyncedPlotCount > 0) {
    return t('sync_result_incomplete_plot_count', { n: pending.unsyncedPlotCount });
  }

  return t('sync_result_incomplete', { n: pending.total });
}

/** One short line after Sync now — success or failure, no debug stats. */
export function formatSyncNowUserMessage(outcome: SyncNowUserOutcome, t: TranslateFn): string {
  if (outcome.sessionExpired) return t('sync_session_expired_short');
  if (outcome.noFarmer) return t('sync_no_farmer_profile');

  const remainingPending = outcome.remainingPending ?? 0;

  if (outcome.syncFailure && remainingPending > 0) {
    return formatSyncFailureUserMessage(outcome.syncFailure, t);
  }

  if (outcome.queueFetchFailed || outcome.plotsFetchFailed) {
    if (remainingPending > 0) {
      const reason = outcome.failureReason?.trim();
      if (reason) return reason;
      return resolveSyncReachFailedShortMessage(t, getTracebudApiBaseUrl());
    }
  }

  if (remainingPending === 0) {
    const restoredPlots = outcome.plotsRestored ?? 0;
    const restoredReceipts = outcome.receiptsRestored ?? 0;
    const restoredEvidence = outcome.evidenceRestored ?? 0;
    const restoredGroundTruth = outcome.groundTruthPhotosRestored ?? 0;
    const restoredDeclarations = outcome.declarationsRestored ?? 0;
    const partialRestoreFailed =
      outcome.evidenceFetchFailed ||
      outcome.declarationsFetchFailed ||
      (outcome.evidenceDownloadFailed ?? 0) > 0;

    if (partialRestoreFailed) {
      if (outcome.declarationsFetchFailed && !outcome.evidenceFetchFailed) {
        return t('sync_result_declarations_partial_failed');
      }
      if (outcome.evidenceFetchFailed && !outcome.declarationsFetchFailed) {
        return t('sync_result_evidence_partial_failed');
      }
      return t('sync_result_restore_partial_failed');
    }

    if (restoredGroundTruth > 0 && restoredEvidence > 0) {
      return t('sync_result_photos_and_documents_restored', {
        photos: restoredGroundTruth,
        documents: restoredEvidence,
      });
    }
    if (restoredGroundTruth > 0) {
      return t('sync_result_ground_truth_restored', { n: restoredGroundTruth });
    }
    if (restoredEvidence > 0) {
      return t('sync_result_evidence_restored', { n: restoredEvidence });
    }
    if (restoredDeclarations > 0) {
      return t('sync_result_declarations_restored', { n: restoredDeclarations });
    }
    if (restoredPlots > 0 && restoredReceipts > 0) {
      return t('sync_result_plots_and_receipts_restored', {
        plots: restoredPlots,
        receipts: restoredReceipts,
      });
    }
    if (restoredPlots > 0) {
      return t('sync_result_plots_restored', { n: restoredPlots });
    }
    if (restoredReceipts > 0) {
      return t('sync_result_receipts_restored', { n: restoredReceipts });
    }
    const requeuedReceipts = outcome.receiptsRequeued ?? 0;
    if (requeuedReceipts > 0) {
      return t('sync_result_receipts_requeued', { n: requeuedReceipts });
    }
    return t('sync_result_complete');
  }

  return formatPendingSyncSummary(
    {
      total: remainingPending,
      unsyncedPlotCount: outcome.unsyncedPlotCount ?? 0,
      blockedPlotCount: outcome.blockedPlotCount ?? 0,
      queuePendingCount: outcome.queuePendingCount ?? 0,
      unsyncedPlotNames: outcome.unsyncedPlotNames ?? [],
      blockedPlots: outcome.blockedPlots ?? [],
    },
    t,
    outcome.failureReason,
  );
}

export function resolveSyncSupportMailto(outcome: SyncNowUserOutcome): string | undefined {
  if (outcome.supportMailto?.trim()) return outcome.supportMailto.trim();
  const blocked = outcome.blockedPlots ?? [];
  if (blocked.length === 1 && blocked[0]?.code === 'GEO-105') {
    return blocked[0].supportMailto;
  }
  return undefined;
}

/** When sync is blocked by one plot's boundary, open that plot from Settings. */
export function resolveSyncOpenPlotId(outcome: SyncNowUserOutcome): string | undefined {
  const blocked = outcome.blockedPlots ?? [];
  if (blocked.length !== 1) return undefined;
  const plotId = blocked[0]?.plotId?.trim();
  return plotId || undefined;
}
