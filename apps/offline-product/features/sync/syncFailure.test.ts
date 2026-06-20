import { describe, expect, it } from 'vitest';

import {
  classifyQueueSyncFailure,
  classifySyncFailure,
  classifyTokenVerifyFailure,
} from './syncFailure';

describe('classifySyncFailure', () => {
  it('classifies token refresh network errors', () => {
    expect(classifyTokenVerifyFailure('network')).toEqual({
      step: 'token_refresh',
      cause: 'network',
      message: 'Network request failed',
    });
  });

  it('classifies photo queue transport errors', () => {
    expect(
      classifyQueueSyncFailure({
        error: 'Network request failed',
        actionType: 'photos_sync',
      }),
    ).toMatchObject({
      step: 'photo_api',
      cause: 'network',
      actionType: 'photos_sync',
    });
  });

  it('classifies storage-related photo errors', () => {
    expect(
      classifyQueueSyncFailure({
        error: 'Could not create signed URL for uploaded file',
        actionType: 'photos_sync',
      }),
    ).toMatchObject({
      step: 'photo_storage',
      actionType: 'photos_sync',
    });
  });

  it('classifies missing plot link copy', () => {
    expect(
      classifySyncFailure({
        error: 'Plot not on server — upload from My Plots first.',
        actionType: 'harvest',
      }),
    ).toMatchObject({
      cause: 'missing_plot_link',
      step: 'harvest',
    });
  });

  it('classifies photo API HTTP errors separately from storage', () => {
    expect(
      classifyQueueSyncFailure({
        error: 'Photo sync error: 403',
        actionType: 'photos_sync',
      }),
    ).toMatchObject({
      step: 'photo_api',
      actionType: 'photos_sync',
    });
  });

  it('classifies auth failures', () => {
    expect(
      classifySyncFailure({
        error: '401 Unauthorized',
        step: 'plot_list',
      }),
    ).toMatchObject({
      cause: 'auth',
      httpStatus: 401,
    });
  });
});
