'use client';

import { useEffect, useState, startTransition } from 'react';

interface PackageVoucher {
  id: string;
  status?: string;
  created_at?: string;
  harvest_date?: string | null;
  plot_id?: string;
  plot_name?: string | null;
  plot_kind?: string | null;
  declared_area_ha?: number | null;
}

interface PackageDetailData {
  package: {
    id: string;
    label?: string | null;
  };
  vouchers: PackageVoucher[];
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePackageDetail(packageId: string | null) {
  const [data, setData] = useState<PackageDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      startTransition(() => {
        setData(null);
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setIsLoading(true);
      setError(null);
    });

    fetch(`/api/harvest/packages/${encodeURIComponent(packageId)}`, {
      method: 'GET',
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          package?: PackageDetailData['package'];
          vouchers?: PackageVoucher[];
        };
        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load package details.');
        }
        if (!cancelled) {
          setData({
            package: body.package ?? { id: packageId },
            vouchers: body.vouchers ?? [],
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load package details.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  return { data, isLoading, error };
}
