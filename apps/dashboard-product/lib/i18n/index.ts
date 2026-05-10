// Simple i18n utilities for localization support
export type Locale = 'en' | 'fr' | 'es';

const translations: Record<Locale, Record<string, string>> = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
  es: require('../../locales/es.json'),
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] ?? key;
}

export function getAvailableLocales(): Locale[] {
  return ['en', 'fr', 'es'];
}

export function getCurrentLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tracebud_locale');
    if (stored && getAvailableLocales().includes(stored as Locale)) {
      return stored as Locale;
    }
    const lang = navigator.language?.split('-')[0].toLowerCase();
    if (lang === 'fr' || lang === 'es') return lang as Locale;
  }
  return 'en';
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tracebud_locale', locale);
  }
}
