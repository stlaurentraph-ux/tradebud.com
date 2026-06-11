import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Image
            source={require('../../assets/images/tracebud-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="default" style={styles.body}>
            {body}
          </ThemedText>
          <View style={styles.actions}>
            <Button variant="primary" fullWidth onPress={onCreateAccount}>
              {createAccountLabel}
            </Button>
            <Button variant="outline" fullWidth onPress={onSignIn}>
              {signInLabel}
            </Button>
          </View>
          <Pressable onPress={onSkip} hitSlop={12} style={styles.skipBtn}>
            <ThemedText type="defaultSemiBold" style={styles.skipText}>
              {skipLabel}
            </ThemedText>
          </Pressable>
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
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Brand.primary,
    textAlign: 'center',
    fontSize: 22,
  },
  body: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  skipBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  skipText: {
    color: '#6B7280',
  },
});
