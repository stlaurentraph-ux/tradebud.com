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

  it('matches on-device plot after farmer rekey when server client_plot_id is stale', () => {
    const localPlotId = 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168';
    const staleClientPlotId = '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168';

    expect(
      resolveLocalPlotIdForServerPlot({
        serverPlotId: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        localPlots: [{ id: localPlotId } as any],
        plotServerLinks: {},
        backendPlots: [
          {
            id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
            client_plot_id: staleClientPlotId,
          },
        ],
      }),
    ).toBe(localPlotId);
  });

  it('does not return orphan server client_plot_id when no on-device plot matches', () => {
    expect(
      resolveLocalPlotIdForServerPlot({
        serverPlotId: 'server-orphan',
        localPlots: [{ id: 'local-only-9999999999999' } as any],
        plotServerLinks: {},
        backendPlots: [
          {
            id: 'server-orphan',
            client_plot_id: 'other-farmer-8888888888888',
          },
        ],
      }),
    ).toBeNull();
  });
});
