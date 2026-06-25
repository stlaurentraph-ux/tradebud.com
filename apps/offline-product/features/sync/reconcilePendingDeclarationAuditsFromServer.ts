import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import {
  fetchMergedAuditEventsForFarmer,
  type AuditLogRow,
} from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { serverHasDeclarationAuditForQueuePayload } from '@/features/sync/declarationAuditServerMatch';
import {
  markDeclarationAuditSynced,
} from '@/features/sync/queueDeclarationAuditSync';
import { markFieldCloudAuditSynced } from '@/features/sync/queueFieldCloudAuditSync';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  deletePendingSyncAction,
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';

/**
 * Drop redundant declaration audit_sync rows when audit_log already has the event.
 * Runs before enqueue so a satisfied cloud state does not re-queue uploads every sync.
 */
export async function reconcilePendingDeclarationAuditsFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer: FarmerProfile | undefined;
  localPlots: Plot[];
  auditRows?: AuditLogRow[];
}): Promise<{ dropped: number; marked: number }> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) return { dropped: 0, marked: 0 };

  const pendingRows = (await loadPendingSyncActions().catch(() => [])).filter(
    (row) => row.actionType === 'audit_sync',
  );
  if (pendingRows.length === 0) return { dropped: 0, marked: 0 };

  let auditRows = params.auditRows;
  if (auditRows == null) {
    try {
      auditRows = await fetchMergedAuditEventsForFarmer([apiFarmerId, ...params.ownedFarmerIds]);
    } catch {
      return { dropped: 0, marked: 0 };
    }
  }

  const [plotServerLinks, backendPlots] = await Promise.all([
    loadPlotServerLinks().catch(() => ({})) as Promise<Record<string, string>>,
    fetchBackendPlotsForSyncScope({
      farmerId: apiFarmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    }).catch(() => []),
  ]);

  let dropped = 0;
  let marked = 0;
  const localFarmerId = params.localFarmer?.id?.trim() ?? '';

  for (const row of pendingRows) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(row.payloadJson) as Record<string, unknown>;
    } catch {
      continue;
    }
    const eventType = String(payload.eventType ?? '').trim();
    const auditPayload =
      payload.payload && typeof payload.payload === 'object' && !Array.isArray(payload.payload)
        ? (payload.payload as Record<string, unknown>)
        : null;
    if (!eventType || !auditPayload) continue;

    const redundant = serverHasDeclarationAuditForQueuePayload({
      eventType,
      auditPayload,
      localPlots: params.localPlots,
      plotServerLinks,
      backendPlots,
      auditRows,
    });
    if (!redundant) continue;

    await markDeclarationAuditSynced({ eventType, payload: auditPayload }).catch(() => undefined);
    const scopeId = String(auditPayload.farmerId ?? localFarmerId).trim();
    if (scopeId) {
      await markFieldCloudAuditSynced({ eventType, scopeId }).catch(() => undefined);
    }
    await deletePendingSyncAction(row.id).catch(() => undefined);
    dropped += 1;
    marked += 1;
  }

  return { dropped, marked };
}
