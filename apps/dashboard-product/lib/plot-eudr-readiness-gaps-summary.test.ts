import { describe, expect, it } from 'vitest';
import { getPlotEudrReadinessGapsSummary } from './workflow-terminology-labels';

describe('getPlotEudrReadinessGapsSummary', () => {
  it('describes blockers and warnings together', () => {
    expect(
      getPlotEudrReadinessGapsSummary([
        { severity: 'blocking' },
        { severity: 'blocking' },
        { severity: 'warning' },
        { severity: 'warning' },
      ]),
    ).toBe('4 items open (2 block shipment)');
  });

  it('uses singular copy for a single blocking item', () => {
    expect(getPlotEudrReadinessGapsSummary([{ severity: 'blocking' }])).toBe(
      '1 item open (1 blocks shipment)',
    );
  });

  it('describes warnings-only dossier gaps', () => {
    expect(
      getPlotEudrReadinessGapsSummary([{ severity: 'warning' }, { severity: 'warning' }]),
    ).toBe('2 items to close before dossier-complete');
  });

  it('uses singular copy for a single warning', () => {
    expect(getPlotEudrReadinessGapsSummary([{ severity: 'warning' }])).toBe(
      '1 item to close before dossier-complete',
    );
  });
});
