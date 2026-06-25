import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { deleteSetting, getSetting, setSetting } from '@/features/state/persistence';

const LEGACY_SYNC_AUTH_EMAIL_KEY = 'tracebudSyncAuthEmail';
const LEGACY_SYNC_AUTH_PASSWORD_KEY = 'tracebudSyncAuthPassword';

const SECURE_SYNC_AUTH_EMAIL_KEY = 'tracebud.syncAuth.email';
const SECURE_SYNC_AUTH_PASSWORD_KEY = 'tracebud.syncAuth.password';
const SECURE_SYNC_AUTH_REFRESH_KEY = 'tracebud.syncAuth.refreshToken';
const SECURE_SYNC_AUTH_ACCESS_KEY = 'tracebud.syncAuth.accessToken';
const SECURE_SYNC_AUTH_EXPIRES_AT_KEY = 'tracebud.syncAuth.expiresAt';
const SECURE_SYNC_AUTH_PHONE_KEY = 'tracebud.syncAuth.phone';
const SECURE_SYNC_AUTH_METHOD_KEY = 'tracebud.syncAuth.method';
const SYNC_AUTH_SIGNED_OUT_KEY = 'tracebud.syncAuth.signedOut';

export type PasswordSyncAuthCredentials = {
  method: 'password';
  email: string;
  password: string;
};

export type OAuthSyncAuthCredentials = {
  method: 'oauth';
  email: string;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number | null;
};

export type PhoneOtpSyncAuthCredentials = {
  method: 'phone_otp';
  phone: string;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number | null;
};

export type SyncAuthCredentials =
  | PasswordSyncAuthCredentials
  | OAuthSyncAuthCredentials
  | PhoneOtpSyncAuthCredentials;

async function supportsSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function loadLegacyCredentials(): Promise<PasswordSyncAuthCredentials | null> {
  const email = (await getSetting(LEGACY_SYNC_AUTH_EMAIL_KEY))?.trim() ?? '';
  const password = (await getSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY)) ?? '';
  if (!email || !password) return null;
  return { method: 'password', email, password };
}

async function clearLegacyCredentials(): Promise<void> {
  await deleteSetting(LEGACY_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
  await deleteSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
}

async function saveLegacyCredentials(email: string, password: string): Promise<void> {
  await setSetting(LEGACY_SYNC_AUTH_EMAIL_KEY, email.trim());
  await setSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY, password);
}

async function markSyncAuthDismissedOnDevice(): Promise<void> {
  if (await supportsSecureStore()) {
    await SecureStore.setItemAsync(SYNC_AUTH_SIGNED_OUT_KEY, '1');
    return;
  }
  await setSetting(SYNC_AUTH_SIGNED_OUT_KEY, '1');
}

/** Persist the device sign-out latch before async credential wipe (blocks silent re-hydrate). */
export async function persistSyncAuthSignOutLatch(): Promise<void> {
  await markSyncAuthDismissedOnDevice();
}

async function clearSyncAuthDismissedOnDevice(): Promise<void> {
  if (await supportsSecureStore()) {
    await SecureStore.deleteItemAsync(SYNC_AUTH_SIGNED_OUT_KEY).catch(() => undefined);
    return;
  }
  await deleteSetting(SYNC_AUTH_SIGNED_OUT_KEY).catch(() => undefined);
}

/** Clears the device sign-out latch so the next sign-in can persist credentials again. */
export async function activateSyncAuthOnSignIn(): Promise<void> {
  await clearSyncAuthDismissedOnDevice();
}

/** True when the farmer explicitly signed out on this device. Blocks silent re-hydrate. */
export async function isSyncAuthDismissedOnDevice(): Promise<boolean> {
  if (await supportsSecureStore()) {
    return (await SecureStore.getItemAsync(SYNC_AUTH_SIGNED_OUT_KEY)) === '1';
  }
  return (await getSetting(SYNC_AUTH_SIGNED_OUT_KEY)) === '1';
}

export async function loadSyncAuthCredentials(): Promise<SyncAuthCredentials | null> {
  if (await isSyncAuthDismissedOnDevice()) {
    return null;
  }

  const canUseSecureStore = await supportsSecureStore();

  if (canUseSecureStore) {
    const method = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_METHOD_KEY))?.trim() ?? '';
    const email = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY))?.trim() ?? '';
    if (method === 'oauth') {
      const refreshToken = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY)) ?? '';
      const accessToken = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY)) ?? '';
      const expiresRaw = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY)) ?? '';
      const expiresAt = expiresRaw.trim() ? Number(expiresRaw) : null;
      if (email && refreshToken) {
        return {
          method: 'oauth',
          email,
          refreshToken,
          accessToken: accessToken.trim() || undefined,
          expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
        };
      }
    } else if (method === 'phone_otp') {
      const refreshToken = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY))?.trim() ?? '';
      const phone = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_PHONE_KEY))?.trim() ?? '';
      if (phone && refreshToken) {
        const accessToken = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY))?.trim();
        const expiresRaw = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY))?.trim();
        const expiresAt = expiresRaw ? Number(expiresRaw) : null;
        return {
          method: 'phone_otp',
          phone,
          refreshToken,
          ...(accessToken ? { accessToken } : {}),
          ...(expiresAt != null && Number.isFinite(expiresAt) ? { expiresAt } : {}),
        };
      }
    } else {
      const password = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY)) ?? '';
      if (email && password) {
        return { method: 'password', email, password };
      }
    }
  }

  const legacy = await loadLegacyCredentials();
  if (!legacy) return null;

  if (canUseSecureStore) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_METHOD_KEY, 'password');
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
  if (await isSyncAuthDismissedOnDevice()) {
    return;
  }

  if (await supportsSecureStore()) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_METHOD_KEY, 'password');
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY, normalizedEmail);
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY, password);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY).catch(() => undefined);
    await clearLegacyCredentials();
    return;
  }

  // Native devices must use SecureStore (Keychain/Keystore). Never fall back to plaintext
  // SQLite, which is recoverable via device backup / rooted access. SecureStore is effectively
  // always available on native, so this guard simply removes the insecure fallback path and
  // matches the OAuth/phone OTP credential helpers below.
  if (Platform.OS !== 'web') {
    throw new Error('Password sync credentials require secure storage on this device.');
  }

  await saveLegacyCredentials(normalizedEmail, password);
}

export async function saveOAuthSyncAuthCredentials(
  email: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: number | null,
): Promise<void> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !refreshToken) {
    throw new Error('Email and refresh token are required.');
  }
  if (await isSyncAuthDismissedOnDevice()) {
    return;
  }

  if (await supportsSecureStore()) {
    const existingMethod = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_METHOD_KEY))?.trim() ?? '';
    if (existingMethod === 'password') {
      const existingPassword = (await SecureStore.getItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY)) ?? '';
      if (existingPassword) {
        return;
      }
    }
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_METHOD_KEY, 'oauth');
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY, normalizedEmail);
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY, refreshToken);
    if (accessToken?.trim()) {
      await SecureStore.setItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY, accessToken.trim());
      if (expiresAt != null && Number.isFinite(expiresAt)) {
        await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY, String(Math.floor(expiresAt)));
      }
    }
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
    await clearLegacyCredentials();
    if (await isSyncAuthDismissedOnDevice()) {
      await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_METHOD_KEY).catch(() => undefined);
      await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
      await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY).catch(() => undefined);
      await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY).catch(() => undefined);
      await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY).catch(() => undefined);
    }
    return;
  }

  throw new Error('OAuth sync credentials require secure storage on this device.');
}

export async function savePhoneOtpSyncAuthCredentials(
  phone: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: number | null,
): Promise<void> {
  const normalizedPhone = phone.trim();
  if (!normalizedPhone || !refreshToken) {
    throw new Error('Phone and refresh token are required.');
  }
  if (await isSyncAuthDismissedOnDevice()) {
    return;
  }

  if (await supportsSecureStore()) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_METHOD_KEY, 'phone_otp');
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_PHONE_KEY, normalizedPhone);
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY, refreshToken);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
    if (accessToken?.trim()) {
      await SecureStore.setItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY, accessToken.trim());
      if (expiresAt != null && Number.isFinite(expiresAt)) {
        await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY, String(Math.floor(expiresAt)));
      }
    }
    await clearLegacyCredentials();
    return;
  }

  throw new Error('Phone OTP sync credentials require secure storage on this device.');
}

export async function saveOAuthAccessTokenCache(
  accessToken: string,
  expiresAt?: number | null,
): Promise<void> {
  if (!(await supportsSecureStore()) || (await isSyncAuthDismissedOnDevice())) {
    return;
  }
  const token = accessToken.trim();
  if (!token) return;
  await SecureStore.setItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY, token);
  if (expiresAt != null && Number.isFinite(expiresAt)) {
    await SecureStore.setItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY, String(Math.floor(expiresAt)));
  }
}

export async function clearSyncAuthCredentials(): Promise<void> {
  await markSyncAuthDismissedOnDevice();
  if (await supportsSecureStore()) {
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_METHOD_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EMAIL_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_PHONE_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_PASSWORD_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_REFRESH_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_ACCESS_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(SECURE_SYNC_AUTH_EXPIRES_AT_KEY).catch(() => undefined);
  }
  await clearLegacyCredentials();
}
