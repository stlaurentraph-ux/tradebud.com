import {
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { localeCodes, localeNames, locales, type SupportedLanguage } from '@/features/i18n/config';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createLanguagePickerSheetStyles } from '@/components/languagePickerSheetStyles';

type LanguagePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function LanguagePickerSheet({ visible, onClose }: LanguagePickerSheetProps) {
  const { lang, setLang, t } = useLanguage();
  const colors = useAppColors();
  const styles = useThemedStyles(createLanguagePickerSheetStyles);

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
              <Ionicons name="close" size={22} color={colors.iconMuted} />
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
                    <Ionicons name="checkmark-circle" size={22} color={colors.link} />
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
