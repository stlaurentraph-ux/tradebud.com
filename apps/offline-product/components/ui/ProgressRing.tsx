import Svg, { Circle } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
};

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 5,
  centerLabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {centerLabel ? (
        <ThemedText type="caption" style={styles.centerLabel}>
          {centerLabel}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#0B4F3B',
  },
});
