/**
 * Device-local sync markers (SQLite settings + row fields).
 *
 * **Outbound** — this device pushed to Tracebud; do not re-upload.
 * **Inbound** — this device linked/hydrated server state; separate from upload pending.
 *
 * Server holds one canonical record per artifact; markers never replicate per device on the server.
 */
import { deleteSettingsByPrefix, getSetting, setSetting } from '@/features/state/persistence';

/** Outbound: declaration audit POST succeeded (or server already had it). */
export const OUTBOUND_DECL_PRODUCER_PREFIX = 'audit_decl_synced:producer:' as const;
export const OUTBOUND_DECL_PLOT_PREFIX = 'audit_decl_synced:plot:' as const;

/** Outbound: farmer-scoped cloud audit POST succeeded (or server already had it). */
export const OUTBOUND_CLOUD_AUDIT_PREFIX = 'audit_cloud_synced:' as const;

/** Inbound: this device pulled or reconciled server state for the scope. */
export const INBOUND_HYDRATED_PREFIX = 'cloud_inbound_hydrated:' as const;

export type InboundHydratedScope =
  | `plot:${string}`
  | `plot_media:${string}`
  | `declaration:producer:${string}`
  | `declaration:plot:${string}`
  | `farmer:${string}`
  | `receipts:${string}`;

function inboundHydratedKey(scope: InboundHydratedScope): string {
  return `${INBOUND_HYDRATED_PREFIX}${scope}`;
}

export function inboundPlotKey(localPlotId: string): InboundHydratedScope {
  return `plot:${localPlotId.trim()}`;
}

export function inboundPlotMediaKey(localPlotId: string): InboundHydratedScope {
  return `plot_media:${localPlotId.trim()}`;
}

export function inboundDeclarationProducerKey(farmerId: string): InboundHydratedScope {
  return `declaration:producer:${farmerId.trim()}`;
}

export function inboundDeclarationPlotKey(plotId: string): InboundHydratedScope {
  return `declaration:plot:${plotId.trim()}`;
}

export function inboundFarmerKey(farmerId: string): InboundHydratedScope {
  return `farmer:${farmerId.trim()}`;
}

export function inboundReceiptsKey(farmerId: string): InboundHydratedScope {
  return `receipts:${farmerId.trim()}`;
}

/** Outbound markers live on media rows as `storagePath`, plots as `plot_server_links`, harvests as `pendingSync`. */
export type DeviceSyncMarkerKind = 'outbound' | 'inbound';

export async function markInboundHydrated(scope: InboundHydratedScope): Promise<void> {
  const id = scope.split(':').slice(1).join(':').trim();
  if (!id) return;
  await setSetting(inboundHydratedKey(scope), String(Date.now())).catch(() => undefined);
}

export async function isInboundHydrated(scope: InboundHydratedScope): Promise<boolean> {
  const marker = await getSetting(inboundHydratedKey(scope)).catch(() => null);
  return Boolean(marker?.trim());
}

export async function clearInboundHydrated(scope: InboundHydratedScope): Promise<void> {
  const { deleteSetting } = await import('@/features/state/persistence');
  await deleteSetting(inboundHydratedKey(scope)).catch(() => undefined);
}

/** Clears all inbound markers (e.g. sign-out). Outbound markers remain scoped to local data wipe. */
export async function clearAllInboundHydratedMarkers(): Promise<void> {
  await deleteSettingsByPrefix(INBOUND_HYDRATED_PREFIX).catch(() => undefined);
}

export type DeviceSyncAttention = {
  needsInboundRestore: boolean;
  needsOutboundUpload: boolean;
};

/** Split parity + queue signals for Backup UI (download vs upload). */
export function classifyDeviceSyncAttention(params: {
  needsRestore: boolean;
  queueMediaPendingCount: number;
  queuePendingCount?: number;
  unsyncedPlotCount?: number;
}): DeviceSyncAttention {
  const outboundFromQueue =
    (params.queueMediaPendingCount ?? 0) +
    Math.max(0, (params.queuePendingCount ?? 0) - (params.queueMediaPendingCount ?? 0));
  const needsOutboundUpload =
    (params.queueMediaPendingCount ?? 0) > 0 ||
    (params.unsyncedPlotCount ?? 0) > 0 ||
    outboundFromQueue > 0;
  return {
    needsInboundRestore: params.needsRestore,
    needsOutboundUpload,
  };
}
