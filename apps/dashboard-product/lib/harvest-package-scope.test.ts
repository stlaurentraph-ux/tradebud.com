import { describe, expect, it } from 'vitest';
import { defaultPackagesPageTab, resolveHarvestPackageScope } from '@/lib/harvest-package-scope';

describe('resolveHarvestPackageScope', () => {
  it('uses shared scope for importer and reviewer roles', () => {
    expect(resolveHarvestPackageScope('importer')).toBe('shared');
    expect(resolveHarvestPackageScope('country_reviewer')).toBe('shared');
  });

  it('uses tenant scope for exporter and cooperative roles', () => {
    expect(resolveHarvestPackageScope('exporter')).toBe('tenant');
    expect(resolveHarvestPackageScope('cooperative')).toBe('tenant');
    expect(resolveHarvestPackageScope('sponsor')).toBe('tenant');
  });
});

describe('defaultPackagesPageTab', () => {
  it('defaults importer and reviewer packages pages to shared tab', () => {
    expect(defaultPackagesPageTab('importer')).toBe('shared');
    expect(defaultPackagesPageTab('country_reviewer')).toBe('shared');
  });

  it('defaults exporter and cooperative packages pages to my tab', () => {
    expect(defaultPackagesPageTab('exporter')).toBe('my');
    expect(defaultPackagesPageTab('cooperative')).toBe('my');
  });
});
