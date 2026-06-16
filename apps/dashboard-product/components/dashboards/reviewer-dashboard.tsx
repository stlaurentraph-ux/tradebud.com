'use client';

import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  AlertTriangle,
  XCircle,
  Clock,
  FileSearch,
  BarChart3,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import type { ShipmentStatus } from '@/types';
import { VirginStatePanel } from '@/components/dashboards/virgin-state-panel';
import { NorthStarKpi } from '@/components/dashboards/north-star-kpi';
import { MiniReviewQueue } from '@/components/dashboards/mini-review-queue';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { DashboardQuickActions } from '@/components/dashboards/dashboard-quick-actions';
import { getNorthStarForRole } from '@/lib/dashboard-north-star';
import type { DashboardHomeResources } from '@/lib/dashboard-home-data';
import { homeActivityProps, homePackageProps } from '@/lib/dashboard-home-props';
import { isVirginTenantForRole } from '@/lib/dashboard-maturity';
import { LocaleContext } from '@/lib/locale-context';
import {
  getNorthStarPriorityLabel,
  getReviewerDashboardLabels,
  getReviewerJurisdictionActivityHint,
} from '@/lib/terminology-labels';

interface ReviewerDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
    blocking_issues_count?: number;
    yield_failures_count?: number;
  };
  home?: DashboardHomeResources;
}

export function ReviewerDashboard({ metrics, home }: ReviewerDashboardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useMemo(() => getReviewerDashboardLabels(t), [t]);

  const pendingReview = metrics.packages_by_status?.READY || 0;
  const blockingIssuesCount = metrics.blocking_issues_count ?? 0;
  const yieldFailuresCount = metrics.yield_failures_count ?? 0;
  const isVirginTenant = isVirginTenantForRole('country_reviewer', metrics);

  if (isVirginTenant) {
    return (
      <VirginStatePanel
        role="country_reviewer"
        progress={{ total_packages: metrics.total_packages, total_plots: metrics.total_plots }}
      />
    );
  }

  const northStar = getNorthStarForRole('country_reviewer', metrics, t);

  return (
    <div className="space-y-6">
      {northStar ? <NorthStarKpi config={northStar} priorityLabel={getNorthStarPriorityLabel(t)} /> : null}
      <MiniReviewQueue role="country_reviewer" {...homePackageProps(home)} />

      <Card>
        <CardHeader>
          <CardTitle>{copy.triageTitle}</CardTitle>
          <CardDescription>{copy.triageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/compliance/issues"
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium">{copy.triageBlocking}</div>
                <div className="text-sm text-muted-foreground">{copy.triageBlockingHint}</div>
              </div>
            </div>
            <Badge variant="outline">{blockingIssuesCount}</Badge>
          </Link>

          <Link
            href="/compliance/issues"
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium">{copy.triageYieldWarnings}</div>
                <div className="text-sm text-muted-foreground">{copy.triageYieldHint}</div>
              </div>
            </div>
            <Badge variant="outline">{yieldFailuresCount}</Badge>
          </Link>

          <Link
            href="/compliance/queue"
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">{copy.triagePendingReview}</div>
                <div className="text-sm text-muted-foreground">{copy.triagePendingHint}</div>
              </div>
            </div>
            <Badge variant="outline">{pendingReview}</Badge>
          </Link>
        </CardContent>
      </Card>

      <DashboardActivityCard
        isVirginTenant={isVirginTenant}
        emptyMessage={getReviewerJurisdictionActivityHint(t)}
        {...homeActivityProps(home)}
      />

      <DashboardQuickActions visible={isVirginTenant} className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance/queue">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <FileSearch className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickReviewQueue}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickReviewQueueHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/plots">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickPlotRegistry}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickPlotRegistryHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{copy.quickReports}</h4>
                <p className="text-sm text-muted-foreground">{copy.quickReportsHint}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </DashboardQuickActions>
    </div>
  );
}
