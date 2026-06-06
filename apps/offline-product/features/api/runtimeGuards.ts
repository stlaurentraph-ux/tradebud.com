const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';
const PRODUCTION_API_BASE_URL = 'https://api.tracebud.com/api';
const ALLOW_INSECURE_API = process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === '1';

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export type StartupConfigIssueCode =
  | 'missing_api_url'
  | 'invalid_api_url'
  | 'insecure_api_url'
  | 'localhost_api_in_release'
  | 'missing_supabase_url'
  | 'missing_supabase_anon_key';

export type StartupConfigIssue = {
  code: StartupConfigIssueCode;
  message: string;
};

function isLocalhostApi(url: string): boolean {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

function readConfiguredApiUrlRaw(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (raw) return raw;
  return isDevRuntime() ? DEFAULT_API_BASE_URL : PRODUCTION_API_BASE_URL;
}

function normalizeApiUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const normalized = raw.replace(/\/$/, '');
  try {
    const parsed = new URL(normalized);
    if (!isDevRuntime() && !ALLOW_INSECURE_API && !isLocalhostApi(normalized) && parsed.protocol !== 'https:') {
      return {
        ok: false,
        message: `Insecure EXPO_PUBLIC_API_URL (${normalized}). Use HTTPS for preview/production builds.`,
      };
    }
    return { ok: true, url: normalized };
  } catch {
    return {
      ok: false,
      message: `Invalid EXPO_PUBLIC_API_URL: ${raw}`,
    };
  }
}

export function collectStartupConfigIssues(): StartupConfigIssue[] {
  const issues: StartupConfigIssue[] = [];
  const configuredApiRaw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!isDevRuntime()) {
    if (!configuredApiRaw) {
      issues.push({
        code: 'missing_api_url',
        message:
          'This beta build is missing EXPO_PUBLIC_API_URL. Rebuild with EAS env vars (expected https://api.tracebud.com/api).',
      });
    }
    if (configuredApiRaw && isLocalhostApi(configuredApiRaw)) {
      issues.push({
        code: 'localhost_api_in_release',
        message:
          'This release build points at localhost. Set EXPO_PUBLIC_API_URL to https://api.tracebud.com/api before rebuilding.',
      });
    }
    if (!supabaseUrl) {
      issues.push({
        code: 'missing_supabase_url',
        message: 'This beta build is missing EXPO_PUBLIC_SUPABASE_URL. Add it in EAS build secrets and rebuild.',
      });
    }
    if (!supabaseAnonKey) {
      issues.push({
        code: 'missing_supabase_anon_key',
        message:
          'This beta build is missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Add it in EAS build secrets and rebuild.',
      });
    }
  }

  if (configuredApiRaw) {
    const normalized = normalizeApiUrl(configuredApiRaw);
    if (!normalized.ok) {
      issues.push({
        code: normalized.message.includes('Insecure')
          ? 'insecure_api_url'
          : 'invalid_api_url',
        message: normalized.message,
      });
    }
  }

  return issues;
}

let cachedApiBaseUrl: string | null = null;

export function resetTracebudApiBaseUrlCacheForTests(): void {
  cachedApiBaseUrl = null;
}

export function getTracebudApiBaseUrl(): string {
  if (cachedApiBaseUrl) return cachedApiBaseUrl;
  const normalized = normalizeApiUrl(readConfiguredApiUrlRaw());
  if (!normalized.ok) {
    throw new Error(normalized.message);
  }
  cachedApiBaseUrl = normalized.url;
  return cachedApiBaseUrl;
}

export function tryGetTracebudApiBaseUrl():
  | { ok: true; url: string }
  | { ok: false; issues: StartupConfigIssue[] } {
  const startupIssues = collectStartupConfigIssues();
  if (startupIssues.length > 0) {
    return { ok: false, issues: startupIssues };
  }
  try {
    return { ok: true, url: getTracebudApiBaseUrl() };
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          code: 'invalid_api_url',
          message: error instanceof Error ? error.message : 'Invalid API configuration',
        },
      ],
    };
  }
}
