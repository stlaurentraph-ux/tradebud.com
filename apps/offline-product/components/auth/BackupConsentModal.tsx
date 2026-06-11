import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

type BackupConsentModalProps = {
  visible: boolean;
  busy?: boolean;
  title: string;
  body: string;
  consentLabel: string;
  declineLabel: string;
  onConfirm: () => void;
  onDecline: () => void;
};

export function BackupConsentModal({
  visible,
  busy = false,
  title,
  body,
  consentLabel,
  declineLabel,
  onConfirm,
  onDecline,
}: BackupConsentModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="default" style={styles.body}>
            {body}
          </ThemedText>
          <View style={styles.actions}>
            <Button variant="primary" fullWidth disabled={busy} onPress={onConfirm}>
              {consentLabel}
            </Button>
            <Pressable onPress={onDecline} hitSlop={12} style={styles.declineBtn} disabled={busy}>
              <ThemedText type="defaultSemiBold" style={styles.declineText}>
                {declineLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    color: Brand.primary,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 22,
  },
  actions: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  declineBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
  },
  declineText: {
    color: '#6B7280',
  },
});
