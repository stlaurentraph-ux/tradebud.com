import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { resolveFieldHarvestFarmerIds } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';
import { findSyncedVoucherForLoggedDelivery } from '@/features/harvest/findSyncedVoucherForLoggedDelivery';
import type { LoggedDeliverySnapshot } from '@/features/harvest/loggedDeliverySnapshot';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { resolveLocalPlotForHarvestSubmit } from '@/features/harvest/mergeHarvestPlotOptions';
import { resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { runAutoBackup } from '@/features/sync/runAutoBackup';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import type { Plot } from '@/features/state/AppStateContext';
import {
  loadPendingSyncActions,
  loadPlotServerLinks,
  updateLocalDeliveryReceipt,
} from '@/features/state/persistence';
import type { TranslateFn } from '@/features/i18n/translate';

export type SyncDeliveryReceiptFeedback = {
  variant: 'success' | 'error' | 'info';
  message: string;
  qrCodeRef?: string | null;
};

function snapshotFromReceipt(receipt: DeliveryReceiptRecord): LoggedDeliverySnapshot {
  const recordedAt = receipt.createdAt ? new Date(receipt.createdAt).getTime() : Date.now();
  return {
    receiptId: receipt.id,
    plotId: receipt.plotId,
    plotName: receipt.plotName,
    kg: receipt.kg,
    recordedAt,
    deliveryRecipient: null,
    qrCodeRef: receipt.qrCodeRef,
    mode: receipt.pendingSync ? 'queued' : 'synced',
  };
}

export async function syncQueuedDeliveryReceipt(params: {
  farmerId: string;
  receipt: DeliveryReceiptRecord;
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks: PlotServerLinks;
  t: TranslateFn;
}): Promise<SyncDeliveryReceiptFeedback> {
  const { receipt, farmerId, localPlots, t } = params;

  if (receipt.qrCodeRef?.trim()) {
    return {
      variant: 'success',
      message: t('harvest_receipt_sync_success'),
      qrCodeRef: receipt.qrCodeRef,
    };
  }

  if (!hasSyncAuthSession()) {
    return {
      variant: 'error',
      message: t('sync_session_expired_short'),
    };
  }

  const backup = await runAutoBackup({
    farmerId,
    localPlots,
  });

  if (backup.plotResult?.stoppedForAuth) {
    return {
      variant: 'error',
      message: t('sync_session_expired_short'),
    };
  }

  if (backup.plotResult?.fetchFailed || backup.queueResult.fetchFailed) {
    return {
      variant: 'error',
      message: t('harvest_receipt_sync_failed_reach'),
    };
  }

  const { voucherFarmerIds } = await resolveFieldHarvestFarmerIds({
    profileFarmerId: farmerId,
    localPlots,
  });
  const voucherPayload = await fetchMergedServerVouchers(voucherFarmerIds).catch(() => []);
  const refreshedVouchers = normalizeVoucherRows(voucherPayload);
  const links = await loadPlotServerLinks();
  const plotsRows = await fetchServerPlotListForUi({
    profileFarmerId: farmerId,
    localPlots,
    force: true,
  }).catch(() => params.backendPlots);

  const localPlot = resolveLocalPlotForHarvestSubmit({
    selectedPlotId: receipt.plotId,
    localPlots,
    backendPlots: plotsRows ?? params.backendPlots,
    plotServerLinks: links,
  });
  const serverPlotId = localPlot
    ? resolveServerPlotIdForLocal(localPlot, plotsRows ?? params.backendPlots, links)
    : null;

  const delivery = snapshotFromReceipt(receipt);
  let qrCodeRef = findSyncedVoucherForLoggedDelivery({
    delivery,
    vouchers: refreshedVouchers,
    localPlots,
    backendPlots: plotsRows ?? params.backendPlots,
    plotServerLinks: links,
  });

  if (qrCodeRef && receipt.id.startsWith('harvest-')) {
    await updateLocalDeliveryReceipt(receipt.id, {
      qrCodeRef,
      pendingSync: false,
      serverPlotId: serverPlotId ?? undefined,
    }).catch(() => undefined);
  }

  if (qrCodeRef) {
    return {
      variant: 'success',
      message: t('harvest_receipt_sync_success'),
      qrCodeRef,
    };
  }

  const pendingHarvest = (await loadPendingSyncActions()).some((action) => {
    if (action.actionType !== 'harvest') return false;
    try {
      const payload = JSON.parse(action.payloadJson) as { plotId?: string; kg?: number };
      return (
        String(payload.plotId ?? '') === String(receipt.plotId) &&
        Math.abs(Number(payload.kg ?? 0) - receipt.kg) < 0.5
      );
    } catch {
      return false;
    }
  });

  if (backup.queueResult.failedActions > 0 || (backup.plotResult?.failed ?? 0) > 0) {
    return {
      variant: 'error',
      message: t('harvest_receipt_sync_failed_partial'),
    };
  }

  if (pendingHarvest) {
    return {
      variant: 'info',
      message: t('harvest_receipt_sync_pending_qr'),
    };
  }

  if (backup.queueResult.completed > 0 || backup.plotResult?.uploaded) {
    return {
      variant: 'info',
      message: t('harvest_receipt_sync_pending_qr'),
    };
  }

  return {
    variant: 'info',
    message: t('harvest_receipt_sync_nothing_pending'),
  };
}
