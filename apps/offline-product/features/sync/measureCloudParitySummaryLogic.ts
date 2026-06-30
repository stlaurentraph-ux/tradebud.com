import { shouldOfferPostAuthSync } from '@/features/sync/postAuthSyncOfferLogic';
import { gapCount } from '@/features/sync/cloudParityArtifactCounts';

export type ExtendedCloudParityCounts = {
  localPlotCount: number;
  serverPlotCount: number | null;
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
  localHasProfilePhoto: boolean;
  serverHasProfilePhoto: boolean | null;
  localHasWalkDraft: boolean;
  serverHasWalkDraft: boolean | null;
  /**
   * Restore-mirroring media gap from `countPendingServerMediaRestore`.
   * When defined (audit rows available), overrides the naive count-based
   * `mediaGap` for the `needsRestore` decision and hint text, so the brown
   * banner cannot diverge from what Sync now would actually restore.
   */
  measuredMediaGap?: number;
};

export function extendedParityGaps(counts: ExtendedCloudParityCounts): {
  plotGap: number;
  receiptGap: number;
  mediaGap: number;
  declarationGap: number;
  profilePhotoGap: boolean;
  walkDraftGap: boolean;
} {
  const plotGap = gapCount(counts.serverPlotCount, counts.localPlotCount);
  const receiptGap = gapCount(counts.serverVoucherCount, counts.localReceiptCount);
  const groundGap = gapCount(counts.serverGroundPhotos, counts.localGroundPhotos);
  const landGap = gapCount(counts.serverLandTitlePhotos, counts.localLandTitlePhotos);
  const evidenceGap = gapCount(counts.serverEvidenceDocs, counts.localEvidenceDocs);
  const naiveMediaGap = groundGap + landGap + evidenceGap;
  const mediaGap =
    counts.measuredMediaGap != null ? counts.measuredMediaGap : naiveMediaGap;

  let declarationGap = 0;
  if (counts.serverHasProducerAudit === true && !counts.localProducerComplete) {
    declarationGap += 1;
  }
  if (counts.serverPlotAttestationAudits != null) {
    declarationGap += gapCount(
      counts.serverPlotAttestationAudits,
      counts.localPlotAttestationsComplete,
    );
  }

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

/** @deprecated Use ExtendedCloudParityCounts — kept for backward-compatible imports. */
export type CloudParityCounts = {
  localPlotCount: number;
  serverPlotCount: number | null;
  localReceiptCount: number;
  serverVoucherCount: number | null;
};

export type CloudParitySummary = ExtendedCloudParityCounts & {
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
  const needsRestore =
    shouldOfferPostAuthSync({
      localPlotCount: input.localPlotCount,
      unsyncedPlotCount: 0,
      pendingQueueCount: 0,
      serverPlotCount: input.serverPlotCount,
      localReceiptCount: input.localReceiptCount,
      serverVoucherCount: input.serverVoucherCount,
    }) ||
    gaps.mediaGap > 0 ||
    gaps.declarationGap > 0 ||
    gaps.profilePhotoGap ||
    gaps.walkDraftGap;

  return {
    ...input,
    needsRestore,
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
): string[] {
  if (!summary.needsRestore) return [];

  const hints: string[] = [];

  if (summary.plotGap > 0 && summary.receiptGap > 0) {
    hints.push(
      t('settings_cloud_parity_both', {
        plots: summary.plotGap,
        receipts: summary.receiptGap,
      }),
    );
  } else if (summary.plotGap > 0) {
    hints.push(t('settings_cloud_parity_plots', { n: summary.plotGap }));
  } else if (summary.receiptGap > 0) {
    hints.push(t('settings_cloud_parity_receipts', { n: summary.receiptGap }));
  }

  if (summary.mediaGap > 0) {
    hints.push(t('settings_cloud_parity_media', { n: summary.mediaGap }));
  }
  if (summary.declarationGap > 0) {
    hints.push(t('settings_cloud_parity_declarations', { n: summary.declarationGap }));
  }
  if (summary.profilePhotoGap) {
    hints.push(t('settings_cloud_parity_profile_photo'));
  }
  if (summary.walkDraftGap) {
    hints.push(t('settings_cloud_parity_walk_draft'));
  }

  if (hints.length === 0) {
    hints.push(t('settings_cloud_parity_generic'));
  }

  return hints;
}
