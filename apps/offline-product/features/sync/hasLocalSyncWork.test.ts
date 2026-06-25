import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';

const mocks = vi.hoisted(() => ({
  loadPendingSyncActions: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  compactDuplicatePendingSyncActions: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  compactDuplicatePendingSyncActions: mocks.compactDuplicatePendingSyncActions,
  loadPendingSyncActions: mocks.loadPendingSyncActions,
  loadPlotServerLinks: mocks.loadPlotServerLinks,
}));

import { measureLocalSyncWork } from './hasLocalSyncWork';

const { compactDuplicatePendingSyncActions, loadPendingSyncActions, loadPlotServerLinks } = mocks;

const plot: Plot = {
  id: 'local-plot-1',
  farmerId: 'farmer-1',
  name: 'Plot 1',
  kind: 'polygon',
  areaHectares: 1,
  areaSquareMeters: 10_000,
  points: [{ latitude: 14.1, longitude: -87.2 }],
  createdAt: 1,
};

describe('measureLocalSyncWork', () => {
  beforeEach(() => {
    compactDuplicatePendingSyncActions.mockResolvedValue(0);
    loadPendingSyncActions.mockResolvedValue([]);
    loadPlotServerLinks.mockResolvedValue({});
  });

  it('reports no plot upload work when device remembers a server link (signed-out safe path)', async () => {
    loadPlotServerLinks.mockResolvedValue({ 'local-plot-1': 'server-plot-99' });
    const snapshot = await measureLocalSyncWork({ plots: [plot] });
    expect(snapshot.unsyncedPlotCount).toBe(0);
    expect(snapshot.hasWork).toBe(false);
  });

  it('reports plot upload work when no server link exists', async () => {
    const snapshot = await measureLocalSyncWork({ plots: [plot] });
    expect(snapshot.unsyncedPlotCount).toBe(1);
    expect(snapshot.hasWork).toBe(true);
  });

  it('includes queue rows in hasWork even when plots are linked', async () => {
    loadPlotServerLinks.mockResolvedValue({ 'local-plot-1': 'server-plot-99' });
    loadPendingSyncActions.mockResolvedValue([
      {
        id: 'row-1',
        actionType: 'harvest',
        payloadJson: '{}',
        createdAt: 1,
      },
    ]);
    const snapshot = await measureLocalSyncWork({ plots: [plot] });
    expect(snapshot.unsyncedPlotCount).toBe(0);
    expect(snapshot.queuePendingCount).toBe(1);
    expect(snapshot.hasWork).toBe(true);
  });
});
