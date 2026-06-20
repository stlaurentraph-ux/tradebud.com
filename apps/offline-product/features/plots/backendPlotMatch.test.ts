import { describe, expect, it } from 'vitest';

import {
  findBackendPlotForLocal,
  findOrphanServerPlotForLocalUpload,
  findServerPlotForSyncConfirmation,
  plotClientIdsShareCreationSuffix,
} from './backendPlotMatch';

const local = {
  id: 'local-uuid-1',
  name: 'North field',
  areaHectares: 2.4,
  kind: 'polygon' as const,
};

describe('findBackendPlotForLocal', () => {
  it('matches by stable client id in server name first', () => {
    const rows = [
      { id: 'server-99', client_plot_id: 'local-uuid-1', name: 'North field', area_ha: 2.4, kind: 'polygon' },
      { id: 'server-1', name: 'North field', area_ha: 2.4, kind: 'polygon' },
    ];
    const hit = findBackendPlotForLocal(local, rows) as { id: string };
    expect(hit.id).toBe('server-99');
  });

  it('matches legacy rows that still store client id in name', () => {
    const rows = [{ id: 'server-legacy', name: 'local-uuid-1', area_ha: 2.4, kind: 'polygon' }];
    const hit = findBackendPlotForLocal(local, rows) as { id: string };
    expect(hit.id).toBe('server-legacy');
  });

  it('matches when API returns camelCase clientPlotId', () => {
    const rows = [
      {
        id: 'server-camel',
        clientPlotId: 'local-uuid-1',
        name: 'North field',
        area_ha: 2.4,
        kind: 'polygon',
      },
    ];
    const hit = findBackendPlotForLocal(local, rows) as { id: string };
    expect(hit.id).toBe('server-camel');
  });

  it('falls back to legacy display name', () => {
    const rows = [{ id: 'server-2', name: 'North field', area_ha: 2.4, kind: 'polygon' }];
    const hit = findBackendPlotForLocal(local, rows) as { id: string };
    expect(hit.id).toBe('server-2');
  });

  it('returns null when no row matches', () => {
    const rows = [{ id: 'server-3', name: 'Other plot', area_ha: 1.0, kind: 'point' }];
    expect(findBackendPlotForLocal(local, rows)).toBeNull();
  });
});

describe('plotClientIdsShareCreationSuffix', () => {
  it('matches offline ids after farmer profile rekey', () => {
    expect(
      plotClientIdsShareCreationSuffix(
        '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168',
      ),
    ).toBe(true);
  });
});

describe('findServerPlotForSyncConfirmation', () => {
  it('confirms CRM-uploaded Plot 1 when device id uses linked farmer prefix', () => {
    const backend = [
      {
        id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        name: 'Plot 1',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        kind: 'polygon',
        area_ha: 0.3538,
      },
    ];
    const local = {
      id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168',
      name: 'Plot 1',
      areaHectares: 0.35,
      kind: 'polygon' as const,
    };
    const hit = findServerPlotForSyncConfirmation(local, backend, new Set([local.id]));
    expect(hit?.id).toBe('686b9ff6-acf7-40ff-9bb0-2d96f060bb78');
  });

  it('reclaims stale server client ids by display name when no device plot owns them', () => {
    const backend = [
      {
        id: '5b7d5a29-883e-4e86-bd44-1cc58677a5d9',
        name: 'Plot 3',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781771458544',
        kind: 'point',
        area_ha: 0,
      },
    ];
    const local = {
      id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781771458544',
      name: 'Plot 3',
      areaHectares: 0,
      kind: 'point' as const,
    };
    const hit = findServerPlotForSyncConfirmation(local, backend, new Set([local.id]));
    expect(hit?.id).toBe('5b7d5a29-883e-4e86-bd44-1cc58677a5d9');
  });
});

describe('findOrphanServerPlotForLocalUpload', () => {
  it('ignores CRM demo plots with the same display name', () => {
    const rows = [
      { id: '39d548f9-1ef4-449b-9ebd-fd244ae5d69e', name: 'Plot 3', kind: 'point', area_ha: 0 },
      { id: 'server-device', name: 'Plot 3', kind: 'point', area_ha: 0, created_at: '2026-06-20T09:14:52Z' },
    ];
    const hit = findOrphanServerPlotForLocalUpload(
      { id: 'local-3', name: 'Plot 3', areaHectares: 0, kind: 'point' },
      rows,
    );
    expect(hit?.id).toBe('server-device');
  });

  it('prefers the newest orphan when several share a display name', () => {
    const rows = [
      { id: 'older', name: 'Plot 3', kind: 'point', area_ha: 0, created_at: '2026-06-20T09:06:03Z' },
      { id: 'newer', name: 'Plot 3', kind: 'point', area_ha: 0, created_at: '2026-06-20T09:14:52Z' },
    ];
    const hit = findOrphanServerPlotForLocalUpload(
      { id: 'local-3', name: 'Plot 3', areaHectares: 0, kind: 'point' },
      rows,
    );
    expect(hit?.id).toBe('newer');
  });
});
