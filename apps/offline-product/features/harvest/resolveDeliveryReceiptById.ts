import {
  normalizeDeliveryReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';
import type { TranslateFn } from '@/features/i18n/translate';

import type { DeliveryReceiptCatalog } from './buildDeliveryReceiptCatalog';

export function findDeliveryReceiptById(
  receipts: readonly DeliveryReceiptRecord[],
  receiptId: string,
): DeliveryReceiptRecord | null {
  const id = receiptId.trim();
  if (!id) return null;
  return receipts.find((row) => row.id === id) ?? null;
}

function voucherRowId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  return String((voucher as { id?: unknown }).id ?? '').trim();
}

/** Resolve a receipt id even when dedupe dropped a duplicate row or server fetch is partial. */
export function resolveDeliveryReceiptById(
  catalog: DeliveryReceiptCatalog,
  receiptId: string,
  deviceReceipts: DeliveryReceiptRecord[],
  params: { mergedPlots: readonly HarvestPlotOption[]; t: TranslateFn },
): DeliveryReceiptRecord | null {
  const id = receiptId.trim();
  if (!id) return null;

  const direct = findDeliveryReceiptById(catalog.receipts, id);
  if (direct) return direct;

  const local = deviceReceipts.find((row) => row.id === id);
  if (local) return local;

  const voucher = catalog.vouchers.find((row) => voucherRowId(row) === id);
  if (voucher) {
    const [normalized] = normalizeDeliveryReceipts({
      vouchers: [voucher],
      mergedPlots: params.mergedPlots,
      t: params.t,
    });
    return normalized ?? null;
  }

  return null;
}
