/**
 * CORS policy for browser clients (dashboard web, Expo web).
 * Native mobile apps typically send no Origin header and are allowed through.
 */
const TRACEBUD_HTTPS_PATTERN = /^https:\/\/([a-z0-9-]+\.)*tracebud\.com$/i;
const LOCALHOST_PATTERN = /^http:\/\/localhost(:\d+)?$/;
const LAN_PATTERN = /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/;

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function parseExtraCorsOrigins(): string[] {
  const raw = process.env.TRACEBUD_CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const extras = parseExtraCorsOrigins();
  if (extras.includes(origin)) return true;

  if (isProductionRuntime()) {
    return TRACEBUD_HTTPS_PATTERN.test(origin);
  }

  return LOCALHOST_PATTERN.test(origin) || LAN_PATTERN.test(origin) || TRACEBUD_HTTPS_PATTERN.test(origin);
}

export function buildCorsOriginOption():
  | boolean
  | string[]
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isCorsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}
