'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDemoData } from '@/lib/demo-data-context';
import { mockPlots } from '@/lib/mocks';
import { normalizePlotInventoryPayload, mapTenantPlotToInventoryRow, type PlotInventoryRow } from '@/lib/plot-inventory';

export type TenantPlot = PlotInventoryRow;

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useTenantPlots(tenantId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? Boolean(tenantId);
  const { demoDataEnabled } = useDemoData();
  const [plots, setPlots] = useState<TenantPlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!tenantId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setPlots([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    if (demoDataEnabled) {
      const data = mockPlots
        .map((plot) =>
          mapTenantPlotToInventoryRow({
            id: plot.id,
            name: plot.name,
            farmer_id: plot.farmer_id,
            area_ha: plot.area_hectares,
            status: plot.verified ? 'deforestation_clear' : 'pending_check',
            kind: 'polygon',
          }),
        )
        .filter((row): row is PlotInventoryRow => row != null);
      if (!cancelled) {
        setPlots(data);
        setIsLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    fetch('/api/plots?scope=tenant', {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) {
          const message =
            body && typeof body === 'object' && 'message' in body
              ? String((body as { message?: string }).message ?? '')
              : body && typeof body === 'object' && 'error' in body
                ? String((body as { error?: string }).error ?? 'Failed to load plots.')
                : 'Failed to load plots.';
          if (response.status === 403) {
            throw new Error(
              message.trim() ||
                'You do not have permission to view the plot inventory. Sign in again or contact support.',
            );
          }
          throw new Error(message || 'Failed to load plots.');
        }
        if (!cancelled) {
          setPlots(normalizePlotInventoryPayload(body));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setPlots([]);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load plots.');
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
  }, [tenantId, enabled, demoDataEnabled, reloadToken]);

  return { plots, isLoading, error, reload };
}
