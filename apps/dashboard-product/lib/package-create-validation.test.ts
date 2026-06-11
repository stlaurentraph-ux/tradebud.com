import { describe, expect, it } from 'vitest';
import { hasPackageCreateErrors, validatePackageCreateForm } from './package-create-validation';

describe('validatePackageCreateForm', () => {
  it('requires supplier name and valid year', () => {
    const errors = validatePackageCreateForm({
      supplier_name: '   ',
      season: 'A',
      year: 2019,
      notes: '',
      voucherIds: [],
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
      voucherIds: ['voucher-1'],
    });
    expect(hasPackageCreateErrors(errors)).toBe(false);
  });

  it('requires at least one voucher', () => {
    const errors = validatePackageCreateForm({
      supplier_name: 'Rwanda Coffee Cooperative',
      season: 'A',
      year: 2026,
      notes: '',
      voucherIds: [],
    });
    expect(errors.voucherIds).toBeTruthy();
  });
});
