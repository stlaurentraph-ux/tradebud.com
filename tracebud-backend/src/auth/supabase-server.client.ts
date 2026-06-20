import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
import ws from 'ws';

/** Supabase client for Node.js 20 servers (no native WebSocket). */
export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<'public'>,
): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    ...options,
    realtime: {
      ...options?.realtime,
      transport: ws as unknown as typeof WebSocket,
    },
  });
}
