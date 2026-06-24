import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert, Animated, BackHandler, Pressable, useWindowDimensions, View } from 'react-native';
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
import { buildGeometryFromLocalPlot, postPlotToBackend, type PostPlotToBackendResult } from '@/features/api/postPlot';
import { useWalkPerimeter } from './useWalkPerimeter';
import {
  clearMappingDraftAfterPlotSave,
  useMappingDraftCloudSync,
} from '@/features/mapping/useMappingDraftCloudSync';
import { alertLocationPermissionDenied } from '@/features/permissions/locationPermission';
import { useAppState } from '@/features/state/AppStateContext';
import type { Plot } from '@/features/state/AppStateContext';
import { mapPlotUploadErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';
import { resolveClientPlotId } from '@/features/plots/clientPlotId';
import { isSyncSignedIn } from '@/features/auth/signInSync';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { useEnumerationOptional } from '@/features/enumeration/EnumerationContext';
import { resolveCaptureIntent } from '@/features/enumeration/resolveCaptureIntent';
import { EnumerationActiveMemberBanner } from '@/components/enumeration/EnumerationActiveMemberBanner';
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
import { CaptureInstructionsLink } from '@/components/mapping/CaptureInstructionsLink';
import { PlotContiguityRuleCard } from '@/components/mapping/PlotContiguityRuleCard';
import { SecondPlotOverlapTip } from '@/components/mapping/SecondPlotOverlapTip';
import {
  SECOND_PLOT_OVERLAP_TIP_DISMISSED_KEY,
  shouldShowSecondPlotOverlapTip,
} from '@/features/mapping/secondPlotOverlapTip';
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
import { HEADER_GRADIENT_COLORS, HEADER_GRADIENT_TEXT } from '@/constants/compactTabHeader';
import { scaleText } from '@/features/demo/storeUiScale';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createWalkPerimeterScreenStyles } from '@/features/mapping/walkPerimeterScreenStyles';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  assessPlotGeometryQuality,
  localPlotRefsForGeometry,
  localPolygonQualityMessage,
  type LocalGeometryQualityIssue,
} from '@/features/compliance/plotGeometryQuality';
import {
  hasUnsavedMappingProgress,
  runWithMappingDiscardConfirm,
} from '@/features/mapping/mappingDiscardConfirm';
import {
  isWalkStartGateReady,
  isWeakGpsForWalkCoach,
  resolveWalkLiveHint,
  shouldSuggestAlternateCapture,
  walkStartGateSecondsRemaining,
  WALK_CAPTURE_POOR_GPS_M,
  type WalkCoachHintTone,
} from '@/features/mapping/walkCaptureCoaching';
import {
  hasDuplicatePlotName,
  proposeUniqueDefaultPlotName,
} from '@/features/plots/plotNameValidation';
import {
  canConfirmCornerSave,
  CORNER_CAPTURE_HOLD_SECONDS,
  resolveCornerCaptureLiveMessage,
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

function promptBlockingPlotGeometryIssues(params: {
  blockingIssues: LocalGeometryQualityIssue[];
  t: (key: string) => string;
  onWalkAgain: () => void;
  onTraceOnMap: () => void;
}): boolean {
  const { blockingIssues, t, onWalkAgain, onTraceOnMap } = params;
  const message = localPolygonQualityMessage(blockingIssues, t);
  const title = geometryQualityAlertTitle(blockingIssues, t);
  const recoverable = blockingIssues.some(
    (issue) => issue.code === 'GEO-104' || issue.code === 'GEO-105',
  );

  if (!recoverable) {
    Alert.alert(title, message);
    return true;
  }

  Alert.alert(title, message, [
    { text: t('cancel'), style: 'cancel' },
    { text: t('walk_geometry_walk_again'), onPress: onWalkAgain },
    { text: t('walk_geo_confidence_cta_trace'), onPress: onTraceOnMap },
  ]);
  return true;
}

type CaptureMethod = 'walk' | 'draw' | 'centroid' | 'pin';
type CaptureMethodPage = CaptureMethod;

export function WalkPerimeterScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useThemedStyles((c) => createWalkPerimeterScreenStyles(c));
  const { t, lang } = useLanguage();
  const onLocationDenied = useCallback(() => alertLocationPermissionDenied(t), [t]);
  const {
    points,
    samples,
    area,
    precisionMeters,
    lastSpeedMps,
    gpsFixDropped,
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
  const { farmer, setFarmer, plots, addPlot, updatePlot, isAppReady } = useAppState();
  const { openSignIn } = useSignInSheet();
  const enumeration = useEnumerationOptional();
  const params = useLocalSearchParams<{ editPlotId?: string }>();
  const editPlotId = typeof params.editPlotId === 'string' ? params.editPlotId : undefined;
  const editingPlot = useMemo(
    () => (editPlotId ? plots.find((p) => p.id === editPlotId) : undefined),
    [editPlotId, plots],
  );

  useEffect(() => {
    if (!enumeration?.isEnumerationMode || editPlotId || enumeration.activeMember) return;
    Alert.alert(
      t('enumeration_no_active_member_title'),
      t('enumeration_no_active_member_body'),
      [{ text: t('close'), onPress: () => router.back() }],
    );
  }, [editPlotId, enumeration?.activeMember, enumeration?.isEnumerationMode, t]);
  const editInitDone = useRef<string | null>(null);
  const [farmerIdInput, setFarmerIdInput] = useState(farmer?.id ?? '');
  const [farmerNameInput, setFarmerNameInput] = useState(farmer?.name ?? '');
  const [declaredAreaHaInput, setDeclaredAreaHaInput] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [plotName, setPlotName] = useState('');
  const [plotNameTouched, setPlotNameTouched] = useState(false);
  const [plotLandingNameReady, setPlotLandingNameReady] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<'lt4' | 'gte4' | null>('lt4');
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [selectedMethodPage, setSelectedMethodPage] = useState<CaptureMethodPage | null>(null);
  const [showCompletionPage, setShowCompletionPage] = useState(false);
  const lastRegisteredPlotIdRef = useRef<string | null>(null);
  const lastSavedPlotRef = useRef<Plot | null>(null);
  const [completionPhotos, setCompletionPhotos] = useState<PlotPhoto[]>([]);
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>('walk');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cornerHoldAnchor, setCornerHoldAnchor] = useState(0);
  const [pinHoldAnchor, setPinHoldAnchor] = useState(0);
  const wasRecordingRef = useRef(false);
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
  const [gpsStableSeconds, setGpsStableSeconds] = useState(0);
  const [walkStartGateOverride, setWalkStartGateOverride] = useState(false);
  const [weakGpsWalkSeconds, setWeakGpsWalkSeconds] = useState(0);
  const alternateCaptureSuggestedRef = useRef(false);

  useMappingDraftCloudSync({
    farmerId: farmer?.id,
    editPlotId,
    plotName,
    captureMethod,
    isRecording,
    drawTracingActive,
    points,
    replacePointsFromPlot,
    t,
    enabled: isAppReady,
  });

  const [suppressBoundaryOverlays, setSuppressBoundaryOverlays] = useState(false);
  const [boundaryOverlayEpoch, setBoundaryOverlayEpoch] = useState(0);
  const walkMapRef = useRef<MapView>(null);
  const drawMapRef = useRef<MapView>(null);
  const lastMapAnimateAtRef = useRef(0);
  const previewWatchRef = useRef<Location.LocationSubscription | null>(null);
  const [previewPosition, setPreviewPosition] = useState<MapCoordinate | null>(null);
  const [previewPrecisionMeters, setPreviewPrecisionMeters] = useState<number | null>(null);
  const [secondPlotOverlapTipDismissed, setSecondPlotOverlapTipDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getSetting(SECOND_PLOT_OVERLAP_TIP_DISMISSED_KEY)
      .then((value) => {
        if (!cancelled) {
          setSecondPlotOverlapTipDismissed(value === '1');
        }
      })
      .catch(() => {
        if (!cancelled) setSecondPlotOverlapTipDismissed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissSecondPlotOverlapTip = useCallback(() => {
    setSecondPlotOverlapTipDismissed(true);
    void setSetting(SECOND_PLOT_OVERLAP_TIP_DISMISSED_KEY, '1');
  }, []);

  const showSecondPlotOverlapTip = useMemo(
    () =>
      shouldShowSecondPlotOverlapTip({
        existingPlotCount: plots.length,
        isEditingPlot: Boolean(editPlotId),
        dismissed: secondPlotOverlapTipDismissed,
      }),
    [editPlotId, plots.length, secondPlotOverlapTipDismissed],
  );

  const firstExistingPlotName = plots[0]?.name?.trim() || t('geo_quality_overlap_unknown');

  useEffect(() => {
    if (!farmer?.id) return;
    setFarmerIdInput(farmer.id);
    setFarmerNameInput(farmer.name ?? '');
  }, [farmer?.id, farmer?.name]);

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
    const timer = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const showCapturePageEarly = !showCompletionPage;
  const isWalkCaptureModeEarly = captureMethod === 'walk' && selectedMethodPage === 'walk';

  useEffect(() => {
    if (!showCapturePageEarly || !isWalkCaptureModeEarly || isRecording) {
      setGpsStableSeconds(0);
      return;
    }
    const tick = setInterval(() => {
      const preview = previewPrecisionMeters ?? precisionMeters;
      if (preview != null && preview <= 10) {
        setGpsStableSeconds((seconds) => Math.min(seconds + 1, 6));
      } else {
        setGpsStableSeconds(0);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [
    captureMethod,
    isRecording,
    isWalkCaptureModeEarly,
    precisionMeters,
    previewPrecisionMeters,
    selectedMethodPage,
    showCapturePageEarly,
  ]);

  useEffect(() => {
    if (!isRecording || captureMethod !== 'walk') {
      setWeakGpsWalkSeconds(0);
      return;
    }
    const tick = setInterval(() => {
      if (isWeakGpsForWalkCoach(precisionMeters)) {
        setWeakGpsWalkSeconds((seconds) => seconds + 1);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [captureMethod, isRecording, precisionMeters]);

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
      Alert.alert(t('walk_corner_wait_title'), t('walk_corner_wait_body'));
      return;
    }
    stopRecording();
    setCornerHoldAnchor(0);
  }, [
    addAveragedVertex,
    cornerHoldAnchor,
    isRecording,
    recordingSeconds,
    startRecording,
    stopRecording,
    t,
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
      void clearMappingDraftAfterPlotSave(farmer?.id);
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
    [farmer?.id, openSignIn, t],
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

  const resetCaptureFlowState = useCallback(() => {
    setShowCompletionPage(false);
    setShowDetailedForm(false);
    setSelectedMethodPage(null);
    reset();
    setCompletionPhotos([]);
    lastRegisteredPlotIdRef.current = null;
    lastSavedPlotRef.current = null;
  }, [reset]);

  const finishEnumerationPlotVisit = useCallback(
    (next: 'documents' | 'home') => {
      const pid = lastRegisteredPlotIdRef.current;
      const farmerId = resolveProfileId();
      const captureIntent = lastSavedPlotRef.current?.geometryCapture?.captureIntent ?? null;
      void enumeration?.recordPlotCapturedForMember(farmerId, { captureIntent });
      resetCaptureFlowState();
      if (next === 'documents' && pid) {
        router.replace(`/plot/${encodeURIComponent(pid)}?sub=documents`);
        return;
      }
      router.replace('/(tabs)/');
    },
    [enumeration, resetCaptureFlowState, resolveProfileId],
  );

  const openShortPathIfPlotSaved = useCallback(
    (newPlotId: string | undefined, savedPlot: Plot | null) => {
      if (!newPlotId || !savedPlot) {
        Alert.alert(t('plot_saved_title'), t('documents_save_failed_body'));
        return;
      }
      lastRegisteredPlotIdRef.current = newPlotId;
      lastSavedPlotRef.current = savedPlot;
      setDrawTracingActive(false);
      setMapScrollLock(false);
      openShortPathCompletion();
    },
    [openShortPathCompletion, t],
  );

  const buildSavedPlotRecord = useCallback(
    (
      plotId: string,
      farmerId: string,
      input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>,
    ): Plot => ({
      id: plotId,
      farmerId,
      createdAt: Date.now(),
      ...input,
    }),
    [],
  );

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
    const kind = captureMethod === 'pin' ? 'point' : 'polygon';
    const assessment =
      geometryConfidence ??
      assessGeometryConfidence({
        captureMethod,
        kind,
        precisionMeters: precision,
        points,
        areaHa: area.hectares,
        declaredAreaHa: parsedDeclaredAreaHa,
      });
    const captureIntent = resolveCaptureIntent({
      kind,
      captureMethod,
      declaredAreaHa: parsedDeclaredAreaHa,
    });
    return buildPlotGeometryCaptureMetadata({
      captureMethod,
      assessment,
      manualTraceImagery: captureMethod === 'draw' ? manualTraceImagery : null,
      precisionMeters: precision,
      captureIntent,
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
      displayName: string,
      geometry: ReturnType<typeof buildGeometryFromLocalPlot>,
      declaredAreaHectares?: number | null,
      geometryCapture?: PlotGeometryCaptureMetadata | null,
    ) => {
      if (!resolveProfileId() || !isSyncSignedIn()) return;
      const uploadFarmerId = resolveProfileId();
      const retry = () => {
        postPlotToBackend({
          farmerId: uploadFarmerId,
          clientPlotId: resolveClientPlotId({ id: plotId }),
          name: displayName.trim() || undefined,
          geometry,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          geometryCapture: geometryCapture ?? null,
          producerContactId: resolveProducerContactId(),
          assignmentId: resolveAssignmentId(),
        }).then((r: PostPlotToBackendResult) => handlePlotUploadResult(r, retry));
      };
      retry();
    },
    [handlePlotUploadResult, precisionMeters, resolveAssignmentId, resolveProducerContactId, resolveProfileId],
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
    if (enumeration?.isEnumerationMode && enumeration.activeMember?.farmerId) {
      return enumeration.activeMember.farmerId;
    }
    const typed = farmerIdInput.trim();
    if (isUuid(typed)) return typed;
    if (farmer?.id && isUuid(farmer.id)) return farmer.id;
    return createLocalFarmerId();
  }, [enumeration?.activeMember?.farmerId, enumeration?.isEnumerationMode, farmer?.id, farmerIdInput]);

  const resolveProducerContactId = useCallback((): string | undefined => {
    const farmerId = resolveProfileId();
    const contactId = enumeration?.producerContactIdForFarmer(farmerId);
    return contactId?.trim() || undefined;
  }, [enumeration, resolveProfileId]);

  const resolveAssignmentId = useCallback((): string | undefined => {
    const farmerId = resolveProfileId();
    const assignmentId = enumeration?.assignmentIdForFarmer(farmerId);
    return assignmentId?.trim() || undefined;
  }, [enumeration, resolveProfileId]);

  const isEnumerationCapture = Boolean(
    enumeration?.isEnumerationMode && enumeration.activeMember,
  );

  const geometryComparisonPlots = useMemo(() => {
    if (!enumeration?.isEnumerationMode || !enumeration.activeMember) return plots;
    const farmerId = enumeration.activeMember.farmerId;
    return plots.filter((plot) => plot.farmerId === farmerId);
  }, [enumeration?.activeMember, enumeration?.isEnumerationMode, plots]);

  const suggestedPlotName = useMemo(
    () => proposeUniqueDefaultPlotName(plots, resolveProfileId()),
    [plots, resolveProfileId],
  );

  useEffect(() => {
    if (editPlotId) {
      setPlotLandingNameReady(true);
      return;
    }
    if (!isAppReady) {
      setPlotLandingNameReady(false);
      return;
    }
    if (!plotNameTouched) {
      setPlotName(suggestedPlotName);
    }
    setPlotLandingNameReady(true);
  }, [editPlotId, isAppReady, plotNameTouched, suggestedPlotName]);

  const rejectDuplicatePlotName = useCallback(
    (name: string, excludePlotId?: string): boolean => {
      if (
        hasDuplicatePlotName({
          plots,
          farmerId: resolveProfileId(),
          name,
          excludePlotId,
        })
      ) {
        Alert.alert(t('warning'), t('plot_name_duplicate'));
        return true;
      }
      return false;
    },
    [plots, resolveProfileId, t],
  );

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

  const safeClearBoundary = useCallback(() => {
    // UrlTile + Polyline teardown in one frame can crash native MapView; unmount overlays first.
    setSuppressBoundaryOverlays(true);
    reset();
    requestAnimationFrame(() => {
      setBoundaryOverlayEpoch((epoch) => epoch + 1);
      setSuppressBoundaryOverlays(false);
    });
  }, [reset]);

  const handleDrawBoundaryReset = useCallback(() => {
    safeClearBoundary();
    // Stay in trace mode so the map does not flip marker/overlay modes while clearing.
  }, [safeClearBoundary]);

  const restartWalkedBoundaryCapture = useCallback(() => {
    safeClearBoundary();
    if (captureMethod === 'walk' && selectedMethodPage === 'walk') {
      void startRecording();
    }
  }, [captureMethod, safeClearBoundary, selectedMethodPage, startRecording]);

  const canSavePlot = points.length >= 3 && area.squareMeters > 0;
  const canSavePointPlot = points.length >= 1;
  const resolvedLandingPlotName = useMemo(
    () => plotName.trim() || suggestedPlotName,
    [plotName, suggestedPlotName],
  );
  const landingPlotNameDuplicate = useMemo(() => {
    if (editPlotId || !plotLandingNameReady) return false;
    return hasDuplicatePlotName({
      plots,
      farmerId: resolveProfileId(),
      name: resolvedLandingPlotName,
    });
  }, [editPlotId, plotLandingNameReady, plots, resolveProfileId, resolvedLandingPlotName]);
  const landingPlotNameSuggestion = useMemo(() => {
    if (!landingPlotNameDuplicate) return null;
    return proposeUniqueDefaultPlotName(plots, resolveProfileId());
  }, [landingPlotNameDuplicate, plots, resolveProfileId]);
  const canStartMapping =
    plotLandingNameReady &&
    estimatedSize != null &&
    resolvedLandingPlotName.trim().length > 0 &&
    !landingPlotNameDuplicate;

  const handlePlotNameChange = useCallback((text: string) => {
    setPlotNameTouched(true);
    setPlotName(text);
  }, []);

  const applySuggestedPlotName = useCallback(() => {
    if (!landingPlotNameSuggestion) return;
    setPlotNameTouched(false);
    setPlotName(landingPlotNameSuggestion);
  }, [landingPlotNameSuggestion]);

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

  const pinMapHeight = useMemo(() => {
    if (captureMethod !== 'pin') return 330;
    const headerAllowance = insets.top + 56;
    const footerAllowance = 132;
    const available = Math.max(240, windowHeight - headerAllowance - footerAllowance);
    return Math.min(480, Math.max(280, Math.round(available * 0.72)));
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
  const pinActionsPinned = showDetailedForm && showCapturePage && captureMethod === 'pin';
  const hasPinnedCaptureFooter =
    walkActionsPinned || centroidActionsPinned || drawActionsPinned || pinActionsPinned;

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
    const titleByMethod: Record<CaptureMethod, string> = {
      walk: t('walk_instructions_title'),
      draw: t('walk_method_draw'),
      centroid: t('walk_method_centroid'),
      pin: t('walk_method_pin'),
    };
    const bodyByMethod: Record<CaptureMethod, string> = {
      walk: t('walk_instructions_body'),
      draw: t('walk_draw_steps_body'),
      centroid: t('walk_corner_instructions_alert'),
      pin: t('walk_pin_instructions_alert'),
    };
    const geometryFooter = t('walk_capture_geometry_rules_footer');
    Alert.alert(titleByMethod[captureMethod], `${bodyByMethod[captureMethod]}${geometryFooter}`);
  }, [captureMethod, t]);

  const walkCaptureHint = useMemo(() => {
    if (!showCapturePage || captureMethod !== 'walk' || selectedMethodPage !== 'walk') {
      return null;
    }
    const hint = resolveWalkLiveHint({
      isRecording,
      pointCount: points.length,
      areaHectares: area.hectares,
      precisionMeters: effectivePrecisionMeters,
      speedMps: isRecording ? lastSpeedMps : null,
      gpsFixDropped,
      boundaryPoints: points,
    });
    if (!hint) return null;
    return {
      text: hint.params ? t(hint.key, hint.params) : t(hint.key),
      tone: hint.tone,
    };
  }, [
    area.hectares,
    captureMethod,
    effectivePrecisionMeters,
    gpsFixDropped,
    isRecording,
    lastSpeedMps,
    points,
    selectedMethodPage,
    showCapturePage,
    t,
  ]);

  const walkPreviewPrecision = previewPrecisionMeters ?? precisionMeters;
  const walkStartGateReady = isWalkStartGateReady({
    precisionMeters: walkPreviewPrecision,
    stableSeconds: gpsStableSeconds,
    override: walkStartGateOverride,
  });
  const walkStartGateRemaining = walkStartGateSecondsRemaining(gpsStableSeconds);

  const handleStartWalkRecording = useCallback(() => {
    if (!walkStartGateReady) return;
    alternateCaptureSuggestedRef.current = false;
    setWeakGpsWalkSeconds(0);
    void startRecording();
  }, [startRecording, walkStartGateReady]);

  const handleStartWalkAnyway = useCallback(() => {
    setWalkStartGateOverride(true);
    alternateCaptureSuggestedRef.current = false;
    setWeakGpsWalkSeconds(0);
    void startRecording();
  }, [startRecording]);

  useEffect(() => {
    if (
      !shouldSuggestAlternateCapture({
        isRecording,
        alreadySuggested: alternateCaptureSuggestedRef.current,
        weakGpsSeconds: weakGpsWalkSeconds,
      })
    ) {
      return;
    }
    alternateCaptureSuggestedRef.current = true;
    Alert.alert(t('walk_coach_alternate_title'), t('walk_coach_alternate_body'), [
      {
        text: t('walk_coach_keep_walking'),
        style: 'cancel',
      },
      {
        text: t('walk_method_centroid'),
        onPress: () => switchToCaptureMethod('centroid', 'centroid'),
      },
      {
        text: t('walk_geo_confidence_cta_trace'),
        onPress: () => {
          void enterManualTraceRef.current('confidence_cta');
        },
      },
    ]);
  }, [isRecording, switchToCaptureMethod, t, weakGpsWalkSeconds]);

  const walkCoachHintStyle = useCallback(
    (tone: WalkCoachHintTone) => {
      if (tone === 'warning') return [styles.walkCaptureHint, styles.walkCoachHintWarning];
      if (tone === 'caution') return [styles.walkCaptureHint, styles.walkCoachHintCaution];
      return styles.walkCaptureHint;
    },
    [styles.walkCaptureHint, styles.walkCoachHintCaution, styles.walkCoachHintWarning],
  );

  const drawCaptureHint = useMemo(() => {
    if (!showCapturePage || captureMethod !== 'draw') {
      return null;
    }
    if (!drawTracingActive) {
      if (points.length > 0) {
        return t('walk_draw_map_resume');
      }
      if (walkMapTileMode === 'offline') {
        return t('walk_draw_hint_explore_offline');
      }
      return t('walk_draw_map_explore');
    }
    if (points.length < 3) {
      return t('walk_draw_hint_more_corners', { n: points.length });
    }
    if (canSavePlot) {
      return t('walk_draw_hint_close', { ha: area.hectares.toFixed(2) });
    }
    return t('walk_draw_map_trace');
  }, [
    area.hectares,
    canSavePlot,
    captureMethod,
    drawTracingActive,
    points.length,
    showCapturePage,
    t,
    walkMapTileMode,
  ]);

  const cornerCaptureLiveMessage = useMemo(() => {
    if (!showCapturePage || captureMethod !== 'centroid') {
      return null;
    }
    return resolveCornerCaptureLiveMessage({
      isRecording,
      holdPercent: cornerHoldPercent,
      savedCornerCount: points.length,
      secondsRemaining: cornerHoldSecondsRemaining,
      poorGps: effectivePrecisionMeters != null && effectivePrecisionMeters > WALK_CAPTURE_POOR_GPS_M,
    });
  }, [
    captureMethod,
    cornerHoldPercent,
    cornerHoldSecondsRemaining,
    effectivePrecisionMeters,
    isRecording,
    points.length,
    showCapturePage,
  ]);

  const cornerCaptureHint = useMemo(() => {
    if (!cornerCaptureLiveMessage) return null;
    return cornerCaptureLiveMessage.params
      ? t(cornerCaptureLiveMessage.key, cornerCaptureLiveMessage.params)
      : t(cornerCaptureLiveMessage.key);
  }, [cornerCaptureLiveMessage, t]);

  const completedPlot = useMemo(() => {
    const id = lastRegisteredPlotIdRef.current;
    if (!id) return lastSavedPlotRef.current;
    return plots.find((p) => p.id === id) ?? lastSavedPlotRef.current;
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
      ensureMinimalFarmerForPlot();
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
      ensureMinimalFarmerForPlot,
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

    const name = (plotName || suggestedPlotName).trim() || suggestedPlotName;
    if (rejectDuplicatePlotName(name, editingPlot?.id)) return;

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
      otherPlots: localPlotRefsForGeometry(geometryComparisonPlots, editingPlot?.id),
      excludePlotId: editingPlot?.id,
      phase: 'save',
    });
    if (pointGeometryQuality.blockingIssues.length > 0) {
      promptBlockingPlotGeometryIssues({
        blockingIssues: pointGeometryQuality.blockingIssues,
        t,
        onWalkAgain: restartWalkedBoundaryCapture,
        onTraceOnMap: openManualTraceFromConfidence,
      });
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

    ensureMinimalFarmerForPlot();
    const farmerId = resolveProfileId();
    const plotInput = {
      name,
      areaSquareMeters: 0,
      areaHectares: 0,
      kind: 'point' as const,
      points: pointPointsPayload,
      declaredAreaHectares,
      discrepancyPercent: undefined,
      precisionMetersAtSave: precisionMeters ?? null,
      geometryCapture,
    };

    const newPlotId = addPlot(plotInput, { farmerId });
    if (newPlotId) {
      lastRegisteredPlotIdRef.current = newPlotId;
    }

    if (options?.shortPath) {
      openShortPathIfPlotSaved(
        newPlotId,
        newPlotId ? buildSavedPlotRecord(newPlotId, farmerId, plotInput) : null,
      );
      if (newPlotId) {
        tryBackgroundPlotUpload(newPlotId, name, pointGeometryForUpload, declaredAreaHectares, geometryCapture);
      }
      return;
    }

    if (newPlotId) {
      const plotIdForUpload = newPlotId;
      const tryServerUpload = () => {
        postPlotToBackend({
          farmerId,
          clientPlotId: resolveClientPlotId({ id: plotIdForUpload }),
          name: name.trim() || undefined,
          geometry: pointGeometryForUpload,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          geometryCapture,
          producerContactId: resolveProducerContactId(),
          assignmentId: resolveAssignmentId(),
        }).then((r: PostPlotToBackendResult) => handlePlotUploadResult(r, tryServerUpload));
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

    const polygonGeometryQuality = assessPlotGeometryQuality({
      kind: 'polygon',
      points,
      areaHa: area.hectares,
      otherPlots: localPlotRefsForGeometry(geometryComparisonPlots, editingPlot?.id),
      excludePlotId: editingPlot?.id,
      phase: 'save',
    });
    if (polygonGeometryQuality.blockingIssues.length > 0) {
      promptBlockingPlotGeometryIssues({
        blockingIssues: polygonGeometryQuality.blockingIssues,
        t,
        onWalkAgain: restartWalkedBoundaryCapture,
        onTraceOnMap: openManualTraceFromConfidence,
      });
      return;
    }

    const completePolygonSave = () => {
      recordGeometrySaveTelemetry();
      const geometryCapture = resolveGeometryCaptureForSave();

      // EUDR geometry: plots ≥4 ha must be polygons; plots <4 ha may be point OR polygon.
      // This path always has a walked perimeter (≥3 vertices) — store as polygon even if area <4 ha.
      const kind: 'polygon' = 'polygon';
      const name = (plotName || suggestedPlotName).trim() || suggestedPlotName;
      if (rejectDuplicatePlotName(name, editingPlot?.id)) return;

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

      ensureMinimalFarmerForPlot();
      const farmerId = resolveProfileId();
      const plotInput = {
        name,
        areaSquareMeters: area.squareMeters,
        areaHectares: area.hectares,
        kind,
        points: pointsPayload,
        declaredAreaHectares,
        discrepancyPercent,
        precisionMetersAtSave: precisionMeters ?? null,
        geometryCapture,
      };

      const newPlotId = addPlot(plotInput, { farmerId });
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
        openShortPathIfPlotSaved(
          newPlotId,
          newPlotId ? buildSavedPlotRecord(newPlotId, farmerId, plotInput) : null,
        );
        if (newPlotId) {
          tryBackgroundPlotUpload(newPlotId, name, geometryForUpload, declaredAreaHectares, geometryCapture);
        }
        return;
      }

      if (points.length > 0 && !editingPlot && newPlotId) {
        const plotIdForUpload = newPlotId;
        const tryServerUpload = () => {
          postPlotToBackend({
            farmerId,
            clientPlotId: resolveClientPlotId({ id: plotIdForUpload }),
            name: name.trim() || undefined,
            geometry: geometryForUpload,
            declaredAreaHa: declaredAreaHectares ?? null,
            precisionMeters: precisionMeters ?? null,
            geometryCapture,
            producerContactId: resolveProducerContactId(),
            assignmentId: resolveAssignmentId(),
          }).then((r: PostPlotToBackendResult) => handlePlotUploadResult(r, tryServerUpload));
        };
        finishNewPlotSave(name, newPlotId, tryServerUpload);
      }
    };

    if (polygonGeometryQuality.warnings.length > 0) {
      const nameForAlert = (plotName || suggestedPlotName).trim() || suggestedPlotName;
      Alert.alert(
        t('geo_quality_save_upload_warning_title'),
        t('geo_quality_save_upload_warning_body', {
          plotName: nameForAlert,
          detail: localPolygonQualityMessage(polygonGeometryQuality.warnings, t),
        }),
        [
          {
            text: t('geo_quality_fix_boundary'),
            style: 'cancel',
            onPress: restartWalkedBoundaryCapture,
          },
          {
            text: t('walk_geo_confidence_cta_trace'),
            onPress: openManualTraceFromConfidence,
          },
          { text: t('geo_quality_save_on_phone'), onPress: completePolygonSave },
        ],
      );
      return;
    }

    completePolygonSave();
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
      {!isRecording && !walkStartGateReady ? (
        <ThemedText type="caption" style={styles.walkCoachStartChip} testID="walk-coach-start-settling">
          {walkStartGateRemaining > 0
            ? t('walk_coach_start_settling', { seconds: walkStartGateRemaining })
            : t('walk_wait_strong_gps')}
        </ThemedText>
      ) : null}
      {!isRecording && walkStartGateReady ? (
        <ThemedText type="caption" style={[styles.walkCoachStartChip, styles.walkCoachStartReady]}>
          {t('walk_coach_start_ready')}
        </ThemedText>
      ) : null}
      {walkCaptureHint ? (
        <ThemedText
          type="caption"
          style={walkCoachHintStyle(walkCaptureHint.tone)}
          testID="walk-coach-hint"
        >
          {walkCaptureHint.text}
        </ThemedText>
      ) : null}
      {!isRecording ? (
        <Button
          variant="secondary"
          style={{ backgroundColor: '#0A7F59', minHeight: 56 }}
          icon={<Ionicons name="play-outline" size={20} color="#FFFFFF" />}
          onPress={handleStartWalkRecording}
          disabled={!walkStartGateReady}
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
      {!isRecording && !walkStartGateReady ? (
        <Pressable onPress={handleStartWalkAnyway} hitSlop={8} testID="walk-start-anyway">
          <ThemedText type="caption" style={styles.walkCoachStartAnyway}>
            {t('walk_coach_start_anyway')}
          </ThemedText>
        </Pressable>
      ) : null}
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
              testID="walk-draw-complete"
              onPress={() => {
                if (editingPlot) {
                  setDrawTracingActive(false);
                  setMapScrollLock(false);
                  handleSavePlot();
                  return;
                }
                handleSavePlot({ shortPath: true });
              }}
            >
              {editingPlot ? t('walk_save_boundary') : t('walk_continue_to_photos')}
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

  const renderCaptureInstructionsLink = () => (
    <CaptureInstructionsLink
      onPress={showCaptureInstructions}
      label={t('walk_instructions_link')}
      hint={t('walk_instructions_preview')}
    />
  );

  const renderBoundaryCaptureStatsRow = () => {
    if (points.length === 0 && !isRecording) {
      return null;
    }
    return (
      <View style={styles.walkStatsRow}>
        <View style={styles.walkStatCard}>
          <Ionicons name="git-network-outline" size={20} color="#6B7280" />
          <ThemedText type="subtitle" style={styles.walkStatValue}>
            {boundaryPointCount}
          </ThemedText>
          <ThemedText type="caption" style={styles.walkStatLabel}>
            {t(boundaryPointsStatLabelKey)}
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
          <Ionicons name="locate-outline" size={20} color={gpsStrengthColor} />
          <ThemedText type="subtitle" style={styles.walkStatValue}>
            {gpsStrengthLabel}
          </ThemedText>
          <ThemedText type="caption" style={styles.walkStatLabel}>
            {t('walk_gps_signal')}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderPinCaptureStatsRow = () => {
    if (!isRecording && points.length === 0) {
      return null;
    }
    const declaredHa = declaredAreaHaInput.trim()
      ? Number(declaredAreaHaInput.trim().replace(',', '.'))
      : NaN;
    const areaDisplay =
      area.hectares > 0
        ? area.hectares.toFixed(1)
        : Number.isFinite(declaredHa) && declaredHa > 0
          ? declaredHa.toFixed(1)
          : '—';
    return (
      <View style={styles.walkStatsRow}>
        <View style={styles.walkStatCard}>
          <Ionicons name="radio-outline" size={20} color="#6B7280" />
          <ThemedText type="subtitle" style={styles.walkStatValue}>
            {precisionMeters != null ? `${precisionMeters.toFixed(0)}m` : '—'}
          </ThemedText>
          <ThemedText type="caption" style={styles.walkStatLabel}>
            {t('walk_precision')}
          </ThemedText>
        </View>
        <View style={styles.walkStatCard}>
          <Ionicons name="leaf-outline" size={20} color="#0F8A64" />
          <ThemedText type="subtitle" style={styles.walkStatValue}>
            {areaDisplay}
          </ThemedText>
          <ThemedText type="caption" style={styles.walkStatLabel}>
            {t('walk_area')}
          </ThemedText>
        </View>
        <View style={styles.walkStatCard}>
          <Ionicons name="locate-outline" size={20} color={gpsStrengthColor} />
          <ThemedText type="subtitle" style={styles.walkStatValue}>
            {gpsStrengthLabel}
          </ThemedText>
          <ThemedText type="caption" style={styles.walkStatLabel}>
            {t('walk_gps_signal')}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderPinCaptureActions = () => (
    <View style={{ gap: 8 }}>
      {isEnumerationCapture && estimatedSize !== 'gte4' ? (
        <Button
          variant="outline"
          testID="enumeration-map-full-boundary"
          onPress={() => {
            trackEvent(ANALYTICS_EVENTS.ENUMERATION_CAPTURE_INTENT_FULL_BOUNDARY, {
              farmerId: enumeration?.activeMember?.farmerId ?? null,
            });
            switchToCaptureMethod('walk', 'walk');
          }}
          fullWidth
        >
          {t('enumeration_map_full_boundary')}
        </Button>
      ) : null}
      {isRecording ? (
        <View style={styles.averagingTrackCompact}>
          <View
            style={[styles.averagingFillCompact, { width: `${Math.max(pinHoldPercent, 2)}%` }]}
          />
        </View>
      ) : null}
      <Button
        variant="secondary"
        style={{ backgroundColor: '#0A7F59', minHeight: 56 }}
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
  );

  const renderCornerCaptureActions = () => (
    <View style={{ gap: 8 }}>
      {cornerCaptureHint ? (
        <ThemedText type="caption" style={styles.walkCaptureHint}>
          {cornerCaptureHint}
        </ThemedText>
      ) : null}
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
            onPress={safeClearBoundary}
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
        colors={[...HEADER_GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
          <Pressable onPress={handleHeaderBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={HEADER_GRADIENT_TEXT} />
            <ThemedText type="defaultSemiBold" style={{ color: HEADER_GRADIENT_TEXT }}>
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
            <View style={styles.langPill}>
              <ThemedText type="caption" style={{ color: HEADER_GRADIENT_TEXT }}>
                {String(lang).toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.bodyFlex}>
        <ThemedScrollView
          style={hasPinnedCaptureFooter ? { flex: 1 } : undefined}
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
            pinActionsPinned && {
              paddingBottom: Math.max(insets.bottom, 12) + 120,
            },
          ]}
        >
        {isEnumerationCapture && enumeration?.activeMember ? (
          <EnumerationActiveMemberBanner member={enumeration.activeMember} />
        ) : null}
        {!showDetailedForm ? (
          <>
            <Card variant="elevated" style={styles.plotLandingCombinedCard}>
              <ThemedText type="caption" style={styles.plotRegisterLandingHint}>
                {t('plot_register_landing_hint')}
              </ThemedText>
              <Input
                label={t('walk_plot_name_label')}
                placeholder={t('walk_plot_name_ph')}
                value={plotName}
                onChangeText={handlePlotNameChange}
                error={landingPlotNameDuplicate}
              />
              {landingPlotNameDuplicate ? (
                <>
                  <ThemedText type="caption" style={styles.plotNameDuplicateHint}>
                    {t('plot_name_duplicate')}
                  </ThemedText>
                  {landingPlotNameSuggestion ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={applySuggestedPlotName}
                      style={styles.plotNameDuplicateSuggestLink}
                    >
                      <ThemedText type="caption" style={styles.plotNameDuplicateSuggestLinkText}>
                        {t('plot_name_use_suggested', { name: landingPlotNameSuggestion })}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
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
                  disabled={!canStartMapping}
                  onPress={() => {
                    if (rejectDuplicatePlotName(resolvedLandingPlotName)) return;
                    if (!plotName.trim()) {
                      setPlotName(suggestedPlotName);
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

            {showSecondPlotOverlapTip ? (
              <SecondPlotOverlapTip
                t={t}
                firstPlotName={firstExistingPlotName}
                nextPlotNumber={plots.length + 1}
                onDismiss={dismissSecondPlotOverlapTip}
              />
            ) : null}

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
                        {(plotName || suggestedPlotName).trim()} · {area.hectares > 0 ? `${area.hectares.toFixed(1)} ha` : t('walk_point_plot')}
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
                          if (isEnumerationCapture) {
                            finishEnumerationPlotVisit('documents');
                            return;
                          }
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
                        {isEnumerationCapture
                          ? t('enumeration_completion_add_tenure')
                          : t('walk_completion_add_land_papers')}
                      </Button>
                      {!isEnumerationCapture ? (
                        <ThemedText type="caption" style={styles.completionLandHint}>
                          {t('walk_completion_land_papers_hint')}
                        </ThemedText>
                      ) : null}
                      <Button
                        variant="secondary"
                        fullWidth
                        onPress={() => {
                          if (isEnumerationCapture) {
                            finishEnumerationPlotVisit('home');
                            return;
                          }
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
                        {isEnumerationCapture
                          ? t('enumeration_next_member')
                          : t('walk_completion_view_plot')}
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
                            {(plotName || suggestedPlotName).trim()}
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

                    {!isEnumerationCapture ? (
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
                    ) : null}
                  </>
                )}

                <Pressable
                  onPress={() => {
                    setShowCompletionPage(false);
                    setShowDetailedForm(false);
                    setSelectedMethodPage(null);
                    reset();
                    setPlotNameTouched(false);
                    setPlotName(suggestedPlotName);
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
                {renderCaptureInstructionsLink()}

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
                  {isRecording && gpsFixDropped && points.length > 0 ? (
                    <View style={styles.walkCoachMapChip} pointerEvents="none" testID="walk-coach-gps-paused">
                      <Ionicons name="pause-circle-outline" size={14} color="#FFFFFF" />
                      <ThemedText type="caption" style={styles.walkCoachMapChipText}>
                        {t('walk_coach_gps_paused_map')}
                      </ThemedText>
                    </View>
                  ) : null}
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
                {renderCaptureInstructionsLink()}

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
                    {!suppressBoundaryOverlays ? (
                      <PlotBoundaryOverlays
                        key={`draw-boundary-${boundaryOverlayEpoch}`}
                        vertices={points}
                        userPosition={previewPosition}
                        showYouMarker={!drawTracingActive}
                        showStartMarker={points.length > 0}
                        showVertexMarkers={drawTracingActive}
                        strokeOnlyBoundary={drawTracingActive}
                        closeStrokeRing={false}
                      />
                    ) : null}
                  </MapView>
                  <View style={styles.mapGpsPill} pointerEvents="none">
                    <View style={[styles.mapGpsDot, { backgroundColor: gpsStrengthColor }]} />
                    <ThemedText type="caption" style={styles.mapGpsPillText}>
                      {gpsStrengthLabel}
                    </ThemedText>
                  </View>
                </View>

                {renderBoundaryCaptureStatsRow()}

                {points.length >= 3 ? renderGeometryConfidenceBanner() : null}
              </>
            ) : showCapturePage && captureMethod === 'pin' ? (
              <>
                {renderCaptureInstructionsLink()}

                <View
                  style={[styles.walkMapPanel, { minHeight: pinMapHeight }]}
                  onTouchStart={() => setMapScrollLock(true)}
                  onTouchEnd={() => setMapScrollLock(false)}
                  onTouchCancel={() => setMapScrollLock(false)}
                >
                  <MapView
                    style={[styles.walkMap, { height: pinMapHeight - 8 }]}
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
                  <View style={styles.mapGpsPill} pointerEvents="none">
                    <View style={[styles.mapGpsDot, { backgroundColor: gpsStrengthColor }]} />
                    <ThemedText type="caption" style={styles.mapGpsPillText}>
                      {gpsStrengthLabel}
                    </ThemedText>
                  </View>
                  <View style={styles.coordChip}>
                    <ThemedText type="caption">
                      {formatLatLon(mapCoordDisplay.latitude, mapCoordDisplay.longitude)}
                    </ThemedText>
                  </View>
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
                </View>

                {renderPinCaptureStatsRow()}

                <Input
                  label={t('walk_pin_declared_area_label')}
                  placeholder={t('walk_declared_area_ph')}
                  keyboardType="decimal-pad"
                  value={declaredAreaHaInput}
                  onChangeText={setDeclaredAreaHaInput}
                  containerStyle={{ marginTop: 4 }}
                />

                {!isRecording && points.length >= 1 ? renderGeometryConfidenceBanner() : null}
              </>
            ) : showCapturePage && captureMethod === 'centroid' ? (
              <>
                {renderCaptureInstructionsLink()}

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
                    {!suppressBoundaryOverlays ? (
                      <PlotBoundaryOverlays
                        key={`centroid-boundary-${boundaryOverlayEpoch}`}
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
                    ) : null}
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
                  <View style={styles.mapGpsPill} pointerEvents="none">
                    <View style={[styles.mapGpsDot, { backgroundColor: gpsStrengthColor }]} />
                    <ThemedText type="caption" style={styles.mapGpsPillText}>
                      {gpsStrengthLabel}
                    </ThemedText>
                  </View>
                </View>

                {renderBoundaryCaptureStatsRow()}

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

            {showCapturePage && captureMethod === 'pin' && !pinActionsPinned
              ? renderPinCaptureActions()
              : null}

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
        {(hasPinnedCaptureFooter) ? (
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
            {pinActionsPinned ? renderPinCaptureActions() : null}
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

