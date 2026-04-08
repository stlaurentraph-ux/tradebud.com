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

interface ExporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<string, number>;
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
    description: 'DDS Package SHP-2024-003 submitted to TRACES NT',
    metadata: { reference: 'DDS-2024-0891' },
  },
  {
    id: '2',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    userName: 'System',
    description: 'Pre-flight checks passed for SHP-2024-002',
    metadata: { checks_passed: '8/8' },
  },
  {
    id: '3',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    userName: 'Carlos Mendez',
    description: 'Compliance issue CI-2024-015 resolved',
  },
  {
    id: '4',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userName: 'Ana Garcia',
    description: 'FPIC consent document uploaded for Plot P-2024-042',
  },
];

export function ExporterDashboard({ metrics }: ExporterDashboardProps) {
  // Canonical shipment states from spec
  const shipmentStates = {
    DRAFT: metrics.packages_by_status?.['draft'] || 0,
    READY: metrics.packages_by_status?.['ready'] || 0,
    SEALED: metrics.packages_by_status?.['sealed'] || 0,
    SUBMITTED: metrics.packages_by_status?.['submitted'] || 0,
    ACCEPTED: metrics.packages_by_status?.['accepted'] || 0,
    REJECTED: metrics.packages_by_status?.['rejected'] || 0,
    ON_HOLD: metrics.packages_by_status?.['on_hold'] || 0,
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

  const complianceRate = metrics.total_plots > 0 
    ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) 
    : 0;

  // Spec KPIs
  const blockingIssuesCount = 2;
  const yieldFailuresCount = 1;
  const ddsSubmissionQueue = shipmentStates.SUBMITTED;

  return (
    <div className="space-y-6">
      {/* SLA Burndown Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Pipeline & SLA Status</CardTitle>
          <CardDescription>Canonical state machine with SLA burndowns</CardDescription>
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
                <StatusChip status="APPROVED_FOR_FILING" label="Ready" />
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
                <StatusChip status="FILED" label="Sealed" />
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
                <p className="text-emerald-700 font-medium">Awaiting TRACES NT Response</p>
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
            <h3 className="text-lg font-semibold text-emerald-900">Ready to submit?</h3>
            <p className="text-sm text-emerald-700">
              You have {ddsSubmissionQueue} packages ready for TRACES NT submission
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/compliance">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Run pre-flight check
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
          description={`${blockingIssuesCount} blocking compliance issues found that must be resolved before any shipments can be sealed.`}
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
          description={`${yieldFailuresCount} batch(es) failed yield checks and require exception requests or acknowledgement.`}
          relatedEntityLabel="Harvests awaiting review"
          remediationAction={{
            label: 'View harvests',
            href: '/harvests',
          }}
        />
      )}

      {/* Key Metrics for Exporters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total DDS packages</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.packages_by_status?.['submitted'] || 0} submitted to TRACES
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
            <p className="text-xs text-muted-foreground mt-1">Preventing shipment sealing</p>
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
            <p className="text-xs text-muted-foreground mt-1">Awaiting exception requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submission queue</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ddsSubmissionQueue}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for TRACES NT</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Pipeline with StatusChip */}
      <Card>
        <CardHeader>
          <CardTitle>DDS package pipeline</CardTitle>
          <CardDescription>Track packages through the EUDR compliance workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { status: 'draft', chipStatus: 'DRAFT' as const, label: 'Draft', icon: FileText },
              { status: 'in_review', chipStatus: 'VALIDATING' as const, label: 'In review', icon: Clock },
              { status: 'preflight', chipStatus: 'READY_FOR_APPROVAL' as const, label: 'Pre-flight', icon: AlertTriangle },
              { status: 'traces_ready', chipStatus: 'APPROVED_FOR_FILING' as const, label: 'Ready', icon: CheckCircle2 },
              { status: 'submitted', chipStatus: 'FILED' as const, label: 'Submitted', icon: Upload },
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
          <Timeline 
            events={mockRecentActivity} 
            maxHeight={250}
            compact
          />
        </CardContent>
      </Card>

      {/* Quick Actions for Exporters */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/packages/new">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Create DDS package</h4>
                <p className="text-sm text-muted-foreground">Start a new due diligence statement</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Pre-flight check</h4>
                <p className="text-sm text-muted-foreground">Verify compliance before TRACES</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Export reports</h4>
                <p className="text-sm text-muted-foreground">Generate compliance documentation</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
