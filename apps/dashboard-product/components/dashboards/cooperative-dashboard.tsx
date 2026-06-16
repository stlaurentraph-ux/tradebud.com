'use client';

import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Package,
  FileCheck,
  ClipboardList,
} from 'lucide-react';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import type { ShipmentStatus } from '@/types';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { DashboardQuickActions } from '@/components/dashboards/dashboard-quick-actions';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import {
  formatCooperativeBadge,
  formatCooperativePlotCoverageHint,
  getCooperativeDashboardLabels,
  getNorthStarPriorityLabel,
} from '@/lib/terminology-labels';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import { homeActivityProps, homeCampaignProps } from '@/lib/dashboard-home-props';

interface CooperativeDashboardProps {
  metrics: {
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
    incoming_requests_pending?: number;
    outgoing_requests_pending?: number;
    members_missing_consent?: number;
    requests_overdue?: number;
    portability_reviews_pending?: number;
    blocking_issues_count?: number;
    geometry_remediation_count?: number;
    packages_by_status?: Partial<Record<ShipmentStatus, number>>;
  };
  home?: DashboardHomeResources;
}

export function CooperativeDashboard({ metrics, home }: CooperativeDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getCooperativeDashboardLabels(t), [t]);

  const pendingPlots = metrics.total_plots - metrics.compliant_plots;
  const verificationRate =
    metrics.total_plots > 0 ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) : 0;
  const incomingPending = metrics.incoming_requests_pending ?? 0;
  const membersMissingConsent = metrics.members_missing_consent ?? 0;
  const requestsOverdue = metrics.requests_overdue ?? 0;
  const portabilityPending = metrics.portability_reviews_pending ?? 0;
  const blockingIssues = metrics.blocking_issues_count ?? 0;
  const readyShipments =
    (metrics.packages_by_status?.READY ?? 0) + (metrics.packages_by_status?.SEALED ?? 0);
  const isVirginTenant = isVirginTenantForRole('cooperative', metrics);

  if (isVirginTenant) {
    return (
      <VirginStatePanel
        role="cooperative"
        progress={{
          total_plots: metrics.total_plots,
          total_farmers: metrics.total_farmers,
          total_packages: metrics.packages_by_status
            ? Object.values(metrics.packages_by_status).reduce((a, b) => a + (b ?? 0), 0)
            : 0,
        }}
      />
    );
  }

  const northStar = getNorthStarForRole('cooperative', metrics, t);

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}
      <CampaignsOverviewCard
        description={copy.campaignDescription}
        createHref="/outreach?new=1"
        listHref="/outreach"
        emptyDescription={copy.campaignEmptyDescription}
        emptyCtaLabel={copy.campaignEmptyCta}
        {...homeCampaignProps(home)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiMembers}</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_farmers}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiMembersHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiPlotCoverage}</CardTitle>
            <MapPin className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verificationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCooperativePlotCoverageHint(metrics.compliant_plots, metrics.total_plots, t)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiBlockedBatches}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{blockingIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiBlockedBatchesHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiPremiumGovernance}</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{portabilityPending}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiPremiumGovernanceHint}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.healthTitle}</CardTitle>
          <CardDescription>{copy.healthDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{copy.healthConsentTitle}</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{membersMissingConsent}</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.healthConsentHint}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{copy.healthGeometryTitle}</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{Math.max(0, pendingPlots)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.healthGeometryHint}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{copy.healthOverdueTitle}</p>
            <p className="mt-2 text-2xl font-bold">{requestsOverdue}</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.healthOverdueHint}</p>
          </div>
        </CardContent>
      </Card>

      <DashboardActivityCard
        title={copy.activityTitle}
        description={copy.activityDescription}
        isVirginTenant={isVirginTenant}
        emptyMessage={copy.activityEmpty}
        {...homeActivityProps(home)}
      />

      <DashboardQuickActions visible={isVirginTenant} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              {copy.panelMembersTitle}
            </CardTitle>
            <CardDescription>{copy.panelMembersDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/contacts/add?mode=contact"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionAddMember}</span>
              <Badge variant="outline">{copy.badgeNew}</Badge>
            </Link>
            <Link
              href="/contacts"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionMemberDirectory}</span>
              <Badge variant="outline">{metrics.total_farmers}</Badge>
            </Link>
            <Link
              href="/governance"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionPortabilityQueue}</span>
              <Badge variant="outline">{formatCooperativeBadge('pending', portabilityPending, t)}</Badge>
            </Link>
            <Link
              href="/fpic"
              className="flex items-center justify-between rounded-lg bg-amber-50 p-3 transition-colors hover:bg-amber-100"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-amber-700" />
                <span className="font-medium text-amber-700">{copy.actionConsentMissing}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-700" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              {copy.panelFieldTitle}
            </CardTitle>
            <CardDescription>{copy.panelFieldDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/plots"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionPlotRegistry}</span>
              <Badge variant="outline">{formatCooperativeBadge('plots', metrics.total_plots, t)}</Badge>
            </Link>
            <Link
              href="/field-operations"
              className="flex items-center justify-between rounded-lg bg-amber-50 p-3 transition-colors hover:bg-amber-100"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-700" />
                <span className="font-medium text-amber-800">{copy.actionBoundaryFollowup}</span>
              </div>
              {(metrics.geometry_remediation_count ?? 0) > 0 ? (
                <Badge variant="outline">{metrics.geometry_remediation_count}</Badge>
              ) : (
                <ArrowRight className="h-4 w-4 text-amber-700" />
              )}
            </Link>
            <Link
              href="/field-operations"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="font-medium">{copy.actionFieldRemediation}</span>
              </div>
              {incomingPending > 0 ? (
                <Badge variant="outline">{formatCooperativeBadge('pending', incomingPending, t)}</Badge>
              ) : null}
            </Link>
            <Link
              href="/compliance/issues"
              className="flex items-center justify-between rounded-lg bg-red-50 p-3 transition-colors hover:bg-red-100"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-700" />
                <span className="font-medium text-red-700">{copy.actionDuplicateFlags}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-red-700" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              {copy.panelBatchesTitle}
            </CardTitle>
            <CardDescription>{copy.panelBatchesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/harvests/new"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionAddBatch}</span>
              <Badge variant="outline">{copy.badgeNew}</Badge>
            </Link>
            <Link
              href="/harvests"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionBatchIntegrity}</span>
              {blockingIssues > 0 ? (
                <Badge variant="outline">{formatCooperativeBadge('blocked', blockingIssues, t)}</Badge>
              ) : null}
            </Link>
            <Link
              href="/packages"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{copy.actionShipmentReadiness}</span>
              {readyShipments > 0 ? (
                <Badge variant="outline">{formatCooperativeBadge('ready', readyShipments, t)}</Badge>
              ) : null}
            </Link>
            <Link
              href="/governance"
              className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 transition-colors hover:bg-emerald-100"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="font-medium text-emerald-700">{copy.actionPremiumPayout}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-700" />
            </Link>
          </CardContent>
        </Card>
      </DashboardQuickActions>
    </div>
  );
}
