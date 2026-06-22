import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';

const cache = new Map<string, DeliveryReceiptRecord>();
const MAX_ENTRIES = 48;

export function cacheReceiptForNavigation(receipt: DeliveryReceiptRecord): void {
  cache.set(receipt.id, receipt);
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = cache.keys().next().value;
  if (oldest) cache.delete(oldest);
}

export function getCachedReceipt(receiptId: string): DeliveryReceiptRecord | null {
  const id = receiptId.trim();
  if (!id) return null;
  return cache.get(id) ?? null;
}

export function updateCachedReceipt(receipt: DeliveryReceiptRecord): void {
  cache.set(receipt.id, receipt);
}
