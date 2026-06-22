import { getAuthenticatedSupabaseClient } from '@/features/api/syncAuthSession';
import { harvestDateIsoFromMs } from '@/features/harvest/harvestDeliveryDate';
import { findServerVoucherForLocalReceipt } from '@/features/harvest/findServerVoucherForLocalReceipt';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import type { LocalDeliveryReceiptRow } from '@/features/state/persistence';
import {
  voucherHasHarvestDate,
  voucherId,
} from '@/features/harvest/voucherRowFields';

type VoucherHarvestDateRow = {
  id: string;
  harvest_transaction: { harvest_date: string | null } | { harvest_date: string | null }[] | null;
};

/** Attach farmer-logged delivery dates from Postgres when the Tracebud API omits them. */
export async function supplementVoucherHarvestDatesFromSupabase(
  vouchers: readonly unknown[],
): Promise<unknown[]> {
  if (vouchers.length === 0) return [];

  const ids = vouchers.map((row) => voucherId(row)).filter(Boolean);
  if (ids.length === 0) return [...vouchers];

  const supabase = await getAuthenticatedSupabaseClient().catch(() => null);
  if (!supabase) return [...vouchers];

  const { data, error } = await supabase
    .from('voucher')
    .select('id, harvest_transaction(harvest_date)')
    .in('id', ids);

  if (error || !data?.length) {
    return [...vouchers];
  }

  const harvestDateByVoucherId = new Map<string, string>();
  for (const row of data as VoucherHarvestDateRow[]) {
    const id = String(row.id ?? '').trim();
    if (!id) continue;
    const tx = Array.isArray(row.harvest_transaction)
      ? row.harvest_transaction[0]
      : row.harvest_transaction;
    const harvestDate = tx?.harvest_date != null ? String(tx.harvest_date).trim() : '';
    if (harvestDate) {
      harvestDateByVoucherId.set(id, harvestDate);
    }
  }

  if (harvestDateByVoucherId.size === 0) {
    return [...vouchers];
  }

  return vouchers.map((voucher) => {
    const id = voucherId(voucher);
    const harvestDate = id ? harvestDateByVoucherId.get(id) : undefined;
    if (!harvestDate || voucherHasHarvestDate(voucher)) {
      return voucher;
    }
    return {
      ...(voucher as object),
      harvest_date: harvestDate,
    };
  });
}

/** Fill missing server harvest dates from on-device receipt rows (iPhone source of truth). */
export function enrichVouchersWithLocalDeliveryDates(params: {
  vouchers: readonly unknown[];
  localRows: readonly LocalDeliveryReceiptRow[];
  localPlots: Plot[];
  backendPlots: readonly unknown[];
  plotServerLinks: PlotServerLinks;
}): unknown[] {
  if (params.vouchers.length === 0 || params.localRows.length === 0) {
    return [...params.vouchers];
  }

  return params.vouchers.map((voucher) => {
    if (voucherHasHarvestDate(voucher)) return voucher;

    for (const row of params.localRows) {
      const receipt = {
        id: row.id,
        farmerId: row.farmerId,
        localPlotId: row.localPlotId,
        serverPlotId: row.serverPlotId,
        kg: row.kg,
        recordedAt: row.recordedAt,
        qrCodeRef: row.qrCodeRef,
        pendingSync: row.pendingSync,
        buyerLabel: row.buyerLabel,
        plotName: row.plotName,
      };
      const matched = findServerVoucherForLocalReceipt({
        receipt,
        vouchers: [voucher],
        localPlots: params.localPlots,
        backendPlots: params.backendPlots,
        plotServerLinks: params.plotServerLinks,
      });
      if (!matched || !row.recordedAt) continue;

      return {
        ...(voucher as object),
        harvest_date: harvestDateIsoFromMs(row.recordedAt),
        client_event_id: row.id.startsWith('harvest-') ? row.id : undefined,
      };
    }

    return voucher;
  });
}
