import { describe, expect, it } from 'vitest';

import {
  assessPlotGeometryQuality,
  findLocalPlotOverlaps,
  MIN_POINT_PLOT_SEPARATION_M,
  resolvePlotUploadBlockMessage,
} from './plotGeometryQuality';

const square = [
  { latitude: 14.1, longitude: -87.2 },
  { latitude: 14.101, longitude: -87.2 },
  { latitude: 14.101, longitude: -87.199 },
  { latitude: 14.1, longitude: -87.199 },
];

const sharedPoint = { latitude: 14.1005, longitude: -87.1995 };

describe('findLocalPlotOverlaps', () => {
  it('flags two point plots at the same coordinates', () => {
    const overlaps = findLocalPlotOverlaps({
      candidatePoints: [sharedPoint],
      candidateAreaHa: 0,
      candidateKind: 'point',
      otherPlots: [
        {
          id: 'plot-2',
          name: 'Plot 2',
          points: [sharedPoint],
        },
      ],
    });

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.plotName).toBe('Plot 2');
  });

  it('ignores point plots farther apart than the minimum separation', () => {
    const overlaps = findLocalPlotOverlaps({
      candidatePoints: [sharedPoint],
      candidateAreaHa: 0,
      candidateKind: 'point',
      otherPlots: [
        {
          id: 'plot-2',
          name: 'Plot 2',
          points: [{ latitude: sharedPoint.latitude + 0.01, longitude: sharedPoint.longitude }],
        },
      ],
    });

    expect(overlaps).toHaveLength(0);
    expect(MIN_POINT_PLOT_SEPARATION_M).toBeGreaterThan(0);
  });

  it('flags a point plot inside another plot polygon', () => {
    const overlaps = findLocalPlotOverlaps({
      candidatePoints: [sharedPoint],
      candidateAreaHa: 0,
      candidateKind: 'point',
      otherPlots: [
        {
          id: 'plot-2',
          name: 'Plot 2',
          points: square,
          areaHectares: 1.2,
        },
      ],
    });

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.plotName).toBe('Plot 2');
  });

  it('flags identical walked polygons', () => {
    const overlaps = findLocalPlotOverlaps({
      candidatePoints: square,
      candidateAreaHa: 1.2,
      candidateKind: 'polygon',
      otherPlots: [
        {
          id: 'plot-2',
          name: 'Plot 2',
          points: square,
          areaHectares: 1.2,
        },
      ],
    });

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.plotName).toBe('Plot 2');
  });
});

describe('assessPlotGeometryQuality', () => {
  it('blocks saving a point plot that overlaps an existing point plot', () => {
    const quality = assessPlotGeometryQuality({
      kind: 'point',
      points: [sharedPoint],
      areaHa: 0,
      otherPlots: [
        {
          id: 'plot-2',
          name: 'Plot 2',
          points: [sharedPoint],
        },
      ],
      phase: 'save',
    });

    expect(quality.blockingIssues.some((issue) => issue.code === 'GEO-105')).toBe(true);
  });
});

describe('resolvePlotUploadBlockMessage', () => {
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${JSON.stringify(params)}` : key;

  it('names the plot for micro-area upload blocks', () => {
    const block = resolvePlotUploadBlockMessage({
      plotName: 'Plot 3',
      issues: [
        {
          code: 'GEO-106',
          severity: 'error',
          message: 'ignored',
          details: { areaHa: 0.005, minAreaHa: 0.01, kind: 'micro_area' },
        },
      ],
      t,
    });

    expect(block?.message).toBe(
      'geo_quality_micro_area_upload:{"plotName":"Plot 3"}',
    );
  });
});
