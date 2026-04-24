import { describe, expect, it } from 'vitest';
import { ONBOARDING_CONFIGS, tenantRoleToPersona } from './onboarding-config';

describe('onboarding-config sponsor taxonomy', () => {
  it('maps sponsor role to sponsor persona', () => {
    expect(tenantRoleToPersona('sponsor')).toBe('sponsor');
  });

  it('defines sponsor onboarding with governance-first taxonomy', () => {
    const sponsorConfig = ONBOARDING_CONFIGS.sponsor;
    const stepKeys = sponsorConfig.steps.map((step) => step.key);

    expect(sponsorConfig.displayName).toBe('Network Sponsor');
    expect(stepKeys).toEqual([
      'sp_overview',
      'sp_organisations',
      'sp_programmes',
      'sp_compliance_health',
      'sp_reporting',
    ]);
  });

  it('routes sponsor programmes step to new programmes taxonomy', () => {
    const programmesStep = ONBOARDING_CONFIGS.sponsor.steps.find((step) => step.key === 'sp_programmes');

    expect(programmesStep).toBeDefined();
    expect(programmesStep?.label).toBe('Programmes');
    expect(programmesStep?.ctaHref).toBe('/programmes');
    expect(programmesStep?.targetSelector).toBe('[data-onboarding="nav-programmes"]');
    expect(programmesStep?.actionKey).toBe('campaign_created');
  });
});
