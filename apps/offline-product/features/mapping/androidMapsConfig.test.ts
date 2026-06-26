import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockExpoConfig: Record<string, unknown> = {};

vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

import { isAndroidGoogleMapsConfigured } from '@/features/mapping/androidMapsConfig';

describe('isAndroidGoogleMapsConfigured', () => {
  beforeEach(() => {
    mockExpoConfig = {};
  });

  it('returns true when extra.googleMapsConfigured is true', () => {
    mockExpoConfig = { extra: { googleMapsConfigured: true } };
    expect(isAndroidGoogleMapsConfigured()).toBe(true);
  });

  it('returns true when android.config.googleMaps.apiKey is set', () => {
    mockExpoConfig = {
      extra: {},
      android: { config: { googleMaps: { apiKey: 'test-key' } } },
    };
    expect(isAndroidGoogleMapsConfigured()).toBe(true);
  });

  it('returns false when no maps key is configured', () => {
    mockExpoConfig = {
      extra: { googleMapsConfigured: false },
      android: { config: {} },
    };
    expect(isAndroidGoogleMapsConfigured()).toBe(false);
  });
});
