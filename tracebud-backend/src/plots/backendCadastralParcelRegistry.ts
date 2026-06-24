/**
 * Demo cadastral keys for lookup smoke + structural guards.
 * Guard: backend-cadastral-parcel-guard.mjs
 */
export const BACKEND_CADASTRAL_PARCEL_DEMO_KEYS = {
  HN: '0123456789',
  GT: '1234567890',
} as const;

export const BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS = {
  miss: 'cadastral.lookup.miss',
  invalidKey: 'cadastral.lookup.invalid_key',
  unsupportedCountry: 'cadastral.lookup.unsupported_country',
} as const;

export const BACKEND_CADASTRAL_PARCEL_SUPPORTED_COUNTRIES = ['HN', 'GT'] as const;
