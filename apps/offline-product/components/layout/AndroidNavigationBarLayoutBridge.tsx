import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Edge-to-edge draws the app under the system navigation bar. On API 29 the JS
 * safe-area hook often reports bottom=0. Prefer `relative` nav bar positioning so
 * the window is inset above the bar instead of requiring a hardcoded padding guess.
 */
export function AndroidNavigationBarLayoutBridge() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void NavigationBar.setPositionAsync('relative').catch(() => undefined);
  }, []);

  return null;
}
