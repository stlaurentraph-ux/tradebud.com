'use client';

import { use, useContext, useState } from 'react';
import Link from 'next/link';
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
import { ShipmentStateTimeline } from '@/components/packages/shipment-state-timeline';
import { PackageLineageSummaryCard } from '@/components/packages/package-lineage-summary-card';
import { PackageNotFound } from '@/components/packages/package-not-found';
import { Timeline } from '@/components/ui/timeline-row';
import { packageToTimelineEvents } from '@/lib/package-timeline';
import { generateHarvestPackage, submitHarvestPackage } from '@/lib/harvest-package-actions';
import { usePackageDetail } from '@/lib/use-package-detail';
import { usePackageReadiness } from '@/lib/use-package-readiness';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  buildPackageBreadcrumbs,
  formatPackagePlotMeta,
  formatPackageSeasonYear,
  getAssembleShipmentActionLabel,
  getPackageAssembleBlockedHint,
  getAssociatedProducersCardTitle,
  getCommonCancelLabel,
  getGenerateFilingArtifactsLabel,
  getGenerateFilingArtifactsSuccessToast,
  getLiabilityAcknowledgementBody,
  getLinkProducerActionLabel,
  getNoProducersLinkedMessage,
  getPackageAddFirstPlotLabel,
  getPackageAddPlotLabel,
  getPackageAssociatedPlotsTitle,
  getPackageCodeLabel,
  getPackageCreatedLabel,
  getPackageDetailBackLabel,
  getPackageDetailComplianceStatusLabel,
  getPackageDetailStatusCardTitle,
  getPackageDetailsSidebarTitle,
  getPackageFilingStatusPrefix,
  getPackageFilingWorkflowHint,
  getPackageFilingWorkflowTitle,
  getPackageFpicLabel,
  getPackageFpicStatusLabel,
  getPackageGenerateErrorMessage,
  getPackageLaborLabel,
  getPackageLaborStatusLabel,
  getPackageLiabilityAcknowledgeLabel,
  getPackageLiabilityModalTitle,
  getPackageLoadErrorPrefix,
  getPackageLoadingMessage,
  getPackageLoadingReadinessMessage,
  getPackageNoPlotsMessage,
  getPackagePendingStatusLabel,
  getPackagePreflightBlockersDescription,
  getPackagePreflightBlockersTitle,
  getPackageQuickStatsPlotsLabel,
  getPackageQuickStatsTitle,
  getPackageQuickStatsTotalHaLabel,
  getPackageReadinessBlockersHeading,
  getPackageReadinessEntityLabel,
  getPackageRecentEventsTitle,
  getPackageRemediationRunComplianceLabel,
  getPackageSeasonYearLabel,
  getPackageSlaImmediateLabel,
  getPackageSubmitActionLabel,
  getPackageSubmitErrorMessage,
  getPackageSubmitSuccessToast,
  getPackageSubmittedAwaitingMessage,
  getPackageSubmittedDateLabel,
  getPackageUpdatedLabel,
  getPackageVerifiedStatusLabel,
  getQuickStatsProducerLabel,
  getRunPackageComplianceLabel,
  getTracesReferenceLabel,
} from '@/lib/workflow-terminology-labels';

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const { id } = use(params);
  const { pkg, isLoading, error, refetch } = usePackageDetail(id, user?.tenant_id ?? null);
  const { data: readiness, isLoading: readinessLoading } = usePackageReadiness(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'generate' | 'submit' | null>(null);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col p-6 text-sm text-muted-foreground">
        {getPackageLoadingMessage(role, t)}
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex flex-col">
        <AppHeader
          title={id}
          subtitle={getPackageLoadingMessage(role, t)}
          breadcrumbs={buildPackageBreadcrumbs(role, id, id, undefined, t)}
        />
        <div className="p-6">
          {error ? (
            <p className="mb-4 text-sm text-destructive">
              {getPackageLoadErrorPrefix(role, t)}: {error}
            </p>
          ) : null}
          <PackageNotFound role={role} t={t} />
        </div>
      </div>
    );
  }


  const readinessBlockers =
    readiness?.blockers.map((issue) => issue.message) ??
    (readinessLoading ? [getPackageLoadingReadinessMessage(t)] : []);
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
      toast.success(getGenerateFilingArtifactsSuccessToast(role, t));
    } catch (generateError) {
      const message =
        generateError instanceof Error ? generateError.message : getPackageGenerateErrorMessage(t);
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
        getPackageSubmitSuccessToast(role, result.tracesReference, result.replayed, t),
      );
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : getPackageSubmitErrorMessage(role, t);
      setActionError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  };

  const timelineEvents = packageToTimelineEvents(pkg);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pkg.code}
        subtitle={pkg.supplier_name}
        breadcrumbs={buildPackageBreadcrumbs(role, pkg.code, pkg.id, undefined, t)}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission="compliance:run_check">
              <Button variant="outline" asChild>
                <Link href={`/compliance?package=${pkg.id}`}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {getRunPackageComplianceLabel(role, t)}
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
                  {getPackageSubmitActionLabel(role, pendingAction === 'submit', t)}
                </Button>
              </PermissionGate>
            )}
            {pkg.status === 'DRAFT' || pkg.status === 'READY' ? (
              <PermissionGate permission="packages:seal_shipment">
                {readinessBlockers.length > 0 || readinessLoading ? (
                  <Button
                    variant="default"
                    disabled
                    title={getPackageAssembleBlockedHint(role, t)}
                    aria-disabled="true"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {getAssembleShipmentActionLabel(role, t)}
                  </Button>
                ) : (
                  <Button asChild variant="default">
                    <Link href={`/packages/${pkg.id}/assemble`}>
                      <Lock className="mr-2 h-4 w-4" />
                      {getAssembleShipmentActionLabel(role, t)}
                    </Link>
                  </Button>
                )}
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
            {getPackageDetailBackLabel(role, t)}
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
                title={getPackagePreflightBlockersTitle(role, t)}
                description={getPackagePreflightBlockersDescription(role, readinessBlockers, t)}
                relatedEntityLabel={getPackageReadinessEntityLabel(role, t)}
                slaCountdown={getPackageSlaImmediateLabel(t)}
                remediationAction={{
                  label: getPackageRemediationRunComplianceLabel(t),
                  href: `/compliance?package=${pkg.id}`,
                }}
              />
            )}

            <ShipmentStateTimeline
              status={pkg.status}
              packageId={pkg.id}
              blockingCount={readinessBlockers.length}
            />

            {(role === 'exporter' || role === 'agent') && <PackageLineageSummaryCard pkg={pkg} t={t} />}

            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">{getPackageRecentEventsTitle(role, t)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={timelineEvents} maxHeight={240} compact />
              </CardContent>
            </Card>

            {/* Backend filing workflow */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">{getPackageFilingWorkflowTitle(role, t)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {getPackageFilingWorkflowHint(role, t)} {getPackageFilingStatusPrefix(t)}{' '}
                  <span className="font-medium text-foreground">{pkg.status}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {pkg.status === 'DRAFT' && (
                    <PermissionGate permission="packages:seal_shipment">
                      <Button
                        onClick={() => setShowLiabilityModal(true)}
                        disabled={!canGenerate || pendingAction !== null}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {getGenerateFilingArtifactsLabel(pendingAction === 'generate', t)}
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
                        {getPackageSubmitActionLabel(role, pendingAction === 'submit', t)}
                      </Button>
                    </PermissionGate>
                  )}
                  {pkg.status === 'SUBMITTED' && (
                    <p className="text-sm text-muted-foreground">
                      {getPackageSubmittedAwaitingMessage(role, t)}
                    </p>
                  )}
                </div>

                {readinessBlockers.length > 0 && (
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">
                      {getPackageReadinessBlockersHeading(t)}
                    </p>
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
                <CardTitle className="text-base font-medium">{getPackageDetailStatusCardTitle(role, t)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{getPackageDetailStatusCardTitle(role, t)}</span>
                    <PackageStatusBadge status={pkg.status} size="md" />
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{getPackageDetailComplianceStatusLabel(t)}</span>
                    <ComplianceStatusBadge status={pkg.compliance_status} size="md" />
                  </div>
                  {pkg.traces_reference && (
                    <>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{getTracesReferenceLabel(role, t)}</span>
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
                <CardTitle className="text-base font-medium">{getPackageAssociatedPlotsTitle(t)}</CardTitle>
                <PermissionGate permission="plots:create">
                  <Button variant="outline" size="sm">
                    <MapPin className="mr-2 h-4 w-4" />
                    {getPackageAddPlotLabel(t)}
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent>
                {pkg.plots.length === 0 ? (
                  <div className="py-8 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">{getPackageNoPlotsMessage(t)}</p>
                    <PermissionGate permission="plots:create">
                      <Button variant="outline" size="sm" className="mt-4">
                        {getPackageAddFirstPlotLabel(t)}
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
                              {formatPackagePlotMeta(plot.area_hectares, plot.deforestation_risk, t)}
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
                            {plot.verified ? getPackageVerifiedStatusLabel(t) : getPackagePendingStatusLabel(t)}
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
                <CardTitle className="text-base font-medium">{getAssociatedProducersCardTitle(role, t)}</CardTitle>
                <PermissionGate permission="farmers:create">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    {getLinkProducerActionLabel(role, t)}
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent>
                {pkg.farmers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">{getNoProducersLinkedMessage(role, t)}</p>
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
                                {getPackageFpicLabel(t)} {getPackageFpicStatusLabel(farmer.fpic_signed, t)}
                              </span>
                              <span>-</span>
                              <span className={farmer.labor_compliant ? 'text-primary' : 'text-chart-4'}>
                                {getPackageLaborLabel(t)}{' '}
                                {getPackageLaborStatusLabel(farmer.labor_compliant, t)}
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
                            {farmer.verified ? getPackageVerifiedStatusLabel(t) : getPackagePendingStatusLabel(t)}
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
                <CardTitle className="text-base font-medium">{getPackageDetailsSidebarTitle(role, t)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{getPackageCodeLabel(role, t)}</p>
                    <p className="text-sm font-medium">{pkg.code}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{getPackageSeasonYearLabel(t)}</p>
                    <p className="text-sm font-medium">{formatPackageSeasonYear(pkg.season, pkg.year, t)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{getPackageCreatedLabel(t)}</p>
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
                    <p className="text-xs text-muted-foreground">{getPackageUpdatedLabel(t)}</p>
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
                        <p className="text-xs text-muted-foreground">{getPackageSubmittedDateLabel(t)}</p>
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
                <CardTitle className="text-base font-medium">{getPackageQuickStatsTitle(t)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{pkg.plots.length}</p>
                    <p className="text-xs text-muted-foreground">{getPackageQuickStatsPlotsLabel(t)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{pkg.farmers.length}</p>
                    <p className="text-xs text-muted-foreground">{getQuickStatsProducerLabel(role, t)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.plots.reduce((sum, p) => sum + p.area_hectares, 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">{getPackageQuickStatsTotalHaLabel(t)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.plots.filter((p) => p.verified).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{getPackageVerifiedStatusLabel(t)}</p>
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
              <CardTitle>{getPackageLiabilityModalTitle(t)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <p className="text-sm text-amber-900">{getLiabilityAcknowledgementBody(role, t)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLiabilityModal(false)}>
                  {getCommonCancelLabel(t)}
                </Button>
                <Button
                  onClick={() => {
                    void confirmGenerateArtifacts();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {pendingAction === 'generate'
                    ? getGenerateFilingArtifactsLabel(true, t)
                    : getPackageLiabilityAcknowledgeLabel(t)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
