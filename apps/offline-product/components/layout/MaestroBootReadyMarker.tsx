import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

import {
  MAESTRO_BOOT_READY_TEST_ID,
  MAESTRO_BOOT_SETTING_KEYS,
} from '@/features/testing/maestroBootStateRegistry';
import { useAppState } from '@/features/state/AppStateContext';
import { getSetting } from '@/features/state/persistence';

/**
 * Maestro CI anchor — mounted under AppStateProvider (outside SplashGate boot-error branch).
 * Visible when SQLite boot succeeded, welcome is not blocking, and auth hydrate finished.
 */
export function MaestroBootReadyMarker() {
  const { isAppReady, bootError } = useAppState();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAppReady || bootError) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const dismissed = await getSetting(MAESTRO_BOOT_SETTING_KEYS.accountWelcomeDismissed);
      if (!cancelled) {
        setVisible(dismissed === '1');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAppReady, bootError]);

  if (!visible) return null;

  return (
    <Text
      testID={MAESTRO_BOOT_READY_TEST_ID}
      accessibilityLabel="Maestro boot ready"
      accessible
      importantForAccessibility="yes"
      collapsable={false}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: Platform.OS === 'android' ? 48 : 24,
        height: Platform.OS === 'android' ? 48 : 24,
        opacity: Platform.OS === 'android' ? 1 : 0.01,
        fontSize: Platform.OS === 'android' ? 8 : 1,
        color: Platform.OS === 'android' ? 'rgba(10,127,89,0.12)' : 'transparent',
      }}
    >
      {Platform.OS === 'android' ? 'ready' : ' '}
    </Text>
  );
}
