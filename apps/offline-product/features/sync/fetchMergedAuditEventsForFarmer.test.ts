import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchAuditForFarmer = vi.fn();

vi.mock('@/features/api/audit', () => ({
  fetchAuditForFarmer,
}));

async function loadModule() {
  return import('./fetchMergedAuditEventsForFarmer');
}

describe('fetchMergedAuditEventsForFarmer', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchAuditForFarmer.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('de-duplicates parallel restore reads for the same farmer id', async () => {
    fetchAuditForFarmer.mockResolvedValue([
      { id: 'a1', event_type: 'producer_attestations_updated', timestamp: '2026-01-02T00:00:00.000Z' },
      { id: 'a2', event_type: 'plot_photos_synced', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
    const { fetchMergedAuditEventsForFarmer } = await loadModule();

    const [declarations, photos] = await Promise.all([
      fetchMergedAuditEventsForFarmer(['farmer-a']),
      fetchMergedAuditEventsForFarmer(['farmer-a'], 400, ['plot_photos_synced']),
    ]);

    expect(fetchAuditForFarmer).toHaveBeenCalledTimes(1);
    expect(declarations).toHaveLength(2);
    expect(photos).toEqual([
      { id: 'a2', event_type: 'plot_photos_synced', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
  });

  it('keeps distinct farmer ids as separate network reads', async () => {
    fetchAuditForFarmer.mockImplementation(async (id: string) => [
      { id: `${id}-row`, event_type: 'plot_photos_synced', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
    const { fetchMergedAuditEventsForFarmer } = await loadModule();

    await fetchMergedAuditEventsForFarmer(['farmer-a', 'farmer-b']);

    expect(fetchAuditForFarmer).toHaveBeenCalledTimes(2);
  });

  it('does not cache thrown errors so a later restore can recover', async () => {
    fetchAuditForFarmer
      .mockRejectedValueOnce(new Error('Audit fetch error: 503'))
      .mockResolvedValueOnce([{ id: 'ok', event_type: 'plot_photos_synced', timestamp: '2026-01-01T00:00:00.000Z' }]);
    const { fetchMergedAuditEventsForFarmer } = await loadModule();

    await expect(fetchMergedAuditEventsForFarmer(['farmer-a'])).rejects.toThrow('503');
    const recovered = await fetchMergedAuditEventsForFarmer(['farmer-a']);

    expect(recovered).toHaveLength(1);
    expect(fetchAuditForFarmer).toHaveBeenCalledTimes(2);
  });

  it('clears cached rows when invalidateAuditFetchCache is called', async () => {
    fetchAuditForFarmer.mockResolvedValue([
      { id: 'a1', event_type: 'producer_attestations_updated', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
    const { fetchMergedAuditEventsForFarmer, invalidateAuditFetchCache } = await loadModule();

    await fetchMergedAuditEventsForFarmer(['farmer-a']);
    invalidateAuditFetchCache();
    await fetchMergedAuditEventsForFarmer(['farmer-a']);

    expect(fetchAuditForFarmer).toHaveBeenCalledTimes(2);
  });
});
