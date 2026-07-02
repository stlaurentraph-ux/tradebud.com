import { StyleSheet, View } from 'react-native';

const DOT_SIZE = 8;
const RING_SIZE = 12;

type PlotListStatusDotProps = {
  accessibilityLabel: string;
};

/** Amber readiness dot for My Plots cards — top-right when plot is not Ready. */
export function PlotListStatusDot({ accessibilityLabel }: PlotListStatusDotProps) {
  return (
    <View
      style={styles.ring}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      importantForAccessibility="yes"
    >
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#D97706',
  },
});
