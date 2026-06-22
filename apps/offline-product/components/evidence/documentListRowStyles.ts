import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createDocumentListRowStyles(c: AppColors) {
  return StyleSheet.create({
  rowCard: { padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressableMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: c.chipBackground,
    flexShrink: 0,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: c.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  badgeWrap: {
    flexShrink: 0,
    maxWidth: '42%',
  },
  statusWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  deleteBtn: {
    padding: 6,
    flexShrink: 0,
  },
});
}
