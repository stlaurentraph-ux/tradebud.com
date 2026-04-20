'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  Building2,
  Send,
  ArrowRight,
  ShieldCheck,
  BarChart3,
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

// Mock sponsored organizations
const mockSponsoredOrgs = [
  {
    id: 'org-1',
    name: 'Cocoa Farmers Collective',
    type: 'cooperative',
    farmers_count: 245,
    plots_count: 312,
    compliance_rate: 94,
    pending_campaigns: 2,
    status: 'active',
  },
  {
    id: 'org-2',
    name: 'Highland Coffee Producers',
    type: 'cooperative',
    farmers_count: 128,
    plots_count: 156,
    compliance_rate: 87,
    pending_campaigns: 1,
    status: 'active',
  },
  {
    id: 'org-3',
    name: 'Sustainable Palm Network',
    type: 'association',
    farmers_count: 89,
    plots_count: 104,
    compliance_rate: 72,
    pending_campaigns: 3,
    status: 'at_risk',
  },
  {
    id: 'org-4',
    name: 'Amazon Forest Guardians',
    type: 'ngo',
    farmers_count: 67,
    plots_count: 83,
    compliance_rate: 98,
    pending_campaigns: 0,
    status: 'active',
  },
];

// Mock active campaigns
const mockCampaigns = [
  {
    id: 'camp-1',
    title: 'Q2 FPIC Documentation Update',
    type: 'FPIC',
    target_orgs: 3,
    responses: { sent: 245, received: 189, pending: 56 },
    deadline: '2026-04-30',
    status: 'RUNNING',
  },
  {
    id: 'camp-2',
    title: 'Plot Boundary Verification',
    type: 'PLOT_UPDATE',
    target_orgs: 2,
    responses: { sent: 156, received: 45, pending: 111 },
    deadline: '2026-05-15',
    status: 'RUNNING',
  },
  {
    id: 'camp-3',
    title: 'Deforestation Assessment 2026',
    type: 'EVIDENCE',
    target_orgs: 4,
    responses: { sent: 0, received: 0, pending: 0 },
    deadline: '2026-06-01',
    status: 'DRAFT',
  },
];

// Mock recent activity
const mockRecentActivity: TimelineEvent[] = [
  {
    id: '1',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userName: 'Cocoa Farmers Collective',
    description: 'Submitted 23 FPIC consent documents',
  },
  {
    id: '2',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    userName: 'Highland Coffee Producers',
    description: 'Completed plot boundary verification for 45 plots',
  },
  {
    id: '3',
    eventType: 'alert',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    userName: 'System',
    description: 'Sustainable Palm Network: 3 producers at risk - missing documentation',
  },
  {
    id: '4',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userName: 'Amazon Forest Guardians',
    description: 'Achieved 98% compliance rate across all producers',
  },
];

export function SponsorDashboard({ metrics }: SponsorDashboardProps) {
  // Calculate sponsor-specific KPIs
  const totalSponsoredFarmers = mockSponsoredOrgs.reduce((sum, org) => sum + org.farmers_count, 0);
  const totalSponsoredPlots = mockSponsoredOrgs.reduce((sum, org) => sum + org.plots_count, 0);
  const avgComplianceRate = Math.round(
    mockSponsoredOrgs.reduce((sum, org) => sum + org.compliance_rate, 0) / mockSponsoredOrgs.length
  );
  const atRiskOrgs = mockSponsoredOrgs.filter((org) => org.status === 'at_risk').length;
  const activeCampaigns = mockCampaigns.filter((c) => c.status === 'RUNNING').length;
  const pendingResponses = mockCampaigns.reduce((sum, c) => sum + c.responses.pending, 0);

  const getOrgStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'at_risk':
        return 'bg-amber-100 text-amber-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusColor = (status: string): 'default' | 'outline' | 'secondary' => {
    switch (status) {
      case 'RUNNING':
        return 'default';
      case 'DRAFT':
        return 'outline';
      case 'COMPLETED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <span className="sr-only">
        Network metrics snapshot: {metrics.total_packages} packages, {metrics.total_plots} plots (
        {metrics.compliant_plots} compliant), {metrics.total_farmers} farmers.
      </span>
      {/* Network Overview KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sponsored Organizations</p>
                <p className="text-3xl font-bold mt-1">{mockSponsoredOrgs.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {atRiskOrgs > 0 && (
                    <span className="text-amber-600">{atRiskOrgs} at risk</span>
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Producers</p>
                <p className="text-3xl font-bold mt-1">{totalSponsoredFarmers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {totalSponsoredPlots.toLocaleString()} plots
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compliance Rate</p>
                <p className="text-3xl font-bold mt-1">{avgComplianceRate}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      avgComplianceRate >= 90 ? 'bg-emerald-500' : avgComplianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${avgComplianceRate}%` }}
                  />
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-3xl font-bold mt-1">{activeCampaigns}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {pendingResponses} pending responses
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sponsored Organizations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sponsored Organizations</CardTitle>
              <CardDescription>Monitor compliance across your network</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/farmers">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSponsoredOrgs.map((org) => (
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
                        {org.farmers_count} producers • {org.plots_count} plots
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{org.compliance_rate}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={cn(
                            'h-1.5 rounded-full',
                            org.compliance_rate >= 90
                              ? 'bg-emerald-500'
                              : org.compliance_rate >= 70
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          )}
                          style={{ width: `${org.compliance_rate}%` }}
                        />
                      </div>
                    </div>
                    <Badge className={cn('capitalize', getOrgStatusColor(org.status))}>
                      {org.status.replace('_', ' ')}
                    </Badge>
                    {org.pending_campaigns > 0 && (
                      <Badge variant="outline" className="text-amber-600">
                        {org.pending_campaigns} pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Network updates and responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline events={mockRecentActivity} />
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Request Campaigns</CardTitle>
            <CardDescription>Track data collection progress across your network</CardDescription>
          </div>
          <Button asChild>
            <Link href="/requests">
              <Send className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => {
              const responseRate =
                campaign.responses.sent > 0
                  ? Math.round((campaign.responses.received / campaign.responses.sent) * 100)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-foreground">{campaign.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {campaign.type}
                      </Badge>
                      <Badge variant={getCampaignStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.target_orgs} organizations • Due: {new Date(campaign.deadline).toLocaleDateString()}
                    </p>
                  </div>

                  {campaign.status === 'RUNNING' && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{campaign.responses.received}</p>
                        <p className="text-xs text-muted-foreground">Received</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{campaign.responses.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="w-24">
                        <p className="text-sm font-medium text-right mb-1">{responseRate}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${responseRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {campaign.status === 'DRAFT' && (
                    <Button variant="outline" size="sm">
                      Launch Campaign
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href="/requests" className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Send Request</p>
                <p className="text-sm text-muted-foreground">Request data from producers</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href="/reports" className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">View Reports</p>
                <p className="text-sm text-muted-foreground">Compliance analytics</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Link href="/compliance/queue" className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Review Issues</p>
                <p className="text-sm text-muted-foreground">{atRiskOrgs} orgs need attention</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
