/**
 * Supabase project URL for field-app auth and storage.
 * Production builds should use the Tracebud auth domain (auth.tracebud.com), not *.supabase.co,
 * so browser OAuth never shows "Connect to …supabase".
 */
export function resolveSupabaseProjectUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '') ?? '';
}

export function isTracebudBrandedAuthHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'auth.tracebud.com' || host.endsWith('.tracebud.com');
  } catch {
    return false;
  }
}

export function isLegacySupabaseCoHost(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith('.supabase.co');
  } catch {
    return false;
  }
}
