import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  probeTracebudApiReachable: vi.fn(),
  postHarvestToBackend: vi.fn(),
  syncPlotLegalToBackend: vi.fn(),
  postAuditEventToBackend: vi.fn(),
  markDeclarationAuditSynced: vi.fn(),
  markFieldCloudAuditSynced: vi.fn(),
  fetchMergedServerPlots: vi.fn(),
  fetchPlotsForFarmerCached: vi.fn(),
  syncLandTitlePhotosWithFiles: vi.fn(),
  syncGroundTruthPhotosWithFiles: vi.fn(),
  syncPlotEvidenceWithFiles: vi.fn(),
  readHarvestSubmitQrCodeRef: vi.fn(),
  resolveServerPlotIdForLocal: vi.fn(),
  reconcilePlotServerLinks: vi.fn(),
  loadPendingSyncActions: vi.fn(),
  deletePendingSyncAction: vi.fn(),
  compactDuplicatePendingSyncActions: vi.fn(),
  loadEvidenceForPlot: vi.fn(),
  loadPhotosForPlot: vi.fn(),
  loadTitlePhotosForPlot: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  persistPlotServerLinks: vi.fn(),
  logAuditEvent: vi.fn(),
  markPendingSyncAttempt: vi.fn(),
  updateLocalDeliveryReceipt: vi.fn(),
  updatePlotEvidenceUri: vi.fn(),
  trackEvent: vi.fn(),
  reportSyncFailure: vi.fn(),
}));

vi.mock('@/features/network/pingTracebudApi', () => ({
  probeTracebudApiReachable: mocks.probeTracebudApiReachable,
}));
vi.mock('@/features/api/postPlot', () => ({
  postHarvestToBackend: mocks.postHarvestToBackend,
  syncPlotLegalToBackend: mocks.syncPlotLegalToBackend,
  fetchPlotSyncedEvidence: vi.fn().mockResolvedValue([]),
  fetchPlotTenureVerification: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/features/api/audit', () => ({
  postAuditEventToBackend: mocks.postAuditEventToBackend,
}));
vi.mock('@/features/sync/queueDeclarationAuditSync', () => ({
  markDeclarationAuditSynced: mocks.markDeclarationAuditSynced,
}));
vi.mock('@/features/sync/queueFieldCloudAuditSync', () => ({
  markFieldCloudAuditSynced: mocks.markFieldCloudAuditSynced,
}));
vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchMergedServerPlots: mocks.fetchMergedServerPlots,
  prepareFieldSyncContext: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/features/sync/serverPlotFetchCache', () => ({
  fetchPlotsForFarmerCached: mocks.fetchPlotsForFarmerCached,
}));
vi.mock('@/features/evidence/syncLandTitlePhotosWithFiles', () => ({
  syncLandTitlePhotosWithFiles: mocks.syncLandTitlePhotosWithFiles,
}));
vi.mock('@/features/evidence/syncGroundTruthPhotosWithFiles', () => ({
  syncGroundTruthPhotosWithFiles: mocks.syncGroundTruthPhotosWithFiles,
}));
vi.mock('@/features/evidence/syncEvidenceWithFiles', () => ({
  syncPlotEvidenceWithFiles: mocks.syncPlotEvidenceWithFiles,
}));
vi.mock('@/features/harvest/resolveDeliveryQrCode', () => ({
  readHarvestSubmitQrCodeRef: mocks.readHarvestSubmitQrCodeRef,
}));
vi.mock('@/features/plots/plotServerLink', () => ({
  resolveServerPlotIdForLocal: mocks.resolveServerPlotIdForLocal,
  reconcilePlotServerLinks: mocks.reconcilePlotServerLinks,
}));
vi.mock('@/features/state/persistence', () => ({
  loadPendingSyncActions: mocks.loadPendingSyncActions,
  deletePendingSyncAction: mocks.deletePendingSyncAction,
  compactDuplicatePendingSyncActions: mocks.compactDuplicatePendingSyncActions,
  loadEvidenceForPlot: mocks.loadEvidenceForPlot,
  loadPhotosForPlot: mocks.loadPhotosForPlot,
  loadTitlePhotosForPlot: mocks.loadTitlePhotosForPlot,
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  persistPlotServerLinks: mocks.persistPlotServerLinks,
  logAuditEvent: mocks.logAuditEvent,
  markPendingSyncAttempt: mocks.markPendingSyncAttempt,
  updateLocalDeliveryReceipt: mocks.updateLocalDeliveryReceipt,
  updatePlotEvidenceUri: mocks.updatePlotEvidenceUri,
}));
vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: { HARVEST_SUBMIT_SUCCESS: 'harvest_submit_success' },
  trackEvent: mocks.trackEvent,
}));
vi.mock('@/features/sync/reportSyncFailure', () => ({
  reportSyncFailure: mocks.reportSyncFailure,
}));

import { processPendingSyncQueue } from './processPendingSyncQueue';
import type { Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';

const localPlot: Plot = {
  id: 'local-1',
  farmerId: 'farmer-1',
  name: 'Plot A',
  createdAt: 1,
  areaSquareMeters: 10000,
  areaHectares: 1,
  kind: 'polygon',
  points: [{ latitude: 1, longitude: 2 }],
  landTenureDeclared: true,
  noDeforestationDeclared: true,
};

function makeRow(
  id: number,
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
  attempts = 0,
): PendingSyncAction {
  return {
    id,
    createdAt: id,
    hlcTimestamp: `2026-06-30T10:00:00.000Z-0${id}`,
    actionType,
    payloadJson,
    attempts,
    lastError: null,
    lastAttemptAt: null,
  };
}

describe('processPendingSyncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.probeTracebudApiReachable.mockResolvedValue(true);
    mocks.fetchPlotsForFarmerCached.mockResolvedValue([{ id: 'server-1', client_plot_id: 'local-1' }]);
    mocks.fetchMergedServerPlots.mockResolvedValue([{ id: 'server-1', client_plot_id: 'local-1' }]);
    mocks.loadPlotServerLinks.mockResolvedValue({ 'local-1': 'server-1' });
    mocks.reconcilePlotServerLinks.mockImplementation((_local, _backend, existing) => existing);
    mocks.persistPlotServerLinks.mockResolvedValue(undefined);
    mocks.compactDuplicatePendingSyncActions.mockResolvedValue(0);
    mocks.loadPendingSyncActions.mockResolvedValue([]);
    mocks.deletePendingSyncAction.mockResolvedValue(undefined);
    mocks.logAuditEvent.mockResolvedValue(undefined);
    mocks.markPendingSyncAttempt.mockResolvedValue(undefined);
    mocks.updateLocalDeliveryReceipt.mockResolvedValue(undefined);
    mocks.readHarvestSubmitQrCodeRef.mockReturnValue('V-TEST1');
    mocks.postHarvestToBackend.mockResolvedValue({ voucher: { qr_code_ref: 'V-TEST1' } });
    mocks.loadEvidenceForPlot.mockResolvedValue([]);
    mocks.loadPhotosForPlot.mockResolvedValue([]);
    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);
    mocks.syncPlotEvidenceWithFiles.mockResolvedValue({ ok: true });
    mocks.syncGroundTruthPhotosWithFiles.mockResolvedValue({ ok: true });
    mocks.syncLandTitlePhotosWithFiles.mockResolvedValue({ ok: true });
    mocks.syncPlotLegalToBackend.mockResolvedValue({ ok: true });
  });

  it('blocks harvest when no server plot link resolves (I1)', async () => {
    mocks.loadPendingSyncActions.mockResolvedValue([
      makeRow(1, 'harvest', JSON.stringify({ plotId: 'local-orphan', kg: 10, clientEventId: 'h-1' })),
    ]);
    // No link for local-orphan, no backend match.
    mocks.resolveServerPlotIdForLocal.mockReturnValue(null);
    mocks.loadPlotServerLinks.mockResolvedValue({});
    mocks.fetchPlotsForFarmerCached.mockResolvedValue([]);

    const result = await processPendingSyncQueue({
      farmerId: 'farmer-1',
      localPlots: [localPlot],
      ignoreBackoff: true,
    });

    expect(result.failedActions).toBe(1);
    expect(result.completed).toBe(0);
    expect(mocks.markPendingSyncAttempt).toHaveBeenCalledWith(1, expect.objectContaining({
      attempts: 1,
      lastError: expect.stringContaining('Plot not on server'),
    }));
    expect(mocks.postHarvestToBackend).not.toHaveBeenCalled();
  });

  it('routes producer-scoped evidence to the first linked server plot (I1)', async () => {
    mocks.loadPendingSyncActions.mockResolvedValue([
      makeRow(2, 'evidence_sync', JSON.stringify({
        scope: 'producer',
        plotId: 'profile:farmer-1',
        reason: 'buyer audit',
        farmerId: 'farmer-1',
      })),
    ]);
    mocks.loadEvidenceForPlot.mockResolvedValue([
      { id: 'ev-1', plotId: 'profile:farmer-1', kind: 'fpic_repository', uri: 'file://doc.pdf', mimeType: 'application/pdf' },
    ]);

    const result = await processPendingSyncQueue({
      farmerId: 'farmer-1',
      localPlots: [localPlot],
      ignoreBackoff: true,
    });

    expect(result.completed).toBe(1);
    expect(mocks.syncPlotEvidenceWithFiles).toHaveBeenCalledWith(
      expect.objectContaining({ serverPlotId: 'server-1' }),
    );
  });

  it('drops rows with invalid JSON payloads (I1)', async () => {
    mocks.loadPendingSyncActions.mockResolvedValue([
      makeRow(3, 'harvest', '{not valid json'),
    ]);

    const result = await processPendingSyncQueue({
      farmerId: 'farmer-1',
      localPlots: [localPlot],
      ignoreBackoff: true,
    });

    expect(result.droppedInvalid).toBe(1);
    expect(result.completed).toBe(0);
    expect(result.failedActions).toBe(0);
    expect(mocks.deletePendingSyncAction).toHaveBeenCalledWith(3);
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'sync_queue_action_dropped_invalid' }),
    );
  });

  it('retains the row and increments failedActions on mid-drain API failure (I1)', async () => {
    mocks.loadPendingSyncActions.mockResolvedValue([
      makeRow(4, 'harvest', JSON.stringify({ plotId: 'local-1', kg: 10, clientEventId: 'h-4' })),
    ]);
    mocks.resolveServerPlotIdForLocal.mockReturnValue('server-1');
    mocks.postHarvestToBackend.mockRejectedValue(new Error('Server 500'));

    const result = await processPendingSyncQueue({
      farmerId: 'farmer-1',
      localPlots: [localPlot],
      ignoreBackoff: true,
    });

    expect(result.failedActions).toBe(1);
    expect(result.completed).toBe(0);
    expect(mocks.markPendingSyncAttempt).toHaveBeenCalledWith(4, expect.objectContaining({
      attempts: 1,
    }));
    expect(mocks.deletePendingSyncAction).not.toHaveBeenCalledWith(4);
  });
});
