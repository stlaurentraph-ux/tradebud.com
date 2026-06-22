import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

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
  const styles = useThemedStyles(createAuthSheetStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onSkip}
    >
      <View
        style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.backdropPress}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
          onPress={onSkip}
        />
        <View style={styles.card} pointerEvents="auto">
          <ThemedText type="defaultSemiBold" style={styles.welcomeTitle}>
            {title}
          </ThemedText>
          <ThemedText type="caption" style={styles.welcomeBody}>
            {body}
          </ThemedText>
          <View style={styles.welcomeActions}>
            <Button variant="primary" size="sm" fullWidth onPress={onCreateAccount}>
              {createAccountLabel}
            </Button>
            <Button variant="outline" size="sm" fullWidth onPress={onSignIn}>
              {signInLabel}
            </Button>
          </View>
          <Pressable onPress={onSkip} hitSlop={12} style={styles.footerLink}>
            <ThemedText type="defaultSemiBold" style={styles.footerMutedText}>
              {skipLabel}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
