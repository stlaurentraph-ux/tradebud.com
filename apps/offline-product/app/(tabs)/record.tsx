import { ThemedView } from '@/components/themed-view';
import { MappingScreenLoader } from '@/features/mapping/MappingScreenLoader';

export default function RecordScreen() {
  return (
    <ThemedView style={styles.screen}>
      <MappingScreenLoader />
    </ThemedView>
  );
}

const styles = { screen: { flex: 1 } } as const;
