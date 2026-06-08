/**
 * Authentication API module - handles Supabase auth, token management.
 * Extracted from postPlot.ts to reduce coupling.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@/features/errors/ErrorLogger';
import {
  clearSyncAuthCredentials,
  loadSyncAuthCredentials,
  saveSyncAuthCredentials,
} from '@/features/security/syncAuthStorage';
import { getTracebudApiBaseUrl } from './runtimeGuards';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_EMAIL = process.env.EXPO_PUBLIC_TRACEBUD_TEST_EMAIL ?? '';
const DEFAULT_PASSWORD = process.env.EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD ?? '';
const ALLOW_TEST_AUTH = process.env.EXPO_PUBLIC_ALLOW_TEST_AUTH === '1';
const ALLOW_LOCALHOST_API = process.env.EXPO_PUBLIC_ALLOW_LOCALHOST_API === '1';
const IS_DEV_RUNTIME = typeof __DEV__ !== 'undefined' && __DEV__;

let supabaseClient: SupabaseClient | null = null;
let cachedAccessToken: string | null = null;
let cachedExpiresAt: number | null = null;
let currentEmail = ALLOW_TEST_AUTH ? DEFAULT_EMAIL : '';
let currentPassword = ALLOW_TEST_AUTH ? DEFAULT_PASSWORD : '';

function isLocalhostApi(url: string): boolean {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

/**
 * Initialize Supabase client (singleton).
 */
function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or ANON key not configured');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * Get cached access token or fetch new one from Supabase.
 * Caches token for 60 seconds.
 */
export async function getAccessTokenFromSupabase(): Promise<string | null> {
  if (!currentEmail || !currentPassword) {
    return null;
  }

  const now = Date.now() / 1000;
  if (cachedAccessToken && cachedExpiresAt && cachedExpiresAt - now > 60) {
    return cachedAccessToken;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });

    if (error) {
      logError(error, { phase: 'supabase_signin' });
      throw new Error(`Supabase login failed: ${error.message}`);
    }

    if (!data.session) {
      throw new Error('Supabase login failed: no session returned');
    }

    cachedAccessToken = data.session.access_token;
    cachedExpiresAt = data.session.expires_at ?? null;

    return cachedAccessToken;
  } catch (error) {
    logError(error as Error, { phase: 'auth_token' });
    throw error;
  }
}

/**
 * Test backend login by checking API health.
 */
export async function testBackendLogin(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const baseUrl = getTracebudApiBaseUrl();
    if (isLocalhostApi(baseUrl) && !IS_DEV_RUNTIME && !ALLOW_LOCALHOST_API) {
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

    const base = baseUrl;
    const healthUrl = `${base}/health`;
    const healthRes = await fetch(healthUrl, { method: 'GET' });

    if (!healthRes.ok) {
      return {
        ok: false,
        message: `Tracebud API returned ${healthRes.status} at ${healthUrl}. Check EXPO_PUBLIC_API_URL (currently ${base}).`,
      };
    }

    return { ok: true };
  } catch (e) {
    const base = getTracebudApiBaseUrl();
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

/**
 * Set auth credentials in memory and clear token cache.
 */
export function setAuthCredentials(email: string, password: string) {
  currentEmail = email.trim();
  currentPassword = password;
  cachedAccessToken = null;
  cachedExpiresAt = null;
}

/**
 * Get current auth credentials.
 */
export function getAuthCredentials() {
  return { email: currentEmail, password: currentPassword };
}

/**
 * Load saved Tracebud account from local settings into memory.
 * Call this on app start.
 */
export async function hydrateSyncAuthFromSettings(): Promise<void> {
  try {
    const credentials = await loadSyncAuthCredentials();
    if (credentials) {
      setAuthCredentials(credentials.email, credentials.password);
    }
  } catch (error) {
    logError(error as Error, { phase: 'hydrate_auth' });
    // ignore errors during hydration
  }
}

/**
 * Save account to device and apply for API calls.
 */
export async function saveAndApplySyncAuth(email: string, password: string): Promise<void> {
  const e = email.trim();
  await saveSyncAuthCredentials(e, password);
  setAuthCredentials(e, password);
}

/**
 * Remove saved account and clear session cache.
 */
export async function clearPersistedSyncAuth(): Promise<void> {
  await clearSyncAuthCredentials();
  setAuthCredentials('', '');
  cachedAccessToken = null;
  cachedExpiresAt = null;
}
