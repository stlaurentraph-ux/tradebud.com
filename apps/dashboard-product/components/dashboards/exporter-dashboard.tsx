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
  const complianceRate = metrics.total_plots > 0 
    ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) 
    : 0;

  // Spec KPIs - these would come from the backend in production
  const blockingIssuesCount = 2;
  const yieldFailuresCount = 1;
  const ddsSubmissionQueue = metrics.packages_by_status?.SEALED || 0;

  return (
    <div className="space-y-6">
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
              {metrics.packages_by_status?.SUBMITTED || 0} submitted to TRACES
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
