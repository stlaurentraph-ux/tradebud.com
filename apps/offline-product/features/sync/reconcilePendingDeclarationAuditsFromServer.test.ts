import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadPendingSyncActions: vi.fn(),
  deletePendingSyncAction: vi.fn(async () => undefined),
  loadPlotServerLinks: vi.fn(async () => ({})),
  fetchMergedAuditEventsForFarmer: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(async () => []),
  markDeclarationAuditSynced: vi.fn(async () => undefined),
  markFieldCloudAuditSynced: vi.fn(async () => undefined),
}));

vi.mock('@/features/state/persistence', () => ({
  loadPendingSyncActions: mocks.loadPendingSyncActions,
  deletePendingSyncAction: mocks.deletePendingSyncAction,
  loadPlotServerLinks: mocks.loadPlotServerLinks,
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  fetchMergedAuditEventsForFarmer: mocks.fetchMergedAuditEventsForFarmer,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/sync/queueDeclarationAuditSync', () => ({
  markDeclarationAuditSynced: mocks.markDeclarationAuditSynced,
}));

vi.mock('@/features/sync/queueFieldCloudAuditSync', () => ({
  markFieldCloudAuditSynced: mocks.markFieldCloudAuditSynced,
}));

import { reconcilePendingDeclarationAuditsFromServer } from './reconcilePendingDeclarationAuditsFromServer';

describe('reconcilePendingDeclarationAuditsFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      { event_type: 'producer_attestations_updated', payload: {}, timestamp: '1' },
    ]);
  });

  it('drops redundant producer audit_sync rows when server already has the event', async () => {
    mocks.loadPendingSyncActions.mockResolvedValue([
      {
        id: 9,
        actionType: 'audit_sync',
        payloadJson: JSON.stringify({
          eventType: 'producer_attestations_updated',
          payload: { farmerId: 'farmer-1' },
        }),
        createdAt: 1,
        lastError: null,
      },
    ]);

    const result = await reconcilePendingDeclarationAuditsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
      localFarmer: { id: 'farmer-1', name: 'A' },
      localPlots: [],
    });

    expect(result.dropped).toBe(1);
    expect(mocks.deletePendingSyncAction).toHaveBeenCalledWith(9);
    expect(mocks.markDeclarationAuditSynced).toHaveBeenCalled();
  });
});
