import type { FarmerProfile } from '@/features/state/AppStateContext';
import { getSetting, loadPlotMappingDraft } from '@/features/state/persistence';
import { FARMER_CLOUD_SYNC_PREP_OPTIONS } from '@/features/sync/farmerArtifactRegistry';
import { queuePlotMappingDraftSync } from '@/features/sync/plotMappingDraft';
import { queueFieldDevicePreferencesSync } from '@/features/sync/syncFieldDevicePreferences';
import { queueFarmerProfilePhotoSync } from '@/features/sync/syncFarmerProfilePhoto';

export type EnqueueFarmerCloudSyncResult = {
  devicePreferences: boolean;
  profilePhoto: boolean;
  mappingDraft: boolean;
};

/** Queue farmer-scoped cloud artifacts that are not plot-dependent. */
export async function enqueueFarmerCloudSyncActions(
  farmer: FarmerProfile | undefined,
): Promise<EnqueueFarmerCloudSyncResult> {
  const result: EnqueueFarmerCloudSyncResult = {
    devicePreferences: false,
    profilePhoto: false,
    mappingDraft: false,
  };
  if (!farmer?.id?.trim()) return result;

  const prefs = await queueFieldDevicePreferencesSync(farmer, FARMER_CLOUD_SYNC_PREP_OPTIONS);
  result.devicePreferences = prefs !== 'skipped';

  const photoUri = (await getSetting('farmerProfilePhotoUri').catch(() => null))?.trim();
  if (photoUri) {
    const photo = await queueFarmerProfilePhotoSync({
      farmerId: farmer.id,
      localUri: photoUri,
      ...FARMER_CLOUD_SYNC_PREP_OPTIONS,
    });
    result.profilePhoto = photo !== 'skipped';
  }

  const draft = await loadPlotMappingDraft(farmer.id).catch(() => null);
  if (draft && draft.points.length > 0) {
    const draftSync = await queuePlotMappingDraftSync(draft, FARMER_CLOUD_SYNC_PREP_OPTIONS);
    result.mappingDraft = draftSync !== 'skipped';
  }

  return result;
}
