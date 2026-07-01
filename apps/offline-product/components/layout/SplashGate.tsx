import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { markAppInteractive } from '@/features/observability/markAppInteractive';
import { useAppState } from '@/features/state/AppStateContext';
import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';

const SPLASH_FADE_MS = 350;
const MAESTRO_CI_SPLASH_FADE_MS = 0;

/**
 * Hides the native splash only after AppState boot completes (SQLite + disk load).
 * Keeps the branded splash visible instead of flashing a blank frame before Home.
 * On boot failure, shows a recovery screen rather than an empty Home that could
 * mask (and overwrite) the farmer's saved data.
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const { isAppReady, bootError, retryBoot } = useAppState();

  useEffect(() => {
    if (!isAppReady) return;

    const hide = async () => {
      try {
        const fadeMs = shouldUseMaestroCiThinBoot() ? MAESTRO_CI_SPLASH_FADE_MS : SPLASH_FADE_MS;
        if (typeof SplashScreen.setOptions === 'function' && fadeMs > 0) {
          SplashScreen.setOptions({ fade: true, duration: fadeMs });
        }
        await SplashScreen.hideAsync();
        markAppInteractive();
      } catch {
        // Splash may already be hidden in dev fast refresh.
      }
    };

    void hide();
  }, [isAppReady]);

  if (bootError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Couldn’t open your saved data</Text>
        <Text style={styles.body}>
          Your offline storage didn’t load. Your data is still on this device — please retry. If
          this keeps happening, restart the app before signing in again.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading saved data"
          onPress={retryBoot}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
