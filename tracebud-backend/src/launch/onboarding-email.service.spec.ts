import { OnboardingEmailService } from './onboarding-email.service';

describe('OnboardingEmailService', () => {
  it('detects complete workspace setup from commercial profile fields', () => {
    const service = new OnboardingEmailService({ query: jest.fn() } as any);
    expect(service.isWorkspaceSetupComplete(null)).toBe(false);
    expect(
      service.isWorkspaceSetupComplete({
        organization_name: 'Acme',
        country: '',
        primary_role: 'exporter',
      }),
    ).toBe(false);
    expect(
      service.isWorkspaceSetupComplete({
        organization_name: 'Acme',
        country: 'CI',
        primary_role: 'exporter',
      }),
    ).toBe(true);
  });
});
