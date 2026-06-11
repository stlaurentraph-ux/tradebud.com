import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { LanguagePickerSheet } from '@/components/LanguagePickerSheet';
import {
  defaultLocale,
  isSupportedLanguage,
  localeCodes,
  type SupportedLanguage,
} from '@/features/i18n/config';
import { messages } from '@/features/i18n/messages';
import { getSetting, initDatabase, setSetting } from '@/features/state/persistence';

const LANG_STORAGE_KEY = 'tracebudAppLanguage';

type LanguageContextValue = {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  /** Two-letter code for header pill */
  languageCode: string;
  openLanguagePicker: () => void;
  /** Translate key; `{var}` placeholders replaced from `vars`. Falls back to English. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export type { SupportedLanguage };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>(defaultLocale);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initDatabase()
      .then(() => getSetting(LANG_STORAGE_KEY))
      .then((v) => {
        if (cancelled || !v) return;
        if (v === 'no') {
          setSetting(LANG_STORAGE_KEY, defaultLocale).catch(() => undefined);
          return;
        }
        if (isSupportedLanguage(v)) setLangState(v);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: SupportedLanguage) => {
    setLangState(next);
    setSetting(LANG_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = messages[lang][key] ?? messages.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return s;
    },
    [lang],
  );

  const openLanguagePicker = useCallback(() => setPickerOpen(true), []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      languageCode: localeCodes[lang],
      openLanguagePicker,
      t,
    }),
    [lang, setLang, openLanguagePicker, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguagePickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
