import type { PlotPhoto } from '@/features/state/persistence';
import { syncPlotPhotosToBackend } from '@/features/api/postPlot';
import {
  isLocalEvidenceUri,
  normalizeEvidenceContentType,
} from '@/features/evidence/evidenceContentType';
import { uploadEvidenceFileToStorage } from '@/features/evidence/uploadEvidenceToStorage';

export type GroundTruthSyncSummary = {
  uploadedCount: number;
  metadataOnlyCount: number;
  failedUploadCount: number;
  notSignedIn: boolean;
  firstUploadError?: string;
};

function createGroundTruthSyncSummary(): GroundTruthSyncSummary {
  return {
    uploadedCount: 0,
    metadataOnlyCount: 0,
    failedUploadCount: 0,
    notSignedIn: false,
  };
}

function assertGroundTruthPhotosUploaded(summary: GroundTruthSyncSummary, photos: PlotPhoto[]): void {
  const localPhotos = photos.filter((photo) => isLocalEvidenceUri(photo.uri));
  if (localPhotos.length === 0) return;
  if (summary.notSignedIn) {
    throw new Error('Sign in to upload field photos.');
  }
  if (summary.uploadedCount === 0) {
    throw new Error(
      summary.firstUploadError ??
        'Could not upload field photos. Check your connection and try Sync now.',
    );
  }
}

/** Upload local ground-truth photos to storage when signed in, then sync metadata to the API. */
export async function syncGroundTruthPhotosWithFiles(params: {
  serverPlotId: string;
  farmerId: string;
  photos: PlotPhoto[];
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}): Promise<GroundTruthSyncSummary> {
  const summary = createGroundTruthSyncSummary();
  const resolved: Array<Record<string, unknown>> = [];

  for (const photo of params.photos) {
    if (!isLocalEvidenceUri(photo.uri)) {
      summary.metadataOnlyCount += 1;
      resolved.push({
        uri: photo.uri,
        takenAt: photo.takenAt,
        latitude: photo.latitude ?? null,
        longitude: photo.longitude ?? null,
        direction: photo.direction ?? null,
        label: 'ground_truth_photo',
      });
      continue;
    }

    const mimeType = normalizeEvidenceContentType(null, 'ground_truth_photo', photo.uri);
    const upload = await uploadEvidenceFileToStorage({
      localUri: photo.uri,
      mimeType,
      label: photo.direction ? `ground_truth_${photo.direction}` : 'ground_truth_photo',
      farmerId: params.farmerId,
      plotId: params.serverPlotId,
      kind: 'ground_truth',
    });
    if (upload.ok) {
      summary.uploadedCount += 1;
      resolved.push({
        uri: upload.remoteUrl,
        storagePath: upload.storagePath,
        mimeType,
        takenAt: photo.takenAt,
        latitude: photo.latitude ?? null,
        longitude: photo.longitude ?? null,
        direction: photo.direction ?? null,
        label: 'ground_truth_photo',
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

  const uploadedRows = resolved.filter(
    (row) => typeof row.storagePath === 'string' && String(row.storagePath).trim().length > 0,
  );
  if (uploadedRows.length > 0 || resolved.length > 0) {
    await syncPlotPhotosToBackend({
      plotId: params.serverPlotId,
      kind: 'ground_truth',
      photos: uploadedRows.length > 0 ? uploadedRows : resolved,
      note: params.note ?? 'Ground truth photos sync from device',
      hlcTimestamp: params.hlcTimestamp,
      clientEventId: params.clientEventId,
    });
  }

  assertGroundTruthPhotosUploaded(summary, params.photos);
  return summary;
}
