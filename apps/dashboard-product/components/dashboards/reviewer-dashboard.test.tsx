// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
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

describe('ReviewerDashboard', () => {
  it('renders review queue for empty tenants without redundant welcome card', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Compliance Review Queue')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to your reviewer workspace')).not.toBeInTheDocument();
  });

  it('shows review metrics when data exists', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.queryByText('Welcome to your reviewer workspace')).not.toBeInTheDocument();
    expect(screen.getByText(/5 packages awaiting your compliance review/i)).toBeInTheDocument();
  });

  it('displays pending review count correctly', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    // READY status packages = 5 (shown in queue banner and Pending Review KPI)
    expect(screen.getByText(/5 packages awaiting your compliance review/i)).toBeInTheDocument();
    expect(screen.getByText('Packages to review')).toBeInTheDocument();
  });

  it('shows compliance verification status breakdown', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.getByText(/Compliance Verification/i)).toBeInTheDocument();
  });

  it('displays critical alerts section', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Deforestation Alerts')).toBeInTheDocument();
    expect(screen.getByText('Protected Area Overlaps')).toBeInTheDocument();
  });

  it('uses live compliance issue counts instead of formula estimates', () => {
    render(<ReviewerDashboard metrics={mockMetrics} />);

    const flaggedCard = screen.getByText('Flagged Items').closest('.rounded-xl');
    expect(flaggedCard).not.toBeNull();
    expect(within(flaggedCard as HTMLElement).getByText('5')).toBeInTheDocument();

    const deforestationAlert = screen.getByRole('link', { name: /Deforestation Alerts/i });
    expect(within(deforestationAlert).getByText('2')).toBeInTheDocument();

    const protectedAreaAlert = screen.getByRole('link', { name: /Protected Area Overlaps/i });
    expect(within(protectedAreaAlert).getByText('3')).toBeInTheDocument();
  });

  it('renders virgin state with helpful CTA buttons', () => {
    render(<ReviewerDashboard metrics={virginMetrics} />);
    expect(screen.getByRole('link', { name: /Start Reviewing/i })).toHaveAttribute('href', '/compliance');
  });
});
