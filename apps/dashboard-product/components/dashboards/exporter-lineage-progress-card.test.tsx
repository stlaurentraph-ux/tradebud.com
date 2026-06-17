// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExporterLineageProgressCard } from './exporter-lineage-progress-card';

vi.mock('@/lib/observability/analytics', () => ({
  trackDashboardEvent: vi.fn(),
  DASHBOARD_EVENTS: {
    EXPORTER_LINEAGE_STEP_CLICKED: 'dashboard_exporter_lineage_step_clicked',
  },
}));

describe('ExporterLineageProgressCard', () => {
  it('hides when all lineage steps are complete', () => {
    const { container } = render(
      <ExporterLineageProgressCard
        signals={{
          total_farmers: 2,
          total_plots: 3,
          total_packages: 2,
          packages_by_status: { SEALED: 1 },
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows incomplete steps with CTAs', () => {
    render(
      <ExporterLineageProgressCard
        signals={{
          total_farmers: 1,
          total_plots: 0,
          total_packages: 0,
        }}
      />,
    );
    expect(screen.getByText('Export lineage checklist')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request plot data/i })).toHaveAttribute('href', '/outreach?new=1');
  });
});
