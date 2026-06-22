import { describe, expect, it } from 'vitest';

import { classifyQueueSyncFailure } from '@/features/sync/syncFailure';

describe('readLocalEvidenceFile integration via failure copy', () => {
  it('classifies missing local photo files as photo_storage validation', () => {
    expect(
      classifyQueueSyncFailure({
        error: 'Photo file missing on this device — open the plot and add the photo again.',
        actionType: 'photos_sync',
      }),
    ).toMatchObject({
      step: 'photo_storage',
      cause: 'validation',
    });
  });
});
