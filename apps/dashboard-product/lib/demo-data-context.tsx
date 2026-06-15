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
  DEMO_DATA_CHANGED_EVENT,
  isDemoDataToggleAvailable,
  readDemoDataEnabled,
  writeDemoDataEnabled,
} from '@/lib/demo-data-mode';

interface DemoDataContextValue {
  isToggleAvailable: boolean;
  demoDataEnabled: boolean;
  setDemoDataEnabled: (enabled: boolean) => void;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const isToggleAvailable = isDemoDataToggleAvailable();
  const [demoDataEnabled, setDemoDataEnabledState] = useState(false);

  useEffect(() => {
    setDemoDataEnabledState(readDemoDataEnabled());
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setDemoDataEnabledState(detail.enabled);
        return;
      }
      setDemoDataEnabledState(readDemoDataEnabled());
    };
    window.addEventListener(DEMO_DATA_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(DEMO_DATA_CHANGED_EVENT, onChanged);
  }, []);

  const setDemoDataEnabled = useCallback(
    (enabled: boolean) => {
      if (!isToggleAvailable) return;
      writeDemoDataEnabled(enabled);
      setDemoDataEnabledState(enabled);
    },
    [isToggleAvailable],
  );

  const value = useMemo(
    () => ({
      isToggleAvailable,
      demoDataEnabled: isToggleAvailable && demoDataEnabled,
      setDemoDataEnabled,
    }),
    [demoDataEnabled, isToggleAvailable, setDemoDataEnabled],
  );

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData(): DemoDataContextValue {
  const context = useContext(DemoDataContext);
  if (!context) {
    return {
      isToggleAvailable: false,
      demoDataEnabled: false,
      setDemoDataEnabled: () => undefined,
    };
  }
  return context;
}
