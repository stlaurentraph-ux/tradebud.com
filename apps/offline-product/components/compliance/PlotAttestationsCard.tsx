import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { buildPlotAttestationFields } from '@/features/compliance/farmerDeclarations';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { logAuditEvent } from '@/features/state/persistence';

type PlotAttestationsCardProps = {
  plot: Plot;
};

export function PlotAttestationsCard({ plot }: PlotAttestationsCardProps) {
  const { farmer, updatePlot } = useAppState();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [landTenure, setLandTenure] = useState(plot.landTenureDeclared ?? false);
  const [noDeforestation, setNoDeforestation] = useState(plot.noDeforestationDeclared ?? false);
  const [saving, setSaving] = useState(false);

  const complete =
    plot.landTenureDeclared === true && plot.noDeforestationDeclared === true;

  const startEditing = useCallback(() => {
    setLandTenure(plot.landTenureDeclared ?? false);
    setNoDeforestation(plot.noDeforestationDeclared ?? false);
    setEditing(true);
  }, [plot.landTenureDeclared, plot.noDeforestationDeclared]);

  const handleSave = async () => {
    if (!farmer?.id || !(landTenure && noDeforestation)) return;
    setSaving(true);
    try {
      const fields = buildPlotAttestationFields({ landTenure, noDeforestation });
      updatePlot(plot.id, fields);
      await logAuditEvent({
        userId: farmer.id,
        eventType: 'plot_compliance_declared',
        payload: {
          plotId: plot.id,
          landTenureDeclared: landTenure,
          noDeforestationDeclared: noDeforestation,
          source: 'plot_detail',
        },
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold">{t('plot_attestations_title')}</ThemedText>
        <Badge variant={complete ? 'success' : 'warning'} size="sm">
          {complete ? t('settings_producer_attestations_complete') : t('settings_producer_attestations_incomplete')}
        </Badge>
      </View>

      {!editing ? (
        <>
          <View style={styles.statusRow}>
            <ThemedText type="caption">{t('declarations_land_tenure_title')}</ThemedText>
            <Badge variant={plot.landTenureDeclared ? 'success' : 'default'} size="sm">
              {plot.landTenureDeclared ? t('yes') : t('no')}
            </Badge>
          </View>
          <View style={styles.statusRow}>
            <ThemedText type="caption">{t('declarations_no_deforestation_title')}</ThemedText>
            <Badge variant={plot.noDeforestationDeclared ? 'success' : 'default'} size="sm">
              {plot.noDeforestationDeclared ? t('yes') : t('no')}
            </Badge>
          </View>
          {!complete ? (
            <View style={{ marginTop: 10 }}>
              <Button variant="secondary" size="md" fullWidth onPress={startEditing}>
                {t('plot_attestations_sign')}
              </Button>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Pressable style={styles.declarationItem} onPress={() => setLandTenure(!landTenure)}>
            <Checkbox checked={landTenure} onChange={setLandTenure} />
            <View style={styles.declarationContent}>
              <ThemedText type="defaultSemiBold">{t('declarations_land_tenure_title')}</ThemedText>
              <ThemedText type="caption">{t('declarations_land_tenure_body')}</ThemedText>
            </View>
          </Pressable>
          <Pressable style={styles.declarationItem} onPress={() => setNoDeforestation(!noDeforestation)}>
            <Checkbox checked={noDeforestation} onChange={setNoDeforestation} />
            <View style={styles.declarationContent}>
              <ThemedText type="defaultSemiBold">{t('declarations_no_deforestation_title')}</ThemedText>
              <ThemedText type="caption">{t('declarations_no_deforestation_body')}</ThemedText>
            </View>
          </Pressable>
          <View style={styles.actions}>
            <Button variant="outline" size="md" onPress={() => setEditing(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={saving}
              disabled={!(landTenure && noDeforestation) || saving}
              onPress={() => void handleSave()}
            >
              {t('save')}
            </Button>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  declarationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  declarationContent: { flex: 1, gap: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
});
