import { describe, expect, it } from 'vitest';
import {
  reconcilePlotServerLinks,
  resolveBackendPlotMetaForLocal,
  resolveConfirmedServerPlotIdForLocal,
  resolveServerPlotIdForLocal,
} from './plotServerLink';

const localPlot = {
  id: 'local-1',
  name: 'Renamed on device',
  areaHectares: 2,
  kind: 'polygon' as const,
};

describe('plotServerLink', () => {
  it('uses persisted link when server name no longer matches client id', () => {
    const backendPlots = [{ id: 'server-9', name: 'Renamed on device', area_ha: 2, kind: 'polygon' }];
    const links = { 'local-1': 'server-9' };
    expect(resolveServerPlotIdForLocal(localPlot, backendPlots, links)).toBe('server-9');
  });

  it('trusts persisted link when backend list is temporarily empty', () => {
    const links = { 'local-1': 'server-9' };
    expect(resolveServerPlotIdForLocal(localPlot, [], links)).toBe('server-9');
  });

  it('resolves compliance meta only when server row is present', () => {
    const backendPlots = [
      {
        id: 'server-9',
        name: 'Renamed on device',
        status: 'deforestation_clear',
        deforestation_screening: { signalTier: 'green', screenedAt: '2026-06-18T12:00:00.000Z' },
      },
    ];
    const links = { 'local-1': 'server-9' };
    expect(resolveBackendPlotMetaForLocal(localPlot, backendPlots, links)).toEqual({
      id: 'server-9',
      status: 'deforestation_clear',
      deforestationScreening: backendPlots[0].deforestation_screening,
      sinaph: false,
      indigenous: false,
    });
  });

  it('returns empty compliance meta when backend list is temporarily empty', () => {
    const links = { 'local-1': 'server-9' };
    expect(resolveBackendPlotMetaForLocal(localPlot, [], links)).toEqual({
      id: null,
      status: 'pending_check',
      deforestationScreening: null,
      sinaph: false,
      indigenous: false,
    });
  });

  it('does not attach compliance meta from display-name-only server rows', () => {
    const backendPlots = [
      {
        id: 'server-old',
        name: 'Plot 1',
        status: 'deforestation_clear',
        deforestation_screening: { signalTier: 'green', screenedAt: '2026-06-23T12:00:00.000Z' },
        area_ha: 2,
        kind: 'polygon',
      },
    ];
    const plot1 = { ...localPlot, id: 'local-new', name: 'Plot 1', areaHectares: 2, kind: 'polygon' as const };
    expect(resolveBackendPlotMetaForLocal(plot1, backendPlots, {})).toEqual({
      id: null,
      status: 'pending_check',
      deforestationScreening: null,
      sinaph: false,
      indigenous: false,
    });
  });

  it('returns empty compliance meta for stale persisted links', () => {
    const links = { 'local-1': 'missing-on-server' };
    expect(resolveBackendPlotMetaForLocal(localPlot, [{ id: 'server-9', name: 'Other' }], links)).toEqual({
      id: null,
      status: 'pending_check',
      deforestationScreening: null,
      sinaph: false,
      indigenous: false,
    });
  });

  it('reconciles links from client id stored in server name', () => {
    const backendPlots = [{ id: 'server-1', name: 'local-1', area_ha: 2, kind: 'polygon' }];
    const next = reconcilePlotServerLinks([localPlot], backendPlots, {});
    expect(next['local-1']).toBe('server-1');
  });

  it('does not treat stale persisted links as confirmed when server list is empty', () => {
    const links = { 'local-1': 'server-from-old-db' };
    expect(resolveConfirmedServerPlotIdForLocal(localPlot, [], links)).toBeNull();
  });

  it('does not confirm sync from area-only fuzzy match', () => {
    const backendPlots = [{ id: 'carl', name: 'Carl kjelsens', area_ha: 2, kind: 'polygon' }];
    expect(resolveConfirmedServerPlotIdForLocal(localPlot, backendPlots, {})).toBeNull();
  });

  it('confirms sync when server stores the stable client plot id', () => {
    const backendPlots = [{ id: 'server-1', client_plot_id: 'local-1', name: 'Renamed on device', area_ha: 99, kind: 'polygon' }];
    expect(resolveConfirmedServerPlotIdForLocal(localPlot, backendPlots, {})).toBe('server-1');
  });

  it('confirms sync after farmer rekey when creation timestamp suffix matches', () => {
    const backendPlots = [
      {
        id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        name: 'Plot 1',
        kind: 'polygon',
      },
    ];
    const plot1 = {
      ...localPlot,
      id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168',
      name: 'Plot 1',
    };
    expect(resolveConfirmedServerPlotIdForLocal(plot1, backendPlots, {})).toBe(
      '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
    );
  });

  it('confirms sync by display name when server client id is stale on device', () => {
    const backendPlots = [
      { id: 'server-1', name: 'Plot 1', area_ha: 0.35, kind: 'polygon' },
      { id: '39d548f9-1ef4-449b-9ebd-fd244ae5d69e', name: 'Plot 3', kind: 'point', area_ha: 0 },
    ];
    const plot1 = { ...localPlot, id: 'local-1', name: 'Plot 1', kind: 'polygon' as const };
    expect(resolveConfirmedServerPlotIdForLocal(plot1, backendPlots, {})).toBe('server-1');
  });

  it('does not confirm sync by generic display name when only CRM demo plot matches', () => {
    const backendPlots = [
      { id: 'server-1', name: 'Plot 1', area_ha: 0.35, kind: 'polygon' },
      { id: '39d548f9-1ef4-449b-9ebd-fd244ae5d69e', name: 'Plot 3', kind: 'point', area_ha: 0 },
    ];
    const plot3 = { ...localPlot, id: 'local-3', name: 'Plot 3' };
    expect(resolveConfirmedServerPlotIdForLocal(plot3, backendPlots, {})).toBeNull();
  });

  it('drops persisted links to server-only demo plots', () => {
    const backendPlots = [
      { id: '39d548f9-1ef4-449b-9ebd-fd244ae5d69e', name: 'Plot 3', kind: 'point', area_ha: 0 },
    ];
    const plot3 = { ...localPlot, id: 'local-3', name: 'Plot 3' };
    const next = reconcilePlotServerLinks([plot3], backendPlots, { 'local-3': '39d548f9-1ef4-449b-9ebd-fd244ae5d69e' });
    expect(next['local-3']).toBeUndefined();
  });

  it('does not reconcile server-only demo plots via area match', () => {
    const backendPlots = [{ id: 'carl', name: 'Carl kjelsens', area_ha: 2, kind: 'polygon' }];
    const next = reconcilePlotServerLinks([localPlot], backendPlots, {});
    expect(next['local-1']).toBeUndefined();
  });

  it('does not link two local plots to the same server id (C6/I3 collision)', () => {
    // Two local plots with the same name/area would both fuzzy-match the same
    // orphan server row. Only the first (in localPlots order) should claim it.
    const backendPlots = [{ id: 'server-1', name: 'Twin Plot', area_ha: 2, kind: 'polygon' }];
    const plotA = { id: 'local-a', name: 'Twin Plot', areaHectares: 2, kind: 'polygon' as const };
    const plotB = { id: 'local-b', name: 'Twin Plot', areaHectares: 2, kind: 'polygon' as const };
    const next = reconcilePlotServerLinks([plotA, plotB], backendPlots, {});
    expect(next['local-a']).toBe('server-1');
    expect(next['local-b']).toBeUndefined();
  });

  it('does not steal a persisted server id from another local plot', () => {
    const backendPlots = [
      { id: 'server-1', client_plot_id: 'local-a', name: 'Twin Plot', area_ha: 2, kind: 'polygon' },
    ];
    const plotA = { id: 'local-a', name: 'Twin Plot', areaHectares: 2, kind: 'polygon' as const };
    const plotB = { id: 'local-b', name: 'Twin Plot', areaHectares: 2, kind: 'polygon' as const };
    const next = reconcilePlotServerLinks([plotA, plotB], backendPlots, {});
    expect(next['local-a']).toBe('server-1');
    // local-b must not also link to server-1 — that would overwrite local-a on the next sync.
    expect(next['local-b']).toBeUndefined();
  });
});
