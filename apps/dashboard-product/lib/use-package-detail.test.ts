import { describe, expect, it } from 'vitest';
import { sumPackageVoucherKg } from './use-package-detail';

describe('sumPackageVoucherKg', () => {
  it('sums finite voucher weights and ignores invalid values', () => {
    expect(
      sumPackageVoucherKg([
        { id: 'v1', kg: 100 },
        { id: 'v2', kg: 50.5 },
        { id: 'v3', kg: null },
      ]),
    ).toBe(150.5);
  });
});
