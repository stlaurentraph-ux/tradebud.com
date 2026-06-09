'use client';

import { useCallback, useEffect, useState } from 'react';

export type CampaignDecisionFilter = 'all' | 'accept' | 'refuse';

export interface CampaignDecision {
  campaign_id: string;
  recipient_email: string;
  decision: 'accept' | 'refuse';
  decided_at: string;
  source: string;
}

export interface CampaignDecisionsPayload {
  campaign_id: string;
  tenant_id: string;
  last_synced_at: string | null;
  decisions: CampaignDecision[];
  counts: {
    all: number;
    accept: number;
    refuse: number;
  };
  pagination: {
    decision: CampaignDecisionFilter;
    limit: number;
    offset: number;
    returned: number;
    has_more: boolean;
  };
}

const PAGE_SIZE = 20;

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useCampaignDecisions(
  campaignId: string | null,
  options?: { decision?: CampaignDecisionFilter; enabled?: boolean },
) {
  const decisionFilter = options?.decision ?? 'all';
  const enabled = options?.enabled ?? Boolean(campaignId);
  const [data, setData] = useState<CampaignDecisionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((value) => value + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!campaignId || !data?.pagination.has_more || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(data.decisions.length),
      });
      if (decisionFilter !== 'all') {
        params.set('decision', decisionFilter);
      }

      const response = await fetch(
        `/api/requests/campaigns/${encodeURIComponent(campaignId)}/decisions?${params.toString()}`,
        {
          cache: 'no-store',
          headers: getAuthHeaders(),
        },
      );
      const body = (await response.json().catch(() => ({}))) as CampaignDecisionsPayload & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to load more campaign decisions.');
      }

      setData((current) =>
        current
          ? {
              ...body,
              decisions: [...current.decisions, ...body.decisions],
            }
          : body,
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load more campaign decisions.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [campaignId, data, decisionFilter, isLoadingMore]);

  useEffect(() => {
    if (!campaignId || !enabled) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: '0',
    });
    if (decisionFilter !== 'all') {
      params.set('decision', decisionFilter);
    }

    fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/decisions?${params.toString()}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as CampaignDecisionsPayload & { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load campaign decision timeline.');
        }
        if (!cancelled) {
          setData(body);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setData(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load campaign decision timeline.');
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
  }, [campaignId, decisionFilter, enabled, reloadTick]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    reload,
    loadMore,
  };
}

export function formatCampaignDecisionSource(source: string): string {
  const normalized = source.trim().toLowerCase();
  if (normalized === 'inbox_fulfillment') return 'Inbox fulfillment';
  if (normalized === 'email_cta') return 'Email link';
  return source.replace(/_/g, ' ');
}
