import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-linking', () => ({
  getInitialURL: vi.fn(async () => null),
}));

vi.mock('@/features/auth/oauthCallbackUrl', () => ({
  isOAuthCallbackUrl: (url: string) =>
    url.includes('auth/callback') || url.includes('code=') || url.includes('access_token='),
}));

import {
  beginOAuthCallbackWait,
  cancelOAuthCallbackWait,
  deliverOAuthCallbackUrl,
  endOAuthCallbackWait,
} from './oauthCallbackBridge';

describe('oauthCallbackBridge', () => {
  beforeEach(() => {
    endOAuthCallbackWait();
    cancelOAuthCallbackWait();
  });

  it('delivers callback URL to an active waiter', async () => {
    const wait = beginOAuthCallbackWait(5000);
    const url = 'tracebudoffline://auth/callback?code=abc';
    expect(deliverOAuthCallbackUrl(url)).toBe(true);
    await expect(wait).resolves.toBe(url);
  });

  it('ignores non-callback URLs', () => {
    beginOAuthCallbackWait(5000);
    expect(deliverOAuthCallbackUrl('tracebudoffline://other')).toBe(false);
    endOAuthCallbackWait();
  });

  it('rejects waiters on cancel', async () => {
    const wait = beginOAuthCallbackWait(5000);
    cancelOAuthCallbackWait('sign_in_oauth_cancelled');
    await expect(wait).rejects.toThrow('sign_in_oauth_cancelled');
  });
});
