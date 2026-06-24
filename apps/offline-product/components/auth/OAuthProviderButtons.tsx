import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import type { OAuthProvider } from '@/features/auth/oauthOrchestrator';

type OAuthProviderButtonsProps = {
  disabled?: boolean;
  loadingProvider?: OAuthProvider | null;
  busyLabel: string;
  googleLabel: string;
  appleLabel: string;
  onGoogle: () => void;
  onApple: () => void;
};

export function OAuthProviderButtons({
  disabled,
  loadingProvider = null,
  busyLabel,
  googleLabel,
  appleLabel,
  onGoogle,
  onApple,
}: OAuthProviderButtonsProps) {
  const busy = disabled || loadingProvider !== null;

  return (
    <View style={styles.row}>
      <Button
        variant="outline"
        size="sm"
        style={styles.btn}
        disabled={busy}
        loading={loadingProvider === 'google'}
        testID="sign-in-oauth-google"
        icon={<Ionicons name="logo-google" size={17} color="#4285F4" />}
        onPress={onGoogle}
      >
        {loadingProvider === 'google' ? busyLabel : googleLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        style={styles.btn}
        disabled={busy}
        loading={loadingProvider === 'apple'}
        testID="sign-in-oauth-apple"
        icon={<Ionicons name="logo-apple" size={17} color="#111827" />}
        onPress={onApple}
      >
        {loadingProvider === 'apple' ? busyLabel : appleLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  btn: {
    flex: 1,
  },
});
