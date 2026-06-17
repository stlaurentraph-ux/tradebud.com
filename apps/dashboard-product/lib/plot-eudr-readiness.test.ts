import { describe, expect, it } from 'vitest';
import {
  assessPlotEudrReadiness,
  formatDeforestationScreeningStatus,
  PLOT_GROUND_TRUTH_PHOTOS_REQUIRED,
} from './plot-eudr-readiness';

const basePlot = {
  kind: 'point' as const,
  compliance_status: 'compliant' as const,
  verified: false,
  area_hectares: 2.5,
};

const fullPhotos = {
  clearanceVerifiedCount: PLOT_GROUND_TRUTH_PHOTOS_REQUIRED,
  minRequired: PLOT_GROUND_TRUTH_PHOTOS_REQUIRED,
  clearanceEligible: true,
  totalCount: PLOT_GROUND_TRUTH_PHOTOS_REQUIRED,
};

describe('assessPlotEudrReadiness', () => {
  it('flags compliant screening with missing tenure, evidence, and photos', () => {
    const result = assessPlotEudrReadiness({
      plot: basePlot,
      tenureBadge: 'missing',
      tenureEvidenceCount: 0,
      plotEvidenceCount: 0,
      groundTruthPhotos: {
        clearanceVerifiedCount: 0,
        minRequired: 4,
        clearanceEligible: false,
        totalCount: 0,
      },
    });

    expect(result.ready).toBe(false);
    expect(result.gaps.map((gap) => gap.id)).toEqual(
      expect.arrayContaining(['tenure', 'evidence', 'ground_truth_photos']),
    );
    expect(result.gaps.some((gap) => gap.id === 'deforestation_screening')).toBe(false);
  });

  it('reports ready when all dossier items are satisfied', () => {
    const result = assessPlotEudrReadiness({
      plot: { ...basePlot, verified: true, kind: 'polygon', compliance_status: 'compliant' },
      tenureBadge: 'formal_documented',
      tenureEvidenceCount: 1,
      plotEvidenceCount: 2,
      groundTruthPhotos: fullPhotos,
    });

    expect(result.ready).toBe(true);
    expect(result.gaps).toHaveLength(0);
  });

  it('treats under_review screening plus missing photos as blocking', () => {
    const result = assessPlotEudrReadiness({
      plot: { ...basePlot, compliance_status: 'under_review' },
      tenureBadge: 'formal_documented',
      tenureEvidenceCount: 1,
      plotEvidenceCount: 1,
      groundTruthPhotos: {
        clearanceVerifiedCount: 1,
        minRequired: 4,
        clearanceEligible: false,
        totalCount: 1,
      },
    });

    expect(result.gaps.filter((gap) => gap.severity === 'blocking').map((gap) => gap.id)).toEqual([
      'ground_truth_photos',
    ]);
    expect(result.gaps.some((gap) => gap.id === 'deforestation_screening')).toBe(true);
  });
});

describe('formatDeforestationScreeningStatus', () => {
  it('does not use the word compliant alone', () => {
    expect(formatDeforestationScreeningStatus('compliant')).toContain('Clear');
    expect(formatDeforestationScreeningStatus('compliant')).not.toBe('compliant');
  });
});
