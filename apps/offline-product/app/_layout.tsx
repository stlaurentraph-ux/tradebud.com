import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AutoPlotUploadBridge } from '@/components/AutoPlotUploadBridge';
import { ConsentPushBridge } from '@/components/ConsentPushBridge';
import { AppErrorBoundary } from '@/components/observability/AppErrorBoundary';
import { PushRegistrationBridge } from '@/components/PushRegistrationBridge';
import { SplashGate } from '@/components/layout/SplashGate';
import { LauncherRouteReset } from '@/components/layout/LauncherRouteReset';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignInProvider } from '@/features/auth/SignInSheetContext';
import { EnumerationProvider } from '@/features/enumeration/EnumerationContext';
import { initObservability } from '@/features/observability/initObservability';
import '@/features/auth/googleOAuthEnv';
import { AppStateProvider } from '@/features/state/AppStateContext';
import { LanguageProvider } from '@/features/state/LanguageContext';
import { initDatabase } from '@/features/state/persistence';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
void initDatabase();
initObservability();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <AppErrorBoundary>
        <AppStateProvider>
          <SplashGate>
            <SignInProvider>
              <EnumerationProvider>
              <AutoPlotUploadBridge />
              <PushRegistrationBridge />
              <ConsentPushBridge />
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <LauncherRouteReset />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  <Stack.Screen name="documents" options={{ headerShown: false }} />
                  <Stack.Screen name="campaign" options={{ headerShown: false }} />
                  <Stack.Screen name="data-sharing" options={{ headerShown: false }} />
                  <Stack.Screen name="plot/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="receipt/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="offline-maps" options={{ headerShown: false }} />
                  <Stack.Screen name="why-tracebud" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
              </EnumerationProvider>
            </SignInProvider>
          </SplashGate>
        </AppStateProvider>
      </AppErrorBoundary>
    </LanguageProvider>
  );
}
