import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useFieldTabBarBottomInset } from '@/features/layout/fieldTabBarBottomInset';

type FieldTabBarProps = BottomTabBarProps & {
  chromeStyle?: ViewStyle;
};

/**
 * Bottom tab chrome with Android edge-to-edge inset handling.
 * BottomTabBar's own paddingBottom is disabled in tabBarStyle; this wrapper owns bottom inset.
 */
export function FieldTabBar({ chromeStyle, ...props }: FieldTabBarProps) {
  const bottomInset = useFieldTabBarBottomInset();

  return (
    <View style={[styles.chrome, chromeStyle, { paddingBottom: bottomInset }]}>
      <BottomTabBar {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    flexGrow: 0,
  },
});
