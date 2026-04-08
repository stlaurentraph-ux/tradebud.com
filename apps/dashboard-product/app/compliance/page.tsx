'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ComplianceCheckList } from '@/components/compliance/compliance-check-list';
import { PlotComplianceBreakdown } from '@/components/compliance/plot-compliance-breakdown';
import { EvidenceRequirement } from '@/components/compliance/evidence-requirement';
import { AlertTriangle, CheckCircle, ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getPackageById } from '@/lib/mock-data';

// Mock data for compliance checks
const mockCompliance = {
  packageId: 'PKG-2024-001',
  packageName: 'Q1 2024 Export Batch',
  status: 'pre_flight_check',
  overallCompliance: 85,
  plots: [
    {
      id: 'PLOT-001',
      name: 'North Field A',
      deforestation_risk: 'low' as const,
      status: 'compliant',
    },
    {
      id: 'PLOT-002',
      name: 'South Field B',
      deforestation_risk: 'high' as const,
      status: 'non_compliant',
    },
    {
      id: 'PLOT-003',
      name: 'East Terrace',
      deforestation_risk: 'medium' as const,
      status: 'compliant',
    },
  ],
  checks: [
    {
      id: 'check-1',
      title: 'Satellite Imagery Verification',
      description: 'All plots verified against latest Sentinel satellite imagery (30-day window)',
      status: 'compliant' as const,
      severity: 'critical' as const,
    },
    {
      id: 'check-2',
      title: 'Government Deforestation Records',
      description: 'Cross-referenced with official government deforestation tracking database',
      status: 'warning' as const,
      severity: 'critical' as const,
    },
    {
      id: 'check-3',
      title: 'Farmer Certification Status',
      description: 'All farmers have valid sustainability certifications on file',
      status: 'compliant' as const,
      severity: 'warning' as const,
    },
    {
      id: 'check-4',
      title: 'Field Report Documentation',
      description: 'Physical field reports completed and verified by inspectors',
      status: 'pending' as const,
      severity: 'warning' as const,
    },
    {
      id: 'check-5',
      title: 'Land Rights Verification',
      description: 'All plots verified against land registry records',
      status: 'compliant' as const,
      severity: 'critical' as const,
    },
    {
      id: 'check-6',
      title: 'Legal Compliance Check',
      description: 'EUDR regulations compliance validation',
      status: 'compliant' as const,
      severity: 'critical' as const,
    },
  ],
};

export default function CompliancePage() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  const pkg = packageId ? getPackageById(packageId) : null;
  const router = useRouter();

  const canSubmit =
    mockCompliance.plots.filter((p) => p.status === 'compliant').length === mockCompliance.plots.length;

  const backHref = pkg ? `/packages/${pkg.id}` : '/compliance';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Zero-Risk Pre-Flight Check"
        subtitle="Comprehensive compliance verification before TRACES submission"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Compliance' },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Back Button */}
        {pkg && (
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Package
            </Link>
          </Button>
        )}
        {/* Package Info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{mockCompliance.packageName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">ID: {mockCompliance.packageId}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="mt-1 text-2xl font-bold text-primary">{mockCompliance.overallCompliance}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Plots</p>
                <p className="mt-1 text-2xl font-bold">{mockCompliance.plots.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="mt-1 text-2xl font-bold text-green-500">
                  {mockCompliance.plots.filter((p) => p.status === 'compliant').length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="mt-1 text-2xl font-bold text-destructive">
                  {mockCompliance.plots.filter((p) => p.status === 'non_compliant').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert if not ready */}
        {!canSubmit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issues Detected:</strong>{' '}
              {mockCompliance.plots.filter((p) => p.status === 'non_compliant').length} plot(s) have
              deforestation concerns and must be resolved before TRACES submission.
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Checks */}
        <ComplianceCheckList checks={mockCompliance.checks} />

        {/* Plot-by-Plot Breakdown */}
        <PlotComplianceBreakdown plots={mockCompliance.plots} packageId={mockCompliance.packageId} />

        {/* Evidence Requirements */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Evidence Verification</h2>
          <div className="space-y-4">
            <EvidenceRequirement
              plotId="PLOT-001"
              plotName="North Field A"
              requiredEvidence={[
                {
                  id: 'ev-1',
                  type: 'satellite_imagery',
                  title: 'Sentinel-2 Satellite Image (Jan 2024)',
                  status: 'verified',
                  date: '2024-01-15',
                  source: 'ESA',
                },
                {
                  id: 'ev-2',
                  type: 'certification',
                  title: 'Rainforest Alliance Certification',
                  status: 'verified',
                  date: '2023-12-01',
                  source: 'RA Database',
                },
              ]}
              missingEvidence={[]}
            />

            <EvidenceRequirement
              plotId="PLOT-002"
              plotName="South Field B"
              requiredEvidence={[
                {
                  id: 'ev-3',
                  type: 'satellite_imagery',
                  title: 'Sentinel-2 Satellite Image (Jan 2024)',
                  status: 'verified',
                  date: '2024-01-15',
                  source: 'ESA',
                },
                {
                  id: 'ev-4',
                  type: 'field_report',
                  title: 'Physical Field Inspection Report',
                  status: 'pending',
                  date: '2024-01-20',
                  source: 'Inspector: Maria Santos',
                },
              ]}
              missingEvidence={[
                'Government Deforestation Evidence Clearance',
                'Recent Farmer Certification Update',
              ]}
            />

            <EvidenceRequirement
              plotId="PLOT-003"
              plotName="East Terrace"
              requiredEvidence={[
                {
                  id: 'ev-5',
                  type: 'satellite_imagery',
                  title: 'Sentinel-2 Satellite Image (Jan 2024)',
                  status: 'verified',
                  date: '2024-01-15',
                  source: 'ESA',
                },
                {
                  id: 'ev-6',
                  type: 'certification',
                  title: 'UTZ Certified Certification',
                  status: 'verified',
                  date: '2024-01-10',
                  source: 'UTZ Database',
                },
              ]}
              missingEvidence={[]}
            />
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
                Back to Packages
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
