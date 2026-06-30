import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { StyleSheet } from 'react-native';

type FieldMapOfflineBannerProps = {
  gpsStillWorks?: boolean;
};

export function FieldMapOfflineBanner({ gpsStillWorks = true }: FieldMapOfflineBannerProps) {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.banner}
      onPress={() => router.push('/offline-maps' as Href)}
      testID="field-map-offline-banner"
    >
      <Ionicons name="cloud-offline-outline" size={20} color={Brand.primary} />
      <View style={styles.textBlock}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {t('walk_map_offline_banner_title')}
        </ThemedText>
        <ThemedText type="caption" style={styles.body}>
          {gpsStillWorks ? t('walk_map_offline_banner_body') : t('walk_map_offline_banner_body_no_gps')}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Brand.primary} />
    </Pressable>
  );
}

const createStyles = () =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#D1FAE5',
      backgroundColor: '#ECFDF5',
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: Brand.primary,
    },
    body: {
      color: '#4B5563',
      lineHeight: 18,
    },
  });
