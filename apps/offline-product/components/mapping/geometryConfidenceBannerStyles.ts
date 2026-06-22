import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createGeometryConfidenceBannerStyles(c: AppColors) {
  return StyleSheet.create({
  banner: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
  },
  body: {
    opacity: 0.85,
    lineHeight: 18,
  },
  cta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  ctaText: {
    color: c.link,
    fontSize: 14,
  },
});
}
