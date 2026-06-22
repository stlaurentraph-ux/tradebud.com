import { fetchVouchersForFarmer } from '@/features/api/postPlot';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import {
  normalizeDeliveryReceipts,
  normalizePendingHarvestReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import {
  buildAllPlotReceiptFilterIds,
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
import {
  filterDismissedDeliveryReceipts,
  loadDismissedDeliveryReceiptIds,
} from '@/features/harvest/dismissedDeliveryReceipts';

export type DeliveryReceiptCatalog = {
  receipts: DeliveryReceiptRecord[];
  deviceReceipts: DeliveryReceiptRecord[];
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
  const pendingActions = await loadPendingSyncActions().catch(() => []);

  if (hasSyncAuthSession()) {
    try {
      const [plotsRows, voucherPayload] = await Promise.all([
        fetchServerPlotListForUi({
          profileFarmerId: params.farmerId,
          localPlots: params.localPlots,
          force: params.forcePlotFetch === true,
        }),
        fetchVouchersForFarmer(params.farmerId),
      ]);
      const reconciled = reconcilePlotServerLinks(params.localPlots, plotsRows ?? [], existingLinks);
      await persistPlotServerLinks(reconciled);
      backendPlots = plotsRows ?? [];
      plotServerLinks = reconciled;
      vouchers = normalizeVoucherRows(voucherPayload);
    } catch {
      backendPlots = [];
      plotServerLinks = existingLinks;
      vouchers = [];
    }
  }

  const scopedPlotIds =
    params.localPlotId || params.serverPlotId || params.plotIdFilter
      ? new Set(
          resolvePlotReceiptFilterIds({
            localPlotId: params.localPlotId,
            serverPlotId: params.serverPlotId,
            plotServerLinks,
          }),
        )
      : buildAllPlotReceiptFilterIds({
          plots: params.localPlots,
          backendPlots,
          plotServerLinks,
        });

  const groupPlotId = params.serverPlotId ?? params.localPlotId ?? params.plotIdFilter ?? '';
  const plotName =
    params.localPlots.find((plot) => plot.id === params.localPlotId)?.name?.trim() ||
    params.t('plot_fallback');

  const pendingReceipts = normalizePendingHarvestReceipts({
    actions: pendingActions.filter((action) => action.actionType === 'harvest'),
    plotIds: scopedPlotIds,
    groupPlotId,
    plotName,
    t: params.t,
    localPlots: params.localPlots,
  });

  const mergedPlots = buildMergedHarvestPlots({
    backendPlots,
    localPlots: params.localPlots,
    farmerId: params.farmerId,
    plotServerLinks,
  });

  const synced = normalizeDeliveryReceipts({ vouchers, mergedPlots, t: params.t });
  const dismissedIds = await loadDismissedDeliveryReceiptIds().catch(() => new Set<string>());
  const receipts = filterDismissedDeliveryReceipts(
    enrichAndDedupeDeliveryReceipts({
      deviceReceipts,
      pendingReceipts,
      synced,
      plotServerLinks,
    }),
    dismissedIds,
  );

  return { receipts, deviceReceipts, backendPlots, plotServerLinks, vouchers };
}
