import { describe, expect, it } from 'vitest';

import { findBackendPlotForLocal } from './backendPlotMatch';

const local = {
  id: 'local-uuid-1',
  name: 'North field',
  areaHectares: 2.4,
  kind: 'polygon' as const,
};

describe('findBackendPlotForLocal', () => {
  it('matches by stable client id in server name first', () => {
    const rows = [
      { id: 'server-99', name: 'local-uuid-1', area_ha: 2.4, kind: 'polygon' },
      { id: 'server-1', name: 'North field', area_ha: 2.4, kind: 'polygon' },
    ];
    const hit = findBackendPlotForLocal(local, rows) as { id: string };
    expect(hit.id).toBe('server-99');
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
