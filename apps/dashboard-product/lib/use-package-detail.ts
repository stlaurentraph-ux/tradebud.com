'use client';

import { useCallback, useEffect, useState, startTransition } from 'react';
import type { DDSPackage } from '@/types';
import {
  mapBackendPackageDetailToDdsPackage,
  type BackendPackageDetail,
  type BackendPackageDetailVoucher,
} from '@/lib/harvest-package-mapper';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function sumPackageVoucherKg(vouchers: BackendPackageDetailVoucher[]): number {
  return vouchers.reduce((sum, voucher) => {
    const kg = Number(voucher.kg ?? 0);
    return sum + (Number.isFinite(kg) ? kg : 0);
  }, 0);
}

export function usePackageDetail(packageId: string | null, fallbackTenantId: string | null) {
  const [pkg, setPkg] = useState<DDSPackage | null>(null);
  const [vouchers, setVouchers] = useState<BackendPackageDetailVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refetch = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!packageId) {
      startTransition(() => {
        setPkg(null);
        setVouchers([]);
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
          package?: BackendPackageDetail['package'];
          vouchers?: BackendPackageDetail['vouchers'];
        };
        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load package details.');
        }
        if (!body.package?.id) {
          throw new Error('Package not found.');
        }
        const detailVouchers = body.vouchers ?? [];
        if (!cancelled) {
          setVouchers(detailVouchers);
          const mapped = mapBackendPackageDetailToDdsPackage(
            {
              package: body.package,
              vouchers: detailVouchers,
            },
            fallbackTenantId ?? 'unknown_tenant',
          );
          const voucherKg = sumPackageVoucherKg(detailVouchers);
          setPkg({
            ...mapped,
            total_weight_kg: voucherKg > 0 ? voucherKg : mapped.total_weight_kg,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPkg(null);
          setVouchers([]);
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
  }, [packageId, fallbackTenantId, refreshToken]);

  return { pkg, vouchers, isLoading, error, refetch };
}
