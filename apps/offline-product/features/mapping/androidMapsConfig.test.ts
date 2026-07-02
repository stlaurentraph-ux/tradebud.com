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
  TurboModuleRegistry: {
    get: (name: string) => (name === 'RNMapsAirModule' ? mockRnMapsModule : null),
  },
}));

let mockRnMapsModule: Record<string, unknown> | null = { getConstants: () => ({}) };

import {
  isAndroidGoogleMapsConfigured,
  isRnMapsNativeModuleAvailable,
  shouldBlockNativeMapView,
} from '@/features/mapping/androidMapsConfig';

describe('isAndroidGoogleMapsConfigured', () => {
  beforeEach(() => {
    mockExpoConfig = {};
    mockPlatformOs = 'ios';
    mockRnMapsModule = { getConstants: () => ({}) };
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
    mockRnMapsModule = { getConstants: () => ({}) };
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

  it('returns false on Android when maps key is configured and native module is present', () => {
    mockPlatformOs = 'android';
    mockExpoConfig = { extra: { googleMapsConfigured: true } };
    mockRnMapsModule = { getConstants: () => ({}) };
    expect(shouldBlockNativeMapView()).toBe(false);
  });

  it('returns true on Android when RNMapsAirModule is missing from the binary', () => {
    mockPlatformOs = 'android';
    mockExpoConfig = { extra: { googleMapsConfigured: true } };
    mockRnMapsModule = null;
    expect(isRnMapsNativeModuleAvailable()).toBe(false);
    expect(shouldBlockNativeMapView()).toBe(true);
  });
});
