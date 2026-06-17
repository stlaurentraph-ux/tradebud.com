import { describe, expect, it } from 'vitest';
import { buildPlotDetailHeadline } from './plot-detail-headline';

describe('buildPlotDetailHeadline', () => {
  it('returns ready headline when assessment has no gaps', () => {
    const result = buildPlotDetailHeadline({
      assessment: { ready: true, gaps: [] },
      screeningStatus: 'compliant',
      tenureBadge: 'formal_documented',
    });
    expect(result.headline).toBe('Ready for EUDR dossier');
    expect(result.tone).toBe('ready');
  });

  it('counts blockers separately from warnings', () => {
    const result = buildPlotDetailHeadline({
      assessment: {
        ready: false,
        gaps: [
          { id: 'tenure', severity: 'blocking', label: 'Tenure', detail: 'x' },
          { id: 'evidence', severity: 'warning', label: 'Evidence', detail: 'y' },
        ],
      },
      screeningStatus: 'compliant',
      tenureBadge: 'missing',
    });
    expect(result.headline).toBe('1 blocker before shipment use');
    expect(result.tone).toBe('blocked');
  });
});
