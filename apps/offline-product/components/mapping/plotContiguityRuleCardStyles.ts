import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';
import { scaleText } from '@/features/demo/storeUiScale';

export function createPlotContiguityRuleCardStyles(c: AppColors) {
  return StyleSheet.create({
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: c.surfaceWarningBorder,
    backgroundColor: c.surfaceWarning,
    borderRadius: 16,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.surfaceWarning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: c.textWarning,
    fontSize: scaleText(15),
  },
  body: {
    color: c.textWarningStrong,
    lineHeight: scaleText(20),
  },
});
}
