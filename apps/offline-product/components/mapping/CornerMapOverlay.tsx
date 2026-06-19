import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import type { CornerCapturePhase } from '@/features/mapping/cornerCaptureUx';
import { cornerMapOverlayMessageKey } from '@/features/mapping/cornerCaptureUx';

type CornerMapOverlayProps = {
  phase: CornerCapturePhase;
  secondsRemaining: number;
  t: TranslateFn;
};

export function CornerMapOverlay({ phase, secondsRemaining, t }: CornerMapOverlayProps) {
  const messageKey = cornerMapOverlayMessageKey(phase);
  const message =
    phase === 'settle'
      ? t(messageKey, { seconds: secondsRemaining })
      : t(messageKey);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.card}>
        <Ionicons
          name={phase === 'save' ? 'checkmark-circle' : phase === 'settle' ? 'hourglass' : 'footsteps'}
          size={22}
          color={phase === 'save' ? '#0A7F59' : '#7C3AED'}
        />
        <ThemedText type="defaultSemiBold" style={styles.text}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: {
    flex: 1,
    color: '#1F2937',
    lineHeight: 20,
  },
});
