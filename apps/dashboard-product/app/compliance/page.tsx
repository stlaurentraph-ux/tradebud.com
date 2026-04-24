'use client';

import React from 'react';
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

export default function CompliancePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  const { data: readiness, isLoading: isReadinessLoading, error: readinessError } = usePackageReadiness(packageId);
  const { data: evidenceDocuments, isLoading: isEvidenceDocumentsLoading, error: evidenceDocumentsError } =
    usePackageEvidenceDocuments(packageId);

  const backendPlotCount = evidenceDocuments?.length ?? 0;
  const backendIssuesCount = readiness ? readiness.blockers.length : 0;
  const canSubmit = readiness?.status === 'ready_to_submit';

  const backHref = packageId ? `/packages/${packageId}` : '/compliance';

  const reasonCodeRemediation: Record<string, string> = {
    DOC_MISSING: 'Upload missing document artifacts and re-run readiness checks.',
    DOC_PENDING_REVIEW: 'Complete reviewer validation before submission.',
    DOC_REJECTED: 'Upload corrected documents and request a fresh review.',
    DOC_STALE: 'Refresh outdated documents with current evidence versions.',
    DOC_SOURCE_MISSING: 'Attach source metadata for audit traceability.',
  };

  const backendChecks = readiness
    ? [
        {
          id: 'backend-check-status',
          title: 'Backend Readiness Status',
          description: `Package readiness is ${readiness.status}.`,
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
        plotName: document.source || `Plot ${index + 1}`,
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
        missingEvidence: document.type === 'tenure_evidence' ? ['Declared area evidence'] : [],
      };
    }) ?? [];

  const evidenceRows = backendEvidenceRows.length > 0
    ? backendEvidenceRows
    : [];

  React.useEffect(() => {
    if (packageId && readiness) {
      markOnboardingAction('compliance_check_run');
    }
  }, [packageId, readiness]);

  const isCooperative = user?.active_role === 'cooperative';
  const isImporter = user?.active_role === 'importer';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={
          isCooperative
            ? 'Cooperative Data Readiness Check'
            : isImporter
              ? 'Compliance'
              : 'Zero-Risk Pre-Flight Check'
        }
        subtitle={
          isCooperative
            ? 'Validate member evidence and plot readiness before downstream handoff'
            : isImporter
              ? 'Validate role decisions, references, and declaration readiness before submission'
              : 'Comprehensive compliance verification before TRACES submission'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Compliance' },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Back Button */}
        {packageId && (
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isImporter ? 'Back to Shipment' : 'Back to Package'}
            </Link>
          </Button>
        )}
        {!packageId ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              {isImporter
                ? 'Select a shipment from `Shipments` to run declaration readiness checks.'
                : 'Select a package from `DDS Packages` to run compliance checks.'}
            </CardContent>
          </Card>
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
                  {isImporter ? 'Shipment Compliance Overview' : 'Package Compliance Overview'}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">ID: {packageId ?? 'n/a'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {readiness?.status === 'ready_to_submit' ? '100%' : readiness ? '0%' : '--'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{isImporter ? 'Evidence Records' : 'Total Plots'}</p>
                <p className="mt-1 text-2xl font-bold">{backendPlotCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="mt-1 text-2xl font-bold text-green-500">
                  {canSubmit ? backendPlotCount : Math.max(0, backendPlotCount - backendIssuesCount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Issues</p>
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
              <strong>Issues Detected:</strong>{' '}
              {backendIssuesCount} blocker(s) detected by backend readiness checks.
              deforestation concerns and must be resolved before TRACES submission.
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Checks */}
        <ComplianceCheckList checks={backendChecks} loading={isReadinessLoading} />

        {/* Backend Readiness Reason Codes */}
        {packageId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Backend Readiness Reason Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isReadinessLoading ? (
                <p className="text-sm text-muted-foreground">Loading readiness diagnostics...</p>
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
                    Status: <span className="font-medium text-foreground">{readiness.status}</span>
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
                          Remediation:{' '}
                          {reasonCodeRemediation[issue.code] ??
                            'Resolve the flagged readiness issue and re-run checks.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-700">
                      {isImporter
                        ? 'No backend readiness reason codes reported for this shipment.'
                        : 'No backend readiness reason codes reported for this package.'}
                    </p>
                  )}
                </div>
              ) : null}
              {!isReadinessLoading && !readinessError && !readiness ? (
                <p className="text-sm text-muted-foreground">
                  {isImporter
                    ? 'Select a shipment from Shipments to load backend readiness diagnostics.'
                    : 'Select a package from Packages to load backend readiness diagnostics.'}
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
              No plot evidence loaded for this package yet.
            </CardContent>
          </Card>
        )}

        {/* Evidence Requirements */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Evidence Verification</h2>
          <div className="space-y-4">
            {isEvidenceDocumentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading package evidence diagnostics...</p>
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
              <p className="text-sm text-muted-foreground">No evidence requirements to display.</p>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {canSubmit ? (
            <>
              <Button size="lg" className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Ready for TRACES Submission
              </Button>
              <Button variant="outline" size="lg">
                Proceed to Export
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="flex-1">
                Resolve Issues
              </Button>
              <Button variant="outline" size="lg">
                {isImporter ? 'Back to Shipments' : 'Back to Packages'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
