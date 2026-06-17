import { describe, expect, it } from 'vitest';
import { plotDetailPath, plotHistoryPath } from './plot-detail-paths';

describe('plot-detail-paths', () => {
  it('builds plot detail and history routes', () => {
    expect(plotDetailPath('plot_1')).toBe('/plots/plot_1');
    expect(plotHistoryPath('plot_1')).toBe('/plots/plot_1/history');
  });

  it('encodes plot ids for URL safety', () => {
    expect(plotHistoryPath('plot/with space')).toBe('/plots/plot%2Fwith%20space/history');
  });
});
