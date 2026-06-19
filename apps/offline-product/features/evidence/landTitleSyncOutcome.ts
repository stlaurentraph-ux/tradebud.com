import type { PlotTitlePhoto } from '@/features/state/persistence';
import { isLocalEvidenceUri } from '@/features/evidence/evidenceContentType';

export type LandTitleSyncSummary = {
  uploadedCount: number;
  metadataOnlyCount: number;
  failedUploadCount: number;
  notSignedIn: boolean;
  firstUploadError?: string;
};

export function createLandTitleSyncSummary(): LandTitleSyncSummary {
  return {
    uploadedCount: 0,
    metadataOnlyCount: 0,
    failedUploadCount: 0,
    notSignedIn: false,
  };
}

export function assertLandTitlePhotosUploadedForAi(
  summary: LandTitleSyncSummary,
  photos: PlotTitlePhoto[],
): void {
  const localPhotos = photos.filter((photo) => isLocalEvidenceUri(photo.uri));
  if (localPhotos.length === 0) {
    return;
  }
  if (summary.notSignedIn) {
    throw new Error('Sign in to upload land documents for AI review.');
  }
  if (summary.uploadedCount === 0) {
    throw new Error(
      summary.firstUploadError ??
        'Could not upload land document photos. Check your connection and try Sync now.',
    );
  }
  if (summary.failedUploadCount > 0) {
    throw new Error(
      summary.firstUploadError ??
        'Some land document photos did not upload. Try Sync now again.',
    );
  }
}
