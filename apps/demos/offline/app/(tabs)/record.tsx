import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WalkPerimeterScreen } from '@/features/mapping/WalkPerimeterScreen';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppState } from '@/features/state/AppStateContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Spacing } from '@/constants/theme';

export default function RecordScreen() {
  const { t } = useLanguage();
  const { farmer } = useAppState();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const cardBg = useThemeColor({}, 'backgroundCard');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf" size={28} color={Brand.primary} />
            <ThemedText type="title" style={styles.logoText}>
              Tracebud
            </ThemedText>
          </View>
          <ThemedText type="caption">{t('home_intro')}</ThemedText>
        </View>

        {farmer && (
          <View style={styles.farmerBadge}>
            <Ionicons name="person-circle" size={20} color={Brand.primary} />
            <ThemedText type="defaultSemiBold" style={styles.farmerName}>
              {farmer.name || farmer.id}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={[styles.mainContent, { backgroundColor }]}>
        <WalkPerimeterScreen />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  headerContent: {
    gap: Spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    color: Brand.primary,
  },
  farmerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#E6F7EF',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  farmerName: {
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
  },
});
