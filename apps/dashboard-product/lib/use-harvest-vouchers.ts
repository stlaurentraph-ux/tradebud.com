'use client';

import { useEffect, useMemo, useState } from 'react';

export type HarvestVoucher = {
  id: string;
  farmer_id: string;
  qr_code_ref: string;
  status: string | null;
  created_at: string;
  plot_id: string | null;
  plot_name: string | null;
  kg: number | null;
  harvest_date: string | null;
  dds_package_id: string | null;
  dds_package_status: string | null;
  plot_status: string | null;
  eligible_for_package: boolean;
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizeVouchers(payload: unknown): HarvestVoucher[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { vouchers?: unknown }).vouchers)
      ? ((payload as { vouchers: unknown[] }).vouchers ?? [])
      : [];

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const voucher = row as Record<string, unknown>;
      const id = typeof voucher.id === 'string' ? voucher.id : '';
      if (!id) return null;
      return {
        id,
        farmer_id: typeof voucher.farmer_id === 'string' ? voucher.farmer_id : '',
        qr_code_ref: typeof voucher.qr_code_ref === 'string' ? voucher.qr_code_ref : '',
        status: typeof voucher.status === 'string' ? voucher.status : null,
        created_at: typeof voucher.created_at === 'string' ? voucher.created_at : '',
        plot_id: typeof voucher.plot_id === 'string' ? voucher.plot_id : null,
        plot_name: typeof voucher.plot_name === 'string' ? voucher.plot_name : null,
        kg: typeof voucher.kg === 'number' ? voucher.kg : voucher.kg != null ? Number(voucher.kg) : null,
        harvest_date: typeof voucher.harvest_date === 'string' ? voucher.harvest_date : null,
        dds_package_id:
          typeof voucher.dds_package_id === 'string' ? voucher.dds_package_id : null,
        dds_package_status:
          typeof voucher.dds_package_status === 'string' ? voucher.dds_package_status : null,
        plot_status: typeof voucher.plot_status === 'string' ? voucher.plot_status : null,
        eligible_for_package: voucher.eligible_for_package === true,
      } satisfies HarvestVoucher;
    })
    .filter((row): row is HarvestVoucher => Boolean(row));
}

export function useHarvestVouchers(tenantId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? Boolean(tenantId);
  const [vouchers, setVouchers] = useState<HarvestVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!tenantId || !enabled) {
        setVouchers([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/harvest/vouchers?scope=tenant', {
          method: 'GET',
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
          throw new Error(body.error ?? body.message ?? 'Vouchers API unavailable.');
        }

        const body = (await response.json()) as unknown;
        if (!cancelled) {
          setVouchers(normalizeVouchers(body));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load vouchers.');
          setVouchers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, enabled]);

  const availableVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.eligible_for_package),
    [vouchers],
  );

  return { vouchers, availableVouchers, isLoading, error };
}
