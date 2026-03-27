import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import QRCode from 'react-native-qrcode-svg';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button as UiButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { fetchPlotsForFarmer, fetchVouchersForFarmer, updatePlotMetadataOnBackend } from '@/features/api/postPlot';
import {
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  persistPlotPhoto,
  persistPlotTitlePhoto,
  persistPlotEvidenceItem,
  type PlotPhoto,
  type PlotTitlePhoto,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

type Sub = 'photos' | 'documents' | 'harvests' | 'voucher';

const MIN_GROUND_TRUTH_PHOTOS = 4;

export default function PlotDetailScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: Sub }>();
  const { plots, farmer, updatePlot } = useAppState();
  const { t, lang } = useLanguage();

  const plotId = typeof id === 'string' ? id : '';
  const plot = useMemo(() => plots.find((p) => p.id === plotId) ?? null, [plots, plotId]);

  const [active, setActive] = useState<Sub | null>((sub as Sub) ?? null);
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [evidence, setEvidence] = useState<PlotEvidenceItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendPlotId, setBackendPlotId] = useState<string | null>(null);
  const [overlapFlags, setOverlapFlags] = useState<{ sinaph: boolean; indigenous: boolean }>({
    sinaph: false,
    indigenous: false,
  });
  const voucherShareCaptureRef = useRef<View>(null);
  const [voucherShareBusy, setVoucherShareBusy] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [declaredHaDraft, setDeclaredHaDraft] = useState('');

  useEffect(() => {
    if (!plotId) return;
    loadPhotosForPlot(plotId).then(setPhotos).catch(() => setPhotos([]));
    loadTitlePhotosForPlot(plotId).then(setTitlePhotos).catch(() => setTitlePhotos([]));
    loadEvidenceForPlot(plotId).then(setEvidence).catch(() => setEvidence([]));
  }, [plotId]);

  useEffect(() => {
    if (!farmer?.id) {
      setBackendPlots([]);
      setBackendError(null);
      setBackendPlotId(null);
      setOverlapFlags({ sinaph: false, indigenous: false });
      return;
    }
    setLoadingBackend(true);
    setBackendError(null);
    fetchPlotsForFarmer(farmer.id)
      .then((rows) => setBackendPlots(rows ?? []))
      .catch((err) => {
        setBackendPlots([]);
        setBackendError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoadingBackend(false));
  }, [farmer?.id]);

  useEffect(() => {
    if (!plot || backendPlots.length === 0) {
      setBackendPlotId(null);
      setOverlapFlags({ sinaph: false, indigenous: false });
      return;
    }
    const byName = backendPlots.find((p) => String(p?.name ?? '') === plot.name);
    const targetArea = Number(plot.areaHectares);
    const byAreaKind = backendPlots
      .map((p) => ({
        p,
        area: Number(p?.area_ha ?? NaN),
        kind: String(p?.kind ?? ''),
      }))
      .filter((x) => Number.isFinite(x.area) && x.kind === plot.kind)
      .sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea))[0]?.p;

    const match = byName ?? byAreaKind ?? null;
    const id = match?.id ? String(match.id) : null;
    setBackendPlotId(id);
    setOverlapFlags({
      sinaph: match?.sinaph_overlap === true,
      indigenous: match?.indigenous_overlap === true,
    });
  }, [backendPlots, plot]);

  useEffect(() => {
    if (!farmer?.id) {
      setVouchers([]);
      return;
    }
    fetchVouchersForFarmer(farmer.id)
      .then((rows) => setVouchers(rows ?? []))
      .catch(() => setVouchers([]));
  }, [farmer?.id]);

  useEffect(() => {
    if (typeof sub === 'string') setActive(sub as Sub);
  }, [sub]);

  useEffect(() => {
    if (plot?.name) setRenameDraft(plot.name);
  }, [plot?.id, plot?.name]);

  useEffect(() => {
    if (!plot) {
      setDeclaredHaDraft('');
      return;
    }
    const v = plot.declaredAreaHectares;
    setDeclaredHaDraft(v != null && Number.isFinite(v) ? String(v) : '');
  }, [plot?.id, plot?.declaredAreaHectares]);

  const isOnline = !!farmer?.id && !loadingBackend && !backendError;

  const showDeclaredFieldInModal = Boolean(
    plot && (plot.kind === 'point' || plot.areaHectares < 4),
  );

  const applyPlotEdit = async () => {
    if (!plot) return;
    const next = renameDraft.trim();
    if (!next) {
      Alert.alert(t('warning'), t('rename_plot_empty'));
      return;
    }
    setNote(null);

    const patch: Partial<Plot> = { name: next };

    if (showDeclaredFieldInModal && declaredHaDraft.trim().length > 0) {
      const parsed = Number(declaredHaDraft.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert(t('warning'), t('plot_edit_declared_hint'));
        return;
      }
      if (plot.areaHectares > 0) {
        const diff = Math.abs(plot.areaHectares - parsed);
        const pct = (diff / parsed) * 100;
        if (pct > 5) {
          Alert.alert(t('warning'), t('plot_edit_declared_discrepancy'));
          return;
        }
        patch.declaredAreaHectares = parsed;
        patch.discrepancyPercent = pct;
      } else {
        patch.declaredAreaHectares = parsed;
        patch.discrepancyPercent = undefined;
      }
    } else if (showDeclaredFieldInModal && declaredHaDraft.trim().length === 0) {
      patch.declaredAreaHectares = undefined;
      patch.discrepancyPercent = undefined;
    }

    updatePlot(plot.id, patch);

    if (backendPlotId && farmer?.id) {
      try {
        await updatePlotMetadataOnBackend({
          plotId: backendPlotId,
          name: next,
          reason: t('plot_rename_backend_reason'),
        });
        const rows = await fetchPlotsForFarmer(farmer.id);
        setBackendPlots(rows ?? []);
      } catch {
        setNote(t('plot_rename_local_only'));
      }
    }
    Keyboard.dismiss();
    setRenameModalOpen(false);
  };

  const isCompliant = !overlapFlags.sinaph && !overlapFlags.indigenous;

  const plotStatusRows = useMemo(() => {
    const minG = MIN_GROUND_TRUTH_PHOTOS;
    const groundOk = photos.length >= minG;
    const landOk =
      titlePhotos.length > 0 || evidence.some((e) => e.kind === 'tenure_evidence');
    const fpicOk = evidence.some((e) => e.kind === 'fpic_repository');
    const permitOk = evidence.some((e) => e.kind === 'protected_area_permit');
    const syncOk = Boolean(backendPlotId);

    const rows: {
      id: string;
      title: string;
      hint: string;
      done: boolean;
      target: Sub | null;
    }[] = [
      {
        id: 'ground',
        title: t('plot_status_ground', { current: photos.length, min: minG }),
        hint: t('plot_status_ground_hint'),
        done: groundOk,
        target: 'photos',
      },
      {
        id: 'land',
        title: t('plot_status_land'),
        hint: t('plot_status_land_hint'),
        done: landOk,
        target: 'documents',
      },
    ];
    if (overlapFlags.indigenous) {
      rows.push({
        id: 'fpic',
        title: t('plot_status_fpic'),
        hint: t('plot_status_fpic_hint'),
        done: fpicOk,
        target: 'documents',
      });
    }
    if (overlapFlags.sinaph) {
      rows.push({
        id: 'permit',
        title: t('plot_status_permit'),
        hint: t('plot_status_permit_hint'),
        done: permitOk,
        target: 'documents',
      });
    }
    rows.push({
      id: 'sync',
      title: t('plot_status_sync'),
      hint: t('plot_status_sync_hint'),
      done: syncOk,
      target: null,
    });
    return rows;
  }, [
    photos.length,
    titlePhotos.length,
    evidence,
    overlapFlags.indigenous,
    overlapFlags.sinaph,
    backendPlotId,
    t,
  ]);

  const checklistOpenCount = useMemo(
    () => plotStatusRows.filter((r) => !r.done).length,
    [plotStatusRows],
  );
  const checklistComplete = checklistOpenCount === 0;

  /** Status card lists only incomplete items — what still needs doing. */
  const plotStatusRemainingRows = useMemo(
    () => plotStatusRows.filter((r) => !r.done),
    [plotStatusRows],
  );

  const addGroundTruthPhoto = async () => {
    if (!plot) return;
    setNote(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    const takenAt = Date.now();
    const firstPoint = plot.points[0];
    persistPlotPhoto({
      plotId: plot.id,
      uri,
      takenAt,
      latitude: firstPoint?.latitude ?? null,
      longitude: firstPoint?.longitude ?? null,
    });
    const updated = await loadPhotosForPlot(plot.id);
    setPhotos(updated);
  };

  const addLandTitlePhoto = async () => {
    if (!plot) return;
    setNote(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    const takenAt = Date.now();
    persistPlotTitlePhoto({ plotId: plot.id, uri, takenAt });
    const updated = await loadTitlePhotosForPlot(plot.id);
    setTitlePhotos(updated);
  };

  const addEvidence = async (kind: PlotEvidenceKind, label: string) => {
    if (!plot) return;
    setNote(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const asset = picked.assets[0];
    persistPlotEvidenceItem({
      plotId: plot.id,
      kind,
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      label: asset.name ?? label,
      takenAt: Date.now(),
    });
    const updated = await loadEvidenceForPlot(plot.id);
    setEvidence(updated);
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTopRow}>
          <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
            {isOnline ? t('online') : t('offline')}
          </Badge>
        </View>
        <View style={styles.headerRowCompact}>
          <Pressable onPress={() => (active ? setActive(null) : router.back())} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              Back
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {active === 'photos'
                ? 'Photo Vault'
                : active === 'documents'
                  ? 'Land Documents'
                  : active === 'harvests'
                    ? 'Harvest Records'
                    : active === 'voucher'
                      ? 'Compliance Voucher'
                      : 'Plot Details'}
            </ThemedText>
          </View>
          <View style={styles.langPillCompact}>
            <View style={styles.langDot} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        {active == null ? (
        <>
        <Card variant="outlined" style={styles.card}>
          <View style={styles.rowHeader}>
            <View style={styles.plotTitleBlock}>
              <ThemedText type="defaultSemiBold" style={styles.plotTitleFull}>
                {plot?.name ?? t('plot_detail_fallback')}
              </ThemedText>
              {plot ? (
                (() => {
                  const hasGpsArea = plot.areaHectares > 0;
                  const dec = plot.declaredAreaHectares;
                  const hasDeclared = dec != null && Number.isFinite(dec);
                  if (hasGpsArea && hasDeclared) {
                    return (
                      <ThemedText type="caption" style={styles.plotHectaresLine}>
                        {`${t('plot_hectares_gps', { n: plot.areaHectares.toFixed(1) })} · ${t(
                          'plot_hectares_declared',
                          { n: dec.toFixed(2) },
                        )}`}
                      </ThemedText>
                    );
                  }
                  if (hasDeclared && !hasGpsArea) {
                    return (
                      <ThemedText type="caption" style={styles.plotHectaresLine}>
                        {t('plot_hectares_declared', { n: dec.toFixed(2) })}
                      </ThemedText>
                    );
                  }
                  return (
                    <ThemedText type="caption" style={styles.plotHectaresLine}>
                      {t('plot_hectares', { n: plot.areaHectares.toFixed(1) })}
                    </ThemedText>
                  );
                })()
              ) : (
                <ThemedText type="caption" style={styles.plotHectaresLine}>
                  —
                </ThemedText>
              )}
            </View>
            {plot ? (
              <Pressable
                onPress={() => {
                  setRenameDraft(plot.name);
                  setRenameModalOpen(true);
                }}
                style={styles.plotRenameBtn}
                accessibilityLabel={t('rename_plot_title')}
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={18} color={Brand.primary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.plotStatusBadgeRow}>
            <Badge variant={checklistComplete ? 'success' : 'warning'} size="sm">
              {checklistComplete ? t('status_compliant') : t('status_action_needed')}
            </Badge>
          </View>
          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaCell}>
              <ThemedText type="caption">GeoID</ThemedText>
              <ThemedText type="defaultSemiBold">
                {plot ? `HN-COP-${new Date(plot.createdAt).getFullYear()}-${String(plot.id).slice(-3)}` : '—'}
              </ThemedText>
            </View>
            <View style={styles.summaryMetaCell}>
              <ThemedText type="caption">Registered</ThemedText>
              <ThemedText type="defaultSemiBold">
                {plot ? new Date(plot.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.statusChecklistCard}>
          <ThemedText type="defaultSemiBold" style={styles.statusChecklistTitle}>
            {t('plot_status_title')}
          </ThemedText>
          {plotStatusRemainingRows.length > 0 ? (
            <>
              <ThemedText type="caption" style={styles.statusChecklistSub}>
                {t('plot_status_subtitle')}
              </ThemedText>
              <View style={styles.statusChecklistRows}>
                {plotStatusRemainingRows.map((row) => (
                  <Pressable
                    key={row.id}
                    disabled={!row.target}
                    onPress={() => row.target && setActive(row.target)}
                    style={({ pressed }) => [
                      styles.statusRow,
                      styles.statusRowOpen,
                      row.target && pressed && styles.statusRowPressed,
                    ]}
                  >
                    <Ionicons name="ellipse-outline" size={22} color="#B45309" />
                    <View style={styles.statusRowBody}>
                      <ThemedText type="defaultSemiBold">{row.title}</ThemedText>
                      <ThemedText type="caption" style={styles.statusRowCaptionOpen}>
                        {row.hint}
                      </ThemedText>
                    </View>
                    {row.target ? (
                      <ThemedText type="caption" style={styles.statusRowTap}>
                        {t('tap_to_open')}
                      </ThemedText>
                    ) : null}
                  </Pressable>
                ))}
              </View>
              <ThemedText type="caption" style={styles.statusRemainingFooterHint}>
                {t('plot_status_remaining_hint')}
              </ThemedText>
            </>
          ) : (
            <View style={styles.statusAllDoneWrap}>
              <Ionicons name="checkmark-circle" size={28} color="#0A7F59" />
              <ThemedText type="default" style={styles.statusAllDoneText}>
                {t('plot_status_all_done')}
              </ThemedText>
            </View>
          )}
        </Card>

        <Card variant="outlined" style={styles.checkCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#0A7F59" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
                {isCompliant ? 'Deforestation Check Passed' : 'Deforestation Check Pending'}
              </ThemedText>
              <ThemedText type="default" style={{ color: '#1F6B57' }}>
                {isCompliant ? 'No forest loss detected since Dec 31, 2020' : 'Review required before compliance approval'}
              </ThemedText>
            </View>
          </View>
        </Card>

        <Pressable style={[styles.navCard, active === 'photos' && styles.navCardSelected]} onPress={() => setActive('photos')}>
          <View style={styles.navIconWrapPhoto}>
            <Ionicons name="camera-outline" size={28} color="#B36A00" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Photo Vault</ThemedText>
            <ThemedText type="default">{photos.length} ground-truth photos</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable style={[styles.navCard, active === 'documents' && styles.navCardSelected]} onPress={() => setActive('documents')}>
          <View style={styles.navIconWrapDocs}>
            <Ionicons name="document-text-outline" size={28} color="#2D5FD4" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Land Documents</ThemedText>
            <ThemedText type="default">{titlePhotos.length > 0 ? 'Clave Catastral uploaded' : 'Upload title and permit evidence'}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable style={[styles.navCard, active === 'harvests' && styles.navCardSelected]} onPress={() => setActive('harvests')}>
          <View style={styles.navIconWrapHarvest}>
            <Ionicons name="scale-outline" size={28} color="#0B6F50" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Harvest Records</ThemedText>
            <ThemedText type="default">{vouchers.length} deliveries this season</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable style={[styles.navCard, active === 'voucher' && styles.navCardSelected]} onPress={() => setActive('voucher')}>
          <View style={styles.navIconWrapVoucher}>
            <Ionicons name="qr-code-outline" size={26} color="#7B2CBF" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Compliance Voucher</ThemedText>
            <ThemedText type="default">Download QR proof</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>
        </>
        ) : null}

        {active === 'photos' ? (
          <>
            <Card variant="outlined" style={styles.photoIntroCard}>
              <ThemedText type="default" style={styles.photoIntroText}>
                These timestamped photos serve as evidence during EU audits to prove agricultural activity vs. deforestation.
              </ThemedText>
            </Card>
            <View style={styles.photoVaultGrid}>
              {(['North', 'East', 'South', 'West'] as const).map((dir, idx) => {
                const p = photos[idx];
                return (
                  <Pressable key={dir} style={styles.photoVaultSlot} onPress={addGroundTruthPhoto}>
                    {p?.uri ? (
                      <Image source={{ uri: p.uri }} style={styles.photoVaultImage} />
                    ) : (
                      <Ionicons name="image-outline" size={42} color="#ACACAC" />
                    )}
                    <ThemedText type="defaultSemiBold" style={styles.photoVaultTitle}>
                      {dir} View
                    </ThemedText>
                    <ThemedText type="caption" style={styles.photoVaultDate}>
                      {p?.takenAt ? new Date(p.takenAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : 'Tap to capture'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: 10 }}>
              <Button
                title="Update Photos"
                variant="secondary"
                style={{ backgroundColor: '#0A7F59' }}
                onPress={addGroundTruthPhoto}
              />
            </View>
          </>
        ) : null}

        {active === 'documents' ? (
          <>
            <Card variant="outlined" style={styles.docCard}>
              <View style={styles.docRow}>
                <View style={styles.docIconWrapGreen}>
                  <Ionicons name="bookmark-outline" size={24} color="#0A7F59" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle">Clave Catastral</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.docVerifiedText}>
                    Verified
                  </ThemedText>
                </View>
              </View>
              <View style={styles.docCodeWrap}>
                <ThemedText type="defaultSemiBold" style={styles.docCodeText}>
                  {plot ? `HN-COP-0401-${new Date(plot.createdAt).getFullYear()}-00142` : 'HN-COP-0401-2024-00142'}
                </ThemedText>
              </View>
            </Card>

            <Card variant="outlined" style={styles.docCard}>
              <View style={styles.docRow}>
                <View style={styles.docIconWrapBlue}>
                  <Ionicons name="document-text-outline" size={22} color="#2D5FD4" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle">Productor en Posesion</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.docPendingText}>
                    Pending verification
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="default" style={styles.docSubText}>
                {evidence.length > 0 || titlePhotos.length > 0 ? 'Municipal attestation uploaded' : 'Upload municipal attestation'}
              </ThemedText>
            </Card>

            <Pressable style={styles.uploadDocCta} onPress={() => addEvidence('tenure_evidence', 'municipal-attestation')}>
              <Ionicons name="arrow-up-outline" size={22} color="#0A7F59" />
              <ThemedText type="subtitle" style={styles.uploadDocText}>
                Upload Document
              </ThemedText>
            </Pressable>
          </>
        ) : null}

        {active === 'harvests' ? (
          <>
            {(() => {
              const scoped = vouchers.filter((v) => {
                const pid = String(v?.plot_id ?? v?.plotId ?? '');
                if (!pid || !backendPlotId) return false;
                return pid === backendPlotId;
              });
              const list = scoped.length > 0 ? scoped : vouchers;
              const sorted = [...list].sort((a, b) => {
                const at = new Date(String(a?.created_at ?? a?.createdAt ?? 0)).getTime();
                const bt = new Date(String(b?.created_at ?? b?.createdAt ?? 0)).getTime();
                return bt - at;
              });
              const rows = sorted.slice(0, 3).map((v, idx) => {
                const kg = Number(v?.kg ?? v?.kg_delivered ?? v?.weight_kg ?? 0);
                const createdRaw = String(v?.created_at ?? v?.createdAt ?? '');
                const date = createdRaw ? new Date(createdRaw) : null;
                return {
                  id: String(v?.id ?? idx),
                  kg: Number.isFinite(kg) ? Math.max(0, Math.round(kg)) : 0,
                  dateLabel: date
                    ? date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
                    : '—',
                };
              });
              const seasonTotalKg = sorted.reduce((sum, v) => {
                const kg = Number(v?.kg ?? v?.kg_delivered ?? v?.weight_kg ?? 0);
                return sum + (Number.isFinite(kg) ? Math.max(0, kg) : 0);
              }, 0);
              const yieldCapKg = plot ? Math.round(plot.areaHectares * 1500) : 3600;
              const progress = Math.min(1, yieldCapKg > 0 ? seasonTotalKg / yieldCapKg : 0);
              return (
                <>
                  <Card variant="outlined" style={styles.harvestSummaryCard}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="title" style={styles.harvestSummaryTitle}>
                        Season Total
                      </ThemedText>
                      <ThemedText type="title" style={styles.harvestSummaryKg}>
                        {`${Math.round(seasonTotalKg).toLocaleString()} kg`}
                      </ThemedText>
                    </View>
                    <View style={[styles.rowHeader, { marginTop: 4 }]}>
                      <ThemedText type="default" style={styles.harvestSubText}>
                        {`Yield cap (${plot ? plot.areaHectares.toFixed(1) : '2.4'} ha)`}
                      </ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.harvestSubText}>
                        {`${yieldCapKg.toLocaleString()} kg max`}
                      </ThemedText>
                    </View>
                    <View style={styles.harvestProgressTrack}>
                      <View style={[styles.harvestProgressFill, { width: `${Math.max(0.04, progress) * 100}%` }]} />
                    </View>
                  </Card>

                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <Card key={row.id} variant="outlined" style={styles.harvestRowCard}>
                        <View style={styles.rowHeader}>
                          <View>
                            <ThemedText type="title" style={styles.harvestKgText}>{`${row.kg} kg`}</ThemedText>
                            <ThemedText type="default" style={styles.harvestDateText}>
                              {row.dateLabel}
                            </ThemedText>
                          </View>
                          <ThemedText type="subtitle" style={styles.harvestCoopText}>
                            Coop El Sol
                          </ThemedText>
                        </View>
                      </Card>
                    ))
                  ) : (
                    <Card variant="outlined" style={styles.harvestRowCard}>
                      <ThemedText type="default" style={styles.harvestDateText}>
                        No harvest records yet
                      </ThemedText>
                    </Card>
                  )}
                </>
              );
            })()}
          </>
        ) : null}

        {active === 'voucher' ? (
          <>
            {(() => {
              const forPlot = vouchers.filter((v) => {
                const pid = String(v?.plot_id ?? v?.plotId ?? '');
                if (!pid || !backendPlotId) return false;
                return pid === backendPlotId;
              });
              const list = forPlot.length > 0 ? forPlot : vouchers;
              const latest = list[0] ?? null;
              const voucherCode =
                latest?.qr_code_ref
                  ? String(latest.qr_code_ref)
                  : plot
                    ? `HN-COP-${new Date(plot.createdAt).getFullYear()}-001-V`
                    : 'HN-COP-2024-001-V';
              /** Payload encoded in the QR: backend ref when synced, else stable local tracebud URI. */
              const qrPayload =
                latest?.qr_code_ref != null && String(latest.qr_code_ref).trim() !== ''
                  ? String(latest.qr_code_ref).trim()
                  : `tracebud:voucher:${plot?.id ?? 'local'}:${voucherCode}`;
              return (
                <>
                  <Card variant="outlined" style={styles.voucherCard}>
                    <View
                      ref={voucherShareCaptureRef}
                      collapsable={false}
                      style={styles.voucherShareCapture}
                    >
                      <View style={styles.voucherQrWrap}>
                        <View style={styles.voucherQrInner}>
                          <QRCode
                            value={qrPayload}
                            size={176}
                            color="#111111"
                            backgroundColor="#FFFFFF"
                            ecl="M"
                          />
                        </View>
                      </View>
                      <ThemedText type="title" style={styles.voucherTitle}>
                        Compliance Voucher
                      </ThemedText>
                      <ThemedText type="default" style={styles.voucherSubtitle}>
                        Scan to verify EUDR compliance
                      </ThemedText>
                      <View style={styles.voucherCodeWrap}>
                        <ThemedText type="defaultSemiBold" style={styles.voucherCodeText}>
                          {voucherCode}
                        </ThemedText>
                      </View>
                    </View>
                  </Card>

                  <ThemedText type="default" style={styles.voucherBodyText}>
                    This QR code is your digital proof of compliance. Share it with any buyer to verify your plot meets EUDR requirements.
                  </ThemedText>

                  <View style={{ marginTop: 6 }}>
                    <Button
                      title={t('voucher_share')}
                      variant="secondary"
                      style={{ backgroundColor: '#0A9F68' }}
                      loading={voucherShareBusy}
                      disabled={voucherShareBusy}
                      onPress={async () => {
                        const shareMessage = t('voucher_share_message', {
                          code: voucherCode,
                          payload: qrPayload,
                        });
                        setVoucherShareBusy(true);
                        setNote(null);
                        try {
                          if (Platform.OS === 'web') {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                            return;
                          }
                          await new Promise<void>((resolve) => setTimeout(() => resolve(), 150));
                          const uri = await captureRef(voucherShareCaptureRef, {
                            format: 'png',
                            quality: 0.95,
                            result: 'tmpfile',
                          });
                          const available = await Sharing.isAvailableAsync();
                          if (available && uri) {
                            await Sharing.shareAsync(uri, {
                              mimeType: 'image/png',
                              dialogTitle: t('voucher_share_title'),
                            });
                          } else {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                          }
                        } catch {
                          try {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                          } catch {
                            setNote(t('voucher_share_failed'));
                          }
                        } finally {
                          setVoucherShareBusy(false);
                        }
                      }}
                    />
                  </View>
                </>
              );
            })()}
          </>
        ) : null}

        {note ? <ThemedText type="caption">{note}</ThemedText> : null}
      </ThemedScrollView>

      <Modal
        visible={renameModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.renameModalKeyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
        >
          <Pressable
            style={styles.renameModalBackdrop}
            onPress={() => {
              Keyboard.dismiss();
              setRenameModalOpen(false);
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator
              bounces={false}
              style={{ maxHeight: windowHeight * 0.92 }}
              contentContainerStyle={styles.renameModalScrollContent}
            >
              <Pressable style={styles.renameModalCard} onPress={(e) => e.stopPropagation()}>
                <ThemedText type="subtitle">{t('plot_edit_title')}</ThemedText>
                <Input
                  label={t('rename_plot_label')}
                  value={renameDraft}
                  onChangeText={setRenameDraft}
                  containerStyle={{ marginTop: 8 }}
                />
                {showDeclaredFieldInModal ? (
                  <Input
                    label={t('plot_edit_declared_label')}
                    placeholder="e.g. 1.50"
                    keyboardType="decimal-pad"
                    value={declaredHaDraft}
                    onChangeText={setDeclaredHaDraft}
                    containerStyle={{ marginTop: 10 }}
                  />
                ) : null}
                {showDeclaredFieldInModal ? (
                  <ThemedText type="caption" style={{ marginTop: 6, opacity: 0.85 }}>
                    {t('plot_edit_declared_hint')}
                  </ThemedText>
                ) : null}
                {plot ? (
                  <View style={{ marginTop: 14 }}>
                    <UiButton
                      variant="outline"
                      size="md"
                      fullWidth
                      onPress={() => {
                        Keyboard.dismiss();
                        setRenameModalOpen(false);
                        router.push(`/(tabs)/record?editPlotId=${encodeURIComponent(plot.id)}`);
                      }}
                    >
                      {t('plot_edit_redo_boundary')}
                    </UiButton>
                  </View>
                ) : null}
                <View style={styles.renameModalActions}>
                  <View style={{ flex: 1 }}>
                    <UiButton
                      variant="outline"
                      size="md"
                      fullWidth
                      onPress={() => {
                        Keyboard.dismiss();
                        setRenameModalOpen(false);
                      }}
                    >
                      {t('cancel')}
                    </UiButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <UiButton variant="primary" size="md" fullWidth onPress={() => void applyPlotEdit()}>
                      {t('rename_plot_save')}
                    </UiButton>
                  </View>
                </View>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  headerRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
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
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { marginTop: 2 },
  summaryMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  summaryMetaCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  statusChecklistCard: {
    borderRadius: 18,
    borderColor: '#D7DBDF',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 0,
  },
  statusChecklistTitle: {
    color: '#0B4F3B',
    fontSize: 16,
  },
  statusChecklistSub: {
    marginTop: 4,
    color: '#5C5C5C',
    lineHeight: 18,
  },
  statusChecklistRows: {
    marginTop: 12,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FAFAFA',
  },
  statusRowOpen: {
    borderColor: '#F2C94C',
    backgroundColor: '#FFFBF0',
  },
  statusRowPressed: {
    opacity: 0.92,
  },
  statusRowBody: {
    flex: 1,
    flexShrink: 1,
  },
  statusRowCaptionOpen: {
    marginTop: 4,
    color: '#6B6B6B',
    lineHeight: 18,
  },
  statusRowTap: {
    color: Brand.primary,
    alignSelf: 'center',
    fontWeight: '600',
  },
  statusRemainingFooterHint: {
    marginTop: 10,
    color: '#6B7280',
    lineHeight: 18,
  },
  statusAllDoneWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  statusAllDoneText: {
    flex: 1,
    color: '#0A7F59',
    fontWeight: '600',
    lineHeight: 22,
  },
  checkCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
  },
  checkIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#BFEEDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCard: {
    borderWidth: 1,
    borderColor: '#D7DBDF',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navCardSelected: {
    borderColor: '#74D7B8',
  },
  navIconWrapPhoto: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8F1CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapDocs: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DFEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapHarvest: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapVoucher: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFE3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIntroCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
  },
  photoIntroText: {
    color: '#1E6D58',
  },
  photoVaultGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoVaultSlot: {
    width: '48.5%',
    minHeight: 210,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  photoVaultImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  photoVaultTitle: {
    color: '#666666',
  },
  photoVaultDate: {
    color: '#8E8E8E',
  },
  docCard: {
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    borderColor: '#D9D9D9',
    padding: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconWrapGreen: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#D3EFE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconWrapBlue: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#DBE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docVerifiedText: {
    color: '#0A7F59',
  },
  docPendingText: {
    color: '#B87700',
  },
  docCodeWrap: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docCodeText: {
    color: '#4F4F4F',
  },
  docSubText: {
    marginTop: 10,
    color: '#676767',
  },
  uploadDocCta: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#7CD8BA',
    borderStyle: 'dashed',
    backgroundColor: '#DDEFE8',
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  uploadDocText: {
    color: '#0A7F59',
  },
  harvestSummaryCard: {
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
  },
  harvestSummaryTitle: {
    color: '#3A3A3A',
  },
  harvestSummaryKg: {
    color: '#0A7F59',
  },
  harvestSubText: {
    color: '#565656',
  },
  harvestProgressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#E4E4E4',
    overflow: 'hidden',
  },
  harvestProgressFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: '#14B67A',
  },
  harvestRowCard: {
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    paddingVertical: 16,
  },
  harvestKgText: {
    color: '#1F1F1F',
  },
  harvestDateText: {
    color: '#616161',
  },
  harvestCoopText: {
    color: '#616161',
  },
  voucherCard: {
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 20,
  },
  voucherShareCapture: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  voucherQrWrap: {
    width: 192,
    height: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  voucherQrInner: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  voucherTitle: {
    color: '#1F1F1F',
  },
  voucherSubtitle: {
    color: '#6C6C6C',
    marginTop: 2,
  },
  voucherCodeWrap: {
    marginTop: 12,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
    alignItems: 'center',
  },
  voucherCodeText: {
    color: '#0A7F59',
  },
  voucherBodyText: {
    marginTop: 14,
    color: '#515151',
    lineHeight: 30,
  },
  rowCard: { padding: 12 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  plotTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  plotTitleFull: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  plotHectaresLine: {
    marginTop: 4,
    maxWidth: '100%',
    fontSize: 13,
    lineHeight: 18,
    color: '#3D3D3D',
  },
  plotStatusBadgeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plotRenameBtn: {
    padding: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F8F1',
    marginTop: 2,
    flexShrink: 0,
  },
  renameModalKeyboardRoot: {
    flex: 1,
  },
  renameModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  renameModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  renameModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  renameModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#eee' },
});

