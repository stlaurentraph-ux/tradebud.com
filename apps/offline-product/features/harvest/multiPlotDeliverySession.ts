import { submitHarvestRecord } from '@/features/harvest/submitHarvest';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import type { Plot } from '@/features/state/AppStateContext';
import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';

export type MultiPlotDeliveryLine = {
  plotId: string;
  plotName: string;
  kg: number;
};

export type MultiPlotDeliveryLineResult = {
  plotId: string;
  plotName: string;
  kg: number;
  status: 'synced' | 'queued' | 'error';
  qrCodeRef?: string | null;
  message?: string;
  messageKey?: 'harvest_queued_offline' | 'harvest_queued_plot_not_synced';
};

export type HarvestPlotOption = {
  id: string;
  name: string;
  area_ha: number;
  localOnly?: boolean;
};

export function reservedKgByPlot(lines: readonly MultiPlotDeliveryLine[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const line of lines) {
    acc[line.plotId] = (acc[line.plotId] ?? 0) + line.kg;
  }
  return acc;
}

export function canAddLineToSession(params: {
  plot: HarvestPlotOption;
  kg: number;
  deliveredByPlot: Record<string, number>;
  existingLines: readonly MultiPlotDeliveryLine[];
  excludePlotId?: string | null;
}): { ok: true } | { ok: false; reason: 'local_only' | 'invalid_weight' | 'duplicate_plot' } {
  if (params.plot.localOnly) {
    return { ok: false, reason: 'local_only' };
  }
  if (!Number.isFinite(params.kg) || params.kg <= 0) {
    return { ok: false, reason: 'invalid_weight' };
  }
  if (params.existingLines.some((line) => line.plotId === params.plot.id)) {
    return { ok: false, reason: 'duplicate_plot' };
  }
  return { ok: true };
}

export function sessionTotalKg(lines: readonly MultiPlotDeliveryLine[]): number {
  return lines.reduce((sum, line) => sum + line.kg, 0);
}

export async function submitMultiPlotDeliverySession(params: {
  farmerId: string;
  lines: MultiPlotDeliveryLine[];
  localPlots: Plot[];
  backendPlots: unknown[];
  sessionId?: string;
  deliveryRecipient?: DeliveryRecipientSelection | null;
}): Promise<MultiPlotDeliveryLineResult[]> {
  const sessionId = params.sessionId ?? `multi-${Date.now()}`;
  trackEvent(ANALYTICS_EVENTS.MULTI_PLOT_DELIVERY_STARTED, {
    sessionId,
    lineCount: params.lines.length,
    totalKg: sessionTotalKg(params.lines),
  });

  const results: MultiPlotDeliveryLineResult[] = [];
  for (const line of params.lines) {
    const result = await submitHarvestRecord({
      farmerId: params.farmerId,
      selectedPlotId: line.plotId,
      kg: line.kg,
      localPlots: params.localPlots,
      backendPlots: params.backendPlots,
      deliveryRecipient: params.deliveryRecipient,
    });

    if (result.status === 'synced') {
      results.push({
        plotId: line.plotId,
        plotName: line.plotName,
        kg: line.kg,
        status: 'synced',
        qrCodeRef: result.qrCodeRef,
      });
      continue;
    }
    if (result.status === 'queued') {
      results.push({
        plotId: line.plotId,
        plotName: line.plotName,
        kg: line.kg,
        status: 'queued',
        messageKey: result.messageKey,
      });
      continue;
    }
    results.push({
      plotId: line.plotId,
      plotName: line.plotName,
      kg: line.kg,
      status: 'error',
      message: result.message,
    });
  }

  trackEvent(ANALYTICS_EVENTS.MULTI_PLOT_DELIVERY_SUBMITTED, {
    sessionId,
    lineCount: params.lines.length,
    syncedCount: results.filter((row) => row.status === 'synced').length,
    queuedCount: results.filter((row) => row.status === 'queued').length,
    errorCount: results.filter((row) => row.status === 'error').length,
  });

  return results;
}
