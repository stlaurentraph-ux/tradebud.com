import { shouldOfferPostAuthSync } from '@/features/sync/postAuthSyncOfferLogic';
import { gapCount } from '@/features/sync/cloudParityArtifactCounts';

export type ExtendedCloudParityCounts = {
  localPlotCount: number;
  serverPlotCount: number | null;
  /** Restore-accurate missing plot count (linked/client id match), when available. */
  serverPlotsMissingOnDevice: number | null;
  localReceiptCount: number;
  serverVoucherCount: number | null;
  localGroundPhotos: number;
  serverGroundPhotos: number | null;
  localLandTitlePhotos: number;
  serverLandTitlePhotos: number | null;
  localEvidenceDocs: number;
  serverEvidenceDocs: number | null;
  localProducerComplete: boolean;
  serverHasProducerAudit: boolean | null;
  localPlotAttestationsComplete: number;
  serverPlotAttestationAudits: number | null;
  /** Producer attestations on server that this device can still pull down. */
  producerAttestationMissingOnDevice: boolean;
  /** Plot attestations on server for linked local plots not yet on device. */
  plotAttestationsMissingOnDevice: number;
  localHasProfilePhoto: boolean;
  serverHasProfilePhoto: boolean | null;
  localHasWalkDraft: boolean;
  serverHasWalkDraft: boolean | null;
};

export function extendedParityGaps(counts: ExtendedCloudParityCounts): {
  plotGap: number;
  receiptGap: number;
  mediaGap: number;
  declarationGap: number;
  profilePhotoGap: boolean;
  walkDraftGap: boolean;
} {
  const plotGap =
    counts.serverPlotsMissingOnDevice != null
      ? Math.max(0, counts.serverPlotsMissingOnDevice)
      : gapCount(counts.serverPlotCount, counts.localPlotCount);
  const receiptGap = gapCount(counts.serverVoucherCount, counts.localReceiptCount);
  const groundGap = gapCount(counts.serverGroundPhotos, counts.localGroundPhotos);
  const landGap = gapCount(counts.serverLandTitlePhotos, counts.localLandTitlePhotos);
  const evidenceGap = gapCount(counts.serverEvidenceDocs, counts.localEvidenceDocs);
  const mediaGap = groundGap + landGap + evidenceGap;

  let declarationGap = 0;
  if (counts.producerAttestationMissingOnDevice) {
    declarationGap += 1;
  }
  declarationGap += Math.max(0, counts.plotAttestationsMissingOnDevice);

  const profilePhotoGap =
    counts.serverHasProfilePhoto === true && !counts.localHasProfilePhoto;
  const walkDraftGap = counts.serverHasWalkDraft === true && !counts.localHasWalkDraft;

  return {
    plotGap,
    receiptGap,
    mediaGap,
    declarationGap,
    profilePhotoGap,
    walkDraftGap,
  };
}

/** Plot/receipt/media gaps need full inbound restore; declaration-only gaps use push_only hydration. */
export function parityNeedsFullInboundRestore(
  summary: Pick<
    CloudParitySummary,
    'plotGap' | 'receiptGap' | 'mediaGap' | 'declarationGap' | 'profilePhotoGap' | 'walkDraftGap'
  >,
): boolean {
  if (summary.plotGap > 0 || summary.receiptGap > 0 || summary.mediaGap > 0) return true;
  if (summary.profilePhotoGap || summary.walkDraftGap) return true;
  return false;
}

export function effectiveCloudParityNeedsRestore(input: {
  flagged: boolean;
  summary?: Pick<CloudParitySummary, 'declarationGap'> & Parameters<typeof parityNeedsFullInboundRestore>[0] | null;
  localDeclarationsComplete: boolean;
}): boolean {
  if (!input.flagged) return false;
  if (!input.summary) {
    return !input.localDeclarationsComplete;
  }
  if (parityNeedsFullInboundRestore(input.summary)) return true;
  if (input.summary.declarationGap > 0 && !input.localDeclarationsComplete) return true;
  return false;
}

/** @deprecated Use ExtendedCloudParityCounts — kept for backward-compatible imports. */
export type CloudParityCounts = {
  localPlotCount: number;
  serverPlotCount: number | null;
  localReceiptCount: number;
  serverVoucherCount: number | null;
};

export type CloudParitySummary = ExtendedCloudParityCounts & {
  /** Server has artifacts this device has not pulled yet. */
  needsInboundRestore: boolean;
  /** @deprecated Use needsInboundRestore */
  needsRestore: boolean;
  plotGap: number;
  receiptGap: number;
  mediaGap: number;
  declarationGap: number;
  profilePhotoGap: boolean;
  walkDraftGap: boolean;
};

export function summarizeCloudParityCounts(input: ExtendedCloudParityCounts): CloudParitySummary {
  const gaps = extendedParityGaps(input);
  const needsInboundRestore =
    shouldOfferPostAuthSync({
      localPlotCount: input.localPlotCount,
      unsyncedPlotCount: 0,
      pendingQueueCount: 0,
      serverPlotCount: input.serverPlotCount,
      serverPlotsMissingOnDevice: input.serverPlotsMissingOnDevice,
      localReceiptCount: input.localReceiptCount,
      serverVoucherCount: input.serverVoucherCount,
    }) ||
    gaps.mediaGap > 0 ||
    gaps.declarationGap > 0 ||
    gaps.profilePhotoGap ||
    gaps.walkDraftGap;

  return {
    ...input,
    needsInboundRestore,
    needsRestore: needsInboundRestore,
    ...gaps,
  };
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function formatCloudParityHint(
  summary: CloudParitySummary,
  t: TranslateFn,
): string | null {
  const hints = formatCloudParityHints(summary, t);
  return hints.length > 0 ? hints.join(' ') : null;
}

export function formatCloudParityHints(
  summary: CloudParitySummary,
  t: TranslateFn,
  options?: { queueMediaPendingCount?: number; unsyncedPlotCount?: number; queuePendingCount?: number },
): string[] {
  if (!summary.needsInboundRestore && (options?.queueMediaPendingCount ?? 0) === 0) {
    return [];
  }

  const hints: string[] = [];
  const queueMediaPendingCount = Math.max(0, options?.queueMediaPendingCount ?? 0);
  const showInbound = summary.needsInboundRestore;

  if (showInbound && summary.plotGap > 0 && summary.receiptGap > 0) {
    hints.push(
      t('settings_cloud_parity_both', {
        plots: summary.plotGap,
        receipts: summary.receiptGap,
      }),
    );
  } else if (showInbound && summary.plotGap > 0) {
    hints.push(t('settings_cloud_parity_plots', { n: summary.plotGap }));
  } else if (showInbound && summary.receiptGap > 0) {
    hints.push(t('settings_cloud_parity_receipts', { n: summary.receiptGap }));
  }

  if (queueMediaPendingCount > 0) {
    hints.push(
      t('settings_cloud_parity_media_upload_pending', { n: queueMediaPendingCount }),
    );
  }
  if (showInbound && summary.mediaGap > 0) {
    hints.push(t('settings_cloud_parity_media', { n: summary.mediaGap }));
  }
  if (showInbound && summary.declarationGap > 0) {
    hints.push(t('settings_cloud_parity_declarations', { n: summary.declarationGap }));
  }
  if (showInbound && summary.profilePhotoGap) {
    hints.push(t('settings_cloud_parity_profile_photo'));
  }
  if (showInbound && summary.walkDraftGap) {
    hints.push(t('settings_cloud_parity_walk_draft'));
  }

  const unsyncedPlotCount = Math.max(0, options?.unsyncedPlotCount ?? 0);
  if (unsyncedPlotCount > 0) {
    hints.push(t('settings_cloud_parity_plots_upload_pending', { n: unsyncedPlotCount }));
  }

  if (hints.length === 0 && showInbound) {
    hints.push(t('settings_cloud_parity_generic'));
  }

  return hints;
}
