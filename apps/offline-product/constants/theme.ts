/**
 * Tracebud Design System
 *
 * A warm, approachable design system optimized for rural field workers.
 * Features:
 * - High contrast for outdoor visibility
 * - Large touch targets (min 48px)
 * - Earthy, natural color palette
 * - Clear visual hierarchy
 */

import { Platform } from 'react-native';

// Primary brand colors aligned with BRANDING.md ("High-Tech Organic")
export const Brand = {
  // Forest canopy
  primary: '#064E3B',
  primaryLight: '#065F46',
  primaryDark: '#022C22',

  // Data emerald action accent
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#78350F',

  // Status badge colors for compliance
  compliant: '#38A169',
  degradationRisk: '#DD6B20',
  deforestationDetected: '#C53030',
};

// Semantic color tokens
export const Colors = {
  light: {
    // Text hierarchy
    text: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',

    // Backgrounds
    background: '#F9FAFB',
    backgroundSecondary: '#F3F4F6',
    backgroundCard: '#FFFFFF',
    backgroundElevated: '#FFFFFF',

    // Interactive
    tint: Brand.primary,
    tintSecondary: Brand.primaryLight,
    accent: Brand.accent,

    // Borders & dividers
    border: '#E5E7EB',
    borderStrong: '#D1D5DB',
    divider: '#E5E7EB',

    // Icons
    icon: '#4B5563',
    iconMuted: '#9CA3AF',

    // Tab bar
    tabIconDefault: '#6B7280',
    tabIconSelected: Brand.primary,
    tabBackground: '#FFFFFF',

    // Status
    success: Brand.success,
    warning: Brand.warning,
    error: Brand.error,

    // Input fields
    inputBackground: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputBorderFocus: Brand.primary,
    inputPlaceholder: '#6B7280',

    // Buttons
    buttonPrimary: Brand.accent,
    buttonPrimaryText: Brand.primary,
    buttonSecondary: Brand.primary,
    buttonSecondaryText: '#FFFFFF',
    buttonDisabled: '#E5E7EB',
    buttonDisabledText: '#9CA3AF',
  },
  dark: {
    // Text hierarchy
    text: '#F9FAFB',
    textSecondary: '#E5E7EB',
    textMuted: '#9CA3AF',
    textInverse: '#111827',

    // Backgrounds
    background: '#111827',
    backgroundSecondary: '#1F2937',
    backgroundCard: '#111827',
    backgroundElevated: '#1F2937',

    // Interactive
    tint: Brand.accentLight,
    tintSecondary: Brand.primaryLight,
    accent: Brand.accentLight,

    // Borders & dividers
    border: '#374151',
    borderStrong: '#4B5563',
    divider: '#374151',

    // Icons
    icon: '#E5E7EB',
    iconMuted: '#9CA3AF',

    // Tab bar
    tabIconDefault: '#9CA3AF',
    tabIconSelected: Brand.accentLight,
    tabBackground: '#111827',

    // Status
    success: '#34D399',
    warning: '#FBBF24',
    error: '#D97706',

    // Input fields
    inputBackground: '#1F2937',
    inputBorder: '#374151',
    inputBorderFocus: Brand.accentLight,
    inputPlaceholder: '#9CA3AF',

    // Buttons
    buttonPrimary: Brand.accentLight,
    buttonPrimaryText: Brand.primaryDark,
    buttonSecondary: Brand.primary,
    buttonSecondaryText: '#FFFFFF',
    buttonDisabled: '#374151',
    buttonDisabledText: '#9CA3AF',
  },
};

// Typography scale - optimized for outdoor readability
export const Typography = {
  // Font sizes with line heights
  sizes: {
    xs: { fontSize: 12, lineHeight: 16 },
    sm: { fontSize: 14, lineHeight: 20 },
    base: { fontSize: 16, lineHeight: 24 },
    lg: { fontSize: 18, lineHeight: 28 },
    xl: { fontSize: 20, lineHeight: 28 },
    '2xl': { fontSize: 24, lineHeight: 32 },
    '3xl': { fontSize: 28, lineHeight: 36 },
    '4xl': { fontSize: 32, lineHeight: 40 },
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Spacing scale (in pixels)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
};

// Border radius
export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows for elevation
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Touch target sizes (accessibility)
export const TouchTargets = {
  minimum: 44, // Minimum recommended by Apple/Google
  comfortable: 48,
  large: 56, // For primary actions in field conditions
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
