import { describe, expect, it } from 'vitest';

import { normalizeVoucherRows } from './normalizeVoucherRows';

describe('normalizeVoucherRows', () => {
  it('accepts raw arrays', () => {
    expect(normalizeVoucherRows([{ id: 'v1' }])).toEqual([{ id: 'v1' }]);
  });

  it('unwraps { vouchers } payloads', () => {
    expect(normalizeVoucherRows({ vouchers: [{ id: 'v2' }] })).toEqual([{ id: 'v2' }]);
  });
});
