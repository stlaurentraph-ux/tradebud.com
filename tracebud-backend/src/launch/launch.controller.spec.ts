import { ForbiddenException } from '@nestjs/common';
import { LaunchController } from './launch.controller';
import { LaunchService } from './launch.service';

describe('LaunchController', () => {
  const makeReq = (role: string, tenantId = 'tenant_1') => ({
    user: {
      id: 'user_1',
      app_metadata: { role, tenant_id: tenantId },
    },
  });

  it('denies entitlement listing for non-admin roles', async () => {
    const launchService = {
      listFeatureEntitlements: jest.fn(),
    } as unknown as LaunchService;
    const controller = new LaunchController(launchService);

    await expect(controller.listEntitlements(makeReq('exporter'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows entitlement listing for admin roles', async () => {
    const launchService = {
      listFeatureEntitlements: jest.fn().mockResolvedValue([]),
    } as unknown as LaunchService;
    const controller = new LaunchController(launchService);

    await expect(controller.listEntitlements(makeReq('admin'))).resolves.toEqual([]);
    expect(launchService.listFeatureEntitlements).toHaveBeenCalledWith('tenant_1');
  });

  it('denies entitlement mutation for non-admin roles', async () => {
    const launchService = {
      setFeatureEntitlement: jest.fn(),
    } as unknown as LaunchService;
    const controller = new LaunchController(launchService);

    await expect(
      controller.setEntitlement(makeReq('agent'), {
        feature: 'dashboard_exports',
        entitlementStatus: 'enabled',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates feature and entitlement status on mutation', async () => {
    const launchService = {
      setFeatureEntitlement: jest.fn(),
    } as unknown as LaunchService;
    const controller = new LaunchController(launchService);

    await expect(
      controller.setEntitlement(makeReq('admin'), {
        feature: undefined,
        entitlementStatus: 'enabled',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      controller.setEntitlement(makeReq('admin'), {
        feature: 'dashboard_exports',
        entitlementStatus: undefined,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows entitlement mutation for admin roles with valid payload', async () => {
    const launchService = {
      setFeatureEntitlement: jest.fn().mockResolvedValue({
        tenant_id: 'tenant_1',
        feature_key: 'dashboard_exports',
        entitlement_status: 'enabled',
      }),
    } as unknown as LaunchService;
    const controller = new LaunchController(launchService);

    await expect(
      controller.setEntitlement(makeReq('admin'), {
        feature: 'dashboard_exports',
        entitlementStatus: 'enabled',
      }),
    ).resolves.toMatchObject({
      feature_key: 'dashboard_exports',
      entitlement_status: 'enabled',
    });

    expect(launchService.setFeatureEntitlement).toHaveBeenCalledWith(
      'tenant_1',
      'dashboard_exports',
      'enabled',
      'user_1',
    );
  });
});
