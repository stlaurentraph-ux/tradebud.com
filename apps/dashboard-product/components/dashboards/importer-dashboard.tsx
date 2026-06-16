'use client';

import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSearch,
  Globe,
  Send,
  ArrowRight,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { MiniReviewQueue } from '@/components/dashboards/mini-review-queue';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import type { ShipmentStatus } from '@/types';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { DashboardQuickActions } from '@/components/dashboards/dashboard-quick-actions';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import {
  formatImporterVerifiedPct,
  getImporterDashboardLabels,
  getImporterIncomingShipmentsHint,
  getImporterTracesReadyHint,
  getImporterUpstreamActivityHint,
  getNorthStarPriorityLabel,
} from '@/lib/terminology-labels';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import { homeActivityProps, homeCampaignProps, homePackageProps } from '@/lib/dashboard-home-props';

interface ImporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
  };
  home?: DashboardHomeResources;
}

export function ImporterDashboard({ metrics, home }: ImporterDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getImporterDashboardLabels(t), [t]);
  const pendingReview = (metrics.packages_by_status?.READY || 0) + (metrics.packages_by_status?.ON_HOLD || 0);
  const approvedPackages = (metrics.packages_by_status?.SEALED || 0) + (metrics.packages_by_status?.SUBMITTED || 0);
  const isVirginTenant = isVirginTenantForRole('importer', metrics);

  if (isVirginTenant) {
    return <VirginStatePanel role="importer" progress={{ total_packages: metrics.total_packages, total_plots: metrics.total_plots }} />;
  }

  const northStar = getNorthStarForRole('importer', metrics, t);
  const verifiedPct = Math.round((metrics.compliant_plots / metrics.total_plots) * 100) || 0;

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}
      <MiniReviewQueue role="importer" {...homePackageProps(home)} />
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
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiIncomingShipments}</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">{getImporterIncomingShipmentsHint(t)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiPendingReview}</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiPendingReviewHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiEudrCompliant}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedPackages}</div>
            <p className="text-xs text-muted-foreground mt-1">{getImporterTracesReadyHint(t)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiTracedOrigins}</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiTracedOriginsHint}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.complianceStatusTitle}</CardTitle>
            <CardDescription>{copy.complianceStatusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: copy.complianceFullyCompliant, count: approvedPackages, color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: copy.complianceReady, count: metrics.packages_by_status?.READY || 0, color: 'bg-blue-500', icon: Clock },
              { label: copy.complianceOnHold, count: metrics.packages_by_status?.ON_HOLD || 0, color: 'bg-amber-500', icon: AlertTriangle },
              { label: copy.complianceDraft, count: metrics.packages_by_status?.DRAFT || 0, color: 'bg-gray-400', icon: FileSearch },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${metrics.total_packages > 0 ? (item.count / metrics.total_packages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.traceabilityTitle}</CardTitle>
            <CardDescription>{copy.traceabilityDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">{copy.traceabilityOriginCountries}</div>
                  <div className="text-sm text-muted-foreground">{copy.traceabilityOriginHint}</div>
                </div>
              </div>
              <Badge>{metrics.total_plots > 0 ? copy.traceabilityOriginAvailable : copy.traceabilityOriginNone}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">{copy.traceabilityDeforestationFree}</div>
                  <div className="text-sm text-muted-foreground">{copy.traceabilityBaselineHint}</div>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                {formatImporterVerifiedPct(verifiedPct, t)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardActivityCard
        isVirginTenant={isVirginTenant}
        emptyMessage={getImporterUpstreamActivityHint(t)}
        {...homeActivityProps(home)}
      />

      <DashboardQuickActions visible={isVirginTenant} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/packages">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickViewShipments}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickViewShipmentsHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickComplianceQueue}</h4>
                <p className="text-sm text-muted-foreground">{copy.tracesFilingHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/contacts/add?mode=contact">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                <UserPlus className="h-6 w-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickAddContact}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickAddContactHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/outreach?new=1">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <Send className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickLaunchCampaign}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickLaunchCampaignHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </DashboardQuickActions>
    </div>
  );
}
