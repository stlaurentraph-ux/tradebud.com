import type {
  DeliveryReceiptRecord,
  PlotReceiptGroup,
} from '@/features/harvest/deliveryReceiptModels';
import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import type { TranslateFn } from '@/features/i18n/translate';
import { formatDeliveryRecipientLabel } from '@/features/harvest/formatDeliveryRecipientLabel';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';

export type LocalDeliveryReceipt = {
  id: string;
  farmerId: string;
  localPlotId: string;
  serverPlotId: string | null;
  kg: number;
  recordedAt: number;
  qrCodeRef: string | null;
  pendingSync: boolean;
  buyerLabel: string;
  plotName: string;
};

export function buyerLabelForDeliveryRecipient(
  recipient: DeliveryRecipientSelection | null | undefined,
  t: TranslateFn,
): string {
  return formatDeliveryRecipientLabel(recipient, t);
}

export function resolvePlotReceiptFilterIds(params: {
  localPlotId?: string | null;
  serverPlotId?: string | null;
  plotServerLinks?: PlotServerLinks | null;
}): string[] {
  const ids = new Set<string>();
  if (params.localPlotId) ids.add(String(params.localPlotId));
  if (params.serverPlotId) ids.add(String(params.serverPlotId));
  const linked = params.localPlotId ? params.plotServerLinks?.[params.localPlotId] : null;
  if (linked?.trim()) ids.add(linked.trim());
  return [...ids];
}

export function receiptMatchesPlotFilter(
  receipt: Pick<DeliveryReceiptRecord, 'plotId'>,
  filterIds: ReadonlySet<string>,
): boolean {
  if (filterIds.size === 0) return true;
  return filterIds.has(String(receipt.plotId));
}

/** Resolve a plot receipt group when screen plot id is local but receipts use server id (or vice versa). */
export function findPlotReceiptGroupForScreen(
  filteredGroups: readonly PlotReceiptGroup[],
  plotId: string,
  plotFilterIds: ReadonlySet<string>,
): PlotReceiptGroup | null {
  const exact = filteredGroups.find((group) => String(group.plotId) === String(plotId));
  if (exact) return exact;
  if (plotFilterIds.size === 0) return filteredGroups[0] ?? null;
  return (
    filteredGroups.find((group) =>
      group.receipts.some((receipt) => receiptMatchesPlotFilter(receipt, plotFilterIds)),
    ) ?? null
  );
}

export function normalizeLocalDeliveryReceipts(
  rows: readonly LocalDeliveryReceipt[],
  t: TranslateFn,
): DeliveryReceiptRecord[] {
  return rows
    .map((row) => {
      const kg = Number(row.kg);
      if (!Number.isFinite(kg) || kg <= 0) return null;
      return {
        id: row.id,
        plotId: row.serverPlotId ?? row.localPlotId,
        plotName: row.plotName?.trim() || t('plot_fallback'),
        kg,
        createdAt: new Date(row.recordedAt).toISOString(),
        qrCodeRef: row.qrCodeRef,
        buyerLabel: row.buyerLabel?.trim() || t('harvest_receipt_pending_sync'),
        pendingSync: row.pendingSync,
      } satisfies DeliveryReceiptRecord;
    })
    .filter((row) => row != null)
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
}

export function mergeDeliveryReceiptLists(
  ...lists: readonly DeliveryReceiptRecord[][]
): DeliveryReceiptRecord[] {
  const seen = new Set<string>();
  const merged: DeliveryReceiptRecord[] = [];
  for (const list of lists) {
    for (const row of list) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
  }
  return merged.sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
}

function receiptDedupeKey(row: DeliveryReceiptRecord): string {
  const minute = row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 16) : row.id;
  return `${row.plotId}:${Math.round(row.kg)}:${minute}`;
}

export function dedupeDeliveryReceipts(rows: readonly DeliveryReceiptRecord[]): DeliveryReceiptRecord[] {
  const seen = new Map<string, DeliveryReceiptRecord>();
  for (const row of rows) {
    const key = receiptDedupeKey(row);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
      continue;
    }
    const existingScore = (existing.pendingSync ? 0 : 2) + (existing.qrCodeRef ? 1 : 0);
    const nextScore = (row.pendingSync ? 0 : 2) + (row.qrCodeRef ? 1 : 0);
    if (nextScore > existingScore) {
      seen.set(key, row);
    }
  }
  return [...seen.values()].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
}
