import { resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';

const MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

function voucherPlotId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  const row = voucher as { plot_id?: unknown; plotId?: unknown };
  return String(row.plot_id ?? row.plotId ?? '').trim();
}

function voucherKg(voucher: unknown): number {
  if (!voucher || typeof voucher !== 'object') return 0;
  const row = voucher as { kg?: unknown; kg_delivered?: unknown; weight_kg?: unknown };
  const value = Number(row.kg ?? row.kg_delivered ?? row.weight_kg ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function voucherCreatedAtMs(voucher: unknown): number | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { created_at?: unknown; createdAt?: unknown };
  const raw = row.created_at ?? row.createdAt;
  if (raw == null) return null;
  const ms = new Date(String(raw)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function voucherQrRef(voucher: unknown): string | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { qr_code_ref?: unknown; qrCodeRef?: unknown };
  const ref = row.qr_code_ref ?? row.qrCodeRef;
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Find the server voucher that matches a just-logged (or queued) delivery snapshot. */
export function findSyncedVoucherForLoggedDelivery(params: {
  delivery: { plotId: string; kg: number; recordedAt: number };
  vouchers: unknown[];
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks: PlotServerLinks;
}): string | null {
  const localPlot = params.localPlots.find((plot) => plot.id === params.delivery.plotId);
  const serverPlotId = localPlot
    ? resolveServerPlotIdForLocal(localPlot, params.backendPlots, params.plotServerLinks)
    : null;
  const plotIds = new Set(
    [params.delivery.plotId, serverPlotId].filter((id): id is string => Boolean(id)),
  );

  let bestQr: string | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const voucher of params.vouchers) {
    if (!plotIds.has(voucherPlotId(voucher))) continue;
    if (Math.abs(voucherKg(voucher) - params.delivery.kg) > 0.5) continue;

    const createdMs = voucherCreatedAtMs(voucher);
    const delta =
      createdMs != null
        ? Math.abs(createdMs - params.delivery.recordedAt)
        : Number.POSITIVE_INFINITY;
    if (delta > MATCH_WINDOW_MS) continue;
    if (delta < bestDelta) {
      bestDelta = delta;
      bestQr = voucherQrRef(voucher);
    }
  }

  return bestQr;
}
