import { describe, expect, it } from 'vitest';

import {
  serverHasDeclarationAuditForQueuePayload,
  serverHasPlotComplianceAuditForLocalPlot,
  serverHasProducerAttestationAudit,
} from './declarationAuditServerMatch';

describe('declarationAuditServerMatch', () => {
  it('detects producer attestation on server', () => {
    expect(
      serverHasProducerAttestationAudit([
        { event_type: 'plot_created', payload: {}, timestamp: '1' },
      ]),
    ).toBe(false);
    expect(
      serverHasProducerAttestationAudit([
        { event_type: 'producer_attestations_updated', payload: {}, timestamp: '1' },
      ]),
    ).toBe(true);
  });

  it('matches plot compliance by local plot id', () => {
    const plot = {
      id: 'local-plot',
      name: 'P',
      areaHectares: 1,
      kind: 'permanent_crop' as const,
      landTenureDeclared: true,
      noDeforestationDeclared: true,
    };
    expect(
      serverHasPlotComplianceAuditForLocalPlot({
        plot,
        localPlots: [plot],
        plotServerLinks: { 'local-plot': 'server-plot' },
        auditRows: [
          {
            event_type: 'plot_compliance_declared',
            payload: { plotId: 'server-plot' },
            timestamp: '1',
          },
        ],
      }),
    ).toBe(true);
  });

  it('treats redundant queue payload when server already has declaration', () => {
    expect(
      serverHasDeclarationAuditForQueuePayload({
        eventType: 'producer_attestations_updated',
        auditPayload: { farmerId: 'farmer-1' },
        localPlots: [],
        plotServerLinks: {},
        auditRows: [
          { event_type: 'producer_attestations_updated', payload: {}, timestamp: '1' },
        ],
      }),
    ).toBe(true);
  });
});
