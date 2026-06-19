import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

type CaptureInstructionsLinkProps = {
  onPress: () => void;
  label: string;
  hint?: string;
};

/** Collapsed “Instructions” affordance — full steps open in an alert from the parent screen. */
export function CaptureInstructionsLink({ onPress, label, hint }: CaptureInstructionsLinkProps) {
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
      <Ionicons name="chevron-down-circle-outline" size={20} color="#0A7F59" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 2,
  },
  label: {
    color: '#0A7F59',
  },
  pressed: {
    opacity: 0.72,
  },
});
