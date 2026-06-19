import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert, Animated, BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useWalkPerimeter } from './useWalkPerimeter';
import { alertLocationPermissionDenied } from '@/features/permissions/locationPermission';
import { useAppState } from '@/features/state/AppStateContext';
import { mapPlotUploadErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';
import { resolveClientPlotId } from '@/features/plots/clientPlotId';
import { isSyncSignedIn } from '@/features/auth/signInSync';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { navigateHome } from '@/features/navigation/routes';
import {
  getSetting,
  logAuditEvent,
  loadPhotosForPlot,
  setSetting,
  type PlotPhoto,
} from '@/features/state/persistence';
import { GroundTruthPhotoCapture } from '@/components/plot-photo-vault/GroundTruthPhotoCapture';
import { GeometryConfidenceBanner } from '@/components/mapping/GeometryConfidenceBanner';
import { CornerMapOverlay } from '@/components/mapping/CornerMapOverlay';
import { PlotContiguityRuleCard } from '@/components/mapping/PlotContiguityRuleCard';
import { isGroundTruthPhotoSetComplete, countGeoVerifiedGroundTruthDirections } from '@/features/compliance/groundTruthPhotoGeo';
import { assessGeometryConfidence } from '@/features/compliance/plotGeometryConfidence';
import {
  buildPlotGeometryCaptureMetadata,
  type PlotGeometryCaptureMetadata,
} from '@/features/compliance/plotGeometryCapture';
import {
  assessManualTraceImageryAvailability,
  type ManualTraceImagerySource,
} from '@/features/offlineTiles/manualTraceImagery';
import { listOfflineTilePacks } from '@/features/offlineTiles/offlineTiles';
import { pingFieldMapImagery } from '@/features/network/pingFieldMapImagery';
import { FieldMapLayers } from '@/components/plot-map/FieldMapLayers';
import { PlotBoundaryOverlays } from '@/components/plot-map/PlotBoundaryOverlays';
import { fieldMapUsesCustomTiles, FIELD_MAP_CAPTURE_UI_PROPS, resolveFieldMapTileMode } from '@/features/mapping/fieldMapTiles';
import { regionFromCoordinates, type MapCoordinate } from '@/features/mapping/fieldMapRegion';
import { roundWgs84Coordinate } from '@/features/geo/coordinates';
import { Brand, Colors } from '@/constants/theme';
import { scaleText } from '@/features/demo/storeUiScale';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  assessPlotGeometryQuality,
  localPlotRefsForGeometry,
  localPolygonQualityMessage,
} from '@/features/compliance/plotGeometryQuality';
import {
  hasUnsavedMappingProgress,
  runWithMappingDiscardConfirm,
} from '@/features/mapping/mappingDiscardConfirm';
import {
  canConfirmCornerSave,
  cornerProgressNumbers,
  CORNER_CAPTURE_HOLD_SECONDS,
  resolveCornerCapturePhase,
} from '@/features/mapping/cornerCaptureUx';

type LatLng = {
  latitude: number;
  longitude: number;
};

const PIN_CAPTURE_AVG_SECONDS = 30;

/** Seconds left in a hold countdown (1..budget), aligned with the progress bar. */
function holdSecondsRemaining(elapsedSeconds: number, budgetSeconds: number): number {
  return Math.max(1, budgetSeconds - elapsedSeconds);
}

function geometryQualityAlertTitle(
  blockingIssues: Array<{ code: string }>,
  t: (key: string) => string,
): string {
  return blockingIssues.some((issue) => issue.code === 'GEO-105')
    ? t('geo_quality_overlap_title')
    : t('walk_invalid_boundary_title');
}

type CaptureMethod = 'walk' | 'draw' | 'centroid' | 'pin';
type CaptureMethodPage = CaptureMethod;

export function WalkPerimeterScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t, lang } = useLanguage();
  const onLocationDenied = useCallback(() => alertLocationPermissionDenied(t), [t]);
  const {
    points,
    samples,
    area,
    precisionMeters,
    isRecording,
    lastError,
    mode,
    setCaptureMode,
    startRecording,
    stopRecording,
    addAveragedVertex,
    addManualVertex,
    undoLastVertex,
    reset,
    replacePointsFromPlot,
  } = useWalkPerimeter({ onLocationDenied });
  const { farmer, setFarmer, plots, addPlot, updatePlot } = useAppState();
  const { openSignIn } = useSignInSheet();
  const params = useLocalSearchParams<{ editPlotId?: string }>();
  const editPlotId = typeof params.editPlotId === 'string' ? params.editPlotId : undefined;
  const editingPlot = useMemo(
    () => (editPlotId ? plots.find((p) => p.id === editPlotId) : undefined),
    [editPlotId, plots],
  );
  const editInitDone = useRef<string | null>(null);
  const [farmerIdInput, setFarmerIdInput] = useState(farmer?.id ?? '');
  const [farmerNameInput, setFarmerNameInput] = useState(farmer?.name ?? '');
  const [declaredAreaHaInput, setDeclaredAreaHaInput] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [plotName, setPlotName] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<'lt4' | 'gte4' | null>('lt4');
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [selectedMethodPage, setSelectedMethodPage] = useState<CaptureMethodPage | null>(null);
  const [showCompletionPage, setShowCompletionPage] = useState(false);
  const lastRegisteredPlotIdRef = useRef<string | null>(null);
  const [completionPhotos, setCompletionPhotos] = useState<PlotPhoto[]>([]);
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>('walk');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cornerHoldAnchor, setCornerHoldAnchor] = useState(0);
  const [pinHoldAnchor, setPinHoldAnchor] = useState(0);
  const wasRecordingRef = useRef(false);
  const [showGpsWarning, setShowGpsWarning] = useState(false);
  const [deviceRegion, setDeviceRegion] = useState<Region | null>(null);
  const [manualTraceImagery, setManualTraceImagery] = useState<{
    imagerySource: ManualTraceImagerySource;
    packId: string | null;
  } | null>(null);
  const enterManualTraceRef = useRef<(source: 'footer' | 'confidence_cta') => Promise<void>>(
    async () => undefined,
  );
  const [alternateCaptureOpen, setAlternateCaptureOpen] = useState(false);
  const [mapScrollLock, setMapScrollLock] = useState(false);
  const [drawTracingActive, setDrawTracingActive] = useState(false);
  const walkMapRef = useRef<MapView>(null);
  const drawMapRef = useRef<MapView>(null);
  const lastMapAnimateAtRef = useRef(0);
  const previewWatchRef = useRef<Location.LocationSubscription | null>(null);
  const [previewPosition, setPreviewPosition] = useState<MapCoordinate | null>(null);
  const [previewPrecisionMeters, setPreviewPrecisionMeters] = useState<number | null>(null);

  const defaultPlotName = useMemo(() => `Plot ${plots.length + 1}`, [plots.length]);

  useEffect(() => {
    if (!farmer?.id) return;
    setFarmerIdInput(farmer.id);
    setFarmerNameInput(farmer.name ?? '');
  }, [farmer?.id, farmer?.name]);

  useEffect(() => {
    if (editPlotId) return;
    if (!plotName) {
      setPlotName(defaultPlotName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPlotName, editPlotId]);

  useEffect(() => {
    if (!editingPlot) {
      editInitDone.current = null;
      return;
    }
    if (editInitDone.current === editingPlot.id) return;
    editInitDone.current = editingPlot.id;
    setPlotName(editingPlot.name);
    setDeclaredAreaHaInput(
      editingPlot.declaredAreaHectares != null && Number.isFinite(editingPlot.declaredAreaHectares)
        ? String(editingPlot.declaredAreaHectares)
        : '',
    );
    setEstimatedSize(editingPlot.areaHectares < 4 ? 'lt4' : 'gte4');
    setShowDetailedForm(true);
    setCaptureMethod('walk');
    setCaptureMode('walk');
    setSelectedMethodPage('walk');
    if (editingPlot.points?.length) {
      replacePointsFromPlot(editingPlot.points);
    }
  }, [editingPlot, editPlotId, replacePointsFromPlot]);

  useEffect(() => {
    // Large plots cannot use a single GPS pin; mark-corners polygon capture is allowed.
    if (estimatedSize === 'gte4' && captureMethod === 'pin') {
      setCaptureMethod('walk');
      setCaptureMode('walk');
      setSelectedMethodPage('walk');
    }
  }, [captureMethod, estimatedSize, setCaptureMode]);

  useEffect(() => {
    if (isRecording && !wasRecordingRef.current) {
      setRecordingSeconds(0);
      setCornerHoldAnchor(0);
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    if (precisionMeters != null && precisionMeters > 10) {
      setShowGpsWarning(true);
      const to = setTimeout(() => setShowGpsWarning(false), 2200);
      return () => clearTimeout(to);
    }
    if (recordingSeconds > 0 && recordingSeconds % 8 === 0 && Math.random() > 0.7) {
      setShowGpsWarning(true);
      const to = setTimeout(() => setShowGpsWarning(false), 2200);
      return () => clearTimeout(to);
    }
  }, [isRecording, precisionMeters, recordingSeconds]);

  const boundaryPointCount = points.length;

  const boundaryPointsStatLabelKey = useMemo(() => {
    if (captureMethod === 'draw') return 'walk_stat_draw_corners_label';
    return 'walk_stat_corners_label';
  }, [captureMethod]);

  const parsedDeclaredAreaHa = useMemo(() => {
    const trimmed = declaredAreaHaInput.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [declaredAreaHaInput]);

  const geometryConfidence = useMemo(() => {
    const precision = isRecording ? precisionMeters : (previewPrecisionMeters ?? precisionMeters);
    if (captureMethod === 'walk') {
      if (isRecording || points.length < 3 || area.hectares <= 0) return null;
    } else if (captureMethod === 'pin') {
      if (points.length < 1) return null;
    } else if (captureMethod === 'draw') {
      if (points.length < 3 || area.hectares <= 0) return null;
    } else if (captureMethod === 'centroid') {
      if (points.length < 3 || area.hectares <= 0) return null;
    } else {
      return null;
    }

    return assessGeometryConfidence({
      captureMethod,
      kind: captureMethod === 'pin' ? 'point' : 'polygon',
      precisionMeters: precision,
      points,
      areaHa: area.hectares,
      declaredAreaHa: parsedDeclaredAreaHa,
    });
  }, [
    area.hectares,
    captureMethod,
    isRecording,
    parsedDeclaredAreaHa,
    points,
    precisionMeters,
    previewPrecisionMeters,
  ]);

  const lastConfidenceTrackRef = useRef<string | null>(null);

  useEffect(() => {
    if (!geometryConfidence) return;
    const key = `${captureMethod}:${geometryConfidence.score}:${points.length}:${isRecording}`;
    if (lastConfidenceTrackRef.current === key) return;
    lastConfidenceTrackRef.current = key;
    trackEvent(ANALYTICS_EVENTS.GEOMETRY_CONFIDENCE_ASSESSED, {
      tier: geometryConfidence.tier,
      score: geometryConfidence.score,
      captureMethod,
      plotKind: captureMethod === 'pin' ? 'point' : 'polygon',
      recommendedAction: geometryConfidence.recommendedAction,
    });
  }, [captureMethod, geometryConfidence, isRecording, points.length]);

  const openManualTraceFromConfidence = useCallback(() => {
    void enterManualTraceRef.current('confidence_cta');
  }, []);

  const retryGpsCaptureFromConfidence = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.GEOMETRY_CONFIDENCE_CTA_CLICKED, {
      recommendedAction: 'retry_capture',
      tier: geometryConfidence?.tier ?? 'unknown',
      captureMethod,
    });
    reset();
    if (captureMethod === 'pin') {
      void startRecording();
    }
  }, [captureMethod, geometryConfidence?.tier, reset, startRecording]);

  const renderGeometryConfidenceBanner = () =>
    geometryConfidence ? (
      <GeometryConfidenceBanner
        assessment={geometryConfidence}
        t={t}
        onManualTrace={openManualTraceFromConfidence}
        onRetry={retryGpsCaptureFromConfidence}
      />
    ) : null;

  const recordGeometrySaveTelemetry = useCallback(() => {
    if (geometryConfidence?.tier === 'low') {
      trackEvent(ANALYTICS_EVENTS.GEOMETRY_LOW_CONFIDENCE_SAVED, {
        tier: geometryConfidence.tier,
        score: geometryConfidence.score,
        captureMethod,
      });
    }
    if (captureMethod === 'draw') {
      trackEvent(ANALYTICS_EVENTS.MANUAL_TRACE_SAVED, {
        vertexCount: points.length,
        areaHa: area.hectares,
        offlinePackId: manualTraceImagery?.packId ?? offlineTilesPackId,
        imagerySource: manualTraceImagery?.imagerySource ?? 'unknown',
      });
      if (manualTraceImagery) {
        void logAuditEvent({
          eventType: 'plot_manual_trace_saved',
          payload: {
            imagerySource: manualTraceImagery.imagerySource,
            offlineTilesPackId: manualTraceImagery.packId,
            vertexCount: points.length,
            areaHa: area.hectares,
          },
        }).catch(() => undefined);
      }
    }
  }, [
    area.hectares,
    captureMethod,
    geometryConfidence,
    manualTraceImagery,
    offlineTilesPackId,
    points.length,
  ]);

  const cornerHoldPercent = useMemo(() => {
    if (!isRecording || captureMethod !== 'centroid' || mode !== 'vertex_avg') return 0;
    const elapsed = recordingSeconds - cornerHoldAnchor;
    return Math.max(
      0,
      Math.min(100, Math.round((elapsed / CORNER_CAPTURE_HOLD_SECONDS) * 100)),
    );
  }, [isRecording, captureMethod, mode, recordingSeconds, cornerHoldAnchor]);

  const cornerCapturePhase = useMemo(
    () => resolveCornerCapturePhase({ isRecording, holdPercent: cornerHoldPercent }),
    [cornerHoldPercent, isRecording],
  );

  const cornerProgress = useMemo(
    () => cornerProgressNumbers(points.length),
    [points.length],
  );

  const cornerSaveReady = useMemo(
    () => canConfirmCornerSave({ isRecording, holdPercent: cornerHoldPercent }),
    [cornerHoldPercent, isRecording],
  );

  const handleSaveCorner = useCallback(() => {
    if (!isRecording) {
      setCornerHoldAnchor(0);
      void startRecording();
      return;
    }
    const elapsed = recordingSeconds - cornerHoldAnchor;
    if (elapsed < CORNER_CAPTURE_HOLD_SECONDS) {
      return;
    }
    const saved = addAveragedVertex(CORNER_CAPTURE_HOLD_SECONDS);
    if (!saved) {
      return;
    }
    setCornerHoldAnchor(recordingSeconds);
  }, [
    addAveragedVertex,
    cornerHoldAnchor,
    isRecording,
    recordingSeconds,
    startRecording,
  ]);

  const handleCancelCornerSettling = useCallback(() => {
    if (!isRecording) return;
    stopRecording();
    setCornerHoldAnchor(0);
  }, [isRecording, stopRecording]);

  const handleUndoLastCorner = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setCornerHoldAnchor(0);
      return;
    }
    if (points.length > 0) {
      undoLastVertex();
    }
  }, [isRecording, points.length, stopRecording, undoLastVertex]);

  const pinHoldPercent = useMemo(() => {
    if (!isRecording || captureMethod !== 'pin' || mode !== 'vertex_avg') return 0;
    const elapsed = recordingSeconds - pinHoldAnchor;
    return Math.max(0, Math.min(100, Math.round((elapsed / PIN_CAPTURE_AVG_SECONDS) * 100)));
  }, [captureMethod, isRecording, mode, pinHoldAnchor, recordingSeconds]);

  const pinHoldSecondsRemaining = useMemo(() => {
    if (!isRecording || captureMethod !== 'pin' || mode !== 'vertex_avg' || pinHoldPercent >= 100) {
      return PIN_CAPTURE_AVG_SECONDS;
    }
    return holdSecondsRemaining(recordingSeconds - pinHoldAnchor, PIN_CAPTURE_AVG_SECONDS);
  }, [captureMethod, isRecording, mode, pinHoldAnchor, pinHoldPercent, recordingSeconds]);

  const cornerHoldSecondsRemaining = useMemo(() => {
    if (!isRecording || captureMethod !== 'centroid' || mode !== 'vertex_avg' || cornerHoldPercent >= 100) {
      return CORNER_CAPTURE_HOLD_SECONDS;
    }
    return holdSecondsRemaining(recordingSeconds - cornerHoldAnchor, CORNER_CAPTURE_HOLD_SECONDS);
  }, [captureMethod, cornerHoldAnchor, cornerHoldPercent, isRecording, mode, recordingSeconds]);

  const handlePinCapturePress = () => {
    if (declaredAreaHaInput.trim()) {
      const parsedDeclared = Number(declaredAreaHaInput.trim().replace(',', '.'));
      if (Number.isNaN(parsedDeclared) || parsedDeclared <= 0) {
        Alert.alert(t('walk_invalid_declared_title'), t('walk_invalid_declared_body'));
        return;
      }
      if (parsedDeclared >= 4) {
        Alert.alert(t('walk_pin_area_too_large_title'), t('walk_pin_area_too_large_body'));
        return;
      }
    }
    if (!isRecording) {
      setPinHoldAnchor(0);
      startRecording();
      return;
    }
    const elapsed = recordingSeconds - pinHoldAnchor;
    if (elapsed < PIN_CAPTURE_AVG_SECONDS) {
      return;
    }
    const point = addAveragedVertex(PIN_CAPTURE_AVG_SECONDS);
    if (!point) {
      Alert.alert(t('walk_corner_wait_title'), t('walk_corner_wait_body'));
      return;
    }
    stopRecording();
    if (editingPlot) {
      handleSavePointPlot({ coords: point });
      return;
    }
    handleSavePointPlot({ shortPath: true, coords: point });
  };

  const recordingPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isRecording) {
      recordingPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulse, {
          toValue: 1.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(recordingPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, recordingPulse]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatLatLon = (lat: number, lon: number) => {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}°${ns}, ${Math.abs(lon).toFixed(6)}°${ew}`;
  };

  const mapAnchorRegion = useMemo((): Region => {
    if (points.length > 0) {
      return regionFromCoordinates(points, 1.45);
    }
    if (deviceRegion) return deviceRegion;
if (farmer?.declarationLatitude != null && farmer?.declarationLongitude != null) {
      return {
        latitude: farmer.declarationLatitude,
        longitude: farmer.declarationLongitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
    }
    const anchorPlot = editingPlot ?? plots[0];
    if (anchorPlot?.points?.length) {
      const lats = anchorPlot.points.map((p) => p.latitude);
      const lons = anchorPlot.points.map((p) => p.longitude);
      return {
        latitude: lats.reduce((sum, v) => sum + v, 0) / lats.length,
        longitude: lons.reduce((sum, v) => sum + v, 0) / lons.length,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
    }
    return {
      latitude: 14.0818,
      longitude: -87.2068,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [points, deviceRegion, farmer, editingPlot, plots]);

  const walkMapTileMode = useMemo(
    () => {
      if (captureMethod === 'draw' && manualTraceImagery) {
        if (manualTraceImagery.imagerySource === 'esri_online') {
          return resolveFieldMapTileMode({ lowDataMap: false, offlineTilesEnabled: false });
        }
        return resolveFieldMapTileMode({ lowDataMap: false, offlineTilesEnabled: true });
      }
      return resolveFieldMapTileMode({ lowDataMap, offlineTilesEnabled });
    },
    [captureMethod, lowDataMap, manualTraceImagery, offlineTilesEnabled],
  );
  const activeMapPackId =
    captureMethod === 'draw' && manualTraceImagery?.packId
      ? manualTraceImagery.packId
      : offlineTilesPackId;

  const liveWalkTrail = useMemo(
    () =>
      samples.map((s) => ({
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    [samples],
  );

  useEffect(() => {
    if (!isRecording && points.length === 0 && samples.length === 0) {
      if (previewPosition) {
        walkMapRef.current?.animateToRegion(regionFromCoordinates([previewPosition], 1.2), 380);
      }
      return;
    }

    const now = Date.now();
    if (isRecording && now - lastMapAnimateAtRef.current < 1200) return;
    lastMapAnimateAtRef.current = now;

    const coords = points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
    if (samples.length > 0) {
      const last = samples[samples.length - 1];
      coords.push({
        latitude: last.latitude,
        longitude: last.longitude,
      });
    }
    if (coords.length === 0) return;

    walkMapRef.current?.animateToRegion(regionFromCoordinates(coords, isRecording ? 1.55 : 1.35), 380);
  }, [isRecording, points, previewPosition, samples]);

  const finishNewPlotSave = useCallback(
    (name: string, plotId: string | null, tryServerUpload: () => void) => {
      const buttons: {
        text: string;
        onPress?: () => void;
        style?: 'cancel' | 'default' | 'destructive';
      }[] = [];
      if (plotId) {
        buttons.push({
          text: t('plot_saved_add_land_papers'),
          onPress: () =>
            router.replace(`/plot/${encodeURIComponent(plotId)}?sub=documents`),
        });
      }
      buttons.push({
        text: t('plot_saved_view_my_plots'),
        onPress: () => router.replace('/(tabs)/explore'),
      });
      if (isSyncSignedIn()) {
        buttons.push({
          text: t('plot_saved_continue'),
          onPress: tryServerUpload,
        });
      } else {
        buttons.push({
          text: t('sign_in_to_backup_title'),
          onPress: () => openSignIn({ variant: 'after_plot', onSuccess: tryServerUpload }),
        });
        buttons.push({ text: t('sign_in_skip'), style: 'cancel' });
      }
      Alert.alert(t('plot_saved_title'), t('plot_saved_message', { name }), buttons);
    },
    [openSignIn, t],
  );

  const hasFarmerAccess = farmer?.selfDeclared === true;

  const openShortPathCompletion = useCallback(() => {
    setShowCompletionPage(true);
    const plotId = lastRegisteredPlotIdRef.current;
    if (plotId) {
      void loadPhotosForPlot(plotId).then(setCompletionPhotos).catch(() => setCompletionPhotos([]));
    } else {
      setCompletionPhotos([]);
    }
  }, []);

  const handlePlotUploadResult = useCallback(
    (result: Awaited<ReturnType<typeof postPlotToBackend>>, retry: () => void) => {
      if (result.ok) return;
      if (result.reason === 'no_access_token') {
        openSignIn({ variant: 'sync', onSuccess: retry });
        return;
      }
      if (result.reason === 'server_error' || result.reason === 'network_error') {
        const friendly = mapPlotUploadErrorMessage(result.message, t, {
          reason: result.reason,
        });
        Alert.alert(t('plot_saved_title'), friendly);
      }
    },
    [openSignIn, t],
  );

  const resolveGeometryCaptureForSave = useCallback((): PlotGeometryCaptureMetadata => {
    const precision = precisionMeters ?? previewPrecisionMeters ?? null;
    const assessment =
      geometryConfidence ??
      assessGeometryConfidence({
        captureMethod,
        kind: captureMethod === 'pin' ? 'point' : 'polygon',
        precisionMeters: precision,
        points,
        areaHa: area.hectares,
        declaredAreaHa: parsedDeclaredAreaHa,
      });
    return buildPlotGeometryCaptureMetadata({
      captureMethod,
      assessment,
      manualTraceImagery: captureMethod === 'draw' ? manualTraceImagery : null,
      precisionMeters: precision,
    });
  }, [
    area.hectares,
    captureMethod,
    geometryConfidence,
    manualTraceImagery,
    parsedDeclaredAreaHa,
    points,
    precisionMeters,
    previewPrecisionMeters,
  ]);

  const tryBackgroundPlotUpload = useCallback(
    (
      plotId: string,
      geometry: ReturnType<typeof buildGeometryFromLocalPlot>,
      declaredAreaHectares?: number | null,
      geometryCapture?: PlotGeometryCaptureMetadata | null,
    ) => {
      if (!farmer?.id || !isSyncSignedIn()) return;
      const retry = () => {
        postPlotToBackend({
          farmerId: farmer.id,
          clientPlotId: resolveClientPlotId({ id: plotId }),
          geometry,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          geometryCapture: geometryCapture ?? null,
        }).then((r) => handlePlotUploadResult(r, retry));
      };
      retry();
    },
    [farmer?.id, handlePlotUploadResult, precisionMeters],
  );

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  const createLocalFarmerId = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const resolveProfileId = useCallback((): string => {
    const typed = farmerIdInput.trim();
    if (isUuid(typed)) return typed;
    if (farmer?.id && isUuid(farmer.id)) return farmer.id;
    return createLocalFarmerId();
  }, [farmer?.id, farmerIdInput]);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setDeviceRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        });
      } catch {
        // Map falls back to plot / default region.
      }
    })();
  }, []);

  useEffect(() => {
    getSetting('offlineTilesEnabled')
      .then((v) => setOfflineTilesEnabled(v === '1'))
      .catch(() => undefined);
    getSetting('offlineTilesActivePackId')
      .then((v) => setOfflineTilesPackId(v && v.length > 0 ? v : null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (captureMethod !== 'draw') {
      setManualTraceImagery(null);
      setDrawTracingActive(false);
    }
  }, [captureMethod]);

  const handleDrawBoundaryReset = useCallback(() => {
    reset();
    setDrawTracingActive(false);
  }, [reset]);

  const canSavePlot = points.length >= 3 && area.squareMeters > 0;
  const canSavePointPlot = points.length >= 1;
  const canContinueToCaptureMethod = estimatedSize != null;
  const effectivePrecisionMeters = isRecording ? precisionMeters : (previewPrecisionMeters ?? precisionMeters);
  const gpsStrengthLabel =
    effectivePrecisionMeters == null
      ? t('walk_gps_unknown')
      : effectivePrecisionMeters <= 6
        ? t('walk_gps_strong')
        : effectivePrecisionMeters <= 10
          ? t('walk_gps_fair')
          : t('walk_gps_weak');
  const gpsStrengthColor =
    effectivePrecisionMeters == null
      ? '#9CA3AF'
      : effectivePrecisionMeters <= 6
        ? '#10B981'
        : effectivePrecisionMeters <= 10
          ? '#F59E0B'
          : '#EF4444';
  const isWalkCaptureMode = captureMethod === 'walk' && selectedMethodPage === 'walk';
  const isWalkLandingState =
    captureMethod === 'walk' && selectedMethodPage === 'walk' && !isRecording && points.length === 0;
  const walkMapHeight = useMemo(() => {
    const headerAllowance = insets.top + 56;
    const footerAllowance = isWalkLandingState ? 132 : isRecording ? 120 : 128;
    const available = Math.max(200, windowHeight - headerAllowance - footerAllowance);
    if (isWalkLandingState) {
      return Math.min(520, Math.max(280, Math.round(available * 0.62)));
    }
    if (isRecording || points.length > 0) {
      return Math.min(400, Math.max(240, Math.round(available * 0.54)));
    }
    return Math.min(320, Math.max(200, Math.round(available * 0.4)));
  }, [insets.top, windowHeight, isWalkLandingState, isRecording, points.length]);

  const drawMapHeight = useMemo(() => {
    if (captureMethod !== 'draw') return 330;
    const headerAllowance = insets.top + 56;
    const footerAllowance = 148;
    const available = Math.max(240, windowHeight - headerAllowance - footerAllowance);
    return Math.min(560, Math.max(320, Math.round(available * 0.72)));
  }, [captureMethod, insets.top, windowHeight]);

  const cornerMapHeight = useMemo(() => {
    if (captureMethod !== 'centroid') return 330;
    const headerAllowance = insets.top + 56;
    const footerAllowance = 128;
    const available = Math.max(260, windowHeight - headerAllowance - footerAllowance);
    return Math.min(560, Math.max(300, Math.round(available * 0.82)));
  }, [captureMethod, insets.top, windowHeight]);

  const ensureMinimalFarmerForPlot = useCallback(() => {
    const id = resolveProfileId();
    setFarmerIdInput(id);
    const name = farmer?.name?.trim() || farmerNameInput.trim() || undefined;
    if (farmer?.id === id) {
      if (!farmer.name?.trim() && name) {
        setFarmer({ ...farmer, name });
      }
      return;
    }
    setFarmer({
      ...(farmer ?? {
        role: 'farmer' as const,
        selfDeclared: false,
      }),
      id,
      name,
      role: 'farmer',
    });
  }, [farmer, farmerNameInput, resolveProfileId]);

  const showCapturePage = !showCompletionPage;
  const walkActionsPinned = showDetailedForm && showCapturePage && isWalkCaptureMode;
  const centroidActionsPinned = showDetailedForm && showCapturePage && captureMethod === 'centroid';
  const drawActionsPinned = showDetailedForm && showCapturePage && captureMethod === 'draw';

  const switchToCaptureMethod = useCallback(
    (method: CaptureMethod, page: CaptureMethodPage) => {
      if (isRecording) stopRecording();
      reset();
      setCaptureMethod(method);
      setCaptureMode(
        method === 'walk' ? 'walk' : method === 'draw' ? 'manual_trace' : 'vertex_avg',
      );
      setSelectedMethodPage(page);
      setAlternateCaptureOpen(false);
      setDrawTracingActive(false);
      if (method === 'centroid') {
        setCornerGuideExpanded(true);
      }
    },
    [isRecording, reset, setCaptureMode, stopRecording],
  );

  const hasBoundaryMappingProgress = useMemo(
    () =>
      hasUnsavedMappingProgress({
        isRecording,
        drawTracingActive,
        pointCount: points.length,
        originalPoints: editingPlot?.points,
        currentPoints: points,
      }),
    [drawTracingActive, editingPlot?.points, isRecording, points],
  );

  const executeHeaderBack = useCallback(() => {
    if (showCompletionPage) {
      navigateHome(router);
      return;
    }
    if (alternateCaptureOpen) {
      setAlternateCaptureOpen(false);
      return;
    }
    if (selectedMethodPage && selectedMethodPage !== 'walk') {
      switchToCaptureMethod('walk', 'walk');
      return;
    }
    if (showDetailedForm) {
      if (editingPlot) {
        router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
        return;
      }
      setShowDetailedForm(false);
      setAlternateCaptureOpen(false);
      return;
    }
    if (editingPlot) {
      router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
      return;
    }
    navigateHome(router);
  }, [
    alternateCaptureOpen,
    editingPlot,
    selectedMethodPage,
    showCompletionPage,
    showDetailedForm,
    switchToCaptureMethod,
  ]);

  const handleHeaderBack = useCallback(() => {
    const needsConfirm =
      showCompletionPage && completionPhotos.length > 0
        ? true
        : alternateCaptureOpen
          ? false
          : hasBoundaryMappingProgress;
    runWithMappingDiscardConfirm(t, needsConfirm, executeHeaderBack);
  }, [
    alternateCaptureOpen,
    completionPhotos.length,
    executeHeaderBack,
    hasBoundaryMappingProgress,
    showCompletionPage,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleHeaderBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleHeaderBack]),
  );

  const showCaptureInstructions = useCallback(() => {
    if (captureMethod === 'centroid') {
      Alert.alert(t('walk_method_centroid'), t('walk_corner_instructions_alert'));
      return;
    }
    Alert.alert(
      captureMethod === 'draw'
        ? t('walk_method_draw')
        : t('walk_instructions_title'),
      captureMethod === 'draw'
        ? t('walk_draw_steps_body')
        : t('walk_instructions_body'),
    );
  }, [captureMethod, t]);

  const walkCaptureHint = useMemo(() => {
    if (!showCapturePage || captureMethod !== 'walk' || selectedMethodPage !== 'walk') {
      return null;
    }
    if (!isRecording) {
      if (points.length >= 3) {
        return t('walk_hint_close_loop');
      }
      return null;
    }
    if (points.length >= 3 && area.hectares >= 0.02) {
      return t('walk_hint_close_loop');
    }
    if (effectivePrecisionMeters != null && effectivePrecisionMeters > 15) {
      return t('walk_tip_recording_phone');
    }
    return t('walk_tip_walk_edge');
  }, [
    area.hectares,
    captureMethod,
    effectivePrecisionMeters,
    isRecording,
    points.length,
    selectedMethodPage,
    showCapturePage,
    t,
  ]);

  const drawCaptureHint = useMemo(() => {
    if (!showCapturePage || captureMethod !== 'draw') {
      return null;
    }
    if (!drawTracingActive) {
      if (manualTraceImagery?.imagerySource === 'offline_pack') {
        return t('walk_draw_hint_explore_offline');
      }
      return t('walk_draw_hint_explore');
    }
    if (points.length === 0) {
      return t('walk_draw_hint_trace');
    }
    if (points.length < 3) {
      return t('walk_draw_hint_more_corners', { n: points.length });
    }
    return t('walk_draw_hint_close', { ha: area.hectares > 0 ? area.hectares.toFixed(2) : '—' });
  }, [
    area.hectares,
    captureMethod,
    drawTracingActive,
    manualTraceImagery?.imagerySource,
    points.length,
    showCapturePage,
    t,
  ]);

  const completedPlot = useMemo(() => {
    const id = lastRegisteredPlotIdRef.current;
    if (!id) return null;
    return plots.find((p) => p.id === id) ?? null;
  }, [plots, showCompletionPage]);

  const completionVerifiedPhotoCount = useMemo(() => {
    if (!completedPlot) return 0;
    return countGeoVerifiedGroundTruthDirections(completionPhotos, completedPlot);
  }, [completedPlot, completionPhotos]);

  const completionPhotosComplete = useMemo(
    () => (completedPlot ? isGroundTruthPhotoSetComplete(completionPhotos, completedPlot) : false),
    [completedPlot, completionPhotos],
  );

  const mapCoordDisplay = previewPosition ?? {
    latitude: deviceRegion?.latitude ?? mapAnchorRegion.latitude,
    longitude: deviceRegion?.longitude ?? mapAnchorRegion.longitude,
  };

  const userMapPosition = useMemo((): MapCoordinate | null => {
    if (isRecording && samples.length > 0) {
      const last = samples[samples.length - 1];
      return { latitude: last.latitude, longitude: last.longitude };
    }
    return previewPosition;
  }, [isRecording, previewPosition, samples]);

  const tryEnterManualTrace = useCallback(
    async (source: 'footer' | 'confidence_cta') => {
      if (lowDataMap) {
        trackEvent(ANALYTICS_EVENTS.MANUAL_TRACE_IMAGERY_BLOCKED, {
          reason: 'low_data_map',
          code: 'GEO-108',
          source,
        });
        Alert.alert(
          t('walk_manual_trace_blocked_title'),
          t('walk_manual_trace_blocked_low_data_body'),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('walk_low_data_off'),
              onPress: () => setLowDataMap(false),
            },
          ],
        );
        return;
      }

      const assessment = await assessManualTraceImageryAvailability({
        latitude: mapCoordDisplay.latitude,
        longitude: mapCoordDisplay.longitude,
        lowDataMap: false,
        activePackId: offlineTilesPackId,
        listPacks: listOfflineTilePacks,
        pingOnlineImagery: pingFieldMapImagery,
      });

      if (!assessment.allowed) {
        trackEvent(ANALYTICS_EVENTS.MANUAL_TRACE_IMAGERY_BLOCKED, {
          reason: assessment.reason,
          code: assessment.code,
          source,
        });
        Alert.alert(t('walk_manual_trace_blocked_title'), t('walk_manual_trace_blocked_body'), [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('walk_manual_trace_download_maps'),
            onPress: () => router.push('/offline-maps' as Href),
          },
        ]);
        return;
      }

      if (geometryConfidence?.recommendedAction === 'use_manual_trace') {
        trackEvent(ANALYTICS_EVENTS.GEOMETRY_CONFIDENCE_CTA_CLICKED, {
          recommendedAction: 'use_manual_trace',
          tier: geometryConfidence.tier,
          captureMethod,
        });
      }

      if (assessment.imagerySource === 'offline_pack' && assessment.packId) {
        await setSetting('offlineTilesEnabled', '1');
        await setSetting('offlineTilesActivePackId', assessment.packId);
        setOfflineTilesEnabled(true);
        setOfflineTilesPackId(assessment.packId);
      }

      setManualTraceImagery({
        imagerySource: assessment.imagerySource,
        packId: assessment.packId,
      });
      reset();
      setDrawTracingActive(false);
      trackEvent(ANALYTICS_EVENTS.MANUAL_TRACE_STARTED, {
        source,
        imagerySource: assessment.imagerySource,
        captureMethod,
      });
      setCaptureMethod('draw');
      setCaptureMode('manual_trace');
      setSelectedMethodPage('draw');
      setAlternateCaptureOpen(false);
    },
    [
      captureMethod,
      geometryConfidence,
      lowDataMap,
      mapCoordDisplay.latitude,
      mapCoordDisplay.longitude,
      offlineTilesPackId,
      setCaptureMode,
      reset,
      t,
    ],
  );

  useEffect(() => {
    if (captureMethod !== 'draw') return;
    const coords = previewPosition
      ? [previewPosition]
      : deviceRegion
        ? [{ latitude: deviceRegion.latitude, longitude: deviceRegion.longitude }]
        : null;
    if (!coords) return;
    drawMapRef.current?.animateToRegion(regionFromCoordinates(coords, 1.45), 420);
  }, [captureMethod, deviceRegion, previewPosition]);

  useEffect(() => {
    enterManualTraceRef.current = tryEnterManualTrace;
  }, [tryEnterManualTrace]);

  useEffect(() => {
    const active =
      showCapturePage &&
      (captureMethod === 'walk' || captureMethod === 'pin' || captureMethod === 'centroid') &&
      !isRecording;
    if (!active) {
      if (previewWatchRef.current) {
        previewWatchRef.current.remove();
        previewWatchRef.current = null;
      }
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled || status !== 'granted') return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2500,
            distanceInterval: 3,
          },
          (loc) => {
            const latitude = roundWgs84Coordinate(loc.coords.latitude);
            const longitude = roundWgs84Coordinate(loc.coords.longitude);
            setPreviewPosition({ latitude, longitude });
            setDeviceRegion({
              latitude,
              longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            });
            if (typeof loc.coords.accuracy === 'number') {
              setPreviewPrecisionMeters(loc.coords.accuracy);
            }
          },
        );

        if (cancelled) {
          sub.remove();
          return;
        }
        previewWatchRef.current = sub;
      } catch {
        // Map keeps plot/default anchor region.
      }
    })();

    return () => {
      cancelled = true;
      if (previewWatchRef.current) {
        previewWatchRef.current.remove();
        previewWatchRef.current = null;
      }
    };
  }, [captureMethod, isRecording, showCapturePage]);

  const handleSavePointPlot = (options?: {
    shortPath?: boolean;
    coords?: { latitude: number; longitude: number };
  }) => {
    if (!options?.coords && !canSavePointPlot) return;

    const last = options?.coords ?? points[points.length - 1];
    if (!last) return;

    const name = (plotName || defaultPlotName).trim() || defaultPlotName;

    let declaredAreaHectares: number | undefined;
    if (declaredAreaHaInput.trim().length > 0) {
      const parsed = Number(declaredAreaHaInput.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert(t('walk_invalid_declared_title'), t('walk_invalid_declared_body'));
        return;
      }
      declaredAreaHectares = parsed;
    }

    if (declaredAreaHectares != null && declaredAreaHectares >= 4) {
      Alert.alert(t('walk_pin_area_too_large_title'), t('walk_pin_area_too_large_body'));
      return;
    }

    const pointPointsPayload = [{ latitude: last.latitude, longitude: last.longitude }];

    const pointGeometryQuality = assessPlotGeometryQuality({
      kind: 'point',
      points: pointPointsPayload,
      areaHa: declaredAreaHectares ?? 0,
      otherPlots: localPlotRefsForGeometry(plots, editingPlot?.id),
      excludePlotId: editingPlot?.id,
      phase: 'save',
    });
    if (pointGeometryQuality.blockingIssues.length > 0) {
      Alert.alert(
        geometryQualityAlertTitle(pointGeometryQuality.blockingIssues, t),
        localPolygonQualityMessage(pointGeometryQuality.blockingIssues, t),
      );
      return;
    }

    recordGeometrySaveTelemetry();
    const geometryCapture = resolveGeometryCaptureForSave();

    let pointGeometryForUpload: ReturnType<typeof buildGeometryFromLocalPlot>;
    try {
      pointGeometryForUpload = buildGeometryFromLocalPlot({
        kind: 'point',
        points: pointPointsPayload,
      });
    } catch (e) {
      Alert.alert(
        t('plot_geometry_error_title'),
        e instanceof Error ? e.message : t('plot_geometry_error_body'),
      );
      return;
    }

    if (editingPlot) {
      updatePlot(editingPlot.id, {
        name,
        areaSquareMeters: 0,
        areaHectares: 0,
        kind: 'point',
        points: pointPointsPayload,
        declaredAreaHectares,
        discrepancyPercent: undefined,
        precisionMetersAtSave: precisionMeters ?? null,
        geometryCapture,
      });
      Alert.alert(t('walk_plot_updated_title'), t('walk_plot_updated_point_body'));
      router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
      return;
    }

    const newPlotId = addPlot({
      name,
      areaSquareMeters: 0,
      areaHectares: 0,
      kind: 'point',
      points: pointPointsPayload,
      declaredAreaHectares,
      discrepancyPercent: undefined,
      precisionMetersAtSave: precisionMeters ?? null,
      geometryCapture,
    });
    if (newPlotId) {
      lastRegisteredPlotIdRef.current = newPlotId;
    }

    if (options?.shortPath) {
      openShortPathCompletion();
      if (newPlotId) {
        tryBackgroundPlotUpload(newPlotId, pointGeometryForUpload, declaredAreaHectares, geometryCapture);
      }
      return;
    }

    if (farmer && newPlotId) {
      const plotIdForUpload = newPlotId;
      const tryServerUpload = () => {
        postPlotToBackend({
          farmerId: farmer.id,
          clientPlotId: resolveClientPlotId({ id: plotIdForUpload }),
          geometry: pointGeometryForUpload,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          geometryCapture,
        }).then((r) => handlePlotUploadResult(r, tryServerUpload));
      };
      finishNewPlotSave(name, newPlotId, tryServerUpload);
    } else {
      Alert.alert(t('walk_plot_saved_point_title'), t('walk_plot_saved_point_body', { name }));
    }
  };

  const handleSavePlot = (options?: { shortPath?: boolean }) => {
    if (!canSavePlot) {
      return;
    }

    if (precisionMeters != null && precisionMeters > 10) {
      Alert.alert(t('walk_poor_gps_title'), t('walk_poor_gps_body'));
    }

    const polygonGeometryQuality = assessPlotGeometryQuality({
      kind: 'polygon',
      points,
      areaHa: area.hectares,
      otherPlots: localPlotRefsForGeometry(plots, editingPlot?.id),
      excludePlotId: editingPlot?.id,
      phase: 'save',
    });
    if (polygonGeometryQuality.blockingIssues.length > 0) {
      Alert.alert(
        geometryQualityAlertTitle(polygonGeometryQuality.blockingIssues, t),
        localPolygonQualityMessage(polygonGeometryQuality.blockingIssues, t),
      );
      return;
    }

    recordGeometrySaveTelemetry();
    const geometryCapture = resolveGeometryCaptureForSave();

    // EUDR geometry: plots ≥4 ha must be polygons; plots <4 ha may be point OR polygon.
    // This path always has a walked perimeter (≥3 vertices) — store as polygon even if area <4 ha.
    const kind: 'polygon' = 'polygon';
    const name = (plotName || defaultPlotName).trim() || defaultPlotName;

    let declaredAreaHectares: number | undefined;
    let discrepancyPercent: number | undefined;

    if (declaredAreaHaInput.trim().length > 0) {
      const parsed = Number(declaredAreaHaInput.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert(t('walk_invalid_declared_title'), t('walk_invalid_declared_body'));
        return;
      }
      declaredAreaHectares = parsed;

      const diff = Math.abs(area.hectares - declaredAreaHectares);
      const pct = (diff / declaredAreaHectares) * 100;

      if (pct > 5) {
        Alert.alert(
          t('walk_area_discrepancy_title'),
          t('walk_area_discrepancy_body', {
            gps: area.hectares.toFixed(4),
            declared: declaredAreaHectares.toFixed(4),
            pct: pct.toFixed(1),
          }),
        );
        return;
      }

      discrepancyPercent = pct;
    }

    const pointsPayload = points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    let geometryForUpload: ReturnType<typeof buildGeometryFromLocalPlot>;
    try {
      geometryForUpload = buildGeometryFromLocalPlot({ kind, points: pointsPayload });
    } catch (e) {
      Alert.alert(
        t('plot_geometry_error_title'),
        e instanceof Error ? e.message : t('plot_geometry_error_body'),
      );
      return;
    }

    if (editingPlot) {
      updatePlot(editingPlot.id, {
        name,
        areaSquareMeters: area.squareMeters,
        areaHectares: area.hectares,
        kind,
        points: pointsPayload,
        declaredAreaHectares,
        discrepancyPercent,
        precisionMetersAtSave: precisionMeters ?? null,
        geometryCapture,
      });
      Alert.alert(t('walk_plot_updated_title'), t('walk_plot_updated_polygon_body'));
      router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
      return;
    }

    const newPlotId = addPlot({
      name,
      areaSquareMeters: area.squareMeters,
      areaHectares: area.hectares,
      kind,
      points: pointsPayload,
      declaredAreaHectares,
      discrepancyPercent,
      precisionMetersAtSave: precisionMeters ?? null,
      geometryCapture,
    });
    if (newPlotId) {
      lastRegisteredPlotIdRef.current = newPlotId;
    }

    // Log raw GNSS capture metadata
    try {
      const acc = samples
        .map((s) => s.accuracyMeters)
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      const minAcc = acc.length > 0 ? Math.min(...acc) : null;
      const maxAcc = acc.length > 0 ? Math.max(...acc) : null;
      const avgAcc = acc.length > 0 ? acc.reduce((a, b) => a + b, 0) / acc.length : null;
      const firstTs = samples[0]?.timestamp ?? null;
      const lastTs = samples.length > 0 ? samples[samples.length - 1].timestamp : null;

      logAuditEvent({
        userId: farmer?.id,
        eventType: 'plot_gnss_capture_meta',
        payload: {
          clientPlotId: newPlotId ?? name,
          mode,
          sampleCount: samples.length,
          timeWindowMs:
            firstTs != null && lastTs != null ? Math.max(0, lastTs - firstTs) : null,
          accuracyMeters: { min: minAcc, max: maxAcc, avg: avgAcc },
          lastFix: samples.length > 0 ? samples[samples.length - 1] : null,
        },
      }).catch(() => undefined);
    } catch {
      // ignore
    }

    if (options?.shortPath) {
      openShortPathCompletion();
      if (newPlotId) {
        tryBackgroundPlotUpload(newPlotId, geometryForUpload, declaredAreaHectares, geometryCapture);
      }
      return;
    }

    if (farmer && points.length > 0 && !editingPlot && newPlotId) {
      const plotIdForUpload = newPlotId;
      const tryServerUpload = () => {
        postPlotToBackend({
          farmerId: farmer.id,
          clientPlotId: resolveClientPlotId({ id: plotIdForUpload }),
          geometry: geometryForUpload,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          geometryCapture,
        }).then((r) => handlePlotUploadResult(r, tryServerUpload));
      };
      finishNewPlotSave(name, newPlotId, tryServerUpload);
    }
  };

  const handleWalkStopAndSave = () => {
    if (isRecording) {
      stopRecording();
    }
    if (points.length < 3 || area.squareMeters <= 0) {
      Alert.alert(t('walk_connect_points'), t('walk_help'));
      return;
    }
    if (editingPlot) {
      handleSavePlot();
      return;
    }
    handleSavePlot({ shortPath: true });
  };

  const renderAlternateCapturePanel = () => (
    <View style={styles.alternateCapturePanel}>
      <ThemedText type="caption" style={styles.alternateCaptureIntro}>
        {t('walk_cant_walk_edge')}
      </ThemedText>
      {estimatedSize !== 'gte4' ? (
        <Pressable
          onPress={() => {
            switchToCaptureMethod('pin', 'pin');
          }}
          style={styles.alternateCaptureRow}
        >
          <Ionicons name="location" size={20} color="#0A7F59" />
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold">{t('walk_method_pin')}</ThemedText>
            <ThemedText type="caption">{t('walk_method_pin_contrast')}</ThemedText>
          </View>
        </Pressable>
      ) : null}
      <Pressable
        testID="walk-method-mark-corners"
        onPress={() => {
          switchToCaptureMethod('centroid', 'centroid');
        }}
        style={styles.alternateCaptureRow}
      >
        <Ionicons name="locate-outline" size={20} color="#7C3AED" />
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold">{t('walk_method_centroid')}</ThemedText>
          <ThemedText type="caption">{t('walk_method_centroid_contrast')}</ThemedText>
        </View>
      </Pressable>
      <Pressable
        onPress={() => {
          void enterManualTraceRef.current('footer');
        }}
        style={styles.alternateCaptureRow}
      >
        <Ionicons name="create-outline" size={20} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <View style={styles.alternateCaptureTitleRow}>
            <ThemedText type="defaultSemiBold">{t('walk_method_draw')}</ThemedText>
            <ThemedText type="caption" style={styles.alternateCaptureFallback}>
              {t('walk_method_draw_fallback')}
            </ThemedText>
          </View>
          <ThemedText type="caption">{t('walk_method_draw_body')}</ThemedText>
        </View>
      </Pressable>
    </View>
  );

  const renderWalkCaptureActions = () => (
    <View style={{ gap: 8 }}>
      {walkCaptureHint ? (
        <ThemedText type="caption" style={styles.walkCaptureHint}>
          {walkCaptureHint}
        </ThemedText>
      ) : null}
      {!isRecording ? (
        <Button
          variant="secondary"
          style={{ backgroundColor: '#0A7F59', minHeight: 56 }}
          icon={<Ionicons name="play-outline" size={20} color="#FFFFFF" />}
          onPress={startRecording}
          fullWidth
        >
          {points.length === 0 ? t('start_walking') : t('walk_start_recording')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          style={{ backgroundColor: '#0A7F59', minHeight: 56 }}
          icon={<Ionicons name="stop-outline" size={20} color="#FFFFFF" />}
          onPress={handleWalkStopAndSave}
          fullWidth
        >
          {t('walk_stop_and_save')}
        </Button>
      )}
      {!isRecording && points.length >= 3 ? (
        <Button variant="primary" onPress={handleWalkStopAndSave} fullWidth>
          {editingPlot ? t('walk_save_boundary') : t('walk_complete_geolocation')}
        </Button>
      ) : null}
      {isWalkLandingState ? (
        <>
          <Pressable onPress={() => setAlternateCaptureOpen((open) => !open)} style={styles.otherWaysLink}>
            <ThemedText type="caption" style={styles.otherWaysLinkText}>
              {alternateCaptureOpen ? t('walk_hide_other_ways') : t('walk_other_ways_map')}
            </ThemedText>
            <Ionicons
              name={alternateCaptureOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#6B7280"
            />
          </Pressable>
          {alternateCaptureOpen ? renderAlternateCapturePanel() : null}
        </>
      ) : null}
      {!isWalkLandingState && (points.length > 0 || isRecording) ? (
        <Button variant="ghost" onPress={reset} fullWidth>
          {t('reset')}
        </Button>
      ) : null}
    </View>
  );

  const renderDrawCaptureActions = () => (
    <View style={{ gap: 8 }}>
      {drawCaptureHint ? (
        <ThemedText type="caption" style={styles.walkCaptureHint}>
          {drawCaptureHint}
        </ThemedText>
      ) : null}
      {!drawTracingActive ? (
        <Button
          variant="secondary"
          style={{ backgroundColor: '#0A7F59' }}
          testID="walk-draw-start-tracing"
          icon={<Ionicons name="create-outline" size={20} color="#FFFFFF" />}
          onPress={() => setDrawTracingActive(true)}
          fullWidth
        >
          {points.length > 0 ? t('walk_draw_resume_tracing') : t('walk_draw_start_tracing')}
        </Button>
      ) : (
        <>
          {points.length >= 3 && canSavePlot ? (
            <Button
              variant="primary"
              fullWidth
              onPress={() => {
                if (editingPlot) {
                  handleSavePlot();
                  return;
                }
                handleSavePlot({ shortPath: true });
              }}
            >
              {editingPlot ? t('walk_save_boundary') : t('walk_complete_geolocation')}
            </Button>
          ) : null}
          <View style={styles.buttonRow}>
            <View style={styles.buttonCell}>
              <Button variant="outline" onPress={undoLastVertex} disabled={!points.length} fullWidth>
                {t('walk_undo_corner')}
              </Button>
            </View>
            <View style={styles.buttonCell}>
              <Button
                variant="danger"
                onPress={handleDrawBoundaryReset}
                disabled={!points.length}
                fullWidth
              >
                {t('walk_clear_boundary')}
              </Button>
            </View>
          </View>
          <Button variant="ghost" onPress={() => setDrawTracingActive(false)} fullWidth>
            {t('walk_draw_pan_again')}
          </Button>
        </>
      )}
    </View>
  );

  const renderCornerCaptureActions = () => (
    <View style={{ gap: 8 }}>
      {isRecording ? (
        <View style={styles.averagingTrackCompact}>
          <View
            style={[styles.averagingFillCompact, { width: `${Math.max(cornerHoldPercent, 2)}%` }]}
          />
        </View>
      ) : null}
      <Button
        variant="secondary"
        style={{ backgroundColor: '#0A7F59' }}
        testID="walk-save-corner"
        icon={
          <Ionicons
            name={isRecording && cornerSaveReady ? 'checkmark-circle-outline' : 'locate-outline'}
            size={20}
            color="#FFFFFF"
          />
        }
        onPress={handleSaveCorner}
        fullWidth
        disabled={isRecording && !cornerSaveReady}
      >
        {!isRecording
          ? points.length > 0
            ? t('walk_corner_start_next')
            : t('walk_corner_start_first')
          : cornerSaveReady
            ? t('walk_corner_save_this')
            : t('walk_corner_hold_progress', { seconds: cornerHoldSecondsRemaining })}
      </Button>
      {points.length >= 3 && canSavePlot ? (
        <Button
          variant="primary"
          fullWidth
          onPress={() => {
            if (editingPlot) {
              handleSavePlot();
              return;
            }
            handleSavePlot({ shortPath: true });
          }}
        >
          {editingPlot ? t('walk_save_boundary') : t('walk_complete_geolocation')}
        </Button>
      ) : null}
      <View style={styles.buttonRow}>
        <View style={styles.buttonCell}>
          {isRecording ? (
            <Button variant="outline" onPress={handleCancelCornerSettling} fullWidth>
              {t('walk_corner_cancel_settling')}
            </Button>
          ) : (
            <Button
              variant="outline"
              onPress={handleUndoLastCorner}
              disabled={points.length === 0}
              fullWidth
            >
              {t('walk_undo_corner')}
            </Button>
          )}
        </View>
        <View style={styles.buttonCell}>
          <Button
            variant="ghost"
            onPress={reset}
            disabled={!points.length && !isRecording}
            fullWidth
          >
            {t('walk_corner_start_over')}
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
          <Pressable onPress={handleHeaderBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.headerTitleCompact}>
            {showCompletionPage
              ? t('walk_header_registration_complete')
              : showDetailedForm
              ? editingPlot
                ? t('walk_header_edit_boundary')
                : selectedMethodPage === 'walk'
                  ? t('walk_header_walk_my_plot')
                  : selectedMethodPage === 'draw'
                    ? t('walk_method_draw')
                    : selectedMethodPage === 'centroid'
                      ? t('walk_method_centroid')
                      : selectedMethodPage === 'pin'
                        ? t('walk_method_pin')
                      : t('walk_header_register_plot')
              : t('walk_header_register_plot')}
          </ThemedText>
          <View style={styles.headerTrailing}>
            {showDetailedForm && showCapturePage && (captureMethod === 'centroid' || captureMethod === 'draw') ? (
              <Pressable
                hitSlop={8}
                onPress={showCaptureInstructions}
                accessibilityRole="button"
                accessibilityLabel={t('walk_instructions_link')}
                style={styles.headerInstructionsButton}
              >
                <Ionicons name="help-circle-outline" size={20} color={colors.textInverse} />
              </Pressable>
            ) : null}
            <View style={styles.langPill}>
              <ThemedText type="caption" style={{ color: colors.textInverse }}>
                {String(lang).toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.bodyFlex}>
        <ThemedScrollView
          scrollEnabled={!mapScrollLock}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.container,
            isWalkLandingState && styles.containerLanding,
            walkActionsPinned && {
              paddingBottom:
                Math.max(insets.bottom, 12) + (alternateCaptureOpen ? 260 : 132),
            },
            drawActionsPinned && {
              paddingBottom: Math.max(insets.bottom, 12) + 148,
            },
            centroidActionsPinned && {
              paddingBottom: Math.max(insets.bottom, 12) + 120,
            },
          ]}
        >
        {!showDetailedForm ? (
          <>
            <View style={styles.plotLandingHero}>
              <View style={styles.plotLandingHeroIcon}>
                <Ionicons name="footsteps" size={28} color="#0A7F59" />
              </View>
              <ThemedText type="title" style={styles.plotLandingHeadline}>
                {t('walk_landing_headline')}
              </ThemedText>
              <ThemedText type="caption" style={styles.plotLandingSubhead}>
                {t('walk_landing_subhead')}
              </ThemedText>
            </View>

            <Card variant="elevated" style={styles.plotLandingCombinedCard}>
              <Input
                label={t('walk_plot_name_label')}
                placeholder={t('walk_plot_name_ph')}
                value={plotName}
                onChangeText={setPlotName}
              />
              {farmer?.name?.trim() ? (
                <ThemedText type="caption" style={styles.plotLandingFarmerHint}>
                  {t('plot_register_recording_as', { name: farmer.name.trim() })}
                </ThemedText>
              ) : null}

              <ThemedText type="defaultSemiBold" style={styles.plotLandingSizeLabel}>
                {t('walk_estimated_size')}
              </ThemedText>
              <View style={styles.sizePillRow}>
                <Pressable
                  testID="walk-size-lt4"
                  onPress={() => setEstimatedSize('lt4')}
                  style={[styles.sizePill, estimatedSize === 'lt4' && styles.sizePillSelected]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.sizePillLabel, estimatedSize === 'lt4' && styles.sizePillLabelSelected]}
                  >
                    {t('walk_size_under_4')}
                  </ThemedText>
                </Pressable>
                <Pressable
                  testID="walk-size-gte4"
                  onPress={() => setEstimatedSize('gte4')}
                  style={[styles.sizePill, estimatedSize === 'gte4' && styles.sizePillSelected]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.sizePillLabel, estimatedSize === 'gte4' && styles.sizePillLabelSelected]}
                  >
                    {t('walk_size_over_4')}
                  </ThemedText>
                </Pressable>
              </View>
              {estimatedSize ? (
                <ThemedText type="caption" style={styles.plotLandingSizeHint}>
                  {estimatedSize === 'lt4' ? t('walk_size_under_4_body') : t('walk_size_over_4_body')}
                </ThemedText>
              ) : null}

              <View style={styles.continueButtonWrap}>
                <Button
                  testID="walk-start-mapping"
                  variant="secondary"
                  style={{ backgroundColor: '#0A7F59' }}
                  fullWidth
                  disabled={!canContinueToCaptureMethod}
                  onPress={() => {
                    if (!plotName.trim()) {
                      setPlotName(defaultPlotName);
                    }
                    ensureMinimalFarmerForPlot();
                    setShowDetailedForm(true);
                    setCaptureMethod('walk');
                    setCaptureMode('walk');
                    setSelectedMethodPage('walk');
                  }}
                >
                  {t('walk_start_mapping')}
                </Button>
              </View>
            </Card>

            <PlotContiguityRuleCard t={t} />
          </>
        ) : null}

        {showDetailedForm ? (
        <Card variant="default" padding="none" style={[styles.card, styles.captureFlowCard]}>
          <CardContent>
            {showCompletionPage ? (
              <>
                {completionPhotosComplete ? (
                  <>
                    <View style={styles.completionHero}>
                      <View style={styles.completionIconWrap}>
                        <Ionicons name="checkmark-circle" size={64} color="#0A7F59" />
                      </View>
                      <ThemedText type="title" style={styles.completionTitle}>
                        {t('walk_completion_title')}
                      </ThemedText>
                      <ThemedText type="default" style={styles.completionBody}>
                        {t('walk_completion_body')}
                      </ThemedText>
                      <ThemedText type="defaultSemiBold" style={[styles.completionPlotName, { textAlign: 'center', marginTop: 10 }]}>
                        {(plotName || defaultPlotName).trim()} · {area.hectares > 0 ? `${area.hectares.toFixed(1)} ha` : t('walk_point_plot')}
                      </ThemedText>
                    </View>

                    {completedPlot ? (
                      <View style={{ marginTop: 8, marginBottom: 12 }}>
                        <GroundTruthPhotoCapture
                          plot={completedPlot}
                          photos={completionPhotos}
                          onPhotosChange={setCompletionPhotos}
                          t={t}
                          compact
                        />
                      </View>
                    ) : null}

                    <Card variant="outlined" style={styles.completionStatusCard}>
                      <ThemedText type="defaultSemiBold">{t('walk_completion_checklist')}</ThemedText>
                      <View style={styles.completionListRow}>
                        <View style={[styles.completionDot, { backgroundColor: '#0A7F59' }]} />
                        <ThemedText type="caption" style={styles.completionStatusTitle}>
                          {t('walk_completion_gps_polygon')}
                        </ThemedText>
                      </View>
                      <View style={styles.completionListRow}>
                        <View style={[styles.completionDot, { backgroundColor: '#0A7F59' }]} />
                        <ThemedText type="caption" style={styles.completionStatusTitle}>
                          {t('walk_completion_photos', { n: completionVerifiedPhotoCount })}
                        </ThemedText>
                      </View>
                      <View style={styles.completionListRow}>
                        <View
                          style={[
                            styles.completionDot,
                            { backgroundColor: isSyncSignedIn() ? '#0A7F59' : '#F59E0B' },
                          ]}
                        />
                        <ThemedText type="caption" style={styles.completionStatusTitle}>
                          {isSyncSignedIn() ? t('backup_up_to_date') : t('walk_completion_awaiting_backup')}
                        </ThemedText>
                      </View>
                    </Card>

                    <View style={{ marginTop: 12, gap: 8 }}>
                      <Button
                        variant="primary"
                        fullWidth
                        style={{ minHeight: 56 }}
                        onPress={() => {
                          const pid = lastRegisteredPlotIdRef.current;
                          setShowCompletionPage(false);
                          setShowDetailedForm(false);
                          setSelectedMethodPage(null);
                          reset();
                          setCompletionPhotos([]);
                          if (pid) {
                            router.replace(`/plot/${encodeURIComponent(pid)}?sub=documents`);
                            return;
                          }
                          router.replace('/(tabs)/explore');
                        }}
                      >
                        {t('walk_completion_add_land_papers')}
                      </Button>
                      <ThemedText type="caption" style={styles.completionLandHint}>
                        {t('walk_completion_land_papers_hint')}
                      </ThemedText>
                      <Button
                        variant="secondary"
                        fullWidth
                        onPress={() => {
                          const pid = lastRegisteredPlotIdRef.current;
                          setShowCompletionPage(false);
                          setShowDetailedForm(false);
                          setSelectedMethodPage(null);
                          reset();
                          setCompletionPhotos([]);
                          if (pid) {
                            router.replace(`/plot/${encodeURIComponent(pid)}`);
                            return;
                          }
                          router.replace('/(tabs)/explore');
                        }}
                      >
                        {t('walk_completion_view_plot')}
                      </Button>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.completionRequiredHeader}>
                      <View style={styles.completionHeroCompact}>
                        <Ionicons name="checkmark-circle" size={36} color="#0A7F59" />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold" style={styles.completionPlotName}>
                            {(plotName || defaultPlotName).trim()}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.completionBoundarySaved}>
                            {t('walk_completion_boundary_saved')}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.completionRequiredBanner}>
                        <Ionicons name="camera" size={22} color="#B45309" />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold" style={styles.completionRequiredTitle}>
                            {t('walk_completion_photos_required_title')}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.completionRequiredBody}>
                            {t('walk_completion_photos_required_body')}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    {completedPlot ? (
                      <GroundTruthPhotoCapture
                        plot={completedPlot}
                        photos={completionPhotos}
                        onPhotosChange={setCompletionPhotos}
                        t={t}
                        compact
                      />
                    ) : null}

                    <Pressable
                      onPress={() => {
                        const pid = lastRegisteredPlotIdRef.current;
                        setShowCompletionPage(false);
                        setShowDetailedForm(false);
                        setSelectedMethodPage(null);
                        reset();
                        setCompletionPhotos([]);
                        if (pid) {
                          router.replace(`/plot/${encodeURIComponent(pid)}`);
                          return;
                        }
                        router.replace('/(tabs)/explore');
                      }}
                      style={styles.completionSkipLink}
                    >
                      <ThemedText type="caption" style={styles.completionSkipLinkText}>
                        {t('walk_completion_skip_photos')}
                      </ThemedText>
                    </Pressable>
                  </>
                )}

                <Pressable
                  onPress={() => {
                    setShowCompletionPage(false);
                    setShowDetailedForm(false);
                    setSelectedMethodPage(null);
                    reset();
                    setPlotName(defaultPlotName);
                    setCaptureMethod('walk');
                    setCaptureMode('walk');
                    setSelectedMethodPage('walk');
                    setShowDetailedForm(true);
                  }}
                  style={styles.completionSecondaryLink}
                >
                  <ThemedText type="defaultSemiBold" style={styles.completionSecondaryLinkText}>
                    {t('walk_register_another')}
                  </ThemedText>
                </Pressable>
              </>
            ) : showCapturePage && captureMethod === 'walk' ? (
              <>
                <Pressable
                  onPress={showCaptureInstructions}
                  accessibilityRole="button"
                  accessibilityLabel={t('walk_instructions_link')}
                  accessibilityHint={t('walk_instructions_preview')}
                  style={({ pressed }) => [
                    styles.walkInstructionsLink,
                    pressed && styles.walkInstructionsLinkPressed,
                  ]}
                >
                  <ThemedText type="defaultSemiBold" style={styles.walkInstructionsLinkText}>
                    {t('walk_instructions_link')}
                  </ThemedText>
                  <Ionicons name="chevron-down-circle-outline" size={20} color="#0A7F59" />
                </Pressable>

                <View
                  style={[styles.walkMapPanel, { minHeight: walkMapHeight }]}
                  onTouchStart={() => setMapScrollLock(true)}
                  onTouchEnd={() => setMapScrollLock(false)}
                  onTouchCancel={() => setMapScrollLock(false)}
                >
                  <MapView
                    ref={walkMapRef}
                    style={[styles.walkMap, { height: walkMapHeight - 8 }]}
                    initialRegion={mapAnchorRegion}
                    {...FIELD_MAP_CAPTURE_UI_PROPS}
                    mapType={fieldMapUsesCustomTiles(walkMapTileMode) ? 'none' : 'standard'}
                  >
                    <FieldMapLayers
                      lowDataMap={walkMapTileMode === 'none'}
                      offlineTilesEnabled={walkMapTileMode === 'offline'}
                      offlineTilesPackId={activeMapPackId}
                    />
                    <PlotBoundaryOverlays
                      vertices={points}
                      liveTrail={liveWalkTrail}
                      userPosition={previewPosition}
                      isRecording={isRecording}
                      showYouMarker
                      showStartMarker={points.length > 0}
                      youMarkerFollowsPosition={isRecording}
                    />
                  </MapView>
                  {isRecording ? (
                    <View style={styles.recordingMapBadge} pointerEvents="none">
                      <Animated.View
                        style={[styles.recordingMapPulse, { transform: [{ scale: recordingPulse }] }]}
                      />
                      <View style={styles.recordingMapDot} />
                      <ThemedText type="caption" style={styles.recordingMapLabel}>
                        {t('walk_recording')}
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={styles.coordChip}>
                    <ThemedText type="caption">
                      {formatLatLon(mapCoordDisplay.latitude, mapCoordDisplay.longitude)}
                    </ThemedText>
                  </View>
                </View>

                {!isWalkLandingState ? (
                <View style={styles.walkStatsRow}>
                  <View style={styles.walkStatCard}>
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                    <ThemedText type="subtitle" style={styles.walkStatValue}>
                      {formatTime(recordingSeconds)}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.walkStatLabel}>
                      {t('walk_time')}
                    </ThemedText>
                  </View>
                  <View style={styles.walkStatCard}>
                    <Ionicons name="leaf-outline" size={20} color="#0F8A64" />
                    <ThemedText type="subtitle" style={styles.walkStatValue}>
                      {area.hectares > 0 ? area.hectares.toFixed(1) : '0.0'}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.walkStatLabel}>
                      {t('walk_area')}
                    </ThemedText>
                  </View>
                  <View style={styles.walkStatCard}>
                    <Ionicons
                      name="locate-outline"
                      size={20}
                      color={gpsStrengthColor}
                    />
                    <ThemedText type="subtitle" style={styles.walkStatValue}>
                      {gpsStrengthLabel}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.walkStatLabel}>
                      {t('walk_gps_signal')}
                    </ThemedText>
                  </View>
                </View>
                ) : null}

                {!isRecording && points.length >= 3 ? renderGeometryConfidenceBanner() : null}
              </>
            ) : showCapturePage && captureMethod === 'draw' ? (
              <>
                <View
                  style={[styles.walkMapPanel, { minHeight: drawMapHeight }]}
                  onTouchStart={() => setMapScrollLock(true)}
                  onTouchEnd={() => setMapScrollLock(false)}
                  onTouchCancel={() => setMapScrollLock(false)}
                >
                  <MapView
                    ref={drawMapRef}
                    style={[styles.walkMap, { height: drawMapHeight - 8 }]}
                    initialRegion={mapAnchorRegion}
                    {...FIELD_MAP_CAPTURE_UI_PROPS}
                    mapType={fieldMapUsesCustomTiles(walkMapTileMode) ? 'none' : 'standard'}
                    moveOnMarkerPress={false}
                    onPress={(e) => {
                      if (!drawTracingActive) return;
                      const c = e.nativeEvent.coordinate;
                      addManualVertex(c.latitude, c.longitude);
                    }}
                  >
                    <FieldMapLayers
                      lowDataMap={walkMapTileMode === 'none'}
                      offlineTilesEnabled={walkMapTileMode === 'offline'}
                      offlineTilesPackId={activeMapPackId}
                    />
                    <PlotBoundaryOverlays
                      vertices={points}
                      userPosition={previewPosition}
                      showYouMarker={!drawTracingActive}
                      showStartMarker={points.length > 0}
                      showVertexMarkers={drawTracingActive}
                      strokeOnlyBoundary={drawTracingActive}
                      closeStrokeRing={false}
                    />
                  </MapView>
                  <View style={styles.mapGpsPill} pointerEvents="none">
                    <View style={[styles.mapGpsDot, { backgroundColor: gpsStrengthColor }]} />
                    <ThemedText type="caption" style={styles.mapGpsPillText}>
                      {gpsStrengthLabel}
                    </ThemedText>
                  </View>
                  {drawTracingActive && points.length > 0 ? (
                    <View style={styles.cornerCountChip} pointerEvents="none">
                      <ThemedText type="caption" style={styles.cornerCountChipText}>
                        {t('walk_corners_saved', { n: points.length })}
                        {area.hectares > 0 ? ` · ${area.hectares.toFixed(2)} ha` : ''}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>

                {points.length >= 3 ? renderGeometryConfidenceBanner() : null}
              </>
            ) : showCapturePage && captureMethod === 'pin' ? (
              <>
                <ThemedText type="caption" style={styles.pinModeHint}>
                  {t('walk_pin_mode_hint')}
                </ThemedText>

                <Input
                  label={t('walk_pin_declared_area_label')}
                  placeholder={t('walk_declared_area_ph')}
                  keyboardType="decimal-pad"
                  value={declaredAreaHaInput}
                  onChangeText={setDeclaredAreaHaInput}
                  containerStyle={{ marginTop: 4 }}
                />

                <View
                  style={[styles.walkMapPanel, { minHeight: 220, marginTop: 10 }]}
                  onTouchStart={() => setMapScrollLock(true)}
                  onTouchEnd={() => setMapScrollLock(false)}
                  onTouchCancel={() => setMapScrollLock(false)}
                >
                  <MapView
                    style={[styles.walkMap, { height: 212 }]}
                    initialRegion={mapAnchorRegion}
                    {...FIELD_MAP_CAPTURE_UI_PROPS}
                    mapType={fieldMapUsesCustomTiles(walkMapTileMode) ? 'none' : 'standard'}
                  >
                    <FieldMapLayers
                      lowDataMap={walkMapTileMode === 'none'}
                      offlineTilesEnabled={walkMapTileMode === 'offline'}
                      offlineTilesPackId={activeMapPackId}
                    />
                    <PlotBoundaryOverlays
                      vertices={points}
                      userPosition={previewPosition}
                      showYouMarker
                      showStartMarker={points.length > 0}
                    />
                  </MapView>
                </View>

                <View style={styles.gpsStrip}>
                  <View style={[styles.gpsStripDot, { backgroundColor: gpsStrengthColor }]} />
                  <ThemedText type="defaultSemiBold" style={styles.gpsStripLabel}>
                    {t('walk_gps_signal')}: {gpsStrengthLabel}
                  </ThemedText>
                </View>

                {isRecording ? (
                  <View style={styles.averagingTrackWrap}>
                    <View style={styles.averagingTrackCompact}>
                      <View
                        style={[
                          styles.averagingFillCompact,
                          { width: `${Math.max(pinHoldPercent, 2)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ) : null}

                {!isRecording && points.length >= 1 ? renderGeometryConfidenceBanner() : null}

                <View style={{ marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    style={{ backgroundColor: '#0A7F59' }}
                    icon={
                      <Ionicons
                        name={isRecording ? 'hourglass-outline' : 'location'}
                        size={20}
                        color="#FFFFFF"
                      />
                    }
                    onPress={handlePinCapturePress}
                    fullWidth
                    disabled={isRecording && pinHoldPercent < 100}
                  >
                    {isRecording
                      ? pinHoldPercent >= 100
                        ? t('walk_pin_confirm')
                        : t('walk_pin_hold_progress', { seconds: pinHoldSecondsRemaining })
                      : t('walk_pin_save')}
                  </Button>
                </View>
              </>
            ) : showCapturePage && captureMethod === 'centroid' ? (
              <>
                <View
                  style={[styles.walkMapPanel, { minHeight: cornerMapHeight }]}
                  onTouchStart={() => setMapScrollLock(true)}
                  onTouchEnd={() => setMapScrollLock(false)}
                  onTouchCancel={() => setMapScrollLock(false)}
                >
                  <MapView
                    style={[styles.walkMap, { height: Math.max(200, cornerMapHeight - 8) }]}
                    initialRegion={mapAnchorRegion}
                    {...FIELD_MAP_CAPTURE_UI_PROPS}
                    mapType={fieldMapUsesCustomTiles(walkMapTileMode) ? 'none' : 'standard'}
                    moveOnMarkerPress={false}
                    onPress={() => {
                      if (!cornerSaveReady) return;
                      handleSaveCorner();
                    }}
                  >
                    <FieldMapLayers
                      lowDataMap={walkMapTileMode === 'none'}
                      offlineTilesEnabled={walkMapTileMode === 'offline'}
                      offlineTilesPackId={activeMapPackId}
                    />
                    <PlotBoundaryOverlays
                      vertices={points}
                      userPosition={userMapPosition}
                      isRecording={isRecording}
                      showYouMarker
                      youMarkerFollowsPosition={isRecording}
                      showStartMarker={false}
                      showVertexMarkers
                      strokeOnlyBoundary
                      closeStrokeRing={false}
                    />
                  </MapView>
                  {isRecording ? (
                    <CornerMapOverlay
                      phase={cornerCapturePhase}
                      secondsRemaining={cornerHoldSecondsRemaining}
                      t={t}
                    />
                  ) : null}
                  <View style={styles.mapGpsPill} pointerEvents="none">
                    <View style={[styles.mapGpsDot, { backgroundColor: gpsStrengthColor }]} />
                    <ThemedText type="caption" style={styles.mapGpsPillText}>
                      {gpsStrengthLabel}
                    </ThemedText>
                  </View>
                  <View style={styles.cornerCountChip} pointerEvents="none">
                    <ThemedText type="caption" style={styles.cornerCountChipText} testID="walk-corners-saved-count">
                      {cornerProgress.shapeReady
                        ? t('walk_corner_progress_ready', { n: points.length })
                        : points.length > 0
                          ? t('walk_corner_progress_chip', {
                              n: points.length,
                              remaining: cornerProgress.remainingToClose,
                            })
                          : t('walk_corner_map_empty')}
                      {area.hectares > 0 ? ` · ${area.hectares.toFixed(2)} ha` : ''}
                    </ThemedText>
                  </View>
                </View>

                {points.length >= 3 ? renderGeometryConfidenceBanner() : null}
              </>
            ) : null}

            {showCapturePage && isWalkCaptureMode && !walkActionsPinned ? renderWalkCaptureActions() : null}

            {showCapturePage && captureMethod === 'centroid' && !centroidActionsPinned
              ? renderCornerCaptureActions()
              : null}

            {showCapturePage && captureMethod === 'draw' && !drawActionsPinned
              ? renderDrawCaptureActions()
              : null}

            {!isWalkLandingState && showCapturePage && isRecording && captureMethod !== 'walk' && captureMethod !== 'pin' && captureMethod !== 'centroid' ? (
              <View style={styles.statsGrid}>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    {t('walk_time')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {formatTime(recordingSeconds)}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    {t(boundaryPointsStatLabelKey)}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {boundaryPointCount}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    {t('walk_precision')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {precisionMeters != null ? `${precisionMeters.toFixed(0)}m` : '—'}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    {t('walk_area')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {area.hectares > 0 ? `${area.hectares.toFixed(2)}ha` : '—'}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && estimatedSize === 'lt4' && captureMethod !== 'walk' && captureMethod !== 'pin' ? (
              <View style={{ marginTop: 8 }}>
                <Button
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    if (editingPlot) {
                      handleSavePointPlot();
                      return;
                    }
                    handleSavePointPlot({ shortPath: true });
                  }}
                  disabled={!canSavePointPlot}
                >
                  {editingPlot
                    ? t('walk_save_point')
                    : captureMethod === 'centroid'
                      ? t('walk_complete_geolocation')
                      : t('walk_complete_as_point')}
                </Button>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && captureMethod !== 'walk' && captureMethod !== 'pin' ? (
              <Input
                label={t('walk_declared_area_label')}
                placeholder={t('walk_declared_area_ph')}
                keyboardType="decimal-pad"
                value={declaredAreaHaInput}
                onChangeText={setDeclaredAreaHaInput}
                containerStyle={{ marginTop: 12 }}
              />
            ) : null}

            {!isWalkLandingState && showCapturePage && lastError ? (
              <ThemedText type="subtitle">
                {lastError === 'location_denied' ? t('walk_location_denied') : lastError}
              </ThemedText>
            ) : null}

            {!isWalkLandingState && showCapturePage && (captureMethod === 'centroid' || captureMethod === 'draw') ? (
              <View style={{ marginTop: 10 }}>
                <Checkbox
                  checked={lowDataMap}
                  onChange={setLowDataMap}
                  label={lowDataMap ? t('walk_low_data_on') : t('walk_low_data_off')}
                  description={t('walk_low_data_desc')}
                />
              </View>
            ) : null}
          </CardContent>
        </Card>
        ) : null}
      </ThemedScrollView>
        {(walkActionsPinned || centroidActionsPinned || drawActionsPinned) ? (
          <View
            style={[
              styles.walkPinnedFooter,
              alternateCaptureOpen && styles.walkPinnedFooterExpanded,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {walkActionsPinned ? renderWalkCaptureActions() : null}
            {centroidActionsPinned ? renderCornerCaptureActions() : null}
            {drawActionsPinned ? renderDrawCaptureActions() : null}
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bodyFlex: {
    flex: 1,
  },
  walkPinnedFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  walkPinnedFooterExpanded: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 2,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 78,
  },
  headerTitleCompact: {
    color: '#FFFFFF',
    fontSize: scaleText(18),
    lineHeight: scaleText(24),
    flexGrow: 1,
    flexShrink: 1,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(242, 201, 76, 0.22)',
  },
  statusPillText: {
    color: '#F2C94C',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    minWidth: 54,
    justifyContent: 'center',
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerInstructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    maxWidth: 120,
  },
  headerInstructionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#9FE6C9',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  containerLanding: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  card: {
    marginTop: 2,
  },
  captureFlowCard: {
    borderWidth: 0,
    borderColor: 'transparent',
    paddingTop: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginTop: 0,
  },
  instructionsRow: {
    alignItems: 'flex-end',
    marginBottom: -2,
  },
  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E6F7EF',
    borderWidth: 1,
    borderColor: '#B7E7D7',
  },
  instructionsButtonText: {
    color: '#0A7F59',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  captureMethodsSection: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  captureMethodsIntro: {
    fontSize: scaleText(18),
    lineHeight: scaleText(28),
    color: '#4B4B4B',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  buttonCell: {
    flex: 1,
  },
  list: {
    marginTop: 12,
  },
  mapContainer: {
    marginTop: 12,
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  rowCard: {
    padding: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  statChip: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(56,161,105,0.10)',
  },
  statLabel: {
    opacity: 0.9,
    color: Brand.primary,
  },
  statValue: {
    marginTop: 2,
    color: Brand.primaryDark,
  },
  gpsWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(221,107,32,0.10)',
    borderColor: 'rgba(221,107,32,0.25)',
  },
  gpsSignalCard: {
    borderRadius: 18,
    borderColor: '#B7E7D7',
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
  },
  gpsSignalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsSignalBadge: {
    backgroundColor: '#9FE6C9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  gpsSignalBadgeText: {
    color: '#0B6E4F',
    fontWeight: '700',
  },
  gpsSignalMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 12,
  },
  gpsSignalMetaCell: {
    flex: 1,
  },
  gpsMetaLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  declarationsIntroCard: {
    borderRadius: 20,
    borderColor: '#EACB86',
    backgroundColor: '#F7F2E6',
    marginTop: 2,
  },
  registrationIntroCard: {
    borderRadius: 20,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
    marginTop: 2,
  },
  declarationsIntroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  declarationsIntroTitle: {
    color: '#7B4B12',
  },
  declarationsIntroBody: {
    marginTop: 4,
    color: '#9A5F1A',
    fontSize: 13,
    lineHeight: 20,
  },
  declarationItemCard: {
    borderWidth: 1,
    borderColor: '#D5D9DD',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  declarationItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  declarationItemContent: {
    flex: 1,
  },
  declarationItemBody: {
    marginTop: 2,
    color: '#5F6670',
    fontSize: 13,
    lineHeight: 20,
  },
  declarationNoteCard: {
    borderWidth: 1,
    borderColor: '#D8DCE1',
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    marginTop: 8,
  },
  declarationNoteText: {
    color: '#5D6672',
  },
  photoGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoSlot: {
    width: '48.5%',
    minHeight: 156,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D2D2D2',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlotCaptured: {
    borderColor: '#10B981',
    backgroundColor: '#DFF5EC',
  },
  photoPreview: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  photoCapturedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFFE8',
    borderRadius: 999,
    padding: 2,
  },
  photoSlotTitle: {
    color: '#616161',
  },
  photoSlotTitleCaptured: {
    color: '#0B5D48',
  },
  photoSlotHint: {
    color: '#949494',
  },
  photoActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  completionLandHint: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 4,
  },
  completionHero: {
    alignItems: 'center',
    marginTop: 8,
  },
  completionHeroCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  completionRequiredHeader: {
    gap: 10,
    marginBottom: 8,
  },
  completionBoundarySaved: {
    color: '#0A7F59',
    marginTop: 2,
  },
  completionRequiredBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  completionRequiredTitle: {
    color: '#92400E',
  },
  completionRequiredBody: {
    marginTop: 4,
    color: '#78350F',
    lineHeight: 18,
  },
  completionSkipLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  completionSkipLinkText: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  completionIconWrap: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    marginTop: 16,
    color: '#121212',
  },
  completionBody: {
    marginTop: 8,
    textAlign: 'center',
    color: '#5D6672',
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 26 / 1.35,
  },
  completionPlotName: {
    marginTop: 0,
    color: '#0B4F3B',
    textAlign: 'left',
  },
  completionSecondaryLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  completionSecondaryLinkText: {
    color: '#0A7F59',
    fontSize: 15,
  },
  completionFinishLater: {
    marginTop: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  completionChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  completionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7E7D7',
    backgroundColor: '#F0FAF5',
  },
  completionChipText: {
    color: '#0A7F59',
    fontWeight: '600',
  },
  completionStatusCard: {
    marginTop: 14,
    borderRadius: 18,
    borderColor: '#D5D9DD',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  completionStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  completionStatusTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#3A3A3A',
  },
  pendingReviewPill: {
    backgroundColor: '#F8EBC8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 4,
    flexShrink: 0,
  },
  pendingReviewText: {
    color: '#A35F00',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },
  completionListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  walkMapPanel: {
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#B8CBC5',
    minHeight: 248,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  walkMap: {
    width: '100%',
    height: 206,
  },
  walkMapPlaceholder: {
    width: '100%',
    height: 206,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8CBC5',
  },
  coordChip: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: '#FFFFFFE8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  walkStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  walkStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4D8DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  walkStatCardCompact: {
    minHeight: 72,
  },
  walkInstructionsLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 2,
  },
  walkInstructionsLinkText: {
    color: '#0A7F59',
  },
  walkInstructionsLinkPressed: {
    opacity: 0.72,
  },
  walkGuideStrip: {
    gap: 8,
    marginBottom: 8,
  },
  walkGuideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  walkGuideTitle: {
    color: '#065F46',
    flex: 1,
  },
  walkGuideRecordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walkGuideRecordingText: {
    flex: 1,
    color: '#065F46',
    lineHeight: 20,
  },
  walkGuideWaitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  walkGuideWaitText: {
    flex: 1,
    color: '#92400E',
    lineHeight: 18,
  },
  walkGuideInlineTip: {
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  walkMapTopTip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  walkMapTopTipText: {
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  walkInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  walkInstructionText: {
    flex: 1,
    color: '#374151',
    lineHeight: 18,
  },
  alternateCapturePanel: {
    marginTop: 2,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  alternateCaptureIntro: {
    color: '#6B7280',
    marginBottom: 4,
  },
  alternateCaptureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  alternateCaptureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  alternateCaptureFallback: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  walkStatValue: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 20,
  },
  walkStatLabel: {
    color: '#5F6670',
    fontSize: 11,
    lineHeight: 16,
  },
  averagingCard: {
    marginTop: 10,
    borderRadius: 18,
    borderColor: '#D5D9DD',
    backgroundColor: '#FFFFFF',
  },
  averagingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  averagingTitle: {
    color: '#4A4340',
    fontSize: 16 / 1.05,
    lineHeight: 28,
  },
  averagingPercent: {
    color: '#0A8B63',
    fontSize: 18 / 1.1,
    lineHeight: 28 / 1.1,
  },
  averagingTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#ECECEE',
    overflow: 'hidden',
    marginTop: 8,
  },
  averagingFill: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#0CB67A',
  },
  averagingBody: {
    marginTop: 10,
    color: '#6A6360',
    fontSize: 13,
    lineHeight: 20,
  },
  drawInfoCard: {
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  manualTraceOfflineHint: {
    marginTop: 8,
    color: '#065F46',
    lineHeight: 18,
  },
  cornerModeIntro: {
    color: '#4B5563',
    lineHeight: 18,
  },
  cornerCompactStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cornerHintCard: {
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  cornerHoldLabel: {
    textAlign: 'center',
    color: '#6B7280',
  },
  cornerCountLabel: {
    textAlign: 'center',
    color: '#0A7F59',
    fontWeight: '600',
  },
  drawMapPanel: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8FDCC2',
    borderStyle: 'dashed',
    backgroundColor: '#BDD1C8',
    minHeight: 330,
    position: 'relative',
  },
  drawMap: {
    width: '100%',
    height: 330,
  },
  drawMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(189,209,200,0.84)',
  },
  drawChip: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: '#FFFFFFE8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gpsInfoCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.18)',
  },
  plotRegistrationCard: {
    marginTop: 8,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
    borderRadius: 16,
    padding: 12,
  },
  plotLandingCombinedCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    gap: 4,
  },
  plotLandingHero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  plotLandingHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E9F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  plotLandingHeadline: {
    textAlign: 'center',
    color: '#0F172A',
    fontSize: scaleText(22),
  },
  plotLandingSubhead: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: scaleText(20),
    maxWidth: 300,
  },
  plotLandingIntro: {
    color: '#4B5563',
    fontSize: scaleText(14),
    lineHeight: scaleText(20),
  },
  plotLandingFarmerHint: {
    marginTop: 6,
    color: '#9CA3AF',
  },
  plotLandingSizeLabel: {
    color: '#0F172A',
    marginTop: 16,
  },
  plotLandingSizeHint: {
    marginTop: 8,
    color: '#6B7280',
    lineHeight: scaleText(18),
  },
  sizePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sizePill: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  sizePillSelected: {
    borderColor: '#0A7F59',
    backgroundColor: '#ECF8F2',
  },
  sizePillLabel: {
    color: '#374151',
    fontSize: scaleText(15),
  },
  sizePillLabelSelected: {
    color: '#0A7F59',
  },
  gpsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gpsStripDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  gpsStripLabel: {
    flex: 1,
    color: '#111827',
  },
  walkTipText: {
    textAlign: 'center',
    color: '#4B5563',
    fontSize: scaleText(14),
    lineHeight: scaleText(20),
  },
  walkRecordingTip: {
    textAlign: 'center',
    color: '#0A7F59',
    fontSize: scaleText(15),
    lineHeight: scaleText(22),
    fontWeight: '600',
    marginTop: 4,
  },
  gpsWaitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  gpsWaitBannerText: {
    flex: 1,
    color: '#92400E',
    lineHeight: 18,
  },
  recordingMapBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE8',
  },
  recordingMapPulse: {
    position: 'absolute',
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
  },
  recordingMapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  recordingMapLabel: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },
  mapGpsPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  mapGpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cornerCountChip: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  cornerCountChipText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  mapGpsPillText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  walkCaptureHint: {
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  walkStepsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  walkStepChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walkStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#E6F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkStepNumberText: {
    color: '#0A7F59',
    fontWeight: '700',
    fontSize: 11,
  },
  walkStepLabel: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  averagingTrackWrap: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 10,
  },
  averagingTrackCompact: {
    width: '100%',
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  averagingFillCompact: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#0CB67A',
  },
  otherWaysLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  otherWaysLinkText: {
    color: '#6B7280',
  },
  plotRegistrationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D5D9DD',
    borderRadius: 14,
    padding: 12,
    minHeight: 112,
    backgroundColor: '#FFFFFF',
  },
  sizeCardSelected: {
    borderColor: '#76D5B6',
    backgroundColor: '#ECF8F2',
  },
  contiguityCard: {
    marginTop: 2,
    borderColor: '#C9D9EE',
    backgroundColor: '#EAF1FB',
    borderRadius: 16,
    padding: 14,
  },
  contiguityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  continueButtonWrap: {
    marginTop: 4,
  },
  captureCard: {
    borderWidth: 1,
    borderColor: '#DCDDDF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  captureCardSelected: {
    borderColor: '#7DDDC2',
    backgroundColor: '#FFFFFF',
  },
  captureIconPillWalk: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E9F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  captureIconPillDraw: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#DCE7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  captureIconPillCentroid: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EADFF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  captureIconPillPin: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pinModeHint: {
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  captureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: 8,
  },
  captureTitleText: {
    fontSize: scaleText(18),
    lineHeight: scaleText(24),
    color: '#171717',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 108,
  },
  captureBodyText: {
    marginTop: 6,
    fontSize: scaleText(14),
    lineHeight: scaleText(20),
    color: '#55514E',
  },
  recommendedPill: {
    backgroundColor: '#CDEEDD',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginRight: 12,
    minWidth: 118,
    flexShrink: 0,
  },
  recommendedPillText: {
    color: '#157E64',
    fontWeight: '700',
    fontSize: scaleText(12),
  },
  fallbackPill: {
    backgroundColor: '#F7E7B7',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginRight: 12,
    minWidth: 0,
    flexShrink: 0,
  },
  fallbackPillText: {
    color: '#A85900',
    fontWeight: '700',
    fontSize: scaleText(12),
  },
  captureChevron: {
    marginLeft: 'auto',
  },
  commodityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  commodityChipSelected: {
    backgroundColor: '#0A7F59',
    borderColor: '#0A7F59',
  },
});

