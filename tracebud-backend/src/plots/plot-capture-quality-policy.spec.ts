import {
  DEFAULT_TENANT_GEOMETRY_POLICY,
  parseGeometryCaptureTier,
  plotGeometryNeedsShipmentAck,
} from './plot-capture-quality-policy';

describe('plot-capture-quality-policy', () => {
  it('parses geometry capture tier from plot payload', () => {
    expect(
      parseGeometryCaptureTier({ geometry_confidence_tier: 'low', geometry_confidence_score: 40 }),
    ).toBe('low');
  });

  it('warns when capture tier is below tenant minimum and plot is not approved', () => {
    const ack = plotGeometryNeedsShipmentAck({
      geometryApprovedAt: null,
      captureTier: 'low',
      policy: DEFAULT_TENANT_GEOMETRY_POLICY,
    });
    expect(ack).toEqual({ severity: 'warning' });
  });

  it('skips ack when geometry is approved', () => {
    const ack = plotGeometryNeedsShipmentAck({
      geometryApprovedAt: '2026-06-24T00:00:00.000Z',
      captureTier: 'low',
      policy: DEFAULT_TENANT_GEOMETRY_POLICY,
    });
    expect(ack).toBeNull();
  });
});
