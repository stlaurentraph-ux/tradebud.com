import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createCaptureInstructionsLinkStyles(c: AppColors) {
  return StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 2,
  },
  label: {
    color: c.link,
  },
  pressed: {
    opacity: 0.72,
  },
});
}
