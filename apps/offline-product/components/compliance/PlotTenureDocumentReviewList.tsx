import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { tenureDocRowStatusLabelKey } from '@/features/compliance/plotTenureAiReview';
import {
  classifyTenureDocFarmerOutcome,
  formatTenureVerificationDocumentLabel,
  formatTenureVerificationReviewMessage,
  shouldShowTenureDocReasonBox,
  shouldShowTenureDocStatusBadge,
  type TenureDocFarmerOutcome,
} from '@/features/compliance/plotTenureVerificationReview';
import {
  createPlotTenureDocumentReviewListStyles,
  tenureOutcomeReasonBoxStyleKey,
  tenureOutcomeReasonIconColor,
} from '@/components/compliance/plotTenureReviewStyles';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
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

function reasonIconName(outcome: TenureDocFarmerOutcome): keyof typeof Ionicons.glyphMap {
  if (outcome === 'fix_upload') return 'cloud-upload-outline';
  return 'time-outline';
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
  const colors = useAppColors();
  const styles = useThemedStyles(createPlotTenureDocumentReviewListStyles);
  const uploadedCount = titlePhotoCount + tenureEvidenceCount;

  if (uploadedCount === 0) return null;

  const awaitingContent = (
    <>
      <ThemedText type="defaultSemiBold">{t('plot_tenure_doc_review_section')}</ThemedText>
      <View style={styles.awaitingRow}>
        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        <ThemedText type="caption" style={styles.awaitingText}>
          {t('plot_tenure_doc_outcome_checking')}
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
          const label = formatTenureVerificationDocumentLabel(record, t);
          const outcome = classifyTenureDocFarmerOutcome(record);
          const reason = formatTenureVerificationReviewMessage(record, t);
          const showBadge = shouldShowTenureDocStatusBadge(record);
          const showReason = shouldShowTenureDocReasonBox(record, reason, seenReasons);
          const needsReplace = outcome === 'fix_upload';
          if (showReason) seenReasons.add(reason);

          return (
            <View key={record.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemIconWrap}>
                  <Ionicons name="document-text-outline" size={20} color={colors.link} />
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
                <View
                  style={[
                    styles.reasonBox,
                    styles[tenureOutcomeReasonBoxStyleKey(outcome)],
                  ]}
                >
                  <Ionicons
                    name={reasonIconName(outcome)}
                    size={16}
                    color={tenureOutcomeReasonIconColor(colors, outcome)}
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
