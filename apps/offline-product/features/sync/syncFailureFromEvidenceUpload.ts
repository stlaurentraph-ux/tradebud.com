import type { PendingSyncAction } from '@/features/state/persistence';
import type { EvidenceUploadResult } from '@/features/evidence/uploadEvidenceToStorage';
import { classifySyncFailure, type SyncFailure } from '@/features/sync/syncFailure';

type FailedEvidenceUpload = Extract<EvidenceUploadResult, { ok: false }>;

/**
 * Maps Supabase Storage upload outcomes to sync failures (step `photo_storage`).
 * API metadata sync uses step `photo_api` via {@link syncFailureFromPhotoApiError}.
 */
export function syncFailureFromEvidenceUpload(params: {
  upload: FailedEvidenceUpload;
  actionType?: PendingSyncAction['actionType'];
}): SyncFailure {
  const actionType = params.actionType ?? 'photos_sync';
  const { upload } = params;

  if (upload.reason === 'not_configured') {
    return {
      step: 'photo_storage',
      cause: 'unknown',
      message: 'Supabase storage is not configured on this build',
      actionType,
    };
  }

  if (upload.reason === 'not_signed_in') {
    return classifySyncFailure({
      error: upload.message ?? 'Sign in to upload evidence files.',
      step: 'photo_storage',
      actionType,
    });
  }

  if (upload.reason === 'not_local_file') {
    return {
      step: 'photo_storage',
      cause: 'validation',
      message: upload.message ?? 'Photo file is not stored on this device',
      actionType,
    };
  }

  if (upload.reason === 'read_failed') {
    const failure = classifySyncFailure({
      error: upload.message ?? 'Could not read photo file',
      step: 'photo_storage',
      actionType,
    });
    return { ...failure, cause: 'validation' };
  }

  const message = upload.message ?? 'Storage upload failed';
  const failure = classifySyncFailure({
    error: message,
    step: 'photo_storage',
    actionType,
  });

  if (/row-level security|policy|permission denied|forbidden|\b403\b/i.test(message)) {
    return { ...failure, cause: 'forbidden' };
  }

  return failure;
}

export function syncFailureFromPhotoApiError(params: {
  error: unknown;
  actionType?: PendingSyncAction['actionType'];
}): SyncFailure {
  const actionType = params.actionType ?? 'photos_sync';
  const message =
    params.error instanceof Error ? params.error.message : String(params.error ?? 'Photo API sync failed');
  return classifySyncFailure({
    error: message,
    step: 'photo_api',
    actionType,
  });
}
