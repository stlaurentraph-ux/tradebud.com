'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { canCreateHarvestBatch } from '@/lib/harvest-capture-policy';
import { useCommercialProfile } from '@/lib/use-commercial-profile';

interface HarvestBatchCreateGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function HarvestBatchCreateGate({ children, fallback = null }: HarvestBatchCreateGateProps) {
  const { user } = useAuth();
  const { profile } = useCommercialProfile();

  if (!canCreateHarvestBatch(user, profile)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useCanCreateHarvestBatch(): boolean {
  const { user } = useAuth();
  const { profile } = useCommercialProfile();
  return canCreateHarvestBatch(user, profile);
}
