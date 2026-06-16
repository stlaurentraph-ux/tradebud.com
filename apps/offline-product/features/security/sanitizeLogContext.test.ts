import { describe, expect, it } from 'vitest';

import { sanitizeLogContext } from './sanitizeLogContext';

describe('sanitizeLogContext', () => {
  it('redacts sensitive key names', () => {
    const result = sanitizeLogContext({
      plotId: 'p1',
      password: 'secret',
      refreshToken: 'abc',
    });
    expect(result).toEqual({
      plotId: 'p1',
      password: '[redacted]',
      refreshToken: '[redacted]',
    });
  });

  it('redacts bearer tokens in string values', () => {
    const result = sanitizeLogContext({
      header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
    });
    expect(result?.header).toBe('[redacted]');
  });

  it('passes through non-sensitive fields', () => {
    const result = sanitizeLogContext({ phase: 'sync', plotId: 'abc' });
    expect(result).toEqual({ phase: 'sync', plotId: 'abc' });
  });
});
