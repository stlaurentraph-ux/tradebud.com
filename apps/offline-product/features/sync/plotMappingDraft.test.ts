import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchMergedAuditEventsForFarmer: vi.fn(),
  loadPlotMappingDraft: vi.fn(),
  persistPlotMappingDraft: vi.fn(),
  clearPlotMappingDraft: vi.fn(),
}));

vi.mock('@/features/sync/queueFieldCloudAuditSync', () => ({
  queueFieldCloudAuditSync: vi.fn(),
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  fetchMergedAuditEventsForFarmer: mocks.fetchMergedAuditEventsForFarmer,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPlotMappingDraft: mocks.loadPlotMappingDraft,
  persistPlotMappingDraft: mocks.persistPlotMappingDraft,
  clearPlotMappingDraft: mocks.clearPlotMappingDraft,
}));

import { restorePlotMappingDraftFromServer } from './plotMappingDraft';

describe('restorePlotMappingDraftFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPlotMappingDraft.mockResolvedValue(null);
  });

  it('restores latest mapping draft from audit', async () => {
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        event_type: 'plot_mapping_draft_saved',
        timestamp: '2026-06-23T12:00:00.000Z',
        payload: {
          farmerId: 'farmer-1',
          points: [{ latitude: 14.1, longitude: -87.2 }],
          updatedAt: 1_700_000_000_000,
          plotName: 'North field',
          captureMethod: 'walk',
        },
      },
    ]);

    const result = await restorePlotMappingDraftFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
    });

    expect(result.restored).toBe(true);
    expect(mocks.persistPlotMappingDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        farmerId: 'farmer-1',
        plotName: 'North field',
      }),
    );
  });
});
