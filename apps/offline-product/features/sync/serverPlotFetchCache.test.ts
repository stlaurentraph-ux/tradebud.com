import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

const fetchPlotsForFarmer = vi.fn();

vi.mock('@/features/api/postPlot', () => ({
  fetchPlotsForFarmer,
}));

async function loadModule() {
  return import('./serverPlotFetchCache');
}

describe('serverPlotFetchCache', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchPlotsForFarmer.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hits the network every time when no run is open', async () => {
    fetchPlotsForFarmer.mockResolvedValue([{ id: 'p1' }]);
    const { fetchPlotsForFarmerCached } = await loadModule();

    await fetchPlotsForFarmerCached('farmer-a');
    await fetchPlotsForFarmerCached('farmer-a');

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates identical farmer reads inside one run (429 fix)', async () => {
    fetchPlotsForFarmer.mockResolvedValue([{ id: 'p1' }]);
    const { fetchPlotsForFarmerCached, beginServerPlotFetchRun, endServerPlotFetchRun } =
      await loadModule();

    beginServerPlotFetchRun();
    const first = await fetchPlotsForFarmerCached('farmer-a');
    const second = await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(1);
    expect(first).toEqual([{ id: 'p1' }]);
    expect(second).toEqual([{ id: 'p1' }]);
  });

  it('keeps distinct farmer ids separate within a run', async () => {
    fetchPlotsForFarmer.mockImplementation(async (id: string) => [{ id: `${id}-plot` }]);
    const { fetchPlotsForFarmerCached, beginServerPlotFetchRun, endServerPlotFetchRun } =
      await loadModule();

    beginServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    await fetchPlotsForFarmerCached('farmer-b');
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(2);
  });

  it('does not cache thrown errors (transient 403/timeout)', async () => {
    fetchPlotsForFarmer
      .mockRejectedValueOnce(new Error('Too many requests'))
      .mockResolvedValueOnce([{ id: 'p1' }]);
    const { fetchPlotsForFarmerCached, beginServerPlotFetchRun, endServerPlotFetchRun } =
      await loadModule();

    beginServerPlotFetchRun();
    await expect(fetchPlotsForFarmerCached('farmer-a')).rejects.toThrow('Too many requests');
    const recovered = await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(recovered).toEqual([{ id: 'p1' }]);
    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(2);
  });

  it('re-fetches after the cache is invalidated (post plot upload)', async () => {
    fetchPlotsForFarmer.mockResolvedValue([{ id: 'p1' }]);
    const {
      fetchPlotsForFarmerCached,
      beginServerPlotFetchRun,
      endServerPlotFetchRun,
      invalidateServerPlotFetchCache,
    } = await loadModule();

    beginServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    invalidateServerPlotFetchCache();
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(2);
  });

  it('clears the cache between separate runs', async () => {
    fetchPlotsForFarmer.mockResolvedValue([{ id: 'p1' }]);
    const { fetchPlotsForFarmerCached, beginServerPlotFetchRun, endServerPlotFetchRun } =
      await loadModule();

    beginServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    beginServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(2);
  });

  it('stays open until the outermost nested run closes', async () => {
    fetchPlotsForFarmer.mockResolvedValue([{ id: 'p1' }]);
    const { fetchPlotsForFarmerCached, beginServerPlotFetchRun, endServerPlotFetchRun } =
      await loadModule();

    beginServerPlotFetchRun();
    beginServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();
    await fetchPlotsForFarmerCached('farmer-a');
    endServerPlotFetchRun();

    expect(fetchPlotsForFarmer).toHaveBeenCalledTimes(1);
  });
});
