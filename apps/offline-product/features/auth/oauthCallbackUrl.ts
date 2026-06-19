import type { Session } from '@supabase/supabase-js';

import {
  getSupabaseAuthClient,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import { loadSyncAuthCredentials } from '@/features/security/syncAuthStorage';

export function parseOAuthCallbackUrl(input: string): {
  errorCode: string | null;
  params: Record<string, string>;
} {
  const parsed = new URL(input, 'https://phony.example');
  const errorCode = parsed.searchParams.get('errorCode');
  parsed.searchParams.delete('errorCode');
  const params = Object.fromEntries(parsed.searchParams.entries());
  if (parsed.hash) {
    new URLSearchParams(parsed.hash.replace(/^#/, '')).forEach((value, key) => {
      params[key] = value;
    });
  }
  return { errorCode, params };
}

function callbackDedupKey(url: string, params: Record<string, string>): string {
  if (typeof params.code === 'string' && params.code.length > 0) {
    return `code:${params.code}`;
  }
  if (
    typeof params.access_token === 'string' &&
    params.access_token.length > 0 &&
    typeof params.refresh_token === 'string' &&
    params.refresh_token.length > 0
  ) {
    return `tok:${params.access_token.slice(0, 16)}`;
  }
  return url;
}

const consumedCallbackKeys = new Set<string>();
let exchangeChain: Promise<unknown> = Promise.resolve();

function isOAuthCodeReuseError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('invalid grant') ||
    msg.includes('already been used') ||
    msg.includes('code has expired') ||
    msg.includes('invalid flow state')
  );
}

async function loadPersistedOAuthSession(): Promise<Session | null> {
  await hydrateSyncAuthFromSettings();
  if (!hasSyncAuthSession()) {
    return null;
  }
  const credentials = await loadSyncAuthCredentials();
  if (!credentials || credentials.method !== 'oauth') {
    return null;
  }
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: credentials.refreshToken,
  });
  if (error || !data.session) {
    return null;
  }
  return data.session;
}

async function exchangeOAuthCallbackUrl(url: string): Promise<Session> {
  const { params, errorCode } = parseOAuthCallbackUrl(url);
  if (errorCode) {
    const description =
      typeof params.error_description === 'string' ? params.error_description : errorCode;
    throw new Error(description);
  }

  const dedupKey = callbackDedupKey(url, params);
  if (consumedCallbackKeys.has(dedupKey)) {
    const recovered = await loadPersistedOAuthSession();
    if (recovered) {
      return recovered;
    }
  }

  const supabase = getSupabaseAuthClient();
  const code = typeof params.code === 'string' ? params.code : undefined;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (isOAuthCodeReuseError(error.message)) {
        const recovered = await loadPersistedOAuthSession();
        if (recovered) {
          consumedCallbackKeys.add(dedupKey);
          return recovered;
        }
      }
      throw new Error(error.message);
    }
    if (!data.session) throw new Error('No session returned from OAuth.');
    consumedCallbackKeys.add(dedupKey);
    return data.session;
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      if (isOAuthCodeReuseError(error.message)) {
        const recovered = await loadPersistedOAuthSession();
        if (recovered) {
          consumedCallbackKeys.add(dedupKey);
          return recovered;
        }
      }
      throw new Error(error.message);
    }
    if (!data.session) throw new Error('No session returned from OAuth.');
    consumedCallbackKeys.add(dedupKey);
    return data.session;
  }

  throw new Error('OAuth sign-in did not return a session.');
}

/** Serialize callback handling — the auth code is single-use across WebBrowser + deep links. */
export async function sessionFromOAuthCallbackUrl(url: string): Promise<Session> {
  const run = exchangeChain.then(() => exchangeOAuthCallbackUrl(url));
  exchangeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function clearOAuthCallbackDedupState(): void {
  consumedCallbackKeys.clear();
  exchangeChain = Promise.resolve();
}

export function isOAuthCallbackUrl(url: string): boolean {
  return (
    url.includes('auth/callback') ||
    url.includes('app.tracebud.com/auth/') ||
    url.includes('code=') ||
    url.includes('access_token=') ||
    url.includes('error=')
  );
}
