import { parsePlotScreeningContext } from './plot-screening-context';

describe('parsePlotScreeningContext', () => {
  it('parses GFW alert and context layers from screening snapshot', () => {
    const parsed = parsePlotScreeningContext({
      alertCount: 2,
      alertAreaHa: 0.01,
      signalTier: 'amber',
      contextAdjusted: true,
      screenedAt: '2026-06-11T12:00:00.000Z',
      context: {
        signal: 'canopy_stable',
        tropicalTreeCoverAvgPct: 72,
        tropicalTreeCoverAreaHa: 1.2,
        treeCoverLossHa: 0,
        naturalForestHa: 0.8,
        layers: [
          { dataset: 'wri_tropical_tree_cover', ok: true },
          { dataset: 'umd_tree_cover_loss', ok: true },
        ],
      },
    });

    expect(parsed?.signal).toBe('canopy_stable');
    expect(parsed?.contextAdjusted).toBe(true);
    expect(parsed?.tropicalTreeCoverAvgPct).toBe(72);
    expect(parsed?.datasets).toHaveLength(2);
  });
});
