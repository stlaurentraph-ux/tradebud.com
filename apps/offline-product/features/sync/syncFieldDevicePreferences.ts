import type { OfflineTilesPackMeta } from '@/features/offlineTiles/offlineTiles';
import type { FarmerProfile } from '@/features/state/AppStateContext';
import {
  getSetting,
  loadAppState,
  persistFarmer,
  setSetting,
} from '@/features/state/persistence';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  FIELD_DEVICE_PREFERENCES_AUDIT,
} from '@/features/sync/farmerArtifactRegistry';
import { queueFieldCloudAuditSync } from '@/features/sync/queueFieldCloudAuditSync';
import { listOfflineTilePacks } from '@/features/offlineTiles/offlineTiles';

export type FieldDevicePreferencesPayload = {
  farmerId: string;
  declarationLatitude?: number | null;
  declarationLongitude?: number | null;
  declarationGeoCapturedAt?: number | null;
  postalAddress?: string | null;
  commodityCode?: string | null;
  offlineTilesEnabled?: boolean;
  offlineTilesActivePackId?: string | null;
  offlineTilePacks?: OfflineTilesPackMeta[];
  updatedAt: number;
};

export type RestoreFieldDevicePreferencesResult = {
  restored: boolean;
  fetchFailed: boolean;
  offlinePacksQueued: number;
};

function parseNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  return undefined;
}

export async function buildFieldDevicePreferencesPayload(
  farmer: FarmerProfile,
): Promise<FieldDevicePreferencesPayload> {
  const [offlineTilesEnabledRaw, offlineTilesActivePackId, offlineTilePacks] = await Promise.all([
    getSetting('offlineTilesEnabled').catch(() => null),
    getSetting('offlineTilesActivePackId').catch(() => null),
    listOfflineTilePacks().catch(() => [] as OfflineTilesPackMeta[]),
  ]);

  return {
    farmerId: farmer.id,
    declarationLatitude: farmer.declarationLatitude ?? null,
    declarationLongitude: farmer.declarationLongitude ?? null,
    declarationGeoCapturedAt: farmer.declarationGeoCapturedAt ?? null,
    postalAddress: farmer.postalAddress ?? null,
    commodityCode: farmer.commodityCode ?? null,
    offlineTilesEnabled: offlineTilesEnabledRaw === '1',
    offlineTilesActivePackId:
      offlineTilesActivePackId && offlineTilesActivePackId.trim()
        ? offlineTilesActivePackId.trim()
        : null,
    offlineTilePacks: offlineTilePacks.map((pack) => ({
      id: pack.id,
      label: pack.label,
      source: pack.source,
      bbox: pack.bbox,
      zooms: pack.zooms,
      createdAt: pack.createdAt,
      downloadedAt: pack.downloadedAt,
      tileCount: pack.tileCount,
    })),
    updatedAt: Date.now(),
  };
}

export async function queueFieldDevicePreferencesSync(
  farmer: FarmerProfile,
  options?: { deferPost?: boolean; skipIfSynced?: boolean },
): Promise<'synced' | 'queued' | 'skipped'> {
  if (!farmer.id?.trim()) return 'skipped';
  const payload = await buildFieldDevicePreferencesPayload(farmer);
  return queueFieldCloudAuditSync({
    eventType: FIELD_DEVICE_PREFERENCES_AUDIT,
    scopeId: farmer.id,
    payload: payload as unknown as Record<string, unknown>,
    deferPost: options?.deferPost,
    skipIfSynced: options?.skipIfSynced,
  });
}

function farmerNeedsPreferenceMerge(
  local: FarmerProfile,
  remote: FieldDevicePreferencesPayload,
): boolean {
  if (
    remote.declarationLatitude != null &&
    local.declarationLatitude == null &&
    remote.declarationLongitude != null
  ) {
    return true;
  }
  if (remote.postalAddress && !local.postalAddress?.trim()) return true;
  if (remote.commodityCode && !local.commodityCode?.trim()) return true;
  return false;
}

/** Pull declaration GPS, postal/commodity, and offline tile prefs from audit_log. */
export async function restoreLocalFieldDevicePreferencesFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer?: FarmerProfile;
}): Promise<RestoreFieldDevicePreferencesResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { restored: false, fetchFailed: false, offlinePacksQueued: 0 };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer(
      [apiFarmerId, ...params.ownedFarmerIds],
      200,
      [FIELD_DEVICE_PREFERENCES_AUDIT],
    );
  } catch {
    return { restored: false, fetchFailed: true, offlinePacksQueued: 0 };
  }

  const latest = auditRows.find((row) => row.event_type === FIELD_DEVICE_PREFERENCES_AUDIT);
  if (!latest?.payload) {
    return { restored: false, fetchFailed: false, offlinePacksQueued: 0 };
  }

  const payload = latest.payload as FieldDevicePreferencesPayload;
  const diskState = await loadAppState().catch(() => ({ farmer: undefined, plots: [] }));
  const localFarmer =
    diskState.farmer?.id === apiFarmerId ? diskState.farmer : params.localFarmer;
  if (!localFarmer?.id) {
    return { restored: false, fetchFailed: false, offlinePacksQueued: 0 };
  }

  let restored = false;
  const nextFarmer: FarmerProfile = { ...localFarmer };

  const remoteLat = parseNumber(payload.declarationLatitude);
  const remoteLng = parseNumber(payload.declarationLongitude);
  if (
    remoteLat != null &&
    remoteLng != null &&
    (localFarmer.declarationLatitude == null || localFarmer.declarationLongitude == null)
  ) {
    nextFarmer.declarationLatitude = remoteLat;
    nextFarmer.declarationLongitude = remoteLng;
    nextFarmer.declarationGeoCapturedAt =
      parseNumber(payload.declarationGeoCapturedAt) ?? Date.now();
    restored = true;
  }

  if (payload.postalAddress?.trim() && !localFarmer.postalAddress?.trim()) {
    nextFarmer.postalAddress = payload.postalAddress.trim();
    restored = true;
  }
  if (payload.commodityCode?.trim() && !localFarmer.commodityCode?.trim()) {
    nextFarmer.commodityCode = payload.commodityCode.trim();
    restored = true;
  }

  if (restored || farmerNeedsPreferenceMerge(localFarmer, payload)) {
    await persistFarmer(nextFarmer);
  }

  if (payload.offlineTilesEnabled === true) {
    await setSetting('offlineTilesEnabled', '1').catch(() => undefined);
    restored = true;
  }
  if (payload.offlineTilesActivePackId?.trim()) {
    await setSetting('offlineTilesActivePackId', payload.offlineTilesActivePackId.trim()).catch(
      () => undefined,
    );
    restored = true;
  }

  let offlinePacksQueued = 0;
  const packs = Array.isArray(payload.offlineTilePacks) ? payload.offlineTilePacks : [];
  if (packs.length > 0) {
    const { restoreMissingOfflineTilePacksFromServer } = await import(
      '@/features/sync/restoreMissingOfflineTilePacksFromServer'
    );
    const packRestore = await restoreMissingOfflineTilePacksFromServer({ packs });
    offlinePacksQueued = packRestore.queuedDownloads;
    if (packRestore.queuedDownloads > 0) restored = true;
  }

  return { restored, fetchFailed: false, offlinePacksQueued };
}
