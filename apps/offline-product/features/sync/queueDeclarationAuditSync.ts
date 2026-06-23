import { postAuditEventToBackend } from '@/features/api/audit';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { pendingSyncDedupKey } from '@/features/sync/pendingSyncDedup';
import { invalidateAuditFetchCache } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { hydrateDeclarationSyncMarkersFromServer } from '@/features/sync/hydrateDeclarationSyncMarkersFromServer';
import { fetchOwnedFarmerIdsFromApi, getBootstrapOwnedFarmerIds } from '@/features/api/fieldAppBootstrap';
import {
  deletePendingSyncAction,
  enqueuePendingSync,
  getSetting,
  loadPendingSyncActions,
  markPendingSyncAttempt,
  setSetting,
  type PendingSyncAction,
} from '@/features/state/persistence';

export type QueueDeclarationAuditResult = 'synced' | 'queued';

function producerAuditSyncedKey(farmerId: string): string {
  return `audit_decl_synced:producer:${farmerId.trim()}`;
}

function plotAuditSyncedKey(plotId: string): string {
  return `audit_decl_synced:plot:${plotId.trim()}`;
}

export async function isDeclarationAuditSynced(params: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  if (params.eventType === 'producer_attestations_updated') {
    const farmerId = String(params.payload.farmerId ?? '').trim();
    if (!farmerId) return false;
    const marker = await getSetting(producerAuditSyncedKey(farmerId)).catch(() => null);
    return Boolean(marker?.trim());
  }
  if (params.eventType === 'plot_compliance_declared') {
    const plotId = String(params.payload.plotId ?? '').trim();
    if (!plotId) return false;
    const marker = await getSetting(plotAuditSyncedKey(plotId)).catch(() => null);
    return Boolean(marker?.trim());
  }
  return false;
}

export async function markDeclarationAuditSynced(params: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const at = String(Date.now());
  if (params.eventType === 'producer_attestations_updated') {
    const farmerId = String(params.payload.farmerId ?? '').trim();
    if (farmerId) await setSetting(producerAuditSyncedKey(farmerId), at).catch(() => undefined);
    return;
  }
  if (params.eventType === 'plot_compliance_declared') {
    const plotId = String(params.payload.plotId ?? '').trim();
    if (plotId) await setSetting(plotAuditSyncedKey(plotId), at).catch(() => undefined);
  }
}

async function clearDeclarationAuditSyncedMarker(params: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (params.eventType === 'producer_attestations_updated') {
    const farmerId = String(params.payload.farmerId ?? '').trim();
    if (farmerId) await setSetting(producerAuditSyncedKey(farmerId), '').catch(() => undefined);
    return;
  }
  if (params.eventType === 'plot_compliance_declared') {
    const plotId = String(params.payload.plotId ?? '').trim();
    if (plotId) await setSetting(plotAuditSyncedKey(plotId), '').catch(() => undefined);
  }
}

async function findPendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<PendingSyncAction | undefined> {
  const key = pendingSyncDedupKey(actionType, payloadJson);
  if (!key) return undefined;
  const rows = await loadPendingSyncActions().catch(() => []);
  return rows.find(
    (row) =>
      row.actionType === actionType &&
      pendingSyncDedupKey(row.actionType, row.payloadJson) === key,
  );
}

async function deletePendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<void> {
  const match = await findPendingSyncByDedupKey(actionType, payloadJson);
  if (match) await deletePendingSyncAction(match.id).catch(() => undefined);
}

async function ensurePendingDeclarationAuditRow(payloadJson: string): Promise<PendingSyncAction> {
  const existing = await findPendingSyncByDedupKey('audit_sync', payloadJson);
  if (existing) return existing;

  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: null,
  });

  const created = await findPendingSyncByDedupKey('audit_sync', payloadJson);
  if (!created) {
    throw new Error('Failed to enqueue declaration audit sync row');
  }
  return created;
}

/** Queue a self-declaration audit row; optional immediate POST when signed in. */
export async function queueDeclarationAuditSync(params: {
  eventType: string;
  payload: Record<string, unknown>;
  /** Sync now drains the queue — skip an extra POST before the drain pass. */
  deferPost?: boolean;
  /** User just saved attestations — allow re-upload even if a marker exists. */
  clearSyncedMarker?: boolean;
}): Promise<QueueDeclarationAuditResult> {
  if (params.clearSyncedMarker) {
    await clearDeclarationAuditSyncedMarker(params);
  } else if (await isDeclarationAuditSynced(params)) {
    return 'synced';
  }

  const payloadJson = JSON.stringify({
    eventType: params.eventType,
    payload: params.payload,
  });

  if (params.deferPost || !hasSyncAuthSession()) {
    await ensurePendingDeclarationAuditRow(payloadJson);
    return 'queued';
  }

  const result = await postAuditEventToBackend({
    eventType: params.eventType,
    payload: params.payload,
  });
  if (result.ok) {
    await deletePendingSyncByDedupKey('audit_sync', payloadJson);
    await markDeclarationAuditSynced(params);
    invalidateAuditFetchCache();
    return 'synced';
  }

  const row = await ensurePendingDeclarationAuditRow(payloadJson);
  await markPendingSyncAttempt(row.id, {
    attempts: row.attempts ?? 0,
    lastError: result.message ?? result.reason ?? 'Declaration audit sync failed',
    lastAttemptAt: Date.now(),
  });
  return 'queued';
}

export async function queueProducerAttestationAuditSync(
  farmer: FarmerProfile,
): Promise<QueueDeclarationAuditResult | 'skipped'> {
  if (!hasProducerAttestationsComplete(farmer)) return 'skipped';
  return queueDeclarationAuditSync({
    eventType: 'producer_attestations_updated',
    clearSyncedMarker: true,
    payload: {
      farmerId: farmer.id,
      fpicConsent: farmer.fpicConsent === true,
      laborNoChildLabor: farmer.laborNoChildLabor === true,
      laborNoForcedLabor: farmer.laborNoForcedLabor === true,
      selfDeclared: true,
      selfDeclaredAt: farmer.selfDeclaredAt ?? Date.now(),
    },
  });
}

export async function queuePlotComplianceAuditSync(params: {
  plot: Plot;
  farmerId: string;
  source?: string;
}): Promise<QueueDeclarationAuditResult | 'skipped'> {
  if (!(params.plot.landTenureDeclared && params.plot.noDeforestationDeclared)) return 'skipped';
  return queueDeclarationAuditSync({
    eventType: 'plot_compliance_declared',
    clearSyncedMarker: true,
    payload: {
      plotId: params.plot.id,
      farmerId: params.farmerId,
      landTenureDeclared: true,
      noDeforestationDeclared: true,
      source: params.source ?? 'plot_detail',
    },
  });
}

/** Re-queue signed declarations that never reached Supabase audit_log. */
export async function enqueuePendingDeclarationAuditsForDevice(params: {
  farmer: FarmerProfile | undefined;
  plots: Plot[];
  apiFarmerId?: string;
  ownedFarmerIds?: string[];
}): Promise<{ producer: boolean; plots: number }> {
  let producer = false;
  let plots = 0;
  const farmer = params.farmer;

  if (farmer?.id) {
    const ownedFarmerIds =
      params.ownedFarmerIds ??
      (await fetchOwnedFarmerIdsFromApi().catch(() => getBootstrapOwnedFarmerIds()));
    await hydrateDeclarationSyncMarkersFromServer({
      apiFarmerId: params.apiFarmerId ?? farmer.id,
      ownedFarmerIds,
      localFarmer: farmer,
      localPlots: params.plots,
    }).catch(() => undefined);
  }

  if (farmer?.id && hasProducerAttestationsComplete(farmer)) {
    const payload = {
      farmerId: farmer.id,
      fpicConsent: farmer.fpicConsent === true,
      laborNoChildLabor: farmer.laborNoChildLabor === true,
      laborNoForcedLabor: farmer.laborNoForcedLabor === true,
      selfDeclared: true,
      selfDeclaredAt: farmer.selfDeclaredAt ?? Date.now(),
    };
    const synced = await isDeclarationAuditSynced({
      eventType: 'producer_attestations_updated',
      payload,
    });
    if (!synced) {
      await queueDeclarationAuditSync({
        eventType: 'producer_attestations_updated',
        payload,
        deferPost: true,
      });
      producer = true;
    }
  }

  if (!farmer?.id) return { producer, plots };

  for (const plot of params.plots) {
    if (!(plot.landTenureDeclared && plot.noDeforestationDeclared)) continue;
    const payload = {
      plotId: plot.id,
      farmerId: farmer.id,
      landTenureDeclared: true,
      noDeforestationDeclared: true,
      source: 'sync_backfill',
    };
    const synced = await isDeclarationAuditSynced({
      eventType: 'plot_compliance_declared',
      payload,
    });
    if (synced) continue;
    await queueDeclarationAuditSync({
      eventType: 'plot_compliance_declared',
      payload,
      deferPost: true,
    });
    plots += 1;
  }

  return { producer, plots };
}
