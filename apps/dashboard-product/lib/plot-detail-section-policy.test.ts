import { describe, expect, it } from 'vitest';
import {
  canRunPlotDeforestationScreening,
  getDefaultPlotDetailSectionOpen,
  isPlotScreeningClear,
} from './plot-detail-section-policy';

describe('plot-detail-section-policy', () => {
  it('opens documents when gaps exist', () => {
    expect(
      getDefaultPlotDetailSectionOpen({
        role: 'exporter',
        hasGaps: true,
        screeningClear: true,
      }).documents,
    ).toBe(true);
  });

  it('keeps field operations collapsed by default', () => {
    expect(
      getDefaultPlotDetailSectionOpen({
        role: 'cooperative',
        hasGaps: false,
        screeningClear: true,
      }).field_ops,
    ).toBe(false);
  });

  it('treats compliant status as screening clear', () => {
    expect(isPlotScreeningClear('compliant')).toBe(true);
    expect(isPlotScreeningClear('under_review')).toBe(false);
  });

  it('restricts screening runs to operator roles', () => {
    expect(canRunPlotDeforestationScreening('exporter')).toBe(true);
    expect(canRunPlotDeforestationScreening('importer')).toBe(false);
  });
});
