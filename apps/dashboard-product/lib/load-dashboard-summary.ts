import { buildDashboardSummaryMetrics, normalizeBackendArray } from '@/lib/build-dashboard-summary';
import { buildSponsorDashboardSummary } from '@/lib/build-sponsor-dashboard-summary';
import { toHarvestPackageFromDds, normalizeSummaryCampaigns } from '@/lib/dashboard-home-data';
import { fetchBackendJson } from '@/lib/dashboard-fetch';
import type { HarvestPackageScope } from '@/lib/harvest-package-scope';
import { mapBackendPackagesResponse } from '@/lib/harvest-package-mapper';
import type { SponsorDashboardSummaryPayload } from '@/lib/build-sponsor-dashboard-summary';
import type { RequestCampaign } from '@/lib/use-requests';
import type { DDSPackage } from '@/types';
import type { DashboardSummaryMetrics } from '@/lib/build-dashboard-summary';

type OrganisationRecord = Record<string, unknown>;
type ContactRecord = { contact_type?: string; country?: string | null; status?: string };

export interface DashboardSummaryPayload {
  packageScope: HarvestPackageScope;
  metrics: DashboardSummaryMetrics;
  packages: DDSPackage[];
  campaigns: RequestCampaign[];
  sponsor: SponsorDashboardSummaryPayload;
}

export async function loadDashboardSummary(input: {
  authHeader: string;
  packageScope: HarvestPackageScope;
}): Promise<DashboardSummaryPayload> {
  const { authHeader, packageScope } = input;
  const packageQuery = `?scope=${encodeURIComponent(packageScope)}`;

  const [packagesRaw, campaignsRaw, inboxRaw, cooperativeRaw, issuesRaw, organisationsRaw, contactsRaw, plotsRaw] =
    await Promise.allSettled([
      fetchBackendJson(`/v1/harvest/packages${packageQuery}`, authHeader),
      fetchBackendJson('/v1/requests/campaigns', authHeader),
      fetchBackendJson('/v1/inbox-requests', authHeader),
      fetchBackendJson('/v1/cooperative/insights', authHeader),
      fetchBackendJson('/v1/requests/issues', authHeader),
      fetchBackendJson('/v1/admin/organizations', authHeader),
      fetchBackendJson('/v1/contacts', authHeader),
      fetchBackendJson('/v1/plots?scope=tenant', authHeader),
    ]);

  const mappedPackages = mapBackendPackagesResponse(
    packagesRaw.status === 'fulfilled' ? packagesRaw.value : [],
    'tenant_unknown',
  );
  const packages = mappedPackages.map(toHarvestPackageFromDds);
  const campaigns =
    campaignsRaw.status === 'fulfilled' ? normalizeBackendArray<{ id: string; status?: string }>(campaignsRaw.value) : [];
  const campaignRecords =
    campaignsRaw.status === 'fulfilled' ? normalizeSummaryCampaigns(campaignsRaw.value) : [];
  const inboxRequests =
    inboxRaw.status === 'fulfilled' ? normalizeBackendArray<{ id: string; status?: string }>(inboxRaw.value) : [];
  const operationalIssues =
    issuesRaw.status === 'fulfilled'
      ? normalizeBackendArray<{ id: string; severity?: string; status?: string; issue_kind?: string }>(issuesRaw.value)
      : [];

  const cooperativeMetrics =
    cooperativeRaw.status === 'fulfilled' &&
    cooperativeRaw.value &&
    typeof cooperativeRaw.value === 'object' &&
    'metrics' in cooperativeRaw.value
      ? ((cooperativeRaw.value as { metrics?: Record<string, unknown> }).metrics ?? {})
      : {};

  const organisations =
    organisationsRaw.status === 'fulfilled'
      ? normalizeBackendArray<OrganisationRecord>(organisationsRaw.value)
      : [];
  const contacts =
    contactsRaw.status === 'fulfilled' ? normalizeBackendArray<ContactRecord>(contactsRaw.value) : [];
  const tenantPlots =
    plotsRaw.status === 'fulfilled' ? normalizeBackendArray<Record<string, unknown>>(plotsRaw.value) : [];
  const tenantFarmerCount = contacts.filter((contact) => contact.contact_type === 'farmer').length;

  const metrics = buildDashboardSummaryMetrics({
    packages,
    campaigns,
    inboxRequests,
    operationalIssues,
    cooperativeMetrics,
    organisationCount: organisations.length,
    contactCount: contacts.length,
    tenantFarmerCount,
    tenantPlotCount: tenantPlots.length,
    tenantPlots,
  });

  const sponsor = buildSponsorDashboardSummary({
    organisations,
    campaigns: campaignRecords,
    contacts,
    totalPlots: metrics.total_plots,
    compliantPlots: metrics.compliant_plots,
  });

  return {
    packageScope,
    metrics,
    packages: mappedPackages,
    campaigns: campaignRecords,
    sponsor,
  };
}
