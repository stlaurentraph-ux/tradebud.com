import { describe, expect, it } from 'vitest';
import { ONBOARDING_CONFIGS } from '@/lib/onboarding-config';
import {
  getOnboardingPersonaCopy,
  getOnboardingStepCopy,
  localizeOnboardingConfig,
  ONBOARDING_STEP_KEYS,
} from '@/lib/onboarding-step-copy';

describe('onboarding-step-copy', () => {
  it('covers every onboarding config step key', () => {
    const configKeys = new Set(
      Object.values(ONBOARDING_CONFIGS).flatMap((config) => config.steps.map((step) => step.key)),
    );
    expect(new Set(ONBOARDING_STEP_KEYS)).toEqual(configKeys);
  });

  it('returns English fallbacks when t is undefined', () => {
    expect(getOnboardingPersonaCopy('sponsor', 'displayName')).toBe('Network Sponsor');
    expect(getOnboardingStepCopy('sp_programmes', 'label')).toBe('Programmes');
    expect(getOnboardingStepCopy('sp_programmes', 'ctaLabel')).toBe('Open programmes');
  });

  it('localizes onboarding config from base English structure', () => {
    const localized = localizeOnboardingConfig(ONBOARDING_CONFIGS.sponsor);
    expect(localized.displayName).toBe('Network Sponsor');
    expect(localized.steps.find((step) => step.key === 'sp_programmes')?.ctaHref).toBe('/programmes');
  });
});
