export const locales = [
  'en', 'fr', 'es', 'pt', 'id', 'vi', 'de', 'nl', 'it', 'am'
] as const;

export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  de: 'Deutsch',
  nl: 'Nederlands',
  it: 'Italiano',
  am: 'አማርኛ',
};
