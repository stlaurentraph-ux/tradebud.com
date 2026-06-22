import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createCaptureInstructionsLinkStyles } from '@/components/mapping/captureInstructionsLinkStyles';

type CaptureInstructionsLinkProps = {
  onPress: () => void;
  label: string;
  hint?: string;
};

/** Collapsed “Instructions” affordance — full steps open in an alert from the parent screen. */
export function CaptureInstructionsLink({ onPress, label, hint }: CaptureInstructionsLinkProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createCaptureInstructionsLinkStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {label}
      </ThemedText>
      <Ionicons name="chevron-down-circle-outline" size={20} color={colors.link} />
    </Pressable>
  );
}

