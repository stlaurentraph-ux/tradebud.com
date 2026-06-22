import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';
import { scaleText } from '@/features/demo/storeUiScale';

export function createSecondPlotOverlapTipStyles(c: AppColors) {
  return StyleSheet.create({
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: c.surfaceAccentBorder,
    backgroundColor: c.surfaceAccent,
    borderRadius: 16,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: c.linkStrong,
    fontSize: scaleText(15),
  },
  body: {
    color: c.link,
    lineHeight: scaleText(20),
  },
  dismissBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 4,
  },
  dismissText: {
    color: c.link,
    fontSize: scaleText(14),
  },
  closeBtn: {
    padding: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
}
