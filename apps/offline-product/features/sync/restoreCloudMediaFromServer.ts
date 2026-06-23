import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { restoreFarmerCloudState } from '@/features/sync/restoreFarmerCloudState';

export type RestoreCloudMediaResult = {
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

/** Pull all cloud-backed farmer artifacts without running full sync. */
export async function restoreCloudMediaFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localPlots: Plot[];
  localFarmer?: FarmerProfile;
}): Promise<RestoreCloudMediaResult> {
  const result = await restoreFarmerCloudState({
    ...params,
    mediaOnly: true,
  });

  return {
    evidenceRestored: result.evidenceRestored,
    groundTruthRestored: result.groundTruthRestored,
    landTitleRestored: result.landTitleRestored,
    devicePreferencesRestored: result.devicePreferencesRestored,
    profilePhotoRestored: result.profilePhotoRestored,
    mappingDraftRestored: result.mappingDraftRestored,
    offlinePacksQueued: result.offlinePacksQueued,
    fetchFailed: result.fetchFailed,
    downloadFailed: result.downloadFailed,
  };
}
