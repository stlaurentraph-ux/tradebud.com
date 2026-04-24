'use client';

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

interface SponsorDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<string, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
}

const sponsorOverviewStats = [
  { label: 'Governed organisations', value: '42', hint: '4 pending activation', icon: Building2, tone: 'text-blue-600 bg-blue-100' },
  { label: 'Active farmers', value: '9,842', hint: '88% mapped coverage', icon: Users, tone: 'text-emerald-600 bg-emerald-100' },
  { label: 'Compliance health', value: '91%', hint: '5 blocked workflows', icon: ShieldCheck, tone: 'text-purple-600 bg-purple-100' },
  { label: 'Delegated admin alerts', value: '7', hint: '3 policy exceptions pending', icon: Scale, tone: 'text-amber-700 bg-amber-100' },
];

const networkHealthSegments = [
  {
    id: 'org-1',
    name: 'North Highlands Cooperative',
    country: 'Peru',
    complianceRate: 95,
    riskTier: 'Low',
    status: 'Active',
    escalations: 0,
  },
  {
    id: 'org-2',
    name: 'Rift Valley Producer Alliance',
    country: 'Kenya',
    complianceRate: 89,
    riskTier: 'Moderate',
    status: 'Active',
    escalations: 2,
  },
  {
    id: 'org-3',
    name: 'Kivu Open Chain Network',
    country: 'DR Congo',
    complianceRate: 76,
    riskTier: 'High',
    status: 'At Risk',
    escalations: 4,
  },
];

const sponsorProgrammes = [
  {
    id: 'prog-1',
    title: 'Open Chain Living Income Profile',
    scope: '12 cooperatives',
    adoption: 68,
    status: 'Enforced',
  },
  {
    id: 'prog-2',
    title: 'Regenerative Practice Acceleration',
    scope: '4 countries',
    adoption: 53,
    status: 'Active',
  },
  {
    id: 'prog-3',
    title: 'Sponsor-funded Evidence Remediation',
    scope: '1,240 farmers',
    adoption: 34,
    status: 'Needs Attention',
  },
];

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
  const atRiskOrgs = networkHealthSegments.filter((segment) => segment.status === 'At Risk').length;
  const withSponsorView = (href: string) => {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}sponsorView=${sponsorView}`;
  };

  const emphasisOrder =
    sponsorView === 'country'
      ? ['Network', 'Organisations', 'Compliance Health', 'Programmes', 'Reporting']
      : ['Compliance Health', 'Programmes', 'Reporting', 'Billing & Coverage', 'Requests'];

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
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intervention Queue</CardTitle>
            <CardDescription>Urgent sponsor-level actions requiring bounded intervention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">3 policy exceptions pending approval</p>
              <p className="text-xs text-muted-foreground">Delegated Admin</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">2 organisations suspended for uncovered billing events</p>
              <p className="text-xs text-muted-foreground">Billing & Coverage</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">4 unresolved substantiated concerns above SLA</p>
              <p className="text-xs text-muted-foreground">Issues</p>
            </div>
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
