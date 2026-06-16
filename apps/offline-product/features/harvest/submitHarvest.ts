import { postHarvestToBackend } from '@/features/api/postPlot';
import { logError } from '@/features/errors/ErrorLogger';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import type { Plot } from '@/features/state/AppStateContext';
import { enqueuePendingSync } from '@/features/state/persistence';

export type SubmitHarvestResult =
  | { status: 'synced'; qrCodeRef: string | null }
  | { status: 'queued'; messageKey: 'harvest_queued_offline' | 'harvest_queued_plot_not_synced' }
  | { status: 'error'; message: string };

function readQrCodeRef(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const voucher = (response as { voucher?: { qr_code_ref?: unknown } }).voucher;
  const ref = voucher?.qr_code_ref;
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveLocalPlotForSelection(
  selectedPlotId: string,
  localPlots: Plot[],
  backendPlots: unknown[],
): Plot | null {
  const direct = localPlots.find((p) => p.id === selectedPlotId);
  if (direct) return direct;

  const serverRow = (backendPlots as { id?: unknown; name?: string }[]).find(
    (row) => String(row.id ?? '') === selectedPlotId,
  );
  if (!serverRow) return null;

  const clientKey = String(serverRow.name ?? '');
  return (
    localPlots.find((p) => p.id === clientKey) ??
    localPlots.find((p) => p.name === clientKey) ??
    null
  );
}

function resolveServerPlotId(localPlot: Plot, backendPlots: unknown[]): string | null {
  const hit = findBackendPlotForLocal(
    {
      id: localPlot.id,
      name: localPlot.name,
      areaHectares: localPlot.areaHectares,
      kind: localPlot.kind,
    },
    backendPlots,
  );
  return hit != null && (hit as { id?: unknown }).id != null
    ? String((hit as { id: unknown }).id)
    : null;
}

export async function submitHarvestRecord(params: {
  farmerId: string;
  selectedPlotId: string;
  kg: number;
  localPlots: Plot[];
  backendPlots: unknown[];
}): Promise<SubmitHarvestResult> {
  const localPlot = resolveLocalPlotForSelection(
    params.selectedPlotId,
    params.localPlots,
    params.backendPlots,
  );
  if (!localPlot) {
    return { status: 'error', message: 'Plot not found on this device.' };
  }

  const serverPlotId = resolveServerPlotId(localPlot, params.backendPlots);
  const createdAt = Date.now();
  const clientEventId = `harvest-${localPlot.id}-${createdAt}`;

  if (serverPlotId) {
    try {
      const response = await postHarvestToBackend({
        farmerId: params.farmerId,
        plotId: serverPlotId,
        kg: params.kg,
        clientEventId,
      });
      trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_SUCCESS, {
        plotId: localPlot.id,
        serverPlotId,
        kg: params.kg,
      });
      return { status: 'synced', qrCodeRef: readQrCodeRef(response) };
    } catch (e) {
      const classified = logError(e, {
        context: 'harvest_submission',
        plotId: localPlot.id,
        kg: params.kg,
      });
      if (classified.category === 'validation') {
        trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE, {
          plotId: localPlot.id,
          reason: classified.code ?? classified.category,
        });
        return { status: 'error', message: classified.message };
      }
    }
  }

  await enqueuePendingSync({
    createdAt,
    actionType: 'harvest',
    payloadJson: JSON.stringify({
      farmerId: params.farmerId,
      plotId: localPlot.id,
      kg: params.kg,
      clientEventId,
    }),
    lastError: null,
  });

  trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE, {
    plotId: localPlot.id,
    reason: serverPlotId ? 'queued_offline' : 'plot_not_on_server',
    kg: params.kg,
  });

  return {
    status: 'queued',
    messageKey: serverPlotId ? 'harvest_queued_offline' : 'harvest_queued_plot_not_synced',
  };
}
