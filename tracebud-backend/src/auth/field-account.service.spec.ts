import { BadRequestException } from '@nestjs/common';
import { FieldAccountService } from './field-account.service';

const getUserById = jest.fn();
const updateUserById = jest.fn();
const signInWithPassword = jest.fn();
const poolQuery = jest.fn().mockResolvedValue({ rowCount: 1 });

jest.mock('./supabase-server.client', () => ({
  createSupabaseServerClient: jest.fn((url: string, key: string) => {
    if (key === 'anon-key') {
      return {
        auth: {
          signInWithPassword,
        },
      };
    }
    return {
      auth: {
        admin: {
          getUserById,
          updateUserById,
        },
      },
    };
  }),
}));

describe('FieldAccountService', () => {
  const service = new FieldAccountService({ query: poolQuery } as never);
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      SUPABASE_ANON_KEY: 'anon-key',
    };
    getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'user-id',
          email: 'hector@tracebud.com',
          identities: [{ provider: 'google' }],
        },
      },
      error: null,
    });
    updateUserById.mockResolvedValue({ data: { user: {} }, error: null });
    signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    getUserById
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-id',
            email: 'hector@tracebud.com',
            identities: [{ provider: 'google' }],
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-id',
            email: 'hector@tracebud.com',
            identities: [{ provider: 'google' }, { provider: 'email' }],
          },
        },
        error: null,
      });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects passwords shorter than the minimum length', async () => {
    await expect(service.setPasswordForAuthUser('user-id', 'short')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('sets password, clears sso-only flag, and verifies email sign-in', async () => {
    await service.setPasswordForAuthUser('user-id', 'longpassword');

    expect(updateUserById).toHaveBeenCalledWith('user-id', {
      password: 'longpassword',
      email: 'hector@tracebud.com',
      email_confirm: true,
    });
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining('is_sso_user = false'),
      ['user-id'],
    );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'hector@tracebud.com',
      password: 'longpassword',
    });
  });

  it('creates email identity for oauth-only users that already have a password', async () => {
    getUserById.mockReset();
    getUserById
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-id',
            email: 'hector@tracebud.com',
            identities: [{ provider: 'google' }],
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-id',
            email: 'hector@tracebud.com',
            identities: [{ provider: 'google' }, { provider: 'email' }],
          },
        },
        error: null,
      });

    await service.ensureEmailIdentityForAuthUser('user-id');

    expect(updateUserById).toHaveBeenCalledWith('user-id', {
      email: 'hector@tracebud.com',
      email_confirm: true,
    });
    expect(poolQuery).toHaveBeenCalled();
  });

  it('maps Supabase admin errors to bad request', async () => {
    updateUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password is too weak' },
    });

    await expect(service.setPasswordForAuthUser('user-id', 'longpassword')).rejects.toThrow(
      'Password is too weak',
    );
  });
});
