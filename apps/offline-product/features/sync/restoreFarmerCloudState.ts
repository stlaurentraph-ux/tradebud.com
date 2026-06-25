import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import type { FieldSyncRestoreScope } from '@/features/sync/fieldSyncRestoreScope';
import { restoreLocalDeclarationsFromServer } from '@/features/sync/restoreLocalDeclarationsFromServer';
import { restoreLocalEvidenceFromServer } from '@/features/sync/restoreLocalEvidenceFromServer';
import { restoreLocalPlotPhotosFromServerAudit } from '@/features/sync/restoreLocalGroundTruthPhotosFromServer';
import { restorePlotMappingDraftFromServer } from '@/features/sync/plotMappingDraft';
import { restoreLocalFarmerProfilePhotoFromServer } from '@/features/sync/syncFarmerProfilePhoto';
import { restoreLocalFieldDevicePreferencesFromServer } from '@/features/sync/syncFieldDevicePreferences';

export type RestoreFarmerCloudStateParams = {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer?: FarmerProfile;
  localPlots: Plot[];
  /** When true, skip declaration restore (media-only focus refresh). */
  mediaOnly?: boolean;
  restoreScope?: FieldSyncRestoreScope;
};

export type RestoreFarmerCloudStateResult = {
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

const emptyPhotoRestore = {
  groundTruthRestored: 0,
  landTitleRestored: 0,
  fetchFailed: false,
  downloadFailed: 0,
  skippedUnlinked: 0,
};

/** Single orchestrator for all cross-device restore steps after plot linking. */
export async function restoreFarmerCloudState(
  params: RestoreFarmerCloudStateParams,
): Promise<RestoreFarmerCloudStateResult> {
  const result: RestoreFarmerCloudStateResult = {
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
  };

  if (!params.mediaOnly) {
    const declarationRestore = await restoreLocalDeclarationsFromServer({
      apiFarmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
      localFarmer: params.localFarmer,
      localPlots: params.localPlots,
    });
    if (declarationRestore.fetchFailed) result.fetchFailed = true;
    result.declarationsRestored =
      (declarationRestore.producerRestored ? 1 : 0) +
      declarationRestore.plotsRestored +
      declarationRestore.legalRestored;
  }

  const skipAuditPhotos =
    params.restoreScope != null && !params.restoreScope.restoreFarmerAuditArtifacts;

  const [photos, evidence, devicePrefs, profilePhoto, mappingDraft] = await Promise.all([
    skipAuditPhotos
      ? Promise.resolve(emptyPhotoRestore)
      : restoreLocalPlotPhotosFromServerAudit({
          apiFarmerId: params.apiFarmerId,
          ownedFarmerIds: params.ownedFarmerIds,
          localPlots: params.localPlots,
          restoreScope: params.restoreScope,
        }),
    restoreLocalEvidenceFromServer({
      apiFarmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
      localPlots: params.localPlots,
      restoreScope: params.restoreScope,
    }),
    restoreLocalFieldDevicePreferencesFromServer({
      apiFarmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
      localFarmer: params.localFarmer,
    }),
    restoreLocalFarmerProfilePhotoFromServer({
      apiFarmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    }),
    restorePlotMappingDraftFromServer({
      apiFarmerId: params.apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    }),
  ]);

  result.groundTruthRestored = photos.groundTruthRestored;
  result.landTitleRestored = photos.landTitleRestored;
  result.evidenceRestored = evidence.restoredCount + photos.landTitleRestored;
  result.devicePreferencesRestored = devicePrefs.restored;
  result.profilePhotoRestored = profilePhoto.restored;
  result.mappingDraftRestored = mappingDraft.restored;
  result.offlinePacksQueued = devicePrefs.offlinePacksQueued;

  if (
    photos.fetchFailed ||
    evidence.fetchFailed ||
    devicePrefs.fetchFailed ||
    profilePhoto.fetchFailed ||
    mappingDraft.fetchFailed
  ) {
    result.fetchFailed = true;
  }
  result.downloadFailed =
    photos.downloadFailed + evidence.downloadFailed + (profilePhoto.downloadFailed ? 1 : 0);

  return result;
}
