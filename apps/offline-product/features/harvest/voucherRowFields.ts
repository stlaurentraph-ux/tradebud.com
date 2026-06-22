/** Shared field extractors for harvest voucher API rows (snake or camel). */

import { parseRecordedAtFromClientEventId } from '@/features/harvest/harvestDeliveryDate';

export function voucherPlotId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  const row = voucher as { plot_id?: unknown; plotId?: unknown };
  return String(row.plot_id ?? row.plotId ?? '').trim();
}

export function voucherId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  return String((voucher as { id?: unknown }).id ?? '').trim();
}

export function voucherKg(voucher: unknown): number {
  if (!voucher || typeof voucher !== 'object') return 0;
  const row = voucher as { kg?: unknown; kg_delivered?: unknown; weight_kg?: unknown };
  const value = Number(row.kg ?? row.kg_delivered ?? row.weight_kg ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function voucherCreatedAtMs(voucher: unknown): number {
  if (!voucher || typeof voucher !== 'object') return Date.now();
  const row = voucher as { created_at?: unknown; createdAt?: unknown };
  const raw = row.created_at ?? row.createdAt;
  if (raw == null) return Date.now();
  const ms = new Date(String(raw)).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

function voucherHarvestDateMs(voucher: unknown): number | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { harvest_date?: unknown; harvestDate?: unknown };
  const raw = row.harvest_date ?? row.harvestDate;
  if (raw == null) return null;
  const ms = new Date(String(raw)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function voucherHasHarvestDate(voucher: unknown): boolean {
  return voucherHarvestDateMs(voucher) != null;
}

function voucherClientEventId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  const row = voucher as { client_event_id?: unknown; clientEventId?: unknown };
  return String(row.client_event_id ?? row.clientEventId ?? '').trim();
}

/** Prefer farmer-logged delivery date over server ingest/upload timestamps. */
export function voucherDeliveredAtMs(voucher: unknown): number {
  const harvestDateMs = voucherHarvestDateMs(voucher);
  if (harvestDateMs != null) return harvestDateMs;

  const clientEventId = voucherClientEventId(voucher);
  if (clientEventId) {
    const fromClientEvent = parseRecordedAtFromClientEventId(clientEventId);
    if (fromClientEvent != null) return fromClientEvent;
  }

  return voucherCreatedAtMs(voucher);
}

export function voucherQrRef(voucher: unknown): string | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { qr_code_ref?: unknown; qrCodeRef?: unknown };
  const ref = row.qr_code_ref ?? row.qrCodeRef;
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function voucherPlotName(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  const row = voucher as { plot_name?: unknown; plot_label?: unknown; plotName?: unknown };
  return String(row.plot_name ?? row.plot_label ?? row.plotName ?? '').trim();
}
