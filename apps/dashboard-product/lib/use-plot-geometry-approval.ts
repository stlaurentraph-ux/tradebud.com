'use client';

import { useCallback, useState } from 'react';
import { trackAnalyticsEvent, ANALYTICS_EVENTS } from '@/lib/observability/analytics';

function authHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function usePlotGeometryApproval(plotId: string) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async () => {
    if (!plotId) return null;
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/plots/${encodeURIComponent(plotId)}/approve-geometry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({}),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        geometry_approved_at?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? 'Could not approve plot geometry.');
      }
      trackAnalyticsEvent(ANALYTICS_EVENTS.PLOT_GEOMETRY_APPROVED, { plotId });
      return body.geometry_approved_at ?? new Date().toISOString();
    } catch (approveError) {
      const message =
        approveError instanceof Error ? approveError.message : 'Could not approve plot geometry.';
      setError(message);
      return null;
    } finally {
      setIsApproving(false);
    }
  }, [plotId]);

  return { approve, isApproving, error };
}
