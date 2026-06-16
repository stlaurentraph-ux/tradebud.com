import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';

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

export async function sessionFromOAuthCallbackUrl(url: string): Promise<Session> {
  const { params, errorCode } = parseOAuthCallbackUrl(url);
  if (errorCode) {
    const description =
      typeof params.error_description === 'string' ? params.error_description : errorCode;
    throw new Error(description);
  }

  const supabase = getSupabaseAuthClient();
  const code = typeof params.code === 'string' ? params.code : undefined;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned from OAuth.');
    return data.session;
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned from OAuth.');
    return data.session;
  }

  throw new Error('OAuth sign-in did not return a session.');
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
