import { describe, expect, it } from 'vitest';
import {
  normalizeContactActivityType,
  normalizeProcessingSubtype,
  parseContactActivityClassification,
  listContactActivityTypesForRole,
} from './contact-activity-types';

describe('normalizeContactActivityType', () => {
  it('maps exporter-friendly synonyms to canonical activity types', () => {
    expect(normalizeContactActivityType('Producer')).toBe('farmer');
    expect(normalizeContactActivityType('washing facility')).toBe('processing_facility');
    expect(normalizeContactActivityType('transformation plant')).toBe('processing_facility');
    expect(normalizeContactActivityType('cooperative')).toBe('cooperative');
  });

  it('defaults unknown values to other', () => {
    expect(normalizeContactActivityType('')).toBe('other');
    expect(normalizeContactActivityType('unknown entity')).toBe('other');
  });
});

describe('parseContactActivityClassification', () => {
  it('maps washing shorthand to processing_facility with washing_station subtype', () => {
    expect(parseContactActivityClassification('washing_station')).toEqual({
      contact_type: 'processing_facility',
      processing_subtype: 'washing_station',
    });
    expect(parseContactActivityClassification('wet mill')).toEqual({
      contact_type: 'processing_facility',
      processing_subtype: 'washing_station',
    });
  });

  it('uses explicit processing subtype column when provided', () => {
    expect(parseContactActivityClassification('processing_facility', 'dry_mill')).toEqual({
      contact_type: 'processing_facility',
      processing_subtype: 'dry_mill',
    });
  });
});

describe('normalizeProcessingSubtype', () => {
  it('maps dry mill aliases', () => {
    expect(normalizeProcessingSubtype('dry mill')).toBe('dry_mill');
  });
});

describe('listContactActivityTypesForRole', () => {
  it('lists processing_facility (not washing_station) for exporters', () => {
    const types = listContactActivityTypesForRole('exporter');
    expect(types).not.toContain('washing_station');
    expect(types).toContain('processing_facility');
    expect(types).toContain('cooperative');
  });
});
