import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
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
  DeliveryRecipientFields,
  isDeliveryRecipientComplete,
  type DeliveryRecipientSelection,
} from '@/features/harvest/DeliveryRecipientFields';
import { MultiPlotDeliveryWizard } from '@/features/harvest/MultiPlotDeliveryWizard';
import { sumDeliveredKgByPlot } from '@/features/harvest/plotYieldCapacity';
import { buildMergedHarvestPlots, findHarvestPlotOption } from '@/features/harvest/mergeHarvestPlotOptions';
import { validateHarvestKg } from '@/features/validation/validators';

type HarvestLoggedMode = 'synced' | 'queued';

function normalizeVoucherRows(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { vouchers?: unknown }).vouchers)) {
    return (payload as { vouchers: any[] }).vouchers;
  }
  return [];
}

export default function HarvestsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ plotId?: string; record?: string }>();
  const { farmer, plots: localPlots } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewHarvestLog, setShowNewHarvestLog] = useState(false);
  const [showRecordWeight, setShowRecordWeight] = useState(false);
  const [showHarvestLogged, setShowHarvestLogged] = useState(false);
  const [loggedMode, setLoggedMode] = useState<HarvestLoggedMode>('synced');
  const [lastQrRef, setLastQrRef] = useState<string | null>(null);
  const [queuedMessageKey, setQueuedMessageKey] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [deliveryRecipient, setDeliveryRecipient] = useState<DeliveryRecipientSelection | null>(null);
  const [showMultiPlotDelivery, setShowMultiPlotDelivery] = useState(false);
  const [multiPlotHeaderTitle, setMultiPlotHeaderTitle] = useState('');
  const multiPlotBackRef = useRef<(() => void) | null>(null);
  const deliveryDeepLinkHandled = useRef(false);

  useEffect(() => {
    if (!farmer || !isSignedIn) {
      setBackendPlots([]);
      setVouchers([]);
      return;
    }
    Promise.all([fetchPlotsForFarmer(farmer.id), fetchVouchersForFarmer(farmer.id)])
      .then(([plotsRows, voucherPayload]) => {
        setBackendPlots(plotsRows ?? []);
        setVouchers(normalizeVoucherRows(voucherPayload));
      })
      .catch(() => {
        setBackendPlots([]);
        setVouchers([]);
      });
  }, [farmer, isSignedIn, params.plotId]);

  /** Server plots plus local plots not returned by the API (offline / not synced yet). */
  const mergedHarvestPlots = useMemo(
    () =>
      buildMergedHarvestPlots({
        backendPlots,
        localPlots,
        farmerId: farmer?.id,
      }),
    [backendPlots, localPlots, farmer?.id],
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
    if (params.record !== '1' || typeof params.plotId !== 'string' || deliveryDeepLinkHandled.current) {
      return;
    }
    const target = findHarvestPlotOption({
      plotId: params.plotId,
      mergedPlots: mergedHarvestPlots,
      localPlots,
      backendPlots,
    });
    if (!target) return;
    deliveryDeepLinkHandled.current = true;
    setSelectedPlotId(target.id);
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    if (target.localOnly) {
      Alert.alert(t('harvest_backup_first_title'), t('harvest_backup_first'));
      return;
    }
    setMessage(null);
    setShowNewHarvestLog(true);
    setShowRecordWeight(true);
    setDeliveryRecipient(null);
    setWeightInput('');
  }, [params.record, params.plotId, mergedHarvestPlots, localPlots, backendPlots, isSignedIn, openSignIn, t]);

  const selectedPlot = useMemo(
    () =>
      mergedHarvestPlots.find((p) => String(p.id) === String(selectedPlotId ?? '')) ?? null,
    [mergedHarvestPlots, selectedPlotId],
  );
  const deliveredByPlot = useMemo(() => sumDeliveredKgByPlot(vouchers), [vouchers]);
  const recentDeliveries = useMemo(() => {
    return vouchers
      .slice()
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      })
      .slice(0, 6);
  }, [vouchers]);
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
    setLoggedMode('synced');
    setLastQrRef(null);
    setQueuedMessageKey(null);
  };

  const startNewHarvestFlow = () => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    setMessage(null);
    setShowNewHarvestLog(true);
    setDeliveryRecipient(null);
  };

  const startMultiPlotFlow = () => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    setMessage(null);
    setShowMultiPlotDelivery(true);
  };

  const refreshVouchers = async () => {
    if (!farmer) return;
    const voucherPayload = await fetchVouchersForFarmer(farmer.id);
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
                ? loggedMode === 'queued'
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

      <ThemedScrollView contentContainerStyle={styles.container}>
        {showMultiPlotDelivery ? (
          farmer || localPlots.length > 0 ? (
          <MultiPlotDeliveryWizard
            t={t}
            farmerId={farmer?.id ?? localPlots[0]?.farmerId ?? ''}
            mergedHarvestPlots={mergedHarvestPlots}
            deliveredByPlot={deliveredByPlot}
            localPlots={localPlots}
            backendPlots={backendPlots}
            onExit={() => {
              setShowMultiPlotDelivery(false);
              setMultiPlotHeaderTitle('');
            }}
            onComplete={refreshVouchers}
            onRegisterBackHandler={(handler) => {
              multiPlotBackRef.current = handler;
            }}
            onHeaderTitleChange={setMultiPlotHeaderTitle}
          />
          ) : (
            <Card variant="outlined" style={styles.deliveryCard}>
              <ThemedText type="caption">{t('harvest_setup_farmer_first')}</ThemedText>
            </Card>
          )
        ) : showHarvestLogged ? (
          <>
            <View style={styles.harvestLoggedHeroWrap}>
              <View
                style={[
                  styles.harvestLoggedIconWrap,
                  loggedMode === 'queued' ? styles.harvestQueuedIconWrap : null,
                ]}
              >
                <Ionicons
                  name={loggedMode === 'queued' ? 'cloud-offline-outline' : 'checkmark'}
                  size={loggedMode === 'queued' ? 44 : 52}
                  color="#0A9F68"
                />
              </View>
            </View>
            <ThemedText type="title" style={styles.harvestLoggedTitle}>
              {loggedMode === 'queued'
                ? t('harvest_queued_success_title')
                : t('harvest_logged_title')}
            </ThemedText>
            <ThemedText type="default" style={styles.harvestLoggedBody}>
              {loggedMode === 'queued'
                ? t(queuedMessageKey ?? 'harvest_queued_success_body')
                : t('harvest_logged_body')}
            </ThemedText>

            {loggedMode === 'synced' && lastQrRef ? (
              <Card variant="outlined" style={styles.harvestLoggedQrCard}>
                <View style={styles.harvestLoggedQrWrap}>
                  <QRCode
                    value={lastQrRef}
                    size={176}
                    color="#111111"
                    backgroundColor="#FFFFFF"
                    ecl="M"
                  />
                </View>
                <Pressable
                  onPress={() => void Share.share({ message: lastQrRef })}
                  style={styles.voucherCodePill}
                >
                  <ThemedText type="defaultSemiBold" style={styles.voucherCodeText}>
                    {lastQrRef}
                  </ThemedText>
                </Pressable>
                <ThemedText type="caption" style={styles.harvestLoggedQrText}>
                  {t('harvest_share_qr')}
                </ThemedText>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={() => void Share.share({ message: lastQrRef, title: 'Tracebud voucher' })}
                >
                  {t('harvest_copy_voucher_code')}
                </Button>
              </Card>
            ) : loggedMode === 'synced' ? (
              <Card variant="outlined" style={styles.harvestLoggedQrCard}>
                <View style={styles.harvestLoggedQrWrap}>
                  <Ionicons name="qr-code-outline" size={78} color="#A7A7A7" />
                </View>
                <ThemedText type="caption" style={styles.harvestLoggedQrText}>
                  {t('harvest_share_qr')}
                </ThemedText>
              </Card>
            ) : null}

            <Button
              variant="secondary"
              fullWidth
              style={{ backgroundColor: '#0A9F68' }}
              textStyle={styles.btnTextOnGreen}
              onPress={() => {
                resetLoggedState();
                setShowNewHarvestLog(true);
                setShowRecordWeight(false);
              }}
            >
              {t('log_another_harvest')}
            </Button>

            <Button
              variant="secondary"
              fullWidth
              style={styles.harvestLoggedBackBtn}
              textStyle={styles.btnTextOnGray}
              onPress={() => {
                resetLoggedState();
                router.push('/');
              }}
            >
              {t('back_to_home')}
            </Button>
          </>
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

                  const result = await submitHarvestRecord({
                    farmerId: farmer.id,
                    selectedPlotId,
                    kg: validation.value,
                    localPlots,
                    backendPlots,
                    deliveryRecipient,
                  });
                  if (result.status === 'error') {
                    setMessage(result.message);
                    return;
                  }
                  if (result.status === 'queued') {
                    setLoggedMode('queued');
                    setQueuedMessageKey(result.messageKey);
                    setLastQrRef(null);
                    setWeightInput('');
                    setShowRecordWeight(false);
                    setShowNewHarvestLog(false);
                    setShowHarvestLogged(true);
                    setMessage(null);
                    return;
                  }

                  const voucherPayload = await fetchVouchersForFarmer(farmer.id);
                  setVouchers(normalizeVoucherRows(voucherPayload));
                  setLoggedMode('synced');
                  setQueuedMessageKey(null);
                  setLastQrRef(result.qrCodeRef);
                  setWeightInput('');
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
                  const selected = String(selectedPlotId) === String(p.id);
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
                        setShowRecordWeight(true);
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
                        <Ionicons name="chevron-forward" size={22} color="#B1B1B1" />
                      </Card>
                    </Pressable>
                  );
                })
              )}
            </View>
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
        </Card>

        {!isSignedIn ? (
          <Card variant="outlined" style={styles.signInHarvestCard}>
            <View style={styles.signInHarvestIconWrap}>
              <Ionicons name="log-in-outline" size={22} color="#0B6F50" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.signInHarvestTitle}>
              {t('harvest_sign_in_to_record')}
            </ThemedText>
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
          </Card>
        ) : (
          <>
          <Button
            variant="secondary"
            style={{ backgroundColor: '#0A7F59' }}
            textStyle={styles.btnTextOnGreen}
            fullWidth
            onPress={startNewHarvestFlow}
          >
            {t('start_new_harvest')}
          </Button>
          <Button variant="outline" fullWidth onPress={startMultiPlotFlow}>
            {t('multi_plot_delivery_start')}
          </Button>
          </>
        )}

        <SectionHeader title={t('recent_deliveries')} />
        {recentDeliveries.length === 0 ? (
          <Card variant="outlined" style={styles.card}>
            <ThemedText type="caption">{t('no_deliveries')}</ThemedText>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {recentDeliveries.map((v) => {
              const kg = Number(v.kg ?? v.kg_delivered ?? v.weight_kg ?? 0);
              const statusLabel =
                v.status === 'active' || v.status === 'synced' ? t('status_synced') : t('status_pending');
              const statusVariant = statusLabel === 'Synced' ? 'success' : 'warning';
              const plotLabel = String(v.plot_name ?? v.plot_label ?? t('plot_fallback'));
              const dateLabel = v.created_at
                ? new Date(v.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: '2-digit',
                  })
                : '—';
              return (
                <Card key={v.id} variant="outlined" style={styles.deliveryCard}>
                  <View style={styles.rowHeader}>
                    <View>
                      <ThemedText type="subtitle">{`${Number.isFinite(kg) ? kg : 0} kg`}</ThemedText>
                      <ThemedText type="caption">{`${plotLabel} - ${dateLabel}`}</ThemedText>
                    </View>
                    <Badge variant={statusVariant} size="sm">
                      {statusLabel}
                    </Badge>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
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
  harvestLoggedHeroWrap: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 6,
  },
  harvestLoggedIconWrap: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#CDEEDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestQueuedIconWrap: {
    backgroundColor: '#E8F4EC',
  },
  harvestLoggedTitle: {
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 50,
    lineHeight: 56,
  },
  harvestLoggedBody: {
    textAlign: 'center',
    color: '#555555',
    marginTop: 6,
  },
  harvestLoggedQrCard: {
    borderRadius: 22,
    borderColor: '#D5D5D5',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    paddingVertical: 18,
  },
  harvestLoggedQrWrap: {
    width: 210,
    height: 210,
    borderRadius: 20,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestLoggedQrText: {
    marginTop: 10,
    color: '#666666',
    textAlign: 'center',
  },
  voucherCodePill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ECECEC',
  },
  voucherCodeText: {
    color: '#1F2937',
    textAlign: 'center',
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
  harvestLoggedBackBtn: {
    backgroundColor: '#DFDFDF',
  },
  card: { marginTop: 2 },
  introCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
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

