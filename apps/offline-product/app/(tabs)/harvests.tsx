import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View, type ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { HEADER_GRADIENT_COLORS, HEADER_GRADIENT_TEXT } from '@/constants/compactTabHeader';
import { useThemedStyles, useAppColors } from '@/features/theme/useThemedStyles';
import { createHarvestScreenStyles } from '@/screenStyles/harvestScreenStyles';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { buildDeliveryReceiptCatalog } from '@/features/harvest/buildDeliveryReceiptCatalog';
import { loadFieldScopedDeliveryReceipts } from '@/features/harvest/loadFieldScopedDeliveryReceipts';
import { submitHarvestRecord } from '@/features/harvest/submitHarvest';
import {
  buyerLabelForDeliveryRecipient,
  normalizeLocalDeliveryReceipts,
  resolvePlotReceiptFilterIds,
} from '@/features/harvest/localDeliveryReceipts';
import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';
import {
  DeliveryRecipientFields,
  isDeliveryRecipientComplete,
  type DeliveryRecipientSelection,
} from '@/features/harvest/DeliveryRecipientFields';
import { MultiPlotDeliveryWizard } from '@/features/harvest/MultiPlotDeliveryWizard';
import { sumDeliveredKgByPlot } from '@/features/harvest/plotYieldCapacity';
import {
  buildMergedHarvestPlots,
  findHarvestPlotOption,
  resolveLocalPlotForHarvestSubmit,
} from '@/features/harvest/mergeHarvestPlotOptions';
import { resolveServerPlotIdForLocal } from '@/features/plots/plotServerLink';
import { validateHarvestKg } from '@/features/validation/validators';
import { DeliveryReceiptsBrowser } from '@/components/harvest/DeliveryReceiptsBrowser';
import { fetchMergedServerVouchers } from '@/features/harvest/fetchMergedServerVouchers';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { type PlotServerLinks } from '@/features/plots/plotServerLink';
import { deliveryReceiptHref } from '@/features/navigation/receiptRoutes';
import { useFocusCloudPull, useReloadOnServerPlotSyncChanged } from '@/features/sync/useFocusCloudPull';
import { loadPlotServerLinks } from '@/features/state/persistence';

export default function HarvestsScreen() {
  const insets = useSafeAreaInsets();
  const appColors = useAppColors();
  const styles = useThemedStyles(createHarvestScreenStyles);
  const params = useLocalSearchParams<{ plotId?: string; record?: string; focus?: string; receiptsPlot?: string }>();
  const { farmer, plots: localPlots, reloadFromDisk } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<PlotServerLinks>({});
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewHarvestLog, setShowNewHarvestLog] = useState(false);
  const [showRecordWeight, setShowRecordWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [deliveryRecipient, setDeliveryRecipient] = useState<DeliveryRecipientSelection | null>(null);
  const [showMultiPlotDelivery, setShowMultiPlotDelivery] = useState(false);
  const [multiPlotRestrictedIds, setMultiPlotRestrictedIds] = useState<string[] | null>(null);
  const [deliveryPlotSelection, setDeliveryPlotSelection] = useState<Set<string>>(() => new Set());
  const [multiPlotHeaderTitle, setMultiPlotHeaderTitle] = useState('');
  const multiPlotBackRef = useRef<(() => void) | null>(null);
  const deliveryDeepLinkHandled = useRef(false);
  const clearingFocusRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const receiptsSectionY = useRef(0);
  const [pendingReceiptsScroll, setPendingReceiptsScroll] = useState(false);
  const [deviceReceipts, setDeviceReceipts] = useState<DeliveryReceiptRecord[]>([]);
  const [mergedReceipts, setMergedReceipts] = useState<DeliveryReceiptRecord[]>([]);
  const [receiptsPlotId, setReceiptsPlotId] = useState<string | null>(null);

  const refreshHarvestData = useCallback(async (options?: { forcePlotFetch?: boolean }) => {
    if (!farmer) {
      setBackendPlots([]);
      setPlotServerLinks({});
      setVouchers([]);
      setDeviceReceipts([]);
      return;
    }

    if (!farmer) {
      setBackendPlots([]);
      setPlotServerLinks({});
      setVouchers([]);
      setDeviceReceipts([]);
      setMergedReceipts([]);
      return;
    }

    if (!isSignedIn) {
      const receiptScope = await loadFieldScopedDeliveryReceipts({
        profileFarmerId: farmer.id,
        localPlots,
        isSignedIn: false,
      });
      const localReceipts = normalizeLocalDeliveryReceipts(receiptScope.rows, t);
      setDeviceReceipts(localReceipts);
      setMergedReceipts(localReceipts);
      const existingLinks = await loadPlotServerLinks();
      setBackendPlots([]);
      setPlotServerLinks(existingLinks);
      setVouchers([]);
      return;
    }

    try {
      const catalog = await buildDeliveryReceiptCatalog({
        farmerId: farmer.id,
        localPlots,
        t,
        isSignedIn: true,
        forcePlotFetch: options?.forcePlotFetch === true,
      });
      setDeviceReceipts(catalog.deviceReceipts);
      setBackendPlots(catalog.backendPlots);
      setPlotServerLinks(catalog.plotServerLinks);
      setVouchers(catalog.vouchers);
      setMergedReceipts(catalog.receipts);
    } catch {
      const receiptScope = await loadFieldScopedDeliveryReceipts({
        profileFarmerId: farmer.id,
        localPlots,
        isSignedIn: true,
      });
      const localReceipts = normalizeLocalDeliveryReceipts(receiptScope.rows, t);
      setDeviceReceipts(localReceipts);
      setMergedReceipts(localReceipts);
      const existingLinks = await loadPlotServerLinks();
      setBackendPlots([]);
      setPlotServerLinks(existingLinks);
      setVouchers([]);
    }
  }, [farmer, isSignedIn, localPlots, t]);

  useEffect(() => {
    void refreshHarvestData();
  }, [refreshHarvestData, params.plotId]);

  const refreshAfterCloudPull = useCallback(async () => {
    await refreshHarvestData({ forcePlotFetch: true });
  }, [refreshHarvestData]);

  useFocusCloudPull({
    isSignedIn,
    reloadFromDisk,
    onPullComplete: refreshAfterCloudPull,
    enabled: Boolean(farmer?.id),
  });

  useReloadOnServerPlotSyncChanged({
    reloadFromDisk,
    onSyncChanged: refreshAfterCloudPull,
  });

  /** Server plots plus local plots not returned by the API (offline / not synced yet). */
  const mergedHarvestPlots = useMemo(
    () =>
      buildMergedHarvestPlots({
        backendPlots,
        localPlots,
        farmerId: farmer?.id,
        plotServerLinks,
      }),
    [backendPlots, localPlots, farmer?.id, plotServerLinks],
  );

  const receiptsPlotScope = useMemo(() => {
    if (!receiptsPlotId) return null;
    const local = resolveLocalPlotForHarvestSubmit({
      selectedPlotId: receiptsPlotId,
      localPlots,
      backendPlots,
      plotServerLinks,
    });
    const option = findHarvestPlotOption({
      plotId: receiptsPlotId,
      mergedPlots: mergedHarvestPlots,
      localPlots,
      backendPlots,
      plotServerLinks,
    });
    const serverPlotId =
      option && !option.localOnly
        ? option.id
        : local
          ? resolveServerPlotIdForLocal(local, backendPlots, plotServerLinks)
          : null;
    const aliasIds = resolvePlotReceiptFilterIds({
      localPlotId: local?.id ?? null,
      serverPlotId,
      plotServerLinks,
    });
    return {
      filterId: receiptsPlotId,
      plotName: option?.name ?? local?.name ?? null,
      aliasIds,
    };
  }, [receiptsPlotId, mergedHarvestPlots, localPlots, backendPlots, plotServerLinks]);

  const receiptsFilterPlot = useMemo(() => {
    if (!receiptsPlotId) return null;
    return (
      localPlots.find((row) => row.id === receiptsPlotId) ?? {
        id: receiptsPlotId,
      }
    );
  }, [localPlots, receiptsPlotId]);

  const clearReceiptsPlotFilter = useCallback(() => {
    setReceiptsPlotId(null);
    router.setParams({ receiptsPlot: undefined });
  }, []);

  useEffect(() => {
    const fromUrl = typeof params.receiptsPlot === 'string' ? params.receiptsPlot.trim() : '';
    if (fromUrl) {
      setReceiptsPlotId(fromUrl);
      return;
    }
    if (params.focus === 'receipts') {
      setReceiptsPlotId(null);
    }
  }, [params.focus, params.receiptsPlot]);

  useEffect(() => {
    if (!farmer) {
      setSelectedPlotId(null);
      return;
    }
    if (typeof params.plotId === 'string') {
      setSelectedPlotId(params.plotId);
      return;
    }
    setSelectedPlotId((prev) => {
      if (prev && mergedHarvestPlots.some((p) => String(p.id) === String(prev))) {
        return prev;
      }
      const first = mergedHarvestPlots[0];
      return first ? String(first.id) : null;
    });
  }, [farmer, params.plotId, mergedHarvestPlots]);

  useEffect(() => {
    deliveryDeepLinkHandled.current = false;
  }, [params.plotId, params.record]);

  // One-shot deep links (?focus=receipts|select); guard setParams to avoid update loops.
  useEffect(() => {
    if (clearingFocusRef.current) return;
    const focus = params.focus;
    if (focus !== 'receipts' && focus !== 'select') return;

    clearingFocusRef.current = true;
    if (focus === 'receipts') {
      setShowNewHarvestLog(false);
      setShowRecordWeight(false);
      setShowMultiPlotDelivery(false);
      setMultiPlotRestrictedIds(null);
      setDeliveryPlotSelection(new Set());
      setPendingReceiptsScroll(true);
    } else {
      setShowNewHarvestLog(true);
      setShowRecordWeight(false);
      setShowMultiPlotDelivery(false);
      setMultiPlotRestrictedIds(null);
      setDeliveryPlotSelection(new Set());
      setMessage(null);
    }
    router.setParams({ focus: undefined });
    queueMicrotask(() => {
      clearingFocusRef.current = false;
    });
  }, [params.focus]);

  const syncedHarvestPlots = useMemo(
    () => mergedHarvestPlots.filter((p) => !p.localOnly),
    [mergedHarvestPlots],
  );
  const canStartMultiPlotDelivery = syncedHarvestPlots.length > 1;

  const openSinglePlotDelivery = useCallback((plotId: string) => {
    setSelectedPlotId(plotId);
    setWeightInput('');
    setDeliveryRecipient(null);
    setShowNewHarvestLog(true);
    setShowRecordWeight(true);
  }, []);

  const toggleDeliveryPlotSelection = useCallback((plotId: string) => {
    setDeliveryPlotSelection((prev) => {
      const next = new Set(prev);
      if (next.has(plotId)) {
        next.delete(plotId);
      } else {
        next.add(plotId);
      }
      return next;
    });
  }, []);

  const continueFromPlotSelection = useCallback(() => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    const ids = [...deliveryPlotSelection];
    if (ids.length === 0) return;
    setMessage(null);
    if (ids.length === 1) {
      openSinglePlotDelivery(ids[0]!);
      setDeliveryPlotSelection(new Set());
      return;
    }
    setMultiPlotRestrictedIds(ids);
    setShowMultiPlotDelivery(true);
    setDeliveryPlotSelection(new Set());
  }, [deliveryPlotSelection, isSignedIn, openSignIn, openSinglePlotDelivery]);

  useEffect(() => {
    if (params.record !== '1' || typeof params.plotId !== 'string' || deliveryDeepLinkHandled.current) {
      return;
    }
    const target = findHarvestPlotOption({
      plotId: params.plotId,
      mergedPlots: mergedHarvestPlots,
      localPlots,
      backendPlots,
      plotServerLinks,
    });
    if (!target) return;
    deliveryDeepLinkHandled.current = true;
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    if (target.localOnly) {
      Alert.alert(t('harvest_backup_first_title'), t('harvest_backup_first'));
      return;
    }
    setMessage(null);
    openSinglePlotDelivery(target.id);
  }, [
    params.record,
    params.plotId,
    mergedHarvestPlots,
    localPlots,
    backendPlots,
    isSignedIn,
    plotServerLinks,
    openSignIn,
    openSinglePlotDelivery,
    t,
  ]);

  const selectedPlot = useMemo(
    () =>
      mergedHarvestPlots.find((p) => String(p.id) === String(selectedPlotId ?? '')) ?? null,
    [mergedHarvestPlots, selectedPlotId],
  );
  const deliveredByPlot = useMemo(() => sumDeliveredKgByPlot(vouchers), [vouchers]);
  const numericWeight = Number(weightInput.trim().replace(',', '.'));
  const canRecord = Boolean(
    isSignedIn &&
      farmer &&
      selectedPlotId &&
      selectedPlot &&
      !selectedPlot.localOnly &&
      Number.isFinite(numericWeight) &&
      numericWeight > 0 &&
      isDeliveryRecipientComplete(deliveryRecipient),
  );

  const startNewHarvestFlow = () => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    setMessage(null);
    setDeliveryRecipient(null);
    setDeliveryPlotSelection(new Set());
    if (syncedHarvestPlots.length === 1) {
      openSinglePlotDelivery(syncedHarvestPlots[0]!.id);
      return;
    }
    setShowNewHarvestLog(true);
    setShowRecordWeight(false);
  };

  const startMultiPlotFlow = () => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    setMessage(null);
    setMultiPlotRestrictedIds(null);
    setShowMultiPlotDelivery(true);
  };

  const refreshVouchers = async () => {
    if (!farmer) return;
    try {
      const receiptScope = await loadFieldScopedDeliveryReceipts({
        profileFarmerId: farmer.id,
        localPlots,
        isSignedIn,
      });
      const voucherPayload = await fetchMergedServerVouchers(receiptScope.voucherFarmerIds);
      setVouchers(normalizeVoucherRows(voucherPayload));
    } catch {
      setVouchers([]);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={[...HEADER_GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
            <View style={[styles.headerSideSlot, styles.headerSideLeft]}>
            {showRecordWeight || showNewHarvestLog || showMultiPlotDelivery ? (
            <Pressable
              onPress={() => {
                if (showMultiPlotDelivery) {
                  multiPlotBackRef.current?.();
                  return;
                }
                if (showRecordWeight) {
                  setShowRecordWeight(false);
                  return;
                }
                if (showNewHarvestLog) {
                  setShowNewHarvestLog(false);
                  setDeliveryPlotSelection(new Set());
                  return;
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color={HEADER_GRADIENT_TEXT} />
              <ThemedText type="defaultSemiBold" style={{ color: HEADER_GRADIENT_TEXT }}>
                {t('back')}
              </ThemedText>
            </Pressable>
            ) : (
              <View style={styles.headerSideSlot} />
            )}
          </View>
          <View style={[styles.headerSideSlot, styles.headerSideRight]}>
            <Pressable
              onPress={openLanguagePicker}
              accessibilityRole="button"
              accessibilityLabel={t('language_picker_title')}
              style={styles.langPillCompact}
            >
              <ThemedText type="caption" style={{ color: HEADER_GRADIENT_TEXT }}>
                {String(lang).toUpperCase()}
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.headerTitleCompact}>
              {showMultiPlotDelivery
                ? multiPlotHeaderTitle || t('multi_plot_delivery_title')
                : showRecordWeight
                  ? t('harvest_header_weight')
                  : showNewHarvestLog
                    ? t('harvest_header_select')
                    : t('harvest_header_log')}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ThemedScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        {showMultiPlotDelivery ? (
          farmer || localPlots.length > 0 ? (
          <MultiPlotDeliveryWizard
            t={t}
            farmerId={farmer?.id ?? localPlots[0]?.farmerId ?? ''}
            mergedHarvestPlots={mergedHarvestPlots}
            deliveredByPlot={deliveredByPlot}
            localPlots={localPlots}
            backendPlots={backendPlots}
            plotServerLinks={plotServerLinks}
            onExit={() => {
              setShowMultiPlotDelivery(false);
              setMultiPlotHeaderTitle('');
              setMultiPlotRestrictedIds(null);
            }}
            onComplete={refreshVouchers}
            onRegisterBackHandler={(handler) => {
              multiPlotBackRef.current = handler;
            }}
            onHeaderTitleChange={setMultiPlotHeaderTitle}
            restrictedPlotIds={multiPlotRestrictedIds}
          />
          ) : (
            <Card variant="outlined" style={styles.deliveryCard}>
              <ThemedText type="caption">{t('harvest_setup_farmer_first')}</ThemedText>
            </Card>
          )
        ) : showRecordWeight ? (
          <>
            {selectedPlot ? (
              <View style={styles.weightPlotChip}>
                <Ionicons name="leaf-outline" size={16} color="#0B8B63" />
                <ThemedText type="defaultSemiBold" style={styles.weightPlotChipText}>
                  {String(selectedPlot.name ?? t('plot_fallback'))}
                </ThemedText>
              </View>
            ) : null}

            <Card variant="outlined" style={styles.weightCard}>
              <ThemedText type="caption" style={styles.weightLabel}>
                {t('record_weight_label')}
              </ThemedText>
              <ThemedText type="caption" style={styles.weightHint}>
                {t('record_weight_hint')}
              </ThemedText>
              <View style={styles.weightInputRow}>
                <TextInput
                  placeholder={t('enter_weight_ph')}
                  placeholderTextColor="#B0B8B5"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  style={styles.weightInput}
                  accessibilityLabel={t('record_weight_label')}
                />
                <ThemedText type="defaultSemiBold" style={styles.weightUnit}>
                  kg
                </ThemedText>
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperBtn}
                  accessibilityLabel={t('record_weight_decrease')}
                  onPress={() => {
                    const next = Math.max(0, (Number.isFinite(numericWeight) ? numericWeight : 0) - 1);
                    setWeightInput(next > 0 ? String(next) : '');
                  }}
                >
                  <Ionicons name="remove" size={16} color="#4E4E4E" />
                </Pressable>
                <Pressable
                  style={styles.stepperBtn}
                  accessibilityLabel={t('record_weight_increase')}
                  onPress={() => {
                    const base = Number.isFinite(numericWeight) ? numericWeight : 0;
                    setWeightInput(String(base + 1));
                  }}
                >
                  <Ionicons name="add" size={16} color="#4E4E4E" />
                </Pressable>
                <Pressable
                  style={styles.stepperBtnWide}
                  onPress={() => {
                    const base = Number.isFinite(numericWeight) ? numericWeight : 0;
                    setWeightInput(String(base + 10));
                  }}
                >
                  <ThemedText type="caption" style={styles.stepperBtnText}>
                    +10
                  </ThemedText>
                </Pressable>
              </View>
            </Card>

            <DeliveryRecipientFields
              t={t}
              value={deliveryRecipient}
              onChange={setDeliveryRecipient}
            />

            <Button
              variant="secondary"
              fullWidth
              style={canRecord ? { backgroundColor: '#0A7F59' } : styles.disabledRecordBtn}
              textStyle={canRecord ? styles.btnTextOnGreen : styles.btnTextDisabled}
              disabled={!canRecord}
              onPress={async () => {
                if (!farmer || !selectedPlotId || !canRecord) return;
                setMessage(null);
                try {
                  // Validate harvest weight before submission
                  const validation = validateHarvestKg(weightInput);
                  if (!validation.ok) {
                    setMessage(validation.error);
                    return;
                  }

                  const localPlot = resolveLocalPlotForHarvestSubmit({
                    selectedPlotId,
                    localPlots,
                    backendPlots,
                    plotServerLinks,
                  });
                  if (!localPlot) {
                    setMessage(t('harvest_plot_not_on_device'));
                    return;
                  }

                  const plotName = String(localPlot.name ?? t('plot_fallback'));

                  const result = await submitHarvestRecord({
                    farmerId: farmer.id,
                    selectedPlotId,
                    kg: validation.value,
                    localPlots,
                    backendPlots,
                    plotServerLinks,
                    deliveryRecipient,
                    plotName,
                    buyerLabel: buyerLabelForDeliveryRecipient(deliveryRecipient, t),
                  });
                  if (result.status === 'error') {
                    setMessage(
                      'messageKey' in result && result.messageKey
                        ? t(result.messageKey)
                        : result.message,
                    );
                    return;
                  }

                  if (result.status === 'queued') {
                    void refreshHarvestData();
                    setWeightInput('');
                    setDeliveryRecipient(null);
                    setShowRecordWeight(false);
                    setShowNewHarvestLog(false);
                    setMessage(null);
                    router.push(deliveryReceiptHref(result.receiptId, { fresh: true, from: 'harvests' }));
                    return;
                  }

                  const receiptScope = await loadFieldScopedDeliveryReceipts({
                    profileFarmerId: farmer.id,
                    localPlots,
                    isSignedIn: true,
                  });
                  const voucherPayload = await fetchMergedServerVouchers(
                    receiptScope.voucherFarmerIds,
                  );
                  const refreshedVouchers = normalizeVoucherRows(voucherPayload);
                  setVouchers(refreshedVouchers);
                  void refreshHarvestData();
                  setWeightInput('');
                  setDeliveryRecipient(null);
                  setShowRecordWeight(false);
                  setShowNewHarvestLog(false);
                  setMessage(null);
                  router.push(deliveryReceiptHref(result.receiptId, { fresh: true, from: 'harvests' }));
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              {t('record_delivery')}
            </Button>
          </>
        ) : showNewHarvestLog ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.selectPlotTitle}>
              {t('select_plot_harvest')}
            </ThemedText>
            <View style={{ gap: 12 }}>
              {mergedHarvestPlots.length === 0 ? (
                <Card variant="outlined" style={styles.deliveryCard}>
                  <ThemedText type="caption">{t('harvest_no_plots_on_device')}</ThemedText>
                </Card>
              ) : (
                mergedHarvestPlots.slice(0, 24).map((p) => {
                  const seasonKg = Math.round(deliveredByPlot[String(p.id)] ?? 0);
                  const selected = deliveryPlotSelection.has(String(p.id));
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected, disabled: p.localOnly }}
                      onPress={() => {
                        if (p.localOnly) {
                          Alert.alert(t('harvest_backup_first_title'), t('harvest_backup_first'));
                          return;
                        }
                        toggleDeliveryPlotSelection(String(p.id));
                      }}
                    >
                      <Card
                        variant="outlined"
                        style={[
                          styles.selectPlotCard,
                          selected && styles.selectPlotCardSelected,
                          p.localOnly ? styles.selectPlotCardDisabled : null,
                        ]}
                      >
                        <View style={styles.plotIconWrap}>
                          <Ionicons name="leaf-outline" size={22} color="#0B8B63" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="subtitle">{String(p.name ?? t('plot_fallback'))}</ThemedText>
                          {p.localOnly ? (
                            <ThemedText type="caption" style={styles.plotLocalBadge}>
                              {t('harvest_plot_local_badge')}
                            </ThemedText>
                          ) : null}
                          <ThemedText type="caption" style={styles.plotSeasonText}>
                            {t('plot_season_delivered_kg', { n: seasonKg.toLocaleString() })}
                          </ThemedText>
                        </View>
                        <Ionicons
                          name={selected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={selected ? '#0A7F59' : '#9CA3AF'}
                        />
                      </Card>
                    </Pressable>
                  );
                })
              )}
            </View>
            <Button
              variant="secondary"
              fullWidth
              disabled={deliveryPlotSelection.size === 0}
              style={
                deliveryPlotSelection.size > 0
                  ? { backgroundColor: '#0A7F59' }
                  : styles.disabledRecordBtn
              }
              textStyle={
                deliveryPlotSelection.size > 0 ? styles.btnTextOnGreen : styles.btnTextDisabled
              }
              onPress={continueFromPlotSelection}
            >
              {t('harvest_select_plots_continue', { n: deliveryPlotSelection.size })}
            </Button>
          </>
        ) : (
          <>
        <Card variant="outlined" style={styles.introCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="scale-outline" size={22} color={appColors.link} />
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={styles.scaleCardTitle}>
                {t('log_harvest_card_title')}
              </ThemedText>
              <ThemedText type="caption" style={styles.scaleCardBody}>
                {t('log_harvest_card_sub')}
              </ThemedText>
            </View>
          </View>

          {!isSignedIn ? (
            <View style={styles.introActions}>
              <ThemedText type="caption" style={styles.signInHarvestBody}>
                {t('harvest_sign_in_to_record_body')}
              </ThemedText>
              <Button
                variant="secondary"
                style={{ backgroundColor: '#0A7F59' }}
                textStyle={styles.btnTextOnGreen}
                fullWidth
                onPress={() => openSignIn({ variant: 'sync' })}
              >
                {t('sign_in')}
              </Button>
            </View>
          ) : (
            <View style={styles.introActions}>
              <Button
                variant="secondary"
                style={{ backgroundColor: '#0A7F59' }}
                textStyle={styles.btnTextOnGreen}
                fullWidth
                onPress={startNewHarvestFlow}
              >
                {t('record_delivery')}
              </Button>
              {canStartMultiPlotDelivery ? (
                <Pressable
                  onPress={startMultiPlotFlow}
                  accessibilityRole="button"
                  style={styles.multiPlotLinkRow}
                >
                  <ThemedText type="defaultSemiBold" style={styles.multiPlotLinkText}>
                    {t('multi_plot_delivery_link')}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={appColors.link} />
                </Pressable>
              ) : null}
            </View>
          )}
        </Card>

        <View
          onLayout={(event) => {
            receiptsSectionY.current = event.nativeEvent.layout.y;
            if (!pendingReceiptsScroll) return;
            scrollRef.current?.scrollTo({
              y: Math.max(0, event.nativeEvent.layout.y - 12),
              animated: true,
            });
            setPendingReceiptsScroll(false);
          }}
        >
          <SectionHeader title={t('harvest_receipts_title')} />
          {receiptsPlotId ? (
            <Pressable
              accessibilityRole="button"
              onPress={clearReceiptsPlotFilter}
              style={styles.receiptsPlotBackRow}
            >
              <Ionicons name="chevron-back" size={18} color={appColors.link} />
              <ThemedText type="defaultSemiBold" style={styles.receiptsPlotBackText}>
                {t('harvest_receipts_all_plots')}
              </ThemedText>
            </Pressable>
          ) : null}
          <DeliveryReceiptsBrowser
            t={t}
            vouchers={vouchers}
            mergedPlots={mergedHarvestPlots}
            mergedReceipts={mergedReceipts}
            deviceReceipts={deviceReceipts}
            backendPlots={backendPlots}
            filterLocalPlot={receiptsFilterPlot}
            plotIdFilter={receiptsPlotScope?.filterId ?? null}
            plotIdAliases={receiptsPlotScope?.aliasIds ?? []}
            plotNameFilter={receiptsPlotScope?.plotName ?? null}
            plotServerLinks={plotServerLinks}
            receiptFrom="harvests"
          />
        </View>
          </>
        )}
        {message ? <ThemedText type="caption">{message}</ThemedText> : null}

      </ThemedScrollView>
    </ThemedView>
  );
}

