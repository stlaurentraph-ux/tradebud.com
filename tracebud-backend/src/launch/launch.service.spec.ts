import { ForbiddenException } from '@nestjs/common';
import { LaunchService } from './launch.service';
import { OnboardingEmailService } from './onboarding-email.service';

function createLaunchService(pool: { query: jest.Mock }) {
  const onboardingEmailService = {
    recordSignupContact: jest.fn().mockResolvedValue(undefined),
    sendWelcomeAfterWorkspaceSetup: jest.fn().mockResolvedValue(false),
    remindIncompleteSignups: jest.fn().mockResolvedValue({ scanned: 0, sent: 0, skipped: 0, failures: [] }),
  } as unknown as OnboardingEmailService;
  const inboxService = {
    backfillInboxForSignupContact: jest.fn().mockResolvedValue({ created: 0, skippedUnresolved: 0, skippedSelfTenant: 0 }),
  };
  return new LaunchService(pool as any, onboardingEmailService, inboxService as any);
}

describe('LaunchService', () => {
  it('allows feature access when trial is active and entitlement is trial', async () => {
    const service = createLaunchService({ query: jest.fn() });
    jest
      .spyOn(service, 'evaluateLifecycleState')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        lifecycle_status: 'trial_active',
        trial_started_at: null,
        trial_expires_at: null,
        paid_activated_at: null,
        updated_at: new Date().toISOString(),
      });
    jest.spyOn(service as any, 'ensureFeatureEntitlements').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'getFeatureEntitlement')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        feature_key: 'dashboard_compliance',
        entitlement_status: 'trial',
        effective_from: new Date().toISOString(),
        effective_to: null,
        updated_at: new Date().toISOString(),
      });

    await expect(service.requireFeatureAccess('tenant_1', 'dashboard_compliance')).resolves.toBeUndefined();
  });

  it('allows feature access when paid is active and entitlement is enabled', async () => {
    const service = createLaunchService({ query: jest.fn() });
    jest
      .spyOn(service, 'evaluateLifecycleState')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        lifecycle_status: 'paid_active',
        trial_started_at: null,
        trial_expires_at: null,
        paid_activated_at: null,
        updated_at: new Date().toISOString(),
      });
    jest.spyOn(service as any, 'ensureFeatureEntitlements').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'getFeatureEntitlement')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        feature_key: 'dashboard_exports',
        entitlement_status: 'enabled',
        effective_from: new Date().toISOString(),
        effective_to: null,
        updated_at: new Date().toISOString(),
      });

    await expect(service.requireFeatureAccess('tenant_1', 'dashboard_exports')).resolves.toBeUndefined();
  });

  it('denies feature access when trial has expired', async () => {
    const service = createLaunchService({ query: jest.fn() });
    jest
      .spyOn(service, 'evaluateLifecycleState')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        lifecycle_status: 'trial_expired',
        trial_started_at: null,
        trial_expires_at: null,
        paid_activated_at: null,
        updated_at: new Date().toISOString(),
      });

    await expect(service.requireFeatureAccess('tenant_1', 'dashboard_campaigns')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies feature access when workspace is suspended', async () => {
    const service = createLaunchService({ query: jest.fn() });
    jest
      .spyOn(service, 'evaluateLifecycleState')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        lifecycle_status: 'suspended',
        trial_started_at: null,
        trial_expires_at: null,
        paid_activated_at: null,
        updated_at: new Date().toISOString(),
      });

    await expect(service.requireFeatureAccess('tenant_1', 'dashboard_campaigns')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies feature access when entitlement is explicitly disabled', async () => {
    const service = createLaunchService({ query: jest.fn() });
    jest
      .spyOn(service, 'evaluateLifecycleState')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        lifecycle_status: 'paid_active',
        trial_started_at: null,
        trial_expires_at: null,
        paid_activated_at: null,
        updated_at: new Date().toISOString(),
      });
    jest.spyOn(service as any, 'ensureFeatureEntitlements').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'getFeatureEntitlement')
      .mockResolvedValue({
        tenant_id: 'tenant_1',
        feature_key: 'dashboard_reporting',
        entitlement_status: 'disabled',
        effective_from: new Date().toISOString(),
        effective_to: null,
        updated_at: new Date().toISOString(),
      });

    await expect(service.requireFeatureAccess('tenant_1', 'dashboard_reporting')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
