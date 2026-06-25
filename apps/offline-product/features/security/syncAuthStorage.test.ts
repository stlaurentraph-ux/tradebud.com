import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'ios' as string },
  secureAvailable: { value: true },
  secureStore: {} as Record<string, string>,
  settings: {} as Record<string, string>,
}));

vi.mock('react-native', () => ({ Platform: mocks.platform }));

vi.mock('expo-secure-store', () => ({
  isAvailableAsync: vi.fn(async () => mocks.secureAvailable.value),
  getItemAsync: vi.fn(async (k: string) => mocks.secureStore[k] ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => {
    mocks.secureStore[k] = v;
  }),
  deleteItemAsync: vi.fn(async (k: string) => {
    delete mocks.secureStore[k];
  }),
}));

vi.mock('@/features/state/persistence', () => ({
  getSetting: vi.fn(async (k: string) => mocks.settings[k] ?? null),
  setSetting: vi.fn(async (k: string, v: string) => {
    mocks.settings[k] = v;
  }),
  deleteSetting: vi.fn(async (k: string) => {
    delete mocks.settings[k];
  }),
}));

import { saveSyncAuthCredentials } from './syncAuthStorage';

const LEGACY_PASSWORD_KEY = 'tracebudSyncAuthPassword';
const SECURE_PASSWORD_KEY = 'tracebud.syncAuth.password';

describe('saveSyncAuthCredentials password storage', () => {
  beforeEach(() => {
    mocks.platform.OS = 'ios';
    mocks.secureAvailable.value = true;
    for (const k of Object.keys(mocks.secureStore)) delete mocks.secureStore[k];
    for (const k of Object.keys(mocks.settings)) delete mocks.settings[k];
  });

  it('stores password in SecureStore (not plaintext SQLite) when available', async () => {
    await saveSyncAuthCredentials('farmer@example.com', 'hunter2');
    expect(mocks.secureStore[SECURE_PASSWORD_KEY]).toBe('hunter2');
    expect(mocks.settings[LEGACY_PASSWORD_KEY]).toBeUndefined();
  });

  it('refuses to persist a plaintext password in SQLite on native when SecureStore is unavailable', async () => {
    mocks.secureAvailable.value = false;
    await expect(saveSyncAuthCredentials('farmer@example.com', 'hunter2')).rejects.toThrow(
      /secure storage/i,
    );
    // Critical: the password must NOT have leaked into the SQLite settings table.
    expect(mocks.settings[LEGACY_PASSWORD_KEY]).toBeUndefined();
  });

  it('still allows the legacy fallback on web (no SecureStore, no on-disk SQLite file)', async () => {
    mocks.platform.OS = 'web';
    mocks.secureAvailable.value = false;
    await saveSyncAuthCredentials('farmer@example.com', 'hunter2');
    expect(mocks.settings[LEGACY_PASSWORD_KEY]).toBe('hunter2');
  });
});
