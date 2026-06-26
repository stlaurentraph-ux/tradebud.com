import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = new Map<string, string>();
const settings = new Map<string, string>();
let secureStoreAvailable = true;
let platformOs: 'ios' | 'android' | 'web' = 'ios';

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platformOs;
    },
  },
}));

vi.mock('expo-secure-store', () => ({
  isAvailableAsync: vi.fn(async () => secureStoreAvailable),
  getItemAsync: vi.fn(async (key: string) => secureStore.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureStore.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    secureStore.delete(key);
  }),
}));

vi.mock('@/features/state/persistence', () => ({
  getSetting: vi.fn(async (key: string) => settings.get(key) ?? null),
  setSetting: vi.fn(async (key: string, value: string) => {
    settings.set(key, value);
  }),
  deleteSetting: vi.fn(async (key: string) => {
    settings.delete(key);
  }),
}));

import {
  loadSyncAuthCredentials,
  migrateOrClearLegacySyncAuthOnBoot,
  saveSyncAuthCredentials,
} from '@/features/security/syncAuthStorage';

describe('syncAuthStorage legacy password hygiene', () => {
  beforeEach(() => {
    secureStore.clear();
    settings.clear();
    secureStoreAvailable = true;
    platformOs = 'ios';
  });

  it('migrates legacy plaintext credentials into SecureStore on boot', async () => {
    settings.set('tracebudSyncAuthEmail', 'farmer@example.com');
    settings.set('tracebudSyncAuthPassword', 'secret');

    await migrateOrClearLegacySyncAuthOnBoot();

    expect(settings.has('tracebudSyncAuthEmail')).toBe(false);
    expect(settings.has('tracebudSyncAuthPassword')).toBe(false);
    expect(secureStore.get('tracebud.syncAuth.email')).toBe('farmer@example.com');
    expect(secureStore.get('tracebud.syncAuth.password')).toBe('secret');
  });

  it('purges legacy credentials on web instead of rehydrating plaintext passwords', async () => {
    platformOs = 'web';
    secureStoreAvailable = false;
    settings.set('tracebudSyncAuthEmail', 'farmer@example.com');
    settings.set('tracebudSyncAuthPassword', 'secret');

    await migrateOrClearLegacySyncAuthOnBoot();
    const credentials = await loadSyncAuthCredentials();

    expect(settings.has('tracebudSyncAuthPassword')).toBe(false);
    expect(credentials).toBeNull();
  });

  it('refuses to save password credentials when secure storage is unavailable', async () => {
    platformOs = 'web';
    secureStoreAvailable = false;

    await expect(saveSyncAuthCredentials('farmer@example.com', 'secret')).rejects.toThrow(
      'Password sync credentials require secure storage on this device.',
    );
    expect(settings.has('tracebudSyncAuthPassword')).toBe(false);
  });
});
