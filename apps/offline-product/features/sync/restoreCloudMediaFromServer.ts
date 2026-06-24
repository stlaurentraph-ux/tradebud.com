import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { restoreFarmerCloudState } from '@/features/sync/restoreFarmerCloudState';
import { restoreLocalPlotsFromServer } from '@/features/sync/restoreLocalPlotsFromServer';
import { warmPlotServerLinksForSync } from '@/features/sync/plotServerSync';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';

export type RestoreCloudMediaResult = {
  activePlots: Plot[];
  plotsRestored: number;
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
};

/** Pull server plots + cloud-backed farmer artifacts without running full sync. */
export async function restoreCloudMediaFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
  localFarmer?: FarmerProfile;
  /** When true, also restores producer/plot declarations (full orchestrator). */
  includeDeclarations?: boolean;
}): Promise<RestoreCloudMediaResult> {
  let activePlots = params.localPlots;

  const plotRestore = await restoreLocalPlotsFromServer({
    apiFarmerId: params.apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
    localPlots: params.localPlots,
  });
  if (plotRestore.restoredCount > 0) {
    activePlots = plotRestore.mergedPlots;
    invalidateServerPlotListCache();
  }

  await warmPlotServerLinksForSync({
    farmerId: params.apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
    localPlots: activePlots,
  }).catch(() => undefined);

  const result = await restoreFarmerCloudState({
    ...params,
    localPlots: activePlots,
    mediaOnly: !params.includeDeclarations,
  });

  return {
    activePlots,
    plotsRestored: plotRestore.restoredCount,
    declarationsRestored: result.declarationsRestored,
    evidenceRestored: result.evidenceRestored,
    groundTruthRestored: result.groundTruthRestored,
    landTitleRestored: result.landTitleRestored,
    devicePreferencesRestored: result.devicePreferencesRestored,
    profilePhotoRestored: result.profilePhotoRestored,
    mappingDraftRestored: result.mappingDraftRestored,
    offlinePacksQueued: result.offlinePacksQueued,
    fetchFailed: result.fetchFailed || plotRestore.fetchFailed,
    downloadFailed: result.downloadFailed,
  };
}
