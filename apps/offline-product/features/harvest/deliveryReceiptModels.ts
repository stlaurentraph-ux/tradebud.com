import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';
import type { TranslateFn } from '@/features/i18n/translate';

export type DeliveryReceiptRecord = {
  id: string;
  plotId: string;
  plotName: string;
  kg: number;
  createdAt: string | null;
  qrCodeRef: string | null;
  buyerLabel: string;
  /** Queued on device — not yet on Tracebud servers. */
  pendingSync?: boolean;
};

export type PlotReceiptGroup = {
  plotId: string;
  plotName: string;
  receiptCount: number;
  receipts: DeliveryReceiptRecord[];
};

function voucherPlotId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  const row = voucher as { plot_id?: unknown; plotId?: unknown };
  return String(row.plot_id ?? row.plotId ?? '').trim();
}

function voucherQrRef(voucher: unknown): string | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { qr_code_ref?: unknown; qrCodeRef?: unknown };
  const ref = row.qr_code_ref ?? row.qrCodeRef;
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function voucherCreatedAt(voucher: unknown): string | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { created_at?: unknown; createdAt?: unknown };
  const raw = row.created_at ?? row.createdAt;
  return raw != null ? String(raw) : null;
}

function voucherKg(voucher: unknown): number {
  if (!voucher || typeof voucher !== 'object') return 0;
  const row = voucher as {
    kg?: unknown;
    kg_delivered?: unknown;
    weight_kg?: unknown;
  };
  const value = Number(row.kg ?? row.kg_delivered ?? row.weight_kg ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function voucherId(voucher: unknown): string {
  if (!voucher || typeof voucher !== 'object') return '';
  return String((voucher as { id?: unknown }).id ?? '').trim();
}

export function formatVoucherBuyerLabel(voucher: unknown, t: TranslateFn): string {
  if (!voucher || typeof voucher !== 'object') {
    return t('harvest_receipt_qr_generated');
  }
  const row = voucher as {
    intended_recipient_email?: unknown;
    intended_recipient_org_name?: unknown;
    buyer_org_name?: unknown;
    deliver_to_email?: unknown;
  };
  const email = String(
    row.intended_recipient_email ?? row.deliver_to_email ?? '',
  ).trim();
  if (email) return email;
  const org = String(row.intended_recipient_org_name ?? row.buyer_org_name ?? '').trim();
  if (org) return org;
  if (row.intended_recipient_email === null && row.intended_recipient_org_name === null) {
    // explicit columns missing — fall through
  }
  const tenantId = String(
    (voucher as { intended_recipient_tenant_id?: unknown }).intended_recipient_tenant_id ?? '',
  ).trim();
  if (tenantId) return t('harvest_receipt_buyer_assigned');
  return t('harvest_receipt_qr_generated');
}

function resolvePlotName(
  plotId: string,
  mergedPlots: readonly HarvestPlotOption[],
  voucher: unknown,
  t: TranslateFn,
): string {
  const fromMerged = mergedPlots.find((plot) => String(plot.id) === String(plotId));
  if (fromMerged?.name?.trim()) return fromMerged.name.trim();
  if (voucher && typeof voucher === 'object') {
    const plotName = (voucher as { plot_name?: unknown; plot_label?: unknown }).plot_name
      ?? (voucher as { plot_label?: unknown }).plot_label;
    if (plotName != null && String(plotName).trim()) return String(plotName).trim();
  }
  return t('plot_fallback');
}

export function normalizeDeliveryReceipts(params: {
  vouchers: unknown[];
  mergedPlots: readonly HarvestPlotOption[];
  t: TranslateFn;
}): DeliveryReceiptRecord[] {
  return params.vouchers
    .map((voucher) => {
      const plotId = voucherPlotId(voucher);
      const id = voucherId(voucher);
      if (!id) return null;
      return {
        id,
        plotId: plotId || 'unknown',
        plotName: resolvePlotName(plotId, params.mergedPlots, voucher, params.t),
        kg: voucherKg(voucher),
        createdAt: voucherCreatedAt(voucher),
        qrCodeRef: voucherQrRef(voucher),
        buyerLabel: formatVoucherBuyerLabel(voucher, params.t),
      } satisfies DeliveryReceiptRecord;
    })
    .filter((row) => row != null)
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
}

export function groupDeliveryReceiptsByPlot(receipts: DeliveryReceiptRecord[]): PlotReceiptGroup[] {
  const byPlot = new Map<string, PlotReceiptGroup>();
  for (const receipt of receipts) {
    const key = receipt.plotId || 'unknown';
    const existing = byPlot.get(key);
    if (existing) {
      existing.receipts.push(receipt);
      existing.receiptCount += 1;
      continue;
    }
    byPlot.set(key, {
      plotId: receipt.plotId,
      plotName: receipt.plotName,
      receiptCount: 1,
      receipts: [receipt],
    });
  }
  return [...byPlot.values()].sort((a, b) => a.plotName.localeCompare(b.plotName));
}

export function formatReceiptDateLabel(createdAt: string | null): string {
  if (!createdAt) return '—';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export type ReceiptRecipientSummary = {
  label: string;
  tone: 'default' | 'pending' | 'qr' | 'muted';
  showQrIcon: boolean;
};

/** Short label for receipt list rows (buyer email/org, QR status, or upload state). */
export function formatReceiptRecipientSummary(
  receipt: Pick<DeliveryReceiptRecord, 'buyerLabel' | 'qrCodeRef' | 'pendingSync'>,
  t: TranslateFn,
): ReceiptRecipientSummary {
  if (receipt.qrCodeRef?.trim()) {
    const genericQr = receipt.buyerLabel === t('harvest_receipt_qr_generated');
    const genericAssigned = receipt.buyerLabel === t('harvest_receipt_buyer_assigned');
    const stalePending = receipt.buyerLabel === t('harvest_receipt_pending_sync');
    if (genericQr || genericAssigned || stalePending) {
      return {
        label: genericAssigned
          ? t('harvest_receipt_buyer_assigned')
          : t('harvest_receipt_qr_generated'),
        tone: 'qr',
        showQrIcon: true,
      };
    }
    return { label: receipt.buyerLabel, tone: 'qr', showQrIcon: true };
  }
  if (receipt.pendingSync) {
    return {
      label: t('harvest_receipt_pending_sync'),
      tone: 'pending',
      showQrIcon: false,
    };
  }
  return {
    label: t('harvest_receipt_qr_generating'),
    tone: 'muted',
    showQrIcon: false,
  };
}

/** Human-readable buyer line for receipt detail (not raw sync placeholders). */
export function formatReceiptDeliverToLabel(
  receipt: Pick<DeliveryReceiptRecord, 'buyerLabel' | 'qrCodeRef' | 'pendingSync'>,
  t: TranslateFn,
): string {
  const buyer = receipt.buyerLabel?.trim() ?? '';
  const pendingSyncLabel = t('harvest_receipt_pending_sync');
  const qrGenerated = t('harvest_receipt_qr_generated');
  const buyerAssigned = t('harvest_receipt_buyer_assigned');
  const unspecified = t('harvest_receipt_buyer_unspecified');

  if (receipt.qrCodeRef?.trim()) {
    if (!buyer || buyer === pendingSyncLabel || buyer === qrGenerated) {
      return qrGenerated;
    }
    if (buyer === buyerAssigned) {
      return buyerAssigned;
    }
    return buyer;
  }

  if (receipt.pendingSync) {
    return pendingSyncLabel;
  }

  if (!buyer || buyer === pendingSyncLabel) {
    return unspecified;
  }

  return buyer;
}

type PendingHarvestPayload = {
  plotId?: string;
  kg?: number;
  intended_recipient_email?: string;
  intended_recipient_org_name?: string;
};

export function normalizePendingHarvestReceipts(params: {
  actions: ReadonlyArray<{ id: number; createdAt: number; payloadJson: string }>;
  plotIds: ReadonlySet<string>;
  groupPlotId: string;
  plotName: string;
  t: TranslateFn;
  /** When groupPlotId is empty, resolve display names from on-device plots. */
  localPlots?: ReadonlyArray<{ id: string; name?: string }>;
}): DeliveryReceiptRecord[] {
  return params.actions
    .map((action) => {
      let payload: PendingHarvestPayload = {};
      try {
        payload = JSON.parse(action.payloadJson) as PendingHarvestPayload;
      } catch {
        return null;
      }
      const sourcePlotId = String(payload.plotId ?? '').trim();
      if (!sourcePlotId) return null;
      if (params.plotIds.size > 0 && !params.plotIds.has(sourcePlotId)) return null;
      const kg = Number(payload.kg ?? 0);
      if (!Number.isFinite(kg) || kg <= 0) return null;

      const email = String(payload.intended_recipient_email ?? '').trim();
      const org = String(payload.intended_recipient_org_name ?? '').trim();
      const buyerLabel = email || org || params.t('harvest_receipt_pending_sync');
      const plotId = params.groupPlotId?.trim() || sourcePlotId;
      const localPlotName = params.localPlots
        ?.find((plot) => plot.id === sourcePlotId)
        ?.name?.trim();
      const plotName = params.groupPlotId?.trim()
        ? params.plotName
        : localPlotName || params.plotName;

      return {
        id: `pending-${action.id}`,
        plotId,
        plotName,
        kg,
        createdAt: new Date(action.createdAt).toISOString(),
        qrCodeRef: null,
        buyerLabel,
        pendingSync: true,
      } satisfies DeliveryReceiptRecord;
    })
    .filter((row) => row != null)
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
}
