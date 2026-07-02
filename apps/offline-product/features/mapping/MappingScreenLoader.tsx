import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AndroidMapsUnavailablePlaceholder } from '@/components/plot-map/AndroidMapsUnavailablePlaceholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import {
  isRnMapsNativeModuleAvailable,
  shouldBlockNativeMapView,
} from '@/features/mapping/androidMapsConfig';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; Screen: ComponentType }
  | { phase: 'blocked'; reason: 'maps_config' | 'native_module' }
  | { phase: 'error'; message: string };

/**
 * Loads WalkPerimeterScreen only when react-native-maps is safe to import.
 * Avoids crashing the app when the installed APK lacks RNMapsAirModule (stale/Maestro build).
 */
export function MappingScreenLoader() {
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    if (shouldBlockNativeMapView()) {
      setState({ phase: 'blocked', reason: 'maps_config' });
      return;
    }
    if (!isRnMapsNativeModuleAvailable()) {
      setState({ phase: 'blocked', reason: 'native_module' });
      return;
    }

    let cancelled = false;
    void import('@/features/mapping/WalkPerimeterScreen')
      .then((mod) => {
        if (!cancelled) {
          setState({ phase: 'ready', Screen: mod.WalkPerimeterScreen });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setState({ phase: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (state.phase === 'loading') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (state.phase === 'blocked') {
    return (
      <ThemedView style={styles.centered}>
        <AndroidMapsUnavailablePlaceholder style={styles.placeholder} iconSize={40} />
        {state.reason === 'native_module' ? (
          <ThemedText type="default" style={styles.hint}>
            This install is missing the map native module. Rebuild on your Mac:{' '}
            <ThemedText type="defaultSemiBold">npx expo run:android --device</ThemedText>
            , then reload Metro.
          </ThemedText>
        ) : null}
      </ThemedView>
    );
  }

  if (state.phase === 'error') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="title" style={styles.errorTitle}>
          Mapping could not load
        </ThemedText>
        {__DEV__ ? (
          <ThemedText type="caption" style={styles.errorBody}>
            {state.message}
          </ThemedText>
        ) : (
          <ThemedText type="default" style={styles.hint}>
            Try closing the app and opening it again. If this continues, reinstall the latest build.
          </ThemedText>
        )}
        <Button
          variant="primary"
          onPress={() => {
            setState({ phase: 'loading' });
            setRetryKey((key) => key + 1);
          }}
        >
          Retry
        </Button>
      </ThemedView>
    );
  }

  const { Screen } = state;
  return <Screen />;
}

const styles = {
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  placeholder: {
    minHeight: 160,
    width: '100%',
  },
  hint: {
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 22,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorBody: {
    textAlign: 'center',
    opacity: 0.85,
  },
} as const;
