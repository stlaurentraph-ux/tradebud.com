import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchPlotsForFarmer = vi.fn();
const bootstrapFieldAppProducer = vi.fn();
const getBootstrapOwnedFarmerIds = vi.fn();

vi.mock('@/features/api/postPlot', () => ({
  fetchPlotsForFarmer,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  bootstrapFieldAppProducer,
  getBootstrapOwnedFarmerIds,
}));

describe('resolveFieldApiFarmerId', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns profile id when it has the most server plots', async () => {
    bootstrapFieldAppProducer.mockResolvedValue({ ok: true });
    getBootstrapOwnedFarmerIds.mockReturnValue(['device-farmer', 'auth-farmer']);
    fetchPlotsForFarmer.mockImplementation(async (id: string) => {
      if (id === 'device-farmer') return [{ id: 'plot-1' }];
      return [];
    });

    const { resolveFieldApiFarmerId } = await import('./resolveFieldApiFarmerId');
    const resolved = await resolveFieldApiFarmerId({
      profileFarmerId: 'auth-farmer',
      localPlots: [{ id: 'local-1', farmerId: 'auth-farmer' } as any],
    });

    expect(resolved).toBe('device-farmer');
  });

  it('falls back to profile id when no plots are listed', async () => {
    bootstrapFieldAppProducer.mockResolvedValue({ ok: true });
    getBootstrapOwnedFarmerIds.mockReturnValue([]);
    fetchPlotsForFarmer.mockResolvedValue([]);

    const { resolveFieldApiFarmerId } = await import('./resolveFieldApiFarmerId');
    const resolved = await resolveFieldApiFarmerId({
      profileFarmerId: 'auth-farmer',
      localPlots: [],
    });

    expect(resolved).toBe('auth-farmer');
  });
});
