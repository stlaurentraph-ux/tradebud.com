import { StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createProducerDeclarationsSectionStyles(c: AppColors) {
  return StyleSheet.create({
  section: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.backgroundCard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  subtitle: {
    color: c.textMuted,
    lineHeight: 20,
  },
  declarationItem: {
    paddingVertical: 6,
  },
  savedBlock: {
    gap: 8,
    marginTop: 2,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  savedRowText: {
    flex: 1,
    color: c.text,
    lineHeight: 20,
  },
  savedAt: {
    color: c.textMuted,
    marginTop: 2,
  },
  error: {
    color: Brand.deforestationDetected,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
});
}
