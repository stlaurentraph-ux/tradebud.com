import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WalkPerimeterScreen } from '@/features/mapping/WalkPerimeterScreen';
import { useLanguage } from '@/features/state/LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('home_title')}</ThemedText>
      <ThemedText>{t('home_intro')}</ThemedText>
      <WalkPerimeterScreen />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
