'use client';

import { useMemo } from 'react';
import type { DDSPackage } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { resolveHarvestPackageScope } from '@/lib/harvest-package-scope';
import { useHarvestPackages } from '@/lib/use-harvest-packages';

export function usePackages(options?: { scope?: 'tenant' | 'shared' }) {
  const { user } = useAuth();
  const scope = options?.scope ?? resolveHarvestPackageScope(user?.active_role);
  const { packages, isLoading, error } = useHarvestPackages(user?.tenant_id ?? null, { scope });

  return { packages, isLoading, error };
}

export function usePackageById(id: string | null) {
  const { packages, isLoading, error } = usePackages();
  const pkg = useMemo(() => packages.find((item) => item.id === id) ?? null, [packages, id]);
  return { pkg, isLoading, error };
}

