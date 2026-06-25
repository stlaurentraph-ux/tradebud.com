import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ActionButton as Button } from '@/components/ui/action-button';
import type { TranslateFn } from '@/features/i18n/translate';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

type ShowBuyerQrSheetProps = {
  visible: boolean;
  onClose: () => void;
  t: TranslateFn;
  qrPayload: string;
  humanCode: string;
  title: string;
  subtitle?: string;
  metaLines?: string[];
};

export function ShowBuyerQrSheet({
  visible,
  onClose,
  t,
  qrPayload,
  humanCode,
  title,
  subtitle,
  metaLines = [],
}: ShowBuyerQrSheetProps) {
  useEffect(() => {
    if (!visible) return;
    trackEvent(ANALYTICS_EVENTS.SHOW_BUYER_QR_OPENED, { codePrefix: humanCode.slice(0, 2) });
  }, [humanCode, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#111111" />
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="default" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}

        <View style={styles.qrWrap}>
          <QRCode value={qrPayload} size={280} color="#111111" backgroundColor="#FFFFFF" ecl="H" />
        </View>

        <ThemedText type="defaultSemiBold" style={styles.code}>
          {humanCode}
        </ThemedText>

        {metaLines.map((line) => (
          <ThemedText key={line} type="caption" style={styles.meta}>
            {line}
          </ThemedText>
        ))}

        <ThemedText type="caption" style={styles.hint}>
          {t('show_buyer_qr_hint')}
        </ThemedText>
        <ThemedText type="caption" style={styles.brightnessHint}>
          {t('show_buyer_qr_brightness')}
        </ThemedText>

        <Button title={t('close')} variant="secondary" onPress={onClose} style={styles.doneBtn} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  title: {
    textAlign: 'center',
    color: '#0B4F3B',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#4B5563',
  },
  qrWrap: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  code: {
    marginTop: 20,
    fontSize: 22,
    letterSpacing: 1,
    color: '#111111',
  },
  meta: {
    marginTop: 8,
    color: '#4B5563',
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 12,
  },
  brightnessHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9CA3AF',
    paddingHorizontal: 12,
  },
  doneBtn: {
    marginTop: 'auto',
    alignSelf: 'stretch',
  },
});
