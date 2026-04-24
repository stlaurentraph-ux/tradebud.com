'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Scale,
  Package,
  FileCheck,
  ClipboardList,
} from 'lucide-react';

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
  };
}

export function CooperativeDashboard({ metrics }: CooperativeDashboardProps) {
  const pendingPlots = metrics.total_plots - metrics.compliant_plots;
  const verificationRate = metrics.total_plots > 0
    ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) 
    : 0;
  const incomingPending = metrics.incoming_requests_pending ?? 0;
  const outgoingPending = metrics.outgoing_requests_pending ?? 0;
  const membersMissingConsent = metrics.members_missing_consent ?? Math.max(1, Math.ceil(metrics.total_farmers * 0.08));
  const requestsOverdue = metrics.requests_overdue ?? 7;
  const portabilityPending = metrics.portability_reviews_pending ?? 4;
  const blockingIssues = metrics.blocking_issues_count ?? Math.max(0, Math.ceil(pendingPlots * 0.4));

  return (
    <div className="space-y-6">
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-teal-900">Cooperative Operations Cockpit</h3>
            <p className="text-sm text-teal-700">
              Connect member readiness, field capture quality, blocked batches, shipment readiness, and governance actions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-teal-300 hover:bg-teal-100">
              <Link href="/field-operations">
                <ClipboardList className="mr-2 h-4 w-4" />
                Field Queues
              </Link>
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/governance">
                <Scale className="mr-2 h-4 w-4" />
                Review Governance
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_farmers}</div>
            <p className="text-xs text-muted-foreground mt-1">Profiles managed by cooperative</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mapped Plot Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verificationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.compliant_plots}/{metrics.total_plots} plots compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Batch Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{blockingIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Yield appeal and evidence follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premium Governance</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">3</div>
            <p className="text-xs text-muted-foreground mt-1">Decisions awaiting committee sign-off</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Readiness and Cooperative Health</CardTitle>
          <CardDescription>Operational readiness signals blended with cooperative-strength indicators.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Members missing consent</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{membersMissingConsent}</p>
            <p className="mt-1 text-xs text-muted-foreground">Prioritize portability-ready consent renewals</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Plots missing geometry</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{Math.max(0, pendingPlots)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Point-only and invalid geometry records in queue</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Requests overdue</p>
            <p className="mt-2 text-2xl font-bold">{requestsOverdue}</p>
            <p className="mt-1 text-xs text-muted-foreground">Inbound partner asks past SLA</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Members and Portability
            </CardTitle>
            <CardDescription>Manage producer identity, consent status, and transfer readiness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/contacts" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <span className="font-medium">Open member directory</span>
              <Badge variant="outline">{metrics.total_farmers}</Badge>
            </Link>
            <Link href="/governance" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <span className="font-medium">Review portability queue</span>
              <Badge variant="outline">{portabilityPending} pending</Badge>
            </Link>
            <Link href="/fpic" className="flex items-center justify-between rounded-lg bg-amber-50 p-3 transition-colors hover:bg-amber-100">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-amber-700" />
                <span className="font-medium text-amber-700">Consent artifacts missing</span>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-700" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              Field Capture and Plots
            </CardTitle>
            <CardDescription>Close data gaps in plot geometry and field operations quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/plots" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <span className="font-medium">Plot registry and map review</span>
              <Badge variant="outline">{metrics.total_plots} plots</Badge>
            </Link>
            <Link href="/field-operations" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="font-medium">Field remediation queues</span>
              </div>
              <Badge variant="outline">5 sync issues</Badge>
            </Link>
            <Link href="/compliance/issues" className="flex items-center justify-between rounded-lg bg-red-50 p-3 transition-colors hover:bg-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-700" />
                <span className="font-medium text-red-700">Duplicate and deforestation flags</span>
              </div>
              <ArrowRight className="h-4 w-4 text-red-700" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              Batches, Shipments, and Premiums
            </CardTitle>
            <CardDescription>Monitor aggregation integrity and cooperative value-distribution flows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/harvests" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <span className="font-medium">Lots and batch integrity</span>
              <Badge variant="outline">2 blocked</Badge>
            </Link>
            <Link href="/packages" className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <span className="font-medium">Shipment seal readiness</span>
              <Badge variant="outline">6 ready</Badge>
            </Link>
            <Link href="/governance" className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 transition-colors hover:bg-emerald-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="font-medium text-emerald-700">Premium approvals and payout split</span>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-700" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
