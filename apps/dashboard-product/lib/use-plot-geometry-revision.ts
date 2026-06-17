'use client';

import { useCallback, useState } from 'react';

import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type ApplyPlotGeometryRevisionInput = {
  geometry: Record<string, unknown>;
  reason: string;
  reviewerAssist?: boolean;
};

export function usePlotGeometryRevision(plotId: string) {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyRevision = useCallback(
    async (input: ApplyPlotGeometryRevisionInput) => {
      setIsApplying(true);
      setError(null);
      try {
        const response = await fetch(`/api/plots/${encodeURIComponent(plotId)}/geometry`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            geometry: input.geometry,
            reason: input.reason,
            reviewerAssist: input.reviewerAssist ?? true,
          }),
        });
        const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Geometry revision failed.');
        }
        trackDashboardEvent(DASHBOARD_EVENTS.PLOT_GEOMETRY_REVISION_APPLIED, {
          plotId,
          reviewerAssist: true,
        });
        return body;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Geometry revision failed.';
        setError(message);
        trackDashboardEvent(DASHBOARD_EVENTS.UI_ACTION_FAILED, {
          action: 'plot_geometry_revision',
          plotId,
          message,
        });
        throw err;
      } finally {
        setIsApplying(false);
      }
    },
    [plotId],
  );

  return { applyRevision, isApplying, error };
}
