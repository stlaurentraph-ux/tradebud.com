import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  computePlotTenureStatus,
  type PlotTenureStatusBadge,
} from '@/features/compliance/plotTenureStatus';
import { evaluateTenureParseGate } from '@/features/compliance/plotChecklist';
import { PlotTenureDocumentReviewList } from '@/components/compliance/PlotTenureDocumentReviewList';
import { summarizeTenureBlockedBadge } from '@/features/compliance/plotTenureVerificationReview';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { useLanguage } from '@/features/state/LanguageContext';
import type { Plot } from '@/features/state/AppStateContext';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createPlotTenureStatusCardStyles } from '@/components/compliance/plotTenureStatusCardStyles';

type PlotTenureStatusCardProps = {
  plot: Plot;
  cadastralKey: string | null;
  informalTenure: boolean;
  informalTenureNote: string | null;
  titlePhotoCount: number;
  tenureEvidenceCount: number;
  tenureVerifications?: PlotTenureVerificationRecord[];
  isSyncedToServer?: boolean;
  onOpenDocuments?: () => void;
  onReplaceLandPaper?: () => void;
};

function badgeVariant(badge: PlotTenureStatusBadge): 'success' | 'warning' | 'default' | 'info' {
  if (badge === 'formal_documented' || badge === 'producer_in_possession') return 'success';
  if (badge === 'documentation_reviewing') return 'info';
  if (badge === 'documentation_blocked' || badge === 'documentation_local_only') return 'warning';
  if (badge === 'attestation_only') return 'warning';
  return 'default';
}

export function PlotTenureStatusCard({
  plot,
  cadastralKey,
  informalTenure,
  informalTenureNote,
  titlePhotoCount,
  tenureEvidenceCount,
  tenureVerifications = [],
  isSyncedToServer = false,
  onOpenDocuments,
  onReplaceLandPaper,
}: PlotTenureStatusCardProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createPlotTenureStatusCardStyles);
  const { t } = useLanguage();
  const docCount = titlePhotoCount + tenureEvidenceCount;
  const tenureParseGate = evaluateTenureParseGate({
    hasLandDocuments: docCount > 0,
    isSyncedToServer,
    tenureVerifications,
  });
  const status = computePlotTenureStatus({
    informalTenure,
    cadastralKey,
    titlePhotoCount,
    tenureEvidenceCount,
    landTenureDeclared: plot.landTenureDeclared,
    noDeforestationDeclared: plot.noDeforestationDeclared,
    tenureParseGate,
  });

  const pathLabel =
    status.path === 'producer_in_possession'
      ? t('plot_productor_posesion')
      : status.path === 'formal'
        ? t('plot_tenure_path_formal')
        : t('plot_tenure_path_undeclared');

  const blockedBadgeKind =
    status.badge === 'documentation_blocked'
      ? summarizeTenureBlockedBadge(tenureVerifications)
      : null;

  const badgeLabel =
    status.badge === 'formal_documented'
      ? t('plot_tenure_badge_formal')
      : status.badge === 'producer_in_possession'
        ? t('plot_productor_posesion')
        : status.badge === 'attestation_only'
          ? t('plot_tenure_badge_attestation_only')
          : status.badge === 'documentation_reviewing'
            ? t('plot_tenure_badge_checking')
            : status.badge === 'documentation_blocked'
              ? blockedBadgeKind === 'reupload'
                ? t('plot_tenure_badge_upload_again')
                : t('plot_tenure_badge_needs_review')
              : status.badge === 'documentation_local_only'
                ? t('plot_tenure_badge_on_phone')
                : t('plot_tenure_badge_missing');

  const hasVerificationRows = tenureVerifications.length > 0;

  const isEmptyLandState =
    status.path === 'undeclared' &&
    docCount === 0 &&
    !cadastralKey?.trim() &&
    !(informalTenure && informalTenureNote?.trim()) &&
    !hasVerificationRows;

  if (isEmptyLandState) return null;

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={2}>
          {t('plot_tenure_status_title')}
        </ThemedText>
        <View style={styles.headerBadgeWrap}>
          <Badge variant={badgeVariant(status.badge)} size="sm">
            {badgeLabel}
          </Badge>
        </View>
      </View>

      {status.path !== 'undeclared' ? (
        <View style={styles.pathRow}>
          <Ionicons
            name={status.path === 'producer_in_possession' ? 'hand-left-outline' : 'document-text-outline'}
            size={18}
            color={colors.link}
          />
          <ThemedText type="defaultSemiBold">{pathLabel}</ThemedText>
        </View>
      ) : null}

      {cadastralKey?.trim() ? (
        <View style={styles.metaRow}>
          <ThemedText type="caption">{t('plot_tenure_cadastral_key')}</ThemedText>
          <ThemedText type="defaultSemiBold">{cadastralKey.trim()}</ThemedText>
        </View>
      ) : null}

      {informalTenure && informalTenureNote?.trim() ? (
        <View style={styles.noteBlock}>
          <ThemedText type="caption">{t('plot_tenure_informal_note')}</ThemedText>
          <ThemedText type="default">{informalTenureNote.trim()}</ThemedText>
        </View>
      ) : null}

      {(titlePhotoCount > 0 || tenureEvidenceCount > 0) && !hasVerificationRows ? (
        <View style={styles.countsRow}>
          {titlePhotoCount > 0 ? (
            <ThemedText type="caption">{t('plot_tenure_title_photos_count', { n: titlePhotoCount })}</ThemedText>
          ) : null}
          {tenureEvidenceCount > 0 ? (
            <ThemedText type="caption">{t('plot_tenure_evidence_count', { n: tenureEvidenceCount })}</ThemedText>
          ) : null}
        </View>
      ) : null}

      {status.attestationsComplete ? (
        <View style={styles.linkedRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.link} />
          <ThemedText type="caption">{t('plot_tenure_attestations_linked')}</ThemedText>
        </View>
      ) : null}

      {!hasVerificationRows && docCount > 0 && isSyncedToServer ? (
        <View style={styles.aiRow}>
          <Ionicons name="time-outline" size={16} color={colors.iconMuted} />
          <ThemedText type="caption" style={styles.muted}>
            {t('plot_tenure_ai_pending')}
          </ThemedText>
        </View>
      ) : null}

      <PlotTenureDocumentReviewList
        embedded
        tenureVerifications={tenureVerifications}
        titlePhotoCount={titlePhotoCount}
        tenureEvidenceCount={tenureEvidenceCount}
        isSyncedToServer={isSyncedToServer}
        onReplaceLandPaper={onReplaceLandPaper}
      />

      {onOpenDocuments ? (
        <View style={styles.openDocsWrap}>
          <Button variant="secondary" size="md" fullWidth onPress={onOpenDocuments}>
            {t('plot_tenure_open_documents')}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

