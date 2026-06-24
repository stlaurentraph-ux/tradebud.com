import type { Plot } from '@/features/state/AppStateContext';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { loadAppState } from '@/features/state/persistence';
import {
  persistFieldSyncCursorFromDelta,
  probeFieldSyncInboundChanges,
} from '@/features/sync/fieldSyncCursor';
import { buildFieldSyncRestoreScope } from '@/features/sync/fieldSyncRestoreScope';
import { prepareFieldSyncContext } from '@/features/sync/resolveFieldSyncScope';
import { restoreCloudMediaFromServer } from '@/features/sync/restoreCloudMediaFromServer';
import { hydrateLocalSyncMarkersFromServer } from '@/features/sync/hydrateLocalSyncMarkersFromServer';
import { restoreLocalDeliveryReceiptsFromServer } from '@/features/sync/restoreLocalDeliveryReceiptsFromServer';
import { pruneRedundantPendingUploadActions } from '@/features/sync/pruneRedundantPendingUploadActions';
import { emitServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import { withFieldSyncSession } from '@/features/sync/runFieldSyncSession';
import { getSyncQueueLockSnapshot } from '@/features/sync/syncQueueMutex';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

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
  skippedByDelta?: boolean;
  incrementalRestore?: boolean;
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

function emptyFocusRestoreResult(activePlots: Plot[]): FocusCloudRestoreResult {
  return {
    activePlots,
    plotsRestored: 0,
    receiptsRestored: 0,
    declarationsRestored: 0,
    evidenceRestored: 0,
    groundTruthRestored: 0,
    landTitleRestored: 0,
    devicePreferencesRestored: false,
    profilePhotoRestored: false,
    mappingDraftRestored: false,
    offlinePacksQueued: 0,
    fetchFailed: false,
    downloadFailed: 0,
    totalRestored: 0,
  };
}

export async function restoreCloudStateOnFocus(options?: {
  force?: boolean;
  skipDeltaGate?: boolean;
}): Promise<FocusCloudRestoreResult | null> {
  if (!hasSyncAuthSession()) return null;
  if (getSyncQueueLockSnapshot().locked) return null;

  const now = Date.now();
  if (!options?.force && now - lastFocusPullAt < FOCUS_PULL_MIN_INTERVAL_MS) {
    return null;
  }

  const opened = await withFieldSyncSession(async (session) => {
    const diskState = await loadAppState();
    const localFarmer = diskState.farmer;
    if (!localFarmer?.id) return null;

    const localPlots = diskState.plots;
    const { farmerId, ownedFarmerIds } = await prepareFieldSyncContext({
      profileFarmerId: localFarmer.id,
      localPlots,
    });

    let restoreScope: ReturnType<typeof buildFieldSyncRestoreScope> | undefined;

    if (!options?.skipDeltaGate) {
      const probe = await probeFieldSyncInboundChanges({
        accessToken: session.accessToken,
      });
      if (!probe.probeFailed && probe.hasCursor && !probe.hasInboundChanges) {
        if (probe.delta) {
          await persistFieldSyncCursorFromDelta(probe.delta).catch(() => undefined);
        }
        trackEvent(ANALYTICS_EVENTS.FIELD_SYNC_DELTA_SKIPPED, { surface: 'focus_pull' });
        return { ...emptyFocusRestoreResult(localPlots), skippedByDelta: true };
      }
      if (!probe.probeFailed && probe.hasCursor && probe.changeSet && probe.hasInboundChanges) {
        restoreScope = buildFieldSyncRestoreScope(probe.changeSet);
        trackEvent(ANALYTICS_EVENTS.FIELD_SYNC_INCREMENTAL_RESTORE, { surface: 'focus_pull' });
      }
    }

    const media = await restoreCloudMediaFromServer({
      apiFarmerId: farmerId,
      ownedFarmerIds,
      localPlots,
      localFarmer,
      includeDeclarations: true,
      restoreScope,
    });

    const receiptRestore =
      restoreScope && !restoreScope.restoreVouchers
        ? { restoredCount: 0, fetchFailed: false }
        : await restoreLocalDeliveryReceiptsFromServer({
            apiFarmerId: farmerId,
            profileFarmerId: localFarmer.id,
            ownedFarmerIds,
            localPlots: media.activePlots,
          });

    await hydrateLocalSyncMarkersFromServer({
      apiFarmerId: farmerId,
      ownedFarmerIds,
      localFarmer,
      localPlots: media.activePlots,
    }).catch(() => undefined);

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
      incrementalRestore: media.incrementalRestore === true,
    };

    const probeAfter = await probeFieldSyncInboundChanges({
      accessToken: session.accessToken,
    }).catch(() => null);
    if (probeAfter?.delta) {
      await persistFieldSyncCursorFromDelta(probeAfter.delta).catch(() => undefined);
    }

    return { ...partial, totalRestored: countFocusRestore(partial) };
  });

  if (!opened.ok) return null;
  lastFocusPullAt = now;
  const result = opened.value;
  if (!result) return null;
  if (result.totalRestored > 0) emitServerPlotSyncChanged();
  return result;
}
