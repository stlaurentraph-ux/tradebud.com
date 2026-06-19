import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import { shareDeliveryReceipt } from '@/features/harvest/shareDeliveryReceipt';
import type { TranslateFn } from '@/features/i18n/translate';

export type PlotDeliveryReceiptRow = {
  qr_code_ref: string;
  kg?: number | string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

type PlotDeliveryReceiptPanelProps = {
  t: TranslateFn;
  plotName: string;
  latestReceipt: PlotDeliveryReceiptRow | null;
  checklistComplete: boolean;
  complianceGapHint: string | null;
  onRecordDelivery: () => void;
  onOpenDocuments: () => void;
};

export function PlotDeliveryReceiptPanel({
  t,
  plotName,
  latestReceipt,
  checklistComplete,
  complianceGapHint,
  onRecordDelivery,
  onOpenDocuments,
}: PlotDeliveryReceiptPanelProps) {
  const voucherShareCaptureRef = useRef<View>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const voucherCode = latestReceipt?.qr_code_ref?.trim() ?? '';
  const hasReceipt = voucherCode.length > 0;
  const qrPayload = voucherCode;

  const deliveryKg = latestReceipt?.kg;
  const kgLabel =
    deliveryKg != null && Number.isFinite(Number(deliveryKg)) && Number(deliveryKg) > 0
      ? `${Math.round(Number(deliveryKg)).toLocaleString()} kg`
      : null;
  const dateLabel = (() => {
    const raw = latestReceipt?.created_at ?? latestReceipt?.createdAt;
    if (!raw) return null;
    const date = new Date(String(raw));
    return Number.isNaN(date.getTime())
      ? null
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  if (!hasReceipt) {
    return (
      <Card variant="outlined" style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="receipt-outline" size={40} color="#9CA3AF" />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
          {t('plot_voucher_empty_title')}
        </ThemedText>
        <ThemedText type="caption" style={styles.emptyBody}>
          {t('plot_voucher_empty_body')}
        </ThemedText>
        <View style={{ marginTop: 14, width: '100%' }}>
          <Button title={t('plot_harvest_record_delivery')} variant="primary" onPress={onRecordDelivery} />
        </View>
      </Card>
    );
  }

  return (
    <>
      {!checklistComplete ? (
        <Card variant="outlined" style={styles.complianceBanner}>
          <View style={styles.complianceBannerRow}>
            <Ionicons name="information-circle-outline" size={20} color="#B45309" />
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={styles.complianceBannerTitle}>
                {t('plot_receipt_compliance_banner')}
              </ThemedText>
              {complianceGapHint ? (
                <ThemedText type="caption" style={styles.complianceBannerHint}>
                  {complianceGapHint}
                </ThemedText>
              ) : null}
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={onOpenDocuments} style={styles.complianceLink}>
            <ThemedText type="caption" style={styles.complianceLinkText}>
              {t('plot_receipt_open_documents')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#0A7F59" />
          </Pressable>
        </Card>
      ) : null}

      <Card variant="outlined" style={styles.receiptCard}>
        <View ref={voucherShareCaptureRef} collapsable={false} style={styles.shareCapture}>
          <ThemedText type="caption" style={styles.plotLabel}>
            {plotName}
          </ThemedText>
          {kgLabel || dateLabel ? (
            <ThemedText type="default" style={styles.metaLine}>
              {[kgLabel, dateLabel].filter(Boolean).join(' · ')}
            </ThemedText>
          ) : null}
          <View style={styles.qrWrap}>
            <View style={styles.qrInner}>
              <QRCode value={qrPayload} size={176} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
            </View>
          </View>
          <ThemedText type="title" style={styles.receiptTitle}>
            {t('plot_voucher_title')}
          </ThemedText>
          <ThemedText type="default" style={styles.receiptSubtitle}>
            {t('plot_voucher_subtitle')}
          </ThemedText>
          <View style={styles.codeWrap}>
            <ThemedText type="defaultSemiBold" style={styles.codeText}>
              {voucherCode}
            </ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="default" style={styles.bodyText}>
        {t('plot_voucher_body')}
      </ThemedText>

      <View style={{ marginTop: 6 }}>
        <Button
          title={t('voucher_share')}
          variant="secondary"
          style={{ backgroundColor: '#0A9F68' }}
          loading={shareBusy}
          disabled={shareBusy}
          onPress={() => {
            const shareMessage = t('voucher_share_message', {
              code: voucherCode,
              payload: qrPayload,
            });
            setShareBusy(true);
            setNote(null);
            void shareDeliveryReceipt({
              captureRef: voucherShareCaptureRef,
              shareTitle: t('voucher_share_title'),
              shareMessage,
            })
              .catch(() => setNote(t('voucher_share_failed')))
              .finally(() => setShareBusy(false));
          }}
        />
      </View>

      {note ? <ThemedText type="caption">{note}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    textAlign: 'center',
    color: '#1F2937',
  },
  emptyBody: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  complianceBanner: {
    marginBottom: 12,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    gap: 8,
  },
  complianceBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  complianceBannerTitle: {
    color: '#92400E',
  },
  complianceBannerHint: {
    marginTop: 4,
    color: '#B45309',
    lineHeight: 18,
  },
  complianceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  complianceLinkText: {
    color: '#0A7F59',
    fontWeight: '600',
  },
  receiptCard: {
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 20,
  },
  shareCapture: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  plotLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metaLine: {
    color: '#374151',
    marginBottom: 10,
  },
  qrWrap: {
    width: 192,
    height: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  qrInner: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptTitle: {
    color: '#1F1F1F',
  },
  receiptSubtitle: {
    color: '#6C6C6C',
    marginTop: 2,
  },
  codeWrap: {
    marginTop: 12,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
    alignItems: 'center',
  },
  codeText: {
    color: '#0A7F59',
  },
  bodyText: {
    marginTop: 14,
    color: '#515151',
    lineHeight: 22,
  },
});
