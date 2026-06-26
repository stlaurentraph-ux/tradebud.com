'use client';

import { useCallback, useEffect, useState, startTransition } from 'react';
import type { DDSPackage } from '@/types';
import { useDemoData } from '@/lib/demo-data-context';
import { mockPackages } from '@/lib/mocks';
import type { BackendPackageDetailVoucher } from '@/lib/harvest-package-mapper';
import { getHarvestPackageById } from '@/lib/harvest-package-service';

export function sumPackageVoucherKg(vouchers: BackendPackageDetailVoucher[]): number {
  return vouchers.reduce((sum, voucher) => {
    const kg = Number(voucher.kg ?? 0);
    return sum + (Number.isFinite(kg) ? kg : 0);
  }, 0);
}

export function usePackageDetail(packageId: string | null, fallbackTenantId: string | null) {
  const { demoDataEnabled } = useDemoData();
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

    if (demoDataEnabled) {
      const found = mockPackages.find((item) => item.id === packageId) ?? null;
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
        setPkg(found);
        setVouchers([]);
        setIsLoading(false);
        if (!found) setError('Package not found.');
      }
      return () => {
        cancelled = true;
      };
    }

    getHarvestPackageById(packageId, fallbackTenantId ?? 'unknown_tenant')
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setPkg(null);
          setVouchers([]);
          setError('Package not found.');
          return;
        }
        const voucherKg = sumPackageVoucherKg(result.vouchers);
        setVouchers(result.vouchers);
        setPkg({
          ...result.pkg,
          total_weight_kg: voucherKg > 0 ? voucherKg : result.pkg.total_weight_kg,
        });
        setError(null);
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
  }, [packageId, fallbackTenantId, refreshToken, demoDataEnabled]);

  return { pkg, vouchers, isLoading, error, refetch };
}
