import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createOfflineMapsScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    introRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    introBody: {
      marginTop: 8,
      color: c.textMuted,
      lineHeight: 18,
    },
    progressBox: {
      marginTop: 16,
      alignItems: 'center',
      gap: 8,
    },
    packRow: {
      marginTop: 12,
      gap: 4,
    },
    emptyCaption: {
      marginTop: 8,
      color: c.textMuted,
    },
  });
}
