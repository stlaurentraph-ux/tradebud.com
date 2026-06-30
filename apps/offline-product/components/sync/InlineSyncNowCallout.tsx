import { View } from 'react-native';

import { ActionButton as Button } from '@/components/ui/action-button';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { StyleSheet } from 'react-native';

type InlineSyncNowCalloutProps = {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onSyncNow: () => void;
  busy?: boolean;
  testID?: string;
};

export function InlineSyncNowCallout({
  message,
  tone = 'info',
  onSyncNow,
  busy = false,
  testID = 'inline-sync-now-callout',
}: InlineSyncNowCalloutProps) {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap} testID={testID}>
      <ThemedText
        type="caption"
        style={[
          styles.message,
          tone === 'success' ? styles.success : tone === 'error' ? styles.error : styles.info,
        ]}
      >
        {message}
      </ThemedText>
      <Button
        title={busy ? t('sync_now_syncing') : t('sync_now')}
        variant="secondary"
        size="sm"
        loading={busy}
        disabled={busy}
        onPress={onSyncNow}
        testID={`${testID}-button`}
        style={styles.button}
      />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    wrap: {
      marginTop: 10,
      gap: 8,
    },
    message: {
      lineHeight: 20,
    },
    info: {
      color: '#4B5563',
    },
    success: {
      color: '#047857',
    },
    error: {
      color: '#B45309',
    },
    button: {
      alignSelf: 'flex-start',
      minWidth: 140,
    },
  });
