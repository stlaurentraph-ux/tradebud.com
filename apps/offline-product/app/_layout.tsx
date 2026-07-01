import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { AppMetricsRoot } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { MaestroCiLayoutBridges } from '@/components/MaestroCiLayoutBridges';
import { AppErrorBoundary } from '@/components/observability/AppErrorBoundary';
import { SplashGate } from '@/components/layout/SplashGate';
import { MaestroBootReadyMarker } from '@/components/layout/MaestroBootReadyMarker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignInProvider } from '@/features/auth/SignInSheetContext';
import { initObservability } from '@/features/observability/initObservability';
import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';
import '@/features/auth/googleOAuthEnv';
import { AppStateProvider } from '@/features/state/AppStateContext';
import { LanguageProvider } from '@/features/state/LanguageContext';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
initObservability();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <AppStateProvider>
          <View style={{ flex: 1 }}>
            <SplashGate>
              <SignInProvider>
                <MaestroCiLayoutBridges />
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    <Stack.Screen name="documents" options={{ headerShown: false }} />
                    <Stack.Screen name="data-sharing" options={{ headerShown: false }} />
                    <Stack.Screen name="plot/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="receipt/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="offline-maps" options={{ headerShown: false }} />
                    <Stack.Screen name="why-tracebud" options={{ headerShown: false }} />
                    <Stack.Screen name="activity" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </SignInProvider>
            </SplashGate>
            <MaestroBootReadyMarker />
          </View>
        </AppStateProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

export default shouldUseMaestroCiThinBoot() ? RootLayout : AppMetricsRoot.wrap(RootLayout);
