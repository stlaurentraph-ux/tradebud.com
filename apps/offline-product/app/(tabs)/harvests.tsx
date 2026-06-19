import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View, type ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import {
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
} from '@/features/api/postPlot';
import { submitHarvestRecord } from '@/features/harvest/submitHarvest';
import {
  buyerLabelForDeliveryRecipient,
  normalizeLocalDeliveryReceipts,
} from '@/features/harvest/localDeliveryReceipts';
import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';
import {
  DeliveryRecipientFields,
  isDeliveryRecipientComplete,
  type DeliveryRecipientSelection,
} from '@/features/harvest/DeliveryRecipientFields';
import { MultiPlotDeliveryWizard } from '@/features/harvest/MultiPlotDeliveryWizard';
import { sumDeliveredKgByPlot } from '@/features/harvest/plotYieldCapacity';
import { buildMergedHarvestPlots, findHarvestPlotOption, resolveLocalPlotForHarvestSubmit } from '@/features/harvest/mergeHarvestPlotOptions';
import { validateHarvestKg } from '@/features/validation/validators';
import {
  DeliveryLoggedPanel,
  type DeliverySyncFeedback,
  type LoggedDeliverySnapshot,
} from '@/components/harvest/DeliveryLoggedPanel';
import { DeliveryReceiptsBrowser } from '@/components/harvest/DeliveryReceiptsBrowser';
import { findSyncedVoucherForLoggedDelivery } from '@/features/harvest/findSyncedVoucherForLoggedDelivery';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { reconcilePlotServerLinks, resolveServerPlotIdForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { runAutoBackup } from '@/features/sync/runAutoBackup';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { subscribeServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import {
  loadLocalDeliveryReceiptsForFarmer,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
  updateLocalDeliveryReceipt,
} from '@/features/state/persistence';

export default function HarvestsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ plotId?: string; record?: string; focus?: string }>();
  const { farmer, plots: localPlots } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<PlotServerLinks>({});
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewHarvestLog, setShowNewHarvestLog] = useState(false);
  const [showRecordWeight, setShowRecordWeight] = useState(false);
  const [showHarvestLogged, setShowHarvestLogged] = useState(false);
  const [loggedDelivery, setLoggedDelivery] = useState<LoggedDeliverySnapshot | null>(null);
  const [deliverySyncBusy, setDeliverySyncBusy] = useState(false);
  const [deliverySyncFeedback, setDeliverySyncFeedback] = useState<DeliverySyncFeedback | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [deliveryRecipient, setDeliveryRecipient] = useState<DeliveryRecipientSelection | null>(null);
  const [showMultiPlotDelivery, setShowMultiPlotDelivery] = useState(false);
  const [multiPlotRestrictedIds, setMultiPlotRestrictedIds] = useState<string[] | null>(null);
  const [deliveryPlotSelection, setDeliveryPlotSelection] = useState<Set<string>>(() => new Set());
  const [multiPlotHeaderTitle, setMultiPlotHeaderTitle] = useState('');
  const multiPlotBackRef = useRef<(() => void) | null>(null);
  const deliveryDeepLinkHandled = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const receiptsSectionY = useRef(0);
  const [pendingReceiptsScroll, setPendingReceiptsScroll] = useState(false);
  const [deviceReceipts, setDeviceReceipts] = useState<DeliveryReceiptRecord[]>([]);

  const refreshHarvestData = useCallback(async () => {
    if (!farmer) {
      setBackendPlots([]);
      setPlotServerLinks({});
      setVouchers([]);
      setDeviceReceipts([]);
      return;
    }

    const localRows = await loadLocalDeliveryReceiptsForFarmer(farmer.id);
    setDeviceReceipts(normalizeLocalDeliveryReceipts(localRows, t));

    if (!isSignedIn) {
      const existingLinks = await loadPlotServerLinks();
      setBackendPlots([]);
      setPlotServerLinks(existingLinks);
      setVouchers([]);
      return;
    }

    const existingLinks = await loadPlotServerLinks();
    try {
      const [plotsRows, voucherPayload] = await Promise.all([
        fetchPlotsForFarmer(farmer.id),
        fetchVouchersForFarmer(farmer.id),
      ]);
      const reconciled = reconcilePlotServerLinks(localPlots, plotsRows ?? [], existingLinks);
      await persistPlotServerLinks(reconciled);
      setPlotServerLinks(reconciled);
      setBackendPlots(plotsRows ?? []);
      setVouchers(normalizeVoucherRows(voucherPayload));
    } catch {
      setBackendPlots([]);
      setPlotServerLinks(existingLinks);
      setVouchers([]);
    }
  }, [farmer, isSignedIn, localPlots, t]);

  useEffect(() => {
    void refreshHarvestData();
  }, [refreshHarvestData, params.plotId]);

  useFocusEffect(
    useCallback(() => {
      void refreshHarvestData();
    }, [refreshHarvestData]),
  );

  useEffect(() => {
    return subscribeServerPlotSyncChanged(() => {
      void refreshHarvestData();
    });
  }, [refreshHarvestData]);

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

  useEffect(() => {
    if (params.focus !== 'receipts') return;
    setShowNewHarvestLog(false);
    setShowRecordWeight(false);
    setShowHarvestLogged(false);
    setShowMultiPlotDelivery(false);
    setMultiPlotRestrictedIds(null);
    setDeliveryPlotSelection(new Set());
    setLoggedDelivery(null);
    setPendingReceiptsScroll(true);
    router.setParams({ focus: undefined });
  }, [params.focus]);

  useEffect(() => {
    if (params.focus !== 'select') return;
    setShowNewHarvestLog(true);
    setShowRecordWeight(false);
    setShowHarvestLogged(false);
    setShowMultiPlotDelivery(false);
    setMultiPlotRestrictedIds(null);
    setDeliveryPlotSelection(new Set());
    setLoggedDelivery(null);
    setMessage(null);
    router.setParams({ focus: undefined });
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

  const resetLoggedState = () => {
    setShowHarvestLogged(false);
    setLoggedDelivery(null);
    setDeliverySyncFeedback(null);
    setDeliverySyncBusy(false);
  };

  const runDeliverySyncNow = useCallback(async () => {
    if (!farmer?.id || !loggedDelivery) return;
    if (!isSignedIn || !hasSyncAuthSession()) {
      openSignIn({ variant: 'sync' });
      return;
    }

    if (loggedDelivery.qrCodeRef) {
      setDeliverySyncFeedback({
        variant: 'success',
        message: t('harvest_receipt_sync_success'),
      });
      return;
    }

    setDeliverySyncBusy(true);
    setDeliverySyncFeedback(null);
    try {
      const backup = await runAutoBackup({
        farmerId: farmer.id,
        localPlots,
      });

      if (backup.plotResult?.stoppedForAuth) {
        setDeliverySyncFeedback({
          variant: 'error',
          message: t('sync_session_expired_short'),
        });
        return;
      }

      if (backup.plotResult?.fetchFailed || backup.queueResult.fetchFailed) {
        setDeliverySyncFeedback({
          variant: 'error',
          message: t('harvest_receipt_sync_failed_reach'),
        });
        return;
      }

      const voucherPayload = await fetchVouchersForFarmer(farmer.id).catch(() => []);
      const refreshedVouchers = normalizeVoucherRows(voucherPayload);
      setVouchers(refreshedVouchers);

      const links = await loadPlotServerLinks();
      setPlotServerLinks(links);

      const plotsRows = await fetchPlotsForFarmer(farmer.id).catch(() => backendPlots);
      setBackendPlots(plotsRows ?? backendPlots);

      const localPlot = resolveLocalPlotForHarvestSubmit({
        selectedPlotId: loggedDelivery.plotId,
        localPlots,
        backendPlots: plotsRows ?? backendPlots,
        plotServerLinks: links,
      });
      const serverPlotId = localPlot
        ? resolveServerPlotIdForLocal(localPlot, plotsRows ?? backendPlots, links)
        : null;

      let qrCodeRef = findSyncedVoucherForLoggedDelivery({
        delivery: loggedDelivery,
        vouchers: refreshedVouchers,
        localPlots,
        backendPlots: plotsRows ?? backendPlots,
        plotServerLinks: links,
      });

      if (qrCodeRef && loggedDelivery.receiptId) {
        await updateLocalDeliveryReceipt(loggedDelivery.receiptId, {
          qrCodeRef,
          pendingSync: false,
          serverPlotId: serverPlotId ?? undefined,
        }).catch(() => undefined);
      }

      if (qrCodeRef) {
        const seasonTotalKg =
          sumDeliveredKgByPlot(refreshedVouchers)[String(loggedDelivery.plotId)] ??
          loggedDelivery.seasonTotalKg;
        setLoggedDelivery({
          ...loggedDelivery,
          mode: 'synced',
          qrCodeRef,
          seasonTotalKg,
          queuedMessageKey: null,
        });
        setDeliverySyncFeedback({
          variant: 'success',
          message: t('harvest_receipt_sync_success'),
        });
        void refreshHarvestData();
        return;
      }

      const pendingHarvest = (await loadPendingSyncActions()).some((action) => {
        if (action.actionType !== 'harvest') return false;
        try {
          const payload = JSON.parse(action.payloadJson) as { plotId?: string; kg?: number };
          return (
            String(payload.plotId ?? '') === String(loggedDelivery.plotId) &&
            Math.abs(Number(payload.kg ?? 0) - loggedDelivery.kg) < 0.5
          );
        } catch {
          return false;
        }
      });

      if (backup.queueResult.failedActions > 0 || (backup.plotResult?.failed ?? 0) > 0) {
        setDeliverySyncFeedback({
          variant: 'error',
          message: t('harvest_receipt_sync_failed_partial'),
        });
        return;
      }

      if (pendingHarvest) {
        setDeliverySyncFeedback({
          variant: 'info',
          message: t('harvest_receipt_sync_pending_qr'),
        });
        return;
      }

      if (backup.queueResult.completed > 0 || backup.plotResult?.uploaded) {
        setDeliverySyncFeedback({
          variant: 'info',
          message: t('harvest_receipt_sync_pending_qr'),
        });
        return;
      }

      setDeliverySyncFeedback({
        variant: 'info',
        message: t('harvest_receipt_sync_nothing_pending'),
      });
    } catch {
      setDeliverySyncFeedback({
        variant: 'error',
        message: t('harvest_receipt_sync_failed'),
      });
    } finally {
      setDeliverySyncBusy(false);
    }
  }, [
    backendPlots,
    farmer?.id,
    isSignedIn,
    localPlots,
    loggedDelivery,
    openSignIn,
    refreshHarvestData,
    t,
  ]);

  const openAnotherDelivery = () => {
    resetLoggedState();
    setDeliveryPlotSelection(new Set());
    if (syncedHarvestPlots.length === 1) {
      openSinglePlotDelivery(syncedHarvestPlots[0]!.id);
      return;
    }
    setShowNewHarvestLog(true);
    setShowRecordWeight(false);
  };

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
    const voucherPayload = await fetchVouchersForFarmer(farmer.id).catch(() => []);
    setVouchers(normalizeVoucherRows(voucherPayload));
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
            <View style={[styles.headerSideSlot, styles.headerSideLeft]}>
            {showHarvestLogged || showRecordWeight || showNewHarvestLog || showMultiPlotDelivery ? (
            <Pressable
              onPress={() => {
                if (showMultiPlotDelivery) {
                  multiPlotBackRef.current?.();
                  return;
                }
                if (showHarvestLogged) {
                  resetLoggedState();
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
              <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
              <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
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
              <ThemedText type="caption" style={{ color: colors.textInverse }}>
                {String(lang).toUpperCase()}
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.headerTitleCompact}>
              {showMultiPlotDelivery
                ? multiPlotHeaderTitle || t('multi_plot_delivery_title')
                : showHarvestLogged
                ? loggedDelivery?.mode === 'queued'
                  ? t('harvest_queued_success_title')
                  : t('harvest_header_logged')
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
        ) : showHarvestLogged && loggedDelivery ? (
          <DeliveryLoggedPanel
            t={t}
            delivery={loggedDelivery}
            onShareAnother={openAnotherDelivery}
            onViewPlot={(plotId) => {
              const localPlot = resolveLocalPlotForHarvestSubmit({
                selectedPlotId: plotId,
                localPlots,
                backendPlots,
                plotServerLinks,
              });
              const targetPlotId = localPlot?.id ?? plotId;
              const receiptParam = loggedDelivery.receiptId
                ? `&receiptId=${encodeURIComponent(loggedDelivery.receiptId)}`
                : '';
              router.push(
                `/plot/${encodeURIComponent(targetPlotId)}?sub=voucher&from=harvests${receiptParam}`,
              );
            }}
            onSyncNow={() => void runDeliverySyncNow()}
            syncBusy={deliverySyncBusy}
            syncFeedback={deliverySyncFeedback}
          />
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

                  const snapshotBase = {
                    receiptId: result.receiptId,
                    plotId: localPlot.id,
                    plotName,
                    kg: validation.value,
                    recordedAt: Date.now(),
                    deliveryRecipient,
                  };

                  if (result.status === 'queued') {
                    const priorKg = deliveredByPlot[String(localPlot.id)] ?? 0;
                    setLoggedDelivery({
                      ...snapshotBase,
                      qrCodeRef: null,
                      mode: 'queued',
                      queuedMessageKey: result.messageKey,
                      seasonTotalKg: priorKg + validation.value,
                    });
                    void refreshHarvestData();
                    setWeightInput('');
                    setDeliveryRecipient(null);
                    setShowRecordWeight(false);
                    setShowNewHarvestLog(false);
                    setShowHarvestLogged(true);
                    setMessage(null);
                    return;
                  }

                  const voucherPayload = await fetchVouchersForFarmer(farmer.id);
                  const refreshedVouchers = normalizeVoucherRows(voucherPayload);
                  setVouchers(refreshedVouchers);
                  const seasonTotalKg = sumDeliveredKgByPlot(refreshedVouchers)[String(localPlot.id)] ?? null;
                  setLoggedDelivery({
                    ...snapshotBase,
                    qrCodeRef: result.qrCodeRef,
                    mode: 'synced',
                    seasonTotalKg,
                  });
                  void refreshHarvestData();
                  setWeightInput('');
                  setDeliveryRecipient(null);
                  setShowRecordWeight(false);
                  setShowNewHarvestLog(false);
                  setShowHarvestLogged(true);
                  setMessage(null);
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
            <Ionicons name="scale-outline" size={22} color="#0B6F50" />
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
                {t('log_harvest_card_title')}
              </ThemedText>
              <ThemedText type="caption" style={{ marginTop: 4, color: '#1F6B57' }}>
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
                  <Ionicons name="chevron-forward" size={18} color="#0B6F50" />
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
          <DeliveryReceiptsBrowser
            t={t}
            vouchers={vouchers}
            mergedPlots={mergedHarvestPlots}
            deviceReceipts={deviceReceipts}
          />
        </View>
          </>
        )}
        {message ? <ThemedText type="caption">{message}</ThemedText> : null}

      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 32, gap: 16 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerRowCompact: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingTop: 6,
    paddingBottom: 4,
  },
  headerSideSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideLeft: {
    justifyContent: 'flex-start',
  },
  headerSideRight: {
    justifyContent: 'flex-end',
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 88,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 78,
  },
  headerTitleCompact: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: '100%',
  },
  langPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    minWidth: 54,
    justifyContent: 'center',
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#9FE6C9',
  },
  selectPlotTitle: {
    color: '#4B4B4B',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  plotLocalBadge: {
    color: '#B45309',
    marginTop: 4,
  },
  selectPlotCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderColor: '#D3D3D3',
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectPlotCardSelected: {
    borderColor: '#7EDBC0',
    borderWidth: 1.5,
    backgroundColor: '#F1FBF7',
  },
  plotIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D3F1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotSeasonText: {
    color: '#6B7280',
    marginTop: 2,
  },
  weightPlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F7F0',
    marginBottom: 4,
  },
  weightPlotChipText: {
    color: '#0B4F3B',
    fontSize: 14,
  },
  weightCard: {
    borderRadius: 18,
    borderColor: '#DDE5E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 6,
  },
  weightLabel: {
    color: '#374151',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  weightHint: {
    color: '#6B7280',
    marginBottom: 4,
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
    lineHeight: 34,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 0,
  },
  weightUnit: {
    color: '#6B7280',
    fontSize: 16,
    minWidth: 24,
  },
  stepperRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#EEF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnWide: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EEF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  disabledRecordBtn: {
    backgroundColor: '#D9D9D9',
  },
  /** Ensures label is visible on solid green buttons (secondary variant text can blend with custom bg). */
  btnTextOnGreen: {
    color: '#FFFFFF',
  },
  btnTextOnGray: {
    color: '#1F2937',
  },
  btnTextDisabled: {
    color: '#4B5563',
  },
  signInHarvestCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#F4FBF8',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  signInHarvestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDEFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInHarvestTitle: {
    color: '#0B4F3B',
    textAlign: 'center',
  },
  signInHarvestBody: {
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  selectPlotCardDisabled: {
    opacity: 0.72,
    backgroundColor: '#F3F4F6',
  },
  card: { marginTop: 2 },
  introCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
    gap: 14,
  },
  introActions: {
    gap: 10,
    marginTop: 4,
  },
  multiPlotLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  multiPlotLinkText: {
    color: '#0B6F50',
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowCard: { padding: 12 },
  deliveryCard: { padding: 14, borderRadius: 16 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});

