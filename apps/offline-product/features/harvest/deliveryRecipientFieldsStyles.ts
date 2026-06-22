import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createDeliveryRecipientFieldsStyles(c: AppColors) {
  return StyleSheet.create({
  wrap: { gap: 10 },
  gapSm: { gap: 6 },
  sectionLabel: { color: c.text, fontWeight: '600' },
  hint: { color: c.textMuted },
  optionHint: { color: c.textMuted, marginTop: 2 },
  optionCard: { padding: 10, borderRadius: 12 },
  noBuyersCard: { padding: 12, borderRadius: 12, gap: 4 },
  optionCardSelected: { borderColor: c.link, backgroundColor: c.surfaceAccent },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: c.backgroundCard,
  },
  emailInputActive: { borderColor: c.link },
});
}
