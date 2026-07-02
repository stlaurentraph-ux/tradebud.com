import { useEffect } from 'react';
import { requireOptionalNativeModule } from 'expo';

type ExpoNavigationBarNative = {
  setPositionAsync?: (position: 'relative' | 'absolute') => Promise<void>;
};

function getNavigationBarNative(): ExpoNavigationBarNative | null {
  return requireOptionalNativeModule<ExpoNavigationBarNative>('ExpoNavigationBar');
}

/**
 * Edge-to-edge draws the app under the system navigation bar. On API 29 the JS
 * safe-area hook often reports bottom=0. Prefer `relative` nav bar positioning so
 * the window is inset above the bar instead of requiring a hardcoded padding guess.
 * No-ops when the dev client was built before expo-navigation-bar was linked.
 */
export function AndroidNavigationBarLayoutBridge() {
  useEffect(() => {
    const native = getNavigationBarNative();
    if (!native?.setPositionAsync) return;
    void native.setPositionAsync('relative').catch(() => undefined);
  }, []);

  return null;
}
