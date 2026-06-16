import { describe, expect, it } from 'vitest';
import { decodeJwtExpiryMs, isSessionTokenValid } from './auth-cookie';

function makeToken(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.signature`;
}

describe('auth-cookie', () => {
  it('detects expired session tokens', () => {
    const expired = makeToken(Math.floor(Date.now() / 1000) - 60);
    expect(isSessionTokenValid(expired)).toBe(false);
  });

  it('accepts non-expired session tokens', () => {
    const valid = makeToken(Math.floor(Date.now() / 1000) + 3600);
    expect(isSessionTokenValid(valid)).toBe(true);
    expect(decodeJwtExpiryMs(valid)).not.toBeNull();
  });
});
