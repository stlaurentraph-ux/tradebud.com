import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { type MapViewProps } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { isAndroidGoogleMapsConfigured } from '@/features/mapping/androidMapsConfig';
import { useLanguage } from '@/features/state/LanguageContext';

export const FieldMapView = forwardRef<MapView, MapViewProps>(function FieldMapView(props, ref) {
  const { t } = useLanguage();
  const mapsUnavailable = Platform.OS === 'android' && !isAndroidGoogleMapsConfigured();

  if (mapsUnavailable) {
    return (
      <View style={[props.style, styles.fallback]} accessibilityRole="text">
        <ThemedText type="defaultSemiBold" style={styles.fallbackTitle}>
          {t('android_maps_not_configured_title')}
        </ThemedText>
        <ThemedText type="caption" style={styles.fallbackBody}>
          {t('android_maps_not_configured_body')}
        </ThemedText>
      </View>
    );
  }

  return <MapView ref={ref} {...props} />;
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EDEA',
    paddingHorizontal: 20,
    gap: 8,
  },
  fallbackTitle: {
    textAlign: 'center',
  },
  fallbackBody: {
    textAlign: 'center',
    opacity: 0.85,
  },
});
