import { describe, expect, it } from 'vitest';
import {
  assessDeliveryBuyerIntakeEligibility,
  resolveBackendPlotStatusForLocalPlot,
} from './assessDeliveryBuyerIntakeEligibility';

describe('assessDeliveryBuyerIntakeEligibility', () => {
  it('marks verified plots as buyer-intake ready', () => {
    expect(assessDeliveryBuyerIntakeEligibility('verified').ready).toBe(true);
    expect(assessDeliveryBuyerIntakeEligibility('compliant').ready).toBe(true);
  });

  it('warns when plot is not intake-ready', () => {
    const result = assessDeliveryBuyerIntakeEligibility('pending_check');
    expect(result.ready).toBe(false);
    expect(result.advisoryKey).toBe('delivery_intake_plot_pending');
  });

  it('resolves backend plot status by server id', () => {
    const status = resolveBackendPlotStatusForLocalPlot(
      [{ id: 'plot-server-1', status: 'verified' }],
      'plot-server-1',
    );
    expect(status).toBe('verified');
  });
});
