import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import {
  MAESTRO_BOOT_ERROR_TEST_ID,
  MAESTRO_BOOT_READY_TEST_ID,
  MAESTRO_BOOT_SETTING_KEYS,
} from '@/features/testing/maestroBootStateRegistry';
import { isMaestroCiBuild } from '@/features/testing/maestroCiBootProfile';
import { useAppState } from '@/features/state/AppStateContext';
import { getSetting } from '@/features/state/persistence';

const MAESTRO_BOOT_READY_LABEL = 'Maestro boot ready';
const MAESTRO_BOOT_ERROR_LABEL = 'Maestro boot error';

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
      if (isMaestroCiBuild() && Platform.OS === 'android') {
        console.warn(`[MaestroBoot] blocked isAppReady=${isAppReady} bootError=${bootError}`);
      }
      return;
    }

    if (isMaestroCiBuild()) {
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

  // CI fail-fast: when boot fails, render a distinct error marker so Maestro flows can
  // assert against it with a short timeout instead of waiting 15+ minutes for
  // maestro-boot-ready (which never appears when bootError=true). The actual error
  // message is logged via console.warn in AppStateContext (CI builds always log).
  if (isMaestroCiBuild() && isAppReady && bootError) {
    if (Platform.OS === 'android') {
      return (
        <Text
          testID={MAESTRO_BOOT_ERROR_TEST_ID}
          accessibilityLabel={MAESTRO_BOOT_ERROR_LABEL}
          accessible
          importantForAccessibility="yes"
          style={{
            position: 'absolute',
            bottom: 96,
            alignSelf: 'center',
            color: '#FFFFFF',
            backgroundColor: '#B91C1C',
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            fontWeight: '600',
            zIndex: 99999,
            elevation: 99999,
          }}
        >
          {MAESTRO_BOOT_ERROR_LABEL}
        </Text>
      );
    }
    return (
      <View
        testID={MAESTRO_BOOT_ERROR_TEST_ID}
        accessibilityLabel={MAESTRO_BOOT_ERROR_LABEL}
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

  if (!visible) return null;

  // Android UiAutomator treats empty ViewGroups as invisible even with opaque bg;
  // a TextView with label text is required for Maestro extendedWaitUntil visible.
  if (isMaestroCiBuild() && Platform.OS === 'android') {
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
