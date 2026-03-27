import { forwardRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  error?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, style, containerStyle, error = false, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const background = useThemeColor({}, 'background');
    const colors = background === Colors.dark.background ? Colors.dark : Colors.light;

    return (
      <View style={containerStyle}>
        {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
        <View
          style={[
            styles.container,
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
  container: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  input: {
    ...Typography.sizes.base,
    padding: 0,
  },
});

