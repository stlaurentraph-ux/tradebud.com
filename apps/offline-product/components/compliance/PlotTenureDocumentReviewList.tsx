import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { tenureDocRowStatusLabelKey } from '@/features/compliance/plotTenureAiReview';
import {
  describeTenureVerificationReview,
  formatTenureVerificationDocumentLabel,
  formatTenureVerificationReviewMessage,
  shouldShowTenureDocReasonBox,
  shouldShowTenureDocStatusBadge,
  tenureVerificationRequiresReupload,
} from '@/features/compliance/plotTenureVerificationReview';
import { useLanguage } from '@/features/state/LanguageContext';

type PlotTenureDocumentReviewListProps = {
  tenureVerifications: PlotTenureVerificationRecord[];
  titlePhotoCount: number;
  tenureEvidenceCount: number;
  isSyncedToServer: boolean;
  /** When true, render as a section inside the land-rights card (no nested card). */
  embedded?: boolean;
  onReplaceLandPaper?: () => void;
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

function reasonIconName(
  status: PlotTenureVerificationRecord['parse_status'],
): keyof typeof Ionicons.glyphMap {
  if (status === 'COMPLETED') return 'checkmark-circle-outline';
  if (status === 'FAILED') return 'close-circle-outline';
  return 'alert-circle-outline';
}

function reasonIconColor(status: PlotTenureVerificationRecord['parse_status']): string {
  if (status === 'COMPLETED') return '#0A7F59';
  if (status === 'FAILED') return '#B91C1C';
  return '#B45309';
}

function reasonBoxStyle(status: PlotTenureVerificationRecord['parse_status']) {
  if (status === 'COMPLETED') return styles.reasonBoxSuccess;
  if (status === 'FAILED') return styles.reasonBoxFailed;
  return styles.reasonBoxWarning;
}

export function PlotTenureDocumentReviewList({
  tenureVerifications,
  titlePhotoCount,
  tenureEvidenceCount,
  isSyncedToServer,
  embedded = false,
  onReplaceLandPaper,
}: PlotTenureDocumentReviewListProps) {
  const { t } = useLanguage();
  const uploadedCount = titlePhotoCount + tenureEvidenceCount;

  if (uploadedCount === 0) return null;

  const awaitingContent = (
    <>
      <ThemedText type="defaultSemiBold">{t('plot_tenure_doc_review_section')}</ThemedText>
      <View style={styles.awaitingRow}>
        <Ionicons name="time-outline" size={18} color="#6B7280" />
        <ThemedText type="caption" style={styles.awaitingText}>
          {t('plot_tenure_doc_reason_awaiting_ai')}
        </ThemedText>
      </View>
    </>
  );

  if (isSyncedToServer && tenureVerifications.length === 0) {
    if (embedded) {
      return <View style={styles.embeddedSection}>{awaitingContent}</View>;
    }
    return (
      <Card variant="outlined" style={styles.card}>
        {awaitingContent}
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

  const content = (
    <>
      <ThemedText type="defaultSemiBold">{t('plot_tenure_doc_review_section')}</ThemedText>
      {needsAttention ? (
        <ThemedText type="caption" style={styles.sectionHint}>
          {t('plot_tenure_doc_review_section_hint')}
        </ThemedText>
      ) : null}
      <View style={styles.list}>
        {(() => {
          const seenReasons = new Set<string>();
          return tenureVerifications.map((record) => {
          const detail = describeTenureVerificationReview(record, t);
          const label = formatTenureVerificationDocumentLabel(record, t);
          const reason = formatTenureVerificationReviewMessage(detail, t);
          const showBadge = shouldShowTenureDocStatusBadge(record);
          const showReason = shouldShowTenureDocReasonBox(record, detail, reason, seenReasons);
          const needsReplace = tenureVerificationRequiresReupload(record);
          if (showReason) seenReasons.add(reason);

          return (
            <View key={record.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemIconWrap}>
                  <Ionicons name="document-text-outline" size={20} color="#0A7F59" />
                </View>
                <View style={styles.itemBody}>
                  <ThemedText type="defaultSemiBold" style={styles.itemLabel} numberOfLines={2}>
                    {label}
                  </ThemedText>
                  {showBadge ? (
                    <View style={styles.badgeRow}>
                      <Badge variant={badgeVariant(record.parse_status)} size="sm">
                        {t(tenureDocRowStatusLabelKey(record))}
                      </Badge>
                    </View>
                  ) : needsReplace ? (
                    <View style={styles.badgeRow}>
                      <Badge variant="warning" size="sm">
                        {t('plot_tenure_doc_status_reupload')}
                      </Badge>
                    </View>
                  ) : null}
                </View>
              </View>
              {showReason ? (
                <View style={[styles.reasonBox, reasonBoxStyle(record.parse_status)]}>
                  <Ionicons
                    name={reasonIconName(record.parse_status)}
                    size={16}
                    color={reasonIconColor(record.parse_status)}
                  />
                  <ThemedText type="caption" style={styles.reasonText}>
                    {reason}
                  </ThemedText>
                </View>
              ) : null}
              {needsReplace && onReplaceLandPaper ? (
                <Button variant="secondary" size="sm" fullWidth onPress={onReplaceLandPaper}>
                  {t('plot_tenure_replace_land_paper')}
                </Button>
              ) : null}
            </View>
          );
        });
        })()}
      </View>
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedSection}>{content}</View>;
  }

  return (
    <Card variant="outlined" style={styles.card}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  embeddedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    gap: 8,
  },
  sectionHint: {
    marginTop: 2,
    color: '#6B7280',
    lineHeight: 20,
  },
  awaitingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  awaitingText: {
    flex: 1,
    color: '#6B7280',
    lineHeight: 20,
  },
  list: {
    marginTop: 8,
    gap: 10,
  },
  item: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: '#FAFAFA',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F7F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  itemLabel: {
    color: '#1F2937',
    lineHeight: 22,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  reasonBoxSuccess: {
    backgroundColor: '#F0FAF5',
  },
  reasonBoxFailed: {
    backgroundColor: '#FEF2F2',
  },
  reasonBoxWarning: {
    backgroundColor: '#FFFBEB',
  },
  reasonText: {
    flex: 1,
    minWidth: 0,
    color: '#374151',
    lineHeight: 20,
  },
});
