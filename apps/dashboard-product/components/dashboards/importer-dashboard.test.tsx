// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImporterDashboard } from './importer-dashboard';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-importer',
      tenant_id: 'tenant-importer',
      active_role: 'importer',
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

const mockMetrics = {
  total_packages: 12,
  packages_by_status: {
    DRAFT: 2,
    READY: 3,
    SEALED: 4,
    SUBMITTED: 2,
    ACCEPTED: 1,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 18,
  compliant_plots: 15,
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
};

describe('ImporterDashboard', () => {
  it('renders campaigns overview and operational sections for mature tenants', () => {
    render(<ImporterDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Your priority')).toBeInTheDocument();
    expect(screen.getByText('Review queue')).toBeInTheDocument();
    expect(screen.queryByText('Supply Chain Visibility')).not.toBeInTheDocument();
  });

  it('shows onboarding banner copy for virgin tenants', () => {
    render(<ImporterDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Start collecting upstream evidence')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add contact/i })).toBeInTheDocument();
  });

  it('prioritizes inbound requests in north-star KPI', () => {
    render(
      <ImporterDashboard
        metrics={{
          ...mockMetrics,
          incoming_requests_pending: 3,
        }}
      />,
    );
    expect(screen.getByRole('link', { name: /Open inbox/i })).toHaveAttribute('href', '/inbox');
    expect(screen.getByRole('link', { name: /Open inbox/i }).closest('div')?.textContent).toContain(
      'Inbound requests pending',
    );
  });
});
