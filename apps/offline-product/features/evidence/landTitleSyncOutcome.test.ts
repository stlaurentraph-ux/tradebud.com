import { describe, expect, it } from 'vitest';

import {
  assertLandTitlePhotosUploadedForAi,
  createLandTitleSyncSummary,
} from './landTitleSyncOutcome';

type TitlePhoto = { id: number; plotId: string; uri: string; takenAt: number };

function photo(uri: string): TitlePhoto {
  return { id: 1, plotId: 'local-1', uri, takenAt: 1 };
}

describe('assertLandTitlePhotosUploadedForAi', () => {
  it('passes when all local photos uploaded', () => {
    const summary = createLandTitleSyncSummary();
    summary.uploadedCount = 2;
    expect(() =>
      assertLandTitlePhotosUploadedForAi(summary, [
        photo('file:///a.jpg'),
        photo('file:///b.jpg'),
      ]),
    ).not.toThrow();
  });

  it('throws when local photos never reached storage', () => {
    const summary = createLandTitleSyncSummary();
    summary.failedUploadCount = 1;
    summary.firstUploadError = 'Bucket not found';
    expect(() => assertLandTitlePhotosUploadedForAi(summary, [photo('file:///a.jpg')])).toThrow(
      'Bucket not found',
    );
  });

  it('throws when signed out', () => {
    const summary = createLandTitleSyncSummary();
    summary.notSignedIn = true;
    expect(() => assertLandTitlePhotosUploadedForAi(summary, [photo('file:///a.jpg')])).toThrow(
      /sign in/i,
    );
  });

  it('ignores already-remote photos', () => {
    const summary = createLandTitleSyncSummary();
    expect(() =>
      assertLandTitlePhotosUploadedForAi(summary, [
        photo('https://cdn.example.com/title.jpg'),
      ]),
    ).not.toThrow();
  });
});
