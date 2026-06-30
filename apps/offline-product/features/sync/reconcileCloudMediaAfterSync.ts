import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { loadAppState } from '@/features/state/persistence';
import { measureCloudParitySummary, type CloudParitySummary } from '@/features/sync/measureCloudParitySummary';
import {
  restoreFarmerCloudState,
  type RestoreFarmerCloudStateResult,
} from '@/features/sync/restoreFarmerCloudState';

export type ReconcileCloudMediaAfterSyncResult = {
  summary: CloudParitySummary;
  mediaRetry: RestoreFarmerCloudStateResult | null;
  localPlots: Plot[];
  localFarmer?: FarmerProfile;
};

/** Re-measure cloud media parity and retry a media-only restore when a gap remains. */
export async function reconcileCloudMediaAfterSync(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer?: FarmerProfile;
  localPlots: Plot[];
}): Promise<ReconcileCloudMediaAfterSyncResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    const empty = await measureCloudParitySummary({
      profileFarmerId: '',
      localPlots: params.localPlots,
      localFarmer: params.localFarmer,
    });
    return {
      summary: empty,
      mediaRetry: null,
      localPlots: params.localPlots,
      localFarmer: params.localFarmer,
    };
  }

  let summary = await measureCloudParitySummary({
    profileFarmerId: apiFarmerId,
    localPlots: params.localPlots,
    localFarmer: params.localFarmer,
  });

  if (summary.mediaGap <= 0) {
    return {
      summary,
      mediaRetry: null,
      localPlots: params.localPlots,
      localFarmer: params.localFarmer,
    };
  }

  const mediaRetry = await restoreFarmerCloudState({
    apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
    localFarmer: params.localFarmer,
    localPlots: params.localPlots,
    mediaOnly: true,
  });

  const diskState = await loadAppState().catch(() => ({
    farmer: params.localFarmer,
    plots: params.localPlots,
  }));
  const localPlots = diskState.plots.length > 0 ? diskState.plots : params.localPlots;
  const localFarmer = diskState.farmer ?? params.localFarmer;

  summary = await measureCloudParitySummary({
    profileFarmerId: apiFarmerId,
    localPlots,
    localFarmer,
  });

  return { summary, mediaRetry, localPlots, localFarmer };
}
