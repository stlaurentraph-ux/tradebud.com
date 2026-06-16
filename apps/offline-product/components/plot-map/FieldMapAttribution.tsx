import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/features/state/LanguageContext';
import { resolveFieldMapTileMode } from '@/features/mapping/fieldMapTiles';

export function FieldMapAttribution(props: {
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
}) {
  const { t } = useLanguage();
  const mode = resolveFieldMapTileMode(props);
  if (mode === 'none') return null;

  return (
    <View style={styles.chip} pointerEvents="none">
      <ThemedText type="caption" style={styles.text}>
        {mode === 'offline' ? t('walk_offline_tiles') : t('walk_map_satellite_online')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFFFFFE8',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '72%',
  },
  text: {
    fontSize: 10,
    lineHeight: 14,
    color: '#374151',
  },
});
