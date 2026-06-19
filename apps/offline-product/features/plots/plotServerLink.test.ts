import { describe, expect, it } from 'vitest';
import { reconcilePlotServerLinks, resolveServerPlotIdForLocal } from './plotServerLink';

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

  it('reconciles links from client id stored in server name', () => {
    const backendPlots = [{ id: 'server-1', name: 'local-1', area_ha: 2, kind: 'polygon' }];
    const next = reconcilePlotServerLinks([localPlot], backendPlots, {});
    expect(next['local-1']).toBe('server-1');
  });
});
