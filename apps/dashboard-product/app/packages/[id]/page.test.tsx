// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PackageDetailPage from './page';

const readinessState = vi.hoisted(() => ({
  isLoading: false,
  data: null as {
    packageId: string;
    status: 'blocked';
    blockers: Array<{ code: string; message: string; severity: 'blocker' }>;
    warnings: [];
    checkedAt: string;
  } | null,
}));

const mockPkg = {
  id: 'pkg_1',
  code: 'SHP-001',
  status: 'DRAFT' as const,
  supplier_name: 'Coop Alpha',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  compliance_status: 'BLOCKED' as const,
  farmers: [],
  plots: [],
};

vi.mock('react', async (importOriginal) => {
  const React = await importOriginal<typeof import('react')>();
  return {
    ...React,
    use: () => ({ id: 'pkg_1' }),
  };
});

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ actions }: { actions?: React.ReactNode }) => <div data-testid="header-actions">{actions}</div>,
}));

vi.mock('@/components/packages/package-status-badge', () => ({
  PackageStatusBadge: () => <span>status</span>,
  ComplianceStatusBadge: () => <span>compliance</span>,
}));

vi.mock('@/components/packages/shipment-state-timeline', () => ({
  ShipmentStateTimeline: () => <div data-testid="shipment-timeline" />,
}));

vi.mock('@/components/ui/timeline-row', () => ({
  Timeline: () => <div data-testid="timeline" />,
}));

vi.mock('@/components/common/permission-gate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-exporter',
      tenant_id: 'tenant-exporter',
      active_role: 'exporter',
    },
  }),
}));

vi.mock('@/lib/use-package-detail', () => ({
  usePackageDetail: () => ({
    pkg: mockPkg,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    vouchers: [],
  }),
}));

vi.mock('@/lib/use-package-readiness', () => ({
  usePackageReadiness: () => ({
    isLoading: readinessState.isLoading,
    error: null,
    data: readinessState.data,
  }),
}));

describe('PackageDetailPage assemble readiness gate', () => {
  it('disables assemble CTA when readiness blockers are present', () => {
    readinessState.isLoading = false;
    readinessState.data = {
      packageId: 'pkg_1',
      status: 'blocked',
      blockers: [{ code: 'PLOT_UNVERIFIED', message: 'Plot geometry not verified', severity: 'blocker' }],
      warnings: [],
      checkedAt: '2026-06-16T00:00:00.000Z',
    };

    render(<PackageDetailPage params={Promise.resolve({ id: 'pkg_1' })} />);

    const assembleButton = screen.getByRole('button', { name: /Assemble Shipment/i });
    expect(assembleButton).toBeDisabled();
    expect(assembleButton).toHaveAttribute(
      'title',
      'Resolve readiness blockers before assembling this shipment.',
    );
    expect(screen.queryByRole('link', { name: /Assemble Shipment/i })).not.toBeInTheDocument();
  });

  it('links to assemble when readiness is clear', () => {
    readinessState.isLoading = false;
    readinessState.data = {
      packageId: 'pkg_1',
      status: 'ready_to_submit',
      blockers: [],
      warnings: [],
      checkedAt: '2026-06-16T00:00:00.000Z',
    };

    render(<PackageDetailPage params={Promise.resolve({ id: 'pkg_1' })} />);

    const assembleLink = screen.getByRole('link', { name: /Assemble Shipment/i });
    expect(assembleLink).toHaveAttribute('href', '/packages/pkg_1/assemble');
    expect(screen.queryByRole('button', { name: /Assemble Shipment/i })).not.toBeInTheDocument();
  });

  it('uses exporter handoff submit label instead of TRACES filing language', () => {
    readinessState.data = {
      packageId: 'pkg_1',
      status: 'ready_to_submit',
      blockers: [],
      warnings: [],
      checkedAt: '2026-06-16T00:00:00.000Z',
    };
    mockPkg.status = 'READY';

    render(<PackageDetailPage params={Promise.resolve({ id: 'pkg_1' })} />);

    expect(screen.queryByRole('button', { name: /TRACES/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Submit downstream handoff').length).toBeGreaterThan(0);

    mockPkg.status = 'DRAFT';
  });
});
