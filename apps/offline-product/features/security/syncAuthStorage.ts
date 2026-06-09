import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { deleteSetting, getSetting, setSetting } from '@/features/state/persistence';

const LEGACY_SYNC_AUTH_EMAIL_KEY = 'tracebudSyncAuthEmail';
const LEGACY_SYNC_AUTH_PASSWORD_KEY = 'tracebudSyncAuthPassword';

const SECURE_SYNC_AUTH_EMAIL_KEY = 'tracebud.syncAuth.email';
const SECURE_SYNC_AUTH_PASSWORD_KEY = 'tracebud.syncAuth.password';

type SyncAuthCredentials = {
  email: string;
  password: string;
};

async function supportsSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function loadLegacyCredentials(): Promise<SyncAuthCredentials | null> {
  const email = (await getSetting(LEGACY_SYNC_AUTH_EMAIL_KEY))?.trim() ?? '';
  const password = (await getSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY)) ?? '';
  if (!email || !password) return null;
  return { email, password };
}

async function clearLegacyCredentials(): Promise<void> {
  await deleteSetting(LEGACY_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
  await deleteSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
}

async function saveLegacyCredentials(email: string, password: string): Promise<void> {
  await setSetting(LEGACY_SYNC_AUTH_EMAIL_KEY, email.trim());
  await setSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY, password);
}

export async function loadSyncAuthCredentials(): Promise<SyncAuthCredentials | null> {
  const canUseSecureStore = await supportsSecureStore();

  if (canUseSecureStore) {
    const email = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY))?.trim() ?? '';
    const password = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY)) ?? '';
    if (email && password) {
      return { email, password };
    }
  }

  const legacy = await loadLegacyCredentials();
  if (!legacy) return null;

  if (canUseSecureStore) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY, legacy.email);
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY, legacy.password);
    await clearLegacyCredentials();
  }

  return legacy;
}

export async function saveSyncAuthCredentials(email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  if (await supportsSecureStore()) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY, normalizedEmail);
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY, password);
    await clearLegacyCredentials();
    return;
  }

  await saveLegacyCredentials(normalizedEmail, password);
}

export async function clearSyncAuthCredentials(): Promise<void> {
  if (await supportsSecureStore()) {
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
  }
  await clearLegacyCredentials();
}
