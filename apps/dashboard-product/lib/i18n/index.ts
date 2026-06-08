// Simple i18n utilities for localization support
export type Locale = 'en' | 'fr' | 'es';

export type DashboardTimezone = 'UTC' | 'Europe/Paris' | 'Africa/Kigali' | 'America/Sao_Paulo';

const LOCALE_STORAGE_KEY = 'tracebud_locale';
const TIMEZONE_STORAGE_KEY = 'tracebud_timezone';

const translations: Record<Locale, Record<string, string>> = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
  es: require('../../locales/es.json'),
};

export const TIMEZONE_OPTIONS: Array<{ value: DashboardTimezone; labelKey: string }> = [
  { value: 'UTC', labelKey: 'preferences.timezone.utc' },
  { value: 'Europe/Paris', labelKey: 'preferences.timezone.paris' },
  { value: 'Africa/Kigali', labelKey: 'preferences.timezone.kigali' },
  { value: 'America/Sao_Paulo', labelKey: 'preferences.timezone.sao_paulo' },
];

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] ?? translations.en?.[key] ?? key;
}

export function getAvailableLocales(): Locale[] {
  return ['en', 'fr', 'es'];
}

export function getLocaleLabel(locale: Locale): string {
  return t(`preferences.language.${locale}`, locale);
}

export function getCurrentLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && getAvailableLocales().includes(stored as Locale)) {
      return stored as Locale;
    }
    const lang = navigator.language?.split('-')[0].toLowerCase();
    if (lang === 'fr' || lang === 'es') return lang as Locale;
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
  return getAvailableLocales().includes(value as Locale);
}
