import { useMemo, type ReactNode } from 'react';
import { Image, Linking, Modal, ScrollView, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackGradientHeader } from '@/components/layout/StackGradientHeader';
import { ThemedText } from '@/components/themed-text';
import { ActionButton as Button } from '@/components/ui/action-button';
import {
  canOpenExternally,
  decodeFpicSignatureUri,
  isImageDocumentUri,
  resolveDocumentOpenStrategy,
  type DocumentPreviewItem,
} from '@/features/evidence/documentPreview';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createDocumentPreviewModalStyles } from '@/components/evidence/documentPreviewModalStyles';

type DocumentPreviewModalProps = {
  visible: boolean;
  item: DocumentPreviewItem | null;
  onClose: () => void;
  onDelete?: () => void;
};

export function DocumentPreviewModal({ visible, item, onClose, onDelete }: DocumentPreviewModalProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDocumentPreviewModalStyles);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const signatureText = useMemo(
    () => (item ? decodeFpicSignatureUri(item.uri) : null),
    [item],
  );
  const isImage = item ? isImageDocumentUri(item.uri, item.mimeType) : false;
  const canOpenDocument = !!item && !isImage && canOpenExternally(item.uri);

  const openExternally = async () => {
    if (!item) return;
    const strategy = resolveDocumentOpenStrategy(item.uri);
    if (!strategy) return;
    try {
      if (strategy === 'browser') {
        await Linking.openURL(item.uri);
        return;
      }
      // Local file/content URIs: never hand a `file://` URI to `Linking.openURL` — Android 7+
      // throws FileUriExposedException. `Sharing.shareAsync` resolves via FileProvider on Android
      // and opens the share sheet / Quick Look on iOS.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(item.uri, item.mimeType ? { mimeType: item.mimeType } : undefined);
        return;
      }
      await Linking.openURL(item.uri);
    } catch {
      // Farmer can retry from the device files app if needed.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <StackGradientHeader
          title={item?.label ?? t('documents_preview_title')}
          onBack={onClose}
          backVariant="close"
        />

        <ScrollView contentContainerStyle={styles.body}>
          {signatureText ? (
            <CardLike>
              <ThemedText type="caption" style={styles.signatureLabel}>
                {t('documents_preview_signature')}
              </ThemedText>
              <ThemedText type="defaultSemiBold">{signatureText}</ThemedText>
            </CardLike>
          ) : isImage && item ? (
            <Image source={{ uri: item.uri }} style={styles.image} resizeMode="contain" />
          ) : item ? (
            <CardLike>
              <Ionicons name="document-outline" size={40} color={colors.textMuted} />
              <ThemedText type="defaultSemiBold" style={styles.fileTitle}>
                {item.label ?? t('documents_preview_file')}
              </ThemedText>
              <ThemedText type="caption" style={styles.fileHint}>
                {t('documents_preview_open_hint')}
              </ThemedText>
            </CardLike>
          ) : null}
        </ScrollView>

        {canOpenDocument ? (
          <View style={styles.footer}>
            <Button title={t('documents_preview_open')} variant="primary" onPress={() => void openExternally()} />
          </View>
        ) : null}
        {onDelete ? (
          <View style={[styles.footer, canOpenDocument ? styles.footerStacked : null]}>
            <Button
              title={t('delete_land_document_action')}
              variant="secondary"
              onPress={onDelete}
              style={styles.deleteBtn}
              textStyle={styles.deleteBtnText}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function CardLike({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createDocumentPreviewModalStyles);
  return <View style={styles.card}>{children}</View>;
}

