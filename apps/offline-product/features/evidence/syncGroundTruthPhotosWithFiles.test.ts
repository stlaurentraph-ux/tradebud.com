import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadEvidenceFileToStorage = vi.fn();
const syncPlotPhotosToBackend = vi.fn(async () => ({}));
const checkFieldAppPermission = vi.fn(async () => ({ allowed: true, role: 'farmer' as const }));

vi.mock('@/features/evidence/uploadEvidenceToStorage', () => ({
  uploadEvidenceFileToStorage,
}));

vi.mock('@/features/api/postPlot', () => ({
  syncPlotPhotosToBackend,
}));

vi.mock('@/features/auth/fieldPermissionGate', () => ({
  checkFieldAppPermission,
  fieldPermissionDeniedMessage: vi.fn(() => 'permission denied'),
}));

function localPhoto(id: number, direction: 'north' | 'east' | 'south' | 'west') {
  return { id, plotId: 'local-plot', uri: `file:///gt-${id}.jpg`, takenAt: id, direction };
}

describe('syncGroundTruthPhotosWithFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a stable storage key so retries upsert instead of duplicating blobs', async () => {
    uploadEvidenceFileToStorage.mockResolvedValueOnce({
      ok: true,
      remoteUrl: 'https://signed.example/gt-5.jpg',
      storagePath: 'user/plot/ground_truth/gt-5',
    });

    const { syncGroundTruthPhotosWithFiles } = await import('./syncGroundTruthPhotosWithFiles');
    await syncGroundTruthPhotosWithFiles({
      serverPlotId: 'server-plot',
      farmerId: 'farmer-1',
      photos: [localPhoto(5, 'north')],
    });

    expect(uploadEvidenceFileToStorage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'ground_truth', stableKey: 5 }),
    );
  });

  it('throws on partial upload failure so the queue row is retained', async () => {
    uploadEvidenceFileToStorage
      .mockResolvedValueOnce({
        ok: true,
        remoteUrl: 'https://signed.example/gt-1.jpg',
        storagePath: 'user/plot/ground_truth/gt-1',
      })
      .mockResolvedValueOnce({ ok: false, reason: 'upload_failed', message: 'network down' });

    const { syncGroundTruthPhotosWithFiles } = await import('./syncGroundTruthPhotosWithFiles');

    await expect(
      syncGroundTruthPhotosWithFiles({
        serverPlotId: 'server-plot',
        farmerId: 'farmer-1',
        photos: [localPhoto(1, 'north'), localPhoto(2, 'east')],
      }),
    ).rejects.toMatchObject({ failure: { step: 'photo_storage', actionType: 'photos_sync' } });
  });

  it('does not throw when every local photo uploads', async () => {
    uploadEvidenceFileToStorage.mockResolvedValue({
      ok: true,
      remoteUrl: 'https://signed.example/gt.jpg',
      storagePath: 'user/plot/ground_truth/gt',
    });

    const { syncGroundTruthPhotosWithFiles } = await import('./syncGroundTruthPhotosWithFiles');
    const summary = await syncGroundTruthPhotosWithFiles({
      serverPlotId: 'server-plot',
      farmerId: 'farmer-1',
      photos: [localPhoto(1, 'north'), localPhoto(2, 'east')],
    });

    expect(summary.uploadedCount).toBe(2);
    expect(summary.failedUploadCount).toBe(0);
  });
});
