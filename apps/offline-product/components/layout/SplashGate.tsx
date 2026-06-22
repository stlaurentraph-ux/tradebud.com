import { useEffect, type ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useAppState } from '@/features/state/AppStateContext';

const SPLASH_FADE_MS = 350;

/**
 * Hides the native splash only after AppState boot completes (SQLite + disk load).
 * Keeps the branded splash visible instead of flashing a blank frame before Home.
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const { isAppReady } = useAppState();

  useEffect(() => {
    if (!isAppReady) return;

    const hide = async () => {
      try {
        if (typeof SplashScreen.setOptions === 'function') {
          SplashScreen.setOptions({ fade: true, duration: SPLASH_FADE_MS });
        }
        await SplashScreen.hideAsync();
      } catch {
        // Splash may already be hidden in dev fast refresh.
      }
    };

    void hide();
  }, [isAppReady]);

  return children;
}
