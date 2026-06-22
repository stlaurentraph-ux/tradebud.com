import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
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
import { getAccessTokenFromSupabaseWithTimeout } from '@/features/api/syncAuthSession';
import type { Plot } from '@/features/state/AppStateContext';
import { loadFieldScopedDeliveryReceipts } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { persistServerVouchersAsLocalReceipts } from '@/features/sync/restoreLocalDeliveryReceiptsFromServer';
import { enrichVouchersWithLocalDeliveryDates } from '@/features/harvest/supplementVoucherHarvestDates';
import {
  loadAllLocalDeliveryReceipts,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
} from '@/features/state/persistence';
import {
  filterDismissedDeliveryReceipts,
  loadDismissedDeliveryReceiptIds,
} from '@/features/harvest/dismissedDeliveryReceipts';
import type { TranslateFn } from '@/features/i18n/translate';

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
  /** UI signed-in state — fetch server vouchers when true even if token refresh is slow. */
  isSignedIn?: boolean;
  plotIdFilter?: string | null;
  localPlotId?: string | null;
  serverPlotId?: string | null;
  forcePlotFetch?: boolean;
}): Promise<DeliveryReceiptCatalog> {
  const existingLinks = await loadPlotServerLinks();
  let backendPlots: unknown[] = [];
  let plotServerLinks = existingLinks;
  let vouchers: unknown[] = [];
  let deviceReceipts: DeliveryReceiptRecord[] = [];
  const pendingActions = await loadPendingSyncActions().catch(() => []);

  let receiptScope = {
    rows: [] as Awaited<ReturnType<typeof loadFieldScopedDeliveryReceipts>>['rows'],
    apiFarmerId: params.farmerId,
    ownedFarmerIds: [] as string[],
    voucherFarmerIds: [] as string[],
  };

  const shouldUseServer = params.isSignedIn === true;

  if (shouldUseServer) {
    receiptScope = await loadFieldScopedDeliveryReceipts({
      profileFarmerId: params.farmerId,
      localPlots: params.localPlots,
      isSignedIn: true,
    });
    deviceReceipts = normalizeLocalDeliveryReceipts(receiptScope.rows, params.t);

    let plotsRows: unknown[] = [];
    try {
      plotsRows = await fetchServerPlotListForUi({
        profileFarmerId: params.farmerId,
        localPlots: params.localPlots,
        ownedFarmerIds: receiptScope.ownedFarmerIds,
        resolvedFarmerId: receiptScope.apiFarmerId,
        force: params.forcePlotFetch === true,
      });
      const reconciled = reconcilePlotServerLinks(params.localPlots, plotsRows ?? [], existingLinks);
      await persistPlotServerLinks(reconciled);
      backendPlots = plotsRows ?? [];
      plotServerLinks = reconciled;
    } catch {
      backendPlots = [];
      plotServerLinks = existingLinks;
    }

    // fetchMergedServerVouchers resolves its own token; do not gate on a slow first read.
    try {
      await getAccessTokenFromSupabaseWithTimeout().catch(() => null);
      const voucherPayload = await fetchMergedServerVouchers(receiptScope.voucherFarmerIds);
      vouchers = enrichVouchersWithLocalDeliveryDates({
        vouchers: normalizeVoucherRows(voucherPayload),
        localRows: receiptScope.rows,
        localPlots: params.localPlots,
        backendPlots,
        plotServerLinks,
      });
      await persistServerVouchersAsLocalReceipts({
        vouchers,
        storageFarmerId: params.farmerId,
        localPlots: params.localPlots,
        backendPlots,
        plotServerLinks,
      });
      const refreshedRows = await loadAllLocalDeliveryReceipts();
      receiptScope = { ...receiptScope, rows: refreshedRows };
      deviceReceipts = normalizeLocalDeliveryReceipts(refreshedRows, params.t);
    } catch {
      vouchers = [];
    }
  } else {
    receiptScope = await loadFieldScopedDeliveryReceipts({
      profileFarmerId: params.farmerId,
      localPlots: params.localPlots,
      isSignedIn: false,
    });
    deviceReceipts = normalizeLocalDeliveryReceipts(receiptScope.rows, params.t);
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
