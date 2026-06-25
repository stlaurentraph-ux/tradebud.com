/**
 * Tracebud field-app sync authentication (password + OAuth refresh tokens).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  activateSyncAuthOnSignIn,
  clearSyncAuthCredentials,
  isSyncAuthDismissedOnDevice,
  persistSyncAuthSignOutLatch,
  loadSyncAuthCredentials,
  saveOAuthSyncAuthCredentials,
  savePhoneOtpSyncAuthCredentials,
  saveSyncAuthCredentials,
  saveOAuthAccessTokenCache,
  type SyncAuthCredentials,
} from '@/features/security/syncAuthStorage';
import { mapPasswordSignInError, mapSetPasswordError } from '@/features/auth/mapAuthError';
import { clearOAuthOrchestratorState } from '@/features/auth/oauthOrchestrator';
import { getFieldAppEmailFromSession } from '@/features/auth/oauthSession';
import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';
import {
  cacheBustUrl,
  isSuccessfulApiResponse,
  tracebudFetchWithTimeout,
  TRACEBUD_NO_CACHE_HEADERS,
} from '@/features/network/apiFetchResponse';
import { probeTracebudApiReachable } from '@/features/network/pingTracebudApi';
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
let currentPhone = '';
let currentRefreshToken = '';

/** In-memory guard: blocks token refresh from re-persisting OAuth creds after sign-out. */
let syncAuthDismissedByUser = false;
let signOutRevision = 0;
/** Bumped on sign-out so in-flight UI refresh work cannot re-promote signed-in state. */
let authUiGeneration = 0;

let authStateChain: Promise<void> = Promise.resolve();

/** Verified access token reused for one Sync now / metrics refresh (avoids repeated OAuth refresh). */
let syncRunAccessToken: string | null = null;
let syncRunAccessDepth = 0;

export function beginSyncAccessTokenRun(accessToken: string): void {
  const token = accessToken.trim();
  if (!token) return;
  if (syncRunAccessDepth === 0) {
    syncRunAccessToken = token;
  }
  syncRunAccessDepth += 1;
}

export function endSyncAccessTokenRun(): void {
  syncRunAccessDepth = Math.max(0, syncRunAccessDepth - 1);
  if (syncRunAccessDepth === 0) {
    syncRunAccessToken = null;
  }
}

function getSyncRunAccessToken(): string | null {
  return syncRunAccessDepth > 0 ? syncRunAccessToken : null;
}

function syncAuthStillActive(revisionAtStart: number): boolean {
  return revisionAtStart === signOutRevision && !syncAuthDismissedByUser;
}

function runAuthStateMutation<T>(fn: () => Promise<T>): Promise<T> {
  const result = authStateChain.then(fn);
  authStateChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function clearInMemorySyncAuth(): void {
  currentAuthMethod = null;
  currentEmail = '';
  currentPassword = '';
  currentPhone = '';
  currentRefreshToken = '';
  clearSessionCache();
}

function authRefreshFailureError(error: { message?: string }): Error {
  const msg = String(error.message ?? '');
  if (isLikelyNetworkError(msg)) {
    return new Error('Network request failed');
  }
  return new Error('sign_in_session_expired');
}

function isLocalhostApi(url: string): boolean {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('sign_in_auth_not_configured');
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
  if (currentAuthMethod === 'oauth' || currentAuthMethod === 'phone_otp') {
    void saveOAuthAccessTokenCache(session.access_token, session.expires_at ?? null).catch(
      () => undefined,
    );
  }
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
  currentPhone = '';
  currentPassword = '';
  currentRefreshToken = refreshToken;
  if (accessToken) {
    cachedAccessToken = accessToken;
    cachedExpiresAt = expiresAt ?? null;
  } else {
    clearSessionCache();
  }
}

function applyPhoneOtpAuth(phone: string, refreshToken: string, accessToken?: string, expiresAt?: number | null) {
  currentAuthMethod = 'phone_otp';
  currentPhone = phone.trim();
  currentEmail = '';
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
  if (syncAuthDismissedByUser) {
    return false;
  }
  if (currentAuthMethod === 'oauth') {
    return Boolean(currentEmail.trim() && currentRefreshToken);
  }
  if (currentAuthMethod === 'phone_otp') {
    return Boolean(currentPhone.trim() && currentRefreshToken);
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
  return runAuthStateMutation(async () => {
    const revisionAtStart = signOutRevision;
    if (syncAuthDismissedByUser || !hasSyncAuthSession()) {
      return null;
    }

    const runToken = getSyncRunAccessToken();
    if (runToken) {
      return runToken;
    }

    const now = Date.now() / 1000;
    if (cachedAccessToken && cachedExpiresAt && cachedExpiresAt - now > 60) {
      return cachedAccessToken;
    }

    const supabase = getSupabaseAuthClient();

    if (
      (currentAuthMethod === 'oauth' || currentAuthMethod === 'phone_otp') &&
      currentRefreshToken
    ) {
      let refreshError: { message?: string } | null = null;
      let data: Awaited<ReturnType<typeof supabase.auth.refreshSession>>['data'] | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const result = await supabase.auth.refreshSession({
          refresh_token: currentRefreshToken,
        });
        refreshError = result.error;
        data = result.data;
        if (!refreshError) {
          break;
        }
        if (attempt === 0 && isLikelyNetworkError(String(refreshError.message ?? ''))) {
          continue;
        }
        break;
      }
      if (!syncAuthStillActive(revisionAtStart)) {
        return null;
      }
      if (refreshError) {
        throw authRefreshFailureError(refreshError);
      }
      if (!data?.session) {
        throw new Error('sign_in_session_expired');
      }
      if (
        (currentAuthMethod === 'oauth' || currentAuthMethod === 'phone_otp') &&
        data.session.refresh_token &&
        data.session.refresh_token !== currentRefreshToken
      ) {
        if (!syncAuthStillActive(revisionAtStart) || (await isSyncAuthDismissedOnDevice())) {
          return null;
        }
        if (currentAuthMethod === 'phone_otp') {
          const refreshedPhone = data.session.user.phone?.trim() || currentPhone;
          await savePhoneOtpSyncAuthCredentials(
            refreshedPhone,
            data.session.refresh_token,
            data.session.access_token,
            data.session.expires_at ?? null,
          );
          currentPhone = refreshedPhone;
        } else {
          await saveOAuthSyncAuthCredentials(
            getFieldAppEmailFromSession(data.session) || currentEmail,
            data.session.refresh_token,
            data.session.access_token,
            data.session.expires_at ?? null,
          );
        }
        if (!syncAuthStillActive(revisionAtStart)) {
          return null;
        }
        if (!(await isSyncAuthDismissedOnDevice())) {
          currentRefreshToken = data.session.refresh_token;
        }
      }
      if (!syncAuthStillActive(revisionAtStart)) {
        return null;
      }
      const refreshedEmail = getFieldAppEmailFromSession(data.session);
      if (refreshedEmail) {
        currentEmail = refreshedEmail;
      } else if (data.session.user.email) {
        currentEmail = data.session.user.email;
      }
      const refreshedPhone = data.session.user.phone?.trim();
      if (refreshedPhone) {
        currentPhone = refreshedPhone;
      }
      applySessionToCache(data.session);
      return data.session.access_token;
    }

    if (currentAuthMethod === 'password' && currentEmail && currentPassword) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });
      if (!syncAuthStillActive(revisionAtStart)) {
        return null;
      }
      if (error) {
        throw new Error(mapPasswordSignInError(error));
      }
      if (!data.session) {
        throw new Error('sign_in_failed');
      }
      applySessionToCache(data.session);
      return data.session.access_token;
    }

    return null;
  });
}

const DEFAULT_ACCESS_TOKEN_TIMEOUT_MS = 20_000;

export type VerifySyncAccessTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'missing_credentials' | 'session_expired' | 'network' };

/** Confirms stored sync credentials can produce a live Supabase access token. */
export async function verifySyncAccessToken(
  timeoutMs = DEFAULT_ACCESS_TOKEN_TIMEOUT_MS,
): Promise<VerifySyncAccessTokenResult> {
  if (!hasSyncAuthSession()) {
    return { ok: false, reason: 'missing_credentials' };
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const token = await getAccessTokenFromSupabaseWithTimeout(timeoutMs);
      if (!token) {
        return { ok: false, reason: 'session_expired' };
      }
      return { ok: true, token };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isLikelyNetworkError(msg) && attempt === 0) {
        continue;
      }
      if (isLikelyNetworkError(msg)) {
        const staleToken = cachedAccessToken?.trim() || null;
        if (staleToken && (await probeTracebudApiReachable({ accessToken: staleToken }))) {
          return { ok: true, token: staleToken };
        }
        return { ok: false, reason: 'network' };
      }
      return { ok: false, reason: 'session_expired' };
    }
  }
  const staleToken = cachedAccessToken?.trim() || null;
  if (staleToken && (await probeTracebudApiReachable({ accessToken: staleToken }))) {
    return { ok: true, token: staleToken };
  }
  return { ok: false, reason: 'network' };
}

/** Bounds OAuth/password refresh so sync UI cannot spin forever on a hung auth call. */
export async function getAccessTokenFromSupabaseWithTimeout(
  timeoutMs = DEFAULT_ACCESS_TOKEN_TIMEOUT_MS,
): Promise<string | null> {
  const runToken = getSyncRunAccessToken();
  if (runToken) {
    return runToken;
  }
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getAccessTokenFromSupabase(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Network request failed'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function testBackendLogin(options?: {
  timeoutMs?: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const timeoutMs = options?.timeoutMs ?? 12_000;
  try {
    const apiBase = getRuntimeGuardedApiBaseUrl();
    if (isLocalhostApi(apiBase) && !IS_DEV_RUNTIME && !ALLOW_LOCALHOST_API) {
      return {
        ok: false,
        message:
          'EXPO_PUBLIC_API_URL points to localhost. For preview/production builds, set a reachable HTTPS API URL.',
      };
    }
    const token = await getAccessTokenFromSupabaseWithTimeout(
      Math.min(timeoutMs, DEFAULT_ACCESS_TOKEN_TIMEOUT_MS),
    );
    if (!token) {
      return {
        ok: false,
        message: 'Sign in to sync your plots to Tracebud.',
      };
    }
    const healthRes = await tracebudFetchWithTimeout(
      cacheBustUrl(`${apiBase}/health`),
      {
        method: 'GET',
        headers: TRACEBUD_NO_CACHE_HEADERS,
      },
      timeoutMs,
    );
    if (healthRes == null) {
      return {
        ok: false,
        message: 'Network request failed',
      };
    }
    if (!isSuccessfulApiResponse(healthRes.status)) {
      return {
        ok: false,
        message: `Tracebud API returned ${healthRes.status} at ${cacheBustUrl(`${apiBase}/health`)}. Check EXPO_PUBLIC_API_URL (currently ${apiBase}).`,
      };
    }
    return { ok: true };
  } catch (e) {
    const base = getRuntimeGuardedApiBaseUrl();
    const hint =
      base.includes('localhost') || base.includes('127.0.0.1')
        ? ' On a physical phone/tablet, localhost points to the device — set EXPO_PUBLIC_API_URL to http://YOUR_COMPUTER_LAN_IP:4000/api (same Wi‑Fi as the computer running the API).'
        : '';
    const raw = e instanceof Error ? e.message : String(e);
    const message =
      e instanceof Error && e.name === 'AbortError'
        ? 'Network request failed'
        : raw;
    return {
      ok: false,
      message: `${message}.${hint}`,
    };
  }
}

export function setAuthCredentials(email: string, password: string) {
  applyPasswordAuth(email, password);
}

export function getAuthCredentials() {
  return { email: currentEmail, password: currentPassword };
}

/** Immediately invalidate in-memory sync auth (call before async credential wipe). */
export function abortSyncAuthForSignOut(): void {
  signOutRevision += 1;
  authUiGeneration += 1;
  syncAuthDismissedByUser = true;
  clearInMemorySyncAuth();
  void persistSyncAuthSignOutLatch().catch(() => undefined);
  void import('@/features/sync/fieldSyncCursor')
    .then((m) => m.clearFieldSyncCursor())
    .catch(() => undefined);
}

export async function hydrateSyncAuthFromSettings(): Promise<void> {
  return runAuthStateMutation(async () => {
    try {
      if (syncAuthDismissedByUser) {
        clearInMemorySyncAuth();
        return;
      }
      const dismissed = await isSyncAuthDismissedOnDevice();
      if (dismissed) {
        syncAuthDismissedByUser = true;
        clearInMemorySyncAuth();
        return;
      }

      const credentials = await loadSyncAuthCredentials();
      if (!credentials) {
        clearInMemorySyncAuth();
        return;
      }
      if (credentials.method === 'oauth') {
        applyOAuthAuth(
          credentials.email,
          credentials.refreshToken,
          credentials.accessToken,
          credentials.expiresAt,
        );
        return;
      }
      if (credentials.method === 'phone_otp') {
        applyPhoneOtpAuth(
          credentials.phone,
          credentials.refreshToken,
          credentials.accessToken,
          credentials.expiresAt,
        );
        return;
      }
      applyPasswordAuth(credentials.email, credentials.password);
    } catch {
      // ignore
    }
  });
}

export async function saveAndApplySyncAuth(email: string, password: string): Promise<void> {
  return runAuthStateMutation(async () => {
    syncAuthDismissedByUser = false;
    await activateSyncAuthOnSignIn();
    authUiGeneration += 1;
    const e = email.trim();
    await saveSyncAuthCredentials(e, password);
    applyPasswordAuth(e, password);
  });
}

export async function saveAndApplyPasswordSession(
  email: string,
  password: string,
  session: { access_token: string; expires_at?: number | null },
): Promise<void> {
  await saveAndApplySyncAuth(email, password);
  applySessionToCache(session);
}

export async function saveAndApplyOAuthSyncAuth(
  email: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: number | null,
): Promise<void> {
  return runAuthStateMutation(async () => {
    syncAuthDismissedByUser = false;
    await activateSyncAuthOnSignIn();
    authUiGeneration += 1;
    const e = email.trim();
    await saveOAuthSyncAuthCredentials(e, refreshToken, accessToken, expiresAt);
    applyOAuthAuth(e, refreshToken, accessToken, expiresAt);
  });
}

export async function saveAndApplyPhoneOtpSession(
  phone: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: number | null,
): Promise<void> {
  return runAuthStateMutation(async () => {
    syncAuthDismissedByUser = false;
    await activateSyncAuthOnSignIn();
    authUiGeneration += 1;
    const normalizedPhone = phone.trim();
    await savePhoneOtpSyncAuthCredentials(normalizedPhone, refreshToken, accessToken, expiresAt);
    applyPhoneOtpAuth(normalizedPhone, refreshToken, accessToken, expiresAt);
  });
}

export async function clearPersistedSyncAuth(): Promise<void> {
  abortSyncAuthForSignOut();
  return runAuthStateMutation(async () => {
    await clearSyncAuthCredentials();
    try {
      await getSupabaseAuthClient().auth.signOut();
    } catch {
      // Best-effort: in-memory Tracebud sync auth is already cleared.
    } finally {
      supabaseClient = null;
    }
    clearOAuthOrchestratorState();
  });
}

export async function isSyncAuthSignedOutOnDevice(): Promise<boolean> {
  if (syncAuthDismissedByUser) {
    return true;
  }
  return isSyncAuthDismissedOnDevice();
}

/** Generation counter bumped on sign-in/out; UI refresh work should abort when it changes. */
export function getAuthUiGeneration(): number {
  return authUiGeneration;
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

/**
 * Shared Supabase client with an in-memory auth session — required for auth mutations
 * such as `updateUser` (Bearer-only clients are not enough).
 */
export async function getAuthenticatedSupabaseClientWithSession(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!hasSyncAuthSession()) {
    return null;
  }

  const supabase = getSupabaseAuthClient();

  if (
    (currentAuthMethod === 'oauth' || currentAuthMethod === 'phone_otp') &&
    currentRefreshToken
  ) {
    let accessToken: string | null;
    try {
      accessToken = await getAccessTokenFromSupabase();
    } catch (error) {
      throw error;
    }
    if (!accessToken) {
      return null;
    }
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: currentRefreshToken,
    });
    if (error) {
      throw new Error(mapSetPasswordError(error));
    }
    return supabase;
  }

  if (currentAuthMethod === 'password' && currentEmail && currentPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (error || !data.session) {
      return null;
    }
    applySessionToCache(data.session);
    return supabase;
  }

  return null;
}

/** Supabase Auth user for the current sync session (JWT claims including app_metadata). */
export async function getSyncAuthUser() {
  const client = await getAuthenticatedSupabaseClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
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
