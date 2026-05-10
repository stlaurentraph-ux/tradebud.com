import type { ComplianceCheck, BlockingIssue, PreflightResult } from '@/types';
import { mockPackages } from './packages';

export const mockComplianceChecks: ComplianceCheck[] = [
  {
    id: 'cc_001',
    package_id: 'pkg_001',
    plot_id: 'plot_001',
    deforestation_status: 'low',
    evidence_complete: true,
    blocking_issues: [],
    passed: true,
    checked_at: '2024-06-15T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
  {
    id: 'cc_002',
    package_id: 'pkg_002',
    plot_id: 'plot_003',
    deforestation_status: 'medium',
    evidence_complete: false,
    blocking_issues: [
      {
        id: 'bi_001',
        type: 'missing_evidence',
        severity: 'warning',
        message: 'Satellite imagery not yet uploaded',
        remediation: 'Upload satellite imagery from approved provider',
        plot_id: 'plot_003',
      },
    ],
    passed: false,
    checked_at: '2024-06-20T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
  {
    id: 'cc_003',
    package_id: 'pkg_002',
    plot_id: 'plot_004',
    deforestation_status: 'high',
    evidence_complete: false,
    blocking_issues: [
      {
        id: 'bi_002',
        type: 'deforestation_risk',
        severity: 'blocking',
        message: 'High deforestation risk detected',
        remediation: 'Provide additional evidence or exclude plot from package',
        plot_id: 'plot_004',
      },
      {
        id: 'bi_003',
        type: 'missing_evidence',
        severity: 'blocking',
        message: 'No evidence documents uploaded',
        remediation: 'Upload required evidence documents',
        plot_id: 'plot_004',
      },
      {
        id: 'bi_004',
        type: 'fpic_missing',
        severity: 'blocking',
        message: 'FPIC document not signed by farmer',
        remediation: 'Obtain signed FPIC consent from farmer',
        farmer_id: 'farmer_004',
      },
    ],
    passed: false,
    checked_at: '2024-06-20T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
];

export function getPreflightResult(packageId: string): PreflightResult | null {
  const pkg = mockPackages.find((p) => p.id === packageId);
  if (!pkg) return null;

  const checks = mockComplianceChecks.filter((c) => c.package_id === packageId);
  const blockingIssues: BlockingIssue[] = [];
  const warnings: BlockingIssue[] = [];

  for (const check of checks) {
    for (const issue of check.blocking_issues) {
      if (issue.severity === 'blocking') {
        blockingIssues.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  const passedPlots = checks.filter((c) => c.passed).length;
  const blockedPlots = checks.filter((c) => c.blocking_issues.some((i) => i.severity === 'blocking')).length;
  const warningPlots = checks.filter(
    (c) => !c.passed && !c.blocking_issues.some((i) => i.severity === 'blocking')
  ).length;

  return {
    package_id: packageId,
    overall_status: blockedPlots > 0 ? 'BLOCKED' : warningPlots > 0 ? 'WARNINGS' : 'PASSED',
    total_plots: checks.length,
    passed_plots: passedPlots,
    warning_plots: warningPlots,
    blocked_plots: blockedPlots,
    blocking_issues: blockingIssues,
    warnings,
    ready_for_traces: blockedPlots === 0,
    checked_at: new Date().toISOString(),
  };
}
