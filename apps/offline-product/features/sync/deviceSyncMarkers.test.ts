import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  deleteSettingsByPrefix: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  getSetting: mocks.getSetting,
  setSetting: mocks.setSetting,
  deleteSettingsByPrefix: mocks.deleteSettingsByPrefix,
}));

import {
  classifyDeviceSyncAttention,
  clearAllInboundHydratedMarkers,
  inboundPlotKey,
  isInboundHydrated,
  markInboundHydrated,
} from './deviceSyncMarkers';

describe('deviceSyncMarkers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSetting.mockResolvedValue(null);
    mocks.setSetting.mockResolvedValue(undefined);
    mocks.deleteSettingsByPrefix.mockResolvedValue(undefined);
  });

  it('marks and reads inbound hydrate scope', async () => {
    mocks.getSetting.mockImplementation(async (key: string) =>
      key === 'cloud_inbound_hydrated:plot:plot-1' ? '1730000000000' : null,
    );
    await markInboundHydrated(inboundPlotKey('plot-1'));
    expect(mocks.setSetting).toHaveBeenCalledWith(
      'cloud_inbound_hydrated:plot:plot-1',
      expect.any(String),
    );
    await expect(isInboundHydrated(inboundPlotKey('plot-1'))).resolves.toBe(true);
  });

  it('clears all inbound markers on sign-out helper', async () => {
    await clearAllInboundHydratedMarkers();
    expect(mocks.deleteSettingsByPrefix).toHaveBeenCalledWith('cloud_inbound_hydrated:');
  });

  it('classifies inbound restore vs outbound upload separately', () => {
    expect(
      classifyDeviceSyncAttention({
        needsRestore: true,
        queueMediaPendingCount: 2,
        unsyncedPlotCount: 1,
      }),
    ).toEqual({
      needsInboundRestore: true,
      needsOutboundUpload: true,
    });
  });
});
