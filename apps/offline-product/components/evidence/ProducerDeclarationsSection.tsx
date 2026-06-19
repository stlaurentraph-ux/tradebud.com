import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  applyProducerAttestationsToFarmer,
  hasProducerAttestationsComplete,
} from '@/features/compliance/farmerDeclarations';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { logAuditEvent } from '@/features/state/persistence';

type ProducerDeclarationsSectionProps = {
  sectionRef?: RefObject<View | null>;
  openEditingRequest?: number;
};

function SavedDeclarationRow({ children }: { children: string }) {
  return (
    <View style={styles.savedRow}>
      <Ionicons name="checkmark-circle" size={18} color="#0A7F59" />
      <ThemedText type="caption" style={styles.savedRowText}>
        {children}
      </ThemedText>
    </View>
  );
}

export function ProducerDeclarationsSection({
  sectionRef,
  openEditingRequest = 0,
}: ProducerDeclarationsSectionProps) {
  const { farmer, saveFarmer } = useAppState();
  const { t } = useLanguage();
  const complete = hasProducerAttestationsComplete(farmer);
  const [editing, setEditing] = useState(false);
  const [fpicConsent, setFpicConsent] = useState(false);
  const [laborNoChildLabor, setLaborNoChildLabor] = useState(false);
  const [laborNoForcedLabor, setLaborNoForcedLabor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncDraftFromFarmer = useCallback(() => {
    setFpicConsent(farmer?.fpicConsent ?? false);
    setLaborNoChildLabor(farmer?.laborNoChildLabor ?? false);
    setLaborNoForcedLabor(farmer?.laborNoForcedLabor ?? false);
  }, [farmer]);

  useEffect(() => {
    syncDraftFromFarmer();
  }, [syncDraftFromFarmer]);

  useEffect(() => {
    if (!openEditingRequest || !farmer?.id) return;
    syncDraftFromFarmer();
    setEditing(true);
  }, [openEditingRequest, farmer?.id, syncDraftFromFarmer]);

  if (!farmer?.id) return null;

  const canSave = fpicConsent && laborNoChildLabor && laborNoForcedLabor;
  const showForm = editing || !complete;
  const savedAtLabel =
    farmer.selfDeclaredAt != null
      ? new Date(farmer.selfDeclaredAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  const handleSave = async () => {
    if (!farmer || !canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const next = applyProducerAttestationsToFarmer(farmer, {
        fpicConsent,
        laborNoChildLabor,
        laborNoForcedLabor,
      });
      await saveFarmer(next);
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
      setEditing(false);
    } catch {
      setSaveError(t('documents_declarations_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View ref={sectionRef} collapsable={false} style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold">{t('documents_declarations_title')}</ThemedText>
          <ThemedText type="caption" style={styles.subtitle}>
            {t('documents_declarations_subtitle')}
          </ThemedText>
        </View>
        <Badge variant={complete ? 'success' : 'warning'} size="sm">
          {complete ? t('documents_declarations_status_done') : t('documents_declarations_status_not_done')}
        </Badge>
      </View>

      {showForm ? (
        <>
          <Pressable style={styles.declarationItem} onPress={() => setFpicConsent(!fpicConsent)}>
            <Checkbox checked={fpicConsent} onChange={setFpicConsent} />
            <View style={styles.declarationContent}>
              <ThemedText type="defaultSemiBold">{t('documents_declaration_community_consent')}</ThemedText>
              <ThemedText type="caption">{t('documents_declaration_community_consent_hint')}</ThemedText>
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
              <ThemedText type="defaultSemiBold">{t('documents_declaration_labor')}</ThemedText>
              <ThemedText type="caption">{t('documents_declaration_labor_hint')}</ThemedText>
            </View>
          </Pressable>
          {saveError ? (
            <ThemedText type="caption" style={styles.error}>
              {saveError}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            {complete ? (
              <Button
                title={t('cancel')}
                variant="outline"
                fullWidth={false}
                onPress={() => {
                  syncDraftFromFarmer();
                  setEditing(false);
                  setSaveError(null);
                }}
              />
            ) : null}
            <Button
              title={t('save')}
              variant="primary"
              fullWidth={false}
              loading={saving}
              disabled={!canSave || saving}
              onPress={() => void handleSave()}
            />
          </View>
        </>
      ) : (
        <View style={styles.savedBlock}>
          <SavedDeclarationRow>{t('documents_declaration_community_consent')}</SavedDeclarationRow>
          <SavedDeclarationRow>{t('documents_declaration_labor')}</SavedDeclarationRow>
          {savedAtLabel ? (
            <ThemedText type="caption" style={styles.savedAt}>
              {t('documents_declarations_saved_on', { date: savedAtLabel })}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            <Button
              title={t('documents_declarations_update')}
              variant="secondary"
              onPress={() => {
                syncDraftFromFarmer();
                setEditing(true);
                setSaveError(null);
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 20,
  },
  declarationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  declarationContent: {
    flex: 1,
    gap: 4,
  },
  savedBlock: {
    gap: 8,
    marginTop: 2,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  savedRowText: {
    flex: 1,
    color: '#374151',
    lineHeight: 20,
  },
  savedAt: {
    color: '#6B7280',
    marginTop: 2,
  },
  error: {
    color: '#B42318',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
});
