'use client';

import { useEffect, useMemo, useState } from 'react';

type InboxRequestStatus = 'PENDING' | 'RESPONDED';

export interface InboxRequest {
  id: string;
  campaign_id: string;
  title: string;
  request_type: 'MISSING_PLOT_GEOMETRY' | 'GENERAL_EVIDENCE' | 'CONSENT_GRANT';
  due_at: string;
  from_org: string;
  sender_tenant_id: string;
  recipient_tenant_id: string;
  status: InboxRequestStatus;
  created_at: string;
  updated_at: string;
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function useInboxRequests(tenantId: string | null) {
  const [requests, setRequests] = useState<InboxRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!tenantId) {
        setRequests([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/inbox-requests', {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Request API unavailable.');
        }
        const body = (await response.json()) as { requests?: InboxRequest[] };
        const data = body.requests ?? [];
        if (!cancelled) setRequests(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load inbox requests.');
          setRequests([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadTick]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'PENDING'),
    [requests]
  );

  const respondedCount = useMemo(
    () => requests.filter((item) => item.status === 'RESPONDED').length,
    [requests]
  );

  const respond = async (requestId: string) => {
    if (!tenantId) throw new Error('No tenant context available.');
    try {
      const response = await fetch(`/api/inbox-requests/${encodeURIComponent(requestId)}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() ?? {}),
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Request API unavailable.');
      }
      const body = (await response.json()) as { request?: InboxRequest; error?: string };
      if (!body.request) {
        throw new Error(body.error ?? 'Failed to respond to request.');
      }
      setRequests((prev) => prev.map((item) => (item.id === body.request?.id ? body.request : item)));
      return body.request;
    } catch (err) {
      throw (err instanceof Error ? err : new Error('Failed to respond to request.'));
    }
  };

  return { requests, pendingRequests, respondedCount, isLoading, error, reload, respond };
}
