import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadAllLocalDeliveryReceipts: vi.fn(),
  enqueuePendingSync: vi.fn(),
  updateLocalDeliveryReceipt: vi.fn(),
}));

vi.mock('@/features/harvest/fetchMergedServerVouchers', () => ({
  fetchMergedServerVouchers: vi.fn(),
}));

vi.mock('@/features/harvest/loadFieldScopedDeliveryReceipts', () => ({
  resolveFieldHarvestFarmerIds: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  loadAllLocalDeliveryReceipts: mocks.loadAllLocalDeliveryReceipts,
  enqueuePendingSync: mocks.enqueuePendingSync,
  updateLocalDeliveryReceipt: mocks.updateLocalDeliveryReceipt,
}));

import { reconcileUnuploadedLocalDeliveryReceipts } from './reconcileUnuploadedLocalDeliveryReceipts';

describe('reconcileUnuploadedLocalDeliveryReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueuePendingSync.mockResolvedValue(undefined);
    mocks.updateLocalDeliveryReceipt.mockResolvedValue(undefined);
  });

  it('re-queues local receipts missing on the server', async () => {
    mocks.loadAllLocalDeliveryReceipts.mockResolvedValue([
      {
        id: 'harvest-local-a-1',
        farmerId: 'farmer-1',
        localPlotId: 'local-a',
        serverPlotId: 'server-a',
        kg: 80,
        recordedAt: 1,
        qrCodeRef: 'V-OLD',
        pendingSync: false,
        buyerLabel: 'Buyer',
        plotName: 'Plot A',
      },
    ]);

    const result = await reconcileUnuploadedLocalDeliveryReceipts({
      farmerId: 'farmer-1',
      localPlots: [
        {
          id: 'local-a',
          farmerId: 'farmer-1',
          name: 'Plot A',
          createdAt: 1,
          areaSquareMeters: 10_000,
          areaHectares: 1,
          kind: 'polygon',
          points: [{ latitude: -1, longitude: 30 }],
        },
      ],
      backendPlots: [{ id: 'server-a', client_plot_id: 'local-a' }],
      plotServerLinks: { 'local-a': 'server-a' },
      vouchers: [
        {
          id: 'voucher-1',
          plot_id: 'server-a',
          kg: 100,
          created_at: '2026-06-22T04:26:34.000Z',
          qr_code_ref: 'V-ONE',
        },
      ],
    });

    expect(result.requeuedCount).toBe(1);
    expect(mocks.enqueuePendingSync).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'harvest',
      }),
    );
    expect(mocks.updateLocalDeliveryReceipt).toHaveBeenCalledWith('harvest-local-a-1', {
      pendingSync: true,
    });
  });
});
