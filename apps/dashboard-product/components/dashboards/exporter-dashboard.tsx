'use client';

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { ExporterShipmentOverview } from '@/components/dashboards/exporter-shipment-overview';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import type { DDSPackage, ShipmentStatus } from '@/types';
import type { TimelineEvent } from '@/components/ui/timeline-row';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { ExporterLineageProgressCard } from '@/components/dashboards/exporter-lineage-progress-card';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import {
  formatExporterComplianceRateSrOnly,
  getExporterDashboardLabels,
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
    plots_needing_action?: number;
    total_farmers: number;
    blocking_issues_count?: number;
    yield_failures_count?: number;
    recent_activity?: TimelineEvent[];
  };
  packages?: DDSPackage[];
  home?: DashboardHomeResources;
}

export function ExporterDashboard({ metrics, home }: ExporterDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getExporterDashboardLabels(t), [t]);

  const complianceRate =
    metrics.total_plots > 0 ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) : 0;

  const plotsNeedingAction = metrics.plots_needing_action ?? 0;
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

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}

      <ExporterLineageProgressCard
        signals={{
          total_farmers: metrics.total_farmers,
          total_plots: metrics.total_plots,
          total_packages: metrics.total_packages,
          packages_by_status: metrics.packages_by_status,
        }}
        t={t}
      />

      {plotsNeedingAction > 0 ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <MapPin className="h-5 w-5 text-amber-700" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-950">{copy.plotsNeedAttention}</p>
                <p className="text-2xl font-bold text-amber-900">{plotsNeedingAction}</p>
                <p className="text-xs text-amber-800">{copy.plotsNeedAttentionHint}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 border-amber-300 bg-white/80">
              <Link href="/plots">{copy.plotsNeedAttentionCta}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <CampaignsOverviewCard
        description={copy.campaignDescription}
        createHref="/outreach?new=1"
        listHref="/outreach"
        {...homeCampaignProps(home)}
      />

      <ExporterShipmentOverview packagesByStatus={metrics.packages_by_status} t={t} />

      <span className="sr-only">
        {formatExporterComplianceRateSrOnly(
          complianceRate,
          metrics.compliant_plots,
          metrics.total_plots,
          t,
        )}
      </span>

      <DashboardActivityCard
        isVirginTenant={isVirginTenant}
        fallbackEvents={metrics.recent_activity ?? []}
        emptyMessage={copy.activityEmpty}
        {...homeActivityProps(home)}
      />
    </div>
  );
}
