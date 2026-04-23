import { ForbiddenException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { LaunchPublicController } from './launch.public.controller';
import { LaunchService } from './launch.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('LaunchPublicController', () => {
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    createClientMock.mockReset();
    process.env.SUPABASE_URL = 'https://supabase.example.test';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
  });

  it('creates account on create_account stage', async () => {
    const launchService = {
      createAccount: jest.fn().mockResolvedValue({
        userId: 'user_1',
        tenantId: 'tenant_1',
        accessToken: 'token_1',
        refreshToken: 'refresh_1',
      }),
    } as unknown as LaunchService;
    const controller = new LaunchPublicController(launchService);

    const result = await controller.signup(undefined, {
      stage: 'create_account',
      workEmail: 'ops@tracebud.test',
      password: 'test_password',
      fullName: 'Ops User',
    });

    expect(result).toMatchObject({ userId: 'user_1', tenantId: 'tenant_1' });
    expect((launchService.createAccount as jest.Mock)).toHaveBeenCalledWith({
      workEmail: 'ops@tracebud.test',
      password: 'test_password',
      fullName: 'Ops User',
    });
  });

  it('requires auth token for workspace setup stage', async () => {
    const launchService = {
      saveWorkspaceSetup: jest.fn(),
    } as unknown as LaunchService;
    const controller = new LaunchPublicController(launchService);

    await expect(
      controller.signup(undefined, {
        stage: 'workspace_setup',
        organizationName: 'Tracebud Ops',
        country: 'France',
        primaryRole: 'importer',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('saves workspace setup with tenant claim from token', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user_1',
              user_metadata: { tenant_id: 'tenant_1' },
            },
          },
          error: null,
        }),
      },
    } as any);
    const launchService = {
      saveWorkspaceSetup: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }),
    } as unknown as LaunchService;
    const controller = new LaunchPublicController(launchService);

    const result = await controller.signup('Bearer test_token', {
      stage: 'workspace_setup',
      organizationName: 'Tracebud Ops',
      country: 'France',
      primaryRole: 'importer',
    });

    expect(result).toMatchObject({ ok: true });
    expect((launchService.saveWorkspaceSetup as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_1',
        organizationName: 'Tracebud Ops',
        country: 'France',
        primaryRole: 'importer',
        actorUserId: 'user_1',
      }),
    );
  });
});
