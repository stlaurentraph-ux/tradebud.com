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
import { useAuth } from '@/lib/auth-context';
import {
  clampLocaleForRole,
  getAvailableLocalesForRole,
  getLocaleLabel,
  type Locale,
} from '@/lib/locale-policy';
import {
  getCurrentLocale,
  getCurrentTimezone,
  setLocale as persistLocale,
  setTimezone as persistTimezone,
  t as translate,
  type DashboardTimezone,
} from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  timezone: DashboardTimezone;
  availableLocales: Locale[];
  setLocale: (locale: Locale) => void;
  setTimezone: (timezone: DashboardTimezone) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.active_role ?? null;
  const [locale, setLocaleState] = useState<Locale>('en');
  const [timezone, setTimezoneState] = useState<DashboardTimezone>('UTC');
  const availableLocales = useMemo(() => getAvailableLocalesForRole(role), [role]);

  useEffect(() => {
    const resolved = getCurrentLocale(role);
    const clamped = clampLocaleForRole(resolved, role);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    setLocaleState(clamped);
    setTimezoneState(getCurrentTimezone());
    document.documentElement.lang = clamped;
    if (clamped !== resolved) {
      persistLocale(clamped);
    }
  }, [role]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!availableLocales.includes(next)) return;
      persistLocale(next);
      setLocaleState(next);
      document.documentElement.lang = next;
      window.dispatchEvent(new CustomEvent('tracebud:locale-change', { detail: { locale: next } }));
    },
    [availableLocales],
  );

  const setTimezone = useCallback((next: DashboardTimezone) => {
    persistTimezone(next);
    setTimezoneState(next);
  }, []);

  const t = useCallback((key: string) => translate(key, locale), [locale]);

  const value = useMemo(
    () => ({ locale, timezone, availableLocales, setLocale, setTimezone, t }),
    [locale, timezone, availableLocales, setLocale, setTimezone, t],
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

export { getLocaleLabel, LocaleContext };
