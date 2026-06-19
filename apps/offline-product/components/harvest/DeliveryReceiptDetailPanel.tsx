import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import {
  formatReceiptDateLabel,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import { shareDeliveryReceipt } from '@/features/harvest/shareDeliveryReceipt';
import type { TranslateFn } from '@/features/i18n/translate';

type DeliveryReceiptDetailPanelProps = {
  t: TranslateFn;
  receipt: DeliveryReceiptRecord;
  onBack: () => void;
  hideBackRow?: boolean;
};

export function DeliveryReceiptDetailPanel({
  t,
  receipt,
  onBack,
  hideBackRow = false,
}: DeliveryReceiptDetailPanelProps) {
  const shareCaptureRef = useRef<View>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const qrCode = receipt.qrCodeRef?.trim() ?? '';
  const hasQr = qrCode.length > 0;
  const dateLabel = formatReceiptDateLabel(receipt.createdAt);

  const handleShare = async () => {
    if (!hasQr) return;
    const shareMessage = t('voucher_share_message', { code: qrCode, payload: qrCode });
    setShareBusy(true);
    setShareNote(null);
    try {
      await shareDeliveryReceipt({
        captureRef: shareCaptureRef,
        shareTitle: t('voucher_share_title'),
        shareMessage,
      });
    } catch {
      setShareNote(t('voucher_share_failed'));
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {hideBackRow ? null : (
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color="#0A7F59" />
          <ThemedText type="defaultSemiBold" style={styles.backText}>
            {receipt.plotName}
          </ThemedText>
        </Pressable>
      )}

      <Card variant="outlined" style={styles.receiptCard}>
        <View ref={shareCaptureRef} collapsable={false} style={styles.shareCapture}>
          {hasQr ? (
            <>
              <View style={styles.qrWrap}>
                <View style={styles.qrInner}>
                  <QRCode value={qrCode} size={176} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
                </View>
              </View>
              <ThemedText type="caption" style={styles.qrHint}>
                {t('harvest_share_qr')}
              </ThemedText>
              <View style={styles.codeWrap}>
                <ThemedText type="defaultSemiBold" style={styles.codeText}>
                  {qrCode}
                </ThemedText>
              </View>
              <View style={styles.divider} />
            </>
          ) : (
            <View style={styles.qrGeneratingWrap}>
              <Ionicons name="qr-code-outline" size={40} color="#9CA3AF" />
              <ThemedText type="caption" style={styles.qrGeneratingText}>
                {receipt.pendingSync
                  ? t('harvest_receipt_qr_after_sync')
                  : t('harvest_receipt_qr_generating')}
              </ThemedText>
            </View>
          )}

          <ThemedText type="caption" style={styles.summaryLabel}>
            {t('harvest_receipt_summary_label')}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.plotName}>
            {receipt.plotName}
          </ThemedText>
          <ThemedText type="title" style={styles.kgText}>
            {`${Math.round(receipt.kg).toLocaleString()} kg`}
          </ThemedText>
          <ThemedText type="caption" style={styles.metaText}>
            {dateLabel}
          </ThemedText>
          <View style={styles.buyerRow}>
            <ThemedText type="caption" style={styles.buyerKey}>
              {t('harvest_receipt_deliver_to')}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.buyerValue}>
              {receipt.buyerLabel}
            </ThemedText>
          </View>
        </View>
      </Card>

      {hasQr ? (
        <Button
          title={t('harvest_receipt_share')}
          variant="primary"
          loading={shareBusy}
          disabled={shareBusy}
          onPress={() => void handleShare()}
        />
      ) : (
        <ThemedText type="caption" style={styles.noQr}>
          {t('harvest_receipt_qr_generating_hint')}
        </ThemedText>
      )}

      {shareNote ? <ThemedText type="caption">{shareNote}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: { color: '#0A7F59' },
  receiptCard: {
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    alignItems: 'center',
    paddingVertical: 16,
  },
  shareCapture: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 8,
  },
  qrWrap: {
    width: 192,
    height: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrInner: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
  },
  qrGeneratingWrap: {
    width: 192,
    minHeight: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 10,
  },
  qrGeneratingText: { color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  qrHint: { color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  codeWrap: {
    marginBottom: 4,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
    alignItems: 'center',
  },
  codeText: { color: '#0A7F59' },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D5DB',
    marginVertical: 14,
  },
  summaryLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  plotName: { color: '#1F2937', textAlign: 'center' },
  kgText: { color: '#0A7F59', marginTop: 2, textAlign: 'center' },
  metaText: { color: '#6B7280', textAlign: 'center' },
  buyerRow: { marginTop: 10, gap: 2, alignItems: 'center' },
  buyerKey: { color: '#6B7280', textAlign: 'center' },
  buyerValue: { color: '#1F2937', textAlign: 'center' },
  noQr: { color: '#6B7280', textAlign: 'center' },
});
