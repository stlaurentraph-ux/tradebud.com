import { syncPlotPhotosToBackend } from '@/features/api/postPlot';
import { uploadEvidenceFileToStorage } from '@/features/evidence/uploadEvidenceToStorage';
import type { PlotTitlePhoto } from '@/features/state/persistence';

export type LandTitleSyncSummary = {
  uploadedCount: number;
  metadataOnlyCount: number;
  notSignedIn: boolean;
};

/**
 * Upload local land-title photos to storage when signed in, then sync metadata to the API.
 */
export async function syncLandTitlePhotosWithFiles(params: {
  serverPlotId: string;
  farmerId: string;
  photos: PlotTitlePhoto[];
  cadastralKey?: string | null;
  informalTenure?: boolean | null;
  informalTenureNote?: string | null;
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}): Promise<LandTitleSyncSummary> {
  const summary: LandTitleSyncSummary = {
    uploadedCount: 0,
    metadataOnlyCount: 0,
    notSignedIn: false,
  };

  const baseMeta = {
    cadastralKey: params.cadastralKey ?? null,
    informalTenure: params.informalTenure ?? null,
    informalTenureNote: params.informalTenureNote ?? null,
  };

  const resolved: Array<Record<string, unknown>> = [];
  for (const photo of params.photos) {
    const upload = await uploadEvidenceFileToStorage({
      localUri: photo.uri,
      mimeType: 'image/jpeg',
      label: 'land_title_photo',
      farmerId: params.farmerId,
      plotId: params.serverPlotId,
      kind: 'land_title',
    });
    if (upload.ok) {
      summary.uploadedCount += 1;
      resolved.push({
        ...baseMeta,
        uri: upload.remoteUrl,
        storagePath: upload.storagePath,
        mimeType: 'image/jpeg',
        takenAt: photo.takenAt,
        label: 'land_title_photo',
      });
    } else {
      if (upload.reason === 'not_signed_in') {
        summary.notSignedIn = true;
      }
      summary.metadataOnlyCount += 1;
      resolved.push({
        ...baseMeta,
        uri: photo.uri,
        takenAt: photo.takenAt,
      });
    }
  }

  if (resolved.length > 0) {
    await syncPlotPhotosToBackend({
      plotId: params.serverPlotId,
      kind: 'land_title',
      photos: resolved,
      note: params.note ?? 'Land title photos sync from device',
      hlcTimestamp: params.hlcTimestamp,
      clientEventId: params.clientEventId,
    });
  }

  return summary;
}
