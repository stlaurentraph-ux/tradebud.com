import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockExpoConfig: Record<string, unknown> = {};
let mockPlatformOs = 'ios';

vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOs;
    },
  },
}));

import { isAndroidGoogleMapsConfigured, shouldBlockNativeMapView } from '@/features/mapping/androidMapsConfig';

describe('isAndroidGoogleMapsConfigured', () => {
  beforeEach(() => {
    mockExpoConfig = {};
    mockPlatformOs = 'ios';
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

describe('shouldBlockNativeMapView', () => {
  beforeEach(() => {
    mockExpoConfig = {};
    mockPlatformOs = 'ios';
  });

  it('returns false on iOS even without maps key', () => {
    mockPlatformOs = 'ios';
    mockExpoConfig = { extra: { googleMapsConfigured: false } };
    expect(shouldBlockNativeMapView()).toBe(false);
  });

  it('returns true on Android when maps key is missing', () => {
    mockPlatformOs = 'android';
    mockExpoConfig = { extra: { googleMapsConfigured: false } };
    expect(shouldBlockNativeMapView()).toBe(true);
  });

  it('returns false on Android when maps key is configured', () => {
    mockPlatformOs = 'android';
    mockExpoConfig = { extra: { googleMapsConfigured: true } };
    expect(shouldBlockNativeMapView()).toBe(false);
  });
});
