'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DDSPackage } from '@/types';

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function useHarvestPackages(tenantId: string | null) {
  const [packages, setPackages] = useState<DDSPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!tenantId) {
        setPackages([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/harvest/packages', {
          method: 'GET',
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Packages API unavailable.');
        }

        const body = (await response.json()) as
          | { packages?: DDSPackage[]; data?: DDSPackage[] }
          | DDSPackage[];
        const data = Array.isArray(body)
          ? body
          : Array.isArray(body.packages)
            ? body.packages
            : Array.isArray(body.data)
              ? body.data
              : [];

        if (!cancelled) setPackages(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load packages.');
          setPackages([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadTick]);

  const countsByStatus = useMemo(() => {
    return packages.reduce<Record<DDSPackage['status'], number>>(
      (acc, pkg) => {
        acc[pkg.status] = (acc[pkg.status] ?? 0) + 1;
        return acc;
      },
      {
        DRAFT: 0,
        READY: 0,
        SEALED: 0,
        SUBMITTED: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        ARCHIVED: 0,
        ON_HOLD: 0,
      },
    );
  }, [packages]);

  return { packages, countsByStatus, isLoading, error, reload };
}
