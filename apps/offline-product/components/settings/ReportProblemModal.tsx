import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/themed-text';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

type ReportProblemModalProps = {
  visible: boolean;
  busy?: boolean;
  title: string;
  body: string;
  noteLabel: string;
  notePlaceholder: string;
  submitLabel: string;
  cancelLabel: string;
  onSubmit: (note: string) => void | Promise<void>;
  onClose: () => void;
};

export function ReportProblemModal({
  visible,
  busy = false,
  title,
  body,
  noteLabel,
  notePlaceholder,
  submitLabel,
  cancelLabel,
  onSubmit,
  onClose,
}: ReportProblemModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createAuthSheetStyles);
  const [note, setNote] = useState('');

  const handleClose = () => {
    if (busy) return;
    setNote('');
    onClose();
  };

  const handleSubmit = async () => {
    if (busy) return;
    await onSubmit(note);
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.backupBackdrop, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.backupTitle}>
            {title}
          </ThemedText>
          <ThemedText type="default" style={styles.backupBody}>
            {body}
          </ThemedText>
          <Input
            label={noteLabel}
            value={note}
            onChangeText={setNote}
            placeholder={notePlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!busy}
            style={{ minHeight: 96 }}
          />
          <View style={styles.backupActions}>
            <Button variant="primary" fullWidth loading={busy} disabled={busy} onPress={() => void handleSubmit()}>
              {submitLabel}
            </Button>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.backupDeclineBtn} disabled={busy}>
              <ThemedText type="defaultSemiBold" style={styles.backupDeclineText}>
                {cancelLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
