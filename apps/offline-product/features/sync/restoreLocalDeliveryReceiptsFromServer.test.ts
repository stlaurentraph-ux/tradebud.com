import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plot } from '@/features/state/AppStateContext';

const mocks = vi.hoisted(() => ({
  fetchMergedServerVouchers: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  loadAllLocalDeliveryReceipts: vi.fn(),
  persistLocalDeliveryReceipt: vi.fn(),
}));

vi.mock('@/features/harvest/loadFieldScopedDeliveryReceipts', () => ({
  resolveFieldHarvestFarmerIds: vi.fn(async () => ({
    apiFarmerId: 'farmer-1',
    ownedFarmerIds: ['farmer-1'],
    voucherFarmerIds: ['farmer-1'],
  })),
}));

vi.mock('@/features/harvest/fetchMergedServerVouchers', () => ({
  fetchMergedServerVouchers: mocks.fetchMergedServerVouchers,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  loadAllLocalDeliveryReceipts: mocks.loadAllLocalDeliveryReceipts,
  persistLocalDeliveryReceipt: mocks.persistLocalDeliveryReceipt,
  updateLocalDeliveryReceipt: vi.fn(async () => undefined),
  isLocalDeliveryReceiptPendingUpload: (receipt: {
    pendingSync: boolean;
    qrCodeRef?: string | null;
  }) => receipt.pendingSync && !receipt.qrCodeRef?.trim(),
}));

import { restoreLocalDeliveryReceiptsFromServer } from './restoreLocalDeliveryReceiptsFromServer';

const {
  fetchMergedServerVouchers,
  fetchBackendPlotsForSyncScope,
  loadPlotServerLinks,
  loadAllLocalDeliveryReceipts,
  persistLocalDeliveryReceipt,
} = mocks;

const localPlots: Plot[] = [
  {
    id: 'local-a',
    farmerId: 'farmer-1',
    name: 'Block A',
    createdAt: 1,
    areaSquareMeters: 10_000,
    areaHectares: 1,
    kind: 'polygon',
    points: [{ latitude: -1, longitude: 30 }],
  },
];

describe('restoreLocalDeliveryReceiptsFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadPlotServerLinks.mockResolvedValue({ 'local-a': 'server-a' });
    loadAllLocalDeliveryReceipts.mockResolvedValue([]);
    fetchBackendPlotsForSyncScope.mockResolvedValue([
      { id: 'server-a', client_plot_id: 'local-a', name: 'Block A' },
    ]);
    persistLocalDeliveryReceipt.mockResolvedValue(undefined);
  });

  it('persists server vouchers as local delivery receipts', async () => {
    fetchMergedServerVouchers.mockResolvedValue([
      {
        id: 'voucher-1',
        plot_id: 'server-a',
        kg: 120,
        created_at: '2026-06-16T12:00:00.000Z',
        qr_code_ref: 'V-ABC123',
        intended_recipient_email: 'buyer@coop.org',
      },
    ]);

    const result = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
    });

    expect(result.restoredCount).toBe(1);
    expect(persistLocalDeliveryReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'voucher-1',
        localPlotId: 'local-a',
        serverPlotId: 'server-a',
        kg: 120,
        pendingSync: false,
        qrCodeRef: 'V-ABC123',
      }),
    );
  });

  it('persists unlinked vouchers using server plot id for cross-device display', async () => {
    fetchMergedServerVouchers.mockResolvedValue([
      {
        id: 'voucher-2',
        plot_id: 'unknown-server',
        kg: 50,
        created_at: '2026-06-16T12:00:00.000Z',
      },
    ]);

    const result = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
    });

    expect(result.restoredCount).toBe(1);
    expect(result.skippedUnlinked).toBe(1);
    expect(persistLocalDeliveryReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'voucher-2',
        localPlotId: 'unknown-server',
        serverPlotId: 'unknown-server',
      }),
    );
  });

  it('restores multiple deliveries on the same plot with the same weight', async () => {
    fetchMergedServerVouchers.mockResolvedValue([
      {
        id: 'voucher-a',
        plot_id: 'server-a',
        kg: 100,
        created_at: '2026-06-22T10:00:00.000Z',
        qr_code_ref: 'V-A',
      },
      {
        id: 'voucher-b',
        plot_id: 'server-a',
        kg: 100,
        created_at: '2026-06-22T10:05:00.000Z',
        qr_code_ref: 'V-B',
      },
      {
        id: 'voucher-c',
        plot_id: 'server-a',
        kg: 100,
        created_at: '2026-06-22T10:10:00.000Z',
        qr_code_ref: 'V-C',
      },
    ]);

    const result = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
    });

    expect(result.restoredCount).toBe(3);
    expect(persistLocalDeliveryReceipt).toHaveBeenCalledTimes(3);
  });

  it('skips the server fetch when vouchers are already loaded', async () => {
    const result = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
      vouchers: [
        {
          id: 'voucher-prefetched',
          plot_id: 'server-a',
          kg: 80,
          created_at: '2026-06-22T11:00:00.000Z',
        },
      ],
    });

    expect(fetchMergedServerVouchers).not.toHaveBeenCalled();
    expect(result.restoredCount).toBe(1);
  });
});
