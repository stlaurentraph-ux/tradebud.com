'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  ShieldCheck,
  Send,
  Lock,
  MapPin,
  Users,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Unlock,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PackageStatusBadge, ComplianceStatusBadge } from '@/components/packages/package-status-badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { BlockerCard } from '@/components/ui/blocker-card';
import { getPackageById } from '@/lib/mock-data';

// Canonical shipment state machine
type ShipmentStatus = 'draft' | 'in_review' | 'traces_ready' | 'submitted' | 'approved' | 'rejected';

const STATE_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ['in_review'],
  in_review: ['traces_ready', 'draft'],
  traces_ready: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: [],
  rejected: ['draft'],
};

const BLOCKING_RULES: Record<ShipmentStatus, string[]> = {
  draft: [],
  in_review: ['All plots must have deforestation assessment', 'All farmers must have FPIC consent'],
  traces_ready: ['All compliance checks must pass', 'Liability acknowledgement required'],
  submitted: ['Cannot modify submitted shipment'],
  approved: [],
  rejected: [],
};

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = use(params);
  const pkg = getPackageById(id);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ShipmentStatus>((pkg?.status || 'draft') as ShipmentStatus);

  if (!pkg) {
    notFound();
  }

  // Check if transition is allowed
  const allowedTransitions = STATE_TRANSITIONS[currentStatus] || [];
  const blockingIssues = BLOCKING_RULES[currentStatus] || [];
  const canTransition = blockingIssues.length === 0;

  const handleStateTransition = (newStatus: ShipmentStatus) => {
    if (!allowedTransitions.includes(newStatus)) {
      return;
    }
    if (newStatus === 'traces_ready') {
      setShowLiabilityModal(true);
    } else {
      setCurrentStatus(newStatus);
    }
  };

  const confirmSeal = () => {
    setCurrentStatus('traces_ready');
    setShowLiabilityModal(false);
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pkg.code}
        subtitle={pkg.supplier_name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Packages', href: '/packages' },
          { label: pkg.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission="compliance:run_check">
              <Button variant="outline" asChild>
                <Link href={`/compliance?package=${pkg.id}`}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Run Compliance
                </Link>
              </Button>
            </PermissionGate>
            {pkg.status === 'traces_ready' && (
              <PermissionGate permission="packages:submit_traces">
                <Button asChild>
                  <Link href={`/packages/${pkg.id}/submit`}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit to TRACES
                  </Link>
                </Button>
              </PermissionGate>
            )}
            {pkg.status === 'draft' || pkg.status === 'in_review' ? (
              <PermissionGate permission="packages:seal_shipment">
                <Button asChild variant="default">
                  <Link href={`/packages/${pkg.id}/assemble`}>
                    <Lock className="mr-2 h-4 w-4" />
                    Assemble Shipment
                  </Link>
                </Button>
              </PermissionGate>
            ) : null}
            <PermissionGate permission="packages:edit">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/packages/${pkg.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Blocking Issues */}
            {blockingIssues.length > 0 && (
              <BlockerCard
                blockerType="STATE_TRANSITION"
                severity="BLOCKING"
                title="Cannot proceed to next state"
                description={`Resolve the following to advance: ${blockingIssues.join(', ')}`}
                relatedEntityLabel="Shipment blocking requirements"
                slaCountdown="Immediate action required"
                remediationAction={{
                  label: 'View requirements',
                  href: '#',
                }}
              />
            )}

            {/* State Transition Panel */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">State Transitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.length > 0 ? (
                    allowedTransitions.map((nextStatus) => (
                      <PermissionGate key={nextStatus} permission="packages:edit">
                        <Button
                          onClick={() => handleStateTransition(nextStatus)}
                          disabled={!canTransition}
                          variant={canTransition ? 'default' : 'outline'}
                        >
                          {canTransition ? (
                            <Unlock className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          → {nextStatus.toUpperCase()}
                        </Button>
                      </PermissionGate>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No state transitions available from {currentStatus}</p>
                  )}
                </div>

                {blockingIssues.length > 0 && (
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Blocking Issues:</p>
                    <ul className="space-y-1">
                      {blockingIssues.map((issue, i) => (
                        <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Status Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Package Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Package Status</span>
                    <PackageStatusBadge status={pkg.status} size="md" />
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Compliance Status</span>
                    <ComplianceStatusBadge status={pkg.compliance_status} size="md" />
                  </div>
                  {pkg.traces_reference && (
                    <>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">TRACES Reference</span>
                        <span className="text-sm font-medium text-primary">{pkg.traces_reference}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plots List */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-medium">Associated Plots</CardTitle>
                <PermissionGate permission="plots:create">
                  <Button variant="outline" size="sm">
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Plot
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent>
                {pkg.plots.length === 0 ? (
                  <div className="py-8 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No plots associated yet</p>
                    <PermissionGate permission="plots:create">
                      <Button variant="outline" size="sm" className="mt-4">
                        Add First Plot
                      </Button>
                    </PermissionGate>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pkg.plots.map((plot) => (
                      <Link
                        key={plot.id}
                        href={`/plots/${plot.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10">
                            <MapPin className="h-4 w-4 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{plot.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {plot.area_hectares} ha - Risk: {plot.deforestation_risk}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              plot.verified ? 'bg-primary' : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {plot.verified ? 'Verified' : 'Pending'}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Farmers List */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-medium">Associated Farmers</CardTitle>
                <PermissionGate permission="farmers:create">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Link Farmer
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent>
                {pkg.farmers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No farmers linked yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pkg.farmers.map((farmer) => (
                      <Link
                        key={farmer.id}
                        href={`/farmers/${farmer.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/10">
                            <Users className="h-4 w-4 text-chart-3" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{farmer.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={farmer.fpic_signed ? 'text-primary' : 'text-chart-4'}>
                                FPIC: {farmer.fpic_signed ? 'Signed' : 'Pending'}
                              </span>
                              <span>-</span>
                              <span className={farmer.labor_compliant ? 'text-primary' : 'text-chart-4'}>
                                Labor: {farmer.labor_compliant ? 'Compliant' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              farmer.verified ? 'bg-primary' : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {farmer.verified ? 'Verified' : 'Pending'}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Package Details */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Package Code</p>
                    <p className="text-sm font-medium">{pkg.code}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Season / Year</p>
                    <p className="text-sm font-medium">
                      Season {pkg.season} {pkg.year}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">
                      {new Date(pkg.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {pkg.submitted_at && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                        <Send className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-sm font-medium">
                          {new Date(pkg.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{pkg.plots.length}</p>
                    <p className="text-xs text-muted-foreground">Plots</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{pkg.farmers.length}</p>
                    <p className="text-xs text-muted-foreground">Farmers</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.plots.reduce((sum, p) => sum + p.area_hectares, 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Ha</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.plots.filter((p) => p.verified).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Liability Acknowledgement Modal */}
      {showLiabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Liability Acknowledgement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <p className="text-sm text-amber-900">
                  By advancing this shipment to TRACES Ready, you acknowledge full liability for the accuracy of all data and compliance with EUDR regulations. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLiabilityModal(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmSeal} className="bg-red-600 hover:bg-red-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  I Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
