import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import { scaleText } from '@/features/demo/storeUiScale';

type PlotContiguityRuleCardProps = {
  t: TranslateFn;
};

/** EUDR contiguity — one field per plot; split at roads/rivers/railways. */
export function PlotContiguityRuleCard({ t }: PlotContiguityRuleCardProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={22} color="#D97706" />
        </View>
        <View style={styles.copy}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {t('walk_contiguity_title')}
          </ThemedText>
          <ThemedText type="caption" style={styles.body}>
            {t('walk_contiguity_body')}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#92400E',
    fontSize: scaleText(15),
  },
  body: {
    color: '#B45309',
    lineHeight: scaleText(20),
  },
});
