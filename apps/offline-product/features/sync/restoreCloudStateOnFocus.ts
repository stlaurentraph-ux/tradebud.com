import type { Plot } from '@/features/state/AppStateContext';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { loadAppState } from '@/features/state/persistence';
import { prepareFieldSyncContext } from '@/features/sync/resolveFieldSyncScope';
import { restoreCloudMediaFromServer } from '@/features/sync/restoreCloudMediaFromServer';
import { restoreLocalDeliveryReceiptsFromServer } from '@/features/sync/restoreLocalDeliveryReceiptsFromServer';
import { pruneRedundantPendingUploadActions } from '@/features/sync/pruneRedundantPendingUploadActions';
import { emitServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import { withFieldSyncSession } from '@/features/sync/runFieldSyncSession';

export type FocusCloudRestoreResult = {
  activePlots: Plot[];
  plotsRestored: number;
  receiptsRestored: number;
  declarationsRestored: number;
  evidenceRestored: number;
  groundTruthRestored: number;
  landTitleRestored: number;
  devicePreferencesRestored: boolean;
  profilePhotoRestored: boolean;
  mappingDraftRestored: boolean;
  offlinePacksQueued: number;
  fetchFailed: boolean;
  downloadFailed: number;
  totalRestored: number;
};

const FOCUS_PULL_MIN_INTERVAL_MS = 30_000;
let lastFocusPullAt = 0;

function countFocusRestore(result: Omit<FocusCloudRestoreResult, 'totalRestored' | 'activePlots'>): number {
  return (
    result.plotsRestored +
    result.receiptsRestored +
    result.declarationsRestored +
    result.evidenceRestored +
    result.groundTruthRestored +
    result.landTitleRestored +
    (result.devicePreferencesRestored ? 1 : 0) +
    (result.profilePhotoRestored ? 1 : 0) +
    (result.mappingDraftRestored ? 1 : 0) +
    result.offlinePacksQueued
  );
}

/**
 * Pull-only cross-device restore for tab/screen focus (no upload or queue drain).
 * Matches the restore phase of `runFieldSyncPipeline` without push steps.
 */
export async function restoreCloudStateOnFocus(options?: {
  force?: boolean;
}): Promise<FocusCloudRestoreResult | null> {
  if (!hasSyncAuthSession()) return null;

  const now = Date.now();
  if (!options?.force && now - lastFocusPullAt < FOCUS_PULL_MIN_INTERVAL_MS) {
    return null;
  }

  const opened = await withFieldSyncSession(async () => {
    const diskState = await loadAppState();
    const localFarmer = diskState.farmer;
    if (!localFarmer?.id) return null;

    const localPlots = diskState.plots;
    const { farmerId, ownedFarmerIds } = await prepareFieldSyncContext({
      profileFarmerId: localFarmer.id,
      localPlots,
    });

    const media = await restoreCloudMediaFromServer({
      apiFarmerId: farmerId,
      ownedFarmerIds,
      localPlots,
      localFarmer,
      includeDeclarations: true,
    });

    const receiptRestore = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId: farmerId,
      profileFarmerId: localFarmer.id,
      ownedFarmerIds,
      localPlots: media.activePlots,
    });

    await pruneRedundantPendingUploadActions({ farmerId }).catch(() => 0);

    const partial: Omit<FocusCloudRestoreResult, 'totalRestored'> = {
      activePlots: media.activePlots,
      plotsRestored: media.plotsRestored,
      receiptsRestored: receiptRestore.restoredCount,
      declarationsRestored: media.declarationsRestored,
      evidenceRestored: media.evidenceRestored,
      groundTruthRestored: media.groundTruthRestored,
      landTitleRestored: media.landTitleRestored,
      devicePreferencesRestored: media.devicePreferencesRestored,
      profilePhotoRestored: media.profilePhotoRestored,
      mappingDraftRestored: media.mappingDraftRestored,
      offlinePacksQueued: media.offlinePacksQueued,
      fetchFailed: media.fetchFailed || receiptRestore.fetchFailed,
      downloadFailed: media.downloadFailed,
    };

    return {
      ...partial,
      totalRestored: countFocusRestore(partial),
    } satisfies FocusCloudRestoreResult;
  });

  if (!opened.ok) return null;

  lastFocusPullAt = now;
  const result = opened.value;
  if (!result) return null;

  if (result.totalRestored > 0) {
    emitServerPlotSyncChanged();
  }

  return result;
}
