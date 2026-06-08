'use client';

import { useCallback, useEffect, useState, startTransition } from 'react';
import type { DDSPackage } from '@/types';
import {
  mapBackendPackageDetailToDdsPackage,
  type BackendPackageDetail,
} from '@/lib/harvest-package-mapper';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePackageDetail(packageId: string | null, fallbackTenantId: string | null) {
  const [pkg, setPkg] = useState<DDSPackage | null>(null);
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
        if (!cancelled) {
          setPkg(
            mapBackendPackageDetailToDdsPackage(
              {
                package: body.package,
                vouchers: body.vouchers ?? [],
              },
              fallbackTenantId ?? 'unknown_tenant',
            ),
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPkg(null);
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

  return { pkg, isLoading, error, refetch };
}
