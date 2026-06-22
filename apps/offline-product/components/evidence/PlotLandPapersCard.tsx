import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DocumentListRow } from '@/components/evidence/DocumentListRow';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import { Input } from '@/components/ui/input';
import { ActionButton as Button } from '@/components/ui/action-button';
import { useLanguage } from '@/features/state/LanguageContext';
import type { PlotEvidenceItem } from '@/features/state/persistence';
import type { PlotTitlePhoto } from '@/features/state/persistence.native';
import type { DocumentPreviewItem } from '@/features/evidence/documentPreview';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createPlotLandPapersCardStyles } from '@/components/evidence/plotLandPapersCardStyles';

const PRIVACY_POLICY_URL = 'https://tracebud.com/privacy';

type PlotLandPapersCardProps = {
  titlePhotos: PlotTitlePhoto[];
  tenureEvidence: PlotEvidenceItem[];
  cadastralKey: string;
  onCadastralKeyChange: (value: string) => void;
  uploadingProof: boolean;
  onUploadProof: () => void;
  onPreview: (params: {
    uri: string;
    mimeType: string | null;
    label: string;
    deleteTarget?: DocumentPreviewItem['deleteTarget'];
  }) => void;
  onDeleteTitlePhoto: (photo: PlotTitlePhoto) => void;
  onDeleteTenureEvidence: (item: PlotEvidenceItem) => void;
  notSyncedHint?: string | null;
  syncMessage?: string | null;
  syncTone?: 'success' | 'error' | 'info';
};

export function PlotLandPapersCard({
  titlePhotos,
  tenureEvidence,
  cadastralKey,
  onCadastralKeyChange,
  uploadingProof,
  onUploadProof,
  onPreview,
  onDeleteTitlePhoto,
  onDeleteTenureEvidence,
  notSyncedHint,
  syncMessage,
  syncTone = 'info',
}: PlotLandPapersCardProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createPlotLandPapersCardStyles);
  const { t } = useLanguage();
  const [showDataInfo, setShowDataInfo] = useState(false);

  const savedCount = titlePhotos.length + tenureEvidence.length;

  return (
    <Card variant="outlined" style={styles.card}>
      <ThemedText type="defaultSemiBold">{t('plot_land_papers_title')}</ThemedText>
      <ThemedText type="caption" style={styles.body}>
        {t('plot_land_papers_body')}
      </ThemedText>
      <ThemedText type="caption" style={styles.formats}>
        {t('plot_land_papers_formats')}
      </ThemedText>

      <View style={styles.actions}>
        <Button
          title={
            uploadingProof
              ? t('evidence_sync_busy')
              : savedCount > 0
                ? t('plot_land_papers_upload_proof_count', { n: savedCount })
                : t('plot_land_papers_upload_proof')
          }
          variant="primary"
          disabled={uploadingProof}
          onPress={onUploadProof}
          testID="plot-upload-land-proof"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('plot_land_papers_data_info_link')}
          onPress={() => setShowDataInfo((open) => !open)}
          style={styles.dataInfoLink}
          testID="plot-land-papers-data-info"
        >
          <Ionicons name="information-circle-outline" size={16} color={colors.link} />
          <ThemedText type="caption" style={styles.dataInfoLinkText}>
            {t('plot_land_papers_data_info_link')}
          </ThemedText>
          <Ionicons
            name={showDataInfo ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.link}
          />
        </Pressable>
        {showDataInfo ? (
          <View style={styles.dataInfoExpanded}>
            <ThemedText type="caption" style={styles.dataInfoBody}>
              {t('plot_land_papers_data_info_body')}
            </ThemedText>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('plot_land_papers_privacy_link')}
              onPress={() => {
                void Linking.openURL(PRIVACY_POLICY_URL);
              }}
              style={styles.privacyLink}
              testID="plot-land-papers-privacy-link"
            >
              <ThemedText type="caption" style={styles.privacyLinkText}>
                {t('plot_land_papers_privacy_link')}
              </ThemedText>
              <Ionicons name="open-outline" size={14} color={colors.link} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {titlePhotos.length > 0 ? (
        <View style={styles.photoRow} testID="plot-land-title-photo-count">
          {titlePhotos.map((p) =>
            p.uri?.trim() ? (
              <View key={p.id} style={styles.photoThumbWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    onPreview({
                      uri: p.uri,
                      mimeType: 'image/jpeg',
                      label: t('plot_land_papers_title'),
                      deleteTarget: { kind: 'land_title_photo', id: p.id },
                    })
                  }
                >
                  <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('delete_land_document_action')}
                  onPress={() => onDeleteTitlePhoto(p)}
                  style={styles.photoDeleteBtn}
                  hitSlop={6}
                >
                  <Ionicons name="close-circle" size={22} color={Brand.deforestationDetected} />
                </Pressable>
              </View>
            ) : null,
          )}
        </View>
      ) : null}

      {tenureEvidence.length > 0 ? (
        <View style={styles.fileList}>
          {tenureEvidence.map((d) => (
            <DocumentListRow
              key={d.id}
              label={d.label ?? t('documents_tenure_fallback')}
              dateLabel={new Date(d.takenAt).toLocaleDateString()}
              uri={d.uri}
              mimeType={d.mimeType}
              onPress={() =>
                onPreview({
                  uri: d.uri,
                  mimeType: d.mimeType,
                  label: d.label ?? t('documents_tenure_fallback'),
                  deleteTarget: { kind: 'tenure_evidence', id: d.id },
                })
              }
              onDelete={() => onDeleteTenureEvidence(d)}
              deleteAccessibilityLabel={t('delete_land_document_action')}
            />
          ))}
        </View>
      ) : null}

      <Input
        label={t('plot_documents_cadastral_label_optional')}
        placeholder={t('plot_documents_cadastral_ph')}
        value={cadastralKey}
        onChangeText={onCadastralKeyChange}
        containerStyle={{ marginTop: 10 }}
      />

      {notSyncedHint ? (
        <ThemedText type="caption" style={styles.syncHint}>
          {notSyncedHint}
        </ThemedText>
      ) : null}

      {syncMessage ? (
        <ThemedText
          type="caption"
          style={[
            styles.syncFeedback,
            syncTone === 'success'
              ? styles.syncFeedbackSuccess
              : syncTone === 'error'
                ? styles.syncFeedbackError
                : styles.syncFeedbackInfo,
          ]}
        >
          {syncMessage}
        </ThemedText>
      ) : null}
    </Card>
  );
}

