import { Button, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useWalkPerimeter } from './useWalkPerimeter';

export function WalkPerimeterScreen() {
  const { points, area, precisionMeters, isRecording, lastError, startRecording, stopRecording, reset } =
    useWalkPerimeter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Walk perimeter (web)</ThemedText>
      <ThemedText>
        Map capture is not supported on web. Use the iOS/Android app to walk or manually trace plots.
      </ThemedText>

      <View style={styles.row}>
        <Button title={isRecording ? 'Stop' : 'Start'} onPress={isRecording ? stopRecording : startRecording} />
        <Button title="Reset" onPress={reset} />
      </View>

      <ThemedText>Points: {points.length}</ThemedText>
      <ThemedText>
        Precision: {precisionMeters != null ? `${precisionMeters.toFixed(1)} m` : 'n/a'}
      </ThemedText>
      <ThemedText>
        Area: {area.hectares.toFixed(4)} ha ({area.squareMeters.toFixed(1)} m²)
      </ThemedText>
      {lastError ? <ThemedText>{lastError}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});

