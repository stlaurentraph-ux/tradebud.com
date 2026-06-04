import { describe, expect, it } from 'vitest';
import { hasPackageCreateErrors, validatePackageCreateForm } from './package-create-validation';

describe('validatePackageCreateForm', () => {
  it('requires supplier name and valid year', () => {
    const errors = validatePackageCreateForm({
      supplier_name: '   ',
      season: 'A',
      year: 2019,
      notes: '',
    });
    expect(errors.supplier_name).toBeTruthy();
    expect(errors.year).toBeTruthy();
    expect(hasPackageCreateErrors(errors)).toBe(true);
  });

  it('passes for valid payload', () => {
    const errors = validatePackageCreateForm({
      supplier_name: 'Rwanda Coffee Cooperative',
      season: 'B',
      year: 2026,
      notes: 'Pilot season',
    });
    expect(hasPackageCreateErrors(errors)).toBe(false);
  });
});
