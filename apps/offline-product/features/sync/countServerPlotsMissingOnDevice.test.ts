import { describe, expect, it } from 'vitest';
import type { Plot } from '@/features/state/AppStateContext';
import { countServerPlotsMissingOnDevice } from './countServerPlotsMissingOnDevice';

const localPlot = (id: string): Plot =>
  ({
    id,
    name: id,
    farmerId: 'farmer-1',
  }) as Plot;

describe('countServerPlotsMissingOnDevice', () => {
  it('returns 0 when every server row matches a local plot or link', () => {
    const missing = countServerPlotsMissingOnDevice({
      backendPlots: [
        { id: 'server-a', client_plot_id: 'local-a' },
        { id: 'server-b', client_plot_id: 'local-b' },
        { id: 'server-orphan', client_plot_id: 'local-a' },
      ],
      localPlots: [localPlot('local-a'), localPlot('local-b')],
      plotServerLinks: {
        'local-a': 'server-a',
        'local-b': 'server-b',
      },
    });
    expect(missing).toBe(0);
  });

  it('counts only server rows with no local match (not gross server minus local)', () => {
    const missing = countServerPlotsMissingOnDevice({
      backendPlots: [
        { id: 'server-a', client_plot_id: 'local-a' },
        { id: 'server-b', client_plot_id: 'local-b' },
        { id: 'server-c', client_plot_id: 'local-c' },
        { id: 'server-d', client_plot_id: 'local-d' },
      ],
      localPlots: [localPlot('local-a'), localPlot('local-b')],
      plotServerLinks: {},
    });
    expect(missing).toBe(2);
  });
});
