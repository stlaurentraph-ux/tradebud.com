// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CooperativeDashboard } from './cooperative-dashboard';

const mockMetrics = {
  total_packages: 5,
  packages_by_status: {
    DRAFT: 1,
    READY: 1,
    SEALED: 1,
    SUBMITTED: 1,
    ACCEPTED: 1,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 10,
  compliant_plots: 8,
  total_farmers: 5,
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

describe('CooperativeDashboard', () => {
  it('renders virgin tenant empty state when no data exists', () => {
    render(<CooperativeDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Welcome to your cooperative workspace')).toBeInTheDocument();
    expect(screen.getByText(/No demo data is preloaded/)).toBeInTheDocument();
  });

  it('does not show virgin state when metrics exist', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.queryByText('Welcome to your cooperative workspace')).not.toBeInTheDocument();
  });

  it('calculates correct verification rate', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    // 8 compliant out of 10 plots = 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays correct number of pending plots', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    // 10 total - 8 compliant = 2 pending
    expect(screen.getByText(/2.*Pending/)).toBeInTheDocument();
  });

  it('renders farmer and plot management sections', () => {
    render(<CooperativeDashboard metrics={mockMetrics} />);
    expect(screen.getByText(/Farmers/i)).toBeInTheDocument();
    expect(screen.getByText(/Plots/i)).toBeInTheDocument();
  });

  it('calculates verification rate as 0 when no plots exist', () => {
    const zeroMetrics = { ...virginMetrics, total_plots: 1, compliant_plots: 0 };
    render(<CooperativeDashboard metrics={zeroMetrics} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
