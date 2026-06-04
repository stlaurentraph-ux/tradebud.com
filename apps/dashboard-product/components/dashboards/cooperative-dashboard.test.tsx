// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CooperativeDashboard } from './cooperative-dashboard';

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

  it('calculates verification rate as 0 when no plots exist', () => {
    const zeroMetrics = { ...virginMetrics, total_plots: 1, compliant_plots: 0 };
    render(<CooperativeDashboard metrics={zeroMetrics} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
