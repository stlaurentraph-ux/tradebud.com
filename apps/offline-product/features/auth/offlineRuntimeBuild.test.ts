import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    executionEnvironment: 'bare',
    appOwnership: 'user',
  },
}));

vi.mock('expo-updates', () => ({
  isEmbeddedLaunch: false,
  isEnabled: false,
  channel: null,
}));

import {
  describeOfflineRuntimeBuild,
  getOfflineRuntimeBuildDisplay,
  offlineRuntimeUsesEmbeddedBundle,
} from '@/features/auth/offlineRuntimeBuild';

describe('offlineRuntimeBuild', () => {
  it('labels bare dev-client runtime', () => {
    expect(describeOfflineRuntimeBuild()).toContain('exec:bare');
    expect(describeOfflineRuntimeBuild()).toContain('ownership:user');
  });

  it('detects embedded bundle launches', () => {
    expect(offlineRuntimeUsesEmbeddedBundle()).toBe(true);
  });

  it('returns user-facing build display', () => {
    const display = getOfflineRuntimeBuildDisplay();
    expect(display.headlineKey).toBe('settings_build_kind_release');
    expect(display.detail).toContain('bundle:release');
    expect(display.showOauthRebuildHint).toBe(true);
  });
});
