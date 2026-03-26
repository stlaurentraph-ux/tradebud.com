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

// Primary brand colors - warm earth tones
export const Brand = {
  // Primary green - represents growth, agriculture, trust
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryDark: '#1B4332',
  
  // Accent - warm amber for calls to action
  accent: '#E07D1B',
  accentLight: '#F4A261',
  accentDark: '#B86314',
  
  // Success, warning, error states
  success: '#38A169',
  warning: '#DD6B20',
  error: '#C53030',
  
  // Status badge colors for compliance
  compliant: '#38A169',
  degradationRisk: '#DD6B20', 
  deforestationDetected: '#C53030',
};

// Semantic color tokens
export const Colors = {
  light: {
    // Text hierarchy
    text: '#1A202C',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    textInverse: '#FFFFFF',
    
    // Backgrounds
    background: '#FFFBF5', // Warm off-white
    backgroundSecondary: '#FEF5E7', // Cream
    backgroundCard: '#FFFFFF',
    backgroundElevated: '#FFFFFF',
    
    // Interactive
    tint: Brand.primary,
    tintSecondary: Brand.primaryLight,
    accent: Brand.accent,
    
    // Borders & dividers
    border: '#E8DFD4',
    borderStrong: '#D4C9BC',
    divider: '#E8DFD4',
    
    // Icons
    icon: '#4A5568',
    iconMuted: '#A0AEC0',
    
    // Tab bar
    tabIconDefault: '#718096',
    tabIconSelected: Brand.primary,
    tabBackground: '#FFFFFF',
    
    // Status
    success: Brand.success,
    warning: Brand.warning,
    error: Brand.error,
    
    // Input fields
    inputBackground: '#FFFFFF',
    inputBorder: '#D4C9BC',
    inputBorderFocus: Brand.primary,
    inputPlaceholder: '#A0AEC0',
    
    // Buttons
    buttonPrimary: Brand.primary,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#F7F4F1',
    buttonSecondaryText: Brand.primary,
    buttonDisabled: '#E2E8F0',
    buttonDisabledText: '#A0AEC0',
  },
  dark: {
    // Text hierarchy
    text: '#F7FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#A0AEC0',
    textInverse: '#1A202C',
    
    // Backgrounds
    background: '#1A1F16',
    backgroundSecondary: '#252B21',
    backgroundCard: '#2D3428',
    backgroundElevated: '#353D30',
    
    // Interactive
    tint: Brand.primaryLight,
    tintSecondary: Brand.primary,
    accent: Brand.accentLight,
    
    // Borders & dividers
    border: '#3D4637',
    borderStrong: '#4A5542',
    divider: '#3D4637',
    
    // Icons
    icon: '#E2E8F0',
    iconMuted: '#718096',
    
    // Tab bar
    tabIconDefault: '#718096',
    tabIconSelected: Brand.primaryLight,
    tabBackground: '#252B21',
    
    // Status
    success: '#68D391',
    warning: '#F6AD55',
    error: '#FC8181',
    
    // Input fields
    inputBackground: '#2D3428',
    inputBorder: '#4A5542',
    inputBorderFocus: Brand.primaryLight,
    inputPlaceholder: '#718096',
    
    // Buttons
    buttonPrimary: Brand.primaryLight,
    buttonPrimaryText: '#1A202C',
    buttonSecondary: '#353D30',
    buttonSecondaryText: Brand.primaryLight,
    buttonDisabled: '#2D3428',
    buttonDisabledText: '#718096',
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
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border radius
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

// Shadows for elevation
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
