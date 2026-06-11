/**
 * Tracebud field-app sync authentication (password + OAuth refresh tokens).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  clearSyncAuthCredentials,
  loadSyncAuthCredentials,
  saveOAuthSyncAuthCredentials,
  saveSyncAuthCredentials,
  type SyncAuthCredentials,
} from '@/features/security/syncAuthStorage';
import { getTracebudApiBaseUrl as getRuntimeGuardedApiBaseUrl } from './runtimeGuards';

const ALLOW_TEST_AUTH = process.env.EXPO_PUBLIC_ALLOW_TEST_AUTH === '1';
const ALLOW_LOCALHOST_API = process.env.EXPO_PUBLIC_ALLOW_LOCALHOST_API === '1';
const IS_DEV_RUNTIME = typeof __DEV__ !== 'undefined' && __DEV__;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_EMAIL = process.env.EXPO_PUBLIC_TRACEBUD_TEST_EMAIL ?? '';
const DEFAULT_PASSWORD = process.env.EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD ?? '';

let supabaseClient: SupabaseClient | null = null;
let cachedAccessToken: string | null = null;
let cachedExpiresAt: number | null = null;

let currentAuthMethod: SyncAuthCredentials['method'] | null = ALLOW_TEST_AUTH ? 'password' : null;
let currentEmail = ALLOW_TEST_AUTH ? DEFAULT_EMAIL : '';
let currentPassword = ALLOW_TEST_AUTH ? DEFAULT_PASSWORD : '';
let currentRefreshToken = '';

function isLocalhostApi(url: string): boolean {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or ANON key not configured');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

function applySessionToCache(session: { access_token: string; expires_at?: number | null }) {
  cachedAccessToken = session.access_token;
  cachedExpiresAt = session.expires_at ?? null;
}

function clearSessionCache() {
  cachedAccessToken = null;
  cachedExpiresAt = null;
}

function applyPasswordAuth(email: string, password: string) {
  currentAuthMethod = 'password';
  currentEmail = email.trim();
  currentPassword = password;
  currentRefreshToken = '';
  clearSessionCache();
}

function applyOAuthAuth(email: string, refreshToken: string, accessToken?: string, expiresAt?: number | null) {
  currentAuthMethod = 'oauth';
  currentEmail = email.trim();
  currentPassword = '';
  currentRefreshToken = refreshToken;
  if (accessToken) {
    cachedAccessToken = accessToken;
    cachedExpiresAt = expiresAt ?? null;
  } else {
    clearSessionCache();
  }
}

export function hasSyncAuthSession(): boolean {
  if (currentAuthMethod === 'oauth') {
    return Boolean(currentEmail.trim() && currentRefreshToken);
  }
  if (currentAuthMethod === 'password') {
    return Boolean(currentEmail.trim() && currentPassword);
  }
  return false;
}

export function getSyncAuthMethod(): SyncAuthCredentials['method'] | null {
  return currentAuthMethod;
}

export async function getAccessTokenFromSupabase(): Promise<string | null> {
  if (!hasSyncAuthSession()) {
    return null;
  }

  const now = Date.now() / 1000;
  if (cachedAccessToken && cachedExpiresAt && cachedExpiresAt - now > 60) {
    return cachedAccessToken;
  }

  const supabase = getSupabaseAuthClient();

  if (currentAuthMethod === 'oauth' && currentRefreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: currentRefreshToken,
    });
    if (error) {
      throw new Error(`Supabase session refresh failed: ${error.message}`);
    }
    if (!data.session) {
      throw new Error('Supabase session refresh failed: no session returned');
    }
    if (data.session.refresh_token && data.session.refresh_token !== currentRefreshToken) {
      currentRefreshToken = data.session.refresh_token;
      await saveOAuthSyncAuthCredentials(
        data.session.user.email ?? currentEmail,
        data.session.refresh_token,
      );
    }
    if (data.session.user.email) {
      currentEmail = data.session.user.email;
    }
    applySessionToCache(data.session);
    return data.session.access_token;
  }

  if (currentAuthMethod === 'password' && currentEmail && currentPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (error) {
      throw new Error(`Supabase login failed: ${error.message}`);
    }
    if (!data.session) {
      throw new Error('Supabase login failed: no session returned');
    }
    applySessionToCache(data.session);
    return data.session.access_token;
  }

  return null;
}

export async function testBackendLogin(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const apiBase = getRuntimeGuardedApiBaseUrl();
    if (isLocalhostApi(apiBase) && !IS_DEV_RUNTIME && !ALLOW_LOCALHOST_API) {
      return {
        ok: false,
        message:
          'EXPO_PUBLIC_API_URL points to localhost. For preview/production builds, set a reachable HTTPS API URL.',
      };
    }
    const token = await getAccessTokenFromSupabase();
    if (!token) {
      return {
        ok: false,
        message: 'Sign in to sync your plots to Tracebud.',
      };
    }
    const healthUrl = `${apiBase}/health`;
    const healthRes = await fetch(healthUrl, { method: 'GET' });
    if (!healthRes.ok) {
      return {
        ok: false,
        message: `Tracebud API returned ${healthRes.status} at ${healthUrl}. Check EXPO_PUBLIC_API_URL (currently ${apiBase}).`,
      };
    }
    return { ok: true };
  } catch (e) {
    const base = getRuntimeGuardedApiBaseUrl();
    const hint =
      base.includes('localhost') || base.includes('127.0.0.1')
        ? ' On a physical phone/tablet, localhost points to the device — set EXPO_PUBLIC_API_URL to http://YOUR_COMPUTER_LAN_IP:4000/api (same Wi‑Fi as the computer running the API).'
        : '';
    return {
      ok: false,
      message: `${e instanceof Error ? e.message : String(e)}.${hint}`,
    };
  }
}

export function setAuthCredentials(email: string, password: string) {
  applyPasswordAuth(email, password);
}

export function getAuthCredentials() {
  return { email: currentEmail, password: currentPassword };
}

export async function hydrateSyncAuthFromSettings(): Promise<void> {
  try {
    const credentials = await loadSyncAuthCredentials();
    if (!credentials) return;
    if (credentials.method === 'oauth') {
      applyOAuthAuth(credentials.email, credentials.refreshToken);
      return;
    }
    applyPasswordAuth(credentials.email, credentials.password);
  } catch {
    // ignore
  }
}

export async function saveAndApplySyncAuth(email: string, password: string): Promise<void> {
  const e = email.trim();
  await saveSyncAuthCredentials(e, password);
  applyPasswordAuth(e, password);
}

export async function saveAndApplyOAuthSyncAuth(
  email: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: number | null,
): Promise<void> {
  const e = email.trim();
  await saveOAuthSyncAuthCredentials(e, refreshToken);
  applyOAuthAuth(e, refreshToken, accessToken, expiresAt);
}

export async function clearPersistedSyncAuth(): Promise<void> {
  await clearSyncAuthCredentials();
  currentAuthMethod = null;
  currentEmail = '';
  currentPassword = '';
  currentRefreshToken = '';
  clearSessionCache();
}

/** Resolved API root (includes `/api`). */
export function getTracebudApiBaseUrl(): string {
  return getRuntimeGuardedApiBaseUrl();
}

/**
 * Supabase client with the current sync user's access token (for Storage uploads).
 * Returns null when Supabase is not configured or the user is not signed in.
 */
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Supabase Auth user id for the current sync session (matches storage RLS path prefix). */
export async function getAuthenticatedSupabaseUserId(): Promise<string | null> {
  const supabase = await getAuthenticatedSupabaseClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    return null;
  }
  return data.user.id;
}
