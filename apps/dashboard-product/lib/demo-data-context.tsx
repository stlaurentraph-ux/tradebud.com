'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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

function subscribeDemoData(onStoreChange: () => void): () => void {
  window.addEventListener(DEMO_DATA_CHANGED_EVENT, onStoreChange);
  return () => window.removeEventListener(DEMO_DATA_CHANGED_EVENT, onStoreChange);
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const isToggleAvailable = isDemoDataToggleAvailable();
  // External store: sessionStorage is the source of truth, kept in sync via the
  // DEMO_DATA_CHANGED_EVENT dispatched by writeDemoDataEnabled. Server snapshot is false.
  const demoDataEnabled = useSyncExternalStore(subscribeDemoData, readDemoDataEnabled, () => false);

  const setDemoDataEnabled = useCallback(
    (enabled: boolean) => {
      if (!isToggleAvailable) return;
      writeDemoDataEnabled(enabled);
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
