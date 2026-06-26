'use client';

import { useEffect, useRef, useState } from 'react';
import type { HarvestPackageScope } from '@/lib/harvest-package-scope';
import { normalizeSummaryCampaigns } from '@/lib/dashboard-home-data';
import type { SponsorDashboardSummaryPayload } from '@/lib/build-sponsor-dashboard-summary';
import type { DashboardSummaryPayload } from '@/lib/load-dashboard-summary';
import type { RequestCampaign } from '@/lib/use-requests';
import type { DDSPackage } from '@/types';
import { getAccessToken } from '@/lib/auth-session';
import type { DashboardSummaryMetrics } from '@/lib/build-dashboard-summary';

export type { DashboardSummaryMetrics };

interface DashboardSummaryState {
  metrics: DashboardSummaryMetrics | null;
  packages: DDSPackage[];
  campaigns: RequestCampaign[];
  sponsor: SponsorDashboardSummaryPayload | null;
  isLoading: boolean;
  error: string | null;
}

function resolveMatchingInitial(
  initialSummary: DashboardSummaryPayload | null | undefined,
  packageScope: HarvestPackageScope,
): DashboardSummaryPayload | null {
  if (!initialSummary || initialSummary.packageScope !== packageScope) {
    return null;
  }
  return initialSummary;
}

export function useDashboardSummary(
  enabled: boolean,
  options?: {
    packageScope?: HarvestPackageScope;
    initialSummary?: DashboardSummaryPayload | null;
  },
): DashboardSummaryState {
  const packageScope = options?.packageScope ?? 'tenant';
  const matchingInitial = resolveMatchingInitial(options?.initialSummary, packageScope);
  const hasDataRef = useRef(Boolean(matchingInitial));

  const [metrics, setMetrics] = useState<DashboardSummaryMetrics | null>(matchingInitial?.metrics ?? null);
  const [packages, setPackages] = useState<DDSPackage[]>(matchingInitial?.packages ?? []);
  const [campaigns, setCampaigns] = useState<RequestCampaign[]>(matchingInitial?.campaigns ?? []);
  const [sponsor, setSponsor] = useState<SponsorDashboardSummaryPayload | null>(matchingInitial?.sponsor ?? null);
  const [isLoading, setIsLoading] = useState(enabled && !matchingInitial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasDataRef.current = Boolean(matchingInitial);
  }, [matchingInitial]);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setMetrics(null);
      setPackages([]);
      setCampaigns([]);
      setSponsor(null);
      setError(null);
      setIsLoading(false);
      hasDataRef.current = false;
      return;
    }

    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    let cancelled = false;

    const loadSummary = () => {
      if (!hasDataRef.current) {
        setIsLoading(true);
      }
      setError(null);

      void fetch(`/api/dashboard/summary?package_scope=${encodeURIComponent(packageScope)}`, {
        headers,
        cache: 'no-store',
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => ({}))) as {
            metrics?: DashboardSummaryMetrics;
            packages?: DDSPackage[];
            campaigns?: unknown;
            sponsor?: SponsorDashboardSummaryPayload;
            error?: string;
          };
          if (!response.ok || !payload.metrics) {
            throw new Error(payload.error ?? 'Failed to load dashboard summary.');
          }
          if (cancelled) return;
          setMetrics(payload.metrics);
          setPackages(Array.isArray(payload.packages) ? payload.packages : []);
          setCampaigns(normalizeSummaryCampaigns(payload.campaigns));
          setSponsor(payload.sponsor ?? null);
          hasDataRef.current = true;
        })
        .catch((fetchError: unknown) => {
          if (cancelled) return;
          if (!hasDataRef.current) {
            setMetrics(null);
            setPackages([]);
            setCampaigns([]);
            setSponsor(null);
          }
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard summary.');
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    };

    loadSummary();
    const onOnboardingAction = () => loadSummary();
    window.addEventListener('tracebud:onboarding-action', onOnboardingAction);

    return () => {
      cancelled = true;
      window.removeEventListener('tracebud:onboarding-action', onOnboardingAction);
    };
  }, [enabled, packageScope]);

  return { metrics, packages, campaigns, sponsor, isLoading, error };
}
