import { postAuditEventToBackend } from '@/features/api/audit';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { pendingSyncDedupKey } from '@/features/sync/pendingSyncDedup';
import {
  deletePendingSyncAction,
  enqueuePendingSync,
  getSetting,
  loadPendingSyncActions,
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

async function deletePendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<void> {
  const key = pendingSyncDedupKey(actionType, payloadJson);
  if (!key) return;
  const rows = await loadPendingSyncActions().catch(() => []);
  const match = rows.find(
    (row) =>
      row.actionType === actionType &&
      pendingSyncDedupKey(row.actionType, row.payloadJson) === key,
  );
  if (match) await deletePendingSyncAction(match.id).catch(() => undefined);
}

/** Queue a self-declaration audit row and post immediately when signed in. */
export async function queueDeclarationAuditSync(params: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<QueueDeclarationAuditResult> {
  await clearDeclarationAuditSyncedMarker(params);

  const payloadJson = JSON.stringify({
    eventType: params.eventType,
    payload: params.payload,
  });
  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: null,
  });

  if (!hasSyncAuthSession()) return 'queued';

  const result = await postAuditEventToBackend({
    eventType: params.eventType,
    payload: params.payload,
  });
  if (result.ok) {
    await deletePendingSyncByDedupKey('audit_sync', payloadJson);
    await markDeclarationAuditSynced(params);
    return 'synced';
  }

  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: result.message ?? result.reason,
  });
  return 'queued';
}

export async function queueProducerAttestationAuditSync(
  farmer: FarmerProfile,
): Promise<QueueDeclarationAuditResult | 'skipped'> {
  if (!hasProducerAttestationsComplete(farmer)) return 'skipped';
  return queueDeclarationAuditSync({
    eventType: 'producer_attestations_updated',
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
}): Promise<{ producer: boolean; plots: number }> {
  let producer = false;
  let plots = 0;
  const farmer = params.farmer;

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
    });
    plots += 1;
  }

  return { producer, plots };
}
