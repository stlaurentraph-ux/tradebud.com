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
  TrendingUp,
  FileText,
  ArrowRight,
  AlertOctagon,
} from 'lucide-react';
import { BlockerCard } from '@/components/ui/blocker-card';
import { StatusChip } from '@/components/ui/status-chip';
import { Timeline, type TimelineEvent } from '@/components/ui/timeline-row';
import type { ShipmentStatus } from '@/types';

interface ExporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
}

// Mock recent activity - in production this would come from the backend
const mockRecentActivity: TimelineEvent[] = [
  {
    id: '1',
    eventType: 'submission',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    userName: 'Maria Rodriguez',
    description: 'Shipment SHP-2024-003 sealed after lineage lock',
    metadata: { reference: 'PKG-2024-0891' },
  },
  {
    id: '2',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    userName: 'System',
    description: 'Shipment readiness checks passed for SHP-2024-002',
    metadata: { checks_passed: '8/8' },
  },
  {
    id: '3',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    userName: 'Carlos Mendez',
    description: 'Yield warning YLD-2024-015 resolved',
  },
  {
    id: '4',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userName: 'Ana Garcia',
    description: 'Consent document uploaded for Plot P-2024-042',
  },
];

export function ExporterDashboard({ metrics }: ExporterDashboardProps) {
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

  // Calculate SLA metrics
  const draftSLA = { count: shipmentStates.DRAFT, daysSLA: 7, daysActive: 3 };
  const readySLA = { count: shipmentStates.READY, daysSLA: 5, daysActive: 2 };
  const sealedSLA = { count: shipmentStates.SEALED, daysSLA: 10, daysActive: 1 };

  // Calculate SLA health
  const calculateSLAHealth = (daysActive: number, daysSLA: number): 'healthy' | 'warning' | 'overdue' => {
    if (daysActive >= daysSLA) return 'overdue';
    if (daysActive >= daysSLA * 0.8) return 'warning';
    return 'healthy';
  };

  const complianceRate =
    metrics.total_plots > 0
      ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100)
      : 0;

  // Spec KPIs
  const blockingIssuesCount = 2;
  const yieldFailuresCount = 1;
  const shipmentsReadyToSeal = shipmentStates.READY;
  const isVirginTenant =
    metrics.total_packages === 0 &&
    metrics.total_plots === 0 &&
    metrics.total_farmers === 0;

  return (
    <div className="space-y-6">
      {isVirginTenant ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Welcome to your new workspace</CardTitle>
            <CardDescription>
              No demo data is preloaded. Complete onboarding steps above to create your first campaign, import contacts, and start collecting field data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/outreach">Create first campaign</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/farmers">Add first producer</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/plots">Capture first plot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <span className="sr-only">
        Plot compliance rate {complianceRate} percent ({metrics.compliant_plots} of {metrics.total_plots} plots).
      </span>
      {/* SLA Burndown Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Readiness Pipeline</CardTitle>
          <CardDescription>Track draft-to-seal progression and queue health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* DRAFT State */}
            <div className="rounded-lg border p-4 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">DRAFT</p>
                  <p className="text-2xl font-bold mt-1">{shipmentStates.DRAFT}</p>
                </div>
                <StatusChip status="DRAFT" />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>SLA: {draftSLA.daysSLA}d</span>
                  <span className={calculateSLAHealth(draftSLA.daysActive, draftSLA.daysSLA) === 'overdue' ? 'text-red-600' : 'text-emerald-600'}>
                    {draftSLA.daysActive}d active
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${calculateSLAHealth(draftSLA.daysActive, draftSLA.daysSLA) === 'overdue' ? 'bg-red-600' : calculateSLAHealth(draftSLA.daysActive, draftSLA.daysSLA) === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}
                    style={{ width: `${Math.min((draftSLA.daysActive / draftSLA.daysSLA) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* READY State */}
            <div className="rounded-lg border p-4 bg-cyan-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">READY</p>
                  <p className="text-2xl font-bold mt-1">{shipmentStates.READY}</p>
                </div>
                <StatusChip status="READY" label="Ready" />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>SLA: {readySLA.daysSLA}d</span>
                  <span className={calculateSLAHealth(readySLA.daysActive, readySLA.daysSLA) === 'overdue' ? 'text-red-600' : 'text-emerald-600'}>
                    {readySLA.daysActive}d active
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${calculateSLAHealth(readySLA.daysActive, readySLA.daysSLA) === 'overdue' ? 'bg-red-600' : calculateSLAHealth(readySLA.daysActive, readySLA.daysSLA) === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}
                    style={{ width: `${Math.min((readySLA.daysActive / readySLA.daysSLA) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SEALED State */}
            <div className="rounded-lg border p-4 bg-purple-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SEALED</p>
                  <p className="text-2xl font-bold mt-1">{shipmentStates.SEALED}</p>
                </div>
                <StatusChip status="SEALED" label="Sealed" />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>SLA: {sealedSLA.daysSLA}d</span>
                  <span className={calculateSLAHealth(sealedSLA.daysActive, sealedSLA.daysSLA) === 'overdue' ? 'text-red-600' : 'text-emerald-600'}>
                    {sealedSLA.daysActive}d active
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${calculateSLAHealth(sealedSLA.daysActive, sealedSLA.daysSLA) === 'overdue' ? 'bg-red-600' : calculateSLAHealth(sealedSLA.daysActive, sealedSLA.daysSLA) === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}
                    style={{ width: `${Math.min((sealedSLA.daysActive / sealedSLA.daysSLA) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

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

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {isVirginTenant ? (
            <p className="text-sm text-muted-foreground">
              Activity will appear here once your team starts onboarding and submission workflows.
            </p>
          ) : (
            <Timeline 
              events={mockRecentActivity} 
              maxHeight={250}
              compact
            />
          )}
        </CardContent>
      </Card>

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
          <Link href="/outreach">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Launch campaign</h4>
                <p className="text-sm text-muted-foreground">Request missing producer or plot evidence at scale</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
