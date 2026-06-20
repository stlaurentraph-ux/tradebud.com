import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { queueProducerAttestationAuditSync } from '@/features/sync/queueDeclarationAuditSync';

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
  const lastOpenEditingRequestRef = useRef(0);

  const farmerId = farmer?.id;
  const persistedFpic = farmer?.fpicConsent === true;
  const persistedLaborChild = farmer?.laborNoChildLabor === true;
  const persistedLaborForced = farmer?.laborNoForcedLabor === true;

  const loadDraftFromPersisted = useCallback(() => {
    setFpicConsent(persistedFpic);
    setLaborNoChildLabor(persistedLaborChild);
    setLaborNoForcedLabor(persistedLaborForced);
  }, [persistedFpic, persistedLaborChild, persistedLaborForced]);

  // New farmer only — do not re-sync on every reloadFromDisk object refresh.
  useEffect(() => {
    loadDraftFromPersisted();
    setEditing(false);
  }, [farmerId, loadDraftFromPersisted]);

  useEffect(() => {
    if (!openEditingRequest || openEditingRequest === lastOpenEditingRequestRef.current) return;
    if (!farmerId) return;
    lastOpenEditingRequestRef.current = openEditingRequest;
    loadDraftFromPersisted();
    setEditing(true);
  }, [openEditingRequest, farmerId, loadDraftFromPersisted]);

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
      void queueProducerAttestationAuditSync(next);
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
          <Checkbox
            checked={fpicConsent}
            onChange={setFpicConsent}
            label={t('documents_declaration_community_consent')}
            description={t('documents_declaration_community_consent_hint')}
            style={styles.declarationItem}
          />
          <Checkbox
            checked={laborNoChildLabor && laborNoForcedLabor}
            onChange={(checked) => {
              setLaborNoChildLabor(checked);
              setLaborNoForcedLabor(checked);
            }}
            label={t('documents_declaration_labor')}
            description={t('documents_declaration_labor_hint')}
            style={styles.declarationItem}
          />
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
                  loadDraftFromPersisted();
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
                loadDraftFromPersisted();
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
    paddingVertical: 6,
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
