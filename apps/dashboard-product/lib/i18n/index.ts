import {
  ALL_LOCALES,
  getLocaleLabel as getCatalogLocaleLabel,
  isLocale as isCatalogLocale,
  resolveLocaleForRole,
  type Locale,
} from '@/lib/locale-policy';
import type { TenantRole } from '@/types';
import enRaw from '../../locales/en.json';
import frRaw from '../../locales/fr.json';
import esRaw from '../../locales/es.json';
import deRaw from '../../locales/overlays/de.json';
import itRaw from '../../locales/overlays/it.json';
import nlRaw from '../../locales/overlays/nl.json';
import ptRaw from '../../locales/overlays/pt.json';
import noRaw from '../../locales/overlays/no.json';
import swRaw from '../../locales/overlays/sw.json';
import rwRaw from '../../locales/overlays/rw.json';
import lgRaw from '../../locales/overlays/lg.json';
import amRaw from '../../locales/overlays/am.json';
import idRaw from '../../locales/overlays/id.json';
import viRaw from '../../locales/overlays/vi.json';
import hiRaw from '../../locales/overlays/hi.json';
import arRaw from '../../locales/overlays/ar.json';

export type { Locale };
export {
  ALL_LOCALES,
  getAvailableLocalesForRole,
  getLocalePickerGroupsForRole,
  getLocalePolicyDescriptionKey,
  isLocaleForRole,
} from '@/lib/locale-policy';

export type DashboardTimezone = 'UTC' | 'Europe/Paris' | 'Africa/Kigali' | 'America/Sao_Paulo';

const LOCALE_STORAGE_KEY = 'tracebud_locale';
const TIMEZONE_STORAGE_KEY = 'tracebud_timezone';

const EN_TRANSLATIONS: Record<string, string> = enRaw as Record<string, string>;

const LOCALE_OVERLAYS: Partial<Record<Locale, Record<string, string>>> = {
  fr: frRaw as Record<string, string>,
  es: esRaw as Record<string, string>,
  de: deRaw as Record<string, string>,
  it: itRaw as Record<string, string>,
  nl: nlRaw as Record<string, string>,
  pt: ptRaw as Record<string, string>,
  no: noRaw as Record<string, string>,
  sw: swRaw as Record<string, string>,
  rw: rwRaw as Record<string, string>,
  lg: lgRaw as Record<string, string>,
  am: amRaw as Record<string, string>,
  id: idRaw as Record<string, string>,
  vi: viRaw as Record<string, string>,
  hi: hiRaw as Record<string, string>,
  ar: arRaw as Record<string, string>,
};

const MERGED_TRANSLATIONS: Record<Locale, Record<string, string>> = ALL_LOCALES.reduce(
  (accumulator, locale) => {
    const overlay = LOCALE_OVERLAYS[locale];
    accumulator[locale] = overlay ? { ...EN_TRANSLATIONS, ...overlay } : { ...EN_TRANSLATIONS };
    return accumulator;
  },
  {} as Record<Locale, Record<string, string>>,
);

export const TIMEZONE_OPTIONS: Array<{ value: DashboardTimezone; labelKey: string }> = [
  { value: 'UTC', labelKey: 'preferences.timezone.utc' },
  { value: 'Europe/Paris', labelKey: 'preferences.timezone.paris' },
  { value: 'Africa/Kigali', labelKey: 'preferences.timezone.kigali' },
  { value: 'America/Sao_Paulo', labelKey: 'preferences.timezone.sao_paulo' },
];

export function t(key: string, locale: Locale = 'en'): string {
  return MERGED_TRANSLATIONS[locale]?.[key] ?? EN_TRANSLATIONS[key] ?? key;
}

/** @deprecated Use getAvailableLocalesForRole(role) for role-aware language lists. */
export function getAvailableLocales(): Locale[] {
  return [...ALL_LOCALES];
}

export function getLocaleLabel(locale: Locale): string {
  return getCatalogLocaleLabel(locale);
}

export function getCurrentLocale(role?: TenantRole | null): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const browserLang = navigator.language;
    return resolveLocaleForRole({ stored, browserLang, role });
  }
  return 'en';
}

export function getCurrentTimezone(): DashboardTimezone {
  if (typeof window === 'undefined') return 'UTC';
  const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
  if (stored && TIMEZONE_OPTIONS.some((option) => option.value === stored)) {
    return stored as DashboardTimezone;
  }
  return 'UTC';
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

export function setTimezone(timezone: DashboardTimezone): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  }
}

export function isDashboardTimezone(value: string): value is DashboardTimezone {
  return TIMEZONE_OPTIONS.some((option) => option.value === value);
}

export function isLocale(value: string): value is Locale {
  return isCatalogLocale(value);
}

export function getTranslationCoverage(locale: Locale): { translated: number; total: number } {
  const overlay = LOCALE_OVERLAYS[locale];
  const translated = locale === 'en' ? Object.keys(EN_TRANSLATIONS).length : Object.keys(overlay ?? {}).length;
  return { translated, total: Object.keys(EN_TRANSLATIONS).length };
}
