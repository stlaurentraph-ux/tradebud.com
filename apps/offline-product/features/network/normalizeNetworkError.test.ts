import { describe, expect, it } from 'vitest';

import { isLikelyNetworkError, normalizeNetworkError } from './normalizeNetworkError';

describe('normalizeNetworkError', () => {
  it('detects RN fetch transport failures', () => {
    expect(isLikelyNetworkError('TypeError: Network request failed')).toBe(true);
    expect(normalizeNetworkError(new TypeError('Network request failed')).message).toBe(
      'Network request failed',
    );
  });
});
