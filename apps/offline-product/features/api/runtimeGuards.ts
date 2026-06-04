const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';
const ALLOW_INSECURE_API = process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === '1';
const IS_DEV_RUNTIME = typeof __DEV__ !== 'undefined' && __DEV__;

function isLocalhostApi(url: string): boolean {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

export function getTracebudApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
  const normalized = raw.replace(/\/$/, '');

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`Invalid EXPO_PUBLIC_API_URL: ${raw}`);
  }

  if (!IS_DEV_RUNTIME && !ALLOW_INSECURE_API && !isLocalhostApi(normalized) && parsed.protocol !== 'https:') {
    throw new Error(
      `Insecure EXPO_PUBLIC_API_URL (${normalized}). Use HTTPS for preview/production builds, or set EXPO_PUBLIC_ALLOW_INSECURE_API=1 only for controlled testing.`,
    );
  }

  return normalized;
}
