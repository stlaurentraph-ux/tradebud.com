import { syncPlotPhotosToBackend } from '@/features/api/postPlot';
import {
  assertLandTitlePhotosUploadedForAi,
  createLandTitleSyncSummary,
  type LandTitleSyncSummary,
} from '@/features/evidence/landTitleSyncOutcome';
import {
  isLocalEvidenceUri,
  normalizeEvidenceContentType,
} from '@/features/evidence/evidenceContentType';
import { uploadEvidenceFileToStorage } from '@/features/evidence/uploadEvidenceToStorage';
import type { PlotTitlePhoto } from '@/features/state/persistence';

export type { LandTitleSyncSummary };

/**
 * Upload local land-title photos to storage when signed in, then sync metadata to the API.
 * Only photos with a storage path are sent to the API so the backend can run AI tenure review.
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
  const summary = createLandTitleSyncSummary();

  const baseMeta = {
    cadastralKey: params.cadastralKey ?? null,
    informalTenure: params.informalTenure ?? null,
    informalTenureNote: params.informalTenureNote ?? null,
  };

  const resolved: Array<Record<string, unknown>> = [];
  for (const photo of params.photos) {
    if (!isLocalEvidenceUri(photo.uri)) {
      summary.metadataOnlyCount += 1;
      resolved.push({
        ...baseMeta,
        uri: photo.uri,
        takenAt: photo.takenAt,
        label: 'land_title_photo',
      });
      continue;
    }

    const mimeType = normalizeEvidenceContentType(null, 'land_title_photo', photo.uri);
    const upload = await uploadEvidenceFileToStorage({
      localUri: photo.uri,
      mimeType,
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
        mimeType,
        takenAt: photo.takenAt,
        label: 'land_title_photo',
      });
      continue;
    }

    if (upload.reason === 'not_signed_in') {
      summary.notSignedIn = true;
    } else {
      summary.failedUploadCount += 1;
      summary.firstUploadError ??= upload.message ?? upload.reason;
    }
  }

  const uploadedForAi = resolved.filter(
    (row) => typeof row.storagePath === 'string' && String(row.storagePath).trim().length > 0,
  );

  if (uploadedForAi.length > 0) {
    await syncPlotPhotosToBackend({
      plotId: params.serverPlotId,
      kind: 'land_title',
      photos: uploadedForAi,
      note: params.note ?? 'Land title photos sync from device',
      hlcTimestamp: params.hlcTimestamp,
      clientEventId: params.clientEventId,
    });
  }

  assertLandTitlePhotosUploadedForAi(summary, params.photos);

  return summary;
}
