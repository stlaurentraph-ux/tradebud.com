import { describe, expect, it } from 'vitest';

import {
  primaryGeometryBlockForWhy,
  resolveGeometrySyncWhyExplain,
} from './plotGeometrySyncExplain';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('plotGeometrySyncExplain', () => {
  it('explains overlap with both plot names', () => {
    const explain = resolveGeometrySyncWhyExplain(
      {
        plotId: 'p2',
        plotName: 'Plot 2',
        code: 'GEO-105',
        overlapPlotName: 'Plot 1',
        message: 'overlap',
        supportMailto: '',
      },
      t,
    );
    expect(explain?.title).toBe('geo_sync_why_overlap_title');
    expect(explain?.body).toContain('Plot 2');
    expect(explain?.body).toContain('Plot 1');
  });

  it('picks micro vs sliver copy from block message', () => {
    const micro = resolveGeometrySyncWhyExplain(
      {
        plotId: 'p3',
        plotName: 'Plot 3',
        code: 'GEO-106',
        message: 'plot area is very small',
        supportMailto: '',
      },
      t,
    );
    expect(micro?.title).toBe('geo_sync_why_micro_title');

    const sliver = resolveGeometrySyncWhyExplain(
      {
        plotId: 'p3',
        plotName: 'Plot 3',
        code: 'GEO-106',
        message: 'boundary is very thin',
        supportMailto: '',
      },
      t,
    );
    expect(sliver?.title).toBe('geo_sync_why_sliver_title');
  });

  it('returns why block only for a single geometry block', () => {
    expect(
      primaryGeometryBlockForWhy([
        {
          plotId: 'p2',
          plotName: 'Plot 2',
          code: 'GEO-105',
          message: 'overlap',
          supportMailto: '',
        },
      ])?.plotName,
    ).toBe('Plot 2');
    expect(primaryGeometryBlockForWhy([])).toBeNull();
    expect(
      primaryGeometryBlockForWhy([
        {
          plotId: 'p1',
          plotName: 'Plot 1',
          code: 'GEO-105',
          message: 'a',
          supportMailto: '',
        },
        {
          plotId: 'p2',
          plotName: 'Plot 2',
          code: 'GEO-106',
          message: 'b',
          supportMailto: '',
        },
      ]),
    ).toBeNull();
  });
});
