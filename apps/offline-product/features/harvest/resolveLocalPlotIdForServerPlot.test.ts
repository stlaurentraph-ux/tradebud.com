import { describe, expect, it } from 'vitest';
import { resolveLocalPlotIdForServerPlot } from './resolveLocalPlotIdForServerPlot';

describe('resolveLocalPlotIdForServerPlot', () => {
  it('matches via plot server link', () => {
    expect(
      resolveLocalPlotIdForServerPlot({
        serverPlotId: 'server-1',
        localPlots: [{ id: 'local-1' } as any],
        plotServerLinks: { 'local-1': 'server-1' },
        backendPlots: [],
      }),
    ).toBe('local-1');
  });

  it('matches via backend client_plot_id after plot restore', () => {
    expect(
      resolveLocalPlotIdForServerPlot({
        serverPlotId: 'server-1',
        localPlots: [{ id: 'local-abc' } as any],
        plotServerLinks: {},
        backendPlots: [{ id: 'server-1', client_plot_id: 'local-abc' }],
      }),
    ).toBe('local-abc');
  });
});
