'use client';

import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  Package,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  AlertOctagon,
  UserPlus,
} from 'lucide-react';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import { buildShipmentSlaSnapshots, type ShipmentSlaSnapshot } from '@/lib/package-sla';
import type { DDSPackage, ShipmentStatus } from '@/types';
import { StatusChip } from '@/components/ui/status-chip';
import type { TimelineEvent } from '@/components/ui/timeline-row';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { DashboardQuickActions } from '@/components/dashboards/dashboard-quick-actions';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import { getShipmentStatusLabel } from '@/lib/status-labels';
import {
  formatExporterComplianceRateSrOnly,
  formatExporterSlaActive,
  formatExporterSlaLabel,
  getExporterDashboardLabels,
  getExporterSealedCountLabel,
  getExporterShipmentTrackDescription,
  getExporterSubmittedQueueHint,
  getNorthStarPriorityLabel,
} from '@/lib/terminology-labels';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import { homeActivityProps, homeCampaignProps } from '@/lib/dashboard-home-props';

interface ExporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
    blocking_issues_count?: number;
    yield_failures_count?: number;
    recent_activity?: TimelineEvent[];
  };
  packages?: DDSPackage[];
  home?: DashboardHomeResources;
}

export function ExporterDashboard({ metrics, packages = [], home }: ExporterDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getExporterDashboardLabels(t), [t]);

  const shipmentStates: Record<ShipmentStatus, number> = {
    DRAFT: metrics.packages_by_status?.DRAFT || 0,
    READY: metrics.packages_by_status?.READY || 0,
    SEALED: metrics.packages_by_status?.SEALED || 0,
    SUBMITTED: metrics.packages_by_status?.SUBMITTED || 0,
    ACCEPTED: metrics.packages_by_status?.ACCEPTED || 0,
    REJECTED: metrics.packages_by_status?.REJECTED || 0,
    ON_HOLD: metrics.packages_by_status?.ON_HOLD || 0,
    ARCHIVED: metrics.packages_by_status?.ARCHIVED || 0,
  };

  const slaSnapshots = buildShipmentSlaSnapshots(packages, shipmentStates);
  const renderSlaCard = (
    status: 'DRAFT' | 'READY' | 'SEALED',
    snapshot: ShipmentSlaSnapshot,
    chipStatus: ShipmentStatus,
  ) => (
    <div
      className={`rounded-lg border p-4 ${status === 'DRAFT' ? 'bg-blue-50/50' : status === 'READY' ? 'bg-cyan-50/50' : 'bg-purple-50/50'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {getShipmentStatusLabel(status, 'exporter', t)}
          </p>
          <p className="text-2xl font-bold mt-1">{snapshot.count}</p>
        </div>
        <StatusChip status={chipStatus} role="exporter" />
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>{formatExporterSlaLabel(snapshot.daysSLA, t)}</span>
          <span
            className={
              snapshot.health === 'overdue'
                ? 'text-red-600'
                : snapshot.health === 'warning'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }
          >
            {formatExporterSlaActive(snapshot.daysActive, t)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full ${snapshot.health === 'overdue' ? 'bg-red-600' : snapshot.health === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}
            style={{ width: `${Math.min((snapshot.daysActive / snapshot.daysSLA) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  const complianceRate =
    metrics.total_plots > 0 ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) : 0;

  const blockingIssuesCount = metrics.blocking_issues_count ?? 0;
  const yieldFailuresCount = metrics.yield_failures_count ?? 0;
  const shipmentsReadyToSeal = shipmentStates.READY;
  const isVirginTenant = isVirginTenantForRole('exporter', metrics);

  if (isVirginTenant) {
    return (
      <VirginStatePanel
        role="exporter"
        progress={{
          total_packages: metrics.total_packages,
          total_plots: metrics.total_plots,
          total_farmers: metrics.total_farmers,
          packages_by_status: metrics.packages_by_status,
        }}
      />
    );
  }

  const northStar = getNorthStarForRole('exporter', metrics, t);

  const terminalStates: Array<{ status: ShipmentStatus; className: string; valueClass: string }> = [
    { status: 'ACCEPTED', className: 'bg-green-50 border-green-200', valueClass: 'text-green-700' },
    { status: 'REJECTED', className: 'bg-red-50 border-red-200', valueClass: 'text-red-700' },
    { status: 'ON_HOLD', className: 'bg-amber-50 border-amber-200', valueClass: 'text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}
      <span className="sr-only">
        {formatExporterComplianceRateSrOnly(
          complianceRate,
          metrics.compliant_plots,
          metrics.total_plots,
          t,
        )}
      </span>
      <CampaignsOverviewCard
        description={copy.campaignDescription}
        createHref="/outreach?new=1"
        listHref="/outreach"
        {...homeCampaignProps(home)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{copy.pipelineTitle}</CardTitle>
          <CardDescription>{copy.pipelineDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderSlaCard('DRAFT', slaSnapshots.DRAFT, 'DRAFT')}
            {renderSlaCard('READY', slaSnapshots.READY, 'READY')}
            {renderSlaCard('SEALED', slaSnapshots.SEALED, 'SEALED')}

            <div className="rounded-lg border p-4 bg-emerald-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {getShipmentStatusLabel('SUBMITTED', 'exporter', t)}
                  </p>
                  <p className="text-2xl font-bold mt-1">{shipmentStates.SUBMITTED}</p>
                </div>
                <StatusChip status="SUBMITTED" role="exporter" />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-emerald-700 font-medium">{getExporterSubmittedQueueHint(t)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3 text-xs">
            {terminalStates.map((item) => (
              <div key={item.status} className={`rounded p-2 border ${item.className}`}>
                <p className="text-muted-foreground">{getShipmentStatusLabel(item.status, 'exporter', t)}</p>
                <p className={`text-lg font-semibold ${item.valueClass}`}>
                  {shipmentStates[item.status] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiActiveShipments}</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getExporterSealedCountLabel(metrics.packages_by_status?.SEALED || 0, t)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiBlockingIssues}</CardTitle>
            <AlertOctagon className={`h-4 w-4 ${blockingIssuesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${blockingIssuesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {blockingIssuesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiBlockingIssuesHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiYieldFailures}</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${yieldFailuresCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yieldFailuresCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {yieldFailuresCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiYieldFailuresHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{copy.kpiReadyToSeal}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipmentsReadyToSeal}</div>
            <p className="text-xs text-muted-foreground mt-1">{copy.kpiReadyToSealHint}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.statusPipelineTitle}</CardTitle>
          <CardDescription>{getExporterShipmentTrackDescription(t)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { status: 'DRAFT' as ShipmentStatus, chipStatus: 'DRAFT' as const, icon: FileText },
              { status: 'READY' as ShipmentStatus, chipStatus: 'READY' as const, icon: Clock },
              { status: 'ON_HOLD' as ShipmentStatus, chipStatus: 'ON_HOLD' as const, icon: AlertTriangle },
              { status: 'SEALED' as ShipmentStatus, chipStatus: 'SEALED' as const, icon: CheckCircle2 },
              { status: 'SUBMITTED' as ShipmentStatus, chipStatus: 'SUBMITTED' as const, icon: Upload },
            ].map((stage) => (
              <div key={stage.status} className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <stage.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{metrics.packages_by_status?.[stage.status] || 0}</div>
                <div className="mt-1">
                  <StatusChip status={stage.chipStatus} role="exporter" size="sm" showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DashboardActivityCard
        isVirginTenant={isVirginTenant}
        fallbackEvents={metrics.recent_activity ?? []}
        emptyMessage={copy.activityEmpty}
        {...homeActivityProps(home)}
      />

      <DashboardQuickActions visible={isVirginTenant} className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/harvests">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickBatches}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickBatchesHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/packages">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickShipments}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickShipmentsHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/farmers/new">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickProducer}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickProducerHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </DashboardQuickActions>
    </div>
  );
}
