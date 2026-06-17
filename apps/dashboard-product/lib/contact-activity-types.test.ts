import { describe, expect, it } from 'vitest';
import { normalizeContactActivityType, listContactActivityTypesForRole } from './contact-activity-types';

describe('normalizeContactActivityType', () => {
  it('maps exporter-friendly synonyms to canonical activity types', () => {
    expect(normalizeContactActivityType('Producer')).toBe('farmer');
    expect(normalizeContactActivityType('washing facility')).toBe('washing_station');
    expect(normalizeContactActivityType('transformation plant')).toBe('processing_facility');
    expect(normalizeContactActivityType('cooperative')).toBe('cooperative');
  });

  it('defaults unknown values to other', () => {
    expect(normalizeContactActivityType('')).toBe('other');
    expect(normalizeContactActivityType('unknown entity')).toBe('other');
  });
});

describe('listContactActivityTypesForRole', () => {
  it('includes washing and processing facilities for exporters', () => {
    const types = listContactActivityTypesForRole('exporter');
    expect(types).toContain('washing_station');
    expect(types).toContain('processing_facility');
    expect(types).toContain('cooperative');
  });
});
