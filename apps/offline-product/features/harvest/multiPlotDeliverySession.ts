import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import { submitHarvestRecord } from '@/features/harvest/submitHarvest';
import { generateDeliveryTripRef } from '@/features/harvest/buildDeliveryQrUrl';
import { validateHarvestKg } from '@/features/validation/validators';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { TranslateFn } from '@/features/i18n/translate';

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
  deliveryTripRef?: string | null;
  message?: string;
  messageKey?:
    | 'harvest_queued_offline'
    | 'harvest_queued_plot_not_synced'
    | 'delivery_unknown_buyer_email';
  buyerInvitePending?: boolean;
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

/** Build delivery lines from inline per-plot weight fields (one screen, no wizard hops). */
export function buildMultiPlotLinesFromWeights(params: {
  plots: readonly HarvestPlotOption[];
  weightByPlotId: Readonly<Record<string, string>>;
  deliveredByPlot: Record<string, number>;
}): { ok: true; lines: MultiPlotDeliveryLine[] } | { ok: false; error: string } {
  const lines: MultiPlotDeliveryLine[] = [];

  for (const plot of params.plots) {
    const validation = validateHarvestKg(params.weightByPlotId[plot.id] ?? '');
    if (!validation.ok) {
      return { ok: false, error: `${plot.name}: ${validation.error}` };
    }
    const canAdd = canAddLineToSession({
      plot,
      kg: validation.value,
      deliveredByPlot: params.deliveredByPlot,
      existingLines: lines,
    });
    if (!canAdd.ok) {
      if (canAdd.reason === 'local_only') {
        return { ok: false, error: `${plot.name}: backup plot first` };
      }
      return { ok: false, error: `${plot.name}: invalid weight` };
    }
    lines.push({ plotId: plot.id, plotName: plot.name, kg: validation.value });
  }

  if (lines.length === 0) {
    return { ok: false, error: 'No plots selected' };
  }

  return { ok: true, lines };
}

export function inlineMultiPlotWeightsComplete(params: {
  plots: readonly HarvestPlotOption[];
  weightByPlotId: Readonly<Record<string, string>>;
  deliveredByPlot: Record<string, number>;
}): boolean {
  return buildMultiPlotLinesFromWeights(params).ok;
}

export async function submitMultiPlotDeliverySession(params: {
  farmerId: string;
  lines: MultiPlotDeliveryLine[];
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
  sessionId?: string;
  deliveryRecipient?: DeliveryRecipientSelection | null;
  t?: TranslateFn;
}): Promise<MultiPlotDeliveryLineResult[]> {
  const sessionId = params.sessionId ?? `multi-${Date.now()}`;
  const deliveryTripRef = params.lines.length > 1 ? generateDeliveryTripRef() : null;
  trackEvent(ANALYTICS_EVENTS.MULTI_PLOT_DELIVERY_STARTED, {
    sessionId,
    lineCount: params.lines.length,
    totalKg: sessionTotalKg(params.lines),
    deliveryTripRef: deliveryTripRef ?? undefined,
  });

  const results: MultiPlotDeliveryLineResult[] = [];
  for (const line of params.lines) {
    const submitLine = (recipient: DeliveryRecipientSelection | null) =>
      submitHarvestRecord({
        farmerId: params.farmerId,
        selectedPlotId: line.plotId,
        kg: line.kg,
        localPlots: params.localPlots,
        backendPlots: params.backendPlots,
        plotServerLinks: params.plotServerLinks,
        deliveryRecipient: recipient,
        deliveryTripRef,
      });

    let result = await submitLine(params.deliveryRecipient ?? null);
    if (params.t) {
      const { resolveHarvestSubmitWithUnknownBuyerFallback } = await import(
        '@/features/harvest/completeHarvestSubmitFlow'
      );
      result = await resolveHarvestSubmitWithUnknownBuyerFallback({
        result,
        t: params.t,
        retryWithRecipient: submitLine,
      });
    }

    if (result.status === 'synced') {
      results.push({
        plotId: line.plotId,
        plotName: line.plotName,
        kg: line.kg,
        status: 'synced',
        qrCodeRef: result.qrCodeRef,
        deliveryTripRef,
        buyerInvitePending: result.buyerInvite?.pending === true,
      });
      continue;
    }
    if (result.status === 'queued') {
      results.push({
        plotId: line.plotId,
        plotName: line.plotName,
        kg: line.kg,
        status: 'queued',
        deliveryTripRef,
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
      messageKey:
        result.status === 'error' && result.messageKey === 'delivery_unknown_buyer_email'
          ? 'delivery_unknown_buyer_email'
          : undefined,
    });
    if (result.status === 'error' && result.messageKey === 'delivery_unknown_buyer_email') {
      break;
    }
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
