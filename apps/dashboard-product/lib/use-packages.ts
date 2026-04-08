'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DDSPackage } from '@/types';
import { getPackagesSnapshot, listPackages, subscribePackages } from '@/lib/package-service';

export function usePackages() {
  const [packages, setPackages] = useState<DDSPackage[]>(() => getPackagesSnapshot());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listPackages();
        if (!cancelled) setPackages(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load packages.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribePackages(() => {
      if (!cancelled) setPackages(getPackagesSnapshot());
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { packages, isLoading, error };
}

export function usePackageById(id: string | null) {
  const { packages, isLoading, error } = usePackages();
  const pkg = useMemo(() => packages.find((item) => item.id === id) ?? null, [packages, id]);
  return { pkg, isLoading, error };
}

