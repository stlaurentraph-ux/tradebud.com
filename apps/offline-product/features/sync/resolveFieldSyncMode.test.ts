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

  it('uses full when nothing is pending (refresh / parity check)', () => {
    expect(
      resolveFieldSyncMode({
        queuePendingCount: 0,
        unsyncedPlotCount: 0,
        needsCloudRestore: false,
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
