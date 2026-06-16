import type { TenantRole } from '@/types';

/** Dashboard locale codes aligned with the field app where possible. */
export const ALL_LOCALES = [
  'en',
  'fr',
  'de',
  'es',
  'it',
  'nl',
  'pt',
  'no',
  'sw',
  'rw',
  'lg',
  'am',
  'id',
  'vi',
  'hi',
  'ar',
] as const;

export type Locale = (typeof ALL_LOCALES)[number];

export type LocaleRegion = 'universal' | 'eu' | 'developed' | 'origin';

export interface LocaleCatalogEntry {
  nativeLabel: string;
  region: LocaleRegion;
}

export const LOCALE_CATALOG: Record<Locale, LocaleCatalogEntry> = {
  en: { nativeLabel: 'English', region: 'universal' },
  fr: { nativeLabel: 'Français', region: 'eu' },
  de: { nativeLabel: 'Deutsch', region: 'eu' },
  es: { nativeLabel: 'Español', region: 'eu' },
  it: { nativeLabel: 'Italiano', region: 'eu' },
  nl: { nativeLabel: 'Nederlands', region: 'eu' },
  pt: { nativeLabel: 'Português', region: 'eu' },
  no: { nativeLabel: 'Norsk', region: 'developed' },
  sw: { nativeLabel: 'Kiswahili', region: 'origin' },
  rw: { nativeLabel: 'Ikinyarwanda', region: 'origin' },
  lg: { nativeLabel: 'Luganda', region: 'origin' },
  am: { nativeLabel: 'አማርኛ', region: 'origin' },
  id: { nativeLabel: 'Bahasa Indonesia', region: 'origin' },
  vi: { nativeLabel: 'Tiếng Việt', region: 'origin' },
  hi: { nativeLabel: 'हिन्दी', region: 'origin' },
  ar: { nativeLabel: 'العربية', region: 'origin' },
};

/** Importer and jurisdiction reviewers: EU + English + developed-market languages. */
const EU_COMPLIANCE_LOCALES: Locale[] = ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'no'];

/** Exporters and cooperatives: origin languages first, then common trade languages. */
const ORIGIN_FIRST_LOCALES: Locale[] = [
  'sw',
  'rw',
  'lg',
  'am',
  'id',
  'vi',
  'hi',
  'ar',
  'pt',
  'fr',
  'en',
  'es',
];

const ROLE_LOCALE_POLICY: Record<TenantRole, Locale[]> = {
  importer: EU_COMPLIANCE_LOCALES,
  country_reviewer: EU_COMPLIANCE_LOCALES,
  sponsor: [...ALL_LOCALES],
  exporter: ORIGIN_FIRST_LOCALES,
  cooperative: ORIGIN_FIRST_LOCALES,
};

const DEFAULT_UNAUTHENTICATED_LOCALES: Locale[] = EU_COMPLIANCE_LOCALES;

export function getAvailableLocalesForRole(role?: TenantRole | null): Locale[] {
  if (!role) return DEFAULT_UNAUTHENTICATED_LOCALES;
  return ROLE_LOCALE_POLICY[role];
}

export function isLocaleForRole(value: string, role?: TenantRole | null): value is Locale {
  return getAvailableLocalesForRole(role).includes(value as Locale);
}

export function isLocale(value: string): value is Locale {
  return ALL_LOCALES.includes(value as Locale);
}

export function clampLocaleForRole(locale: Locale, role?: TenantRole | null): Locale {
  const allowed = getAvailableLocalesForRole(role);
  if (allowed.includes(locale)) return locale;
  if (allowed.includes('en')) return 'en';
  return allowed[0];
}

export function resolveLocaleForRole(options: {
  stored?: string | null;
  browserLang?: string | null;
  role?: TenantRole | null;
}): Locale {
  const allowed = getAvailableLocalesForRole(options.role);
  if (options.stored && allowed.includes(options.stored as Locale)) {
    return options.stored as Locale;
  }

  const browser = options.browserLang?.split('-')[0]?.toLowerCase();
  if (browser && allowed.includes(browser as Locale)) {
    return browser as Locale;
  }

  if (allowed.includes('en')) return 'en';
  return allowed[0];
}

export interface LocalePickerGroup {
  labelKey: string;
  locales: Locale[];
}

export function getLocalePickerGroupsForRole(role?: TenantRole | null): LocalePickerGroup[] {
  const allowed = new Set(getAvailableLocalesForRole(role));

  if (role === 'sponsor') {
    return [
      { labelKey: 'preferences.language.group.universal', locales: filterLocales(['en'], allowed) },
      { labelKey: 'preferences.language.group.eu', locales: filterLocales(['fr', 'de', 'es', 'it', 'nl', 'pt'], allowed) },
      { labelKey: 'preferences.language.group.developed', locales: filterLocales(['no'], allowed) },
      {
        labelKey: 'preferences.language.group.origin',
        locales: filterLocales(['sw', 'rw', 'lg', 'am', 'id', 'vi', 'hi', 'ar'], allowed),
      },
    ].filter((group) => group.locales.length > 0);
  }

  if (role === 'exporter' || role === 'cooperative') {
    return [
      {
        labelKey: 'preferences.language.group.origin',
        locales: filterLocales(['sw', 'rw', 'lg', 'am', 'id', 'vi', 'hi', 'ar'], allowed),
      },
      {
        labelKey: 'preferences.language.group.trade',
        locales: filterLocales(['pt', 'fr', 'en', 'es'], allowed),
      },
    ].filter((group) => group.locales.length > 0);
  }

  return [
    {
      labelKey: 'preferences.language.group.eu_compliance',
      locales: filterLocales(['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'no'], allowed),
    },
  ];
}

function filterLocales(candidates: Locale[], allowed: Set<Locale>): Locale[] {
  return candidates.filter((locale) => allowed.has(locale));
}

export function getLocaleLabel(locale: Locale): string {
  return LOCALE_CATALOG[locale]?.nativeLabel ?? locale;
}

export function getLocalePolicyDescriptionKey(role?: TenantRole | null): string {
  if (role === 'sponsor') return 'settings.preferences.language_policy_sponsor';
  if (role === 'exporter' || role === 'cooperative') {
    return 'settings.preferences.language_policy_origin';
  }
  if (role === 'importer' || role === 'country_reviewer') {
    return 'settings.preferences.language_policy_eu';
  }
  return 'settings.preferences.language_hint';
}
