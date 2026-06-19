import { describe, expect, it } from 'vitest';

import {
  dedupeDeliveryReceipts,
  findPlotReceiptGroupForScreen,
  normalizeLocalDeliveryReceipts,
  receiptMatchesPlotFilter,
  resolvePlotReceiptFilterIds,
} from './localDeliveryReceipts';

const t = (key: string) => key;

describe('resolvePlotReceiptFilterIds', () => {
  it('includes local, server, and linked ids', () => {
    expect(
      resolvePlotReceiptFilterIds({
        localPlotId: 'local-1',
        serverPlotId: 'server-1',
        plotServerLinks: { 'local-1': 'server-1' },
      }),
    ).toEqual(['local-1', 'server-1']);
  });
});

describe('receiptMatchesPlotFilter', () => {
  it('matches when receipt plot id is in the filter set', () => {
    const filter = new Set(['local-1', 'server-1']);
    expect(receiptMatchesPlotFilter({ plotId: 'server-1' }, filter)).toBe(true);
    expect(receiptMatchesPlotFilter({ plotId: 'other' }, filter)).toBe(false);
  });
});

describe('normalizeLocalDeliveryReceipts', () => {
  it('maps stored rows to delivery receipt records', () => {
    const rows = normalizeLocalDeliveryReceipts(
      [
        {
          id: 'harvest-local-1-100',
          farmerId: 'farmer-1',
          localPlotId: 'local-1',
          serverPlotId: 'server-1',
          plotName: 'North field',
          kg: 120,
          recordedAt: Date.parse('2026-06-16T12:00:00.000Z'),
          qrCodeRef: null,
          pendingSync: true,
          buyerLabel: 'buyer@coop.org',
        },
      ],
      t,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.plotId).toBe('server-1');
    expect(rows[0]?.pendingSync).toBe(true);
  });
});

describe('findPlotReceiptGroupForScreen', () => {
  it('matches group when screen uses local id but receipts use server id', () => {
    const groups = [
      {
        plotId: 'server-1',
        plotName: 'North',
        receiptCount: 1,
        receipts: [
          {
            id: 'r1',
            plotId: 'server-1',
            plotName: 'North',
            kg: 120,
            createdAt: '2026-06-16T12:00:00.000Z',
            qrCodeRef: null,
            buyerLabel: 'buyer',
            pendingSync: true,
          },
        ],
      },
    ];
    const filter = new Set(['local-1', 'server-1']);
    expect(findPlotReceiptGroupForScreen(groups, 'local-1', filter)?.plotId).toBe('server-1');
  });
});

describe('dedupeDeliveryReceipts', () => {
  it('prefers synced receipt over pending duplicate', () => {
    const rows = dedupeDeliveryReceipts([
      {
        id: 'pending-1',
        plotId: 'server-1',
        plotName: 'North',
        kg: 120,
        createdAt: '2026-06-16T12:00:00.000Z',
        qrCodeRef: null,
        buyerLabel: 'buyer',
        pendingSync: true,
      },
      {
        id: 'voucher-1',
        plotId: 'server-1',
        plotName: 'North',
        kg: 120,
        createdAt: '2026-06-16T12:00:00.000Z',
        qrCodeRef: 'QR-123',
        buyerLabel: 'buyer',
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('voucher-1');
    expect(rows[0]?.qrCodeRef).toBe('QR-123');
  });
});
