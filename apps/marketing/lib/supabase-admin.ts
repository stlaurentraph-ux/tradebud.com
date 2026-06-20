import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** ADR-006 Phase 3: optional dedicated GTM Supabase project (founder OS + lead forms). */
function getGtmProjectAdminClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env.SUPABASE_GTM_URL ?? process.env.NEXT_PUBLIC_SUPABASE_GTM_URL;
  const serviceRoleKey = process.env.SUPABASE_GTM_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function getFounderOrLeadClient(): SupabaseClient {
  return getGtmProjectAdminClient() ?? getSupabaseAdmin();
}

export function getSupabaseCrm() {
  return getFounderOrLeadClient().schema('crm');
}

export function getSupabaseGtm() {
  return getFounderOrLeadClient().schema('gtm');
}
