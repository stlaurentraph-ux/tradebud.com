// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReviewerDashboard } from './reviewer-dashboard';

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

describe('ReviewerDashboard', () => {
  it('renders virgin tenant empty state when no data exists', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Welcome to your reviewer workspace')).toBeInTheDocument();
    expect(screen.getByText(/No items are pending review yet/)).toBeInTheDocument();
  });

  it('does not show virgin state when metrics exist', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.queryByText('Welcome to your reviewer workspace')).not.toBeInTheDocument();
  });

  it('displays pending review count correctly', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    // READY status packages = 5
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows compliance verification status breakdown', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.getByText(/Compliance Verification/i)).toBeInTheDocument();
  });

  it('displays critical alerts section', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.getByText(/Deforestation Alerts|Protected Area|Critical/i)).toBeInTheDocument();
  });

  it('renders virgin state with helpful CTA buttons', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    const createLink = screen.getByRole('link', { name: /Create first campaign|Open/ });
    expect(createLink).toBeInTheDocument();
  });
});
