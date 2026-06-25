import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useAppState } from '@/features/state/AppStateContext';

const SPLASH_FADE_MS = 250;

/**
 * Dismisses the native splash as soon as the React shell mounts — not after SQLite/auth boot.
 * Boot continues in AppStateProvider (`isAppReady`); Home renders underneath until fade completes.
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const { isAppReady } = useAppState();
  const hideStartedRef = useRef(false);

  const hideSplash = useCallback(async () => {
    if (hideStartedRef.current) return;
    hideStartedRef.current = true;
    try {
      if (typeof SplashScreen.setOptions === 'function') {
        SplashScreen.setOptions({ fade: true, duration: SPLASH_FADE_MS });
      }
      await SplashScreen.hideAsync();
    } catch {
      // Splash may already be hidden in dev fast refresh.
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void hideSplash();
    });
    return () => cancelAnimationFrame(frame);
  }, [hideSplash]);

  // Safety net if the first frame never runs (rare test/headless environments).
  useEffect(() => {
    if (!isAppReady) return;
    void hideSplash();
  }, [hideSplash, isAppReady]);

  return children;
}
