import { describe, expect, it } from 'vitest';

import {
  findServerVoucherForLocalReceipt,
  listLocalReceiptsMissingOnServer,
} from './findServerVoucherForLocalReceipt';

const localPlots = [
  {
    id: 'local-plot-3',
    name: 'Plot 3',
    farmerId: 'farmer-1',
    kind: 'polygon' as const,
    areaHectares: 1,
    areaSquareMeters: 10_000,
    points: [{ latitude: 14.1, longitude: -87.2 }],
    createdAt: 1,
  },
];

describe('findServerVoucherForLocalReceipt', () => {
  it('matches by server voucher id', () => {
    const match = findServerVoucherForLocalReceipt({
      receipt: {
        id: 'voucher-1',
        localPlotId: 'local-plot-3',
        kg: 100,
        recordedAt: Date.parse('2026-06-22T04:26:00.000Z'),
        qrCodeRef: 'V-ONE',
      },
      vouchers: [{ id: 'voucher-1', plot_id: 'server-3', kg: 100, qr_code_ref: 'V-ONE' }],
      localPlots,
      backendPlots: [{ id: 'server-3', client_plot_id: 'local-plot-3' }],
      plotServerLinks: { 'local-plot-3': 'server-3' },
    });
    expect((match as { id?: string }).id).toBe('voucher-1');
  });

  it('lists local receipts that never reached the server', () => {
    const missing = listLocalReceiptsMissingOnServer({
      receipts: [
        {
          id: 'harvest-local-plot-3-1',
          farmerId: 'farmer-1',
          localPlotId: 'local-plot-3',
          serverPlotId: 'server-3',
          kg: 80,
          recordedAt: Date.parse('2026-06-19T10:00:00.000Z'),
          qrCodeRef: 'V-OLD',
          pendingSync: false,
          buyerLabel: 'Buyer',
          plotName: 'Plot 3',
        },
        {
          id: 'harvest-local-plot-3-2',
          farmerId: 'farmer-1',
          localPlotId: 'local-plot-3',
          serverPlotId: 'server-3',
          kg: 100,
          recordedAt: Date.parse('2026-06-22T04:26:00.000Z'),
          qrCodeRef: 'V-ONE',
          pendingSync: false,
          buyerLabel: 'Buyer',
          plotName: 'Plot 3',
        },
      ],
      vouchers: [
        {
          id: 'voucher-1',
          plot_id: 'server-3',
          kg: 100,
          created_at: '2026-06-22T04:26:34.000Z',
          qr_code_ref: 'V-ONE',
        },
      ],
      localPlots,
      backendPlots: [{ id: 'server-3', client_plot_id: 'local-plot-3' }],
      plotServerLinks: { 'local-plot-3': 'server-3' },
    });

    expect(missing).toHaveLength(1);
    expect(missing[0]?.kg).toBe(80);
  });
});
