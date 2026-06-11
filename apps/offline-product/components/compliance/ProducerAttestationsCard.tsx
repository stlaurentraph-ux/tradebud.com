import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Brand } from '@/constants/theme';
import {
  applyProducerAttestationsToFarmer,
  hasProducerAttestationsComplete,
} from '@/features/compliance/farmerDeclarations';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { logAuditEvent } from '@/features/state/persistence';

export function ProducerAttestationsCard() {
  const { farmer, setFarmer } = useAppState();
  const { t } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);
  const [fpicConsent, setFpicConsent] = useState(false);
  const [laborNoChildLabor, setLaborNoChildLabor] = useState(false);
  const [laborNoForcedLabor, setLaborNoForcedLabor] = useState(false);
  const [saving, setSaving] = useState(false);

  const complete = hasProducerAttestationsComplete(farmer);

  const openEditor = useCallback(() => {
    setFpicConsent(farmer?.fpicConsent ?? false);
    setLaborNoChildLabor(farmer?.laborNoChildLabor ?? false);
    setLaborNoForcedLabor(farmer?.laborNoForcedLabor ?? false);
    setEditorOpen(true);
  }, [farmer]);

  useEffect(() => {
    if (!editorOpen) return;
    setFpicConsent(farmer?.fpicConsent ?? false);
    setLaborNoChildLabor(farmer?.laborNoChildLabor ?? false);
    setLaborNoForcedLabor(farmer?.laborNoForcedLabor ?? false);
  }, [editorOpen, farmer]);

  if (!farmer?.id) return null;

  const canSave =
    fpicConsent && laborNoChildLabor && laborNoForcedLabor;

  const handleSave = async () => {
    if (!farmer || !canSave) return;
    setSaving(true);
    try {
      const next = applyProducerAttestationsToFarmer(
        farmer,
        { fpicConsent, laborNoChildLabor, laborNoForcedLabor },
      );
      setFarmer(next);
      await logAuditEvent({
        userId: farmer.id,
        eventType: 'producer_attestations_updated',
        payload: {
          fpicConsent,
          laborNoChildLabor,
          laborNoForcedLabor,
          selfDeclared: true,
        },
      });
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card variant="outlined" padding="none" style={styles.card}>
        <CardContent style={styles.cardInner}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Brand.primary} />
            <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
              {t('settings_producer_attestations_section')}
            </ThemedText>
            <Badge variant={complete ? 'success' : 'warning'} size="sm">
              {complete
                ? t('settings_producer_attestations_complete')
                : t('settings_producer_attestations_incomplete')}
            </Badge>
          </View>
          <ThemedText type="caption" style={styles.mutedText}>
            {t('settings_producer_attestations_body')}
          </ThemedText>
          <View style={styles.statusRow}>
            <ThemedText type="caption">{t('declarations_fpic_title')}</ThemedText>
            <Badge variant={farmer.fpicConsent ? 'success' : 'default'} size="sm">
              {farmer.fpicConsent ? t('yes') : t('no')}
            </Badge>
          </View>
          <View style={styles.statusRow}>
            <ThemedText type="caption">{t('declarations_labor_title')}</ThemedText>
            <Badge
              variant={
                farmer.laborNoChildLabor && farmer.laborNoForcedLabor ? 'success' : 'default'
              }
              size="sm"
            >
              {farmer.laborNoChildLabor && farmer.laborNoForcedLabor ? t('yes') : t('no')}
            </Badge>
          </View>
          <View style={styles.btnWrap}>
            <Button variant="secondary" size="md" fullWidth onPress={openEditor}>
              {t('settings_producer_attestations_update')}
            </Button>
          </View>
          <View style={styles.btnWrap}>
            <Button variant="outline" size="md" fullWidth onPress={() => router.push('/documents')}>
              {t('settings_producer_attestations_documents')}
            </Button>
          </View>
        </CardContent>
      </Card>

      <Modal visible={editorOpen} animationType="slide" transparent onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ThemedText type="subtitle">{t('settings_producer_attestations_update')}</ThemedText>
            <ThemedText type="caption" style={styles.modalIntro}>
              {t('declarations_intro_body')}
            </ThemedText>

            <Pressable style={styles.declarationItem} onPress={() => setFpicConsent(!fpicConsent)}>
              <Checkbox checked={fpicConsent} onChange={setFpicConsent} />
              <View style={styles.declarationContent}>
                <ThemedText type="defaultSemiBold">{t('declarations_fpic_title')}</ThemedText>
                <ThemedText type="caption">{t('declarations_fpic_body')}</ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={styles.declarationItem}
              onPress={() => {
                const next = !(laborNoChildLabor && laborNoForcedLabor);
                setLaborNoChildLabor(next);
                setLaborNoForcedLabor(next);
              }}
            >
              <Checkbox
                checked={laborNoChildLabor && laborNoForcedLabor}
                onChange={(checked) => {
                  setLaborNoChildLabor(checked);
                  setLaborNoForcedLabor(checked);
                }}
              />
              <View style={styles.declarationContent}>
                <ThemedText type="defaultSemiBold">{t('declarations_labor_title')}</ThemedText>
                <ThemedText type="caption">{t('declarations_labor_body')}</ThemedText>
              </View>
            </Pressable>

            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setEditorOpen(false)}>
                {t('cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={saving}
                disabled={!canSave || saving}
                onPress={() => void handleSave()}
              >
                {t('save')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardInner: { gap: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionLabel: { flex: 1 },
  mutedText: { opacity: 0.75, marginBottom: 4 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  btnWrap: { marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
    maxHeight: '85%',
  },
  modalIntro: { opacity: 0.8 },
  declarationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  declarationContent: { flex: 1, gap: 4 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
});
