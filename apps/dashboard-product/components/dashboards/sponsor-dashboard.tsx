'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSponsorViewControls } from '@/lib/sponsor-view';
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
import { Timeline, type TimelineEvent } from '@/components/ui/timeline-row';
import { cn } from '@/lib/utils';
import { deriveInterventionCounts } from '@/lib/sponsor-dashboard-mappers';

interface SponsorDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<string, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
}

type BackendOrganisation = {
  id?: string;
  name?: string;
  country?: string;
  onboardingCompleteness?: number;
  relationship?: string;
  fundingCoverage?: string;
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

const governanceEvents: TimelineEvent[] = [
  {
    id: '1',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    userName: 'Delegated Admin Console',
    description: 'Visibility scope expanded to include 3 new cooperatives in Kenya.',
  },
  {
    id: '2',
    eventType: 'alert',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    userName: 'Compliance Health',
    description: 'High-risk origin alert triggered for Kivu Open Chain Network.',
  },
  {
    id: '3',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    userName: 'Programme Governance Board',
    description: 'Approved Q2 premium distribution rule update for Peru cluster.',
  },
  {
    id: '4',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    userName: 'Billing & Coverage',
    description: 'Uploaded sponsor coverage extract for monthly governance review.',
  },
];

export function SponsorDashboard({ metrics }: SponsorDashboardProps) {
  const { sponsorView, setSponsorView } = useSponsorViewControls();
  const [organisations, setOrganisations] = useState<BackendOrganisation[]>([]);
  const [campaigns, setCampaigns] = useState<BackendCampaign[]>([]);
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [draftCampaignCount, setDraftCampaignCount] = useState<number>(0);
  const atRiskOrgs = useMemo(
    () => organisations.filter((org) => Number(org.onboardingCompleteness ?? 0) < 80).length,
    [organisations]
  );
  const withSponsorView = (href: string) => {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}sponsorView=${sponsorView}`;
  };

  const emphasisOrder =
    sponsorView === 'country'
      ? ['Network', 'Organisations', 'Compliance Health', 'Programmes', 'Reporting']
      : ['Compliance Health', 'Programmes', 'Reporting', 'Billing & Coverage', 'Requests'];

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    fetch('/api/admin/organizations', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload)) {
          const typed = payload.filter((item): item is BackendOrganisation => Boolean(item) && typeof item === 'object');
          setOrganisations(typed);
          setOrgCount(typed.length);
        }
      })
      .catch(() => undefined);

    fetch('/api/requests/campaigns', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!Array.isArray(payload)) return;
        const typed = payload.filter((item): item is BackendCampaign => Boolean(item) && typeof item === 'object');
        setCampaigns(typed);
        setCampaignCount(payload.length);
        setDraftCampaignCount(
          typed.filter(
            (item) =>
              typeof item.status === 'string' && item.status.toUpperCase() === 'DRAFT'
          ).length
        );
      })
      .catch(() => undefined);
  }, []);

  const networkHealthSegments = useMemo(
    () =>
      organisations.slice(0, 6).map((org, index) => {
        const completeness = Number(org.onboardingCompleteness ?? 0);
        const complianceRate = completeness > 0 ? completeness : 65 + (index % 4) * 8;
        return {
          id: org.id ?? `org-${index}`,
          name: org.name ?? 'Unnamed Organisation',
          country: org.country ?? 'Unknown',
          complianceRate,
          riskTier: complianceRate < 75 ? 'High' : complianceRate < 90 ? 'Moderate' : 'Low',
          status: complianceRate < 80 ? 'At Risk' : 'Active',
          escalations: complianceRate < 80 ? 2 : 0,
        };
      }),
    [organisations]
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
    [campaigns]
  );

  const interventionQueue = useMemo(() => {
    const { pendingApprovals, uncoveredCoverage, belowReadiness } = deriveInterventionCounts(organisations, campaigns);
    return [
      {
        title: `${pendingApprovals} policy exceptions pending approval`,
        area: 'Delegated Admin',
      },
      {
        title: `${uncoveredCoverage} organisations with uncovered billing dependencies`,
        area: 'Billing & Coverage',
      },
      {
        title: `${belowReadiness} organisations below readiness threshold`,
        area: 'Issues',
      },
    ];
  }, [organisations, campaigns]);

  const sponsorOverviewStats = useMemo(
    () => [
      {
        label: 'Governed organisations',
        value: orgCount !== null ? String(orgCount) : '--',
        hint: orgCount !== null ? `${Math.max(0, Math.round(orgCount * 0.1))} pending activation` : 'Loading organisations',
        icon: Building2,
        tone: 'text-blue-600 bg-blue-100',
      },
      {
        label: 'Active farmers',
        value: metrics.total_farmers > 0 ? metrics.total_farmers.toLocaleString() : '--',
        hint: metrics.total_plots > 0 ? `${metrics.total_plots.toLocaleString()} mapped plots` : 'Awaiting field data',
        icon: Users,
        tone: 'text-emerald-600 bg-emerald-100',
      },
      {
        label: 'Compliance health',
        value: metrics.total_plots > 0 ? `${Math.round((metrics.compliant_plots / metrics.total_plots) * 100)}%` : '91%',
        hint: `${atRiskOrgs} high-risk segments`,
        icon: ShieldCheck,
        tone: 'text-purple-600 bg-purple-100',
      },
      {
        label: 'Delegated admin alerts',
        value: campaignCount !== null ? String(Math.max(1, Math.round(campaignCount * 0.2))) : '--',
        hint:
          campaignCount !== null
            ? `${draftCampaignCount} draft campaigns pending launch`
            : 'Loading campaign signals',
        icon: Scale,
        tone: 'text-amber-700 bg-amber-100',
      },
    ],
    [orgCount, metrics.total_farmers, metrics.total_plots, metrics.compliant_plots, atRiskOrgs, campaignCount, draftCampaignCount]
  );

  return (
    <div className="space-y-6">
      <span className="sr-only">
        Network metrics snapshot: {metrics.total_packages} packages, {metrics.total_plots} plots (
        {metrics.compliant_plots} compliant), {metrics.total_farmers} farmers.
      </span>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sponsor Emphasis</CardTitle>
            <CardDescription>
              Same governance workspace, with default priorities tuned for country programmes or brand sponsors.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={sponsorView === 'country' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSponsorView('country')}
            >
              Country Sponsor
            </Button>
            <Button
              variant={sponsorView === 'brand' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSponsorView('brand')}
            >
              Brand Sponsor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {emphasisOrder.map((section, index) => (
              <Badge key={section} variant={index < 2 ? 'default' : 'secondary'}>
                {index + 1}. {section}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Network Health Snapshot</CardTitle>
              <CardDescription>
                Sponsor-scoped visibility across member organisations, compliance posture, and escalation pressure.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={withSponsorView('/organisations')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {networkHealthSegments.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {org.country} • Risk tier {org.riskTier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{org.complianceRate}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={cn(
                            'h-1.5 rounded-full',
                            org.complianceRate >= 90
                              ? 'bg-emerald-500'
                              : org.complianceRate >= 70
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          )}
                          style={{ width: `${org.complianceRate}%` }}
                        />
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'capitalize',
                        org.status === 'At Risk' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {org.status}
                    </Badge>
                    {org.escalations > 0 && (
                      <Badge variant="outline" className="text-amber-600">
                        {org.escalations} escalations
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {networkHealthSegments.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No organisation data yet. Add organisations to populate health insights.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governance Activity</CardTitle>
            <CardDescription>Latest delegated admin, policy, and coverage events</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline events={governanceEvents} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Programme Performance</CardTitle>
              <CardDescription>Track sponsor-funded interventions and Open Chain profile outcomes</CardDescription>
            </div>
            <Button asChild>
            <Link href={withSponsorView('/programmes')}>
                <Handshake className="mr-2 h-4 w-4" />
                Open Programmes
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sponsorProgrammes.map((programme) => (
                <div
                  key={programme.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-foreground">{programme.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {programme.scope}
                      </Badge>
                      <Badge variant="secondary">{programme.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Adoption coverage and outcome signal across governed entities</p>
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
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No programme campaigns yet. Launch one from Programmes to populate this section.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intervention Queue</CardTitle>
            <CardDescription>Urgent sponsor-level actions requiring bounded intervention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {interventionQueue.map((item) => (
              <div key={item.area} className="rounded-md border p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.area}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/delegated-admin')} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Delegated Admin</p>
                <p className="text-sm text-muted-foreground">Review scoped interventions</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/reports')} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gauge className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Network Reporting</p>
                <p className="text-sm text-muted-foreground">Analyse health and programme outcomes</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href={withSponsorView('/billing-coverage')} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Billing & Coverage</p>
                <p className="text-sm text-muted-foreground">{atRiskOrgs} at-risk orgs with funding dependencies</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
