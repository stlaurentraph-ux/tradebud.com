import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createPlotComplianceStatusCardsStyles(c: AppColors) {
  return StyleSheet.create({
  stack: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bodyText: {
    color: c.text,
    lineHeight: 22,
  },
  meta: {
    color: c.textMuted,
    marginTop: 2,
  },
});
}
