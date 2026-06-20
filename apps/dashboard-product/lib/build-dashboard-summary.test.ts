import { describe, expect, it } from 'vitest';
import { buildDashboardSummaryMetrics } from './build-dashboard-summary';

describe('buildDashboardSummaryMetrics', () => {
  it('uses tenant farmer and plot counts when packages are empty', () => {
    const metrics = buildDashboardSummaryMetrics({
      packages: [],
      campaigns: [],
      inboxRequests: [],
      operationalIssues: [],
      tenantFarmerCount: 2,
      tenantPlotCount: 3,
    });

    expect(metrics.total_farmers).toBe(2);
    expect(metrics.total_plots).toBe(3);
    expect(metrics.total_packages).toBe(0);
  });

  it('keeps the highest producer and plot counts across sources', () => {
    const metrics = buildDashboardSummaryMetrics({
      packages: [
        {
          id: 'pkg-1',
          farmers: [{ id: 'farmer-a' }],
          plots: [{ id: 'plot-a', verified: true }],
        },
      ],
      campaigns: [],
      inboxRequests: [],
      operationalIssues: [],
      tenantFarmerCount: 4,
      tenantPlotCount: 5,
      cooperativeMetrics: {
        total_farmers: 1,
        total_plots: 1,
      },
    });

    expect(metrics.total_farmers).toBe(4);
    expect(metrics.total_plots).toBe(5);
    expect(metrics.compliant_plots).toBe(1);
  });

  it('derives tenant plot action counts from inventory rows', () => {
    const metrics = buildDashboardSummaryMetrics({
      packages: [],
      campaigns: [],
      inboxRequests: [],
      operationalIssues: [],
      tenantPlots: [
        { id: 'plot-1', kind: 'point', status: 'deforestation_clear', area_ha: 2.5 },
        { id: 'plot-2', kind: 'point', status: 'deforestation_clear', declared_area_ha: 3 },
      ],
    });

    expect(metrics.total_plots).toBe(2);
    expect(metrics.plots_needing_action).toBe(0);
    expect(metrics.compliant_plots).toBe(2);
  });
});
