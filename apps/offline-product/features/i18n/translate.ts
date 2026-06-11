import { defaultLocale, isSupportedLanguage, type SupportedLanguage } from './config';
import { messages } from './messages';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function translate(
  key: string,
  vars?: Record<string, string | number>,
  lang: SupportedLanguage = defaultLocale,
): string {
  let s = messages[lang][key] ?? messages.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return s;
}

export function createTranslator(lang: SupportedLanguage): TranslateFn {
  return (key, vars) => translate(key, vars, lang);
}
