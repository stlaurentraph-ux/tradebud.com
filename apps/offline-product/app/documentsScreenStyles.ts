import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createDocumentsScreenStyles(c: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  headerRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    minWidth: 54,
    justifyContent: 'center',
  },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  heroCard: { gap: 6 },
  heroBody: { color: c.textSecondary, marginTop: 4 },
  card: { marginTop: 2 },
  rowCard: { padding: 12 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  plotName: {
    flex: 1,
    minWidth: 0,
  },
  emptyPlots: { gap: 10 },
});
}
