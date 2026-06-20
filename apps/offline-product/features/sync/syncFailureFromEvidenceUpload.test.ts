import { describe, expect, it } from 'vitest';

import {
  syncFailureFromEvidenceUpload,
  syncFailureFromPhotoApiError,
} from './syncFailureFromEvidenceUpload';

describe('syncFailureFromEvidenceUpload', () => {
  it('maps read failures to photo_storage validation', () => {
    expect(
      syncFailureFromEvidenceUpload({
        upload: { ok: false, reason: 'read_failed', message: 'Could not read photo file' },
      }),
    ).toMatchObject({
      step: 'photo_storage',
      cause: 'validation',
      actionType: 'photos_sync',
    });
  });

  it('maps storage RLS errors to forbidden', () => {
    expect(
      syncFailureFromEvidenceUpload({
        upload: {
          ok: false,
          reason: 'upload_failed',
          message: 'new row violates row-level security policy',
        },
      }),
    ).toMatchObject({
      step: 'photo_storage',
      cause: 'forbidden',
    });
  });

  it('maps photo API transport errors to photo_api network', () => {
    expect(
      syncFailureFromPhotoApiError({ error: 'Network request failed' }),
    ).toMatchObject({
      step: 'photo_api',
      cause: 'network',
      actionType: 'photos_sync',
    });
  });
});
