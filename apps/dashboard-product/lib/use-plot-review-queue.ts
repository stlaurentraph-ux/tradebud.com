'use client';

import { useCallback, useEffect, useState } from 'react';

export type PlotReviewQueueItem = {
  id: string;
  name: string;
  farmer_id?: string;
  farmer_name?: string;
  status: string;
  kind?: string;
  area_ha?: number | string | null;
  production_system?: string | null;
  sinaph_overlap?: boolean;
  indigenous_overlap?: boolean;
  reviewPriority: 'low' | 'medium' | 'high';
  autoClearanceEligible?: boolean;
  deforestation_screening?: unknown;
  groundTruthPhotos?: {
    totalCount: number;
    geoVerifiedCount: number;
    timestampVerifiedCount: number;
    clearanceVerifiedCount: number;
    clearanceEligible: boolean;
    minRequired: number;
    cutoffDate: string;
  };
};

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseReviewPriority(value: unknown): PlotReviewQueueItem['reviewPriority'] {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'low';
}

function normalizeQueue(payload: unknown): PlotReviewQueueItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => ({
      id: String(row.id ?? ''),
      name: typeof row.name === 'string' ? row.name : `Plot ${String(row.id ?? '').slice(0, 8)}`,
      farmer_id: typeof row.farmer_id === 'string' ? row.farmer_id : undefined,
      farmer_name: typeof row.farmer_name === 'string' ? row.farmer_name : undefined,
      status: typeof row.status === 'string' ? row.status : 'under_review',
      kind: typeof row.kind === 'string' ? row.kind : undefined,
      area_ha: row.area_ha as number | string | null | undefined,
      production_system:
        typeof row.production_system === 'string' ? row.production_system : null,
      sinaph_overlap: row.sinaph_overlap === true,
      indigenous_overlap: row.indigenous_overlap === true,
      reviewPriority: parseReviewPriority(row.reviewPriority),
      autoClearanceEligible: row.autoClearanceEligible === true,
      deforestation_screening: row.deforestation_screening,
      groundTruthPhotos:
        row.groundTruthPhotos && typeof row.groundTruthPhotos === 'object'
          ? (row.groundTruthPhotos as PlotReviewQueueItem['groundTruthPhotos'])
          : undefined,
    }))
    .filter((row) => row.id.length > 0);
}

export function usePlotReviewQueue(enabled = true) {
  const [items, setItems] = useState<PlotReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plots/review-queue', {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const body = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error?: string }).error ?? 'Failed to load plot review queue.')
            : 'Failed to load plot review queue.';
        throw new Error(message);
      }
      setItems(normalizeQueue(body));
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load plot review queue.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitDecision = useCallback(
    async (plotId: string, action: 'clear' | 'uphold', reason: string, note?: string) => {
      const path =
        action === 'clear'
          ? `/api/plots/${encodeURIComponent(plotId)}/clear-review`
          : `/api/plots/${encodeURIComponent(plotId)}/uphold-review`;
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reason, note: note ?? null }),
      });
      const body = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body
            ? String((body as { message?: string }).message)
            : body && typeof body === 'object' && 'error' in body
              ? String((body as { error?: string }).error)
              : 'Review decision failed.';
        throw new Error(message);
      }
      await reload();
      return body;
    },
    [reload],
  );

  return { items, isLoading, error, reload, submitDecision };
}
