import { View } from 'react-native';
import type { Plot } from '@/features/state/AppStateContext';
import { ThemedText } from '@/components/themed-text';

export function PlotMap(_props: {
  plot: Plot;
  region: any;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  return (
    <View style={{ height: 220, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 }}>
      <ThemedText>
        Map preview is not available on web. Use the iOS/Android app to view maps and trace plots.
      </ThemedText>
    </View>
  );
}

