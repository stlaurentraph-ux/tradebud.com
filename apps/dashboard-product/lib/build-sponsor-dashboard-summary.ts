import {
  aggregateCommodityCoverage,
  aggregateCountryCoverage,
  aggregateNetworkRoles,
  computeTransparencyMetrics,
  type CommodityCoverageRow,
  type CountryCoverageRow,
  type NetworkRoleRow,
  type TransparencyMetrics,
} from '@/lib/sponsor-network-aggregates';

type OrganisationRecord = Record<string, unknown>;
type CampaignRecord = {
  id?: string;
  title?: string;
  status?: string;
  commodity?: string;
  target_organization_ids?: unknown[];
  target_farmer_ids?: unknown[];
  target_plot_ids?: unknown[];
  target_contact_emails?: unknown[];
};
type ContactRecord = { contact_type?: string; country?: string | null; status?: string };

export interface SponsorDashboardSummaryPayload {
  countryCoverage: CountryCoverageRow[];
  commodityCoverage: CommodityCoverageRow[];
  networkRoles: NetworkRoleRow[];
  transparencyMetrics: TransparencyMetrics | null;
  organisationCount: number;
  campaignCount: number;
  draftCampaignCount: number;
  contactCount: number;
  rawOrganisations: OrganisationRecord[];
  rawCampaigns: CampaignRecord[];
}

export function buildSponsorDashboardSummary(input: {
  organisations: OrganisationRecord[];
  campaigns: CampaignRecord[];
  contacts: ContactRecord[];
  totalPlots: number;
  compliantPlots: number;
}): SponsorDashboardSummaryPayload {
  const { organisations, campaigns, contacts, totalPlots, compliantPlots } = input;

  const countryCoverage = aggregateCountryCoverage(
    organisations.map((org) => ({
      country: String(org.country ?? 'Unknown'),
      type: String(org.type ?? org.roleInNetwork ?? 'partner'),
    })),
    contacts,
  );
  const commodityCoverage = aggregateCommodityCoverage(campaigns);
  const networkRoles = aggregateNetworkRoles(
    organisations.map((org) => ({
      type: String(org.type ?? org.roleInNetwork ?? 'partner'),
    })),
    contacts,
  );
  const transparencyMetrics = computeTransparencyMetrics({
    organisations: organisations.map((org) => ({
      onboardingCompleteness: Number(org.onboardingCompleteness ?? 0),
      status: String(org.status ?? ''),
    })),
    campaigns,
    contacts,
    totalPlots,
    compliantPlots,
  });

  const draftCampaignCount = campaigns.filter(
    (campaign) => String(campaign.status ?? '').toUpperCase() === 'DRAFT',
  ).length;

  return {
    countryCoverage,
    commodityCoverage,
    networkRoles,
    transparencyMetrics,
    organisationCount: organisations.length,
    campaignCount: campaigns.length,
    draftCampaignCount,
    contactCount: contacts.length,
    rawOrganisations: organisations,
    rawCampaigns: campaigns,
  };
}
