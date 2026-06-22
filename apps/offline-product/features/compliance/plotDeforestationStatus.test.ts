import { describe, expect, it } from 'vitest';

import {
  normalizeBackendPlotStatus,
  resolveBackendPlotComplianceStatus,
} from './plotDeforestationStatus';

describe('plotDeforestationStatus', () => {
  it('normalizes legacy compliant status', () => {
    expect(normalizeBackendPlotStatus('compliant')).toBe('deforestation_clear');
  });

  it('uses plot.status when already screened', () => {
    expect(
      resolveBackendPlotComplianceStatus({
        status: 'deforestation_clear',
        deforestation_screening: null,
      }),
    ).toBe('deforestation_clear');
  });

  it('infers clear from screening snapshot when status lags', () => {
    expect(
      resolveBackendPlotComplianceStatus({
        status: 'pending_check',
        deforestation_screening: {
          signalTier: 'green',
          screenedAt: '2026-06-18T12:00:00.000Z',
          alertCount: 0,
        },
      }),
    ).toBe('deforestation_clear');
  });

  it('keeps pending when no screening snapshot exists', () => {
    expect(
      resolveBackendPlotComplianceStatus({
        status: 'pending_check',
        deforestation_screening: null,
      }),
    ).toBe('pending_check');
  });
});
