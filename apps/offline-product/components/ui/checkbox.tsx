import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing, Typography, TouchTargets } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  style,
}: CheckboxProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const disabledColor = useThemeColor({}, 'buttonDisabled');
  const inverseText = useThemeColor({}, 'textInverse');

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      style={[styles.container, disabled && styles.disabled, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: disabled ? disabledColor : checked ? tintColor : borderColor,
            backgroundColor: checked ? (disabled ? disabledColor : tintColor) : 'transparent',
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={16} color={inverseText} />}
      </View>

      {(label || description) && (
        <View style={styles.content}>
          {label && (
            <Text style={[styles.label, { color: disabled ? textSecondary : textColor }]}>
              {label}
            </Text>
          )}
          {description && <Text style={[styles.description, { color: textSecondary }]}>{description}</Text>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: TouchTargets.minimum,
    gap: Spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  description: {
    ...Typography.sizes.sm,
  },
});

