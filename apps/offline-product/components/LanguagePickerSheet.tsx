import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { localeCodes, localeNames, locales, type SupportedLanguage } from '@/features/i18n/config';
import { useLanguage } from '@/features/state/LanguageContext';

type LanguagePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function LanguagePickerSheet({ visible, onClose }: LanguagePickerSheetProps) {
  const { lang, setLang, t } = useLanguage();

  const pick = (code: SupportedLanguage) => {
    setLang(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {t('language_picker_title')}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {locales.map((code) => {
              const selected = lang === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => pick(code)}
                  style={[styles.row, selected && styles.rowSelected]}
                >
                  <View style={styles.rowText}>
                    <ThemedText type="defaultSemiBold">{localeNames[code]}</ThemedText>
                    <ThemedText type="caption" style={styles.code}>
                      {localeCodes[code]}
                    </ThemedText>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={Brand.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    maxHeight: '78%',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: '#0B4F3B',
  },
  list: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    marginBottom: 4,
  },
  rowSelected: {
    backgroundColor: '#E6F7EF',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  code: {
    color: '#6B7280',
  },
});
