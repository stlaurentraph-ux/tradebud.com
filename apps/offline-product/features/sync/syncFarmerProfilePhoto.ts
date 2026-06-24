import { downloadEvidenceFileFromStorage } from '@/features/evidence/downloadEvidenceFromStorage';
import { uploadEvidenceFileToStorage } from '@/features/evidence/uploadEvidenceToStorage';
import {
  getSetting,
  saveFarmerProfilePhotoUri,
  setSetting,
} from '@/features/state/persistence';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { FARMER_PROFILE_PHOTO_AUDIT } from '@/features/sync/farmerArtifactRegistry';
import { queueFieldCloudAuditSync } from '@/features/sync/queueFieldCloudAuditSync';

const PROFILE_PHOTO_STORAGE_KEY = 'farmerProfilePhotoStoragePath';

export type RestoreFarmerProfilePhotoResult = {
  restored: boolean;
  fetchFailed: boolean;
  downloadFailed: boolean;
};

export async function queueFarmerProfilePhotoSync(params: {
  farmerId: string;
  localUri: string | null;
  deferPost?: boolean;
  skipIfSynced?: boolean;
}): Promise<'synced' | 'queued' | 'skipped'> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) return 'skipped';

  if (!params.localUri?.trim()) {
    await setSetting(PROFILE_PHOTO_STORAGE_KEY, '').catch(() => undefined);
    return queueFieldCloudAuditSync({
      eventType: FARMER_PROFILE_PHOTO_AUDIT,
      scopeId: farmerId,
      payload: {
        farmerId,
        cleared: true,
        updatedAt: Date.now(),
      },
      deferPost: params.deferPost,
      skipIfSynced: params.skipIfSynced,
    });
  }

  const upload = await uploadEvidenceFileToStorage({
    localUri: params.localUri,
    mimeType: 'image/jpeg',
    label: 'profile_photo',
    farmerId,
    plotId: 'farmer-profile',
    kind: 'profile_photo',
    stableKey: 'photo',
  });
  if (!upload.ok) return 'queued';

  await setSetting(PROFILE_PHOTO_STORAGE_KEY, upload.storagePath).catch(() => undefined);

  return queueFieldCloudAuditSync({
    eventType: FARMER_PROFILE_PHOTO_AUDIT,
    scopeId: farmerId,
    payload: {
      farmerId,
      storagePath: upload.storagePath,
      updatedAt: Date.now(),
    },
    deferPost: params.deferPost,
    skipIfSynced: params.skipIfSynced,
  });
}

export async function restoreLocalFarmerProfilePhotoFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
}): Promise<RestoreFarmerProfilePhotoResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { restored: false, fetchFailed: false, downloadFailed: false };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer(
      [apiFarmerId, ...params.ownedFarmerIds],
      50,
      [FARMER_PROFILE_PHOTO_AUDIT],
    );
  } catch {
    return { restored: false, fetchFailed: true, downloadFailed: false };
  }

  const latest = auditRows.find((row) => row.event_type === FARMER_PROFILE_PHOTO_AUDIT);
  if (!latest?.payload) {
    return { restored: false, fetchFailed: false, downloadFailed: false };
  }

  if (latest.payload.cleared === true) {
    await saveFarmerProfilePhotoUri(null);
    await setSetting(PROFILE_PHOTO_STORAGE_KEY, '').catch(() => undefined);
    return { restored: true, fetchFailed: false, downloadFailed: false };
  }

  const storagePath = String(latest.payload.storagePath ?? '').trim();
  if (!storagePath) {
    return { restored: false, fetchFailed: false, downloadFailed: false };
  }

  const existingPath = (await getSetting(PROFILE_PHOTO_STORAGE_KEY).catch(() => null))?.trim();
  const existingUri = (await getSetting('farmerProfilePhotoUri').catch(() => null))?.trim();
  if (existingPath === storagePath && existingUri) {
    return { restored: false, fetchFailed: false, downloadFailed: false };
  }

  const download = await downloadEvidenceFileFromStorage({
    storagePath,
    localPlotId: apiFarmerId,
    kind: 'profile_photo',
    mimeType: 'image/jpeg',
    label: 'profile_photo',
  });
  if (!download.ok) {
    return { restored: false, fetchFailed: false, downloadFailed: true };
  }

  const uri = download.localUri.startsWith('file://') ? download.localUri : download.remoteUrl;
  await saveFarmerProfilePhotoUri(uri);
  await setSetting(PROFILE_PHOTO_STORAGE_KEY, storagePath).catch(() => undefined);
  return { restored: true, fetchFailed: false, downloadFailed: false };
}
