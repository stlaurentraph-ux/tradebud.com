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
import { PlotTenureDocumentReviewList } from '@/components/compliance/PlotTenureDocumentReviewList';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { useLanguage } from '@/features/state/LanguageContext';
import type { Plot } from '@/features/state/AppStateContext';

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
};

function badgeVariant(badge: PlotTenureStatusBadge): 'success' | 'warning' | 'default' {
  if (badge === 'formal_documented' || badge === 'producer_in_possession') return 'success';
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
}: PlotTenureStatusCardProps) {
  const { t } = useLanguage();
  const status = computePlotTenureStatus({
    informalTenure,
    cadastralKey,
    titlePhotoCount,
    tenureEvidenceCount,
    landTenureDeclared: plot.landTenureDeclared,
    noDeforestationDeclared: plot.noDeforestationDeclared,
  });

  const pathLabel =
    status.path === 'producer_in_possession'
      ? t('plot_productor_posesion')
      : status.path === 'formal'
        ? t('plot_tenure_path_formal')
        : t('plot_tenure_path_undeclared');

  const badgeLabel =
    status.badge === 'formal_documented'
      ? t('plot_tenure_badge_formal')
      : status.badge === 'producer_in_possession'
        ? t('plot_productor_posesion')
        : status.badge === 'attestation_only'
          ? t('plot_tenure_badge_attestation_only')
          : t('plot_tenure_badge_missing');

  const docCount = titlePhotoCount + tenureEvidenceCount;
  const hasVerificationRows = tenureVerifications.length > 0;

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

      <View style={styles.pathRow}>
        <Ionicons
          name={status.path === 'producer_in_possession' ? 'hand-left-outline' : 'document-text-outline'}
          size={18}
          color="#0A7F59"
        />
        <ThemedText type="defaultSemiBold">{pathLabel}</ThemedText>
      </View>

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

      <View style={styles.countsRow}>
        {titlePhotoCount > 0 ? (
          <ThemedText type="caption">{t('plot_tenure_title_photos_count', { n: titlePhotoCount })}</ThemedText>
        ) : null}
        {tenureEvidenceCount > 0 ? (
          <ThemedText type="caption">{t('plot_tenure_evidence_count', { n: tenureEvidenceCount })}</ThemedText>
        ) : null}
        {docCount === 0 && !cadastralKey?.trim() ? (
          <ThemedText type="caption" style={styles.muted}>
            {t('plot_status_land_hint')}
          </ThemedText>
        ) : null}
      </View>

      {status.attestationsComplete ? (
        <View style={styles.linkedRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#0A7F59" />
          <ThemedText type="caption">{t('plot_tenure_attestations_linked')}</ThemedText>
        </View>
      ) : null}

      {!hasVerificationRows && docCount > 0 && isSyncedToServer ? (
        <View style={styles.aiRow}>
          <Ionicons name="time-outline" size={16} color="#8A8A8A" />
          <ThemedText type="caption" style={styles.muted}>
            {t('plot_tenure_ai_pending')}
          </ThemedText>
        </View>
      ) : null}

      <PlotTenureDocumentReviewList
        tenureVerifications={tenureVerifications}
        titlePhotoCount={titlePhotoCount}
        tenureEvidenceCount={tenureEvidenceCount}
        isSyncedToServer={isSyncedToServer}
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

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  headerBadgeWrap: {
    flexShrink: 0,
    marginTop: 2,
    maxWidth: '48%',
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  noteBlock: {
    marginTop: 4,
    marginBottom: 8,
    gap: 4,
  },
  countsRow: {
    gap: 4,
    marginBottom: 8,
  },
  muted: {
    opacity: 0.75,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  openDocsWrap: {
    marginTop: 4,
  },
});
