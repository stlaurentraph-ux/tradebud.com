import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { authSheetStyles } from '@/components/auth/authSheetStyles';
import { Brand, Radius, Spacing } from '@/constants/theme';

type WelcomeAccountModalProps = {
  visible: boolean;
  title: string;
  body: string;
  createAccountLabel: string;
  signInLabel: string;
  skipLabel: string;
  onCreateAccount: () => void;
  onSignIn: () => void;
  onSkip: () => void;
};

export function WelcomeAccountModal({
  visible,
  title,
  body,
  createAccountLabel,
  signInLabel,
  skipLabel,
  onCreateAccount,
  onSignIn,
  onSkip,
}: WelcomeAccountModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <Pressable
        style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}
        onPress={onSkip}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="caption" style={styles.body}>
            {body}
          </ThemedText>
          <View style={styles.actions}>
            <Button variant="primary" size="sm" fullWidth onPress={onCreateAccount}>
              {createAccountLabel}
            </Button>
            <Button variant="outline" size="sm" fullWidth onPress={onSignIn}>
              {signInLabel}
            </Button>
          </View>
          <Pressable onPress={onSkip} hitSlop={12} style={authSheetStyles.footerLink}>
            <ThemedText type="defaultSemiBold" style={authSheetStyles.footerMutedText}>
              {skipLabel}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    color: Brand.primary,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    color: '#6B7280',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: 4,
  },
});
