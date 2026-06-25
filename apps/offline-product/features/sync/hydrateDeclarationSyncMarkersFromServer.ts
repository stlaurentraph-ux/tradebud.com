import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import {
  serverHasPlotComplianceAuditForLocalPlot,
  serverHasProducerAttestationAudit,
} from '@/features/sync/declarationAuditServerMatch';
import {
  fetchMergedAuditEventsForFarmer,
  type AuditLogRow,
} from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { markDeclarationAuditSynced } from '@/features/sync/queueDeclarationAuditSync';
import { markFieldCloudAuditSynced } from '@/features/sync/queueFieldCloudAuditSync';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import { loadPlotServerLinks } from '@/features/state/persistence';

function parseTimestampMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

/**
 * Sets local `audit_decl_synced:*` markers when server audit_log already has declarations.
 * Push-only sync skips full declaration restore — without this, every Sync re-queues audit POSTs.
 */
export async function hydrateDeclarationSyncMarkersFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer: FarmerProfile | undefined;
  localPlots: Plot[];
  auditRows?: AuditLogRow[];
}): Promise<{ producerMarked: boolean; plotsMarked: number; fetchFailed: boolean }> {
  const apiFarmerId = params.apiFarmerId.trim();
  const localFarmer = params.localFarmer;
  if (!apiFarmerId || !localFarmer?.id) {
    return { producerMarked: false, plotsMarked: 0, fetchFailed: false };
  }

  let auditRows = params.auditRows;
  if (auditRows == null) {
    try {
      auditRows = await fetchMergedAuditEventsForFarmer([apiFarmerId, ...params.ownedFarmerIds]);
    } catch {
      return { producerMarked: false, plotsMarked: 0, fetchFailed: true };
    }
  }

  let producerMarked = false;
  let plotsMarked = 0;

  const latestProducer = auditRows.find(
    (row) => row.event_type === 'producer_attestations_updated',
  );
  if (
    hasProducerAttestationsComplete(localFarmer) &&
    serverHasProducerAttestationAudit(auditRows) &&
    latestProducer?.payload
  ) {
    await markDeclarationAuditSynced({
      eventType: 'producer_attestations_updated',
      payload: {
        farmerId: localFarmer.id,
        fpicConsent: localFarmer.fpicConsent === true,
        laborNoChildLabor: localFarmer.laborNoChildLabor === true,
        laborNoForcedLabor: localFarmer.laborNoForcedLabor === true,
        selfDeclared: true,
        selfDeclaredAt:
          localFarmer.selfDeclaredAt ?? parseTimestampMs(latestProducer.payload.selfDeclaredAt),
      },
    }).catch(() => undefined);
    await markFieldCloudAuditSynced({
      eventType: 'producer_attestations_updated',
      scopeId: localFarmer.id,
    }).catch(() => undefined);
    producerMarked = true;
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  for (const plot of params.localPlots) {
    if (!(plot.landTenureDeclared && plot.noDeforestationDeclared)) continue;
    if (
      !serverHasPlotComplianceAuditForLocalPlot({
        plot,
        localPlots: params.localPlots,
        plotServerLinks,
        backendPlots,
        auditRows,
      })
    ) {
      continue;
    }
    await markDeclarationAuditSynced({
      eventType: 'plot_compliance_declared',
      payload: {
        plotId: plot.id,
        farmerId: localFarmer.id,
        landTenureDeclared: true,
        noDeforestationDeclared: true,
        source: 'hydrate',
      },
    }).catch(() => undefined);
    await markFieldCloudAuditSynced({
      eventType: 'plot_compliance_declared',
      scopeId: localFarmer.id,
    }).catch(() => undefined);
    plotsMarked += 1;
  }

  return { producerMarked, plotsMarked, fetchFailed: false };
}
