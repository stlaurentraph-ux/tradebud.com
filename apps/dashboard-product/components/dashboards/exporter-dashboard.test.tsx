// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExporterDashboard } from './exporter-dashboard';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-exporter',
      tenant_id: 'tenant-exporter',
      active_role: 'exporter',
    },
  }),
}));

vi.mock('@/lib/use-harvest-packages', () => ({
  useHarvestPackages: () => ({
    packages: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/lib/use-requests', () => ({
  useRequestCampaigns: () => ({
    campaigns: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/lib/use-dashboard-activity', () => ({
  useDashboardActivity: () => ({ events: [], loaded: true }),
}));

const matureMetrics = {
  total_packages: 8,
  packages_by_status: {
    DRAFT: 1,
    READY: 2,
    SEALED: 3,
    SUBMITTED: 1,
    ACCEPTED: 1,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 12,
  compliant_plots: 10,
  total_farmers: 5,
  blocking_issues_count: 0,
  yield_failures_count: 0,
};

const virginMetrics = {
  total_packages: 0,
  packages_by_status: {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
};

describe('ExporterDashboard', () => {
  it('renders pipeline and KPI sections for mature tenants', () => {
    render(<ExporterDashboard metrics={matureMetrics} />);
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Shipment Readiness Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Your priority')).toBeInTheDocument();
    expect(screen.getByText('Shipments ready to seal')).toBeInTheDocument();
  });

  it('shows lineage checklist until seal milestone is reached', () => {
    render(
      <ExporterDashboard
        metrics={{
          ...matureMetrics,
          packages_by_status: {
            ...matureMetrics.packages_by_status,
            READY: 0,
            SEALED: 0,
          },
        }}
      />,
    );
    expect(screen.getByText('Export lineage checklist')).toBeInTheDocument();
  });

  it('prioritizes blocking issues in north-star KPI', () => {
    render(
      <ExporterDashboard
        metrics={{
          ...matureMetrics,
          blocking_issues_count: 4,
        }}
      />,
    );
    expect(screen.getByRole('link', { name: /Open issues board/i })).toHaveAttribute(
      'href',
      '/compliance/issues',
    );
    expect(screen.getByRole('link', { name: /Open issues board/i }).closest('div')?.textContent).toContain(
      '4',
    );
    expect(screen.getByRole('link', { name: /Open issues board/i }).closest('div')?.textContent).toContain(
      'Blocking issues',
    );
  });

  it('shows virgin onboarding panel for empty tenants', () => {
    render(<ExporterDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Set up your export workspace')).toBeInTheDocument();
    expect(screen.getByText('Register suppliers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Import suppliers/i })).toBeInTheDocument();
  });
});
