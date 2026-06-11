'use client';

import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth-context';
import { DASHBOARD_EVENTS, setAnalyticsUser, trackDashboardEvent } from '@/lib/observability/analytics';

/** Syncs auth context to Sentry user + first session breadcrumb per browser tab. */
export function ObservabilityBootstrap() {
  const { user } = useAuth();
  const sessionTracked = useRef(false);

  useEffect(() => {
    if (!sessionTracked.current) {
      sessionTracked.current = true;
      trackDashboardEvent(DASHBOARD_EVENTS.SESSION_START);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setAnalyticsUser(null);
      return;
    }
    setAnalyticsUser({
      id: user.id,
      tenantId: user.tenant_id,
      role: user.active_role,
    });
  }, [user]);

  return null;
}
