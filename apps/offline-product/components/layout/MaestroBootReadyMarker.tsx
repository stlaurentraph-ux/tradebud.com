import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  MAESTRO_BOOT_READY_TEST_ID,
  MAESTRO_BOOT_SETTING_KEYS,
} from '@/features/testing/maestroBootStateRegistry';
import { useAppState } from '@/features/state/AppStateContext';
import { getSetting } from '@/features/state/persistence';

const MAESTRO_CI_BUILD = process.env.EXPO_PUBLIC_MAESTRO_CI === '1';

/**
 * Maestro CI anchor — rendered last in the root flex tree so Android paints it above app chrome.
 * CI APKs (EXPO_PUBLIC_MAESTRO_CI) show the marker when SQLite boot succeeds; retail builds
 * also require the welcome sheet to be dismissed.
 */
export function MaestroBootReadyMarker() {
  const { isAppReady, bootError } = useAppState();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAppReady || bootError) {
      setVisible(false);
      if (MAESTRO_CI_BUILD && Platform.OS === 'android') {
        console.warn(`[MaestroBoot] blocked isAppReady=${isAppReady} bootError=${bootError}`);
      }
      return;
    }

    if (MAESTRO_CI_BUILD) {
      setVisible(true);
      if (Platform.OS === 'android') {
        console.warn('[MaestroBoot] marker visible (CI build, SQLite boot ok)');
      }
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

  const androidCi = MAESTRO_CI_BUILD && Platform.OS === 'android';

  return (
    <View
      testID={MAESTRO_BOOT_READY_TEST_ID}
      accessibilityLabel="Maestro boot ready"
      accessible
      importantForAccessibility="yes"
      collapsable={false}
      pointerEvents="box-none"
      style={
        androidCi
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 48,
              height: 48,
              zIndex: 99999,
              elevation: 99999,
              opacity: 1,
              backgroundColor: '#0A7F59',
            }
          : {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 24,
              height: 24,
              zIndex: 99999,
              elevation: 99999,
              opacity: 0.01,
            }
      }
    />
  );
}
