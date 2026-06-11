import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ActionButton as Button } from '@/components/ui/action-button';
import { pickAndSavePlotEvidence } from '@/features/evidence/savePlotEvidence';
import { syncPlotEvidenceWithFiles } from '@/features/evidence/syncEvidenceWithFiles';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  enqueuePendingSync,
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
  showSync?: boolean;
  onSyncMessage?: (message: string | null) => void;
  onSyncComplete?: () => void | Promise<void>;
};

const KIND_BUTTONS: { kind: PlotEvidenceKind; labelKey: string }[] = [
  { kind: 'tenure_evidence', labelKey: 'documents_add_tenure' },
  { kind: 'fpic_repository', labelKey: 'documents_add_fpic' },
  { kind: 'protected_area_permit', labelKey: 'documents_add_permit' },
  { kind: 'labor_evidence', labelKey: 'documents_add_labor' },
];

function badgeForKind(kind: PlotEvidenceKind): { labelKey: string; variant: 'info' | 'default' | 'warning' } {
  switch (kind) {
    case 'fpic_repository':
      return { labelKey: 'documents_badge_fpic', variant: 'info' };
    case 'tenure_evidence':
      return { labelKey: 'documents_badge_tenure', variant: 'default' };
    case 'protected_area_permit':
      return { labelKey: 'documents_badge_permit', variant: 'warning' };
    default:
      return { labelKey: 'documents_badge_labor', variant: 'default' };
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
  showSync = false,
  onSyncMessage,
  onSyncComplete,
}: PlotEvidencePanelProps) {
  const { t } = useLanguage();
  const [fpicSignerName, setFpicSignerName] = useState('');
  const [evidenceReason, setEvidenceReason] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  const counts = useMemo(() => {
    const byKind = (kind: PlotEvidenceKind) => evidence.filter((i) => i.kind === kind).length;
    return {
      tenure: byKind('tenure_evidence'),
      fpic: byKind('fpic_repository'),
      permit: byKind('protected_area_permit'),
      labor: byKind('labor_evidence'),
    };
  }, [evidence]);

  const needsFpic = overlapFlags?.indigenous === true;
  const needsPermit = overlapFlags?.sinaph === true;

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
    await refresh();
    if (farmerId) {
      logAuditEvent({
        userId: farmerId,
        eventType: 'plot_fpic_signed',
        payload: { plotId: scopeId, signerName: name, takenAt },
      }).catch(() => undefined);
    }
  };

  const runSync = async () => {
    if (!serverPlotId || !farmerId) {
      onSyncMessage?.(t('evidence_sync_need_plot'));
      return;
    }
    if (evidenceReason.trim().length === 0) {
      onSyncMessage?.(t('evidence_sync_need_reason'));
      return;
    }
    setSyncBusy(true);
    onSyncMessage?.(null);
    try {
      const summary = await syncPlotEvidenceWithFiles({
        localPlotId: scopeId,
        serverPlotId,
        farmerId,
        items: evidence,
        reason: evidenceReason.trim(),
      });
      const parts = [t('evidence_sync_ok')];
      if (summary.uploadedCount > 0) {
        parts.push(t('evidence_sync_files_uploaded', { n: summary.uploadedCount }));
      }
      if (summary.metadataOnlyCount > 0) {
        parts.push(t('evidence_sync_metadata_only', { n: summary.metadataOnlyCount }));
      }
      if (summary.notSignedIn) {
        parts.push(t('evidence_sync_sign_in_for_files'));
      }
      onSyncMessage?.(parts.join(' '));
      await onSyncComplete?.();
    } catch (e) {
      enqueuePendingSync({
        createdAt: Date.now(),
        actionType: 'evidence_sync',
        payloadJson: JSON.stringify({
          plotId: scopeId,
          farmerId,
          reason: evidenceReason.trim(),
        }),
        lastError: e instanceof Error ? e.message : String(e),
      });
      onSyncMessage?.(
        e instanceof Error ? t('evidence_sync_queued', { msg: e.message }) : t('evidence_sync_queued_short'),
      );
    } finally {
      setSyncBusy(false);
    }
  };

  const renderSection = (
    kind: PlotEvidenceKind,
    titleKey: string,
    bodyKey: string,
    required?: boolean,
  ) => {
    const count = evidence.filter((i) => i.kind === kind).length;
    const badge = badgeForKind(kind);
    const addKey = KIND_BUTTONS.find((b) => b.kind === kind)?.labelKey ?? 'documents_add_tenure';
    return (
      <Card key={kind} variant="elevated" style={styles.card}>
        <View style={styles.rowHeader}>
          <ThemedText type="defaultSemiBold">{t(titleKey)}</ThemedText>
          <Badge variant={count > 0 ? 'info' : required ? 'warning' : 'default'} size="sm">
            {count}
          </Badge>
        </View>
        <ThemedText type="caption">{t(bodyKey)}</ThemedText>
        {required && count === 0 ? (
          <ThemedText type="caption" style={styles.requiredHint}>
            {t('evidence_required_for_plot')}
          </ThemedText>
        ) : null}
        <View style={{ gap: 10, marginTop: 10 }}>
          <Button title={t(addKey)} variant="secondary" onPress={() => void addEvidence(kind, kind)} />
        </View>
        {evidence
          .filter((d) => d.kind === kind)
          .slice(0, 4)
          .map((d) => (
            <Card key={d.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{d.label ?? t(fallbackLabel(kind))}</ThemedText>
                <Badge variant={badge.variant} size="sm">
                  {t(badge.labelKey)}
                </Badge>
              </View>
              <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
      </Card>
    );
  };

  return (
    <View style={styles.wrap}>
      {(needsFpic && counts.fpic === 0) || (needsPermit && counts.permit === 0) || counts.tenure === 0 ? (
        <Card variant="outlined" style={styles.promptCard}>
          <ThemedText type="defaultSemiBold">{t('evidence_upload_prompt_title')}</ThemedText>
          <ThemedText type="caption" style={{ marginTop: 6 }}>
            {t('evidence_upload_prompt_body')}
          </ThemedText>
        </Card>
      ) : null}

      {renderSection('tenure_evidence', 'documents_tenure_section', 'documents_tenure_body', true)}
      {renderSection(
        'fpic_repository',
        'documents_fpic_section',
        'documents_fpic_body',
        needsFpic,
      )}
      {renderSection(
        'protected_area_permit',
        'documents_permits_section',
        'documents_permits_body',
        needsPermit,
      )}
      {renderSection('labor_evidence', 'documents_labor_section', 'documents_labor_body')}

      {showFpicStructured ? (
        <Card variant="elevated" style={styles.card}>
          <ThemedText type="defaultSemiBold">{t('evidence_fpic_structured_title')}</ThemedText>
          <ThemedText type="caption">{t('evidence_fpic_structured_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
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

      {showSync ? (
        <Card variant="outlined" style={styles.card}>
          <ThemedText type="defaultSemiBold">{t('evidence_sync_title')}</ThemedText>
          <ThemedText type="caption" style={{ marginTop: 4 }}>
            {t('evidence_sync_body')}
          </ThemedText>
          <Input
            label={t('evidence_sync_reason_label')}
            placeholder={t('evidence_sync_reason_ph')}
            value={evidenceReason}
            onChangeText={setEvidenceReason}
            containerStyle={{ marginTop: 10 }}
          />
          <View style={{ marginTop: 10 }}>
            <Button
              title={syncBusy ? t('evidence_sync_busy') : t('evidence_sync_button')}
              disabled={syncBusy || evidence.length === 0}
              onPress={() => void runSync()}
            />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { marginTop: 2 },
  rowCard: { padding: 12, marginTop: 8 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  promptCard: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  requiredHint: { marginTop: 6, color: '#B45309' },
});
