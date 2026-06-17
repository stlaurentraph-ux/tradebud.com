import { describe, expect, it } from 'vitest';
import { getMockShipmentHeaderById, mockShipmentHeaders } from './shipment-headers';

describe('mock shipment headers', () => {
  it('links assembled shipments to mock package ids', () => {
    expect(mockShipmentHeaders[0]?.package_ids).toEqual(['pkg_001', 'pkg_002']);
    expect(mockShipmentHeaders[1]?.status).toBe('SEALED');
  });

  it('resolves by id and shipment reference', () => {
    expect(getMockShipmentHeaderById('shp_001')?.label).toContain('Rwanda');
    expect(getMockShipmentHeaderById('SHP-2026-002')?.id).toBe('shp_002');
    expect(getMockShipmentHeaderById('missing')).toBeNull();
  });
});
