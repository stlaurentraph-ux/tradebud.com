import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createReceiptDetailScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 42,
      gap: 8,
    },
    backPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 72,
    },
    langPill: {
      minWidth: 54,
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 9999,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    container: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    freshBanner: {
      borderColor: c.surfaceAccentBorder,
      backgroundColor: c.surfaceAccent,
      padding: 12,
    },
    freshBannerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    freshBannerText: {
      color: c.linkStrong,
      flex: 1,
    },
    loadingCard: {
      padding: 16,
      gap: 8,
    },
    notFoundBody: {
      marginTop: 6,
      color: c.textMuted,
      lineHeight: 20,
    },
    syncActions: {
      gap: 10,
      marginTop: 4,
    },
    syncBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    syncSuccess: {
      backgroundColor: c.surfaceAccent,
      borderColor: c.surfaceAccentBorder,
    },
    syncError: {
      backgroundColor: c.surfaceWarning,
      borderColor: c.surfaceWarningBorder,
    },
    syncInfo: {
      backgroundColor: c.chipBackground,
      borderColor: c.chipBorder,
    },
    syncText: {
      flex: 1,
      color: c.text,
      lineHeight: 20,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
    },
    linkText: { color: c.link },
  });
}
