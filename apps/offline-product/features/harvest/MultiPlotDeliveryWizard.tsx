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
  showBuyerInviteAlert,
} from '@/features/harvest/completeHarvestSubmitFlow';
import {
  buildMultiPlotLinesFromWeights,
  canAddLineToSession,
  inlineMultiPlotWeightsComplete,
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
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';
import type { TranslateFn } from '@/features/i18n/translate';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createMultiPlotDeliveryWizardStyles } from '@/features/harvest/multiPlotDeliveryWizardStyles';

type WizardStep = 'list' | 'pick_plot' | 'weight' | 'inline_weights' | 'review' | 'complete';

function initialWeightByPlotIds(plotIds: string[] | null | undefined): Record<string, string> {
  if (!plotIds?.length) return {};
  return Object.fromEntries(plotIds.map((id) => [id, '']));
}

function initialWizardStep(
  restrictedPlotIds: string[] | null | undefined,
): WizardStep {
  if (restrictedPlotIds && restrictedPlotIds.length >= 2) return 'inline_weights';
  return 'list';
}

export interface MultiPlotDeliveryWizardProps {
  t: TranslateFn;
  farmerId: string;
  mergedHarvestPlots: HarvestPlotOption[];
  deliveredByPlot: Record<string, number>;
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
  onExit: () => void;
  onComplete: () => Promise<void>;
  onRegisterBackHandler: (handler: (() => void) | null) => void;
  onHeaderTitleChange: (title: string) => void;
  /** When set, plot picker only offers these plots (e.g. pre-ticked on Deliveries). */
  restrictedPlotIds?: string[] | null;
}

export function MultiPlotDeliveryWizard({
  t,
  farmerId,
  mergedHarvestPlots,
  deliveredByPlot,
  localPlots,
  backendPlots,
  plotServerLinks,
  onExit,
  onComplete,
  onRegisterBackHandler,
  onHeaderTitleChange,
  restrictedPlotIds = null,
}: MultiPlotDeliveryWizardProps) {
  const styles = useThemedStyles(createMultiPlotDeliveryWizardStyles);
  const [step, setStep] = useState<WizardStep>(() => initialWizardStep(restrictedPlotIds));
  const [lines, setLines] = useState<MultiPlotDeliveryLine[]>([]);
  const [weightByPlotId, setWeightByPlotId] = useState<Record<string, string>>(() =>
    initialWeightByPlotIds(restrictedPlotIds),
  );
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

  const inlinePlots = useMemo(() => {
    if (!restrictedPlotIds?.length) return [];
    const allowed = new Set(restrictedPlotIds);
    return mergedHarvestPlots.filter((p) => allowed.has(p.id));
  }, [mergedHarvestPlots, restrictedPlotIds]);

  const inlinePreviewLines = useMemo(() => {
    const built = buildMultiPlotLinesFromWeights({
      plots: inlinePlots,
      weightByPlotId,
      deliveredByPlot,
    });
    return built.ok ? built.lines : [];
  }, [deliveredByPlot, inlinePlots, weightByPlotId]);

  const canSubmitInline = useMemo(
    () =>
      inlineMultiPlotWeightsComplete({
        plots: inlinePlots,
        weightByPlotId,
        deliveredByPlot,
      }) && isDeliveryRecipientComplete(deliveryRecipient),
    [deliveredByPlot, deliveryRecipient, inlinePlots, weightByPlotId],
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
      inline_weights: t('harvest_header_weight'),
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
        if (restrictedPlotIds?.length) {
          setStep('inline_weights');
          return;
        }
        setStep('list');
        return;
      }
      if (step === 'inline_weights') {
        onExit();
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
  }, [onExit, onRegisterBackHandler, restrictedPlotIds, step]);

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
    setLines((prev) => {
      const nextLines = [
        ...prev,
        { plotId: selectedPlot.id, plotName: selectedPlot.name, kg: validation.value },
      ];
      return nextLines;
    });
    setWeightInput('');
    setSelectedPlotId(null);
    setMessage(null);
    setStep('list');
  };

  const handleSubmitSession = async (linesToSubmit?: MultiPlotDeliveryLine[]) => {
    const submitLines = linesToSubmit ?? lines;
    if (submitLines.length === 0 || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const nextResults = await submitMultiPlotDeliverySession({
        farmerId,
        lines: submitLines,
        localPlots,
        backendPlots,
        plotServerLinks,
        deliveryRecipient,
        t,
      });
      setResults(nextResults);
      const invitePending = nextResults.some((row) => row.buyerInvitePending);
      if (invitePending && deliveryRecipient?.mode === 'email') {
        showBuyerInviteAlert({
          t,
          invite: {
            email: deliveryRecipient.email,
            pending: true,
            inviteSent: false,
          },
          onContinue: () => {
            void onComplete().finally(() => setStep('complete'));
          },
        });
      } else {
        try {
          await onComplete();
        } catch {
          // Deliveries may have synced even when voucher refresh fails (e.g. schema lag).
        }
        setStep('complete');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineSubmit = async () => {
    const built = buildMultiPlotLinesFromWeights({
      plots: inlinePlots,
      weightByPlotId,
      deliveredByPlot,
    });
    if (!built.ok) {
      setMessage(built.error);
      return;
    }
    if (!isDeliveryRecipientComplete(deliveryRecipient)) {
      return;
    }
    setLines(built.lines);
    await handleSubmitSession(built.lines);
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
              {row.status === 'synced' && !row.qrCodeRef ? (
                <ThemedText type="caption" style={styles.generatingText}>
                  {t('harvest_receipt_qr_generating')}
                </ThemedText>
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

  if (step === 'inline_weights') {
    return (
      <View style={styles.gap}>
        <ThemedText type="defaultSemiBold">{t('multi_plot_delivery_inline_hint')}</ThemedText>
        <View style={styles.gapSm}>
          {inlinePlots.map((plot) => {
            const seasonKg = Math.round(deliveredByPlot[plot.id] ?? 0);
            return (
              <Card key={plot.id} variant="outlined" style={styles.inlinePlotCard}>
                <View style={styles.inlinePlotHeader}>
                  <View style={styles.inlinePlotIcon}>
                    <Ionicons name="leaf-outline" size={18} color="#0B8B63" />
                  </View>
                  <View style={styles.inlinePlotText}>
                    <ThemedText type="subtitle">{plot.name}</ThemedText>
                    <ThemedText type="caption" style={styles.plotSeasonText}>
                      {t('plot_season_delivered_kg', { n: seasonKg.toLocaleString() })}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.inlineWeightRow}>
                  <TextInput
                    placeholder={t('enter_weight_ph')}
                    placeholderTextColor="#B0B8B5"
                    value={weightByPlotId[plot.id] ?? ''}
                    onChangeText={(value) => {
                      setWeightByPlotId((prev) => ({ ...prev, [plot.id]: value }));
                      setMessage(null);
                    }}
                    keyboardType="decimal-pad"
                    style={styles.inlineWeightInput}
                    accessibilityLabel={`${plot.name} ${t('record_weight_label')}`}
                  />
                  <ThemedText type="defaultSemiBold" style={styles.weightUnit}>
                    kg
                  </ThemedText>
                </View>
              </Card>
            );
          })}
        </View>
        {inlinePreviewLines.length > 0 ? (
          <ThemedText type="defaultSemiBold">
            {t('multi_plot_delivery_total', { n: sessionTotalKg(inlinePreviewLines).toLocaleString() })}
          </ThemedText>
        ) : null}
        <DeliveryRecipientFields t={t} value={deliveryRecipient} onChange={setDeliveryRecipient} />
        <Button
          variant="secondary"
          fullWidth
          disabled={submitting || !canSubmitInline}
          style={canSubmitInline ? { backgroundColor: '#0A7F59' } : styles.disabledBtn}
          textStyle={canSubmitInline ? styles.btnTextOnGreen : styles.btnTextDisabled}
          onPress={() => void handleInlineSubmit()}
        >
          {submitting ? t('multi_plot_delivery_submitting') : t('multi_plot_delivery_submit')}
        </Button>
        {message ? (
          <ThemedText type="caption" style={styles.errorText}>
            {message}
          </ThemedText>
        ) : null}
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
    const restrictedSet =
      restrictedPlotIds && restrictedPlotIds.length > 0 ? new Set(restrictedPlotIds) : null;
    const availablePlots = mergedHarvestPlots.filter((p) => {
      if (usedPlotIds.has(p.id)) return false;
      if (restrictedSet && !restrictedSet.has(p.id)) return false;
      return true;
    });
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

