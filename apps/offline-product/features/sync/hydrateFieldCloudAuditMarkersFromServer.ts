import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  FARMER_PROFILE_PHOTO_AUDIT,
  FIELD_CLOUD_AUDIT_EVENT_TYPES,
  FIELD_DEVICE_PREFERENCES_AUDIT,
  PLOT_MAPPING_DRAFT_AUDIT,
  PLOT_MAPPING_DRAFT_CLEARED_AUDIT,
} from '@/features/sync/farmerArtifactRegistry';
import { markFieldCloudAuditSynced } from '@/features/sync/queueFieldCloudAuditSync';

const PROFILE_PHOTO_STORAGE_KEY = 'farmerProfilePhotoStoragePath';

function resolveCloudAuditScopeId(
  eventType: string,
  payload: Record<string, unknown>,
  apiFarmerId: string,
): string {
  const farmerId = String(payload.farmerId ?? '').trim();
  if (farmerId) return farmerId;
  return apiFarmerId;
}

/**
 * Sets local `audit_cloud_synced:*` markers when server audit_log already has the event.
 */
export async function hydrateFieldCloudAuditMarkersFromServer(params: {
  apiFarmerId: string;
  auditRows: AuditLogRow[];
}): Promise<{ marked: number }> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) return { marked: 0 };

  const allowed = new Set<string>(FIELD_CLOUD_AUDIT_EVENT_TYPES);
  const markedKeys = new Set<string>();
  let marked = 0;

  for (const row of params.auditRows) {
    const eventType = String(row.event_type ?? '').trim();
    if (!allowed.has(eventType) || !row.payload) continue;

    const scopeId = resolveCloudAuditScopeId(eventType, row.payload, apiFarmerId);
    if (!scopeId) continue;

    const dedupeKey = `${eventType}:${scopeId}`;
    if (markedKeys.has(dedupeKey)) continue;
    markedKeys.add(dedupeKey);

    await markFieldCloudAuditSynced({ eventType, scopeId }).catch(() => undefined);
    marked += 1;

    if (eventType === FARMER_PROFILE_PHOTO_AUDIT) {
      const storagePath = String(row.payload.storagePath ?? '').trim();
      if (storagePath) {
        const { setSetting } = await import('@/features/state/persistence');
        await setSetting(PROFILE_PHOTO_STORAGE_KEY, storagePath).catch(() => undefined);
      } else if (row.payload.cleared === true) {
        const { setSetting } = await import('@/features/state/persistence');
        await setSetting(PROFILE_PHOTO_STORAGE_KEY, '').catch(() => undefined);
      }
    }

    if (
      eventType === FIELD_DEVICE_PREFERENCES_AUDIT ||
      eventType === PLOT_MAPPING_DRAFT_AUDIT ||
      eventType === PLOT_MAPPING_DRAFT_CLEARED_AUDIT
    ) {
      // scopeId = farmerId — marker set above.
    }
  }

  return { marked };
}
