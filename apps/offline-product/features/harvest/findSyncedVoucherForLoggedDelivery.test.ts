import { describe, expect, it } from 'vitest';

import { findSyncedVoucherForLoggedDelivery } from './findSyncedVoucherForLoggedDelivery';

describe('findSyncedVoucherForLoggedDelivery', () => {
  const localPlots = [
    {
      id: 'local-1',
      name: 'North',
      farmerId: 'f1',
      kind: 'polygon' as const,
      areaHectares: 1,
      areaSquareMeters: 10_000,
      points: [{ latitude: 14.1, longitude: -87.2 }],
      createdAt: 1,
    },
  ];

  it('matches by server plot id after sync', () => {
    const recordedAt = Date.parse('2026-06-16T12:00:00.000Z');
    const qr = findSyncedVoucherForLoggedDelivery({
      delivery: { plotId: 'local-1', kg: 120, recordedAt },
      vouchers: [
        {
          id: 'v1',
          plot_id: 'server-9',
          kg: 120,
          created_at: '2026-06-16T12:01:00.000Z',
          qr_code_ref: 'V-ABC',
        },
      ],
      localPlots,
      backendPlots: [{ id: 'server-9', name: 'North' }],
      plotServerLinks: { 'local-1': 'server-9' },
    });
    expect(qr).toBe('V-ABC');
  });

  it('returns null when kg does not match', () => {
    const recordedAt = Date.now();
    const qr = findSyncedVoucherForLoggedDelivery({
      delivery: { plotId: 'local-1', kg: 120, recordedAt },
      vouchers: [{ id: 'v1', plot_id: 'local-1', kg: 80, created_at: new Date(recordedAt).toISOString() }],
      localPlots,
      backendPlots: [],
      plotServerLinks: {},
    });
    expect(qr).toBeNull();
  });
});
