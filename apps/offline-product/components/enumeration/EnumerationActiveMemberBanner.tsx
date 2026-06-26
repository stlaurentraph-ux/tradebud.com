import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import type { FieldRosterEntry } from '@/features/enumeration/fieldRosterTypes';
import { useLanguage } from '@/features/state/LanguageContext';

type Props = {
  member: FieldRosterEntry;
};

export function EnumerationActiveMemberBanner({ member }: Props) {
  const { t } = useLanguage();

  return (
    <Card variant="outlined" style={styles.card} testID="enumeration-active-member-banner">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-circle-outline" size={22} color={Brand.primary} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="caption" style={styles.label}>
            {t('enumeration_mapping_for')}
          </ThemedText>
          <ThemedText type="defaultSemiBold">{member.fullName}</ThemedText>
          <ThemedText type="caption">{member.village}</ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 12,
    borderColor: Brand.primary,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.14)',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
});
