import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import {
  formatReceiptDateLabel,
  formatReceiptDeliverToLabel,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import { shareDeliveryReceipt } from '@/features/harvest/shareDeliveryReceipt';
import type { TranslateFn } from '@/features/i18n/translate';
import { createDeliveryReceiptDetailPanelStyles } from '@/components/harvest/harvestPanelStyles';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

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
  const styles = useThemedStyles(createDeliveryReceiptDetailPanelStyles);
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
              {formatReceiptDeliverToLabel(receipt, t)}
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

