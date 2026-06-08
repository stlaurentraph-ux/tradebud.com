'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAvailableLocales,
  getCurrentLocale,
  getCurrentTimezone,
  getLocaleLabel,
  setLocale as persistLocale,
  setTimezone as persistTimezone,
  t as translate,
  type DashboardTimezone,
  type Locale,
} from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  timezone: DashboardTimezone;
  setLocale: (locale: Locale) => void;
  setTimezone: (timezone: DashboardTimezone) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [timezone, setTimezoneState] = useState<DashboardTimezone>('UTC');

  useEffect(() => {
    setLocaleState(getCurrentLocale());
    setTimezoneState(getCurrentTimezone());
    document.documentElement.lang = getCurrentLocale();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (!getAvailableLocales().includes(next)) return;
    persistLocale(next);
    setLocaleState(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent('tracebud:locale-change', { detail: { locale: next } }));
  }, []);

  const setTimezone = useCallback((next: DashboardTimezone) => {
    persistTimezone(next);
    setTimezoneState(next);
  }, []);

  const t = useCallback((key: string) => translate(key, locale), [locale]);

  const value = useMemo(
    () => ({ locale, timezone, setLocale, setTimezone, t }),
    [locale, timezone, setLocale, setTimezone, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export { getLocaleLabel };
