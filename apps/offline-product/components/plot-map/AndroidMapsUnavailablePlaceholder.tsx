import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/features/state/LanguageContext';

export function AndroidMapsUnavailablePlaceholder(props: {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  testID?: string;
}) {
  const { t } = useLanguage();
  const iconSize = props.iconSize ?? 32;

  return (
    <View
      testID={props.testID ?? 'field-map-unavailable'}
      style={[styles.root, props.style]}
    >
      <Ionicons name="map-outline" size={iconSize} color="#6B9080" />
      <ThemedText type="caption" style={styles.text}>
        {t('plot_map_android_unavailable')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#E8F2ED',
    borderWidth: 1,
    borderColor: '#C5DDD3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  text: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
