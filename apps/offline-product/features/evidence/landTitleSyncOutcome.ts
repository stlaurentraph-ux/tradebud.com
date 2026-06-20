import type { PlotTitlePhoto } from '@/features/state/persistence';
import { isLocalEvidenceUri } from '@/features/evidence/evidenceContentType';

import type { SyncFailure } from '@/features/sync/syncFailure';
import { SyncFailureError } from '@/features/sync/syncFailureError';

export type LandTitleSyncSummary = {
  uploadedCount: number;
  metadataOnlyCount: number;
  failedUploadCount: number;
  notSignedIn: boolean;
  firstUploadError?: string;
  firstSyncFailure?: SyncFailure;
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
    throw new SyncFailureError(
      summary.firstSyncFailure ?? {
        step: 'photo_storage',
        cause: 'not_signed_in',
        message: 'Sign in to upload land documents for AI review.',
        actionType: 'photos_sync',
      },
    );
  }
  if (summary.uploadedCount === 0) {
    throw new SyncFailureError(
      summary.firstSyncFailure ?? {
        step: 'photo_storage',
        cause: 'unknown',
        message:
          summary.firstUploadError ??
          'Could not upload land document photos. Check your connection and try Sync now.',
        actionType: 'photos_sync',
      },
    );
  }
  if (summary.failedUploadCount > 0) {
    throw new SyncFailureError(
      summary.firstSyncFailure ?? {
        step: 'photo_storage',
        cause: 'unknown',
        message:
          summary.firstUploadError ??
          'Some land document photos did not upload. Try Sync now again.',
        actionType: 'photos_sync',
      },
    );
  }
}
