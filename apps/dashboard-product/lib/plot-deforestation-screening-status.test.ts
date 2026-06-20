import { describe, expect, it } from 'vitest';

import {
  explainPlotStatusEnumValue,
  formatDeforestationScreeningStatus,
  formatDeforestationScreeningStatusShort,
} from './plot-deforestation-screening-status';

describe('plot-deforestation-screening-status', () => {
  it('does not label deforestation_clear as full EUDR compliance', () => {
    expect(formatDeforestationScreeningStatus('deforestation_clear')).toBe(
      'Clear — no deforestation signal',
    );
    expect(formatDeforestationScreeningStatusShort('deforestation_clear')).toBe('Deforestation clear');
  });

  it('maps legacy compliant enum to the same labels', () => {
    expect(formatDeforestationScreeningStatus('compliant')).toBe('Clear — no deforestation signal');
    expect(formatDeforestationScreeningStatusShort('compliant')).toBe('Deforestation clear');
  });

  it('explains raw Supabase enum values', () => {
    expect(explainPlotStatusEnumValue('deforestation_clear')).toContain('not full EUDR');
    expect(explainPlotStatusEnumValue('pending_check')).toContain('Screening pending');
  });
});
