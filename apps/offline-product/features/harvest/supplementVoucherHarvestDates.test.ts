import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/api/syncAuthSession', () => ({
  getAuthenticatedSupabaseClient: vi.fn(async () => null),
}));

import { enrichVouchersWithLocalDeliveryDates } from './supplementVoucherHarvestDates';

describe('enrichVouchersWithLocalDeliveryDates', () => {
  it('adds harvest_date from a matching on-device receipt row', () => {
    const recordedAt = Date.parse('2026-06-19T10:00:00.000Z');
    const enriched = enrichVouchersWithLocalDeliveryDates({
      vouchers: [
        {
          id: 'voucher-1',
          plot_id: 'server-a',
          kg: 80,
          created_at: '2026-06-22T13:05:09.000Z',
          qr_code_ref: 'V-U1B5HLWE',
        },
      ],
      localRows: [
        {
          id: 'harvest-local-a-1',
          farmerId: 'farmer-1',
          localPlotId: 'local-a',
          serverPlotId: 'server-a',
          kg: 80,
          recordedAt,
          qrCodeRef: 'V-U1B5HLWE',
          pendingSync: false,
          buyerLabel: 'Buyer',
          plotName: 'Plot 3',
        },
      ],
      localPlots: [
        {
          id: 'local-a',
          farmerId: 'farmer-1',
          name: 'Plot 3',
          createdAt: 1,
          areaSquareMeters: 10_000,
          areaHectares: 1,
          kind: 'polygon',
          points: [{ latitude: -1, longitude: 30 }],
        },
      ],
      backendPlots: [{ id: 'server-a', client_plot_id: 'local-a' }],
      plotServerLinks: { 'local-a': 'server-a' },
    });

    expect((enriched[0] as { harvest_date?: string }).harvest_date).toBe('2026-06-19');
  });
});
