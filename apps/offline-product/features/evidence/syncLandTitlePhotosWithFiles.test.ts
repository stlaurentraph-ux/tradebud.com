import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadEvidenceFileToStorage = vi.fn();
const syncPlotPhotosToBackend = vi.fn(async () => ({}));
const updatePlotTitlePhotoRemoteRef = vi.fn(async () => undefined);

vi.mock('@/features/evidence/uploadEvidenceToStorage', () => ({
  uploadEvidenceFileToStorage,
}));

vi.mock('@/features/api/postPlot', () => ({
  syncPlotPhotosToBackend,
}));

vi.mock('@/features/state/persistence', () => ({
  updatePlotTitlePhotoRemoteRef,
}));

describe('syncLandTitlePhotosWithFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses stored path instead of uploading again', async () => {
    uploadEvidenceFileToStorage.mockResolvedValueOnce({
      ok: true,
      remoteUrl: 'https://signed.example/title.jpg',
      storagePath: 'user/plot/land_title/title-7',
    });

    const { syncLandTitlePhotosWithFiles } = await import('./syncLandTitlePhotosWithFiles');
    const summary = await syncLandTitlePhotosWithFiles({
      serverPlotId: 'server-plot',
      farmerId: 'farmer-1',
      photos: [
        {
          id: 7,
          plotId: 'local-plot',
          uri: 'file:///title.jpg',
          takenAt: 1,
          storagePath: 'user/plot/land_title/title-7',
        },
      ],
    });

    expect(summary.uploadedCount).toBe(0);
    expect(summary.metadataOnlyCount).toBe(1);
    expect(uploadEvidenceFileToStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        existingStoragePath: 'user/plot/land_title/title-7',
        stableFileKey: undefined,
      }),
    );
    expect(updatePlotTitlePhotoRemoteRef).toHaveBeenCalledWith(7, {
      storagePath: 'user/plot/land_title/title-7',
      remoteUri: 'https://signed.example/title.jpg',
    });
    expect(syncPlotPhotosToBackend).toHaveBeenCalledTimes(1);
  });

  it('uses stable storage key on first upload', async () => {
    uploadEvidenceFileToStorage.mockResolvedValueOnce({
      ok: true,
      remoteUrl: 'https://signed.example/new.jpg',
      storagePath: 'user/plot/land_title/title-3',
    });

    const { syncLandTitlePhotosWithFiles } = await import('./syncLandTitlePhotosWithFiles');
    await syncLandTitlePhotosWithFiles({
      serverPlotId: 'server-plot',
      farmerId: 'farmer-1',
      photos: [
        {
          id: 3,
          plotId: 'local-plot',
          uri: 'file:///title.jpg',
          takenAt: 1,
        },
      ],
    });

    expect(uploadEvidenceFileToStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        stableFileKey: 'title-3',
        existingStoragePath: null,
      }),
    );
  });
});
