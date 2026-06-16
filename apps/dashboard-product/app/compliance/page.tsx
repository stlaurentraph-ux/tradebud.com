'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ComplianceCheckList } from '@/components/compliance/compliance-check-list';
import { PlotComplianceBreakdown } from '@/components/compliance/plot-compliance-breakdown';
import { EvidenceRequirement } from '@/components/compliance/evidence-requirement';
import { AlertTriangle, CheckCircle, ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { usePackageReadiness } from '@/lib/use-package-readiness';
import { usePackageEvidenceDocuments } from '@/lib/use-package-evidence-documents';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getComplianceBackLinkLabel,
  getComplianceBlockerAlertTail,
  getComplianceHubCompliantLabel,
  getComplianceHubEvidenceRecordsLabel,
  getComplianceHubEvidenceVerificationTitle,
  getComplianceHubIssuesDetectedAlert,
  getComplianceHubIssuesLabel,
  getComplianceHubLoadingEvidence,
  getComplianceHubLoadingReadiness,
  getComplianceHubNoEvidenceRequirements,
  getComplianceHubNoPlotEvidence,
  getComplianceHubPackageIdLine,
  getComplianceHubProceedExportCta,
  getComplianceHubReadinessTitle,
  getComplianceHubReadyHandoffCta,
  getComplianceHubRemediationPrefix,
  getComplianceHubResolveIssuesCta,
  getComplianceHubScoreLabel,
  getComplianceHubStatusPrefix,
  getComplianceHubTotalPlotsLabel,
  getComplianceHubBackendReadinessTitle,
  getComplianceHubDeclaredAreaEvidence,
  getComplianceHubPlotFallbackName,
  getComplianceHubReadinessStatusDescription,
  getComplianceHubEmptyHint,
  getComplianceNoReasonCodesMessage,
  getComplianceOverviewTitle,
  getCompliancePageSubtitle,
  getCompliancePageTitle,
  getComplianceReadinessEmptyHint,
  getComplianceReasonCodeRemediation,
  getPackageDetailBackLabel,
  getWorkflowComplianceNavLabel,
} from '@/lib/workflow-terminology-labels';
import { ComplianceReviewHub } from '@/components/compliance/compliance-review-hub';

export default function CompliancePage() {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  const { data: readiness, isLoading: isReadinessLoading, error: readinessError } = usePackageReadiness(packageId);
  const { data: evidenceDocuments, isLoading: isEvidenceDocumentsLoading, error: evidenceDocumentsError } =
    usePackageEvidenceDocuments(packageId);

  const backendPlotCount = evidenceDocuments?.length ?? 0;
  const backendIssuesCount = readiness ? readiness.blockers.length : 0;
  const canSubmit = readiness?.status === 'ready_to_submit';

  const backHref = packageId ? `/packages/${packageId}` : '/compliance';

  const isImporter = user?.active_role === 'importer';
  const role = user?.active_role;

  const backendChecks = readiness
    ? [
        {
          id: 'backend-check-status',
          title: getComplianceHubBackendReadinessTitle(t),
          description: getComplianceHubReadinessStatusDescription(readiness.status, role, t),
          status:
            readiness.status === 'ready_to_submit'
              ? ('compliant' as const)
              : readiness.status === 'warning_review'
                ? ('warning' as const)
                : ('failed' as const),
          severity: 'critical' as const,
        },
        ...readiness.blockers.map((issue, index) => ({
          id: `backend-blocker-${index}`,
          title: issue.code,
          description: issue.message,
          status: 'failed' as const,
          severity: 'critical' as const,
        })),
        ...readiness.warnings.map((issue, index) => ({
          id: `backend-warning-${index}`,
          title: issue.code,
          description: issue.message,
          status: 'warning' as const,
          severity: 'warning' as const,
        })),
      ]
    : [];

  const backendEvidenceRows =
    evidenceDocuments?.map((document, index) => {
      return {
        plotId: document.plotId ?? `plot_${index + 1}`,
        plotName: document.source || getComplianceHubPlotFallbackName(index + 1, t),
        requiredEvidence: [
          {
            id: document.evidenceId,
            type: 'field_report' as const,
            title: document.title,
            status: document.reviewStatus,
            date: document.capturedAt ?? new Date().toISOString().slice(0, 10),
            source: document.source,
          },
        ],
        missingEvidence:
          document.type === 'tenure_evidence' ? [getComplianceHubDeclaredAreaEvidence(t)] : [],
      };
    }) ?? [];

  const evidenceRows = backendEvidenceRows.length > 0 ? backendEvidenceRows : [];

  React.useEffect(() => {
    if (packageId && readiness) {
      markOnboardingAction('compliance_check_run');
    }
  }, [packageId, readiness]);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getCompliancePageTitle(role, t)}
        subtitle={getCompliancePageSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getWorkflowComplianceNavLabel(t) },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Back Button */}
        {packageId && (
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getComplianceBackLinkLabel(role, t)}
            </Link>
          </Button>
        )}
        {!packageId ? (
          <div className="space-y-4">
            <ComplianceReviewHub />
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                {getComplianceHubEmptyHint(role, t)}
              </CardContent>
            </Card>
          </div>
        ) : null}
        {/* Package Info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {getComplianceOverviewTitle(role, t)}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getComplianceHubPackageIdLine(packageId, t)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getComplianceHubScoreLabel(t)}</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {readiness?.status === 'ready_to_submit' ? '100%' : readiness ? '0%' : '--'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {isImporter ? getComplianceHubEvidenceRecordsLabel(t) : getComplianceHubTotalPlotsLabel(t)}
                </p>
                <p className="mt-1 text-2xl font-bold">{backendPlotCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{getComplianceHubCompliantLabel(t)}</p>
                <p className="mt-1 text-2xl font-bold text-green-500">
                  {canSubmit ? backendPlotCount : Math.max(0, backendPlotCount - backendIssuesCount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{getComplianceHubIssuesLabel(t)}</p>
                <p className="mt-1 text-2xl font-bold text-destructive">
                  {backendIssuesCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert if not ready */}
        {packageId && readiness && !canSubmit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getComplianceHubIssuesDetectedAlert(backendIssuesCount, t)}{' '}
              {getComplianceBlockerAlertTail(role, t)}
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Checks */}
        <ComplianceCheckList checks={backendChecks} loading={isReadinessLoading} />

        {/* Backend Readiness Reason Codes */}
        {packageId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{getComplianceHubReadinessTitle(t)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isReadinessLoading ? (
                <p className="text-sm text-muted-foreground">{getComplianceHubLoadingReadiness(t)}</p>
              ) : null}
              {readinessError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{readinessError}</AlertDescription>
                </Alert>
              ) : null}
              {readiness ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {getComplianceHubStatusPrefix(t)}{' '}
                    <span className="font-medium text-foreground">{readiness.status}</span>
                  </p>
                  {[...readiness.blockers, ...readiness.warnings].length > 0 ? (
                    [...readiness.blockers, ...readiness.warnings].map((issue, index) => (
                      <div
                        key={`${issue.code}-${index}`}
                        className={`rounded-lg border p-3 ${
                          issue.severity === 'blocker'
                            ? 'border-red-500/30 bg-red-500/10'
                            : 'border-yellow-500/30 bg-yellow-500/10'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {issue.code}: {issue.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getComplianceHubRemediationPrefix(t)}{' '}
                          {getComplianceReasonCodeRemediation(issue.code, t)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-700">
                      {getComplianceNoReasonCodesMessage(role, t)}
                    </p>
                  )}
                </div>
              ) : null}
              {!isReadinessLoading && !readinessError && !readiness ? (
                <p className="text-sm text-muted-foreground">
                  {getComplianceReadinessEmptyHint(role, t)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* Plot-by-Plot Breakdown */}
        {evidenceRows.length > 0 ? (
          <PlotComplianceBreakdown
            plots={evidenceRows.map((row) => ({
              id: row.plotId,
              name: row.plotName,
              deforestation_risk: row.missingEvidence.length > 0 ? ('high' as const) : ('low' as const),
              status: row.missingEvidence.length > 0 ? 'non_compliant' : 'compliant',
            }))}
            packageId={packageId ?? 'unknown'}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              {getComplianceHubNoPlotEvidence(t)}
            </CardContent>
          </Card>
        )}

        {/* Evidence Requirements */}
        <div>
          <h2 className="mb-4 text-xl font-bold">{getComplianceHubEvidenceVerificationTitle(t)}</h2>
          <div className="space-y-4">
            {isEvidenceDocumentsLoading ? (
              <p className="text-sm text-muted-foreground">{getComplianceHubLoadingEvidence(t)}</p>
            ) : null}
            {evidenceDocumentsError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{evidenceDocumentsError}</AlertDescription>
              </Alert>
            ) : null}
            {evidenceRows.map((row) => (
              <EvidenceRequirement
                key={row.plotId}
                plotId={row.plotId}
                plotName={row.plotName}
                requiredEvidence={row.requiredEvidence}
                missingEvidence={row.missingEvidence}
              />
            ))}
            {evidenceRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{getComplianceHubNoEvidenceRequirements(t)}</p>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {canSubmit ? (
            <>
              <Button size="lg" className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                {getComplianceHubReadyHandoffCta(t)}
              </Button>
              <Button variant="outline" size="lg">
                {getComplianceHubProceedExportCta(t)}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="flex-1">
                {getComplianceHubResolveIssuesCta(t)}
              </Button>
              <Button variant="outline" size="lg">
                {getPackageDetailBackLabel(role, t)}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
