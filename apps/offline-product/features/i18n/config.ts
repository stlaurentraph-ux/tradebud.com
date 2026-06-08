/** Aligned with apps/marketing/i18n.config.ts */
export const locales = [
  'en',
  'fr',
  'es',
  'pt',
  'id',
  'vi',
  'de',
  'nl',
  'it',
  'am',
  'no',
] as const;

export type SupportedLanguage = (typeof locales)[number];

export const defaultLocale: SupportedLanguage = 'en';

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (locales as readonly string[]).includes(value);
}

export const localeNames: Record<SupportedLanguage, string> = {
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
  no: 'Norsk',
};

/** Short code shown in the header pill */
export const localeCodes: Record<SupportedLanguage, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
  pt: 'PT',
  id: 'ID',
  vi: 'VI',
  de: 'DE',
  nl: 'NL',
  it: 'IT',
  am: 'AM',
  no: 'NO',
};
