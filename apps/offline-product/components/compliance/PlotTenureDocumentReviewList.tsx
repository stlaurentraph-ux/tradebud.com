import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { tenureAiParseLabelKey } from '@/features/compliance/plotTenureAiReview';
import {
  describeTenureVerificationReview,
  formatTenureVerificationReviewMessage,
} from '@/features/compliance/plotTenureVerificationReview';
import { useLanguage } from '@/features/state/LanguageContext';

type PlotTenureDocumentReviewListProps = {
  tenureVerifications: PlotTenureVerificationRecord[];
  titlePhotoCount: number;
  tenureEvidenceCount: number;
  isSyncedToServer: boolean;
};

function badgeVariant(
  status: PlotTenureVerificationRecord['parse_status'],
): 'success' | 'warning' | 'default' | 'info' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'warning';
  if (status === 'MANUAL_REQUIRED') return 'warning';
  if (status === 'PENDING' || status === 'IN_PROGRESS') return 'info';
  return 'default';
}

export function PlotTenureDocumentReviewList({
  tenureVerifications,
  titlePhotoCount,
  tenureEvidenceCount,
  isSyncedToServer,
}: PlotTenureDocumentReviewListProps) {
  const { t } = useLanguage();
  const uploadedCount = titlePhotoCount + tenureEvidenceCount;

  if (uploadedCount === 0) return null;

  if (isSyncedToServer && tenureVerifications.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <ThemedText type="defaultSemiBold">{t('plot_tenure_doc_review_section')}</ThemedText>
        <View style={styles.reasonRow}>
          <Ionicons name="time-outline" size={16} color="#8A8A8A" />
          <ThemedText type="caption" style={styles.reasonText}>
            {t('plot_tenure_doc_reason_awaiting_ai')}
          </ThemedText>
        </View>
      </Card>
    );
  }

  if (tenureVerifications.length === 0) return null;

  const needsAttention = tenureVerifications.some(
    (row) =>
      row.parse_status === 'FAILED' ||
      row.parse_status === 'MANUAL_REQUIRED' ||
      row.parse_status === 'PENDING' ||
      row.parse_status === 'IN_PROGRESS',
  );

  return (
    <Card variant="outlined" style={styles.card}>
      <ThemedText type="defaultSemiBold">{t('plot_tenure_doc_review_section')}</ThemedText>
      {needsAttention ? (
        <ThemedText type="caption" style={styles.sectionHint}>
          {t('plot_tenure_doc_review_section_hint')}
        </ThemedText>
      ) : null}
      <View style={styles.list}>
        {tenureVerifications.map((record) => {
          const detail = describeTenureVerificationReview(record);
          const reason = formatTenureVerificationReviewMessage(detail, t);
          const showReason = record.parse_status !== 'COMPLETED' || detail.reasonDetail;

          return (
            <View key={record.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <ThemedText type="defaultSemiBold" style={styles.itemLabel}>
                  {detail.label}
                </ThemedText>
                <Badge variant={badgeVariant(record.parse_status)} size="sm">
                  {t(tenureAiParseLabelKey(record.parse_status))}
                </Badge>
              </View>
              {showReason ? (
                <View style={styles.reasonRow}>
                  <Ionicons
                    name={
                      record.parse_status === 'COMPLETED'
                        ? 'checkmark-circle-outline'
                        : record.parse_status === 'FAILED'
                          ? 'close-circle-outline'
                          : 'alert-circle-outline'
                    }
                    size={16}
                    color={
                      record.parse_status === 'COMPLETED'
                        ? '#0A7F59'
                        : record.parse_status === 'FAILED'
                          ? '#B91C1C'
                          : '#B45309'
                    }
                  />
                  <ThemedText type="caption" style={styles.reasonText}>
                    {reason}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  sectionHint: {
    marginTop: 4,
    opacity: 0.85,
  },
  list: {
    marginTop: 10,
    gap: 10,
  },
  item: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemLabel: {
    flex: 1,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  reasonText: {
    flex: 1,
    opacity: 0.9,
  },
});
