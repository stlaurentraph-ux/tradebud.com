// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CooperativeDashboard } from './cooperative-dashboard';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-coop',
      tenant_id: 'tenant-coop',
      active_role: 'cooperative',
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

const mockMetrics = {
  total_plots: 10,
  compliant_plots: 8,
  total_farmers: 5,
};

const virginMetrics = {
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
};

describe('CooperativeDashboard', () => {
  it('renders campaigns overview for empty tenants', () => {
    render(<CooperativeDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to your cooperative workspace')).not.toBeInTheDocument();
  });

  it('shows cooperative cockpit when metrics exist', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Cooperative Operations Cockpit')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to your cooperative workspace')).not.toBeInTheDocument();
  });

  it('calculates correct verification rate', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays plots missing geometry count from pending plots', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Plots missing geometry')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders member and field management sections', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Members and Portability')).toBeInTheDocument();
    expect(screen.getByText('Field Capture and Plots')).toBeInTheDocument();
  });

  it('shows cooperative activity section', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Cooperative activity')).toBeInTheDocument();
  });

  it('calculates verification rate as 0 when no plots exist', () => {
    const zeroMetrics = { ...virginMetrics, total_plots: 1, compliant_plots: 0 };
    render(<CooperativeDashboard metrics={zeroMetrics} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
