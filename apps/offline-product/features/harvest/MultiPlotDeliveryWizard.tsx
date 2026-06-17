'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateHarvestKg } from '@/features/validation/validators';
import {
  canAddLineToSession,
  sessionTotalKg,
  submitMultiPlotDeliverySession,
  type HarvestPlotOption,
  type MultiPlotDeliveryLine,
  type MultiPlotDeliveryLineResult,
} from '@/features/harvest/multiPlotDeliverySession';
import {
  DeliveryRecipientFields,
  isDeliveryRecipientComplete,
  type DeliveryRecipientSelection,
} from '@/features/harvest/DeliveryRecipientFields';
import type { Plot } from '@/features/state/AppStateContext';
import type { TranslateFn } from '@/features/i18n/translate';

type WizardStep = 'list' | 'pick_plot' | 'weight' | 'review' | 'complete';

export interface MultiPlotDeliveryWizardProps {
  t: TranslateFn;
  farmerId: string;
  mergedHarvestPlots: HarvestPlotOption[];
  deliveredByPlot: Record<string, number>;
  localPlots: Plot[];
  backendPlots: unknown[];
  onExit: () => void;
  onComplete: () => Promise<void>;
  onRegisterBackHandler: (handler: (() => void) | null) => void;
  onHeaderTitleChange: (title: string) => void;
}

export function MultiPlotDeliveryWizard({
  t,
  farmerId,
  mergedHarvestPlots,
  deliveredByPlot,
  localPlots,
  backendPlots,
  onExit,
  onComplete,
  onRegisterBackHandler,
  onHeaderTitleChange,
}: MultiPlotDeliveryWizardProps) {
  const [step, setStep] = useState<WizardStep>('list');
  const [lines, setLines] = useState<MultiPlotDeliveryLine[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<MultiPlotDeliveryLineResult[]>([]);
  const [deliveryRecipient, setDeliveryRecipient] = useState<DeliveryRecipientSelection | null>(
    null,
  );

  const selectedPlot = useMemo(
    () => mergedHarvestPlots.find((p) => String(p.id) === String(selectedPlotId ?? '')) ?? null,
    [mergedHarvestPlots, selectedPlotId],
  );

  const numericWeight = Number(weightInput.trim().replace(',', '.'));
  const canAddWeight = Boolean(
    selectedPlot &&
      canAddLineToSession({
        plot: selectedPlot,
        kg: numericWeight,
        deliveredByPlot,
        existingLines: lines,
      }).ok,
  );

  useEffect(() => {
    const titles: Record<WizardStep, string> = {
      list: t('multi_plot_delivery_title'),
      pick_plot: t('multi_plot_delivery_pick_plot'),
      weight: t('multi_plot_delivery_weight'),
      review: t('multi_plot_delivery_review'),
      complete: t('multi_plot_delivery_complete'),
    };
    onHeaderTitleChange(titles[step]);
  }, [onHeaderTitleChange, step, t]);

  useEffect(() => {
    const goBack = () => {
      if (step === 'complete') {
        onExit();
        return;
      }
      if (step === 'review') {
        setStep('list');
        return;
      }
      if (step === 'weight') {
        setStep('pick_plot');
        setWeightInput('');
        return;
      }
      if (step === 'pick_plot') {
        setStep('list');
        setSelectedPlotId(null);
        return;
      }
      onExit();
    };
    onRegisterBackHandler(goBack);
    return () => onRegisterBackHandler(null);
  }, [onExit, onRegisterBackHandler, step]);

  const removeLine = (plotId: string) => {
    setLines((prev) => prev.filter((line) => line.plotId !== plotId));
  };

  const handleAddLine = () => {
    if (!selectedPlot || !canAddWeight) return;
    const validation = validateHarvestKg(weightInput);
    if (!validation.ok) {
      setMessage(validation.error);
      return;
    }
    setLines((prev) => [
      ...prev,
      { plotId: selectedPlot.id, plotName: selectedPlot.name, kg: validation.value },
    ]);
    setWeightInput('');
    setSelectedPlotId(null);
    setMessage(null);
    setStep('list');
  };

  const handleSubmitSession = async () => {
    if (lines.length === 0 || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const nextResults = await submitMultiPlotDeliverySession({
        farmerId,
        lines,
        localPlots,
        backendPlots,
        deliveryRecipient,
      });
      setResults(nextResults);
      await onComplete();
      setStep('complete');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'complete') {
    const synced = results.filter((row) => row.status === 'synced' && row.qrCodeRef);
    const shareAll = synced.map((row) => `${row.plotName}: ${row.kg} kg — ${row.qrCodeRef}`).join('\n');
    return (
      <View style={styles.gap}>
        <ThemedText type="title" style={styles.completeTitle}>
          {t('multi_plot_delivery_complete')}
        </ThemedText>
        <ThemedText type="default" style={styles.completeBody}>
          {t('multi_plot_delivery_complete_body', { count: String(results.length) })}
        </ThemedText>
        <View style={styles.gapSm}>
          {results.map((row) => (
            <Card key={`${row.plotId}-${row.kg}`} variant="outlined" style={styles.resultCard}>
              <ThemedText type="subtitle">
                {row.plotName} — {row.kg} kg
              </ThemedText>
              {row.status === 'synced' && row.qrCodeRef ? (
                <View style={styles.qrWrap}>
                  <QRCode value={row.qrCodeRef} size={140} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
                  <Pressable onPress={() => void Share.share({ message: row.qrCodeRef ?? '' })}>
                    <ThemedText type="defaultSemiBold" style={styles.voucherCode}>
                      {row.qrCodeRef}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
              {row.status === 'queued' ? (
                <ThemedText type="caption">{t(row.messageKey ?? 'harvest_queued_success_body')}</ThemedText>
              ) : null}
              {row.status === 'error' ? (
                <ThemedText type="caption" style={styles.errorText}>
                  {row.message}
                </ThemedText>
              ) : null}
            </Card>
          ))}
        </View>
        {shareAll ? (
          <Button variant="outline" fullWidth onPress={() => void Share.share({ message: shareAll })}>
            {t('multi_plot_delivery_share_all')}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          fullWidth
          style={{ backgroundColor: '#0A7F59' }}
          textStyle={styles.btnTextOnGreen}
          onPress={onExit}
        >
          {t('back_to_home')}
        </Button>
      </View>
    );
  }

  if (step === 'review') {
    return (
      <View style={styles.gap}>
        <ThemedText type="defaultSemiBold">{t('multi_plot_delivery_review_hint')}</ThemedText>
        <View style={styles.gapSm}>
          {lines.map((line) => (
            <Card key={line.plotId} variant="outlined" style={styles.lineCard}>
              <View style={styles.lineRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle">{line.plotName}</ThemedText>
                  <ThemedText type="caption">{t('kg_total', { n: line.kg.toLocaleString() })}</ThemedText>
                </View>
                <Pressable onPress={() => removeLine(line.plotId)} accessibilityLabel={t('multi_plot_delivery_remove_line')}>
                  <Ionicons name="trash-outline" size={20} color="#B45309" />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
        <ThemedText type="defaultSemiBold">
          {t('multi_plot_delivery_total', { n: sessionTotalKg(lines).toLocaleString() })}
        </ThemedText>
        <DeliveryRecipientFields
          t={t}
          value={deliveryRecipient}
          onChange={setDeliveryRecipient}
        />
        <Button
          variant="secondary"
          fullWidth
          disabled={submitting || !isDeliveryRecipientComplete(deliveryRecipient)}
          style={{ backgroundColor: '#0A7F59' }}
          textStyle={styles.btnTextOnGreen}
          onPress={() => void handleSubmitSession()}
        >
          {submitting ? t('multi_plot_delivery_submitting') : t('multi_plot_delivery_submit')}
        </Button>
        {message ? <ThemedText type="caption">{message}</ThemedText> : null}
      </View>
    );
  }

  if (step === 'weight' && selectedPlot) {
    return (
      <View style={styles.gap}>
        <View style={styles.weightPlotChip}>
          <Ionicons name="leaf-outline" size={16} color="#0B8B63" />
          <ThemedText type="defaultSemiBold" style={styles.weightPlotChipText}>
            {selectedPlot.name}
          </ThemedText>
        </View>
        <Card variant="outlined" style={styles.weightCard}>
          <ThemedText type="caption" style={styles.weightLabel}>
            {t('record_weight_label')}
          </ThemedText>
          <View style={styles.weightInputRow}>
            <TextInput
              placeholder={t('enter_weight_ph')}
              placeholderTextColor="#B0B8B5"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              style={styles.weightInput}
            />
            <ThemedText type="defaultSemiBold" style={styles.weightUnit}>
              kg
            </ThemedText>
          </View>
        </Card>
        <Button
          variant="secondary"
          fullWidth
          disabled={!canAddWeight}
          style={canAddWeight ? { backgroundColor: '#0A7F59' } : styles.disabledBtn}
          textStyle={canAddWeight ? styles.btnTextOnGreen : styles.btnTextDisabled}
          onPress={handleAddLine}
        >
          {t('multi_plot_delivery_add_line')}
        </Button>
        {message ? <ThemedText type="caption">{message}</ThemedText> : null}
      </View>
    );
  }

  if (step === 'pick_plot') {
    const usedPlotIds = new Set(lines.map((line) => line.plotId));
    const availablePlots = mergedHarvestPlots.filter((p) => !usedPlotIds.has(p.id));
    return (
      <View style={styles.gap}>
        <ThemedText type="defaultSemiBold">{t('multi_plot_delivery_pick_plot')}</ThemedText>
        {availablePlots.length === 0 ? (
          <Card variant="outlined" style={styles.plotCard}>
            <ThemedText type="caption">
              {mergedHarvestPlots.length === 0
                ? t('harvest_no_plots_on_device')
                : t('multi_plot_pick_all_added')}
            </ThemedText>
          </Card>
        ) : (
          availablePlots.map((p) => {
            const seasonKg = Math.round(deliveredByPlot[p.id] ?? 0);
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  if (p.localOnly) {
                    Alert.alert(t('harvest_backup_first_title'), t('harvest_backup_first'));
                    return;
                  }
                  setSelectedPlotId(p.id);
                  setWeightInput('');
                  setMessage(null);
                  setStep('weight');
                }}
              >
                <Card variant="outlined" style={[styles.plotCard, p.localOnly ? styles.plotDisabled : null]}>
                  <ThemedText type="subtitle">{p.name}</ThemedText>
                  <ThemedText type="caption" style={styles.plotSeasonText}>
                    {t('plot_season_delivered_kg', { n: seasonKg.toLocaleString() })}
                  </ThemedText>
                  {p.localOnly ? (
                    <ThemedText type="caption" style={styles.plotLocalBadge}>
                      {t('harvest_plot_local_badge')}
                    </ThemedText>
                  ) : null}
                </Card>
              </Pressable>
            );
          })
        )}
        {message ? <ThemedText type="caption">{message}</ThemedText> : null}
      </View>
    );
  }

  return (
    <View style={styles.gap}>
      <Card variant="outlined" style={styles.introCard}>
        <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
          {t('multi_plot_delivery_intro_title')}
        </ThemedText>
        <ThemedText type="caption" style={{ marginTop: 4, color: '#1F6B57' }}>
          {t('multi_plot_delivery_intro_body')}
        </ThemedText>
      </Card>

      {lines.length > 0 ? (
        <View style={styles.gapSm}>
          {lines.map((line) => (
            <Card key={line.plotId} variant="outlined" style={styles.lineCard}>
              <View style={styles.lineRow}>
                <View>
                  <ThemedText type="subtitle">{line.plotName}</ThemedText>
                  <ThemedText type="caption">{t('kg_total', { n: line.kg.toLocaleString() })}</ThemedText>
                </View>
                <Pressable onPress={() => removeLine(line.plotId)}>
                  <Ionicons name="close-circle-outline" size={22} color="#9CA3AF" />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      ) : mergedHarvestPlots.length === 0 ? (
        <Card variant="outlined">
          <ThemedText type="caption">{t('harvest_no_plots_on_device')}</ThemedText>
        </Card>
      ) : (
        <Card variant="outlined" style={styles.introCard}>
          <ThemedText type="caption" style={{ color: '#1F6B57' }}>
            {t('multi_plot_delivery_start_hint', { n: String(mergedHarvestPlots.length) })}
          </ThemedText>
        </Card>
      )}

      <Button
        variant="outline"
        fullWidth
        disabled={mergedHarvestPlots.length === 0}
        onPress={() => setStep('pick_plot')}
      >
        {t('multi_plot_delivery_add_plot')}
      </Button>

      <Button
        variant="secondary"
        fullWidth
        disabled={lines.length === 0}
        style={lines.length > 0 ? { backgroundColor: '#0A7F59' } : styles.disabledBtn}
        textStyle={lines.length > 0 ? styles.btnTextOnGreen : styles.btnTextDisabled}
        onPress={() => setStep('review')}
      >
        {t('multi_plot_delivery_review_cta')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 16 },
  gapSm: { gap: 10 },
  introCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
    padding: 14,
  },
  lineCard: { padding: 14, borderRadius: 16 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  plotCard: { padding: 14, borderRadius: 16 },
  plotDisabled: { opacity: 0.7 },
  plotSeasonText: { color: '#6B7280', marginTop: 2 },
  plotLocalBadge: { color: '#B45309', marginTop: 4 },
  weightPlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F7F0',
  },
  weightPlotChipText: { color: '#0B4F3B', fontSize: 14 },
  weightCard: { borderRadius: 18, padding: 16, backgroundColor: '#FFFFFF' },
  weightLabel: {
    color: '#374151',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
    marginBottom: 8,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E0DD',
    borderRadius: 14,
    backgroundColor: '#F9FAFA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  weightInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 0,
  },
  weightUnit: { color: '#6B7280', fontSize: 16, minWidth: 24 },
  disabledBtn: { backgroundColor: '#D9D9D9' },
  btnTextOnGreen: { color: '#FFFFFF' },
  btnTextDisabled: { color: '#4B5563' },
  completeTitle: { textAlign: 'center', fontSize: 32, lineHeight: 38 },
  completeBody: { textAlign: 'center', color: '#555555' },
  resultCard: { padding: 14, borderRadius: 16, alignItems: 'center', gap: 8 },
  qrWrap: { alignItems: 'center', gap: 8, marginTop: 8 },
  voucherCode: { color: '#1F2937' },
  errorText: { color: '#B45309' },
});
