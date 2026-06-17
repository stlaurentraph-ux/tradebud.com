import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
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

export function ProducerAttestationsCard() {
  const { farmer, setFarmer } = useAppState();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [fpicConsent, setFpicConsent] = useState(false);
  const [laborNoChildLabor, setLaborNoChildLabor] = useState(false);
  const [laborNoForcedLabor, setLaborNoForcedLabor] = useState(false);
  const [saving, setSaving] = useState(false);

  const complete = hasProducerAttestationsComplete(farmer);

  const startEditing = useCallback(() => {
    setFpicConsent(farmer?.fpicConsent ?? false);
    setLaborNoChildLabor(farmer?.laborNoChildLabor ?? false);
    setLaborNoForcedLabor(farmer?.laborNoForcedLabor ?? false);
    setEditing(true);
  }, [farmer]);

  if (!farmer?.id) return null;

  const canSave = fpicConsent && laborNoChildLabor && laborNoForcedLabor;

  const handleSave = async () => {
    if (!farmer || !canSave) return;
    setSaving(true);
    try {
      const next = applyProducerAttestationsToFarmer(farmer, {
        fpicConsent,
        laborNoChildLabor,
        laborNoForcedLabor,
      });
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
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.rowHeader}>
        <ThemedText type="defaultSemiBold" style={styles.rowTitle} numberOfLines={2}>
          {t('settings_producer_attestations_section')}
        </ThemedText>
        <View style={styles.badgeWrap}>
          <Badge variant={complete ? 'success' : 'warning'} size="sm">
            {complete
              ? t('settings_producer_attestations_complete')
              : t('settings_producer_attestations_incomplete')}
          </Badge>
        </View>
      </View>
      <ThemedText type="caption">{t('settings_producer_attestations_body')}</ThemedText>

      {!editing ? (
        <>
          <View style={styles.statusRow}>
            <ThemedText type="caption" style={styles.statusLabel} numberOfLines={2}>
              {t('declarations_fpic_title')}
            </ThemedText>
            <View style={styles.badgeWrap}>
              <Badge variant={farmer.fpicConsent ? 'success' : 'default'} size="sm">
                {farmer.fpicConsent ? t('yes') : t('no')}
              </Badge>
            </View>
          </View>
          <View style={styles.statusRow}>
            <ThemedText type="caption" style={styles.statusLabel} numberOfLines={2}>
              {t('declarations_labor_title')}
            </ThemedText>
            <View style={styles.badgeWrap}>
              <Badge
                variant={
                  farmer.laborNoChildLabor && farmer.laborNoForcedLabor ? 'success' : 'default'
                }
                size="sm"
              >
                {farmer.laborNoChildLabor && farmer.laborNoForcedLabor ? t('yes') : t('no')}
              </Badge>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              title={
                complete
                  ? t('settings_producer_attestations_update')
                  : t('plot_attestations_sign')
              }
              variant="secondary"
              onPress={startEditing}
            />
          </View>
        </>
      ) : (
        <>
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
          <View style={styles.actions}>
            <Button title={t('cancel')} variant="outline" fullWidth={false} onPress={() => setEditing(false)} />
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
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 2 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  badgeWrap: {
    flexShrink: 0,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  statusLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  declarationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  declarationContent: { flex: 1, gap: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
});
