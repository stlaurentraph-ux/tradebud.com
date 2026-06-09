'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { BlockerCard } from '@/components/ui/blocker-card';
import { StatusChip } from '@/components/ui/status-chip';
import type { TimelineEvent } from '@/components/ui/timeline-row';
import { CampaignsOverviewCard } from '@/components/dashboards/campaigns-overview-card';
import { DashboardActivityCard } from '@/components/dashboards/dashboard-activity-card';
import { buildShipmentSlaSnapshots, type ShipmentSlaSnapshot } from '@/lib/package-sla';
import type { DDSPackage, ShipmentStatus } from '@/types';

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
}

export function ExporterDashboard({ metrics, packages = [] }: ExporterDashboardProps) {
  // Canonical shipment states from spec
  const shipmentStates = {
    DRAFT: metrics.packages_by_status?.DRAFT || 0,
    READY: metrics.packages_by_status?.READY || 0,
    SEALED: metrics.packages_by_status?.SEALED || 0,
    SUBMITTED: metrics.packages_by_status?.SUBMITTED || 0,
    ACCEPTED: metrics.packages_by_status?.ACCEPTED || 0,
    REJECTED: metrics.packages_by_status?.REJECTED || 0,
    ON_HOLD: metrics.packages_by_status?.ON_HOLD || 0,
  };

  const slaSnapshots = buildShipmentSlaSnapshots(packages, shipmentStates);
  const renderSlaCard = (label: 'DRAFT' | 'READY' | 'SEALED', snapshot: ShipmentSlaSnapshot, chipStatus: ShipmentStatus, chipLabel?: string) => (
    <div className={`rounded-lg border p-4 ${label === 'DRAFT' ? 'bg-blue-50/50' : label === 'READY' ? 'bg-cyan-50/50' : 'bg-purple-50/50'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{snapshot.count}</p>
        </div>
        <StatusChip status={chipStatus} label={chipLabel} />
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>SLA: {snapshot.daysSLA}d</span>
          <span className={snapshot.health === 'overdue' ? 'text-red-600' : snapshot.health === 'warning' ? 'text-amber-600' : 'text-emerald-600'}>
            {snapshot.daysActive}d active
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
    metrics.total_plots > 0
      ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100)
      : 0;

  // Spec KPIs
  const blockingIssuesCount = metrics.blocking_issues_count ?? 0;
  const yieldFailuresCount = metrics.yield_failures_count ?? 0;
  const shipmentsReadyToSeal = shipmentStates.READY;
  const isVirginTenant =
    metrics.total_packages === 0 &&
    metrics.total_plots === 0 &&
    metrics.total_farmers === 0;

  return (
    <div className="space-y-6">
      <span className="sr-only">
        Plot compliance rate {complianceRate} percent ({metrics.compliant_plots} of {metrics.total_plots} plots).
      </span>
      <CampaignsOverviewCard
        description="Launch outbound requests to collect missing producer, plot, and evidence data"
        createHref="/outreach?new=1"
        listHref="/outreach"
      />

      {/* SLA Burndown Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Readiness Pipeline</CardTitle>
          <CardDescription>Track draft-to-seal progression and queue health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderSlaCard('DRAFT', slaSnapshots.DRAFT, 'DRAFT')}
            {renderSlaCard('READY', slaSnapshots.READY, 'READY', 'Ready')}
            {renderSlaCard('SEALED', slaSnapshots.SEALED, 'SEALED', 'Sealed')}

            {/* SUBMITTED State */}
            <div className="rounded-lg border p-4 bg-emerald-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SUBMITTED</p>
                  <p className="text-2xl font-bold mt-1">{shipmentStates.SUBMITTED}</p>
                </div>
                <StatusChip status="SUBMITTED" />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-emerald-700 font-medium">Awaiting downstream acceptance response</p>
              </div>
            </div>
          </div>

          {/* Terminal States Summary */}
          <div className="mt-4 grid gap-2 md:grid-cols-3 text-xs">
            <div className="rounded p-2 bg-green-50 border border-green-200">
              <p className="text-muted-foreground">ACCEPTED</p>
              <p className="text-lg font-semibold text-green-700">{shipmentStates.ACCEPTED}</p>
            </div>
            <div className="rounded p-2 bg-red-50 border border-red-200">
              <p className="text-muted-foreground">REJECTED</p>
              <p className="text-lg font-semibold text-red-700">{shipmentStates.REJECTED}</p>
            </div>
            <div className="rounded p-2 bg-amber-50 border border-amber-200">
              <p className="text-muted-foreground">ON_HOLD</p>
              <p className="text-lg font-semibold text-amber-700">{shipmentStates.ON_HOLD}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Action Banner */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-emerald-900">Ready to seal shipments?</h3>
            <p className="text-sm text-emerald-700">
              You have {shipmentsReadyToSeal} shipments ready for seal checks
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/packages">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Open shipment builder
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Critical Alerts - Using BlockerCard component */}
      {blockingIssuesCount > 0 && (
        <BlockerCard
          blockerType="COMPLIANCE_ISSUE"
          severity="BLOCKING"
          title={`Shipment sealing blocked`}
          description={`${blockingIssuesCount} blocking issues must be resolved before shipments can be sealed.`}
          relatedEntityLabel="Multiple shipments affected"
          slaCountdown="2 days"
          remediationAction={{
            label: 'Review issues',
            href: '/compliance/issues',
          }}
        />
      )}

      {yieldFailuresCount > 0 && (
        <BlockerCard
          blockerType="YIELD_FAILURE"
          severity="WARNING"
          title={`Yield exceptions pending`}
          description={`${yieldFailuresCount} batch(es) failed yield plausibility and require exception handling.`}
          relatedEntityLabel="Lots & batches awaiting review"
          remediationAction={{
            label: 'View lots & batches',
            href: '/harvests',
          }}
        />
      )}

      {/* Key Metrics for Exporters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active shipments</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.packages_by_status?.SEALED || 0} sealed and handoff-ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocking issues</CardTitle>
            <AlertOctagon className={`h-4 w-4 ${blockingIssuesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${blockingIssuesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {blockingIssuesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Preventing shipment seal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yield failures</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${yieldFailuresCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yieldFailuresCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {yieldFailuresCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting resolution or appeal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to seal</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipmentsReadyToSeal}</div>
            <p className="text-xs text-muted-foreground mt-1">Shipment packages awaiting seal</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Pipeline with StatusChip */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment status pipeline</CardTitle>
          <CardDescription>Track packages across readiness, seal, and downstream states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { status: 'DRAFT' as ShipmentStatus, chipStatus: 'DRAFT' as const, label: 'Draft', icon: FileText },
              { status: 'READY' as ShipmentStatus, chipStatus: 'READY' as const, label: 'Ready', icon: Clock },
              { status: 'ON_HOLD' as ShipmentStatus, chipStatus: 'ON_HOLD' as const, label: 'On hold', icon: AlertTriangle },
              { status: 'SEALED' as ShipmentStatus, chipStatus: 'SEALED' as const, label: 'Sealed', icon: CheckCircle2 },
              { status: 'SUBMITTED' as ShipmentStatus, chipStatus: 'SUBMITTED' as const, label: 'Submitted', icon: Upload },
            ].map((stage) => (
              <div key={stage.status} className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <stage.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{metrics.packages_by_status?.[stage.status] || 0}</div>
                <div className="mt-1">
                  <StatusChip status={stage.chipStatus} size="sm" showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DashboardActivityCard
        isVirginTenant={isVirginTenant}
        fallbackEvents={metrics.recent_activity ?? []}
        emptyMessage="Activity will appear here once your team starts onboarding and submission workflows."
      />

      {/* Quick Actions for Exporters */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/harvests">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Manage lots & batches</h4>
                <p className="text-sm text-muted-foreground">Build lineage-safe inputs before shipment assembly</p>
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
                <h4 className="font-semibold">Prepare shipments</h4>
                <p className="text-sm text-muted-foreground">Assemble lines and validate coverage readiness</p>
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
                <h4 className="font-semibold">Add producer</h4>
                <p className="text-sm text-muted-foreground">Register upstream producers in your traceability directory</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
