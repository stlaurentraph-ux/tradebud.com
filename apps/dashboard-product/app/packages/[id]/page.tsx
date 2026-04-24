'use client';

import { use, useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { PackageStatusBadge, ComplianceStatusBadge } from '@/components/packages/package-status-badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { BlockerCard } from '@/components/ui/blocker-card';
import { transitionPackage } from '@/lib/package-service';
import { usePackageById } from '@/lib/use-packages';
import { useAuth } from '@/lib/auth-context';
import type { ShipmentStatus } from '@/types';

// Canonical shipment state machine
const STATE_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  DRAFT: ['READY', 'ON_HOLD'],
  READY: ['DRAFT', 'SEALED', 'ON_HOLD'],
  SEALED: ['SUBMITTED', 'ON_HOLD'],
  SUBMITTED: ['ACCEPTED', 'REJECTED', 'ON_HOLD'],
  ACCEPTED: ['ARCHIVED'],
  REJECTED: ['DRAFT', 'ON_HOLD'],
  ARCHIVED: [],
  ON_HOLD: ['DRAFT', 'READY'],
};

const BLOCKING_RULES: Record<ShipmentStatus, string[]> = {
  DRAFT: [],
  READY: ['All plots must have deforestation assessment', 'All associated entities must have FPIC consent'],
  SEALED: ['All compliance checks must pass', 'Liability acknowledgement required'],
  SUBMITTED: ['Cannot modify submitted shipment'],
  ACCEPTED: [],
  REJECTED: [],
  ARCHIVED: [],
  ON_HOLD: [],
};

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const { id } = use(params);
  const { pkg, isLoading, error } = usePackageById(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTransitioningTo, setIsTransitioningTo] = useState<ShipmentStatus | null>(null);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState<ShipmentStatus>('DRAFT');
  useEffect(() => {
    if (pkg) setCurrentStatus(pkg.status);
  }, [pkg]);

  if (!isLoading && !pkg) {
    notFound();
  }

  // Check if transition is allowed
  const allowedTransitions = STATE_TRANSITIONS[currentStatus] || [];
  const blockingIssues = BLOCKING_RULES[currentStatus] || [];
  const canTransition = blockingIssues.length === 0;

  const handleStateTransition = async (newStatus: ShipmentStatus) => {
    if (!allowedTransitions.includes(newStatus)) {
      return;
    }
    if (newStatus === 'SEALED') {
      setShowLiabilityModal(true);
    } else {
      if (!pkg) return;
      setIsTransitioningTo(newStatus);
      setActionError(null);
      try {
        const result = await transitionPackage(pkg.id, newStatus);
        setCurrentStatus(result.pkg.status);
        toast.success(`Shipment moved to ${result.pkg.status}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transition failed.';
        setActionError(message);
        toast.error(message);
      } finally {
        setIsTransitioningTo(null);
      }
    }
  };

  const confirmSeal = async () => {
    if (!pkg) return;
    setIsTransitioningTo('SEALED');
    setActionError(null);
    try {
      const result = await transitionPackage(pkg.id, 'SEALED', { confirmLiability: true });
      setCurrentStatus(result.pkg.status);
      setShowLiabilityModal(false);
      toast.success('Shipment sealed successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to seal shipment.';
      setActionError(message);
      toast.error(message);
    } finally {
      setIsTransitioningTo(null);
    }
  };

  const approveSubmittedShipment = async () => {
    if (!pkg) return;
    setIsTransitioningTo('ACCEPTED');
    setActionError(null);
    try {
      const result = await transitionPackage(pkg.id, 'ACCEPTED');
      setCurrentStatus(result.pkg.status);
      toast.success('Shipment accepted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept shipment.';
      setActionError(message);
      toast.error(message);
    } finally {
      setIsTransitioningTo(null);
    }
  };

  const confirmRejectShipment = async () => {
    if (!pkg) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    setIsTransitioningTo('REJECTED');
    setActionError(null);
    try {
      const result = await transitionPackage(pkg.id, 'REJECTED');
      setCurrentStatus(result.pkg.status);
      setShowRejectModal(false);
      setRejectionReason('');
      toast.success('Shipment rejected.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject shipment.';
      setActionError(message);
      toast.error(message);
    } finally {
      setIsTransitioningTo(null);
    }
  };

  if (isLoading || !pkg) {
    return (
      <div className="flex flex-col p-6 text-sm text-muted-foreground">
        {error ? `Failed to load package: ${error}` : 'Loading package details...'}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pkg.code}
        subtitle={pkg.supplier_name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Shipments', href: '/packages' },
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
            {currentStatus === 'SEALED' && (
              <PermissionGate permission="packages:submit_traces">
                <Button asChild>
                  <Link href={`/packages/${pkg.id}/submit`}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit downstream handoff
                  </Link>
                </Button>
              </PermissionGate>
            )}
            {currentStatus === 'DRAFT' || currentStatus === 'READY' ? (
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
            {currentStatus === 'SUBMITTED' && (
              <PermissionGate permission="packages:approve">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      void approveSubmittedShipment();
                    }}
                    disabled={isTransitioningTo !== null}
                  >
                    {isTransitioningTo === 'ACCEPTED' ? 'Accepting...' : 'Accept Shipment'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isTransitioningTo !== null}
                  >
                    Reject Shipment
                  </Button>
                </div>
              </PermissionGate>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6">
        {actionError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Blocking Issues */}
            {blockingIssues.length > 0 && (
              <BlockerCard
                blockerType="INVALID_STATE"
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
                          onClick={() => void handleStateTransition(nextStatus)}
                          disabled={!canTransition || isTransitioningTo !== null}
                          variant={canTransition ? 'default' : 'outline'}
                        >
                          {canTransition ? (
                            <Unlock className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          {isTransitioningTo === nextStatus ? 'Applying...' : `→ ${nextStatus.toUpperCase()}`}
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
                        <span className="text-xs text-muted-foreground">Downstream Reference</span>
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

            {/* Associated people list */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-medium">{isCooperative ? 'Associated Members' : 'Associated Producers'}</CardTitle>
                <PermissionGate permission="farmers:create">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    {isCooperative ? 'Link Member' : 'Link Producer'}
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent>
                {pkg.farmers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">{isCooperative ? 'No members linked yet' : 'No producers linked yet'}</p>
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
                    <p className="text-xs text-muted-foreground">{isCooperative ? 'Members' : 'Producers'}</p>
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
                  By advancing this shipment to handoff-ready, you acknowledge full liability for the accuracy of all data and compliance with EUDR regulations. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLiabilityModal(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmSeal} className="bg-red-600 hover:bg-red-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isTransitioningTo === 'SEALED' ? 'Sealing...' : 'I Acknowledge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-[30rem]">
            <CardHeader>
              <CardTitle>Reject Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejection. This reason is used for downstream remediation.
              </p>
              <textarea
                className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    void confirmRejectShipment();
                  }}
                  disabled={isTransitioningTo !== null}
                >
                  {isTransitioningTo === 'REJECTED' ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
