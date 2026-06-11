import { useEffect } from 'react';

import { setAnalyticsUser } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';

/** Syncs farmer id to Sentry user context when profile loads. */
export function ObservabilityBootstrap() {
  const { farmer } = useAppState();

  useEffect(() => {
    setAnalyticsUser(farmer?.id);
  }, [farmer?.id]);

  return null;
}
