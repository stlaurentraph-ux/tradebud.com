import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function readFromEnvFiles(key: string): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../..", ".env.local"),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const contents = fs.readFileSync(filePath, "utf8");
    for (const rawLine of contents.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const [lhs, ...rhs] = line.split("=");
      if (lhs.trim() !== key) continue;
      return rhs.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return undefined;
}

/** ADR-006 Phase 3: optional dedicated GTM Supabase project (founder OS + lead forms). */
function getGtmProjectAdminClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env.SUPABASE_GTM_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_GTM_URL ??
    readFromEnvFiles("SUPABASE_GTM_URL") ??
    readFromEnvFiles("NEXT_PUBLIC_SUPABASE_GTM_URL");
  const serviceRoleKey =
    process.env.SUPABASE_GTM_SERVICE_ROLE_KEY ??
    readFromEnvFiles("SUPABASE_GTM_SERVICE_ROLE_KEY");

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
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    readFromEnvFiles("NEXT_PUBLIC_SUPABASE_URL") ??
    readFromEnvFiles("SUPABASE_URL");
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? readFromEnvFiles("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getFounderOrLeadClient(): SupabaseClient {
  return getGtmProjectAdminClient() ?? getSupabaseAdmin();
}

/** Founder OS tables (prospects, outreach, content). Not tenant `crm_contacts`. */
export function getSupabaseCrm() {
  return getFounderOrLeadClient().schema("crm");
}

/** Marketing lead capture tables. */
export function getSupabaseGtm() {
  return getFounderOrLeadClient().schema("gtm");
}
