import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AutoPlotUploadBridge } from '@/components/AutoPlotUploadBridge';
import { ConsentPushBridge } from '@/components/ConsentPushBridge';
import { AppErrorBoundary } from '@/components/observability/AppErrorBoundary';
import { PushRegistrationBridge } from '@/components/PushRegistrationBridge';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SignInProvider } from '@/features/auth/SignInSheetContext';
import { initObservability } from '@/features/observability/initObservability';
import { AppStateProvider } from '@/features/state/AppStateContext';
import { LanguageProvider } from '@/features/state/LanguageContext';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
initObservability();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <AppStateProvider>
          <SignInProvider>
            <AutoPlotUploadBridge />
            <PushRegistrationBridge />
            <ConsentPushBridge />
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="documents" options={{ headerShown: false }} />
                <Stack.Screen name="plot/[id]" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </SignInProvider>
        </AppStateProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}
