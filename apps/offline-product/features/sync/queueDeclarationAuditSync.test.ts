import { beforeEach, describe, expect, it, vi } from 'vitest';

const postAuditEventToBackend = vi.fn();
const hasSyncAuthSession = vi.fn();
const enqueuePendingSync = vi.fn();
const loadPendingSyncActions = vi.fn();
const markPendingSyncAttempt = vi.fn();
const getSetting = vi.fn();
const setSetting = vi.fn();
const deletePendingSyncAction = vi.fn();
const fetchMergedAuditEventsForFarmer = vi.fn();
const loadPlotServerLinks = vi.fn();
const fetchBackendPlotsForSyncScope = vi.fn();

vi.mock('@/features/api/audit', () => ({
  postAuditEventToBackend,
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  hasSyncAuthSession,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  fetchOwnedFarmerIdsFromApi: vi.fn(async () => []),
  getBootstrapOwnedFarmerIds: vi.fn(() => []),
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  invalidateAuditFetchCache: vi.fn(),
  fetchMergedAuditEventsForFarmer,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/sync/queueFieldCloudAuditSync', () => ({
  markFieldCloudAuditSynced: vi.fn(async () => undefined),
  isFieldCloudAuditSynced: vi.fn(async () => false),
}));

vi.mock('@/features/state/persistence', () => ({
  enqueuePendingSync,
  loadPendingSyncActions,
  markPendingSyncAttempt,
  getSetting,
  setSetting,
  deletePendingSyncAction,
  loadPlotServerLinks,
}));

async function loadModule() {
  return import('./queueDeclarationAuditSync');
}

describe('queueDeclarationAuditSync', () => {
  beforeEach(() => {
    vi.resetModules();
    postAuditEventToBackend.mockReset();
    hasSyncAuthSession.mockReset();
    enqueuePendingSync.mockReset();
    loadPendingSyncActions.mockReset();
    markPendingSyncAttempt.mockReset();
    getSetting.mockReset();
    setSetting.mockReset();
    deletePendingSyncAction.mockReset();
    fetchMergedAuditEventsForFarmer.mockReset();
    loadPlotServerLinks.mockReset();
    fetchBackendPlotsForSyncScope.mockReset();

    hasSyncAuthSession.mockReturnValue(true);
    const markerStore = new Map<string, string>();
    getSetting.mockImplementation(async (key: string) => markerStore.get(key) ?? null);
    setSetting.mockImplementation(async (key: string, value: string) => {
      markerStore.set(key, value);
    });
    deletePendingSyncAction.mockResolvedValue(undefined);
    markPendingSyncAttempt.mockResolvedValue(undefined);
    loadPendingSyncActions.mockResolvedValue([]);
    loadPlotServerLinks.mockResolvedValue({});
    fetchBackendPlotsForSyncScope.mockResolvedValue([]);
    fetchMergedAuditEventsForFarmer.mockResolvedValue([]);
    enqueuePendingSync.mockImplementation(async (row) => {
      loadPendingSyncActions.mockResolvedValue([
        {
          id: 42,
          createdAt: row.createdAt,
          actionType: row.actionType,
          payloadJson: row.payloadJson,
          lastError: row.lastError,
          attempts: 0,
        },
      ]);
    });
  });

  it('queues only once during sync backfill (deferPost)', async () => {
    const { queueDeclarationAuditSync } = await loadModule();

    await queueDeclarationAuditSync({
      eventType: 'producer_attestations_updated',
      payload: { farmerId: 'farmer-1' },
      deferPost: true,
    });

    expect(enqueuePendingSync).toHaveBeenCalledTimes(1);
    expect(postAuditEventToBackend).not.toHaveBeenCalled();
  });

  it('does not enqueue a second row when immediate POST fails', async () => {
    postAuditEventToBackend.mockResolvedValue({
      ok: false,
      reason: 'server_error',
      message: 'Too many requests, please slow down.',
    });
    const { queueDeclarationAuditSync } = await loadModule();

    const result = await queueDeclarationAuditSync({
      eventType: 'plot_compliance_declared',
      payload: { plotId: 'plot-1', farmerId: 'farmer-1' },
      clearSyncedMarker: true,
    });

    expect(result).toBe('queued');
    expect(enqueuePendingSync).toHaveBeenCalledTimes(1);
    expect(markPendingSyncAttempt).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        lastError: 'Too many requests, please slow down.',
      }),
    );
  });

  it('skips work when declaration audit marker already exists', async () => {
    getSetting.mockResolvedValue('1730000000000');
    const { queueDeclarationAuditSync } = await loadModule();

    const result = await queueDeclarationAuditSync({
      eventType: 'producer_attestations_updated',
      payload: { farmerId: 'farmer-1' },
    });

    expect(result).toBe('synced');
    expect(enqueuePendingSync).not.toHaveBeenCalled();
    expect(postAuditEventToBackend).not.toHaveBeenCalled();
  });

  it('skips plot backfill when declaration markers were hydrated from server audit', async () => {
    fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        id: 'evt-plot',
        event_type: 'plot_compliance_declared',
        timestamp: '2026-06-19T12:00:00.000Z',
        payload: {
          plotId: 'plot-1',
          farmerId: 'farmer-1',
          landTenureDeclared: true,
          noDeforestationDeclared: true,
        },
      },
    ]);
    const hydrateModule = await import('./hydrateDeclarationSyncMarkersFromServer');
    await hydrateModule.hydrateDeclarationSyncMarkersFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
      localFarmer: { id: 'farmer-1', role: 'farmer', selfDeclared: false },
      localPlots: [
        {
          id: 'plot-1',
          farmerId: 'farmer-1',
          name: 'Plot 1',
          createdAt: 1,
          areaSquareMeters: 10_000,
          areaHectares: 1,
          kind: 'polygon',
          points: [],
          landTenureDeclared: true,
          noDeforestationDeclared: true,
        },
      ],
      auditRows: await fetchMergedAuditEventsForFarmer(['farmer-1']),
    });

    const { enqueuePendingDeclarationAuditsForDevice } = await loadModule();

    const result = await enqueuePendingDeclarationAuditsForDevice({
      farmer: { id: 'farmer-1', role: 'farmer', selfDeclared: false },
      plots: [
        {
          id: 'plot-1',
          farmerId: 'farmer-1',
          name: 'Plot 1',
          createdAt: 1,
          areaSquareMeters: 10_000,
          areaHectares: 1,
          kind: 'polygon',
          points: [],
          landTenureDeclared: true,
          noDeforestationDeclared: true,
        },
      ],
    });

    expect(result.plots).toBe(0);
    expect(enqueuePendingSync).not.toHaveBeenCalled();
  });
});
