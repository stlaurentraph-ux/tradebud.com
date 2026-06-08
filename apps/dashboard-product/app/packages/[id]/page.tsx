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
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PackageStatusBadge, ComplianceStatusBadge } from '@/components/packages/package-status-badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { BlockerCard } from '@/components/ui/blocker-card';
import { generateHarvestPackage, submitHarvestPackage } from '@/lib/harvest-package-actions';
import { usePackageDetail } from '@/lib/use-package-detail';
import { usePackageReadiness } from '@/lib/use-package-readiness';
import { useAuth } from '@/lib/auth-context';

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const { id } = use(params);
  const { pkg, isLoading, error, refetch } = usePackageDetail(id, user?.tenant_id ?? null);
  const { data: readiness, isLoading: readinessLoading } = usePackageReadiness(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'generate' | 'submit' | null>(null);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);

  if (!isLoading && !pkg && !error) {
    notFound();
  }

  if (!isLoading && error?.toLowerCase().includes('not found')) {
    notFound();
  }

  const readinessBlockers =
    readiness?.blockers.map((issue) => issue.message) ??
    (readinessLoading ? ['Loading readiness checks...'] : []);
  const canGenerate = pkg?.status === 'DRAFT' && readinessBlockers.length === 0;
  const canSubmit = pkg?.status === 'READY' && readinessBlockers.length === 0;

  const confirmGenerateArtifacts = async () => {
    if (!pkg) return;
    setPendingAction('generate');
    setActionError(null);
    try {
      await generateHarvestPackage(pkg.id);
      setShowLiabilityModal(false);
      refetch();
      toast.success('Filing artifacts generated. Package is ready to submit.');
    } catch (generateError) {
      const message =
        generateError instanceof Error ? generateError.message : 'Failed to generate filing artifacts.';
      setActionError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSubmitPackage = async () => {
    if (!pkg) return;
    setPendingAction('submit');
    setActionError(null);
    try {
      const idempotencyKey = `submit-${pkg.id}-${Date.now()}`;
      const result = await submitHarvestPackage(pkg.id, idempotencyKey);
      refetch();
      toast.success(
        result.replayed
          ? 'Submission replayed from idempotency cache.'
          : `Package submitted${result.tracesReference ? ` (${result.tracesReference})` : ''}.`,
      );
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to submit package.';
      setActionError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
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
            {pkg.status === 'READY' && (
              <PermissionGate permission="packages:submit_traces">
                <Button
                  onClick={() => {
                    void handleSubmitPackage();
                  }}
                  disabled={!canSubmit || pendingAction !== null}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {pendingAction === 'submit' ? 'Submitting...' : 'Submit downstream handoff'}
                </Button>
              </PermissionGate>
            )}
            {pkg.status === 'DRAFT' || pkg.status === 'READY' ? (
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
            {/* Readiness blockers */}
            {readinessBlockers.length > 0 && (
              <BlockerCard
                blockerType="INVALID_STATE"
                severity="BLOCKING"
                title="Filing preflight blockers"
                description={`Resolve the following before generating or submitting: ${readinessBlockers.join(', ')}`}
                relatedEntityLabel="Package readiness requirements"
                slaCountdown="Immediate action required"
                remediationAction={{
                  label: 'Run compliance checks',
                  href: `/compliance?package=${pkg.id}`,
                }}
              />
            )}

            {/* Backend filing workflow */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Filing Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Current backend status: <span className="font-medium text-foreground">{pkg.status}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {pkg.status === 'DRAFT' && (
                    <PermissionGate permission="packages:seal_shipment">
                      <Button
                        onClick={() => setShowLiabilityModal(true)}
                        disabled={!canGenerate || pendingAction !== null}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {pendingAction === 'generate' ? 'Generating...' : 'Generate filing artifacts'}
                      </Button>
                    </PermissionGate>
                  )}
                  {pkg.status === 'READY' && (
                    <PermissionGate permission="packages:submit_traces">
                      <Button
                        onClick={() => {
                          void handleSubmitPackage();
                        }}
                        disabled={!canSubmit || pendingAction !== null}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {pendingAction === 'submit' ? 'Submitting...' : 'Submit to downstream'}
                      </Button>
                    </PermissionGate>
                  )}
                  {pkg.status === 'SUBMITTED' && (
                    <p className="text-sm text-muted-foreground">
                      This package has been submitted and is awaiting downstream processing.
                    </p>
                  )}
                </div>

                {readinessBlockers.length > 0 && (
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Readiness blockers:</p>
                    <ul className="space-y-1">
                      {readinessBlockers.map((issue, index) => (
                        <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
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
                  By generating filing artifacts, you acknowledge full liability for the accuracy of all data and compliance with EUDR regulations.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLiabilityModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    void confirmGenerateArtifacts();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {pendingAction === 'generate' ? 'Generating...' : 'I Acknowledge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
