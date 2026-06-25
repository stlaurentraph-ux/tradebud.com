import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand, Spacing } from '@/constants/theme';
import { useEnumeration } from '@/features/enumeration/EnumerationContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';

type ProvisionalMemberSheetProps = {
  visible: boolean;
  onClose: () => void;
  onRequireSignIn: () => void;
};

export function ProvisionalMemberSheet({
  visible,
  onClose,
  onRequireSignIn,
}: ProvisionalMemberSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isSignedIn } = useSignInSheet();
  const { createProvisionalMember, selectMember } = useEnumeration();
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFullName('');
    setVillage('');
    setPhone('');
    setNationalId('');
    setEmail('');
  };

  const closeSheet = () => {
    reset();
    onClose();
  };

  const validationMessage = (code: string) => {
    switch (code) {
      case 'name_required':
        return t('enumeration_error_name_required');
      case 'village_required':
        return t('enumeration_error_village_required');
      case 'phone_or_id_required':
        return t('enumeration_error_phone_or_id_required');
      case 'invalid_email':
        return t('enumeration_error_invalid_email');
      default:
        return t('warning');
    }
  };

  const submit = async (allowDuplicate = false) => {
    if (!isSignedIn) {
      closeSheet();
      onRequireSignIn();
      return;
    }
    setBusy(true);
    try {
      const result = await createProvisionalMember(
        { fullName, village, phone, nationalId, email },
        { allowDuplicate },
      );
      if (!result.ok) {
        if (result.error === 'validation' && result.validationError) {
          Alert.alert(t('warning'), validationMessage(result.validationError));
          return;
        }
        if (result.error === 'duplicate' && result.matches?.length) {
          const match = result.matches[0];
          Alert.alert(t('enumeration_duplicate_title'), t('enumeration_duplicate_body', {
            name: match.entry.fullName,
            village: match.entry.village,
          }), [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('enumeration_use_existing_member'),
              onPress: () => {
                void selectMember(match.entry.farmerId).finally(closeSheet);
              },
            },
            {
              text: t('enumeration_create_anyway'),
              style: 'destructive',
              onPress: () => {
                void submit(true);
              },
            },
          ]);
          return;
        }
        return;
      }
      closeSheet();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeSheet}>
      <Pressable style={styles.backdrop} onPress={closeSheet} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold">{t('enumeration_add_member')}</ThemedText>
          <Pressable onPress={closeSheet} hitSlop={12}>
            <Ionicons name="close" size={22} color={Brand.primary} />
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <ThemedText type="caption">{t('enumeration_add_member_hint')}</ThemedText>
          <Input
            testID="enumeration-provisional-name"
            label={t('enumeration_field_name')}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Input
            testID="enumeration-provisional-village"
            label={t('enumeration_field_village')}
            value={village}
            onChangeText={setVillage}
            autoCapitalize="words"
          />
          <Input
            testID="enumeration-provisional-phone"
            label={t('enumeration_field_phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            testID="enumeration-provisional-national-id"
            label={t('enumeration_field_national_id')}
            value={nationalId}
            onChangeText={setNationalId}
            autoCapitalize="characters"
          />
          <Input
            testID="enumeration-provisional-email"
            label={t('enumeration_field_email_optional')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button testID="enumeration-provisional-save" disabled={busy} onPress={() => void submit(false)}>
            {busy ? t('enumeration_saving') : t('enumeration_save_member')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    paddingBottom: Spacing.lg,
  },
});
