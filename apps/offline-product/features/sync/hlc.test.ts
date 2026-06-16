import { describe, expect, it } from 'vitest';

import {
  compareHlcTimestamp,
  generateHlcTimestamp,
  parseHlcTimestamp,
} from './hlc';

describe('hlc timestamps', () => {
  it('generates monotonic logical counters for the same physical ms', () => {
    const first = generateHlcTimestamp(1_700_000_000_000);
    const second = generateHlcTimestamp(1_700_000_000_000, first);
    expect(compareHlcTimestamp(first, second)).toBeLessThan(0);
  });

  it('orders newer physical time ahead of older logical extensions', () => {
    const older = generateHlcTimestamp(1_700_000_000_000);
    const newer = generateHlcTimestamp(1_700_000_000_500, older);
    expect(compareHlcTimestamp(older, newer)).toBeLessThan(0);
  });

  it('parses valid HLC strings', () => {
    const parsed = parseHlcTimestamp('1700000000000:000001');
    expect(parsed).toEqual({ physicalMs: 1_700_000_000_000, logical: 1 });
  });
});
