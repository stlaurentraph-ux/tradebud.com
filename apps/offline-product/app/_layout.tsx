import 'react-native-reanimated';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AutoPlotUploadBridge } from '@/components/AutoPlotUploadBridge';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { StartupConfigGate } from '@/components/StartupConfigGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStateProvider } from '@/features/state/AppStateContext';
import { LanguageProvider } from '@/features/state/LanguageContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <RootErrorBoundary>
      <StartupConfigGate>
        <LanguageProvider>
          <AppStateProvider>
            <AutoPlotUploadBridge />
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="documents" options={{ headerShown: false }} />
                <Stack.Screen name="plot/[id]" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </AppStateProvider>
        </LanguageProvider>
      </StartupConfigGate>
    </RootErrorBoundary>
  );
}
