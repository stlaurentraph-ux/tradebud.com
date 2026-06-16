// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewerDashboard } from './reviewer-dashboard';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-reviewer', tenant_id: 'tenant-reviewer', active_role: 'country_reviewer' },
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

const mockMetrics = {
  total_packages: 15,
  packages_by_status: {
    DRAFT: 2,
    READY: 5,
    SEALED: 3,
    SUBMITTED: 3,
    ACCEPTED: 1,
    REJECTED: 1,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 20,
  compliant_plots: 16,
  total_farmers: 8,
  blocking_issues_count: 2,
  yield_failures_count: 3,
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

const prefetchedHome = {
  packages: [],
  packagesLoading: false,
  packagesError: null,
  campaigns: [],
  campaignsLoading: false,
  activityEvents: [],
  activityLoaded: true,
};

describe('ReviewerDashboard', () => {
  it('renders virgin-state onboarding panel for empty tenants', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Open your review workspace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open queue/i })).toHaveAttribute('href', '/compliance/queue');
  });

  it('shows review metrics when data exists', () => {
    render(<ReviewerDashboard metrics={mockMetrics} home={prefetchedHome} />);
    expect(screen.queryByText('Welcome to your reviewer workspace')).not.toBeInTheDocument();
    expect(screen.getByText('Compliance review queue')).toBeInTheDocument();
  });

  it('displays pending review count in issue triage for mature tenants', () => {
    render(<ReviewerDashboard metrics={mockMetrics} home={prefetchedHome} />);
    const reviewRow = screen.getByRole('link', { name: /Packages awaiting review/i });
    expect(within(reviewRow).getByText('5')).toBeInTheDocument();
  });

  it('shows honest issue triage labels instead of satellite alert categories', () => {
    render(<ReviewerDashboard metrics={mockMetrics} home={prefetchedHome} />);
    expect(screen.getByText('Issue triage')).toBeInTheDocument();
    expect(screen.getByText('Blocking issues')).toBeInTheDocument();
    expect(screen.getByText('Yield warnings')).toBeInTheDocument();
    expect(screen.queryByText('Deforestation Alerts')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Area Overlaps')).not.toBeInTheDocument();
  });

  it('uses live compliance issue counts in triage badges', () => {
    render(<ReviewerDashboard metrics={mockMetrics} home={prefetchedHome} />);

    const blockingRow = screen.getByRole('link', { name: /Blocking issues/i });
    expect(within(blockingRow).getByText('2')).toBeInTheDocument();

    const yieldRow = screen.getByRole('link', { name: /Yield warnings/i });
    expect(within(yieldRow).getByText('3')).toBeInTheDocument();
  });

  it('hides expanded KPI grids for mature reviewer tenants', () => {
    render(<ReviewerDashboard metrics={mockMetrics} home={prefetchedHome} />);
    expect(screen.queryByText('Packages to review')).not.toBeInTheDocument();
    expect(screen.queryByText(/Compliance Verification/i)).not.toBeInTheDocument();
  });

  it('renders virgin state with helpful CTA buttons', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    expect(screen.getByRole('link', { name: /Open queue/i })).toHaveAttribute('href', '/compliance/queue');
  });
});
