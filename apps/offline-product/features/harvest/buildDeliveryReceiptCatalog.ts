import { fetchVouchersForFarmer } from '@/features/api/postPlot';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import {
  normalizeDeliveryReceipts,
  normalizePendingHarvestReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import {
  enrichAndDedupeDeliveryReceipts,
  normalizeLocalDeliveryReceipts,
  resolvePlotReceiptFilterIds,
} from '@/features/harvest/localDeliveryReceipts';
import { buildMergedHarvestPlots } from '@/features/harvest/mergeHarvestPlotOptions';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { reconcilePlotServerLinks, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import type { Plot } from '@/features/state/AppStateContext';
import {
  loadLocalDeliveryReceiptsForFarmer,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
} from '@/features/state/persistence';
import type { TranslateFn } from '@/features/i18n/translate';

export type DeliveryReceiptCatalog = {
  receipts: DeliveryReceiptRecord[];
  backendPlots: unknown[];
  plotServerLinks: PlotServerLinks;
  vouchers: unknown[];
};

export async function buildDeliveryReceiptCatalog(params: {
  farmerId: string;
  localPlots: Plot[];
  t: TranslateFn;
  plotIdFilter?: string | null;
  localPlotId?: string | null;
  serverPlotId?: string | null;
  forcePlotFetch?: boolean;
}): Promise<DeliveryReceiptCatalog> {
  const localRows = await loadLocalDeliveryReceiptsForFarmer(params.farmerId);
  const deviceReceipts = normalizeLocalDeliveryReceipts(localRows, params.t);

  const existingLinks = await loadPlotServerLinks();
  let backendPlots: unknown[] = [];
  let plotServerLinks = existingLinks;
  let vouchers: unknown[] = [];
  let pendingReceipts: DeliveryReceiptRecord[] = [];

  if (hasSyncAuthSession()) {
    try {
      const [plotsRows, voucherPayload, pendingActions] = await Promise.all([
        fetchServerPlotListForUi({
          profileFarmerId: params.farmerId,
          localPlots: params.localPlots,
          force: params.forcePlotFetch === true,
        }),
        fetchVouchersForFarmer(params.farmerId),
        loadPendingSyncActions(),
      ]);
      const reconciled = reconcilePlotServerLinks(params.localPlots, plotsRows ?? [], existingLinks);
      await persistPlotServerLinks(reconciled);
      backendPlots = plotsRows ?? [];
      plotServerLinks = reconciled;
      vouchers = normalizeVoucherRows(voucherPayload);

      const plotIds = resolvePlotReceiptFilterIds({
        localPlotId: params.localPlotId,
        serverPlotId: params.serverPlotId,
        plotServerLinks,
      });
      const groupPlotId = params.serverPlotId ?? params.localPlotId ?? params.plotIdFilter ?? '';
      const plotName =
        params.localPlots.find((plot) => plot.id === params.localPlotId)?.name?.trim() ||
        params.t('plot_fallback');

      pendingReceipts = normalizePendingHarvestReceipts({
        actions: pendingActions.filter((action) => action.actionType === 'harvest'),
        plotIds: new Set(plotIds),
        groupPlotId,
        plotName,
        t: params.t,
      });
    } catch {
      backendPlots = [];
      plotServerLinks = existingLinks;
      vouchers = [];
      pendingReceipts = [];
    }
  }

  const mergedPlots = buildMergedHarvestPlots({
    backendPlots,
    localPlots: params.localPlots,
    farmerId: params.farmerId,
    plotServerLinks,
  });

  const synced = normalizeDeliveryReceipts({ vouchers, mergedPlots, t: params.t });
  const receipts = enrichAndDedupeDeliveryReceipts({
    deviceReceipts,
    pendingReceipts,
    synced,
    plotServerLinks,
  });

  return { receipts, backendPlots, plotServerLinks, vouchers };
}

export function findDeliveryReceiptById(
  receipts: readonly DeliveryReceiptRecord[],
  receiptId: string,
): DeliveryReceiptRecord | null {
  const id = receiptId.trim();
  if (!id) return null;
  return receipts.find((row) => row.id === id) ?? null;
}
