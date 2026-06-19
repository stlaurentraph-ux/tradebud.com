import type { RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DocumentListRow } from '@/components/evidence/DocumentListRow';
import { ThemedText } from '@/components/themed-text';
import {
  groupProducerDocsByType,
  producerDocSyncStatusBadgeVariant,
  producerDocSyncStatusLabelKey,
  resolveProducerDocSyncStatus,
  type ProducerDocSyncStatus,
} from '@/features/evidence/producerSupportingEvidence';
import {
  PRODUCER_ADDITIONAL_FILE_LABEL,
  PRODUCER_COMMUNITY_FILE_LABEL,
  PRODUCER_LABOR_FILE_LABEL,
  supportingFileRowLabel,
} from '@/features/evidence/producerSupportingFileLabels';
import { useLanguage } from '@/features/state/LanguageContext';
import type { PlotEvidenceItem, PlotEvidenceKind } from '@/features/state/persistence';

type ProducerSupportingFilesSectionProps = {
  profileDocs: PlotEvidenceItem[];
  declarationsComplete: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  sectionRef?: RefObject<View | null>;
  isSignedIn: boolean;
  hasSyncedPlot: boolean;
  pendingProducerSync: boolean;
  onPreview: (item: PlotEvidenceItem) => void;
  onAddDoc: (kind: PlotEvidenceKind, label: string) => Promise<void>;
  onDeleteDoc: (item: PlotEvidenceItem) => void;
};

type SupportingDocType = {
  id: string;
  kind: PlotEvidenceKind;
  label: string;
  titleKey:
    | 'documents_add_supporting_community'
    | 'documents_add_supporting_labor'
    | 'documents_add_supporting_additional';
  hintKey:
    | 'documents_add_supporting_community_hint'
    | 'documents_add_supporting_labor_hint'
    | 'documents_add_supporting_additional_hint';
  icon: keyof typeof Ionicons.glyphMap;
};

const SUPPORTING_DOC_TYPES: SupportingDocType[] = [
  {
    id: 'community',
    kind: 'fpic_repository',
    label: PRODUCER_COMMUNITY_FILE_LABEL,
    titleKey: 'documents_add_supporting_community',
    hintKey: 'documents_add_supporting_community_hint',
    icon: 'people-outline',
  },
  {
    id: 'labor',
    kind: 'labor_evidence',
    label: PRODUCER_LABOR_FILE_LABEL,
    titleKey: 'documents_add_supporting_labor',
    hintKey: 'documents_add_supporting_labor_hint',
    icon: 'camera-outline',
  },
  {
    id: 'additional',
    kind: 'labor_evidence',
    label: PRODUCER_ADDITIONAL_FILE_LABEL,
    titleKey: 'documents_add_supporting_additional',
    hintKey: 'documents_add_supporting_additional_hint',
    icon: 'document-text-outline',
  },
];

export function ProducerSupportingFilesSection({
  profileDocs,
  declarationsComplete,
  expanded,
  onExpandedChange,
  sectionRef,
  isSignedIn,
  hasSyncedPlot,
  pendingProducerSync,
  onPreview,
  onAddDoc,
  onDeleteDoc,
}: ProducerSupportingFilesSectionProps) {
  const { t } = useLanguage();

  const collapsedSummary =
    profileDocs.length > 0
      ? t('documents_supporting_files_collapsed', { n: profileDocs.length })
      : t('documents_supporting_files_subtitle');

  const resolveStatus = (doc: PlotEvidenceItem): ProducerDocSyncStatus =>
    resolveProducerDocSyncStatus({
      item: doc,
      isSignedIn,
      hasSyncedPlot,
      pendingProducerSync,
    });

  return (
    <View ref={sectionRef} collapsable={false} style={[styles.section, !declarationsComplete && styles.sectionMuted]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => onExpandedChange(!expanded)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold">
            {t('documents_supporting_files_title')}{' '}
            <ThemedText type="caption" style={styles.optional}>
              {t('documents_supporting_files_optional')}
            </ThemedText>
          </ThemedText>
          {!expanded ? (
            <ThemedText type="caption" style={styles.subtitle}>
              {collapsedSummary}
            </ThemedText>
          ) : (
            <ThemedText type="caption" style={styles.subtitle}>
              {t('documents_supporting_files_subtitle')}
            </ThemedText>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#0A7F59" />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <ThemedText type="caption" style={styles.typePrompt}>
            {t('documents_add_supporting_file_prompt')}
          </ThemedText>
          <View style={styles.typeList}>
            {SUPPORTING_DOC_TYPES.map((docType) => {
              const typeDocs = groupProducerDocsByType(profileDocs, docType);
              return (
                <View key={docType.id} style={styles.typeBlock}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!declarationsComplete}
                    onPress={() => void onAddDoc(docType.kind, docType.label)}
                    style={({ pressed }) => [
                      styles.typeRow,
                      !declarationsComplete && styles.typeRowDisabled,
                      pressed && declarationsComplete && styles.typeRowPressed,
                    ]}
                  >
                    <View style={styles.typeIconWrap}>
                      <Ionicons name={docType.icon} size={20} color="#0A7F59" />
                    </View>
                    <View style={styles.typeText}>
                      <ThemedText type="defaultSemiBold">{t(docType.titleKey)}</ThemedText>
                      <ThemedText type="caption" style={styles.typeHint}>
                        {t(docType.hintKey)}
                      </ThemedText>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color="#0A7F59" />
                  </Pressable>
                  {typeDocs.length > 0 ? (
                    <View style={styles.typeDocList}>
                      {typeDocs.map((doc) => {
                        const status = resolveStatus(doc);
                        return (
                          <DocumentListRow
                            key={doc.id}
                            label={supportingFileRowLabel(doc)}
                            dateLabel={new Date(doc.takenAt).toLocaleDateString()}
                            statusLabel={t(producerDocSyncStatusLabelKey(status))}
                            statusVariant={producerDocSyncStatusBadgeVariant(status)}
                            uri={doc.uri}
                            mimeType={doc.mimeType}
                            onPress={() => onPreview(doc)}
                            onDelete={() => onDeleteDoc(doc)}
                            deleteAccessibilityLabel={t('delete_land_document_action')}
                          />
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
          {!declarationsComplete ? (
            <ThemedText type="caption" style={styles.waitHint}>
              {t('documents_supporting_files_after_declarations')}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 0,
  },
  sectionMuted: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optional: {
    color: '#6B7280',
    fontWeight: '400',
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 20,
  },
  body: {
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  typePrompt: {
    color: '#4B5563',
    lineHeight: 20,
  },
  typeList: {
    gap: 12,
  },
  typeBlock: {
    gap: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeRowPressed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  typeRowDisabled: {
    opacity: 0.55,
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  typeText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  typeHint: {
    color: '#6B7280',
    lineHeight: 18,
  },
  typeDocList: {
    gap: 8,
    paddingLeft: 4,
  },
  waitHint: {
    color: '#6B7280',
    lineHeight: 20,
  },
});
