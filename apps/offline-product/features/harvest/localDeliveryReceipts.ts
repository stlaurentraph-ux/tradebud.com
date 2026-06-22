import type {
  DeliveryReceiptRecord,
  PlotReceiptGroup,
} from '@/features/harvest/deliveryReceiptModels';
import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import type { TranslateFn } from '@/features/i18n/translate';
import { formatDeliveryRecipientLabel } from '@/features/harvest/formatDeliveryRecipientLabel';
import {
  backendRowMatchesLocalClientId,
  findBackendPlotForLocal,
  plotClientIdsShareCreationSuffix,
  type BackendPlotRow,
  type LocalPlotForBackendMatch,
} from '@/features/plots/backendPlotMatch';
import { resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';

function plotForBackendMatch(plot: { id: string }): LocalPlotForBackendMatch {
  return { id: plot.id, areaHectares: 0, kind: 'polygon' };
}

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

function resolveServerPlotIdForReceiptPlot(
  plot: { id: string },
  backendPlots: readonly unknown[],
  plotServerLinks: PlotServerLinks,
): string | null {
  const backend = findBackendPlotForLocal(plotForBackendMatch(plot), [...backendPlots]) as
    | { id?: unknown }
    | null;
  return (
    resolveServerPlotIdForLocal(plotForBackendMatch(plot), [...backendPlots], plotServerLinks) ??
    (backend?.id != null ? String(backend.id) : null)
  );
}

/** All plot/server/client ids that should count toward one on-device plot. */
export function buildPlotReceiptMatchIds(params: {
  plot: { id: string };
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): Set<string> {
  const ids = new Set<string>();
  const localPlotId = String(params.plot.id).trim();
  if (!localPlotId) return ids;

  ids.add(localPlotId);
  const serverPlotId = resolveServerPlotIdForReceiptPlot(
    params.plot,
    params.backendPlots,
    params.plotServerLinks,
  );
  for (const id of resolvePlotReceiptFilterIds({
    localPlotId,
    serverPlotId,
    plotServerLinks: params.plotServerLinks,
  })) {
    ids.add(id);
  }

  for (const row of params.backendPlots) {
    const backend = row as BackendPlotRow;
    if (!backendRowMatchesLocalClientId(backend, localPlotId)) continue;
    const serverId = String(backend.id ?? '').trim();
    if (serverId) ids.add(serverId);
    const clientPlotId = String(backend.client_plot_id ?? backend.clientPlotId ?? '').trim();
    if (clientPlotId) ids.add(clientPlotId);
  }

  return ids;
}

export function receiptBelongsToLocalPlot(
  receipt: Pick<DeliveryReceiptRecord, 'plotId'>,
  plot: { id: string },
  params: {
    backendPlots: readonly unknown[];
    plotServerLinks: PlotServerLinks;
    canonicalPlotIds?: Map<string, string>;
  },
): boolean {
  const localPlotId = String(plot.id).trim();
  const receiptPlotId = String(receipt.plotId).trim();
  if (!localPlotId || !receiptPlotId) return false;

  const matchIds = buildPlotReceiptMatchIds({
    plot,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });
  if (matchIds.has(receiptPlotId)) return true;

  for (const candidate of matchIds) {
    if (plotClientIdsShareCreationSuffix(candidate, receiptPlotId)) return true;
  }
  if (plotClientIdsShareCreationSuffix(localPlotId, receiptPlotId)) return true;

  const canonicalPlotIds =
    params.canonicalPlotIds ??
    buildPlotIdCanonicalMap(params.plotServerLinks, [localPlotId, receiptPlotId, ...matchIds]);
  return (
    canonicalPlotId(receiptPlotId, canonicalPlotIds) ===
    canonicalPlotId(localPlotId, canonicalPlotIds)
  );
}

/** All local/server plot ids used to match receipts for a farmer's plot list. */
export function buildAllPlotReceiptFilterIds(params: {
  plots: ReadonlyArray<{ id: string }>;
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): Set<string> {
  const ids = new Set<string>();
  for (const plot of params.plots) {
    const backend = findBackendPlotForLocal(plotForBackendMatch(plot), [...params.backendPlots]) as
      | { id?: unknown }
      | null;
    const serverPlotId =
      resolveServerPlotIdForLocal(
        plotForBackendMatch(plot),
        [...params.backendPlots],
        params.plotServerLinks,
      ) ??
      (backend?.id != null ? String(backend.id) : null);
    for (const id of resolvePlotReceiptFilterIds({
      localPlotId: plot.id,
      serverPlotId,
      plotServerLinks: params.plotServerLinks,
    })) {
      ids.add(id);
    }
  }
  return ids;
}

/** Count merged device + pending + synced receipts per on-device plot id. */
export function countDeliveryReceiptsForPlots(params: {
  plots: ReadonlyArray<{ id: string }>;
  receipts: readonly DeliveryReceiptRecord[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): Record<string, number> {
  const canonicalPlotIds = buildPlotIdCanonicalMap(
    params.plotServerLinks,
    [
      ...params.plots.map((plot) => plot.id),
      ...params.receipts.map((receipt) => receipt.plotId),
    ],
  );
  const counts: Record<string, number> = {};
  for (const plot of params.plots) {
    counts[plot.id] = params.receipts.filter((row) =>
      receiptBelongsToLocalPlot(row, plot, {
        backendPlots: params.backendPlots,
        plotServerLinks: params.plotServerLinks,
        canonicalPlotIds,
      }),
    ).length;
  }
  return counts;
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
        // Attribute device rows to the on-device plot id (server id stays in SQLite for sync).
        plotId: row.localPlotId,
        plotName: row.plotName?.trim() || t('plot_fallback'),
        kg,
        createdAt: new Date(row.recordedAt).toISOString(),
        qrCodeRef: row.qrCodeRef,
        buyerLabel: row.buyerLabel?.trim() || t('harvest_receipt_buyer_unspecified'),
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
  ...lists: readonly (readonly DeliveryReceiptRecord[])[]
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

function receiptDedupeKey(row: DeliveryReceiptRecord, canonicalPlotIds?: Map<string, string>): string {
  const plotId = canonicalPlotIds
    ? canonicalPlotId(row.plotId, canonicalPlotIds)
    : row.plotId.trim();
  const minute = row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 16) : row.id;
  return `${plotId}:${Math.round(row.kg)}:${minute}`;
}

function receiptRowScore(row: DeliveryReceiptRecord): number {
  return (row.pendingSync ? 0 : 2) + (row.qrCodeRef?.trim() ? 1 : 0);
}

const RECEIPT_VOUCHER_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

export function buildPlotIdCanonicalMap(
  plotServerLinks: PlotServerLinks,
  plotIds: Iterable<string> = [],
): Map<string, string> {
  const map = new Map<string, string>();

  const resolveCanonical = (id: string): string => {
    const trimmed = id.trim();
    if (!trimmed) return '';
    const linked = plotServerLinks[trimmed]?.trim();
    if (linked) return linked;
    return trimmed;
  };

  for (const [localId, serverId] of Object.entries(plotServerLinks)) {
    const canonical = resolveCanonical(serverId || localId);
    if (localId.trim()) map.set(localId.trim(), canonical);
    if (serverId?.trim()) map.set(serverId.trim(), canonical);
  }

  for (const plotId of plotIds) {
    const trimmed = String(plotId).trim();
    if (!trimmed) continue;
    if (!map.has(trimmed)) {
      map.set(trimmed, resolveCanonical(trimmed));
    }
  }

  return map;
}

function canonicalPlotId(plotId: string, canonicalPlotIds: Map<string, string>): string {
  const trimmed = plotId.trim();
  return canonicalPlotIds.get(trimmed) ?? trimmed;
}

function findMatchingSyncedReceipt(
  row: DeliveryReceiptRecord,
  synced: readonly DeliveryReceiptRecord[],
  canonicalPlotIds: Map<string, string>,
): DeliveryReceiptRecord | null {
  const plot = canonicalPlotId(row.plotId, canonicalPlotIds);
  const rowMs = row.createdAt ? new Date(row.createdAt).getTime() : null;

  let best: DeliveryReceiptRecord | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const candidate of synced) {
    if (canonicalPlotId(candidate.plotId, canonicalPlotIds) !== plot) continue;
    if (Math.abs(candidate.kg - row.kg) > 0.5) continue;
    if (!candidate.qrCodeRef?.trim()) continue;

    const candidateMs = candidate.createdAt ? new Date(candidate.createdAt).getTime() : null;
    const delta =
      rowMs != null && candidateMs != null
        ? Math.abs(candidateMs - rowMs)
        : Number.POSITIVE_INFINITY;
    if (delta > RECEIPT_VOUCHER_MATCH_WINDOW_MS) continue;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = candidate;
    }
  }

  return best;
}

function enrichDeliveryReceiptsWithSynced(
  rows: readonly DeliveryReceiptRecord[],
  synced: readonly DeliveryReceiptRecord[],
  canonicalPlotIds: Map<string, string>,
): DeliveryReceiptRecord[] {
  return rows.map((row) => {
    if (row.qrCodeRef?.trim()) {
      return row.pendingSync ? { ...row, pendingSync: false } : row;
    }

    const match = findMatchingSyncedReceipt(row, synced, canonicalPlotIds);
    if (!match) return row;

    return {
      ...row,
      qrCodeRef: match.qrCodeRef,
      buyerLabel: match.buyerLabel || row.buyerLabel,
      pendingSync: false,
      plotId: match.plotId || row.plotId,
      plotName: match.plotName || row.plotName,
    };
  });
}

/** Merge device, pending, and server receipts; attach QR from vouchers; collapse duplicates. */
export function enrichAndDedupeDeliveryReceipts(params: {
  deviceReceipts?: readonly DeliveryReceiptRecord[];
  pendingReceipts?: readonly DeliveryReceiptRecord[];
  synced: readonly DeliveryReceiptRecord[];
  plotServerLinks?: PlotServerLinks;
}): DeliveryReceiptRecord[] {
  const merged = mergeDeliveryReceiptLists(
    params.deviceReceipts ?? [],
    params.pendingReceipts ?? [],
    params.synced,
  );
  const canonicalPlotIds = buildPlotIdCanonicalMap(
    params.plotServerLinks ?? {},
    merged.map((row) => row.plotId),
  );
  const enriched = enrichDeliveryReceiptsWithSynced(merged, params.synced, canonicalPlotIds);

  const seen = new Map<string, DeliveryReceiptRecord>();
  for (const row of enriched) {
    const key = receiptDedupeKey(row, canonicalPlotIds);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
      continue;
    }
    const nextScore = receiptRowScore(row);
    const existingScore = receiptRowScore(existing);
    if (nextScore > existingScore) {
      seen.set(key, row);
      continue;
    }
    if (
      nextScore === existingScore &&
      row.id.startsWith('harvest-') &&
      !existing.id.startsWith('harvest-')
    ) {
      seen.set(key, row);
    }
  }

  return [...seen.values()].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
}

export function dedupeDeliveryReceipts(
  rows: readonly DeliveryReceiptRecord[],
  options?: { plotServerLinks?: PlotServerLinks },
): DeliveryReceiptRecord[] {
  const canonicalPlotIds = buildPlotIdCanonicalMap(
    options?.plotServerLinks ?? {},
    rows.map((row) => row.plotId),
  );
  const seen = new Map<string, DeliveryReceiptRecord>();
  for (const row of rows) {
    const key = receiptDedupeKey(row, canonicalPlotIds);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
      continue;
    }
    if (receiptRowScore(row) > receiptRowScore(existing)) {
      seen.set(key, row);
    }
  }
  return [...seen.values()].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
}
