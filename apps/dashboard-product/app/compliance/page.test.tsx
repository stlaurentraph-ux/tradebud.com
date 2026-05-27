// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompliancePage from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'package' ? 'pkg_001' : null),
  }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/lib/mock-data', () => ({
  getPackageById: () => ({ id: 'pkg_001' }),
}));

vi.mock('@/components/compliance/compliance-check-list', () => ({
  ComplianceCheckList: () => <div>ComplianceCheckList</div>,
}));

vi.mock('@/components/compliance/plot-compliance-breakdown', () => ({
  PlotComplianceBreakdown: () => <div>PlotComplianceBreakdown</div>,
}));

vi.mock('@/components/compliance/evidence-requirement', () => ({
  EvidenceRequirement: () => <div>EvidenceRequirement</div>,
}));

vi.mock('@/lib/use-package-readiness', () => ({
  usePackageReadiness: () => ({
    isLoading: false,
    error: null,
    data: {
      packageId: 'pkg_001',
      status: 'blocked',
      blockers: [{ code: 'DOC_REJECTED', message: 'Rejected doc', severity: 'blocker' }],
      warnings: [{ code: 'DOC_STALE', message: 'Stale doc', severity: 'warning' }],
      checkedAt: '2026-04-16T00:00:00.000Z',
    },
  }),
}));

vi.mock('@/lib/use-package-evidence-documents', () => ({
  usePackageEvidenceDocuments: () => ({
    isLoading: false,
    error: null,
    data: [
      {
        evidenceId: 'evidence_v_1',
        packageId: 'pkg_001',
        plotId: 'plot_1',
        title: 'South Field B document packet',
        type: 'tenure_evidence',
        reviewStatus: 'rejected',
        source: 'South Field B',
        capturedAt: '2024-01-01',
      },
    ],
  }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      active_role: 'cooperative',
    },
  }),
}));

describe('CompliancePage backend readiness diagnostics', () => {
  it('renders backend reason-code remediation details', () => {
    render(<CompliancePage />);

    expect(screen.getByText('Backend Readiness Reason Codes')).toBeInTheDocument();
    expect(screen.getByText(/DOC_REJECTED: Rejected doc/)).toBeInTheDocument();
    expect(screen.getByText(/DOC_STALE: Stale doc/)).toBeInTheDocument();
    expect(screen.getByText(/Remediation: Upload corrected documents and request a fresh review/)).toBeInTheDocument();
    expect(screen.getByText(/Remediation: Refresh outdated documents with current evidence versions/)).toBeInTheDocument();
  });
});
