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
  it('renders virgin tenant empty state when no data exists', () => {
    render(<SponsorDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Welcome to your sponsor workspace')).toBeInTheDocument();
    expect(screen.getByText(/No sponsored organizations have been connected yet/)).toBeInTheDocument();
  });

  it('does not show virgin state when metrics exist', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.queryByText('Welcome to your sponsor workspace')).not.toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: 'Create first campaign' })).toHaveAttribute('href', '/requests');
    expect(screen.getByRole('link', { name: 'Connect organizations' })).toHaveAttribute('href', '/farmers');
  });

  it('displays KPI cards for sponsored organizations', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Governed organisations')).toBeInTheDocument();
    expect(screen.getByText('Compliance health')).toBeInTheDocument();
  });
});
