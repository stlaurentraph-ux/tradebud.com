export type SponsorNetworkOrg = {
  id?: string;
  name?: string;
  country?: string;
  type?: string;
  onboardingCompleteness?: number;
  relationship?: string;
  roleInNetwork?: string;
};

export type SponsorNetworkCampaign = {
  id?: string;
  title?: string;
  status?: string;
  commodity?: string;
};

export type SponsorNetworkContact = {
  contact_type?: string;
  country?: string | null;
  status?: string;
};

export type CountryCoverageRow = {
  country: string;
  organisationCount: number;
  contactCount: number;
};

export type CommodityCoverageRow = {
  commodity: string;
  programmeCount: number;
  activeProgrammeCount: number;
};

export type NetworkRoleRow = {
  roleKey: string;
  label: string;
  organisationCount: number;
  contactCount: number;
};

export type TransparencyMetrics = {
  countriesCovered: number;
  commoditiesTracked: number;
  networkRolesRepresented: number;
  governedOrganisations: number;
  activeContacts: number;
  complianceHealthPercent: number | null;
  atRiskOrganisations: number;
  transparencyIndex: number | null;
};

const ACTIVE_CAMPAIGN_STATUSES = new Set(['QUEUED', 'RUNNING', 'PARTIAL']);
const ACTIVE_CONTACT_STATUSES = new Set(['invited', 'engaged', 'submitted']);

function normalizeCountry(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unassigned';
}

function normalizeCommodity(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unspecified commodity';
}

function normalizeOrgRole(type: string | undefined): { roleKey: string; label: string } {
  const normalized = String(type ?? '').trim().toUpperCase();
  if (normalized === 'COOPERATIVE' || normalized === 'COOP') {
    return { roleKey: 'cooperative', label: 'Cooperative' };
  }
  if (normalized === 'EXPORTER') {
    return { roleKey: 'exporter', label: 'Exporter' };
  }
  if (normalized === 'IMPORTER') {
    return { roleKey: 'importer', label: 'Importer' };
  }
  if (normalized === 'NGO') {
    return { roleKey: 'ngo', label: 'NGO / programme partner' };
  }
  return { roleKey: 'partner', label: 'Network partner' };
}

function normalizeContactRole(contactType: string | undefined): { roleKey: string; label: string } {
  const normalized = String(contactType ?? '').trim().toLowerCase();
  if (normalized === 'cooperative') {
    return { roleKey: 'cooperative', label: 'Cooperative' };
  }
  if (normalized === 'exporter') {
    return { roleKey: 'exporter', label: 'Exporter' };
  }
  if (normalized === 'farmer') {
    return { roleKey: 'producer', label: 'Producer / farmer' };
  }
  return { roleKey: 'partner', label: 'Partner contact' };
}

export function aggregateCountryCoverage(
  organisations: SponsorNetworkOrg[],
  contacts: SponsorNetworkContact[],
): CountryCoverageRow[] {
  const rows = new Map<string, CountryCoverageRow>();

  for (const org of organisations) {
    const country = normalizeCountry(org.country);
    const current = rows.get(country) ?? { country, organisationCount: 0, contactCount: 0 };
    current.organisationCount += 1;
    rows.set(country, current);
  }

  for (const contact of contacts) {
    const country = normalizeCountry(contact.country);
    const current = rows.get(country) ?? { country, organisationCount: 0, contactCount: 0 };
    current.contactCount += 1;
    rows.set(country, current);
  }

  return [...rows.values()].sort((left, right) => {
    const leftTotal = left.organisationCount + left.contactCount;
    const rightTotal = right.organisationCount + right.contactCount;
    return rightTotal - leftTotal || left.country.localeCompare(right.country);
  });
}

export function aggregateCommodityCoverage(campaigns: SponsorNetworkCampaign[]): CommodityCoverageRow[] {
  const rows = new Map<string, CommodityCoverageRow>();

  for (const campaign of campaigns) {
    const commodity = normalizeCommodity(campaign.commodity ?? inferCommodityFromTitle(campaign.title));
    const status = String(campaign.status ?? '').toUpperCase();
    const current = rows.get(commodity) ?? {
      commodity,
      programmeCount: 0,
      activeProgrammeCount: 0,
    };
    current.programmeCount += 1;
    if (ACTIVE_CAMPAIGN_STATUSES.has(status)) {
      current.activeProgrammeCount += 1;
    }
    rows.set(commodity, current);
  }

  return [...rows.values()].sort((left, right) => right.programmeCount - left.programmeCount);
}

function inferCommodityFromTitle(title: string | undefined): string {
  const normalized = String(title ?? '').toLowerCase();
  if (normalized.includes('cocoa')) return 'Cocoa';
  if (normalized.includes('coffee')) return 'Coffee';
  if (normalized.includes('palm')) return 'Palm oil';
  if (normalized.includes('rubber')) return 'Rubber';
  if (normalized.includes('soy')) return 'Soy';
  if (normalized.includes('cattle') || normalized.includes('beef')) return 'Cattle';
  if (normalized.includes('wood') || normalized.includes('timber')) return 'Wood';
  return 'Unspecified commodity';
}

export function aggregateNetworkRoles(
  organisations: SponsorNetworkOrg[],
  contacts: SponsorNetworkContact[],
): NetworkRoleRow[] {
  const rows = new Map<string, NetworkRoleRow>();

  for (const org of organisations) {
    const { roleKey, label } = normalizeOrgRole(org.type);
    const current = rows.get(roleKey) ?? { roleKey, label, organisationCount: 0, contactCount: 0 };
    current.organisationCount += 1;
    rows.set(roleKey, current);
  }

  for (const contact of contacts) {
    const { roleKey, label } = normalizeContactRole(contact.contact_type);
    const current = rows.get(roleKey) ?? { roleKey, label, organisationCount: 0, contactCount: 0 };
    current.contactCount += 1;
    rows.set(roleKey, current);
  }

  return [...rows.values()].sort(
    (left, right) =>
      right.organisationCount + right.contactCount - (left.organisationCount + left.contactCount),
  );
}

export function computeTransparencyMetrics(input: {
  organisations: SponsorNetworkOrg[];
  campaigns: SponsorNetworkCampaign[];
  contacts: SponsorNetworkContact[];
  totalPlots: number;
  compliantPlots: number;
}): TransparencyMetrics {
  const countries = aggregateCountryCoverage(input.organisations, input.contacts);
  const commodities = aggregateCommodityCoverage(input.campaigns);
  const roles = aggregateNetworkRoles(input.organisations, input.contacts);
  const atRiskOrganisations = input.organisations.filter(
    (org) => Number(org.onboardingCompleteness ?? 0) > 0 && Number(org.onboardingCompleteness ?? 0) < 80,
  ).length;
  const activeContacts = input.contacts.filter((contact) =>
    ACTIVE_CONTACT_STATUSES.has(String(contact.status ?? '')),
  ).length;
  const complianceHealthPercent =
    input.totalPlots > 0 ? Math.round((input.compliantPlots / input.totalPlots) * 100) : null;

  const orgReadiness =
    input.organisations.length > 0
      ? input.organisations.reduce((sum, org) => sum + Number(org.onboardingCompleteness ?? 0), 0) /
        input.organisations.length
      : null;

  const transparencyIndex =
    complianceHealthPercent !== null || orgReadiness !== null
      ? Math.round(
          ((complianceHealthPercent ?? 0) * 0.55 + (orgReadiness ?? 0) * 0.45) *
            (input.organisations.length > 0 ? 1 : 0.65),
        )
      : null;

  return {
    countriesCovered: countries.filter((row) => row.country !== 'Unassigned').length,
    commoditiesTracked: commodities.filter((row) => row.commodity !== 'Unspecified commodity').length,
    networkRolesRepresented: roles.length,
    governedOrganisations: input.organisations.length,
    activeContacts,
    complianceHealthPercent,
    atRiskOrganisations,
    transparencyIndex,
  };
}
