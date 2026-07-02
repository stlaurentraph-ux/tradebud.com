import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PlotListCloudIconProps = {
  synced: boolean;
  accessibilityLabel: string;
};

/** Cloud backup indicator on My Plots cards — always visible. */
export function PlotListCloudIcon({ synced, accessibilityLabel }: PlotListCloudIconProps) {
  return (
    <View style={styles.wrap} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      <Ionicons
        name={synced ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={16}
        color={synced ? '#0A7F59' : '#9CA3AF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
