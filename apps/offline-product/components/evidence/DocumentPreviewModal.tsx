import { useMemo, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ActionButton as Button } from '@/components/ui/action-button';
import {
  canOpenExternally,
  decodeFpicSignatureUri,
  isImageDocumentUri,
  type DocumentPreviewItem,
} from '@/features/evidence/documentPreview';
import { useLanguage } from '@/features/state/LanguageContext';

type DocumentPreviewModalProps = {
  visible: boolean;
  item: DocumentPreviewItem | null;
  onClose: () => void;
  onDelete?: () => void;
};

export function DocumentPreviewModal({ visible, item, onClose, onDelete }: DocumentPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const signatureText = useMemo(
    () => (item ? decodeFpicSignatureUri(item.uri) : null),
    [item],
  );
  const isImage = item ? isImageDocumentUri(item.uri, item.mimeType) : false;

  const openExternally = async () => {
    if (!item || !canOpenExternally(item.uri)) return;
    try {
      await Linking.openURL(item.uri);
    } catch {
      // Farmer can retry from the device files app if needed.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
            {item?.label ?? t('documents_preview_title')}
          </ThemedText>
        </View>

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
              <Ionicons name="document-outline" size={40} color="#6B7280" />
              <ThemedText type="defaultSemiBold" style={styles.fileTitle}>
                {item.label ?? t('documents_preview_file')}
              </ThemedText>
              <ThemedText type="caption" style={styles.fileHint}>
                {t('documents_preview_open_hint')}
              </ThemedText>
            </CardLike>
          ) : null}
        </ScrollView>

        {item && canOpenExternally(item.uri) && !isImage ? (
          <View style={styles.footer}>
            <Button title={t('documents_preview_open')} variant="primary" onPress={() => void openExternally()} />
          </View>
        ) : null}
        {onDelete ? (
          <View style={[styles.footer, item && canOpenExternally(item.uri) && !isImage ? styles.footerStacked : null]}>
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
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  body: {
    padding: 16,
    flexGrow: 1,
  },
  image: {
    width: '100%',
    minHeight: 320,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  signatureLabel: {
    alignSelf: 'flex-start',
    color: '#6B7280',
  },
  fileTitle: {
    textAlign: 'center',
  },
  fileHint: {
    textAlign: 'center',
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerStacked: {
    paddingTop: 0,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#B91C1C',
  },
});
