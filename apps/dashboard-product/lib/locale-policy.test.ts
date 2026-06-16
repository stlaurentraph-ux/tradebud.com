import { describe, expect, it } from 'vitest';
import {
  clampLocaleForRole,
  getAvailableLocalesForRole,
  getLocalePickerGroupsForRole,
  isLocaleForRole,
  resolveLocaleForRole,
} from './locale-policy';

describe('locale-policy', () => {
  it('limits importer locales to EU compliance set', () => {
    expect(getAvailableLocalesForRole('importer')).toEqual([
      'en',
      'fr',
      'de',
      'es',
      'it',
      'nl',
      'pt',
      'no',
    ]);
    expect(isLocaleForRole('sw', 'importer')).toBe(false);
    expect(isLocaleForRole('de', 'importer')).toBe(true);
  });

  it('prioritises origin languages for exporters and cooperatives', () => {
    expect(getAvailableLocalesForRole('exporter')[0]).toBe('sw');
    expect(getAvailableLocalesForRole('cooperative')).toContain('rw');
    expect(getAvailableLocalesForRole('cooperative')).not.toContain('de');
  });

  it('exposes all locales for sponsors', () => {
    expect(getAvailableLocalesForRole('sponsor')).toHaveLength(16);
    expect(getAvailableLocalesForRole('sponsor')).toContain('sw');
    expect(getAvailableLocalesForRole('sponsor')).toContain('de');
  });

  it('clamps invalid stored locale when role changes', () => {
    expect(clampLocaleForRole('sw', 'importer')).toBe('en');
    expect(clampLocaleForRole('de', 'importer')).toBe('de');
    expect(clampLocaleForRole('de', 'exporter')).toBe('en');
  });

  it('resolves browser language within role policy', () => {
    expect(
      resolveLocaleForRole({ browserLang: 'fr-FR', role: 'importer' }),
    ).toBe('fr');
    expect(
      resolveLocaleForRole({ browserLang: 'sw-TZ', role: 'exporter' }),
    ).toBe('sw');
    expect(
      resolveLocaleForRole({ browserLang: 'sw-TZ', role: 'importer' }),
    ).toBe('en');
  });

  it('groups sponsor picker by region', () => {
    const groups = getLocalePickerGroupsForRole('sponsor');
    expect(groups.length).toBeGreaterThan(2);
    expect(groups.flatMap((group) => group.locales)).toContain('hi');
  });
});
