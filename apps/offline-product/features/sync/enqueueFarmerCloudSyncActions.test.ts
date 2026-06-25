import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FARMER_CLOUD_SYNC_PREP_OPTIONS } from '@/features/sync/farmerArtifactRegistry';

const queueFieldDevicePreferencesSync = vi.fn();
const queueFarmerProfilePhotoSync = vi.fn();
const queuePlotMappingDraftSync = vi.fn();
const getSetting = vi.fn();
const loadPlotMappingDraft = vi.fn();

vi.mock('@/features/sync/syncFieldDevicePreferences', () => ({
  queueFieldDevicePreferencesSync,
}));

vi.mock('@/features/sync/syncFarmerProfilePhoto', () => ({
  queueFarmerProfilePhotoSync,
}));

vi.mock('@/features/sync/plotMappingDraft', () => ({
  queuePlotMappingDraftSync,
}));

vi.mock('@/features/state/persistence', () => ({
  getSetting,
  loadPlotMappingDraft,
}));

describe('enqueueFarmerCloudSyncActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueFieldDevicePreferencesSync.mockResolvedValue('queued');
    queueFarmerProfilePhotoSync.mockResolvedValue('queued');
    queuePlotMappingDraftSync.mockResolvedValue('queued');
    getSetting.mockResolvedValue('file:///photo.jpg');
    loadPlotMappingDraft.mockResolvedValue({
      farmerId: 'farmer-1',
      points: [{ lat: 1, lng: 2 }],
    });
  });

  it('passes registry sync prep options to all farmer cloud audit enqueue paths', async () => {
    const { enqueueFarmerCloudSyncActions } = await import('./enqueueFarmerCloudSyncActions');

    await enqueueFarmerCloudSyncActions({ id: 'farmer-1' } as never);

    expect(queueFieldDevicePreferencesSync).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'farmer-1' }),
      FARMER_CLOUD_SYNC_PREP_OPTIONS,
    );
    expect(queueFarmerProfilePhotoSync).toHaveBeenCalledWith({
      farmerId: 'farmer-1',
      localUri: 'file:///photo.jpg',
      ...FARMER_CLOUD_SYNC_PREP_OPTIONS,
    });
    expect(queuePlotMappingDraftSync).toHaveBeenCalledWith(
      expect.objectContaining({ farmerId: 'farmer-1' }),
      FARMER_CLOUD_SYNC_PREP_OPTIONS,
    );
  });
});
