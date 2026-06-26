import { describe, expect, it } from 'vitest';

import { measureDeclarationParityMissing } from './cloudParityArtifactCounts';

describe('measureDeclarationParityMissing', () => {
  it('ignores server plot audits that are not linked to local plots', () => {
    const result = measureDeclarationParityMissing({
      auditRows: [
        {
          event_type: 'plot_compliance_declared',
          payload: { plotId: 'server-only-plot' },
        },
        {
          event_type: 'plot_compliance_declared',
          payload: { plotId: 'server-only-plot-2' },
        },
      ],
      localPlots: [
        {
          id: 'local-1',
          farmerId: 'farmer-1',
          name: 'A',
          createdAt: 1,
          areaSquareMeters: 100,
          areaHectares: 0.01,
          kind: 'polygon',
          points: [{ latitude: 1, longitude: 2 }],
          landTenureDeclared: true,
          noDeforestationDeclared: true,
        },
      ],
      plotServerLinks: {},
      localFarmer: {
        id: 'farmer-1',
        role: 'farmer',
        selfDeclared: true,
        fpicConsent: true,
        laborNoChildLabor: true,
        laborNoForcedLabor: true,
      },
    });

    expect(result).toEqual({
      producerMissingOnDevice: false,
      plotAttestationsMissingOnDevice: 0,
    });
  });

  it('flags linked local plots that still need attestations pulled from server', () => {
    const result = measureDeclarationParityMissing({
      auditRows: [
        {
          event_type: 'producer_attestations_updated',
          payload: { farmerId: 'farmer-1' },
        },
        {
          event_type: 'plot_compliance_declared',
          payload: { plotId: 'server-plot-1' },
        },
      ],
      localPlots: [
        {
          id: 'local-1',
          farmerId: 'farmer-1',
          name: 'A',
          createdAt: 1,
          areaSquareMeters: 100,
          areaHectares: 0.01,
          kind: 'polygon',
          points: [{ latitude: 1, longitude: 2 }],
        },
      ],
      plotServerLinks: { 'local-1': 'server-plot-1' },
      localFarmer: {
        id: 'farmer-1',
        role: 'farmer',
        selfDeclared: false,
      },
    });

    expect(result.producerMissingOnDevice).toBe(true);
    expect(result.plotAttestationsMissingOnDevice).toBe(1);
  });
});
