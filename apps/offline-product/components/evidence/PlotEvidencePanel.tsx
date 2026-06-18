import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { DocumentListRow } from '@/components/evidence/DocumentListRow';
import { DocumentPreviewModal } from '@/components/evidence/DocumentPreviewModal';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ActionButton as Button } from '@/components/ui/action-button';
import { pickAndSavePlotEvidence } from '@/features/evidence/savePlotEvidence';
import {
  autoUploadPlotEvidenceDocuments,
  type AutoUploadOutcome,
} from '@/features/evidence/autoUploadPlotDocuments';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadEvidenceForPlot,
  logAuditEvent,
  persistPlotEvidenceItem,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

type OverlapFlags = { sinaph: boolean; indigenous: boolean };

type PlotEvidencePanelProps = {
  scopeId: string;
  farmerId?: string;
  evidence: PlotEvidenceItem[];
  onEvidenceChange: (items: PlotEvidenceItem[]) => void;
  overlapFlags?: OverlapFlags;
  serverPlotId?: string | null;
  showFpicStructured?: boolean;
  producerFpicCount?: number;
  producerAttestationsComplete?: boolean;
  /** Shared optional audit note (land title + evidence uploads). */
  auditNote?: string;
  onSyncMessage?: (message: string | null, tone?: 'success' | 'info' | 'error') => void;
  onSyncComplete?: () => void | Promise<void>;
};

const PLOT_KIND_BUTTONS: { kind: PlotEvidenceKind; labelKey: string }[] = [
  { kind: 'tenure_evidence', labelKey: 'documents_add_tenure' },
  { kind: 'protected_area_permit', labelKey: 'documents_add_permit' },
];

function badgeForKind(kind: PlotEvidenceKind): { labelKey: string } {
  switch (kind) {
    case 'fpic_repository':
      return { labelKey: 'documents_badge_fpic' };
    case 'tenure_evidence':
      return { labelKey: 'documents_badge_tenure' };
    case 'protected_area_permit':
      return { labelKey: 'documents_badge_permit' };
    default:
      return { labelKey: 'documents_badge_labor' };
  }
}

function fallbackLabel(kind: PlotEvidenceKind): string {
  switch (kind) {
    case 'fpic_repository':
      return 'documents_fpic_fallback';
    case 'tenure_evidence':
      return 'documents_tenure_fallback';
    case 'protected_area_permit':
      return 'documents_permit_fallback';
    default:
      return 'documents_labor_fallback';
  }
}

export function PlotEvidencePanel({
  scopeId,
  farmerId,
  evidence,
  onEvidenceChange,
  overlapFlags,
  serverPlotId,
  showFpicStructured = false,
  producerFpicCount = 0,
  producerAttestationsComplete = false,
  auditNote = '',
  onSyncMessage,
  onSyncComplete,
}: PlotEvidencePanelProps) {
  const { t } = useLanguage();
  const [fpicSignerName, setFpicSignerName] = useState('');
  const [previewItem, setPreviewItem] = useState<{
    uri: string;
    mimeType: string | null;
    label: string | null;
  } | null>(null);

  const applyEvidenceUploadOutcome = (outcome: AutoUploadOutcome, itemCount: number, showAlert = false) => {
    let message: string;
    let tone: 'success' | 'info' | 'error' = 'info';
    switch (outcome.status) {
      case 'uploaded':
        tone = 'success';
        message =
          outcome.uploadedCount > 0
            ? t('plot_documents_auto_upload_ok', { n: outcome.uploadedCount })
            : t('evidence_sync_ok');
        break;
      case 'queued':
        message = t('plot_documents_auto_upload_queued');
        break;
      case 'local_only':
        message =
          outcome.reason === 'not_signed_in'
            ? t('plot_documents_auto_upload_local_only')
            : t('plot_documents_evidence_saved_local', { n: itemCount });
        break;
      default:
        return;
    }
    onSyncMessage?.(message, tone);
    if (showAlert) {
      Alert.alert(t('evidence_sync_title'), message);
    }
  };

  const runEvidenceUpload = async (items: PlotEvidenceItem[], showAlert = false) => {
    if (items.length === 0) return;
    onSyncMessage?.(null);
    const outcome = await autoUploadPlotEvidenceDocuments({
        localPlotId: scopeId,
        serverPlotId: serverPlotId ?? null,
        farmerId,
        items,
        customReason: auditNote,
    });
    applyEvidenceUploadOutcome(outcome, items.length, showAlert);
    if (outcome.status === 'uploaded') {
      await onSyncComplete?.();
    }
  };

  const counts = useMemo(() => {
    const byKind = (kind: PlotEvidenceKind) => evidence.filter((i) => i.kind === kind).length;
    return {
      tenure: byKind('tenure_evidence'),
      fpic: byKind('fpic_repository'),
      permit: byKind('protected_area_permit'),
    };
  }, [evidence]);

  const needsFpic = overlapFlags?.indigenous === true;
  const needsPermit = overlapFlags?.sinaph === true;
  const fpicSatisfied =
    producerFpicCount > 0 || counts.fpic > 0 || producerAttestationsComplete;

  const refresh = async () => {
    const updated = await loadEvidenceForPlot(scopeId);
    onEvidenceChange(updated);
    return updated;
  };

  const addEvidence = async (kind: PlotEvidenceKind, defaultLabel: string) => {
    const updated = await pickAndSavePlotEvidence({
      plotId: scopeId,
      kind,
      defaultLabel,
      pickMessages: {
        pick_source_title: t('evidence_pick_source_title'),
        pick_source_body: t('evidence_pick_source_body'),
        pick_browse_files: t('evidence_pick_browse_files'),
        pick_failed_title: t('evidence_pick_failed_title'),
        pick_failed_body: t('evidence_pick_failed_body'),
        pick_photo_library: t('evidence_pick_photo_library'),
        pick_take_photo: t('evidence_pick_take_photo'),
        pick_cancel: t('cancel'),
        perm_library_title: t('evidence_perm_library_title'),
        perm_library_body: t('evidence_perm_library_body'),
        perm_camera_title: t('evidence_perm_camera_title'),
        perm_camera_body: t('evidence_perm_camera_body'),
      },
    });
    if (updated) {
      onEvidenceChange(updated);
      if (farmerId) {
        logAuditEvent({
          userId: farmerId,
          eventType: 'plot_evidence_added',
          payload: { plotId: scopeId, kind },
        }).catch(() => undefined);
      }
      await runEvidenceUpload(updated, false);
    }
  };

  const addFpicSignature = async () => {
    const name = fpicSignerName.trim();
    if (name.length === 0) return;
    const takenAt = Date.now();
    await persistPlotEvidenceItem({
      plotId: scopeId,
      kind: 'fpic_repository',
      uri: `text:fpic_signature:${encodeURIComponent(name)}:${takenAt}`,
      mimeType: 'text/plain',
      label: `FPIC signature: ${name}`,
      takenAt,
    });
    setFpicSignerName('');
    const updated = await refresh();
    if (farmerId) {
      logAuditEvent({
        userId: farmerId,
        eventType: 'plot_fpic_signed',
        payload: { plotId: scopeId, signerName: name, takenAt },
      }).catch(() => undefined);
    }
    await runEvidenceUpload(updated, false);
  };

  const renderSection = (
    kind: PlotEvidenceKind,
    titleKey: string,
    bodyKey: string,
    required?: boolean,
  ) => {
    const count = evidence.filter((i) => i.kind === kind).length;
    const badge = badgeForKind(kind);
    const addKey = PLOT_KIND_BUTTONS.find((b) => b.kind === kind)?.labelKey ?? 'documents_add_tenure';
    return (
      <Card key={kind} variant="outlined" style={styles.sectionCard} testID={kind === 'tenure_evidence' ? 'plot-tenure-evidence-section' : undefined}>
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle} numberOfLines={2}>
            {t(titleKey)}
          </ThemedText>
          <View style={styles.countBadgeWrap}>
            <Badge variant="default" size="sm">
              {count}
            </Badge>
          </View>
        </View>
        <ThemedText type="caption" style={styles.sectionBody}>
          {t(bodyKey)}
        </ThemedText>
        {required && count === 0 ? (
          <ThemedText type="caption" style={styles.requiredHint}>
            {t('evidence_required_for_plot')}
          </ThemedText>
        ) : null}
        <View style={styles.sectionActions}>
          <Button
            title={t(addKey)}
            variant="secondary"
            onPress={() => void addEvidence(kind, kind)}
            testID={kind === 'tenure_evidence' ? 'plot-add-tenure-evidence' : undefined}
          />
        </View>
        {evidence
          .filter((d) => d.kind === kind)
          .map((d) => (
            <DocumentListRow
              key={d.id}
              label={d.label ?? t(fallbackLabel(kind))}
              dateLabel={new Date(d.takenAt).toLocaleDateString()}
              badgeLabel={t(badge.labelKey)}
              uri={d.uri}
              mimeType={d.mimeType}
              onPress={() =>
                setPreviewItem({
                  uri: d.uri,
                  mimeType: d.mimeType,
                  label: d.label ?? t(fallbackLabel(kind)),
                })
              }
            />
          ))}
      </Card>
    );
  };

  return (
    <View style={styles.wrap}>
      {(needsFpic && !fpicSatisfied) || (needsPermit && counts.permit === 0) || counts.tenure === 0 ? (
        <Card variant="outlined" style={styles.promptCard}>
          <ThemedText type="defaultSemiBold">{t('evidence_upload_prompt_title')}</ThemedText>
          <ThemedText type="caption" style={styles.promptBody}>
            {t('evidence_upload_prompt_body')}
          </ThemedText>
        </Card>
      ) : null}

      {needsFpic && producerFpicCount === 0 && !producerAttestationsComplete ? (
        <Card variant="outlined" style={styles.sectionCard}>
          <ThemedText type="defaultSemiBold">{t('documents_fpic_section')}</ThemedText>
          <ThemedText type="caption" style={styles.sectionBody}>
            {t('plot_documents_producer_fpic_hint')}
          </ThemedText>
          <View style={{ marginTop: 10 }}>
            <Button
              title={t('plot_documents_open_documents')}
              variant="secondary"
              onPress={() => router.push('/documents')}
            />
          </View>
        </Card>
      ) : null}

      {renderSection('tenure_evidence', 'documents_tenure_section', 'documents_tenure_body', true)}
      {renderSection(
        'protected_area_permit',
        'documents_permits_section',
        'documents_permits_body',
        needsPermit,
      )}

      {showFpicStructured ? (
        <Card variant="outlined" style={styles.sectionCard}>
          <ThemedText type="defaultSemiBold">{t('evidence_fpic_structured_title')}</ThemedText>
          <ThemedText type="caption" style={styles.sectionBody}>
            {t('evidence_fpic_structured_body')}
          </ThemedText>
          <View style={styles.sectionActions}>
            <Button
              title={t('evidence_fpic_add_minutes')}
              variant="secondary"
              onPress={() => void addEvidence('fpic_repository', 'fpic_minutes')}
            />
            <Button
              title={t('evidence_fpic_add_mapping')}
              variant="secondary"
              onPress={() => void addEvidence('fpic_repository', 'fpic_participatory_mapping')}
            />
            <Button
              title={t('evidence_fpic_add_agreement')}
              variant="secondary"
              onPress={() => void addEvidence('fpic_repository', 'fpic_social_agreement')}
            />
          </View>
          <Input
            label={t('evidence_fpic_signer_label')}
            placeholder={t('evidence_fpic_signer_ph')}
            value={fpicSignerName}
            onChangeText={setFpicSignerName}
            containerStyle={{ marginTop: 10 }}
          />
          <View style={{ marginTop: 10 }}>
            <Button
              title={t('evidence_fpic_add_signature')}
              variant="primary"
              onPress={() => void addFpicSignature()}
            />
          </View>
        </Card>
      ) : null}

      <DocumentPreviewModal
        visible={previewItem != null}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionCard: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  countBadgeWrap: {
    flexShrink: 0,
    marginTop: 2,
  },
  sectionBody: {
    marginBottom: 4,
  },
  sectionActions: {
    gap: 10,
    marginTop: 10,
  },
  promptCard: {
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  promptBody: {
    marginTop: 6,
  },
  requiredHint: { marginTop: 6, color: '#B45309' },
});
