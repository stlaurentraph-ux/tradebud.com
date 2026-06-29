import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import {
  MAESTRO_BOOT_READY_TEST_ID,
  MAESTRO_BOOT_SETTING_KEYS,
} from '@/features/testing/maestroBootStateRegistry';
import { useAppState } from '@/features/state/AppStateContext';
import { getSetting } from '@/features/state/persistence';

const MAESTRO_CI_BUILD = process.env.EXPO_PUBLIC_MAESTRO_CI === '1';
const MAESTRO_BOOT_READY_LABEL = 'Maestro boot ready';

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

  // Android UiAutomator treats empty ViewGroups as invisible even with opaque bg;
  // a TextView with label text is required for Maestro extendedWaitUntil visible.
  if (MAESTRO_CI_BUILD && Platform.OS === 'android') {
    return (
      <Text
        testID={MAESTRO_BOOT_READY_TEST_ID}
        accessibilityLabel={MAESTRO_BOOT_READY_LABEL}
        accessible
        importantForAccessibility="yes"
        style={{
          position: 'absolute',
          bottom: 96,
          alignSelf: 'center',
          color: '#FFFFFF',
          backgroundColor: '#0A7F59',
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
          fontWeight: '600',
          zIndex: 99999,
          elevation: 99999,
        }}
      >
        {MAESTRO_BOOT_READY_LABEL}
      </Text>
    );
  }

  return (
    <View
      testID={MAESTRO_BOOT_READY_TEST_ID}
      accessibilityLabel={MAESTRO_BOOT_READY_LABEL}
      accessible
      importantForAccessibility="yes"
      collapsable={false}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 24,
        height: 24,
        zIndex: 99999,
        elevation: 99999,
        opacity: 0.01,
      }}
    />
  );
}
