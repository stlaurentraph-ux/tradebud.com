import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessTokenFromSupabase: vi.fn(),
  getAuthCredentials: vi.fn(),
  getSyncAuthMethod: vi.fn(),
  getTracebudApiBaseUrl: vi.fn(),
  saveAndApplyPasswordSession: vi.fn(),
  saveLinkedPasswordForOAuthUser: vi.fn(),
  signInWithPassword: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getAccessTokenFromSupabase: mocks.getAccessTokenFromSupabase,
  getAuthCredentials: mocks.getAuthCredentials,
  getSyncAuthMethod: mocks.getSyncAuthMethod,
  getTracebudApiBaseUrl: mocks.getTracebudApiBaseUrl,
  getSupabaseAuthClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
    },
  })),
  saveAndApplyPasswordSession: mocks.saveAndApplyPasswordSession,
}));

vi.mock('@/features/security/syncAuthStorage', () => ({
  hasLinkedPasswordForOAuthUser: vi.fn(),
  loadSyncAuthCredentials: vi.fn(),
  saveLinkedPasswordForOAuthUser: mocks.saveLinkedPasswordForOAuthUser,
}));

import { setAccountPasswordForCurrentUser } from './accountPassword';

describe('setAccountPasswordForCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthCredentials.mockReturnValue({ email: 'hector@tracebud.com', password: '' });
    mocks.getAccessTokenFromSupabase.mockResolvedValue('access-token');
    mocks.getTracebudApiBaseUrl.mockReturnValue('https://api.tracebud.com/api');
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('saves linked password for oauth users after backend update', async () => {
    mocks.getSyncAuthMethod.mockReturnValue('oauth');

    await expect(setAccountPasswordForCurrentUser('longpassword')).resolves.toEqual({ ok: true });

    expect(mocks.fetch).toHaveBeenCalledWith(
      'https://api.tracebud.com/api/v1/me/account-password',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
        body: JSON.stringify({ password: 'longpassword' }),
      }),
    );
    expect(mocks.saveLinkedPasswordForOAuthUser).toHaveBeenCalledWith(
      'hector@tracebud.com',
      'longpassword',
    );
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it('refreshes password session for password-auth users', async () => {
    mocks.getSyncAuthMethod.mockReturnValue('password');
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'token', expires_at: 999 } },
      error: null,
    });

    await expect(setAccountPasswordForCurrentUser('longpassword')).resolves.toEqual({ ok: true });

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'hector@tracebud.com',
      password: 'longpassword',
    });
    expect(mocks.saveAndApplyPasswordSession).toHaveBeenCalled();
    expect(mocks.saveLinkedPasswordForOAuthUser).not.toHaveBeenCalled();
  });

  it('maps backend password errors to stable codes', async () => {
    mocks.getSyncAuthMethod.mockReturnValue('oauth');
    mocks.fetch.mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Password is too weak' }),
    });

    await expect(setAccountPasswordForCurrentUser('longpassword')).resolves.toEqual({
      ok: false,
      message: 'settings_password_weak',
    });
  });
});
