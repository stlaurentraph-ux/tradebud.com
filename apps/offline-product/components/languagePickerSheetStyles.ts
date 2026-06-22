import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createLanguagePickerSheetStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'flex-end',
      padding: 16,
      paddingBottom: 28,
    },
    card: {
      backgroundColor: c.backgroundElevated,
      borderRadius: Radius.xl,
      maxHeight: '78%',
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: c.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
      color: c.tint,
    },
    list: {
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: Radius.lg,
      marginBottom: 4,
    },
    rowSelected: {
      backgroundColor: c.chipBackgroundActive,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    code: {
      color: c.textMuted,
    },
  });
}
