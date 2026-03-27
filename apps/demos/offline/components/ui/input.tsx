import { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Radius, Spacing, Typography, TouchTargets } from '@/constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const inputBg = useThemeColor({}, 'inputBackground');
    const inputBorder = useThemeColor({}, 'inputBorder');
    const inputBorderFocus = useThemeColor({}, 'inputBorderFocus');
    const placeholderColor = useThemeColor({}, 'inputPlaceholder');
    const errorColor = useThemeColor({}, 'error');

    const getBorderColor = () => {
      if (error) return errorColor;
      if (isFocused) return inputBorderFocus;
      return inputBorder;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        )}
        
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: inputBg,
              borderColor: getBorderColor(),
            },
            isFocused && styles.inputWrapperFocused,
            error && styles.inputWrapperError,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: textColor },
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            placeholderTextColor={placeholderColor}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        
        {(error || hint) && (
          <Text
            style={[
              styles.helperText,
              { color: error ? errorColor : textSecondary },
            ]}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    minHeight: TouchTargets.comfortable,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderWidth: 2,
  },
  inputWrapperError: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    ...Typography.sizes.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xs,
  },
  iconLeft: {
    paddingLeft: Spacing.md,
  },
  iconRight: {
    paddingRight: Spacing.md,
  },
  helperText: {
    ...Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
});
