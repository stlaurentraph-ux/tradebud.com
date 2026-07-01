import { Platform } from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

/**
 * Android 10 (API 29) + edge-to-edge: `useSafeAreaInsets().bottom` is often 0 because
 * decor no longer fits system windows. Use initial metrics, then a conservative fallback
 * for software navigation keys (Samsung 3-button bar, etc.).
 */
export function useFieldTabBarBottomInset(): number {
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'android') {
    return insets.bottom;
  }

  if (insets.bottom > 0) {
    return insets.bottom;
  }

  const initialBottom = initialWindowMetrics?.insets.bottom ?? 0;
  if (initialBottom > 0) {
    return initialBottom;
  }

  // API 29 edge-to-edge: stable/system window insets are not exposed to JS.
  if (Platform.Version < 30) {
    return 48;
  }

  return 0;
}
