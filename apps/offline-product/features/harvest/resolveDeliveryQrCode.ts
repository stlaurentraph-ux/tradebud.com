function voucherQrRef(voucher: unknown): string | null {
  if (!voucher || typeof voucher !== 'object') return null;
  const row = voucher as { qr_code_ref?: unknown; qrCodeRef?: unknown };
  const ref = row.qr_code_ref ?? row.qrCodeRef;
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readHarvestSubmitQrCodeRef(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const row = response as {
    voucher?: { qr_code_ref?: unknown; qrCodeRef?: unknown };
    qr_code_ref?: unknown;
    qrCodeRef?: unknown;
  };
  const fromVoucher = voucherQrRef(row.voucher);
  if (fromVoucher) return fromVoucher;
  const top = row.qr_code_ref ?? row.qrCodeRef;
  if (top == null) return null;
  const trimmed = String(top).trim();
  return trimmed.length > 0 ? trimmed : null;
}
