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

  it('redacts JWT-shaped values under an innocuous key name', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc123signature';
    const result = sanitizeLogContext({ note: jwt, plotId: 'p1' });
    expect(result?.note).toBe('[redacted]');
    expect(result?.plotId).toBe('p1');
  });

  it('redacts short Bearer values (length-independent)', () => {
    const result = sanitizeLogContext({ header: 'Bearer abc' });
    expect(result?.header).toBe('[redacted]');
  });

  it('recursively redacts nested response bodies', () => {
    const result = sanitizeLogContext({
      backendResponse: {
        ok: false,
        session: {
          access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig',
          refreshToken: 'r-123',
        },
      },
    });
    expect(result).toEqual({
      backendResponse: {
        ok: false,
        session: {
          access_token: '[redacted]',
          refreshToken: '[redacted]',
        },
      },
    });
  });

  it('redacts nationalId by key', () => {
    expect(sanitizeLogContext({ nationalId: '123456' })).toEqual({ nationalId: '[redacted]' });
  });

  it('redacts email and phone by key', () => {
    expect(
      sanitizeLogContext({
        email: 'farmer@example.com',
        phoneNumber: '+254700000000',
        plotId: 'p1',
      }),
    ).toEqual({ email: '[redacted]', phoneNumber: '[redacted]', plotId: 'p1' });
  });

  it('redacts email-shaped values under an innocuous key', () => {
    const result = sanitizeLogContext({ detail: 'login failed for farmer@example.com' });
    expect(result?.detail).toBe('[redacted]');
  });
});
