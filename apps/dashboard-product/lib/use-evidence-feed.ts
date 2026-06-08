'use client';

import { useEffect, useState } from 'react';

export interface EvidenceFeedDocument {
  id: string;
  name: string;
  type: string;
  farmer_or_community: string;
  plot_id: string | null;
  upload_date: string;
  expiry_date: string;
  status: 'verified' | 'pending_review' | 'expired' | 'renewal_due' | string;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeEvidenceFeed(payload: unknown): EvidenceFeedDocument[] {
  const rows = Array.isArray(payload) ? payload : [];
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const doc = row as Record<string, unknown>;
      const id = typeof doc.id === 'string' ? doc.id : '';
      if (!id) return null;
      return {
        id,
        name: typeof doc.name === 'string' ? doc.name : 'Evidence document',
        type: typeof doc.type === 'string' ? doc.type : 'community_minutes',
        farmer_or_community:
          typeof doc.farmer_or_community === 'string' ? doc.farmer_or_community : 'Unknown',
        plot_id: typeof doc.plot_id === 'string' && doc.plot_id.trim() ? doc.plot_id : null,
        upload_date: typeof doc.upload_date === 'string' ? doc.upload_date : new Date().toISOString(),
        expiry_date: typeof doc.expiry_date === 'string' ? doc.expiry_date : new Date().toISOString(),
        status: typeof doc.status === 'string' ? doc.status : 'pending_review',
      };
    })
    .filter((doc): doc is EvidenceFeedDocument => doc !== null);
}

export function useEvidenceFeed(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [documents, setDocuments] = useState<EvidenceFeedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDocuments([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/requests/evidence-feed', {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) {
          const message =
            body && typeof body === 'object' && 'error' in body
              ? String((body as { error?: string }).error ?? 'Failed to load evidence feed.')
              : 'Failed to load evidence feed.';
          throw new Error(message);
        }
        if (!cancelled) {
          setDocuments(normalizeEvidenceFeed(body));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setDocuments([]);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load evidence feed.');
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
  }, [enabled]);

  return { documents, isLoading, error };
}
