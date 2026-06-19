import { describe, expect, it } from 'vitest';

import {
  formatReceiptDateLabel,
  formatVoucherBuyerLabel,
  groupDeliveryReceiptsByPlot,
  normalizeDeliveryReceipts,
  normalizePendingHarvestReceipts,
} from '@/features/harvest/deliveryReceiptModels';

const t = (key: string) => key;

describe('formatVoucherBuyerLabel', () => {
  it('prefers recipient email', () => {
    expect(
      formatVoucherBuyerLabel({ intended_recipient_email: 'buyer@coop.org' }, t),
    ).toBe('buyer@coop.org');
  });

  it('falls back to org name', () => {
    expect(
      formatVoucherBuyerLabel({ intended_recipient_org_name: 'Green Coop' }, t),
    ).toBe('Green Coop');
  });

  it('shows assigned buyer when tenant id is set', () => {
    expect(
      formatVoucherBuyerLabel({ intended_recipient_tenant_id: 'tenant-1' }, t),
    ).toBe('harvest_receipt_buyer_assigned');
  });

  it('shows qr generated when no buyer fields', () => {
    expect(formatVoucherBuyerLabel({}, t)).toBe('harvest_receipt_qr_generated');
  });
});

describe('normalizeDeliveryReceipts', () => {
  it('sorts newest first and resolves plot names', () => {
    const rows = normalizeDeliveryReceipts({
      vouchers: [
        {
          id: 'v1',
          plot_id: 'p1',
          kg: 100,
          created_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'v2',
          plot_id: 'p1',
          kg: 200,
          created_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      mergedPlots: [{ id: 'p1', name: 'North field', area_ha: 2 }],
      t,
    });
    expect(rows.map((row) => row.id)).toEqual(['v2', 'v1']);
    expect(rows[0]?.plotName).toBe('North field');
    expect(rows[0]?.buyerLabel).toBe('harvest_receipt_qr_generated');
  });
});

describe('groupDeliveryReceiptsByPlot', () => {
  it('groups receipts by plot with counts', () => {
    const groups = groupDeliveryReceiptsByPlot([
      {
        id: 'v1',
        plotId: 'p2',
        plotName: 'Beta',
        kg: 50,
        createdAt: null,
        qrCodeRef: null,
        buyerLabel: 'qr',
      },
      {
        id: 'v2',
        plotId: 'p1',
        plotName: 'Alpha',
        kg: 80,
        createdAt: null,
        qrCodeRef: 'QR-1',
        buyerLabel: 'buyer@x.com',
      },
      {
        id: 'v3',
        plotId: 'p1',
        plotName: 'Alpha',
        kg: 20,
        createdAt: null,
        qrCodeRef: 'QR-2',
        buyerLabel: 'qr',
      },
    ]);
    expect(groups.map((g) => g.plotName)).toEqual(['Alpha', 'Beta']);
    expect(groups[0]?.receiptCount).toBe(2);
    expect(groups[1]?.receiptCount).toBe(1);
  });
});

describe('normalizePendingHarvestReceipts', () => {
  it('maps queued harvest actions for the active plot', () => {
    const rows = normalizePendingHarvestReceipts({
      actions: [
        {
          id: 7,
          createdAt: Date.parse('2026-06-16T12:00:00.000Z'),
          payloadJson: JSON.stringify({
            plotId: 'local-plot-1',
            kg: 120,
            intended_recipient_email: 'buyer@coop.org',
          }),
        },
      ],
      plotIds: new Set(['local-plot-1', 'server-plot-1']),
      groupPlotId: 'server-plot-1',
      plotName: 'North field',
      t,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('pending-7');
    expect(rows[0]?.plotId).toBe('server-plot-1');
    expect(rows[0]?.pendingSync).toBe(true);
    expect(rows[0]?.buyerLabel).toBe('buyer@coop.org');
  });
});

describe('formatReceiptDateLabel', () => {
  it('returns dash for invalid dates', () => {
    expect(formatReceiptDateLabel(null)).toBe('—');
    expect(formatReceiptDateLabel('not-a-date')).toBe('—');
  });
});
