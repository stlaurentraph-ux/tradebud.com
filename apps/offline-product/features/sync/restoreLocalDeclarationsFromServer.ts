import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import {
  applyProducerAttestationsToFarmer,
  buildPlotAttestationFields,
  hasProducerAttestationsComplete,
} from '@/features/compliance/farmerDeclarations';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import { fetchMergedAuditEventsForFarmer } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { markDeclarationAuditSynced } from '@/features/sync/queueDeclarationAuditSync';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import {
  loadAppState,
  loadPlotServerLinks,
  persistFarmer,
  persistPlots,
  savePlotCadastralKey,
  savePlotTenure,
} from '@/features/state/persistence';

export type RestoreLocalDeclarationsResult = {
  producerRestored: boolean;
  plotsRestored: number;
  legalRestored: number;
  fetchFailed: boolean;
};

function parseTimestampMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

/**
 * Pulls producer + plot declaration flags from server audit_log into local SQLite.
 * Never clears attestations already complete on device.
 */
export async function restoreLocalDeclarationsFromServer(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
  localFarmer: FarmerProfile | undefined;
  localPlots: Plot[];
}): Promise<RestoreLocalDeclarationsResult> {
  const apiFarmerId = params.apiFarmerId.trim();
  if (!apiFarmerId) {
    return { producerRestored: false, plotsRestored: 0, legalRestored: 0, fetchFailed: false };
  }

  const diskState = await loadAppState().catch(() => ({ farmer: undefined, plots: [] as Plot[] }));
  const localFarmer =
    diskState.farmer?.id === apiFarmerId ? diskState.farmer : params.localFarmer;
  const localPlots = params.localPlots.length > 0 ? params.localPlots : diskState.plots;

  if (!localFarmer?.id) {
    return { producerRestored: false, plotsRestored: 0, legalRestored: 0, fetchFailed: false };
  }

  let auditRows: Awaited<ReturnType<typeof fetchMergedAuditEventsForFarmer>> = [];
  try {
    auditRows = await fetchMergedAuditEventsForFarmer([apiFarmerId, ...params.ownedFarmerIds]);
  } catch {
    return { producerRestored: false, plotsRestored: 0, legalRestored: 0, fetchFailed: true };
  }

  let producerRestored = false;
  let plotsRestored = 0;
  let legalRestored = 0;

  const latestProducer = auditRows.find(
    (row) => row.event_type === 'producer_attestations_updated',
  );
  if (
    latestProducer?.payload &&
    !hasProducerAttestationsComplete(localFarmer)
  ) {
    const payload = latestProducer.payload;
    const at = parseTimestampMs(payload.selfDeclaredAt) || Date.now();
    const nextFarmer = applyProducerAttestationsToFarmer(
      {
        ...localFarmer,
        selfDeclared: payload.selfDeclared === true,
        selfDeclaredAt: at,
      },
      {
        fpicConsent: payload.fpicConsent === true,
        laborNoChildLabor: payload.laborNoChildLabor === true,
        laborNoForcedLabor: payload.laborNoForcedLabor === true,
      },
      at,
    );
    if (hasProducerAttestationsComplete(nextFarmer)) {
      await persistFarmer(nextFarmer);
      await markDeclarationAuditSynced({
        eventType: 'producer_attestations_updated',
        payload: {
          farmerId: nextFarmer.id,
          fpicConsent: nextFarmer.fpicConsent === true,
          laborNoChildLabor: nextFarmer.laborNoChildLabor === true,
          laborNoForcedLabor: nextFarmer.laborNoForcedLabor === true,
          selfDeclared: true,
          selfDeclaredAt: nextFarmer.selfDeclaredAt ?? at,
        },
      }).catch(() => undefined);
      producerRestored = true;
    }
  } else if (hasProducerAttestationsComplete(localFarmer) && latestProducer?.payload) {
    await markDeclarationAuditSynced({
      eventType: 'producer_attestations_updated',
      payload: {
        farmerId: localFarmer.id,
        fpicConsent: localFarmer.fpicConsent === true,
        laborNoChildLabor: localFarmer.laborNoChildLabor === true,
        laborNoForcedLabor: localFarmer.laborNoForcedLabor === true,
        selfDeclared: true,
        selfDeclaredAt: localFarmer.selfDeclaredAt ?? parseTimestampMs(latestProducer.payload.selfDeclaredAt),
      },
    }).catch(() => undefined);
  }

  const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<
    string,
    string
  >;
  const backendPlots = await fetchBackendPlotsForSyncScope({
    farmerId: apiFarmerId,
    ownedFarmerIds: params.ownedFarmerIds,
  }).catch(() => []);

  const plotById = new Map(localPlots.map((plot) => [plot.id, plot]));
  const updatedPlots = [...localPlots];

  for (const row of auditRows) {
    if (row.event_type !== 'plot_compliance_declared' || !row.payload) continue;
    const payloadPlotId = String(row.payload.plotId ?? '').trim();
    if (!payloadPlotId) continue;

    const localPlotId =
      plotById.has(payloadPlotId)
        ? payloadPlotId
        : resolveLocalPlotIdForServerPlot({
            serverPlotId: payloadPlotId,
            localPlots: updatedPlots,
            plotServerLinks,
            backendPlots,
          });
    if (!localPlotId) continue;

    const plot = plotById.get(localPlotId);
    if (!plot) continue;
    if (plot.landTenureDeclared && plot.noDeforestationDeclared) continue;

    const at = parseTimestampMs(row.timestamp) || Date.now();
    const nextPlot: Plot = {
      ...plot,
      ...buildPlotAttestationFields(
        {
          landTenure: row.payload.landTenureDeclared === true || plot.landTenureDeclared === true,
          noDeforestation:
            row.payload.noDeforestationDeclared === true || plot.noDeforestationDeclared === true,
        },
        at,
      ),
    };
    plotById.set(localPlotId, nextPlot);
    const index = updatedPlots.findIndex((candidate) => candidate.id === localPlotId);
    if (index >= 0) {
      updatedPlots[index] = nextPlot;
      plotsRestored += 1;
      await markDeclarationAuditSynced({
        eventType: 'plot_compliance_declared',
        payload: {
          plotId: localPlotId,
          farmerId: localFarmer.id,
          landTenureDeclared: true,
          noDeforestationDeclared: true,
          source: 'restore',
        },
      }).catch(() => undefined);
    }
  }

  for (const plot of updatedPlots) {
    if (!(plot.landTenureDeclared && plot.noDeforestationDeclared)) continue;
    const hasAudit = auditRows.some((row) => {
      if (row.event_type !== 'plot_compliance_declared' || !row.payload) return false;
      const payloadPlotId = String(row.payload.plotId ?? '').trim();
      if (!payloadPlotId) return false;
      if (payloadPlotId === plot.id) return true;
      const resolvedLocalPlotId = resolveLocalPlotIdForServerPlot({
        serverPlotId: payloadPlotId,
        localPlots: updatedPlots,
        plotServerLinks,
        backendPlots,
      });
      return resolvedLocalPlotId === plot.id;
    });
    if (!hasAudit) continue;
    await markDeclarationAuditSynced({
      eventType: 'plot_compliance_declared',
      payload: {
        plotId: plot.id,
        farmerId: localFarmer.id,
        landTenureDeclared: true,
        noDeforestationDeclared: true,
        source: 'restore',
      },
    }).catch(() => undefined);
  }

  for (const row of auditRows) {
    if (row.event_type !== 'plot_legal_synced' || !row.payload) continue;
    const serverPlotId = String(row.payload.plotId ?? '').trim();
    if (!serverPlotId) continue;
    const localPlotId = resolveLocalPlotIdForServerPlot({
      serverPlotId,
      localPlots: updatedPlots,
      plotServerLinks,
      backendPlots,
    });
    if (!localPlotId) continue;

    const cadastralKey =
      row.payload.cadastralKey != null ? String(row.payload.cadastralKey).trim() : '';
    if (cadastralKey) {
      await savePlotCadastralKey(localPlotId, cadastralKey).catch(() => undefined);
      legalRestored += 1;
    }

    if (row.payload.informalTenure === true || row.payload.informalTenure === false) {
      await savePlotTenure(localPlotId, {
        informalTenure: row.payload.informalTenure === true,
        informalTenureNote:
          row.payload.informalTenureNote != null
            ? String(row.payload.informalTenureNote)
            : null,
      }).catch(() => undefined);
    }
  }

  if (plotsRestored > 0) {
    await persistPlots(updatedPlots);
  }

  return { producerRestored, plotsRestored, legalRestored, fetchFailed: false };
}
