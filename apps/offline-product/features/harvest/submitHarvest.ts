import { harvestDateIsoFromMs } from '@/features/harvest/harvestDeliveryDate';
import { postHarvestToBackend } from '@/features/api/postPlot';
import { logError, getUserMessage } from '@/features/errors/ErrorLogger';
import { readHarvestSubmitQrCodeRef } from '@/features/harvest/resolveDeliveryQrCode';
import { readHarvestSubmitBuyerInvite } from '@/features/harvest/readHarvestSubmitBuyerInvite';
import type { HarvestBuyerInvite } from '@/features/harvest/readHarvestSubmitBuyerInvite';
import { resolveLocalPlotForHarvestSubmit } from '@/features/harvest/mergeHarvestPlotOptions';
import { resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import type { Plot } from '@/features/state/AppStateContext';
import { enqueuePendingSync, persistLocalDeliveryReceipt } from '@/features/state/persistence';
import {
  deliveryRecipientToApiPayload,
  type DeliveryRecipientSelection,
} from '@/features/harvest/DeliveryRecipientFields';

export type SubmitHarvestResult =
  | { status: 'synced'; qrCodeRef: string | null; receiptId: string; buyerInvite?: HarvestBuyerInvite | null }
  | { status: 'queued'; messageKey: 'harvest_queued_offline' | 'harvest_queued_plot_not_synced'; receiptId: string }
  | {
      status: 'error';
      messageKey: 'harvest_plot_not_on_device' | 'delivery_unknown_buyer_email';
      message: string;
    }
  | { status: 'error'; message: string; messageKey?: string };

function resolveServerPlotId(
  localPlot: Plot,
  backendPlots: unknown[],
  plotServerLinks?: PlotServerLinks | null,
): string | null {
  return resolveServerPlotIdForLocal(
    {
      id: localPlot.id,
      name: localPlot.name,
      areaHectares: localPlot.areaHectares,
      kind: localPlot.kind,
    },
    backendPlots,
    plotServerLinks,
  );
}

export async function submitHarvestRecord(params: {
  farmerId: string;
  selectedPlotId: string;
  kg: number;
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
  deliveryRecipient?: DeliveryRecipientSelection | null;
  plotName?: string;
  buyerLabel?: string;
}): Promise<SubmitHarvestResult> {
  const localPlot = resolveLocalPlotForHarvestSubmit({
    selectedPlotId: params.selectedPlotId,
    localPlots: params.localPlots,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });
  if (!localPlot) {
    return {
      status: 'error',
      messageKey: 'harvest_plot_not_on_device',
      message: 'Plot not found on this device.',
    };
  }

  const serverPlotId = resolveServerPlotId(
    localPlot,
    params.backendPlots,
    params.plotServerLinks,
  );
  const createdAt = Date.now();
  const clientEventId = `harvest-${localPlot.id}-${createdAt}`;

  const deliveryPayload = deliveryRecipientToApiPayload(params.deliveryRecipient ?? null);
  const plotName = params.plotName?.trim() || String(localPlot.name ?? 'Plot');
  const buyerLabel = params.buyerLabel?.trim() || '';

  const persistLocalReceipt = async (pendingSync: boolean, qrCodeRef: string | null) => {
    await persistLocalDeliveryReceipt({
      id: clientEventId,
      farmerId: params.farmerId,
      localPlotId: localPlot.id,
      serverPlotId: serverPlotId,
      plotName,
      kg: params.kg,
      recordedAt: createdAt,
      qrCodeRef,
      pendingSync,
      buyerLabel,
    });
  };

  if (serverPlotId) {
    try {
      const response = await postHarvestToBackend({
        farmerId: params.farmerId,
        plotId: serverPlotId,
        kg: params.kg,
        harvestDate: harvestDateIsoFromMs(createdAt),
        clientEventId,
        ...deliveryPayload,
      });
      const qrCodeRef = readHarvestSubmitQrCodeRef(response);
      const buyerInvite = readHarvestSubmitBuyerInvite(response);
      await persistLocalReceipt(false, qrCodeRef);
      trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_SUCCESS, {
        plotId: localPlot.id,
        serverPlotId,
        kg: params.kg,
        deliveryMode: params.deliveryRecipient?.mode ?? 'unspecified',
        buyerInvitePending: buyerInvite?.pending === true,
      });
      return { status: 'synced', qrCodeRef, receiptId: clientEventId, buyerInvite };
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
        if (/no buyer organisation found/i.test(classified.message)) {
          return {
            status: 'error',
            messageKey: 'delivery_unknown_buyer_email',
            message: classified.message,
          };
        }
        return { status: 'error', message: classified.message };
      }
      if (classified.category === 'server') {
        trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE, {
          plotId: localPlot.id,
          reason: classified.code ?? classified.category,
        });
        return { status: 'error', message: getUserMessage(classified) };
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
      harvestDate: harvestDateIsoFromMs(createdAt),
      ...deliveryPayload,
    }),
    lastError: null,
  });
  await persistLocalReceipt(true, null);

  trackEvent(ANALYTICS_EVENTS.HARVEST_SUBMIT_FAILURE, {
    plotId: localPlot.id,
    reason: serverPlotId ? 'queued_offline' : 'plot_not_on_server',
    kg: params.kg,
  });

  return {
    status: 'queued',
    messageKey: serverPlotId ? 'harvest_queued_offline' : 'harvest_queued_plot_not_synced',
    receiptId: clientEventId,
  };
}
