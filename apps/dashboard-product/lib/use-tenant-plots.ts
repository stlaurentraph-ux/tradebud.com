'use client';

import { useEffect, useState } from 'react';

export interface TenantPlot {
  id: string;
  name: string;
  farmer_id?: string;
  status?: string | null;
  area_ha?: number | null;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizePlots(payload: unknown): TenantPlot[] {
  const rows = Array.isArray(payload) ? payload : [];
  const plots: TenantPlot[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const plot = row as Record<string, unknown>;
    const id = typeof plot.id === 'string' ? plot.id : '';
    if (!id) continue;
    plots.push({
      id,
      name: typeof plot.name === 'string' && plot.name.trim() ? plot.name : `Plot ${id.slice(0, 8)}`,
      farmer_id: typeof plot.farmer_id === 'string' ? plot.farmer_id : undefined,
      status: typeof plot.status === 'string' ? plot.status : null,
      area_ha: typeof plot.area_ha === 'number' ? plot.area_ha : null,
    });
  }
  return plots;
}

export function useTenantPlots(tenantId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? Boolean(tenantId);
  const [plots, setPlots] = useState<TenantPlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !enabled) {
      setPlots([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/plots?scope=tenant', {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) {
          const message =
            body && typeof body === 'object' && 'error' in body
              ? String((body as { error?: string }).error ?? 'Failed to load plots.')
              : 'Failed to load plots.';
          throw new Error(message);
        }
        if (!cancelled) {
          setPlots(normalizePlots(body));
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
  }, [tenantId, enabled]);

  return { plots, isLoading, error };
}
