import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findCanonicalShipmentHeaderForPackage,
  getCanonicalShipmentHeader,
  listCanonicalShipmentHeaders,
  resolveShipmentHeaderForAssembly,
} from './shipment-headers-client';

describe('shipment-headers-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists shipment headers from the BFF route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          shipments: [{ id: 'shp_1', package_ids: ['pkg_1'] }],
        }),
      } as Response),
    );

    const shipments = await listCanonicalShipmentHeaders();
    expect(shipments).toHaveLength(1);
    expect(shipments[0]?.id).toBe('shp_1');
  });

  it('loads a shipment header by canonical id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ shipment: { id: 'shp_1', package_ids: [] } }),
      } as Response),
    );

    const shipment = await getCanonicalShipmentHeader('shp_1');
    expect(shipment.id).toBe('shp_1');
  });

  it('resolves legacy audit assembly ids through external id lookup', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'not found' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            shipment: { id: 'shp_legacy', external_id: 'shipment_audit_1', package_ids: [] },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            shipment: { id: 'shp_legacy', external_id: 'shipment_audit_1', package_ids: [] },
          }),
        } as Response),
    );

    const shipment = await resolveShipmentHeaderForAssembly('shipment_audit_1', 'tenant_1');
    expect(shipment.id).toBe('shp_legacy');
  });

  it('resolves shipment headers by shipment reference from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'not found' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'not found' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            shipments: [
              {
                id: 'shp_1',
                shipment_reference: 'SHP-REF-99',
                package_ids: [],
              },
            ],
          }),
        } as Response),
    );

    const shipment = await resolveShipmentHeaderForAssembly('SHP-REF-99', 'tenant_1');
    expect(shipment.id).toBe('shp_1');
  });

  it('finds a shipment header by package id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          shipments: [
            { id: 'shp_1', package_ids: ['pkg_1'] },
            { id: 'shp_2', package_ids: ['pkg_2', 'pkg_3'] },
          ],
        }),
      } as Response),
    );

    const shipment = await findCanonicalShipmentHeaderForPackage('pkg_3');
    expect(shipment?.id).toBe('shp_2');
  });
});
