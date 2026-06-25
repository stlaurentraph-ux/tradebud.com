import { describe, expect, it } from 'vitest';
import { resolveFieldSyncMode } from './resolveFieldSyncMode';

describe('resolveFieldSyncMode', () => {
  it('uses push_only when only the upload queue has work', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 2,
        unsyncedPlotCount: 0,
        needsCloudRestore: false,
      }),
    ).toBe('push_only');
  });

  it('uses full when cloud restore is needed even with queue rows', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 2,
        needsCloudRestore: true,
      }),
    ).toBe('full');
  });

  it('uses full when plots still need upload', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 1,
        unsyncedPlotCount: 1,
      }),
    ).toBe('full');
  });

  it('uses full when nothing is pending and no delta cursor yet', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 0,
        unsyncedPlotCount: 0,
        needsCloudRestore: false,
      }),
    ).toBe('full');
  });

  it('uses push_only when delta reports no inbound changes and nothing local is pending', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 0,
        unsyncedPlotCount: 0,
        needsCloudRestore: false,
        hasFieldSyncCursor: true,
        cloudDeltaHasInboundChanges: false,
      }),
    ).toBe('push_only');
  });

  it('uses full when delta reports inbound changes even without local work', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 0,
        hasFieldSyncCursor: true,
        cloudDeltaHasInboundChanges: true,
      }),
    ).toBe('full');
  });

  it('respects forceFull', () => {
    expect(
      resolveFieldSyncMode({
        forceFull: true,
        queuePendingCount: 5,
        unsyncedPlotCount: 0,
      }),
    ).toBe('full');
  });
});
