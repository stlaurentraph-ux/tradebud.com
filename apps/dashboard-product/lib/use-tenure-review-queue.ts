'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TenureParseStatus } from '@/lib/use-plot-tenure-verification';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function confirmTenureReview(
  plotId: string,
  verificationId: string,
  reason: string,
  note?: string,
): Promise<unknown> {
  const res = await fetch(
    `/api/plots/${encodeURIComponent(plotId)}/tenure-verification/${encodeURIComponent(verificationId)}/confirm-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason, note: note ?? null }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : 'Failed to confirm tenure review.',
    );
  }
  return body;
}

export type TenureReviewQueueItem = {
  id: string;
  plot_id: string;
  storage_path: string;
  mime_type: string | null;
  evidence_label: string | null;
  parse_status: TenureParseStatus;
  parse_result: Record<string, unknown> | null;
  parse_confidence: number | null;
  parse_reviewed_by: string | null;
  parse_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  plot_name: string | null;
  farmer_id: string;
  farmer_name: string | null;
  compliance_issue_id: string | null;
};

export function useTenureReviewQueue() {
  const [items, setItems] = useState<TenureReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/plots/tenure-review-queue', {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof body?.error === 'string' ? body.error : 'Failed to load tenure review queue.',
        );
      }
      setItems(Array.isArray(body) ? body : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tenure review queue.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const confirmReview = useCallback(
    async (plotId: string, verificationId: string, reason: string, note?: string) => {
      const body = await confirmTenureReview(plotId, verificationId, reason, note);
      await reload();
      return body;
    },
    [reload],
  );

  return { items, isLoading, error, reload, confirmReview };
}
