import { useMemo } from 'react';
import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type AppColors = (typeof Colors)['light'];

export function useAppColors(): AppColors {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: AppColors, isDark: boolean) => T,
): T {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  return useMemo(() => StyleSheet.create(factory(colors, isDark)), [colors, isDark]);
}
