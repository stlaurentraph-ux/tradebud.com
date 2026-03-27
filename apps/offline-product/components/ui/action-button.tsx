import React, { type ReactNode } from 'react';
import type { GestureResponderEvent, TextStyle, ViewStyle } from 'react-native';
import { Button, type ButtonProps } from './button';

/**
 * Drop-in replacement for React Native's `<Button title=... />`
 * that renders using our v0 design system `<Button>`.
 *
 * This makes it easy to migrate screens without rewriting every callsite.
 */
export type ActionButtonProps = {
  /** Label when not using children (RN-style `<Button title="…" />`). */
  title?: string;
  children?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export function ActionButton({
  title,
  children,
  style,
  textStyle,
  onPress,
  disabled,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth = true,
  icon,
  iconRight,
}: ActionButtonProps) {
  const label = children ?? title ?? '';
  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      onPress={onPress}
      fullWidth={fullWidth}
      icon={icon}
      iconRight={iconRight}
      style={style}
      textStyle={textStyle}
    >
      {label}
    </Button>
  );
}

