import { useColorScheme as useRNColorScheme } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

/** Normalizes RN `ColorSchemeName` (includes `unspecified`) to app theme keys. */
export function useColorScheme(): AppColorScheme {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
