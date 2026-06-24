export type TenantHarvestVoucher = {
  id: string;
  farmer_id: string;
  transaction_id: string;
  qr_code_ref: string;
  status: string | null;
  created_at: string;
  plot_id: string | null;
  plot_name: string | null;
  plot_status: string | null;
  kg: number | null;
  harvest_date: string | null;
  dds_package_id: string | null;
  dds_package_status: string | null;
  eligible_for_package: boolean;
  directed_to_tenant?: boolean;
};

export type CreatedHarvestPackage = {
  id: string;
  farmer_id: string;
  label: string | null;
  status: string;
  created_at: string;
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string | { message?: string };
  };
  if (typeof body.message === 'string') {
    return body.message;
  }
  if (body.message && typeof body.message === 'object' && typeof body.message.message === 'string') {
    return body.message.message;
  }
  return body.error ?? fallback;
}

export async function listTenantHarvestVouchers(): Promise<TenantHarvestVoucher[]> {
  const response = await fetch('/api/harvest/vouchers?scope=tenant', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to load harvest vouchers.'));
  }
  const body = (await response.json()) as { vouchers?: TenantHarvestVoucher[] };
  return Array.isArray(body.vouchers) ? body.vouchers : [];
}

export function findTenantVoucherByQrRef(
  vouchers: TenantHarvestVoucher[],
  qrRef: string,
): TenantHarvestVoucher | null {
  const normalized = qrRef.trim().toUpperCase();
  if (!normalized) return null;
  return (
    vouchers.find((voucher) => voucher.qr_code_ref.trim().toUpperCase() === normalized) ?? null
  );
}

export async function claimTenantVoucherByQrRef(
  qrRef: string,
): Promise<TenantHarvestVoucher | TenantHarvestVoucher[] | null> {
  const response = await fetch('/api/harvest/vouchers/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ qrRef: qrRef.trim() }),
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as {
    voucher?: TenantHarvestVoucher;
    vouchers?: TenantHarvestVoucher[];
  };
  if (Array.isArray(body.vouchers) && body.vouchers.length > 0) {
    return body.vouchers;
  }
  return body.voucher ?? null;
}

export async function lookupTenantVoucherByQrRef(qrRef: string): Promise<TenantHarvestVoucher | null> {
  const vouchers = await listTenantHarvestVouchers();
  const direct = findTenantVoucherByQrRef(vouchers, qrRef);
  if (direct) return direct;

  const claimed = await claimTenantVoucherByQrRef(qrRef);
  if (Array.isArray(claimed)) {
    return claimed[0] ?? null;
  }
  return claimed;
}

export async function lookupTenantIntakeByRef(
  input: string,
): Promise<TenantHarvestVoucher[]> {
  const vouchers = await listTenantHarvestVouchers();
  const { parseDeliveryIntakeRef } = await import('@/lib/delivery-intake-qr');
  const parsed = parseDeliveryIntakeRef(input);
  if (!parsed) return [];

  if (parsed.kind === 'voucher') {
    const direct = findTenantVoucherByQrRef(vouchers, parsed.ref);
    if (direct) return [direct];
    const claimed = await claimTenantVoucherByQrRef(parsed.ref);
    if (Array.isArray(claimed)) return claimed;
    return claimed ? [claimed] : [];
  }

  const claimed = await claimTenantVoucherByQrRef(parsed.ref);
  if (Array.isArray(claimed)) return claimed;
  return claimed ? [claimed] : [];
}

export async function createHarvestPackage(input: {
  voucherIds: string[];
  label?: string;
}): Promise<CreatedHarvestPackage> {
  const response = await fetch('/api/harvest/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      voucherIds: input.voucherIds,
      label: input.label?.trim() || undefined,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create package.'));
  }
  return (await response.json()) as CreatedHarvestPackage;
}

export function buildPackageLabel(input: {
  supplier_name: string;
  season: string;
  year: number;
  notes?: string;
}): string {
  const supplier = input.supplier_name.trim();
  const base = `${supplier} — Season ${input.season} ${input.year}`;
  const notes = input.notes?.trim();
  return notes ? `${base} — ${notes}` : base;
}
