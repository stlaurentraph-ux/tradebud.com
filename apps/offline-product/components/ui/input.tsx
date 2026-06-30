import { forwardRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  Pressable,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/features/theme/useThemedStyles';

export interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  error?: boolean;
  /** Tighter padding for compact forms (e.g. auth sheets). */
  dense?: boolean;
  /** Show eye toggle when `secureTextEntry` is true (default: true). */
  passwordVisibleToggle?: boolean;
  /** Accessibility label when password is hidden. */
  showPasswordA11yLabel?: string;
  /** Accessibility label when password is visible. */
  hidePasswordA11yLabel?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      style,
      containerStyle,
      error = false,
      dense = false,
      secureTextEntry,
      passwordVisibleToggle,
      showPasswordA11yLabel = 'Show password',
      hidePasswordA11yLabel = 'Hide password',
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const colors = useAppColors();
    const showPasswordToggle = secureTextEntry === true && (passwordVisibleToggle ?? true);
    const effectiveSecureEntry = showPasswordToggle ? !passwordVisible : secureTextEntry;

    return (
      <View style={containerStyle}>
        {label ? (
          <Text style={[styles.label, dense && styles.labelDense, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.container,
            dense && styles.containerDense,
            showPasswordToggle && styles.containerWithToggle,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error
                ? colors.error
                : focused
                  ? colors.inputBorderFocus
                  : colors.inputBorder,
            },
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, showPasswordToggle && styles.inputWithToggle, { color: colors.text }, style]}
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry={effectiveSecureEntry}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {showPasswordToggle ? (
            <Pressable
              onPress={() => setPasswordVisible((prev) => !prev)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? hidePasswordA11yLabel : showPasswordA11yLabel}
              style={styles.toggleBtn}
            >
              <Ionicons
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    ...Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  labelDense: {
    marginBottom: 2,
  },
  container: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  containerDense: {
    paddingVertical: 10,
  },
  containerWithToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  input: {
    ...Typography.sizes.base,
    padding: 0,
  },
  inputWithToggle: {
    flex: 1,
    minWidth: 0,
  },
  toggleBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: 4,
  },
});
