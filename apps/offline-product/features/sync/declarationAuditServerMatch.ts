import type { Plot } from '@/features/state/AppStateContext';
import { resolveLocalPlotIdForServerPlot } from '@/features/harvest/resolveLocalPlotIdForServerPlot';
import type { AuditLogRow } from '@/features/sync/fetchMergedAuditEventsForFarmer';

/** Server audit_log already contains a producer attestation snapshot. */
export function serverHasProducerAttestationAudit(auditRows: readonly AuditLogRow[]): boolean {
  return auditRows.some((row) => row.event_type === 'producer_attestations_updated');
}

/** Server audit_log already contains a plot compliance declaration for this local plot. */
export function serverHasPlotComplianceAuditForLocalPlot(params: {
  plot: Plot;
  localPlots: Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots?: unknown[];
  auditRows: readonly AuditLogRow[];
}): boolean {
  const { plot, auditRows } = params;
  return auditRows.some((row) => {
    if (row.event_type !== 'plot_compliance_declared' || !row.payload) return false;
    const payloadPlotId = String(row.payload.plotId ?? '').trim();
    if (!payloadPlotId) return false;
    if (payloadPlotId === plot.id) return true;
    const resolvedLocalPlotId = resolveLocalPlotIdForServerPlot({
      serverPlotId: payloadPlotId,
      localPlots: params.localPlots,
      plotServerLinks: params.plotServerLinks,
      backendPlots: params.backendPlots,
    });
    return resolvedLocalPlotId === plot.id;
  });
}

/** Pending audit_sync row is redundant when the server already recorded this declaration. */
export function serverHasDeclarationAuditForQueuePayload(params: {
  eventType: string;
  auditPayload: Record<string, unknown>;
  localPlots: Plot[];
  plotServerLinks: Record<string, string>;
  backendPlots?: unknown[];
  auditRows: readonly AuditLogRow[];
}): boolean {
  if (params.eventType === 'producer_attestations_updated') {
    return serverHasProducerAttestationAudit(params.auditRows);
  }
  if (params.eventType === 'plot_compliance_declared') {
    const plotId = String(params.auditPayload.plotId ?? '').trim();
    if (!plotId) return false;
    const plot = params.localPlots.find((row) => row.id === plotId);
    if (!plot) return false;
    return serverHasPlotComplianceAuditForLocalPlot({
      plot,
      localPlots: params.localPlots,
      plotServerLinks: params.plotServerLinks,
      backendPlots: params.backendPlots,
      auditRows: params.auditRows,
    });
  }
  return false;
}
