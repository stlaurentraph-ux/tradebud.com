import { describe, expect, it, vi, afterEach } from 'vitest';

const fetchAuditForFarmer = vi.fn();
const filterFarmerIdsToAuthScope = vi.fn();

vi.mock('@/features/api/audit', () => ({
  fetchAuditForFarmer,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  filterFarmerIdsToAuthScope,
}));

describe('fetchMergedAuditEventsForFarmer', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips stale farmer ids and does not throw when only scope violations remain', async () => {
    filterFarmerIdsToAuthScope.mockResolvedValue(['owned-farmer']);
    fetchAuditForFarmer.mockRejectedValue(new Error('Farmer scope violation'));

    const { fetchMergedAuditEventsForFarmer } = await import('./fetchMergedAuditEventsForFarmer');
    await expect(
      fetchMergedAuditEventsForFarmer(['stale-farmer', 'owned-farmer']),
    ).resolves.toEqual([]);

    expect(filterFarmerIdsToAuthScope).toHaveBeenCalledWith(['stale-farmer', 'owned-farmer']);
    expect(fetchAuditForFarmer).toHaveBeenCalledWith('owned-farmer');
  });

  it('merges rows from owned farmer ids', async () => {
    filterFarmerIdsToAuthScope.mockResolvedValue(['owned-a', 'owned-b']);
    fetchAuditForFarmer.mockImplementation(async (farmerId: string) => {
      if (farmerId === 'owned-a') {
        return [{ id: 'a1', timestamp: '2026-01-02T00:00:00.000Z', event_type: 'plot_created' }];
      }
      return [{ id: 'b1', timestamp: '2026-01-03T00:00:00.000Z', event_type: 'plot_created' }];
    });

    const { fetchMergedAuditEventsForFarmer } = await import('./fetchMergedAuditEventsForFarmer');
    const rows = await fetchMergedAuditEventsForFarmer(['stale-farmer', 'owned-a', 'owned-b']);

    expect(rows.map((row) => row.id)).toEqual(['b1', 'a1']);
  });

  it('returns empty audit rows without throwing on session expiry', async () => {
    filterFarmerIdsToAuthScope.mockResolvedValue(['owned-farmer']);
    fetchAuditForFarmer.mockRejectedValue(new Error('sign_in_session_expired'));

    const { fetchMergedAuditEventsForFarmer } = await import('./fetchMergedAuditEventsForFarmer');
    await expect(fetchMergedAuditEventsForFarmer(['owned-farmer'])).resolves.toEqual([]);
  });
});
