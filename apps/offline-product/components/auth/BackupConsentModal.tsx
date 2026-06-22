import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

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
  const styles = useThemedStyles(createAuthSheetStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={[styles.backupBackdrop, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.backupTitle}>
            {title}
          </ThemedText>
          <ThemedText type="default" style={styles.backupBody}>
            {body}
          </ThemedText>
          <View style={styles.backupActions}>
            <Button variant="primary" fullWidth loading={busy} disabled={busy} onPress={onConfirm}>
              {consentLabel}
            </Button>
            <Pressable onPress={onDecline} hitSlop={12} style={styles.backupDeclineBtn} disabled={busy}>
              <ThemedText type="defaultSemiBold" style={styles.backupDeclineText}>
                {declineLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
