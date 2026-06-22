import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createExploreScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    containerCompact: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    emptyPlotsCard: {
      borderRadius: 18,
      borderColor: c.surfaceAccentBorder,
      backgroundColor: c.surfaceAccent,
      padding: 20,
      alignItems: 'center',
      gap: 8,
    },
    emptyPlotsIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: c.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyPlotsTitle: {
      color: c.helpTitle,
      textAlign: 'center',
    },
    emptyPlotsBody: {
      color: c.helpText,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyPlotsCta: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.link,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 18,
      minHeight: 48,
    },
    emptyPlotsCtaText: { color: '#FFFFFF' },
    pickerHintCard: {
      borderRadius: 14,
      borderColor: c.surfaceAccentBorder,
      backgroundColor: c.surfaceAccent,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    pickerHintText: {
      color: c.helpText,
      lineHeight: 18,
    },
    plotProtoCard: { borderRadius: 18, padding: 12 },
    plotProtoCardSelected: { borderColor: c.link, borderWidth: 1.8 },
    plotCardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    plotCardBody: { flex: 1, minWidth: 0 },
    plotName: { flex: 1 },
    areaCaption: { marginTop: 4, color: c.textMuted },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    plotMetaRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    plotMetaItem: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    plotMetaText: {
      flexShrink: 1,
      color: c.textMuted,
      fontSize: 12,
    },
    registerNewPlotCard: {
      marginTop: 6,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.dashedBorder,
      borderRadius: 18,
      backgroundColor: c.dashedSurface,
      minHeight: 90,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    registerNewPlotLink: {
      color: c.link,
    },
  });
}
