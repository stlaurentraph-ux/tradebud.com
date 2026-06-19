import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import { formatDeliveryRecipientLabel } from '@/features/harvest/formatDeliveryRecipientLabel';
import { shareDeliveryReceipt } from '@/features/harvest/shareDeliveryReceipt';
import type { TranslateFn } from '@/features/i18n/translate';

export type DeliverySyncFeedback = {
  variant: 'success' | 'error' | 'info';
  message: string;
};

export type LoggedDeliverySnapshot = {
  /** Local SQLite receipt row id (`clientEventId` from submit). */
  receiptId?: string;
  plotId: string;
  plotName: string;
  kg: number;
  recordedAt: number;
  deliveryRecipient: DeliveryRecipientSelection | null;
  qrCodeRef: string | null;
  mode: 'synced' | 'queued';
  queuedMessageKey?: string | null;
  seasonTotalKg?: number | null;
};

type DeliveryLoggedPanelProps = {
  t: TranslateFn;
  delivery: LoggedDeliverySnapshot;
  onShareAnother: () => void;
  onViewPlot: (plotId: string) => void;
  onSyncNow: () => void;
  syncBusy?: boolean;
  syncFeedback?: DeliverySyncFeedback | null;
};

function buyerNeedsQr(recipient: DeliveryRecipientSelection | null): boolean {
  return recipient?.mode === 'qr_only';
}

export function DeliveryLoggedPanel({
  t,
  delivery,
  onShareAnother,
  onViewPlot,
  onSyncNow,
  syncBusy = false,
  syncFeedback = null,
}: DeliveryLoggedPanelProps) {
  const shareCaptureRef = useRef<View>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const isQueued = delivery.mode === 'queued';
  const qrCode = delivery.qrCodeRef?.trim() ?? '';
  const hasQr = qrCode.length > 0;
  const needsBuyerQr = buyerNeedsQr(delivery.deliveryRecipient);
  const dateLabel = new Date(delivery.recordedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const buyerLabel = formatDeliveryRecipientLabel(delivery.deliveryRecipient, t);

  const subtitle = isQueued
    ? needsBuyerQr
      ? t('harvest_queued_success_subtitle_qr')
      : t('harvest_queued_success_subtitle')
    : hasQr
      ? t('harvest_logged_body_synced')
      : t('harvest_receipt_qr_generating');

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

  const renderQrSection = () => {
    if (hasQr) {
      return (
        <>
          <View style={styles.qrWrap}>
            <View style={styles.qrInner}>
              <QRCode value={qrCode} size={176} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
            </View>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.qrReadyTitle}>
            {t('harvest_receipt_qr_generated')}
          </ThemedText>
          <ThemedText type="caption" style={styles.qrReadyHint}>
            {t('harvest_share_qr')}
          </ThemedText>
          <View style={styles.codeWrap}>
            <ThemedText type="defaultSemiBold" style={styles.codeText}>
              {qrCode}
            </ThemedText>
          </View>
        </>
      );
    }

    if (isQueued) {
      return (
        <View style={styles.qrPendingWrap}>
          <View style={styles.qrPendingIcon}>
            <Ionicons name="qr-code-outline" size={36} color="#9CA3AF" />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.qrPendingTitle}>
            {t('harvest_receipt_qr_after_sync')}
          </ThemedText>
          <ThemedText type="caption" style={styles.qrPendingHint}>
            {needsBuyerQr
              ? t('harvest_receipt_qr_after_sync_buyer')
              : t(delivery.queuedMessageKey ?? 'harvest_queued_success_body')}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.qrPendingWrap}>
        <ActivityIndicator size="large" color="#0A7F59" />
        <ThemedText type="defaultSemiBold" style={styles.qrPendingTitle}>
          {t('harvest_receipt_qr_generating')}
        </ThemedText>
        <ThemedText type="caption" style={styles.qrPendingHint}>
          {t('harvest_receipt_qr_generating_hint')}
        </ThemedText>
      </View>
    );
  };

  const renderSyncStatusBanner = () => {
    if (syncBusy) {
      return (
        <View style={[styles.syncFeedbackBanner, styles.syncFeedbackInfo]}>
          <ActivityIndicator size="small" color="#0A7F59" />
          <ThemedText type="defaultSemiBold" style={styles.syncFeedbackText}>
            {t('harvest_receipt_syncing_now')}
          </ThemedText>
        </View>
      );
    }
    if (!syncFeedback) return null;

    const iconName =
      syncFeedback.variant === 'success'
        ? 'checkmark-circle'
        : syncFeedback.variant === 'error'
          ? 'alert-circle'
          : 'information-circle';
    const iconColor =
      syncFeedback.variant === 'success'
        ? '#0A7F59'
        : syncFeedback.variant === 'error'
          ? '#B45309'
          : '#2563EB';

    return (
      <View
        style={[
          styles.syncFeedbackBanner,
          syncFeedback.variant === 'success'
            ? styles.syncFeedbackSuccess
            : syncFeedback.variant === 'error'
              ? styles.syncFeedbackError
              : styles.syncFeedbackInfo,
        ]}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
        <ThemedText type="defaultSemiBold" style={styles.syncFeedbackText}>
          {syncFeedback.message}
        </ThemedText>
      </View>
    );
  };

  return (
    <>
      <View style={styles.heroWrap}>
        <View style={[styles.iconWrap, isQueued ? styles.iconWrapQueued : null]}>
          <Ionicons
            name={isQueued ? 'cloud-offline-outline' : 'checkmark'}
            size={isQueued ? 36 : 40}
            color="#0A9F68"
          />
        </View>
      </View>

      <ThemedText type="title" style={styles.title}>
        {isQueued ? t('harvest_queued_success_title') : t('harvest_logged_title')}
      </ThemedText>
      <ThemedText type="default" style={styles.subtitle}>
        {subtitle}
      </ThemedText>

      <Card variant="outlined" style={styles.receiptCard}>
        <View ref={shareCaptureRef} collapsable={false} style={styles.shareCapture}>
          {renderQrSection()}
          <View style={styles.receiptDivider} />

          <ThemedText type="caption" style={styles.summaryLabel}>
            {t('harvest_receipt_summary_label')}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.plotName}>
            {delivery.plotName}
          </ThemedText>
          <ThemedText type="title" style={styles.kgText}>
            {`${Math.round(delivery.kg).toLocaleString()} kg`}
          </ThemedText>
          <ThemedText type="caption" style={styles.metaText}>
            {dateLabel}
          </ThemedText>
          <View style={styles.buyerRow}>
            <ThemedText type="caption" style={styles.buyerKey}>
              {t('harvest_receipt_deliver_to')}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.buyerValue}>
              {buyerLabel}
            </ThemedText>
          </View>
          {delivery.seasonTotalKg != null && delivery.seasonTotalKg > 0 ? (
            <ThemedText type="caption" style={styles.seasonText}>
              {t('harvest_receipt_season_total', {
                n: Math.round(delivery.seasonTotalKg).toLocaleString(),
              })}
            </ThemedText>
          ) : null}
        </View>
      </Card>

      <View style={styles.actions}>
        {renderSyncStatusBanner()}

        {isQueued ? (
          <Button
            title={t('harvest_receipt_sync_now')}
            variant="primary"
            loading={syncBusy}
            disabled={syncBusy}
            onPress={onSyncNow}
          />
        ) : hasQr ? (
          <Button
            title={t('harvest_receipt_share')}
            variant="primary"
            loading={shareBusy}
            disabled={shareBusy}
            onPress={() => void handleShare()}
          />
        ) : null}

        <Button
          title={t('log_another_harvest')}
          variant="secondary"
          style={styles.secondaryBtn}
          textStyle={styles.secondaryBtnText}
          onPress={onShareAnother}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => onViewPlot(delivery.plotId)} style={styles.linkRow}>
        <ThemedText type="defaultSemiBold" style={styles.linkText}>
          {t('harvest_receipt_view_plot')}
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color="#0A7F59" />
      </Pressable>

      {shareNote ? <ThemedText type="caption" style={styles.shareNote}>{shareNote}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'center', marginTop: -4, marginBottom: 2 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#CDEEDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapQueued: { backgroundColor: '#E8F4EC' },
  title: {
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    textAlign: 'center',
    color: '#555555',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  receiptCard: {
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  shareCapture: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
  },
  receiptDivider: {
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
  seasonText: { marginTop: 8, color: '#6B7280', textAlign: 'center' },
  qrWrap: {
    width: 192,
    height: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrInner: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
  },
  qrReadyTitle: { color: '#1F2937', textAlign: 'center' },
  qrReadyHint: { color: '#6B7280', marginTop: 4, marginBottom: 10, textAlign: 'center', paddingHorizontal: 8 },
  codeWrap: {
    marginBottom: 4,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
    alignItems: 'center',
  },
  codeText: { color: '#0A7F59' },
  qrPendingWrap: {
    width: '100%',
    minHeight: 200,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 4,
  },
  qrPendingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qrPendingTitle: { color: '#1F2937', textAlign: 'center' },
  qrPendingHint: { color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  actions: { gap: 10 },
  syncFeedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  syncFeedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  syncFeedbackError: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  syncFeedbackInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  syncFeedbackText: {
    flex: 1,
    color: '#1F2937',
    lineHeight: 20,
  },
  secondaryBtn: { backgroundColor: '#E8F7F0' },
  secondaryBtnText: { color: '#0B4F3B' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    marginTop: 4,
  },
  linkText: { color: '#0A7F59' },
  shareNote: { textAlign: 'center', color: '#6B7280', marginTop: 4 },
});
