'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseBackendErrorMessage } from '@/lib/request-campaign-payload';
import { archiveRequestCampaign, sendRequestCampaign } from '@/lib/request-campaign-client';
import { useDemoData } from '@/lib/demo-data-context';
import { getMockInboxRequests, mockRequestCampaigns } from '@/lib/mocks/requests';

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

export type RequestCampaignStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'EXPIRED'
  | 'CANCELLED';

export interface RequestCampaign {
  id: string;
  title: string;
  request_type: string;
  status: RequestCampaignStatus;
  due_at: string;
  created_at: string;
  updated_at: string;
  target_contact_emails?: string[];
  accepted_count?: number;
  pending_count?: number;
  expired_count?: number;
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function useInboxRequests(tenantId: string | null) {
  const { demoDataEnabled } = useDemoData();
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

      if (demoDataEnabled) {
        const data = getMockInboxRequests(tenantId);
        if (!cancelled) {
          setRequests(data);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/inbox-requests', {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(parseBackendErrorMessage(body, 'Request API unavailable.'));
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
  }, [tenantId, reloadTick, demoDataEnabled]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'PENDING'),
    [requests]
  );

  const respondedCount = useMemo(
    () => requests.filter((item) => item.status === 'RESPONDED').length,
    [requests]
  );

  const respond = async (
    requestId: string,
    payload?: {
      notes?: string;
      evidencePlotIds?: string[];
      evidencePackageIds?: string[];
    },
  ) => {
    if (!tenantId) throw new Error('No tenant context available.');
    if (demoDataEnabled) {
      const updated = requests.find((item) => item.id === requestId);
      if (!updated) throw new Error('Request not found for current tenant.');
      const responded: InboxRequest = {
        ...updated,
        status: 'RESPONDED',
        updated_at: new Date().toISOString(),
      };
      setRequests((prev) => prev.map((item) => (item.id === requestId ? responded : item)));
      return responded;
    }
    try {
      const response = await fetch(`/api/inbox-requests/${encodeURIComponent(requestId)}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() ?? {}),
        },
        body: JSON.stringify(payload ?? {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(parseBackendErrorMessage(body, 'Request API unavailable.'));
      }
      const body = (await response.json()) as { request?: InboxRequest; error?: string };
      if (!body.request) {
        throw new Error(parseBackendErrorMessage(body, 'Failed to respond to request.'));
      }
      setRequests((prev) => prev.map((item) => (item.id === body.request?.id ? body.request : item)));
      return body.request;
    } catch (err) {
      throw (err instanceof Error ? err : new Error('Failed to respond to request.'));
    }
  };

  return { requests, pendingRequests, respondedCount, isLoading, error, reload, respond };
}

export function useRequestCampaigns(tenantId: string | null) {
  const { demoDataEnabled } = useDemoData();
  const [campaigns, setCampaigns] = useState<RequestCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!tenantId) {
        setCampaigns([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      if (demoDataEnabled) {
        if (!cancelled) {
          setCampaigns(mockRequestCampaigns);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/requests/campaigns', {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(parseBackendErrorMessage(body, 'Campaign API unavailable.'));
        }
        const body = (await response.json()) as
          | { campaigns?: RequestCampaign[]; data?: RequestCampaign[] }
          | RequestCampaign[];
        const data = Array.isArray(body)
          ? body
          : Array.isArray(body.campaigns)
            ? body.campaigns
            : Array.isArray(body.data)
              ? body.data
              : [];
        if (!cancelled) setCampaigns(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load campaigns.');
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadTick, demoDataEnabled]);

  const counts = useMemo(
    () => ({
      draft: campaigns.filter((item) => item.status === 'DRAFT').length,
      sent: campaigns.filter((item) => item.status === 'QUEUED' || item.status === 'RUNNING').length,
      completed: campaigns.filter((item) => item.status === 'COMPLETED' || item.status === 'PARTIAL').length,
      archived: campaigns.filter((item) => item.status === 'EXPIRED' || item.status === 'CANCELLED').length,
    }),
    [campaigns],
  );

  const sendDraft = async (campaignId: string) => {
    if (demoDataEnabled) {
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaignId ? { ...item, status: 'RUNNING', updated_at: new Date().toISOString() } : item,
        ),
      );
      return;
    }
    await sendRequestCampaign(campaignId);
    reload();
  };

  const archive = async (campaignId: string) => {
    if (demoDataEnabled) {
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaignId ? { ...item, status: 'CANCELLED', updated_at: new Date().toISOString() } : item,
        ),
      );
      return;
    }
    await archiveRequestCampaign(campaignId);
    reload();
  };

  return { campaigns, counts, isLoading, error, reload, sendDraft, archive };
}
