import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PENDING_SYNC_UPLOAD_ACTION_TYPES } from '@/features/sync/farmerArtifactRegistry';
import type { LocalDeliveryReceiptRow, PendingSyncAction } from '@/features/state/persistence';

const deletePendingSyncAction = vi.fn(async () => undefined);
const loadPendingSyncActions = vi.fn(async (): Promise<PendingSyncAction[]> => []);
const loadAllLocalDeliveryReceipts = vi.fn(async (): Promise<LocalDeliveryReceiptRow[]> => []);
const loadPhotosForPlot = vi.fn(async () => []);
const loadTitlePhotosForPlot = vi.fn(async () => []);
const loadEvidenceForPlot = vi.fn(async () => []);
const isDeclarationAuditSynced = vi.fn(async () => false);

vi.mock('@/features/state/persistence', () => ({
  deletePendingSyncAction,
  loadPendingSyncActions,
  loadAllLocalDeliveryReceipts,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  isPlotTitlePhotoPendingUpload: (photo: { storagePath?: string | null }) =>
    !photo.storagePath?.trim(),
  isPlotGroundPhotoPendingUpload: (photo: { uri: string; storagePath?: string | null }) =>
    !photo.storagePath?.trim(),
  isPlotEvidencePendingUpload: (item: { uri: string; storagePath?: string | null }) =>
    !item.storagePath?.trim(),
  isLocalDeliveryReceiptPendingUpload: (receipt: {
    pendingSync: boolean;
    qrCodeRef?: string | null;
  }) => receipt.pendingSync && !receipt.qrCodeRef?.trim(),
}));

vi.mock('@/features/sync/queueDeclarationAuditSync', () => ({
  isDeclarationAuditSynced,
}));

const pruneSourcePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'pruneRedundantPendingUploadActions.ts',
);

describe('pruneRedundantPendingUploadActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('covers every pending sync upload action type from the farmer artifact registry', () => {
    const raw = fs.readFileSync(pruneSourcePath, 'utf8');
    for (const actionType of PENDING_SYNC_UPLOAD_ACTION_TYPES) {
      expect(raw).toContain(`actionType === '${actionType}'`);
    }
    expect(raw).toContain('PRUNE_BRANCH_COVERAGE');
  });

  it('drops harvest rows when the receipt is already synced locally', async () => {
    loadPendingSyncActions.mockResolvedValueOnce([
      {
        id: 1,
        createdAt: 1,
        hlcTimestamp: '1',
        actionType: 'harvest',
        payloadJson: JSON.stringify({ clientEventId: 'harvest-1' }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
      },
    ]);
    loadAllLocalDeliveryReceipts.mockResolvedValueOnce([
      {
        id: 'harvest-1',
        farmerId: 'farmer-1',
        localPlotId: 'plot-1',
        serverPlotId: 'server-1',
        plotName: 'Plot 1',
        kg: 100,
        recordedAt: 1,
        qrCodeRef: 'QR-1',
        pendingSync: false,
        buyerLabel: 'Buyer',
      },
    ]);

    const { pruneRedundantPendingUploadActions } = await import('./pruneRedundantPendingUploadActions');
    const dropped = await pruneRedundantPendingUploadActions({ farmerId: 'farmer-1' });

    expect(dropped).toBe(1);
    expect(deletePendingSyncAction).toHaveBeenCalledWith(1);
  });

  it('drops audit_sync rows already marked synced on device', async () => {
    loadPendingSyncActions.mockResolvedValueOnce([
      {
        id: 2,
        createdAt: 1,
        hlcTimestamp: '1',
        actionType: 'audit_sync',
        payloadJson: JSON.stringify({
          eventType: 'plot_compliance_declared',
          payload: { plotId: 'plot-1', farmerId: 'farmer-1' },
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
      },
    ]);
    isDeclarationAuditSynced.mockResolvedValueOnce(true);

    const { pruneRedundantPendingUploadActions } = await import('./pruneRedundantPendingUploadActions');
    const dropped = await pruneRedundantPendingUploadActions({ farmerId: 'farmer-1' });

    expect(dropped).toBe(1);
    expect(deletePendingSyncAction).toHaveBeenCalledWith(2);
  });
});
