import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

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
import {
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  postHarvestToBackend,
} from '@/features/api/postPlot';
import { loadPendingSyncActions } from '@/features/state/persistence';
import { listUnsyncedLocalPlots } from '@/features/sync/plotServerSync';

export default function HarvestsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ plotId?: string }>();
  const { farmer, plots: localPlots } = useAppState();
  const { t, lang } = useLanguage();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showNewHarvestLog, setShowNewHarvestLog] = useState(false);
  const [showRecordWeight, setShowRecordWeight] = useState(false);
  const [showHarvestLogged, setShowHarvestLogged] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [queuePendingCount, setQueuePendingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadPendingSyncActions()
        .then((rows) => setQueuePendingCount(rows.length))
        .catch(() => setQueuePendingCount(0));
    }, []),
  );

  const unsyncedPlotCount = useMemo(() => {
    if (!farmer) return 0;
    return listUnsyncedLocalPlots(localPlots, backendPlots).length;
  }, [farmer, localPlots, backendPlots]);

  const totalSyncPending = queuePendingCount + unsyncedPlotCount;

  useEffect(() => {
    if (!farmer) {
      setBackendPlots([]);
      setVouchers([]);
      setBackendError(null);
      return;
    }
    Promise.all([fetchPlotsForFarmer(farmer.id), fetchVouchersForFarmer(farmer.id)])
      .then(([plotsRows, voucherRows]) => {
        setBackendPlots(plotsRows ?? []);
        setVouchers(voucherRows ?? []);
      })
      .catch(() => {
        setBackendPlots([]);
        setVouchers([]);
      });
  }, [farmer, params.plotId]);

  /** Server plots plus local plots not returned by the API (offline / not synced yet). */
  const mergedHarvestPlots = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; area_ha: number; localOnly?: boolean }
    >();
    for (const p of backendPlots) {
      const id = String(p?.id ?? '');
      if (!id) continue;
      byId.set(id, {
        id,
        name: String(p?.name ?? 'Plot'),
        area_ha: Number(p?.area_ha ?? p?.areaHa ?? 0) || 0,
        localOnly: false,
      });
    }
    if (farmer) {
      for (const lp of localPlots) {
        if (lp.farmerId !== farmer.id) continue;
        const id = String(lp.id);
        if (byId.has(id)) continue;
        const ha = Number(lp.declaredAreaHectares ?? lp.areaHectares ?? 0) || 0;
        byId.set(id, { id, name: lp.name, area_ha: ha, localOnly: true });
      }
    }
    return Array.from(byId.values());
  }, [backendPlots, localPlots, farmer]);

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
  const selectedPlot = useMemo(
    () =>
      mergedHarvestPlots.find((p) => String(p.id) === String(selectedPlotId ?? '')) ?? null,
    [mergedHarvestPlots, selectedPlotId],
  );
  const deliveredByPlot = useMemo(() => {
    const acc: Record<string, number> = {};
    vouchers.forEach((v) => {
      const pid = String(v?.plot_id ?? v?.plotId ?? '');
      if (!pid) return;
      const kg = Number(v?.kg ?? v?.kg_delivered ?? v?.weight_kg ?? 0);
      if (!Number.isFinite(kg)) return;
      acc[pid] = (acc[pid] ?? 0) + kg;
    });
    return acc;
  }, [vouchers]);
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
  const selectedArea = Number(selectedPlot?.area_ha ?? 0);
  const selectedCap = Number.isFinite(selectedArea) && selectedArea > 0 ? Math.round(selectedArea * 1500) : 0;
  const selectedUsed = Math.round(deliveredByPlot[String(selectedPlotId ?? '')] ?? 0);
  const selectedAvailable = Math.max(0, selectedCap - selectedUsed);
  const numericWeight = Number(weightInput.trim().replace(',', '.'));
  const canRecord = Boolean(
    farmer &&
      selectedPlotId &&
      Number.isFinite(numericWeight) &&
      numericWeight > 0 &&
      numericWeight <= selectedAvailable,
  );

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTopRow}>
          <Badge variant={totalSyncPending > 0 ? 'warning' : 'success'} size="sm">
            {totalSyncPending > 0 ? t('pending_count', { n: totalSyncPending }) : t('online')}
          </Badge>
        </View>
        <View style={styles.headerRowCompact}>
          <View style={[styles.headerSideSlot, styles.headerSideLeft]}>
            <Pressable
              onPress={() => {
                if (showHarvestLogged) {
                  setShowHarvestLogged(false);
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
                router.push('/');
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
              <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
                {t('back')}
              </ThemedText>
            </Pressable>
          </View>
          <View style={[styles.headerSideSlot, styles.headerSideRight]}>
            <View style={styles.langPillCompact}>
              <View style={styles.langDot} />
              <ThemedText type="caption" style={{ color: colors.textInverse }}>
                {String(lang).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.headerTitleCompact}>
              {showHarvestLogged
                ? t('harvest_header_logged')
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
        {showHarvestLogged ? (
          <>
            <View style={styles.harvestLoggedHeroWrap}>
              <View style={styles.harvestLoggedIconWrap}>
                <Ionicons name="checkmark" size={52} color="#0A9F68" />
              </View>
            </View>
            <ThemedText type="title" style={styles.harvestLoggedTitle}>
              {t('harvest_logged_title')}
            </ThemedText>
            <ThemedText type="default" style={styles.harvestLoggedBody}>
              {t('harvest_logged_body')}
            </ThemedText>

            <Card variant="outlined" style={styles.harvestLoggedQrCard}>
              <View style={styles.harvestLoggedQrWrap}>
                <Ionicons name="qr-code-outline" size={78} color="#A7A7A7" />
              </View>
              <ThemedText type="subtitle" style={styles.harvestLoggedQrText}>
                {t('harvest_share_qr')}
              </ThemedText>
            </Card>

            <Button
              variant="secondary"
              fullWidth
              style={{ backgroundColor: '#0A9F68' }}
              textStyle={styles.btnTextOnGreen}
              onPress={() => {
                setShowHarvestLogged(false);
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
              onPress={() => router.push('/')}
            >
              {t('back_to_home')}
            </Button>
          </>
        ) : showRecordWeight ? (
          <>
            <Card variant="outlined" style={styles.weightCard}>
              <ThemedText type="title" style={styles.weightTitle}>
                {t('weight_kg_title')}
              </ThemedText>
              <View style={styles.weightInputWrap}>
                <TextInput
                  placeholder={t('enter_weight_ph')}
                  placeholderTextColor="#98A2A0"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                  style={styles.weightInput}
                />
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => {
                    const next = Math.max(0, (Number.isFinite(numericWeight) ? numericWeight : 0) - 1);
                    setWeightInput(String(next));
                  }}
                >
                  <Ionicons name="remove" size={18} color="#4E4E4E" />
                </Pressable>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => {
                    const base = Number.isFinite(numericWeight) ? numericWeight : 0;
                    const next = Math.min(selectedAvailable, base + 1);
                    setWeightInput(String(next));
                  }}
                >
                  <Ionicons name="add" size={18} color="#4E4E4E" />
                </Pressable>
              </View>
            </Card>

            <View style={styles.weightMetaWrap}>
              <View style={styles.weightMetaRow}>
                <ThemedText type="subtitle" style={styles.weightMetaLabel}>
                  {t('plot_capacity', { name: String(selectedPlot?.name ?? t('plot_fallback')) })}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.weightMetaValue}>
                  {t('kg_remaining', { n: selectedAvailable.toLocaleString() })}
                </ThemedText>
              </View>
              <View style={styles.weightMetaRow}>
                <ThemedText type="subtitle" style={styles.weightMetaLabel}>
                  {t('max_yield_line')}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.weightMetaValue}>
                  {t('kg_total', { n: selectedCap.toLocaleString() })}
                </ThemedText>
              </View>
            </View>

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
                  await postHarvestToBackend({ farmerId: farmer.id, plotId: selectedPlotId, kg: numericWeight });
                  const voucherRows = await fetchVouchersForFarmer(farmer.id);
                  setVouchers(voucherRows ?? []);
                  setWeightInput('');
                  setShowRecordWeight(false);
                  setShowNewHarvestLog(false);
                  setShowHarvestLogged(true);
                  setMessage(t('harvest_recorded_msg'));
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
                  <ThemedText type="caption">{t('no_synced_plots')}</ThemedText>
                </Card>
              ) : (
                mergedHarvestPlots.slice(0, 24).map((p) => {
                  const area = Number(p.area_ha ?? 0);
                  const cap = Number.isFinite(area) && area > 0 ? Math.round(area * 1500) : 0;
                  const used = Math.round(deliveredByPlot[String(p.id)] ?? 0);
                  const available = Math.max(0, cap - used);
                  const selected = String(selectedPlotId) === String(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setSelectedPlotId(p.id);
                        setWeightInput('');
                        setShowRecordWeight(true);
                      }}
                    >
                      <Card variant="outlined" style={[styles.selectPlotCard, selected && styles.selectPlotCardSelected]}>
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
                          <ThemedText type="default" style={styles.plotCapacityText}>
                            {t('available_capacity', { n: available.toLocaleString() })}
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

        <Button
          variant="secondary"
          style={{ backgroundColor: '#0A7F59' }}
          textStyle={styles.btnTextOnGreen}
          fullWidth
          onPress={() => setShowNewHarvestLog(true)}
        >
          {t('start_new_harvest')}
        </Button>

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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
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
  plotCapacityText: {
    color: '#666666',
    marginTop: 2,
  },
  weightCard: {
    borderRadius: 22,
    borderColor: '#D5D5D5',
    backgroundColor: '#F8F8F8',
    padding: 16,
  },
  weightTitle: {
    color: '#333333',
    marginBottom: 10,
  },
  weightInputWrap: {
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  weightInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '800',
    color: '#5F6A67',
  },
  stepperRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightMetaWrap: {
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 2,
  },
  weightMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  weightMetaLabel: {
    color: '#5B5B5B',
    flex: 1,
  },
  weightMetaValue: {
    color: '#363636',
    textAlign: 'right',
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
  rowCard: { padding: 12 },
  deliveryCard: { padding: 14, borderRadius: 16 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});

