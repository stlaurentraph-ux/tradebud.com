import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAccessToken, getRefreshToken } from '@/lib/auth-session';

let browserClient: SupabaseClient | null = null;

function getPublicSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  if (!browserClient) {
    browserClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return browserClient;
}

export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error('Supabase is not configured for this dashboard environment.');
  }

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    throw new Error('Sign out and sign in again to manage security settings.');
  }

  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    throw new Error(error.message);
  }

  return client;
}
