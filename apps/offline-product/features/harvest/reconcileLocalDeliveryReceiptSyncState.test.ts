import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateLocalDeliveryReceipt = vi.fn(async () => undefined);
const loadAllLocalDeliveryReceipts = vi.fn(async () => []);

vi.mock('@/features/state/persistence', () => ({
  loadAllLocalDeliveryReceipts,
  updateLocalDeliveryReceipt,
  isLocalDeliveryReceiptPendingUpload: (receipt: {
    pendingSync: boolean;
    qrCodeRef?: string | null;
  }) => receipt.pendingSync && !receipt.qrCodeRef?.trim(),
}));

vi.mock('@/features/harvest/findServerVoucherForLocalReceipt', () => ({
  findServerVoucherForLocalReceipt: vi.fn(({ receipt }: { receipt: { id: string } }) =>
    receipt.id === 'local-harvest-1' ? { id: 'local-harvest-1', qrCodeRef: 'QR-123' } : null,
  ),
}));

vi.mock('@/features/harvest/voucherRowFields', () => ({
  voucherQrRef: (voucher: { qrCodeRef?: string }) => voucher.qrCodeRef ?? null,
  voucherPlotId: () => 'server-plot-1',
}));

describe('reconcileLocalDeliveryReceiptSyncStateFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears pendingSync when a matching server voucher exists', async () => {
    loadAllLocalDeliveryReceipts.mockResolvedValueOnce([
      {
        id: 'local-harvest-1',
        farmerId: 'farmer-1',
        localPlotId: 'plot-1',
        serverPlotId: null,
        plotName: 'Plot 1',
        kg: 120,
        recordedAt: 1,
        qrCodeRef: null,
        pendingSync: true,
        buyerLabel: 'Buyer',
      },
    ]);

    const { reconcileLocalDeliveryReceiptSyncStateFromServer } = await import(
      './reconcileLocalDeliveryReceiptSyncState'
    );
    const result = await reconcileLocalDeliveryReceiptSyncStateFromServer({
      vouchers: [{ id: 'local-harvest-1', qrCodeRef: 'QR-123' }],
      localPlots: [],
      backendPlots: [],
      plotServerLinks: {},
    });

    expect(result.reconciledCount).toBe(1);
    expect(updateLocalDeliveryReceipt).toHaveBeenCalledWith('local-harvest-1', {
      pendingSync: false,
      qrCodeRef: 'QR-123',
      serverPlotId: 'server-plot-1',
    });
  });
});
