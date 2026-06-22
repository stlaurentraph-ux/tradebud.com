import { describe, expect, it } from 'vitest';

import {
  findDeliveryReceiptById,
  resolveDeliveryReceiptById,
} from '@/features/harvest/resolveDeliveryReceiptById';
import type { DeliveryReceiptCatalog } from '@/features/harvest/buildDeliveryReceiptCatalog';
import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';

const t = (key: string) => key;

describe('resolveDeliveryReceiptById', () => {
  const mergedPlots = [{ id: 'server-1', name: 'Plot 1', area_ha: 1 }];

  it('returns deduped catalog row by id', () => {
    const receipts: DeliveryReceiptRecord[] = [
      {
        id: 'voucher-1',
        plotId: 'server-1',
        plotName: 'Plot 1',
        kg: 120,
        createdAt: '2026-06-16T12:00:00.000Z',
        qrCodeRef: 'QR-1',
        buyerLabel: 'buyer@coop.org',
      },
    ];
    const catalog: DeliveryReceiptCatalog = {
      receipts,
      backendPlots: [],
      plotServerLinks: {},
      vouchers: [],
    };
    expect(resolveDeliveryReceiptById(catalog, 'voucher-1', [], { mergedPlots, t })).toEqual(
      receipts[0],
    );
  });

  it('falls back to on-device receipt when dedupe kept a different id', () => {
    const deviceReceipts: DeliveryReceiptRecord[] = [
      {
        id: 'harvest-local-1-1000',
        plotId: 'server-1',
        plotName: 'Plot 1',
        kg: 120,
        createdAt: '2026-06-16T12:00:00.000Z',
        qrCodeRef: null,
        buyerLabel: 'pending',
        pendingSync: true,
      },
    ];
    const catalog: DeliveryReceiptCatalog = {
      receipts: [
        {
          id: 'voucher-1',
          plotId: 'server-1',
          plotName: 'Plot 1',
          kg: 120,
          createdAt: '2026-06-16T12:00:00.000Z',
          qrCodeRef: 'QR-1',
          buyerLabel: 'buyer@coop.org',
        },
      ],
      backendPlots: [],
      plotServerLinks: {},
      vouchers: [
        {
          id: 'voucher-1',
          plot_id: 'server-1',
          kg: 120,
          created_at: '2026-06-16T12:00:00.000Z',
        },
      ],
    };

    expect(findDeliveryReceiptById(catalog.receipts, 'harvest-local-1-1000')).toBeNull();
    expect(
      resolveDeliveryReceiptById(catalog, 'harvest-local-1-1000', deviceReceipts, {
        mergedPlots,
        t,
      }),
    ).toEqual(deviceReceipts[0]);
  });

  it('rebuilds a voucher row when catalog fetch omitted vouchers but voucher payload remains', () => {
    const catalog: DeliveryReceiptCatalog = {
      receipts: [],
      backendPlots: [],
      plotServerLinks: {},
      vouchers: [
        {
          id: 'voucher-9',
          plot_id: 'server-1',
          kg: 80,
          created_at: '2026-06-16T12:05:00.000Z',
          qr_code_ref: 'QR-9',
        },
      ],
    };

    const resolved = resolveDeliveryReceiptById(catalog, 'voucher-9', [], { mergedPlots, t });
    expect(resolved?.id).toBe('voucher-9');
    expect(resolved?.kg).toBe(80);
    expect(resolved?.qrCodeRef).toBe('QR-9');
  });
});
