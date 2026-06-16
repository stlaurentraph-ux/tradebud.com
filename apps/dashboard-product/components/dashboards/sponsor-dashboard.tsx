'use client';

import { useContext, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSponsorView } from '@/lib/sponsor-view';
import {
  ArrowRight,
  Banknote,
  Building2,
  Gauge,
  Handshake,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deriveInterventionCounts } from '@/lib/sponsor-dashboard-mappers';
import { useSponsorDashboardSummary } from '@/lib/use-sponsor-dashboard-summary';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { SponsorNetworkHero } from '@/components/dashboards/sponsor-network-hero';
import { SponsorNetworkCoverage } from '@/components/dashboards/sponsor-network-coverage';
import { SponsorRoleClassification } from '@/components/dashboards/sponsor-role-classification';
import { SponsorTransparencyPanel } from '@/components/dashboards/sponsor-transparency-panel';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { DashboardQuickActions } from '@/components/dashboards/dashboard-quick-actions';
import { DeferredDashboardSection } from '@/components/dashboards/deferred-dashboard-section';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import { homeActivityProps, homeCampaignProps } from '@/lib/dashboard-home-props';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import { translateNavItemName } from '@/lib/nav-labels';
import {
  formatSponsorBillingQuickHint,
  formatSponsorStatHint,
  getNorthStarPriorityLabel,
  getSponsorDashboardLabels,
  getSponsorInterventionItems,
} from '@/lib/terminology-labels';

interface SponsorDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<string, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
  home?: DashboardHomeResources;
}

type BackendOrganisation = {
  id?: string;
  name?: string;
  country?: string;
  type?: string;
  status?: string;
  onboardingCompleteness?: number;
  relationship?: string;
  roleInNetwork?: string;
};

type BackendCampaign = {
  id?: string;
  title?: string;
  status?: string;
  target_organization_ids?: unknown[];
  target_farmer_ids?: unknown[];
  target_plot_ids?: unknown[];
  target_contact_emails?: unknown[];
  commodity?: string;
};

function mapOrganisationRecord(record: Record<string, unknown>): BackendOrganisation {
  const completenessRaw = Number(record.onboardingCompleteness);
  const status = String(record.status ?? '').toUpperCase();
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? 'Unnamed Organisation'),
    country: String(record.country ?? 'Unknown'),
    type: String(record.type ?? record.roleInNetwork ?? 'partner'),
    status,
    onboardingCompleteness: Number.isFinite(completenessRaw)
      ? completenessRaw
      : status === 'ACTIVE'
        ? 85
        : status === 'PENDING'
          ? 55
          : 0,
    relationship: typeof record.relationship === 'string' ? record.relationship : undefined,
    roleInNetwork: typeof record.roleInNetwork === 'string' ? record.roleInNetwork : undefined,
  };
}

export function SponsorDashboard({ metrics, home }: SponsorDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getSponsorDashboardLabels(t), [t]);
  const sponsorView = useSponsorView();
  const fetchedSummary = useSponsorDashboardSummary(!home?.sponsorSummary, {
    total_plots: metrics.total_plots,
    compliant_plots: metrics.compliant_plots,
  });
  const summary = home?.sponsorSummary
    ? { ...home.sponsorSummary, isLoading: false, error: null }
    : fetchedSummary;

  const organisations = useMemo(
    () =>
      summary.rawOrganisations
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map(mapOrganisationRecord),
    [summary.rawOrganisations],
  );
  const campaigns = summary.rawCampaigns;
  const orgCount = summary.organisationCount;
  const campaignCount = summary.campaignCount;
  const draftCampaignCount = summary.draftCampaignCount;
  const countryCoverage = summary.countryCoverage;
  const commodityCoverage = summary.commodityCoverage;
  const networkRoles = summary.networkRoles;
  const transparencyMetrics = summary.transparencyMetrics;

  const withSponsorView = (href: string) => {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}sponsorView=${sponsorView}`;
  };

  const emphasisOrder =
    sponsorView === 'country'
      ? ['Network', 'Organisations', 'Compliance Health', 'Programmes', 'Reporting']
      : ['Compliance Health', 'Programmes', 'Reporting', 'Billing & Coverage', 'Requests'];

  const atRiskOrgs = useMemo(
    () => organisations.filter((org) => Number(org.onboardingCompleteness ?? 0) < 80).length,
    [organisations],
  );

  const networkHealthSegments = useMemo(
    () =>
      organisations.slice(0, 6).map((org, index) => {
        const completeness = Number(org.onboardingCompleteness ?? 0);
        const hasCompleteness = completeness > 0;
        const complianceRate = hasCompleteness ? completeness : 0;
        return {
          id: org.id ?? `org-${index}`,
          name: org.name ?? 'Unnamed Organisation',
          country: org.country ?? 'Unknown',
          complianceRate,
          riskTier: !hasCompleteness ? 'Unknown' : complianceRate < 75 ? 'High' : complianceRate < 90 ? 'Moderate' : 'Low',
          status: !hasCompleteness ? 'Pending data' : complianceRate < 80 ? 'At Risk' : 'Active',
          escalations: hasCompleteness && complianceRate < 80 ? 1 : 0,
        };
      }),
    [organisations],
  );

  const sponsorProgrammes = useMemo(
    () =>
      campaigns.slice(0, 6).map((campaign, index) => {
        const targetCount =
          (Array.isArray(campaign.target_organization_ids) ? campaign.target_organization_ids.length : 0) +
          (Array.isArray(campaign.target_farmer_ids) ? campaign.target_farmer_ids.length : 0) +
          (Array.isArray(campaign.target_plot_ids) ? campaign.target_plot_ids.length : 0) +
          (Array.isArray(campaign.target_contact_emails) ? campaign.target_contact_emails.length : 0);
        const status = typeof campaign.status === 'string' ? campaign.status.toUpperCase() : 'RUNNING';
        return {
          id: campaign.id ?? `prog-${index}`,
          title: campaign.title ?? 'Programme Campaign',
          scope: `${targetCount || 0} recipients`,
          adoption: status === 'COMPLETED' ? 100 : status === 'DRAFT' ? 25 : 60,
          status: status === 'DRAFT' ? 'Draft' : status === 'COMPLETED' ? 'Completed' : 'Active',
        };
      }),
    [campaigns],
  );

  const interventionQueue = useMemo(() => {
    const { pendingApprovals, uncoveredCoverage, belowReadiness } = deriveInterventionCounts(
      organisations,
      campaigns,
    );
    return getSponsorInterventionItems(
      { pendingApprovals, uncoveredCoverage, belowReadiness },
      t,
    );
  }, [organisations, campaigns, t]);

  const sponsorOverviewStats = useMemo(
    () => [
      {
        label: copy.statCountries,
        value: String(transparencyMetrics?.countriesCovered ?? 0),
        hint: formatSponsorStatHint('countries', {
          count: transparencyMetrics?.governedOrganisations ?? 0,
        }, t),
        icon: Building2,
        tone: 'text-blue-600 bg-blue-100',
      },
      {
        label: copy.statCommodities,
        value: String(transparencyMetrics?.commoditiesTracked ?? 0),
        hint:
          campaignCount !== null
            ? formatSponsorStatHint('commodities', { count: campaignCount }, t)
            : formatSponsorStatHint('commodities_loading', {}, t),
        icon: Handshake,
        tone: 'text-emerald-600 bg-emerald-100',
      },
      {
        label: copy.statRoles,
        value: String(transparencyMetrics?.networkRolesRepresented ?? 0),
        hint: formatSponsorStatHint('roles', { count: transparencyMetrics?.activeContacts ?? 0 }, t),
        icon: Users,
        tone: 'text-cyan-700 bg-cyan-100',
      },
      {
        label: copy.statTransparency,
        value:
          transparencyMetrics?.transparencyIndex != null
            ? `${transparencyMetrics.transparencyIndex}%`
            : '--',
        hint: formatSponsorStatHint('transparency', { count: atRiskOrgs }, t),
        icon: ShieldCheck,
        tone: 'text-purple-600 bg-purple-100',
      },
    ],
    [transparencyMetrics, campaignCount, atRiskOrgs, copy, t],
  );

  const isVirginTenant = isVirginTenantForRole('sponsor', {
    total_packages: metrics.total_packages,
    total_plots: metrics.total_plots,
    total_farmers: metrics.total_farmers,
    organisation_count: orgCount,
    contact_count: summary.contactCount,
  });

  if (isVirginTenant) {
    return (
      <VirginStatePanel
        role="sponsor"
        progress={{
          organisation_count: orgCount,
          contact_count: summary.contactCount,
          outgoing_requests_pending: campaignCount,
        }}
      />
    );
  }

  const northStar = getNorthStarForRole('sponsor', {
    transparencyIndex: transparencyMetrics?.transparencyIndex ?? null,
    atRiskOrganisations: atRiskOrgs,
  }, t);

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}
      <SponsorNetworkHero
        sponsorView={sponsorView}
        countriesCovered={transparencyMetrics?.countriesCovered ?? 0}
        commoditiesTracked={transparencyMetrics?.commoditiesTracked ?? 0}
        withSponsorView={withSponsorView}
      />

      <CampaignsOverviewCard
        title={copy.campaignTitle}
        description={copy.campaignDescription}
        createHref={withSponsorView('/programmes?new=1')}
        listHref={withSponsorView('/programmes')}
        createLabel={copy.campaignCreate}
        emptyTitle={copy.campaignEmptyTitle}
        emptyDescription={copy.campaignEmptyDescription}
        emptyCtaLabel={copy.campaignEmptyCta}
        listLinkLabel={copy.campaignListLink}
        {...homeCampaignProps(home)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sponsorOverviewStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', stat.tone)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeferredDashboardSection minHeight={320}>
      <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div>
            <p className="text-sm font-medium">{copy.emphasisTitle}</p>
            <p className="text-sm text-muted-foreground">
              {sponsorView === 'country' ? copy.emphasisCountry : copy.emphasisBrand}{' '}
              {copy.emphasisSwitchHint}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {emphasisOrder.map((section, index) => (
                <Badge key={section} variant={index < 2 ? 'default' : 'secondary'}>
                  {index + 1}. {t ? translateNavItemName(section, t) : section}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <SponsorNetworkCoverage
        countries={countryCoverage}
        commodities={commodityCoverage}
        organisationsHref={withSponsorView('/organisations')}
      />

      <SponsorRoleClassification roles={networkRoles} inviteHref={withSponsorView('/contacts/add?mode=contact')} />

      {transparencyMetrics ? (
        <SponsorTransparencyPanel
          metrics={transparencyMetrics}
          complianceHealthHref={withSponsorView('/compliance-health')}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between border-b py-4">
              <div>
                <p className="text-lg font-semibold">{copy.networkHealthTitle}</p>
                <p className="text-sm text-muted-foreground">{copy.networkHealthDescription}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={withSponsorView('/organisations')}>
                  {copy.networkHealthViewAll}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4 py-4">
              {networkHealthSegments.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                      <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {org.country} · Risk tier {org.riskTier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{org.complianceRate}%</p>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-200">
                        <div
                          className={cn(
                            'h-1.5 rounded-full',
                            org.complianceRate >= 90
                              ? 'bg-emerald-500'
                              : org.complianceRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500',
                          )}
                          style={{ width: `${org.complianceRate}%` }}
                        />
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'capitalize',
                        org.status === 'At Risk' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
                      )}
                    >
                      {org.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {networkHealthSegments.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <p>{copy.networkHealthEmpty}</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href={withSponsorView('/organisations')}>{copy.networkHealthAddOrgs}</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <DashboardActivityCard
          title={copy.governanceActivityTitle}
          description={copy.governanceActivityDescription}
          emptyMessage={copy.governanceActivityEmpty}
          maxHeight={280}
          {...homeActivityProps(home)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between border-b py-4">
              <div>
                <p className="text-lg font-semibold">{copy.programmeTitle}</p>
                <p className="text-sm text-muted-foreground">{copy.programmeDescription}</p>
              </div>
              <Button asChild>
                <Link href={withSponsorView('/programmes?new=1')}>
                  <Handshake className="mr-2 h-4 w-4" aria-hidden="true" />
                  {copy.programmeNewCta}
                </Link>
              </Button>
            </div>
            <div className="space-y-4 py-4">
              {sponsorProgrammes.map((programme) => (
                <div key={programme.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <p className="font-medium text-foreground">{programme.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {programme.scope}
                      </Badge>
                      <Badge variant="secondary">{programme.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{copy.programmeAdoptionHint}</p>
                  </div>
                  <div className="w-36">
                    <p className="mb-1 text-right text-sm font-medium">{programme.adoption}%</p>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${programme.adoption}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {sponsorProgrammes.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <p>{copy.programmeEmpty}</p>
                  <Button asChild className="mt-4" size="sm" variant="outline">
                    <Link href={withSponsorView('/programmes?new=1')}>{copy.programmeEmptyCta}</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-lg font-semibold">{copy.interventionTitle}</p>
            <p className="mb-4 text-sm text-muted-foreground">{copy.interventionDescription}</p>
            <div className="space-y-3">
              {interventionQueue.map((item) => (
                <div key={item.area} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.area}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardQuickActions visible={isVirginTenant} className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/delegated-admin')} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Scale className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground">{copy.quickDelegatedAdmin}</p>
                <p className="text-sm text-muted-foreground">{copy.quickDelegatedAdminHint}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/reports')} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Gauge className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground">{copy.quickReporting}</p>
                <p className="text-sm text-muted-foreground">{copy.quickReportingHint}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/billing-coverage')} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <Banknote className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground">{copy.quickBilling}</p>
                <p className="text-sm text-muted-foreground">{formatSponsorBillingQuickHint(atRiskOrgs, t)}</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </DashboardQuickActions>
      </div>
      </DeferredDashboardSection>
    </div>
  );
}
