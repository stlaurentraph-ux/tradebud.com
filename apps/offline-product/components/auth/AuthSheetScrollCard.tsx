import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';

type AuthSheetScrollCardProps = {
  children: ReactNode;
  styles: ReturnType<typeof createAuthSheetStyles>;
  cardStyle?: StyleProp<ViewStyle>;
};

/** Bottom auth sheet body — scrollable when the keyboard covers email/password fields. */
export function AuthSheetScrollCard({ children, styles, cardStyle }: AuthSheetScrollCardProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxHeight =
    windowHeight - insets.top - Math.max(insets.bottom, Spacing.sm) - Spacing.md;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
      bounces={false}
      style={[styles.cardScroll, { maxHeight }]}
      contentContainerStyle={styles.cardScrollContent}
    >
      <View style={[styles.card, cardStyle]}>{children}</View>
    </ScrollView>
  );
}
