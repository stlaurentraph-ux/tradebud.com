import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import { formatDeliveryRecipientLabel } from '@/features/harvest/formatDeliveryRecipientLabel';
import type { LoggedDeliverySnapshot } from '@/features/harvest/loggedDeliverySnapshot';
import { shareDeliveryReceipt } from '@/features/harvest/shareDeliveryReceipt';
import type { TranslateFn } from '@/features/i18n/translate';
import {
  createDeliveryLoggedPanelStyles,
  harvestStatusColor,
} from '@/components/harvest/harvestPanelStyles';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';

export type DeliverySyncFeedback = {
  variant: 'success' | 'error' | 'info';
  message: string;
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
  const colors = useAppColors();
  const styles = useThemedStyles(createDeliveryLoggedPanelStyles);
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
    const iconColor = harvestStatusColor(colors, syncFeedback.variant);

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
