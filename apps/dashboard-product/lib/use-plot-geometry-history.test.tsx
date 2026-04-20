// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlotGeometryHistory } from './use-plot-geometry-history';

describe('usePlotGeometryHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds requests with pagination and sort parameters across state changes', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
        sort: 'desc',
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/plots/plot_1/geometry-history?limit=20&offset=0&sort=desc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    );

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/plots/plot_1/geometry-history?limit=20&offset=40&sort=desc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    );

    act(() => {
      result.current.setSort('asc');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/plots/plot_1/geometry-history?limit=20&offset=40&sort=asc&anomalyProfile=balanced&signalsOnly=false',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token_user_1' },
      }),
    );
  });

  it('persists and restores filter/sort/profile presets per user+plot', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    localStorage.setItem(
      'tb:geometry-history:preset:usr_exporter_001:plot_1',
      JSON.stringify({
        filter: 'plot_created',
        sort: 'asc',
        anomalyProfile: 'strict',
        signalsOnly: true,
        viewPageMemory: {
          'all|mixed': 6,
          'all|signals': 2,
          'plot_created|mixed': 3,
          'plot_created|signals': 4,
          'plot_geometry_superseded|mixed': 2,
          'plot_geometry_superseded|signals': 1,
        },
      }),
    );

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/plots/plot_1/geometry-history?limit=20&offset=0&sort=asc&anomalyProfile=strict&signalsOnly=true',
      expect.any(Object),
    );
    expect(result.current.filter).toBe('plot_created');
    expect(result.current.sort).toBe('asc');
    expect(result.current.anomalyProfile).toBe('strict');
    expect(result.current.signalsOnly).toBe(true);
    expect(result.current.viewPageMemory).toEqual({
      'all|mixed': 6,
      'all|signals': 2,
      'plot_created|mixed': 3,
      'plot_created|signals': 4,
      'plot_geometry_superseded|mixed': 2,
      'plot_geometry_superseded|signals': 1,
    });
  });

  it('flags anomaly signals from supersession history', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'evt_2',
            timestamp: '2026-04-16T10:15:33.000Z',
            userId: 'user_1',
            deviceId: null,
            eventType: 'plot_geometry_superseded',
            payload: {
              plotId: 'plot_1',
              details: {
                geometryNormalization: {
                  correctionVariancePct: 4.2,
                },
              },
            },
          },
          {
            id: 'evt_1',
            timestamp: '2026-04-16T10:45:33.000Z',
            userId: 'user_1',
            deviceId: null,
            eventType: 'plot_geometry_superseded',
            payload: { plotId: 'plot_1', details: {} },
          },
        ],
        anomalies: [
          {
            eventId: 'evt_2',
            type: 'large_revision_jump',
            severity: 'high',
            message: 'Large revision jump: 4.20% area correction variance.',
          },
        ],
        anomalySummary: {
          total: 1,
          highSeverity: 1,
          mediumSeverity: 0,
          byType: {
            largeRevisionJump: 1,
            frequentSupersession: 0,
          },
        },
        total: 2,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(result.current.anomalies.length).toBeGreaterThan(0);
    });
    expect(result.current.anomalies).toEqual([
      expect.objectContaining({
        eventId: 'evt_2',
        type: 'large_revision_jump',
        severity: 'high',
      }),
    ]);
    expect(result.current.anomalySummary).toEqual({
      total: 1,
      highSeverity: 1,
      mediumSeverity: 0,
      byType: {
        largeRevisionJump: 1,
        frequentSupersession: 0,
      },
    });
  });

  it('exposes canonical page clamp helper based on current totals', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 25,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(result.current.total).toBe(25);
    });

    expect(result.current.clampPage(0)).toBe(1);
    expect(result.current.clampPage(2)).toBe(2);
    expect(result.current.clampPage(9)).toBe(2);
  });

  it('bounds setPage updates when totals define max page', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 25,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(result.current.total).toBe(25);
    });

    act(() => {
      result.current.setPage(9);
    });
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/plots/plot_1/geometry-history?limit=20&offset=20&sort=desc&anomalyProfile=balanced&signalsOnly=false',
      expect.any(Object),
    );
  });

  it('derives initial hybrid view memory from legacy mode/filter presets', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    localStorage.setItem(
      'tb:geometry-history:preset:usr_exporter_001:plot_1',
      JSON.stringify({
        filter: 'all',
        sort: 'desc',
        anomalyProfile: 'balanced',
        signalsOnly: false,
        modePageMemory: { mixed: 5, signalsOnly: 2 },
        filterPageMemory: { all: 5, plot_created: 3, plot_geometry_superseded: 4 },
      }),
    );
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });

    expect(result.current.viewPageMemory).toEqual({
      'all|mixed': 5,
      'all|signals': 2,
      'plot_created|mixed': 3,
      'plot_created|signals': 2,
      'plot_geometry_superseded|mixed': 4,
      'plot_geometry_superseded|signals': 2,
    });
    expect(localStorage.getItem('tb:geometry-history:legacy-view-fallback-count')).toBe('1');
    expect(result.current.legacyViewFallbackCount).toBe(1);
  });

  it('can reset legacy fallback migration counter state and storage', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    sessionStorage.setItem('tracebud_user', JSON.stringify({ id: 'usr_exporter_001' }));
    localStorage.setItem('tb:geometry-history:legacy-view-fallback-count', '7');
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const { result } = renderHook(() => usePlotGeometryHistory('plot_1'));
    await waitFor(() => {
      expect(result.current.legacyViewFallbackCount).toBe(7);
    });

    act(() => {
      result.current.resetLegacyViewFallbackCount();
    });

    expect(result.current.legacyViewFallbackCount).toBe(0);
    expect(localStorage.getItem('tb:geometry-history:legacy-view-fallback-count')).toBeNull();
  });
});
