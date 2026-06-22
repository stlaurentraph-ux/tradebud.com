import { forwardRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/features/theme/useThemedStyles';

export interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  error?: boolean;
  /** Tighter padding for compact forms (e.g. auth sheets). */
  dense?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, style, containerStyle, error = false, dense = false, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const colors = useAppColors();

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
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={colors.inputPlaceholder}
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
  input: {
    ...Typography.sizes.base,
    padding: 0,
  },
});
