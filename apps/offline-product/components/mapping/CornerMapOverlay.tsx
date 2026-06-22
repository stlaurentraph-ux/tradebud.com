import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import type { CornerCapturePhase } from '@/features/mapping/cornerCaptureUx';
import { cornerMapOverlayMessageKey } from '@/features/mapping/cornerCaptureUx';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createCornerMapOverlayStyles } from '@/components/mapping/cornerMapOverlayStyles';

type CornerMapOverlayProps = {
  phase: CornerCapturePhase;
  secondsRemaining: number;
  t: TranslateFn;
};

export function CornerMapOverlay({ phase, secondsRemaining, t }: CornerMapOverlayProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createCornerMapOverlayStyles);
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
          color={phase === 'save' ? colors.link : colors.tint}
        />
        <ThemedText type="defaultSemiBold" style={styles.text}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

