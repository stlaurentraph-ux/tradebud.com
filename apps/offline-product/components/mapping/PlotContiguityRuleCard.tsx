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
          <Ionicons name="trail-sign-outline" size={22} color="#2454D7" />
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
    borderColor: '#C9D9EE',
    backgroundColor: '#EAF1FB',
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
    backgroundColor: '#DCE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: scaleText(15),
  },
  body: {
    color: '#475569',
    lineHeight: scaleText(20),
  },
});
