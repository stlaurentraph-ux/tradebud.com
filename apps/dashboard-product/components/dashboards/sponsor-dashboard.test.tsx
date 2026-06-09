// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SponsorDashboard } from './sponsor-dashboard';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-sponsor',
      tenant_id: 'tenant-sponsor',
      active_role: 'sponsor',
    },
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

vi.mock('@/components/dashboards/dashboard-activity-card', () => ({
  DashboardActivityCard: ({ title }: { title?: string }) => <div>{title}</div>,
}));

const mockMetrics = {
  total_packages: 30,
  packages_by_status: {
    DRAFT: 5,
    READY: 8,
    SEALED: 5,
    SUBMITTED: 7,
    ACCEPTED: 4,
    REJECTED: 1,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 50,
  compliant_plots: 42,
  total_farmers: 20,
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

describe('SponsorDashboard', () => {
  it('renders programmes overview for empty tenants', () => {
    render(<SponsorDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Programmes')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to your sponsor workspace')).not.toBeInTheDocument();
  });

  it('shows governance sections when metrics exist', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.queryByText('Welcome to your sponsor workspace')).not.toBeInTheDocument();
    expect(screen.getByText('Network Health Snapshot')).toBeInTheDocument();
  });

  it('displays network overview section', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Network Health Snapshot')).toBeInTheDocument();
  });

  it('shows active campaign tracking', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Programme Performance')).toBeInTheDocument();
  });

  it('renders virgin state with helpful CTA buttons', () => {
    render(<SponsorDashboard metrics={virginMetrics} />);
    const programmeLinks = screen.getAllByRole('link', { name: 'Launch first programme' });
    expect(programmeLinks[0]).toHaveAttribute('href', '/programmes?new=1&sponsorView=country');
  });

  it('displays KPI cards for sponsored organizations', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Governed organisations')).toBeInTheDocument();
    expect(screen.getByText('Compliance health')).toBeInTheDocument();
  });
});
