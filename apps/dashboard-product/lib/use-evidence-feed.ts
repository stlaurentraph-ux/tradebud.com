'use client';

import { useCallback, useEffect, useState } from 'react';

export interface EvidenceFeedDocument {
  id: string;
  name: string;
  type: string;
  farmer_or_community: string;
  plot_id: string | null;
  upload_date: string;
  expiry_date: string;
  status: 'verified' | 'pending_review' | 'expired' | 'renewal_due' | string;
  storage_path: string | null;
  mime_type: string | null;
  evidence_kind: string | null;
  has_file: boolean;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeEvidenceFeed(payload: unknown): EvidenceFeedDocument[] {
  const rows = Array.isArray(payload) ? payload : [];
  const documents: EvidenceFeedDocument[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const doc = row as Record<string, unknown>;
    const id = typeof doc.id === 'string' ? doc.id : '';
    if (!id) continue;
    documents.push({
      id,
      name: typeof doc.name === 'string' ? doc.name : 'Evidence document',
      type: typeof doc.type === 'string' ? doc.type : 'community_minutes',
      farmer_or_community:
        typeof doc.farmer_or_community === 'string' ? doc.farmer_or_community : 'Unknown',
      plot_id: typeof doc.plot_id === 'string' && doc.plot_id.trim() ? doc.plot_id : null,
      upload_date: typeof doc.upload_date === 'string' ? doc.upload_date : new Date().toISOString(),
      expiry_date: typeof doc.expiry_date === 'string' ? doc.expiry_date : new Date().toISOString(),
      status: typeof doc.status === 'string' ? doc.status : 'pending_review',
      storage_path: typeof doc.storage_path === 'string' && doc.storage_path.trim() ? doc.storage_path : null,
      mime_type: typeof doc.mime_type === 'string' ? doc.mime_type : null,
      evidence_kind: typeof doc.evidence_kind === 'string' ? doc.evidence_kind : null,
      has_file: doc.has_file === true,
    });
  }
  return documents;
}

export function useEvidenceFeed(options?: { plotId?: string; enabled?: boolean }) {
  const plotId = options?.plotId?.trim() ?? '';
  const enabled = options?.enabled ?? true;
  const [documents, setDocuments] = useState<EvidenceFeedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setDocuments([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const query = plotId ? `?plotId=${encodeURIComponent(plotId)}` : '';
    try {
      const response = await fetch(`/api/requests/evidence-feed${query}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const body = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error?: string }).error ?? 'Failed to load evidence feed.')
            : 'Failed to load evidence feed.';
        throw new Error(message);
      }
      setDocuments(normalizeEvidenceFeed(body));
    } catch (loadError) {
      setDocuments([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load evidence feed.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, plotId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { documents, isLoading, error, reload };
}
