/** Normalize harvest voucher list API responses (raw array or `{ vouchers }` wrapper). */
export function normalizeVoucherRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { vouchers?: unknown }).vouchers)) {
    return (payload as { vouchers: unknown[] }).vouchers;
  }
  return [];
}
