import { describe, expect, it } from 'vitest';
import { canViewPlotFieldOperations } from './plot-detail-field-ops';

describe('canViewPlotFieldOperations', () => {
  it('allows exporter and cooperative roles', () => {
    expect(canViewPlotFieldOperations('exporter')).toBe(true);
    expect(canViewPlotFieldOperations('cooperative')).toBe(true);
  });

  it('denies importer, reviewer, sponsor, and missing role', () => {
    expect(canViewPlotFieldOperations('importer')).toBe(false);
    expect(canViewPlotFieldOperations('country_reviewer')).toBe(false);
    expect(canViewPlotFieldOperations('sponsor')).toBe(false);
    expect(canViewPlotFieldOperations(null)).toBe(false);
  });
});
