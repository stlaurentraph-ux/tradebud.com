import { describe, expect, it } from 'vitest';

import {
  classifyLocalPlotSyncPending,
  isLocalPlotConfirmedOnServer,
  summarizePlotSyncPending,
} from './plotSyncPending';
import type { Plot } from '@/features/state/AppStateContext';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

const plot1: Plot = {
  id: 'farmer-1',
  farmerId: 'farmer',
  name: 'Plot 1',
  kind: 'polygon',
  areaHectares: 1,
  areaSquareMeters: 10_000,
  points: [{ latitude: 14.1, longitude: -87.2 }],
  createdAt: 1,
};

const plot2: Plot = {
  id: 'farmer-2',
  farmerId: 'farmer',
  name: 'Plot 2',
  kind: 'polygon',
  areaHectares: 1,
  areaSquareMeters: 10_000,
  points: [{ latitude: 14.2, longitude: -87.3 }],
  createdAt: 2,
};

describe('plotSyncPending', () => {
  it('treats server rows with matching client_plot_id as synced', () => {
    const backend = [{ id: 'server-1', client_plot_id: 'farmer-1', name: 'Plot 1', kind: 'polygon' }];
    expect(isLocalPlotConfirmedOnServer(plot1, backend, {})).toBe(true);
  });

  it('trusts persisted device links when the server row still exists', () => {
    const backend = [{ id: 'server-1', name: 'Plot 1', kind: 'polygon' }];
    expect(isLocalPlotConfirmedOnServer(plot1, backend, { 'farmer-1': 'server-1' })).toBe(true);
  });

  it('does not list synced plots in pending upload names', () => {
    const backend = [
      { id: 'server-1', client_plot_id: 'farmer-1', name: 'Plot 1', kind: 'polygon' },
      {
        id: 'server-3',
        name: 'Plot 3',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781771458544',
        kind: 'polygon',
      },
    ];
    const plot3 = {
      ...plot2,
      id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781771458544',
      name: 'Plot 3',
    };
    const rows = classifyLocalPlotSyncPending({
      localPlots: [plot1, plot2, plot3],
      backendPlots: backend,
      plotServerLinks: {},
      t,
    });
    const summary = summarizePlotSyncPending(rows);
    expect(summary.unsyncedPlotNames).toEqual(['Plot 2']);
    expect(summary.blockedPlots).toHaveLength(0);
  });

  it('classifies overlap-blocked plots separately from upload-needed plots', () => {
    const overlappingSquare = [
      { latitude: 14.1, longitude: -87.2 },
      { latitude: 14.101, longitude: -87.2 },
      { latitude: 14.101, longitude: -87.199 },
      { latitude: 14.1, longitude: -87.199 },
    ];
    const onServer = {
      ...plot1,
      points: overlappingSquare,
    };
    const blocked = {
      ...plot2,
      points: overlappingSquare,
    };
    const backend = [{ id: 'server-1', client_plot_id: 'farmer-1', name: 'Plot 1', kind: 'polygon' }];
    const rows = classifyLocalPlotSyncPending({
      localPlots: [onServer, blocked],
      backendPlots: backend,
      plotServerLinks: {},
      t,
    });
    const summary = summarizePlotSyncPending(rows);
    expect(summary.syncedCount).toBe(1);
    expect(summary.unsyncedPlotNames).toEqual([]);
    expect(summary.blockedPlots).toHaveLength(1);
    expect(summary.blockedPlots[0]?.plotName).toBe('Plot 2');
    expect(summary.blockedPlots[0]?.overlapPlotName).toBe('Plot 1');
  });
});
