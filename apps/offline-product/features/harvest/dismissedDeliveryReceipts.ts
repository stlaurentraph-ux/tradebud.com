import { getSetting, setSetting } from '@/features/state/persistence';

const DISMISSED_DELIVERY_RECEIPT_IDS_KEY = 'dismissedDeliveryReceiptIds';

export async function loadDismissedDeliveryReceiptIds(): Promise<Set<string>> {
  const raw = await getSetting(DISMISSED_DELIVERY_RECEIPT_IDS_KEY);
  if (!raw?.trim()) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => String(id).trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function dismissDeliveryReceiptIds(ids: Iterable<string>): Promise<void> {
  const next = await loadDismissedDeliveryReceiptIds();
  for (const id of ids) {
    const trimmed = String(id).trim();
    if (trimmed) next.add(trimmed);
  }
  await setSetting(DISMISSED_DELIVERY_RECEIPT_IDS_KEY, JSON.stringify([...next]));
}

export function filterDismissedDeliveryReceipts<T extends { id: string }>(
  receipts: readonly T[],
  dismissedIds: ReadonlySet<string>,
): T[] {
  if (dismissedIds.size === 0) return [...receipts];
  return receipts.filter((row) => !dismissedIds.has(String(row.id).trim()));
}
