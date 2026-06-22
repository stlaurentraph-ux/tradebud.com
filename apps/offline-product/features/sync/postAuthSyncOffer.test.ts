import { describe, expect, it } from 'vitest';
import {
  postAuthSyncPlotCountHint,
  shouldOfferPostAuthSync,
} from './postAuthSyncOfferLogic';

describe('shouldOfferPostAuthSync', () => {
  it('offers sync when local is empty but server has plots', () => {
    expect(
      shouldOfferPostAuthSync({
        localPlotCount: 0,
        unsyncedPlotCount: 0,
        pendingQueueCount: 0,
        serverPlotCount: 3,
      }),
    ).toBe(true);
  });

  it('skips when local and server are both empty', () => {
    expect(
      shouldOfferPostAuthSync({
        localPlotCount: 0,
        unsyncedPlotCount: 0,
        pendingQueueCount: 0,
        serverPlotCount: 0,
      }),
    ).toBe(false);
  });

  it('offers sync for pending queue or unsynced uploads', () => {
    expect(
      shouldOfferPostAuthSync({
        localPlotCount: 2,
        unsyncedPlotCount: 1,
        pendingQueueCount: 0,
        serverPlotCount: 2,
      }),
    ).toBe(true);
  });
});

describe('postAuthSyncPlotCountHint', () => {
  it('uses server plot count for empty-device restore', () => {
    expect(
      postAuthSyncPlotCountHint({
        localPlotCount: 0,
        unsyncedPlotCount: 0,
        pendingQueueCount: 0,
        serverPlotCount: 4,
      }),
    ).toBe(4);
  });
});
