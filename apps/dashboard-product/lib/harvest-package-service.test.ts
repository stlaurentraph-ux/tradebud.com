import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHarvestPackageById } from './harvest-package-service';

describe('getHarvestPackageById', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns detail payload when the detail endpoint succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          package: {
            id: 'pkg_1',
            label: 'SHP-001',
            created_at: '2026-01-01T00:00:00.000Z',
          },
          vouchers: [{ id: 'v1', kg: 120 }],
        }),
      } as Response),
    );

    const result = await getHarvestPackageById('pkg_1', 'tenant_1');
    expect(result?.pkg.id).toBe('pkg_1');
    expect(result?.pkg.code).toBe('SHP-001');
    expect(result?.resolvedFromListFallback).toBe(false);
  });

  it('falls back to the package list when detail is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'not found' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            packages: [
              {
                id: 'pkg_1',
                label: 'SHP-001',
                created_at: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        } as Response),
    );

    const result = await getHarvestPackageById('pkg_1', 'tenant_1');
    expect(result?.pkg.id).toBe('pkg_1');
    expect(result?.resolvedFromListFallback).toBe(true);
  });

  it('resolves packages by shipment reference code from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'not found' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            packages: [
              {
                id: 'pkg_1',
                label: 'SHP-REF-42',
                created_at: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        } as Response),
    );

    const result = await getHarvestPackageById('SHP-REF-42', 'tenant_1');
    expect(result?.pkg.id).toBe('pkg_1');
  });
});
