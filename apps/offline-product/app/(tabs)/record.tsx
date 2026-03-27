import { ThemedView } from '@/components/themed-view';
import { WalkPerimeterScreen } from '@/features/mapping/WalkPerimeterScreen';

export default function RecordScreen() {
  return (
    <ThemedView style={styles.screen}>
      <WalkPerimeterScreen />
    </ThemedView>
  );
}

const styles = { screen: { flex: 1 } } as const;

