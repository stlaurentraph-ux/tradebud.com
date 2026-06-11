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
