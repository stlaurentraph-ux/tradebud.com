import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createPlotTenureStatusCardStyles(c: AppColors) {
  return StyleSheet.create({
  card: { marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  headerBadgeWrap: {
    flexShrink: 0,
    marginTop: 2,
    maxWidth: '48%',
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  noteBlock: {
    marginTop: 4,
    marginBottom: 8,
    gap: 4,
  },
  countsRow: {
    gap: 4,
    marginBottom: 8,
  },
  muted: {
    opacity: 0.75,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  openDocsWrap: {
    marginTop: 4,
  },
});
}
