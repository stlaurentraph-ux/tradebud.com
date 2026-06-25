import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';

type AuthMethodOrDividerProps = {
  label: string;
};

export function AuthMethodOrDivider({ label }: AuthMethodOrDividerProps) {
  const styles = useThemedStyles(createAuthSheetStyles);

  return (
    <View style={styles.authOrRow} accessibilityRole="text">
      <View style={styles.authOrLine} />
      <ThemedText type="caption" style={styles.authOrText}>
        {label}
      </ThemedText>
      <View style={styles.authOrLine} />
    </View>
  );
}
