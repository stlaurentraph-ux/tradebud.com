'use client';

import { useEffect, useState } from 'react';
import type {
  CommodityCoverageRow,
  CountryCoverageRow,
  NetworkRoleRow,
  TransparencyMetrics,
} from '@/lib/sponsor-network-aggregates';

interface SponsorDashboardSummaryState {
  countryCoverage: CountryCoverageRow[];
  commodityCoverage: CommodityCoverageRow[];
  networkRoles: NetworkRoleRow[];
  transparencyMetrics: TransparencyMetrics | null;
  organisationCount: number;
  campaignCount: number;
  draftCampaignCount: number;
  contactCount: number;
  rawOrganisations: Record<string, unknown>[];
  rawCampaigns: Array<{ id?: string; title?: string; status?: string; commodity?: string; target_organization_ids?: unknown[]; target_farmer_ids?: unknown[]; target_plot_ids?: unknown[]; target_contact_emails?: unknown[] }>;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_STATE: SponsorDashboardSummaryState = {
  countryCoverage: [],
  commodityCoverage: [],
  networkRoles: [],
  transparencyMetrics: null,
  organisationCount: 0,
  campaignCount: 0,
  draftCampaignCount: 0,
  contactCount: 0,
  rawOrganisations: [],
  rawCampaigns: [],
  isLoading: false,
  error: null,
};

export function useSponsorDashboardSummary(
  enabled: boolean,
  plotMetrics?: { total_plots: number; compliant_plots: number },
): SponsorDashboardSummaryState {
  const [state, setState] = useState<SponsorDashboardSummaryState>(EMPTY_STATE);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const params = new URLSearchParams({
      total_plots: String(plotMetrics?.total_plots ?? 0),
      compliant_plots: String(plotMetrics?.compliant_plots ?? 0),
    });

    setState((current) => ({ ...current, isLoading: true, error: null }));
    void fetch(`/api/dashboard/sponsor-summary?${params.toString()}`, { headers, cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          organisations?: Record<string, unknown>[];
          campaigns?: SponsorDashboardSummaryState['rawCampaigns'];
          aggregates?: {
            countryCoverage: CountryCoverageRow[];
            commodityCoverage: CommodityCoverageRow[];
            networkRoles: NetworkRoleRow[];
            transparencyMetrics: TransparencyMetrics;
            organisationCount: number;
            campaignCount: number;
            draftCampaignCount: number;
            contactCount: number;
          };
          error?: string;
        };
        if (!response.ok || !payload.aggregates) {
          throw new Error(payload.error ?? 'Failed to load sponsor summary.');
        }
        setState({
          countryCoverage: payload.aggregates.countryCoverage,
          commodityCoverage: payload.aggregates.commodityCoverage,
          networkRoles: payload.aggregates.networkRoles,
          transparencyMetrics: payload.aggregates.transparencyMetrics,
          organisationCount: payload.aggregates.organisationCount,
          campaignCount: payload.aggregates.campaignCount,
          draftCampaignCount: payload.aggregates.draftCampaignCount,
          contactCount: payload.aggregates.contactCount,
          rawOrganisations: Array.isArray(payload.organisations) ? payload.organisations : [],
          rawCampaigns: Array.isArray(payload.campaigns) ? payload.campaigns : [],
          isLoading: false,
          error: null,
        });
      })
      .catch((fetchError: unknown) => {
        setState({
          ...EMPTY_STATE,
          isLoading: false,
          error: fetchError instanceof Error ? fetchError.message : 'Failed to load sponsor summary.',
        });
      });
  }, [enabled, plotMetrics?.compliant_plots, plotMetrics?.total_plots]);

  return state;
}
