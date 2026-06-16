import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline, Region, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useWalkPerimeter } from './useWalkPerimeter';
import { useAppState } from '@/features/state/AppStateContext';
import { buildGeometryFromLocalPlot, postPlotToBackend } from '@/features/api/postPlot';
import { isSyncSignedIn } from '@/features/auth/signInSync';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  applyProducerAttestationsToFarmer,
  buildPlotAttestationFields,
  hasProducerAttestationsComplete,
} from '@/features/compliance/farmerDeclarations';
import { isProducerProfileComplete } from '@/features/compliance/producerProfileComplete';
import {
  PRODUCTION_SYSTEM_OPTIONS,
  type ProductionSystemId,
} from '@/features/compliance/productionSystem';
import { navigateHome } from '@/features/navigation/routes';
import {
  getSetting,
  logAuditEvent,
  persistPlotEvidenceItem,
  persistPlotPhoto,
} from '@/features/state/persistence';
import { roundWgs84Coordinate } from '@/features/geo/coordinates';
import { getOfflineTilesUrlTemplate } from '@/features/offlineTiles/offlineTiles';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Brand, Colors } from '@/constants/theme';
import { isStoreDemoFarmer } from '@/features/demo/storeDemoApiFixtures';
import {
  DEMO_WALK_FIELD_CENTER,
  DEMO_WALK_MAP_REGION,
} from '@/features/demo/storeScreenshotDemo.constants';

const STORE_DEMO_WALK_FIELD_MAP = require('@/assets/images/store-demo-walk-field-map.png');
import { scaleText } from '@/features/demo/storeUiScale';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LatLng = {
  latitude: number;
  longitude: number;
};

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

  const d1x = p2.latitude - p1.latitude;
  const d1y = p2.longitude - p1.longitude;
  const d2x = p4.latitude - p3.latitude;
  const d2y = p4.longitude - p3.longitude;

  const denominator = cross(d1x, d1y, d2x, d2y);
  if (denominator === 0) {
    return false;
  }

  const dx = p3.latitude - p1.latitude;
  const dy = p3.longitude - p1.longitude;

  const t = cross(dx, dy, d2x, d2y) / denominator;
  const u = cross(dx, dy, d1x, d1y) / denominator;

  return t > 0 && t < 1 && u > 0 && u < 1;
}

function hasSelfIntersection(points: LatLng[]): boolean {
  if (points.length < 4) {
    return false;
  }

  const n = points.length;

  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      const b1 = points[j];
      const b2 = points[(j + 1) % n];

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue;
      }

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

export function WalkPerimeterScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
  } = useWalkPerimeter();
  const { farmer, setFarmer, plots, addPlot, updatePlot } = useAppState();
  const { openSignIn } = useSignInSheet();
  const params = useLocalSearchParams<{ editPlotId?: string }>();
  const editPlotId = typeof params.editPlotId === 'string' ? params.editPlotId : undefined;
  const editingPlot = useMemo(
    () => (editPlotId ? plots.find((p) => p.id === editPlotId) : undefined),
    [editPlotId, plots],
  );
  const editInitDone = useRef<string | null>(null);
  const { t, lang } = useLanguage();
  const [farmerIdInput, setFarmerIdInput] = useState(farmer?.id ?? '');
  const [farmerNameInput, setFarmerNameInput] = useState(farmer?.name ?? '');
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(farmer?.selfDeclared ?? false);
  const [declaredAreaHaInput, setDeclaredAreaHaInput] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [fpicConsent, setFpicConsent] = useState(farmer?.fpicConsent ?? false);
  const [laborNoChildLabor, setLaborNoChildLabor] = useState(
    farmer?.laborNoChildLabor ?? false,
  );
  const [laborNoForcedLabor, setLaborNoForcedLabor] = useState(
    farmer?.laborNoForcedLabor ?? false,
  );
  const [showPointsList, setShowPointsList] = useState(false);
  const [plotName, setPlotName] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<'lt4' | 'gte4' | null>(null);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [selectedMethodPage, setSelectedMethodPage] = useState<'walk' | 'draw' | 'centroid' | null>(null);
  const [showRegistrationPage, setShowRegistrationPage] = useState(false);
  const [showProducerProfilePage, setShowProducerProfilePage] = useState(false);
  const [showDeclarationsPage, setShowDeclarationsPage] = useState(false);
  const [declarationMode, setDeclarationMode] = useState<'full' | 'plot-only'>('full');
  const [showPhotosPage, setShowPhotosPage] = useState(false);
  const [showCompletionPage, setShowCompletionPage] = useState(false);
  type GroundPhoto = {
    uri: string;
    takenAt: number;
    latitude?: number | null;
    longitude?: number | null;
  };
  const [photoSlots, setPhotoSlots] = useState<{
    north: GroundPhoto | null;
    east: GroundPhoto | null;
    south: GroundPhoto | null;
    west: GroundPhoto | null;
  }>({ north: null, east: null, south: null, west: null });
  const lastRegisteredPlotIdRef = useRef<string | null>(null);
  const pendingPlotAttestationsRef = useRef<ReturnType<typeof buildPlotAttestationFields> | null>(null);
  const pendingProductionSystemRef = useRef<ProductionSystemId | null>(null);
  const [productionSystem, setProductionSystem] = useState<ProductionSystemId>('agroforestry');
  const [vertexCycleSeconds, setVertexCycleSeconds] = useState<60 | 120>(120);
  const [captureMethod, setCaptureMethod] = useState<'walk' | 'draw' | 'centroid'>('walk');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showGpsWarning, setShowGpsWarning] = useState(false);
  const [declLandTenure, setDeclLandTenure] = useState(false);
  const [declNoDeforestation, setDeclNoDeforestation] = useState(false);
  const [postalInput, setPostalInput] = useState('');
  const [commodityCode, setCommodityCode] = useState('coffee');
  /** In-memory + synced to farmer when IDs match; merged on Continue into profile. */
  const [simplifiedDeclarationGeo, setSimplifiedDeclarationGeo] = useState<{
    latitude: number;
    longitude: number;
    capturedAt: number;
  } | null>(null);
  const [deviceRegion, setDeviceRegion] = useState<Region | null>(null);

  const defaultPlotName = useMemo(() => `Plot ${plots.length + 1}`, [plots.length]);

  const COMMODITY_OPTIONS = useMemo(
    () =>
      [
        { code: 'coffee' as const, label: t('commodity_coffee') },
        { code: 'cocoa' as const, label: t('commodity_cocoa') },
        { code: 'rubber' as const, label: t('commodity_rubber') },
        { code: 'soy' as const, label: t('commodity_soy') },
        { code: 'timber' as const, label: t('commodity_timber') },
      ],
    [t],
  );

  useEffect(() => {
    if (!farmer?.id) return;
    setFarmerIdInput(farmer.id);
    setFarmerNameInput(farmer.name ?? '');
    setPostalInput(farmer.postalAddress ?? '');
    const c = farmer.commodityCode;
    if (c === 'coffee' || c === 'cocoa' || c === 'rubber' || c === 'soy' || c === 'timber') {
      setCommodityCode(c);
    }
  }, [farmer?.id, farmer?.name, farmer?.postalAddress, farmer?.commodityCode]);

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
    // Keep large plots on polygon capture flow.
    if (estimatedSize === 'gte4' && captureMethod === 'centroid') {
      setCaptureMethod('walk');
      setCaptureMode('walk');
    }
  }, [captureMethod, estimatedSize, setCaptureMode]);

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

  const waypointCount = useMemo(() => {
    if (!isRecording) return 0;
    if (mode === 'vertex_avg') return points.length;
    // Approximate "waypoints" like the prototype (every ~8 seconds)
    return Math.max(0, Math.floor(recordingSeconds / 8));
  }, [isRecording, mode, points.length, recordingSeconds]);

  const averagingProgressPercent = useMemo(() => {
    if (!isRecording) return 0;
    const cycleSeconds = recordingSeconds % vertexCycleSeconds;
    return Math.max(1, Math.min(100, Math.round((cycleSeconds / vertexCycleSeconds) * 100)));
  }, [isRecording, recordingSeconds, vertexCycleSeconds]);

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

  const showWalkFieldPreview = useMemo(
    () =>
      process.env.EXPO_PUBLIC_STORE_DEMO === '1' ||
      Boolean(farmer?.id && isStoreDemoFarmer(farmer.id)),
    [farmer?.id],
  );

  const mapAnchorRegion = useMemo((): Region => {
    if (points.length > 0) {
      const lats = points.map((p) => p.latitude);
      const lons = points.map((p) => p.longitude);
      return {
        latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
        longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
    }
    if (showWalkFieldPreview) {
      return { ...DEMO_WALK_MAP_REGION };
    }
    if (deviceRegion) return deviceRegion;
    if (simplifiedDeclarationGeo) {
      return {
        latitude: simplifiedDeclarationGeo.latitude,
        longitude: simplifiedDeclarationGeo.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
    }
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
  }, [points, showWalkFieldPreview, deviceRegion, simplifiedDeclarationGeo, farmer, editingPlot, plots]);

  const walkMapType = useMemo(() => {
    if (showWalkFieldPreview) return 'hybrid' as const;
    if (offlineTilesEnabled || lowDataMap) return 'none' as const;
    return 'standard' as const;
  }, [showWalkFieldPreview, offlineTilesEnabled, lowDataMap]);

  const finishNewPlotSave = useCallback(
    (name: string, tryServerUpload: () => void) => {
      const buttons: {
        text: string;
        onPress?: () => void;
        style?: 'cancel' | 'default' | 'destructive';
      }[] = [
        {
          text: t('plot_saved_view_my_plots'),
          onPress: () => router.replace('/(tabs)/explore'),
        },
      ];
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
    setShowRegistrationPage(false);
    setShowProducerProfilePage(false);
    setShowDeclarationsPage(false);
    setShowPhotosPage(false);
    setShowCompletionPage(true);
  }, []);

  const handlePlotUploadResult = useCallback(
    (result: Awaited<ReturnType<typeof postPlotToBackend>>, retry: () => void) => {
      if (result.ok) return;
      if (result.reason === 'no_access_token') {
        openSignIn({ variant: 'sync', onSuccess: retry });
        return;
      }
      if (result.reason === 'server_error' || result.reason === 'network_error') {
        Alert.alert(
          t('plot_saved_title'),
          result.message ??
            (result.reason === 'network_error'
              ? 'Could not reach Tracebud. Upload this plot from My Plots when you are online.'
              : 'Server rejected the upload. Open My Plots → Upload plot to Tracebud to retry.'),
        );
      }
    },
    [openSignIn, t],
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
    const id = farmerIdInput.trim();
    if (!isUuid(id)) {
      return;
    }
    if (farmer?.id === id) {
      if (
        farmer.declarationLatitude != null &&
        farmer.declarationLongitude != null &&
        Number.isFinite(farmer.declarationLatitude) &&
        Number.isFinite(farmer.declarationLongitude)
      ) {
        setSimplifiedDeclarationGeo({
          latitude: farmer.declarationLatitude,
          longitude: farmer.declarationLongitude,
          capturedAt: farmer.declarationGeoCapturedAt ?? Date.now(),
        });
      } else {
        setSimplifiedDeclarationGeo(null);
      }
    } else if (farmer && farmer.id !== id) {
      setSimplifiedDeclarationGeo(null);
    }
  }, [farmer, farmerIdInput]);

  const mergeDeclarationGeoForProfile = (profileId: string) => {
    const lat =
      simplifiedDeclarationGeo?.latitude ??
      (farmer?.id === profileId ? farmer.declarationLatitude : undefined);
    const lon =
      simplifiedDeclarationGeo?.longitude ??
      (farmer?.id === profileId ? farmer.declarationLongitude : undefined);
    const at =
      simplifiedDeclarationGeo?.capturedAt ??
      (farmer?.id === profileId ? farmer.declarationGeoCapturedAt : undefined);
    if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
      return {
        declarationLatitude: lat,
        declarationLongitude: lon,
        declarationGeoCapturedAt: at ?? Date.now(),
      };
    }
    if (
      farmer?.id === profileId &&
      farmer.declarationLatitude != null &&
      farmer.declarationLongitude != null &&
      Number.isFinite(farmer.declarationLatitude) &&
      Number.isFinite(farmer.declarationLongitude)
    ) {
      return {
        declarationLatitude: farmer.declarationLatitude,
        declarationLongitude: farmer.declarationLongitude,
        declarationGeoCapturedAt: farmer.declarationGeoCapturedAt ?? Date.now(),
      };
    }
    return {};
  };

  const captureSimplifiedDeclarationGeo = async () => {
    const id = resolveProfileId();
    if (!isUuid(farmerIdInput.trim())) {
      setFarmerIdInput(id);
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('warning'), t('simplified_declaration_location_denied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = roundWgs84Coordinate(pos.coords.latitude);
      const longitude = roundWgs84Coordinate(pos.coords.longitude);
      const capturedAt = Date.now();
      setSimplifiedDeclarationGeo({ latitude, longitude, capturedAt });
      if (farmer?.id === id) {
        setFarmer({
          ...farmer,
          postalAddress: postalInput.trim() || undefined,
          commodityCode,
          declarationLatitude: latitude,
          declarationLongitude: longitude,
          declarationGeoCapturedAt: capturedAt,
        });
      }
    } catch (e) {
      Alert.alert(t('warning'), e instanceof Error ? e.message : t('simplified_declaration_location_failed'));
    }
  };

  const clearSimplifiedDeclarationGeo = () => {
    const id = farmerIdInput.trim();
    setSimplifiedDeclarationGeo(null);
    if (farmer?.id === id) {
      setFarmer({
        ...farmer,
        declarationLatitude: undefined,
        declarationLongitude: undefined,
        declarationGeoCapturedAt: undefined,
      });
    }
  };

  const canSaveFarmerProfile =
    farmerIdInput.trim().length > 0 &&
    isUuid(farmerIdInput.trim()) &&
    acceptedDeclaration &&
    fpicConsent &&
    laborNoChildLabor &&
    laborNoForcedLabor;

  const handleSaveFarmer = () => {
    if (!canSaveFarmerProfile) {
      return;
    }

    const id = farmerIdInput.trim();
    const now = Date.now();
    setFarmer({
      id,
      name: farmerNameInput.trim() || undefined,
      role: 'farmer',
      selfDeclared: true,
      selfDeclaredAt: now,
      fpicConsent,
      laborNoChildLabor,
      laborNoForcedLabor,
      postalAddress: postalInput.trim() || undefined,
      commodityCode,
      ...mergeDeclarationGeoForProfile(id),
    });
  };

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_STORE_DEMO === '1') return;
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
        // Map falls back to plot / demo region.
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

  const refreshVertexCycleSetting = useCallback(() => {
    getSetting('vertexAveragingSeconds')
      .then((v) => setVertexCycleSeconds(v === '60' ? 60 : 120))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshVertexCycleSetting();
  }, [refreshVertexCycleSetting]);

  useFocusEffect(
    useCallback(() => {
      refreshVertexCycleSetting();
    }, [refreshVertexCycleSetting]),
  );

  const canSavePlot = points.length >= 3 && area.squareMeters > 0;
  const canSavePointPlot = points.length >= 1;
  const canContinueToCaptureMethod = estimatedSize != null;
  const gpsStrengthLabel =
    precisionMeters == null
      ? t('walk_gps_unknown')
      : precisionMeters <= 6
        ? t('walk_gps_strong')
        : precisionMeters <= 10
          ? t('walk_gps_fair')
          : t('walk_gps_weak');
  const gpsStrengthColor =
    precisionMeters == null ? '#9CA3AF' : precisionMeters <= 6 ? '#10B981' : precisionMeters <= 10 ? '#F59E0B' : '#EF4444';
  const walkMapHeight = Math.max(280, Math.round(windowHeight * 0.5));
  const isWalkCaptureMode = captureMethod === 'walk' && selectedMethodPage === 'walk';
  const isWalkLandingState =
    captureMethod === 'walk' && selectedMethodPage === 'walk' && !isRecording && points.length === 0;
  const producerProfileComplete = isProducerProfileComplete(farmer);
  const producerAttestationsComplete = hasProducerAttestationsComplete(farmer);

  const openDeclarationsPage = useCallback(() => {
    setDeclLandTenure(false);
    setDeclNoDeforestation(false);
    setFpicConsent(farmer?.fpicConsent ?? false);
    setLaborNoChildLabor(farmer?.laborNoChildLabor ?? false);
    setLaborNoForcedLabor(farmer?.laborNoForcedLabor ?? false);
    setDeclarationMode(hasProducerAttestationsComplete(farmer) ? 'plot-only' : 'full');
    setShowDeclarationsPage(true);
  }, [farmer]);

  const canCompleteProducerProfileForm = useMemo(() => {
    const hasPostal = postalInput.trim().length > 0;
    const hasGeo = simplifiedDeclarationGeo != null;
    return Boolean(commodityCode) && (hasPostal || hasGeo);
  }, [commodityCode, postalInput, simplifiedDeclarationGeo]);

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
      id,
      name,
      role: 'farmer',
      selfDeclared: false,
      profilePhotoUri: farmer?.profilePhotoUri,
    });
  }, [farmer, farmerNameInput, resolveProfileId]);

  const saveProducerProfileFromForm = useCallback(() => {
    const id = resolveProfileId();
    setFarmerIdInput(id);
    setFarmer({
      id,
      name: farmerNameInput.trim() || farmer?.name?.trim() || undefined,
      role: 'farmer',
      selfDeclared: farmer?.selfDeclared ?? false,
      selfDeclaredAt: farmer?.selfDeclaredAt,
      fpicConsent: farmer?.fpicConsent ?? false,
      laborNoChildLabor: farmer?.laborNoChildLabor ?? false,
      laborNoForcedLabor: farmer?.laborNoForcedLabor ?? false,
      postalAddress: postalInput.trim() || undefined,
      commodityCode,
      profilePhotoUri: farmer?.profilePhotoUri,
      ...mergeDeclarationGeoForProfile(id),
    });
  }, [
    commodityCode,
    farmer,
    farmerNameInput,
    mergeDeclarationGeoForProfile,
    postalInput,
    resolveProfileId,
  ]);

  const showCapturePage =
    !showRegistrationPage &&
    !showProducerProfilePage &&
    !showDeclarationsPage &&
    !showPhotosPage &&
    !showCompletionPage;
  const photosCapturedCount = Object.values(photoSlots).filter(Boolean).length;

  const handleSavePointPlot = (options?: { shortPath?: boolean }) => {
    if (!canSavePointPlot) return;

    const last = points[points.length - 1];
    if (!last) return;

    const name = (plotName || defaultPlotName).trim() || defaultPlotName;

    let declaredAreaHectares: number | undefined;
    if (declaredAreaHaInput.trim().length > 0) {
      const parsed = Number(declaredAreaHaInput.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert('Invalid declared area', 'Please enter a positive number for declared hectares.');
        return;
      }
      declaredAreaHectares = parsed;
    }

    const pointPointsPayload = [{ latitude: last.latitude, longitude: last.longitude }];
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
      });
      Alert.alert(
        'Plot updated',
        'Location saved on this device. Sync from My Plots if this plot was already uploaded.',
      );
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
      ...(pendingPlotAttestationsRef.current ?? {}),
      ...(pendingProductionSystemRef.current
        ? { productionSystem: pendingProductionSystemRef.current }
        : {}),
    });
    pendingPlotAttestationsRef.current = null;
    pendingProductionSystemRef.current = null;
    if (newPlotId) {
      lastRegisteredPlotIdRef.current = newPlotId;
      if (!options?.shortPath) {
        logPlotComplianceDeclared(newPlotId, name);
      }
    }

    if (options?.shortPath) {
      openShortPathCompletion();
      return;
    }

    if (farmer) {
      const tryServerUpload = () => {
        postPlotToBackend({
          farmerId: farmer.id,
          clientPlotId: name,
          geometry: pointGeometryForUpload,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          productionSystem: productionSystem ?? null,
        }).then((r) => handlePlotUploadResult(r, tryServerUpload));
      };
      finishNewPlotSave(name, tryServerUpload);
    } else {
      Alert.alert('Plot saved (point)', `${name} saved using a single GPS fix.`);
    }
  };

  const handleSavePlot = (options?: { shortPath?: boolean }) => {
    if (!canSavePlot) {
      return;
    }

    if (precisionMeters != null && precisionMeters > 10) {
      Alert.alert(t('walk_poor_gps_title'), t('walk_poor_gps_body'));
    }

    if (hasSelfIntersection(points)) {
      Alert.alert(t('walk_invalid_boundary_title'), t('walk_invalid_boundary_body'));
      return;
    }

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
      ...(pendingPlotAttestationsRef.current ?? {}),
      ...(pendingProductionSystemRef.current
        ? { productionSystem: pendingProductionSystemRef.current }
        : {}),
    });
    pendingPlotAttestationsRef.current = null;
    pendingProductionSystemRef.current = null;
    if (newPlotId) {
      lastRegisteredPlotIdRef.current = newPlotId;
      if (!options?.shortPath) {
        logPlotComplianceDeclared(newPlotId, name);
      }
    }

    // Log raw GNSS capture metadata for GIS review (best-effort, local only).
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
          clientPlotId: name,
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
      return;
    }

    if (farmer && points.length > 0 && !editingPlot) {
      const tryServerUpload = () => {
        postPlotToBackend({
          farmerId: farmer.id,
          clientPlotId: name,
          geometry: geometryForUpload,
          declaredAreaHa: declaredAreaHectares ?? null,
          precisionMeters: precisionMeters ?? null,
          productionSystem: productionSystem ?? null,
        }).then((r) => handlePlotUploadResult(r, tryServerUpload));
      };
      finishNewPlotSave(name, tryServerUpload);
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

  const logPlotComplianceDeclared = (plotId: string, plotName: string) => {
    try {
      logAuditEvent({
        userId: farmer?.id,
        eventType: 'plot_compliance_declared',
        payload: {
          plotId,
          plotName,
          producerAttestations: {
            fpicConsent: farmer?.fpicConsent ?? fpicConsent,
            laborNoChildLabor: farmer?.laborNoChildLabor ?? laborNoChildLabor,
            laborNoForcedLabor: farmer?.laborNoForcedLabor ?? laborNoForcedLabor,
            producerLevel: producerAttestationsComplete || declarationMode === 'full',
          },
          plotAttestations: {
            landTenure: declLandTenure,
            noDeforestation: declNoDeforestation,
          },
        },
      }).catch(() => undefined);
    } catch {
      // ignore
    }
  };

  const finalizeGeolocationAfterDeclarations = () => {
    if (!isProducerProfileComplete(farmer)) {
      setShowDeclarationsPage(false);
      setShowProducerProfilePage(true);
      return;
    }
    if (!farmer?.id) {
      ensureMinimalFarmerForPlot();
      Alert.alert(t('producer_profile_error_title'), t('producer_profile_missing_farmer'));
      return;
    }
    if (estimatedSize === 'gte4' && points.length < 3) {
      Alert.alert(t('plot_boundary_required_title'), t('plot_boundary_required_body'));
      return;
    }
    if (captureMethod === 'centroid' || (estimatedSize === 'lt4' && points.length < 3)) {
      handleSavePointPlot();
    } else {
      handleSavePlot();
    }
  };

  const handleDeclarationsContinue = () => {
    if (!farmer?.id) {
      Alert.alert(t('producer_profile_error_title'), t('producer_profile_missing_farmer'));
      return;
    }
    const now = Date.now();
    pendingPlotAttestationsRef.current = buildPlotAttestationFields(
      { landTenure: declLandTenure, noDeforestation: declNoDeforestation },
      now,
    );
    pendingProductionSystemRef.current = productionSystem;
    if (declarationMode === 'full') {
      setFarmer(
        applyProducerAttestationsToFarmer(
          farmer,
          { fpicConsent, laborNoChildLabor, laborNoForcedLabor },
          now,
        ),
      );
    }
    finalizeGeolocationAfterDeclarations();
    setShowDeclarationsPage(false);
    const shouldPromptDocs = declLandTenure || (declarationMode === 'full' && fpicConsent);
    if (shouldPromptDocs) {
      Alert.alert(t('evidence_upload_prompt_title'), t('evidence_upload_prompt_body'), [
        {
          text: t('declarations_upload_now'),
          onPress: () => {
            const pid = lastRegisteredPlotIdRef.current;
            if (pid) {
              router.push(`/plot/${encodeURIComponent(pid)}?sub=documents`);
            } else {
              router.push('/documents');
            }
          },
        },
        {
          text: t('declarations_continue_photos'),
          onPress: () => setShowPhotosPage(true),
        },
      ]);
    } else {
      setShowPhotosPage(true);
    }
  };

  const capturePhotoForSlot = async (slot: 'north' | 'east' | 'south' | 'west') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6, exif: true });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const takenAt = Date.now();
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = roundWgs84Coordinate(pos.coords.latitude);
          longitude = roundWgs84Coordinate(pos.coords.longitude);
        }
      } catch {
        // Geo tag optional if location unavailable
      }
      setPhotoSlots((prev) => ({
        ...prev,
        [slot]: { uri: asset.uri, takenAt, latitude, longitude },
      }));
    } catch (e) {
      Alert.alert('Camera error', e instanceof Error ? e.message : 'Could not open camera.');
    }
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
          <Pressable
            onPress={() => {
              if (showRegistrationPage) {
                setShowRegistrationPage(false);
                return;
              }
              if (showCompletionPage) {
                setShowCompletionPage(false);
                setShowPhotosPage(true);
                return;
              }
              if (showPhotosPage) {
                setShowPhotosPage(false);
                setShowDeclarationsPage(true);
                return;
              }
              if (showDeclarationsPage) {
                setShowDeclarationsPage(false);
                setShowProducerProfilePage(true);
                return;
              }
              if (showProducerProfilePage) {
                setShowProducerProfilePage(false);
                setShowRegistrationPage(true);
                return;
              }
              if (selectedMethodPage) {
                setSelectedMethodPage(null);
                return;
              }
              if (showDetailedForm) {
                if (editingPlot) {
                  router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
                  return;
                }
                setShowDetailedForm(false);
                return;
              }
              if (editingPlot) {
                router.replace(`/plot/${encodeURIComponent(editingPlot.id)}`);
                return;
              }
              navigateHome(router);
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              Back
            </ThemedText>
          </Pressable>
          <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.headerTitleCompact}>
            {showRegistrationPage
              ? t('walk_header_registration')
              : showProducerProfilePage
              ? t('plot_register_producer_later_title')
              : showCompletionPage
              ? t('walk_header_registration_complete')
              : showPhotosPage
              ? t('walk_header_ground_photos')
              : showDeclarationsPage
              ? t('walk_header_declarations')
              : showDetailedForm
              ? editingPlot
                ? t('walk_header_edit_boundary')
                : selectedMethodPage === 'walk'
                  ? t('walk_header_walk_my_plot')
                  : selectedMethodPage === 'draw'
                    ? t('walk_method_draw')
                    : selectedMethodPage === 'centroid'
                      ? t('walk_method_centroid')
                      : t('walk_header_register_plot')
              : t('walk_header_register_plot')}
          </ThemedText>
          <View style={styles.langPill}>
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
      <ThemedScrollView
        scrollEnabled={!isWalkLandingState}
        contentContainerStyle={[styles.container, isWalkLandingState && styles.containerLanding]}
      >
        {!showDetailedForm ? (
          <>
            <Card variant="outlined" style={styles.plotLandingHeroCard}>
              <View style={styles.plotLandingHeroRow}>
                <View style={styles.plotLandingIconWrap}>
                  <Ionicons name="walk-outline" size={28} color="#0A7F59" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.plotLandingHeadline}>
                    {t('walk_landing_headline')}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.plotLandingSubhead}>
                    {t('walk_landing_subhead')}
                  </ThemedText>
                </View>
              </View>
            </Card>

            <Card variant="elevated" style={styles.card}>
              <CardHeader>
                <ThemedText type="subtitle">{t('walk_plot_name_label')}</ThemedText>
              </CardHeader>
              <CardContent>
                <Input
                  label=""
                  placeholder={t('walk_plot_name_ph')}
                  value={plotName}
                  onChangeText={setPlotName}
                />
                {farmer?.name?.trim() ? (
                  <ThemedText type="caption" style={{ marginTop: 8, color: '#6B7280' }}>
                    {t('plot_register_recording_as', { name: farmer.name.trim() })}
                  </ThemedText>
                ) : null}
              </CardContent>
            </Card>

            <Card variant="elevated" style={styles.card}>
              <CardHeader>
                <ThemedText type="subtitle">{t('walk_estimated_size')}</ThemedText>
              </CardHeader>
              <CardContent>
                <View style={styles.sizeGrid}>
                  <Pressable
                    onPress={() => setEstimatedSize('lt4')}
                    style={[
                      styles.sizeCard,
                      estimatedSize === 'lt4' && styles.sizeCardSelected,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">{t('walk_size_under_4')}</ThemedText>
                    <ThemedText type="caption" style={{ marginTop: 6 }}>
                      {t('walk_size_under_4_body')}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setEstimatedSize('gte4')}
                    style={[
                      styles.sizeCard,
                      estimatedSize === 'gte4' && styles.sizeCardSelected,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">{t('walk_size_over_4')}</ThemedText>
                    <ThemedText type="caption" style={{ marginTop: 6 }}>
                      {t('walk_size_over_4_body')}
                    </ThemedText>
                  </Pressable>
                </View>
              </CardContent>
            </Card>

            <Pressable
              onPress={() =>
                Alert.alert(t('walk_contiguity_title'), t('walk_contiguity_body'))
              }
              style={styles.contiguityHelpLink}
            >
              <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
              <ThemedText type="caption" style={styles.contiguityHelpText}>
                {t('walk_contiguity_title')}
              </ThemedText>
            </Pressable>

            <View style={styles.continueButtonWrap}>
              <Button
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
          </>
        ) : null}

        {showDetailedForm ? (
        <>
        {selectedMethodPage === null ? (
        <View style={styles.captureMethodsSection}>
          <ThemedText type="caption" style={styles.captureMethodsIntro}>
            {t('walk_capture_intro')}
          </ThemedText>
          <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => {
                  setCaptureMethod('walk');
                  setCaptureMode('walk');
                  setSelectedMethodPage('walk');
                }}
                style={[
                  styles.captureCard,
                  captureMethod === 'walk' && styles.captureCardSelected,
                ]}
              >
                <View style={styles.captureIconPillWalk}>
                  <Ionicons name="paper-plane-outline" size={26} color={Brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.captureTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.captureTitleText}>
                      {t('walk_method_walk')}
                    </ThemedText>
                    <View style={styles.recommendedPill}>
                      <ThemedText numberOfLines={1} type="caption" style={styles.recommendedPillText}>
                        {t('walk_method_walk_recommended')}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="caption" style={styles.captureBodyText}>
                    {t('walk_method_walk_body')}
                  </ThemedText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setCaptureMethod('draw');
                  setCaptureMode('manual_trace');
                  setSelectedMethodPage('draw');
                }}
                style={[
                  styles.captureCard,
                  captureMethod === 'draw' && styles.captureCardSelected,
                ]}
              >
                <View style={styles.captureIconPillDraw}>
                  <Ionicons name="create-outline" size={26} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.captureTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.captureTitleText}>
                      {t('walk_method_draw')}
                    </ThemedText>
                    <View style={styles.fallbackPill}>
                      <ThemedText type="caption" style={styles.fallbackPillText}>
                        {t('walk_method_draw_fallback')}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#A3A3A3" style={styles.captureChevron} />
                  </View>
                  <ThemedText type="caption" style={styles.captureBodyText}>
                    {t('walk_method_draw_body')}
                  </ThemedText>
                </View>
              </Pressable>

              {estimatedSize === 'lt4' ? (
                <Pressable
                  onPress={() => {
                    setCaptureMethod('centroid');
                    setSelectedMethodPage('centroid');
                  }}
                  style={[
                    styles.captureCard,
                    captureMethod === 'centroid' && styles.captureCardSelected,
                  ]}
                >
                  <View style={styles.captureIconPillCentroid}>
                    <Ionicons name="locate-outline" size={26} color="#7E22CE" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.captureTitleRow}>
                      <ThemedText type="defaultSemiBold" style={styles.captureTitleText}>
                        {t('walk_method_centroid')}
                      </ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#A3A3A3" style={styles.captureChevron} />
                    </View>
                    <ThemedText type="caption" style={styles.captureBodyText}>
                      {t('walk_method_centroid_body')}
                    </ThemedText>
                  </View>
                </Pressable>
              ) : null}
          </View>
        </View>
        ) : null}

        {false ? (
        <Card variant="outlined" style={[styles.card, styles.captureFlowCard]}>
          <CardHeader>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-circle-outline" size={22} color={Brand.primary} />
              <ThemedText type="subtitle">{t('farmer_identity')}</ThemedText>
              {hasFarmerAccess ? (
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              ) : null}
            </View>
          </CardHeader>
          <CardContent>
            <Input
              label={t('farmer_id_label')}
              placeholder={t('farmer_id_placeholder')}
              value={farmerIdInput}
              onChangeText={setFarmerIdInput}
              autoCapitalize="none"
            />
            {farmerIdInput.trim().length > 0 && !isUuid(farmerIdInput.trim()) ? (
              <ThemedText type="caption" style={{ marginTop: 8, color: Brand.warning }}>
                Farmer ID must be a UUID (from your backend user), e.g. `550e8400-e29b-41d4-a716-446655440000`.
              </ThemedText>
            ) : null}
            <Input
              label={t('farmer_name_label')}
              placeholder={t('farmer_name_placeholder')}
              value={farmerNameInput}
              onChangeText={setFarmerNameInput}
              containerStyle={{ marginTop: 10 }}
            />

            <View style={{ marginTop: 12 }}>
              <Checkbox
                checked={acceptedDeclaration}
                onChange={(v) => v && setAcceptedDeclaration(true)}
                label={acceptedDeclaration ? t('declaration_button_accepted') : t('declaration_button_accept')}
                description={t('declaration_text')}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <ThemedText type="defaultSemiBold">{t('fpic_title')}</ThemedText>
              <Checkbox
                checked={fpicConsent}
                onChange={setFpicConsent}
                label={t('fpic_label')}
              />
              <Checkbox
                checked={laborNoChildLabor}
                onChange={async (checked) => {
                  const next = checked;
                  setLaborNoChildLabor(next);
                  if (!next) return;
                  const pid = farmerIdInput.trim();
                  if (!pid) return;
                  try {
                    const picked = await DocumentPicker.getDocumentAsync({
                      type: ['image/*', 'application/pdf', '*/*'],
                      copyToCacheDirectory: true,
                      multiple: false,
                    });
                    if (picked.canceled || !picked.assets?.[0]?.uri) return;
                    const asset = picked.assets[0];
                    persistPlotEvidenceItem({
                      plotId: `profile:${pid}`,
                      kind: 'labor_evidence',
                      uri: asset.uri,
                      mimeType: asset.mimeType ?? null,
                      label: asset.name ?? 'labor_no_child_evidence',
                      takenAt: Date.now(),
                    });
                    logAuditEvent({
                      userId: pid,
                      eventType: 'labor_evidence_added',
                      payload: {
                        kind: 'no_child_labor',
                        uri: asset.uri,
                        mimeType: asset.mimeType ?? null,
                      },
                    }).catch(() => undefined);
                  } catch {
                    // ignore
                  }
                }}
                label={t('labor_no_child')}
              />
              <Checkbox
                checked={laborNoForcedLabor}
                onChange={async (checked) => {
                  const next = checked;
                  setLaborNoForcedLabor(next);
                  if (!next) return;
                  const pid = farmerIdInput.trim();
                  if (!pid) return;
                  try {
                    const picked = await DocumentPicker.getDocumentAsync({
                      type: ['image/*', 'application/pdf', '*/*'],
                      copyToCacheDirectory: true,
                      multiple: false,
                    });
                    if (picked.canceled || !picked.assets?.[0]?.uri) return;
                    const asset = picked.assets[0];
                    persistPlotEvidenceItem({
                      plotId: `profile:${pid}`,
                      kind: 'labor_evidence',
                      uri: asset.uri,
                      mimeType: asset.mimeType ?? null,
                      label: asset.name ?? 'labor_no_forced_evidence',
                      takenAt: Date.now(),
                    });
                    logAuditEvent({
                      userId: pid,
                      eventType: 'labor_evidence_added',
                      payload: {
                        kind: 'no_forced_labor',
                        uri: asset.uri,
                        mimeType: asset.mimeType ?? null,
                      },
                    }).catch(() => undefined);
                  } catch {
                    // ignore
                  }
                }}
                label={t('labor_no_forced')}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSaveFarmerProfile}
                onPress={handleSaveFarmer}
              >
                {hasFarmerAccess ? t('farmer_set') : t('save_farmer')}
              </Button>
            </View>
          </CardContent>
        </Card>
        ) : null}

        {selectedMethodPage !== null ? (
        <Card variant="default" padding="none" style={[styles.card, styles.captureFlowCard]}>
          <CardContent>
            {showCompletionPage ? (
              <>
                <View style={styles.completionHero}>
                  <View style={styles.completionIconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={58} color="#0A7F59" />
                  </View>
                  <ThemedText type="title" style={styles.completionTitle}>
                    {t('walk_completion_title')}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.completionBody}>
                    {t('walk_completion_body')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.completionPlotName}>
                    {(plotName || defaultPlotName).trim()} · {area.hectares.toFixed(1)} ha
                  </ThemedText>
                </View>

                <Card variant="outlined" style={styles.completionStatusCard}>
                  <View style={styles.completionListRow}>
                    <View style={[styles.completionDot, { backgroundColor: '#10B981' }]} />
                    <ThemedText type="default">{t('walk_completion_gps_polygon')}</ThemedText>
                  </View>
                  <View style={styles.completionListRow}>
                    <View style={[styles.completionDot, { backgroundColor: '#F59E0B' }]} />
                    <ThemedText type="default">{t('walk_completion_photos', { n: 0 })}</ThemedText>
                  </View>
                  <View style={styles.completionListRow}>
                    <View style={[styles.completionDot, { backgroundColor: '#F59E0B' }]} />
                    <ThemedText type="default">{t('walk_completion_sign_declarations')}</ThemedText>
                  </View>
                  <ThemedText type="caption" style={styles.completionFinishLater}>
                    {t('walk_completion_finish_later')}
                  </ThemedText>
                </Card>

                {lastRegisteredPlotIdRef.current ? (
                  <View style={styles.completionChipRow}>
                    <Pressable
                      style={styles.completionChip}
                      onPress={() => {
                        const pid = lastRegisteredPlotIdRef.current;
                        if (pid) {
                          router.push(`/plot/${encodeURIComponent(pid)}?sub=photos`);
                        }
                      }}
                    >
                      <Ionicons name="camera-outline" size={16} color="#0A7F59" />
                      <ThemedText type="caption" style={styles.completionChipText}>
                        {t('walk_completion_add_photos')}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={styles.completionChip}
                      onPress={() => {
                        const pid = lastRegisteredPlotIdRef.current;
                        if (pid) {
                          router.push(`/plot/${encodeURIComponent(pid)}?sub=documents`);
                        }
                      }}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#0A7F59" />
                      <ThemedText type="caption" style={styles.completionChipText}>
                        {t('walk_completion_sign_declarations')}
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}

                <View style={{ marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ backgroundColor: '#0A7F59', minHeight: 56 }}
                    onPress={() => {
                      setShowCompletionPage(false);
                      setShowDetailedForm(false);
                      setSelectedMethodPage(null);
                      reset();
                      router.replace('/(tabs)/explore');
                    }}
                  >
                    {t('walk_completion_view_plots')}
                  </Button>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Button
                    variant="ghost"
                    fullWidth
                    style={{ backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: '#D1D5DB' }}
                    onPress={() => {
                      setShowCompletionPage(false);
                      setShowDetailedForm(false);
                      setSelectedMethodPage(null);
                      setPhotoSlots({ north: null, east: null, south: null, west: null });
                      reset();
                      setPlotName(defaultPlotName);
                      setCaptureMethod('walk');
                      setCaptureMode('walk');
                      setSelectedMethodPage('walk');
                      setShowDetailedForm(true);
                    }}
                  >
                    {t('walk_register_another')}
                  </Button>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Button variant="ghost" fullWidth onPress={() => navigateHome(router)}>
                    {t('back_to_home')}
                  </Button>
                </View>
              </>
            ) : showPhotosPage ? (
              <>
                <Card variant="outlined" style={styles.registrationIntroCard}>
                  <View style={styles.declarationsIntroRow}>
                    <Ionicons name="camera-outline" size={22} color="#0A7F59" />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
                        Ground-Truth Photo Vault
                      </ThemedText>
                      <ThemedText type="caption" style={{ marginTop: 4, color: '#1F6B57' }}>
                        Take 360-degree photos to prove land use and override satellite false-positives during EU audits.
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                <View style={styles.photoGrid}>
                  {(['north', 'east', 'south', 'west'] as const).map((slot) => (
                    <Pressable
                      key={slot}
                      style={[styles.photoSlot, photoSlots[slot] && styles.photoSlotCaptured]}
                      onPress={() => capturePhotoForSlot(slot)}
                    >
                      {photoSlots[slot] ? (
                        <>
                          <Image source={{ uri: photoSlots[slot]!.uri }} style={styles.photoPreview} />
                          <View style={styles.photoCapturedOverlay}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          </View>
                        </>
                      ) : (
                        <Ionicons name="camera-outline" size={38} color="#A5A5A5" />
                      )}
                      <ThemedText type="defaultSemiBold" style={[styles.photoSlotTitle, photoSlots[slot] && styles.photoSlotTitleCaptured]}>
                        {slot.charAt(0).toUpperCase() + slot.slice(1)}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.photoSlotHint}>
                        {photoSlots[slot]
                          ? photoSlots[slot]!.latitude != null && photoSlots[slot]!.longitude != null
                            ? 'Captured · geo-tagged'
                            : 'Captured'
                          : 'Tap to capture'}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <Card variant="outlined" style={styles.declarationNoteCard}>
                  <View style={styles.rowHeader}>
                    <ThemedText type="defaultSemiBold">Photos captured</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ color: '#C47A00' }}>
                      {photosCapturedCount}/4
                    </ThemedText>
                  </View>
                </Card>

                <View style={styles.photoActionRow}>
                  <View style={styles.buttonCell}>
                    <Button
                      variant="ghost"
                      fullWidth
                      size="sm"
                      style={{ backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: '#D1D5DB' }}
                      onPress={() => {
                        setShowPhotosPage(false);
                        setShowCompletionPage(true);
                      }}
                    >
                      Skip for Now
                    </Button>
                  </View>
                  <View style={styles.buttonCell}>
                    <Button
                      variant="secondary"
                      fullWidth
                      size="sm"
                      style={{ backgroundColor: photosCapturedCount < 4 ? '#E5E7EB' : '#0A7F59' }}
                      disabled={photosCapturedCount < 4}
                      onPress={async () => {
                        const plotId = lastRegisteredPlotIdRef.current;
                        if (plotId) {
                          for (const s of ['north', 'east', 'south', 'west'] as const) {
                            const ph = photoSlots[s];
                            if (!ph) continue;
                            try {
                              await persistPlotPhoto({
                                plotId,
                                uri: ph.uri,
                                takenAt: ph.takenAt,
                                latitude: ph.latitude ?? null,
                                longitude: ph.longitude ?? null,
                              });
                            } catch {
                              // SQLite errors are rare; continue with other slots
                            }
                          }
                          logAuditEvent({
                            userId: farmer?.id,
                            eventType: 'ground_truth_photos_persisted',
                            payload: {
                              plotId,
                              slots: (['north', 'east', 'south', 'west'] as const).filter((x) => photoSlots[x]),
                              geoTaggedCount: (['north', 'east', 'south', 'west'] as const).filter(
                                (x) => photoSlots[x]?.latitude != null && photoSlots[x]?.longitude != null,
                              ).length,
                            },
                          }).catch(() => undefined);
                        }
                        setShowPhotosPage(false);
                        setShowCompletionPage(true);
                      }}
                    >
                      Complete
                    </Button>
                  </View>
                </View>
              </>
            ) : showRegistrationPage ? (
              <>
                <Card variant="outlined" style={styles.registrationIntroCard}>
                  <View style={styles.declarationsIntroRow}>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#0A7F59" />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
                        Registration Completed
                      </ThemedText>
                      <ThemedText type="caption" style={{ marginTop: 4, color: '#1F6B57' }}>
                        Your plot boundary has been captured. Continue to complete required declarations.
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                <Card variant="outlined" style={styles.declarationNoteCard}>
                  <View style={styles.rowHeader}>
                    <ThemedText type="caption">Capture method</ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {captureMethod === 'walk' ? 'Walk perimeter' : captureMethod === 'draw' ? 'Draw on map' : 'Centroid'}
                    </ThemedText>
                  </View>
                  <View style={styles.rowHeader}>
                    <ThemedText type="caption">Waypoints</ThemedText>
                    <ThemedText type="defaultSemiBold">{points.length}</ThemedText>
                  </View>
                  <View style={styles.rowHeader}>
                    <ThemedText type="caption">Estimated area</ThemedText>
                    <ThemedText type="defaultSemiBold">{area.hectares.toFixed(1)} ha</ThemedText>
                  </View>
                </Card>

                <View style={{ marginTop: 10 }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ backgroundColor: '#0A7F59' }}
                    onPress={() => {
                      setShowRegistrationPage(false);
                      if (producerProfileComplete) {
                        openDeclarationsPage();
                      } else {
                        setShowProducerProfilePage(true);
                      }
                    }}
                  >
                    Continue
                  </Button>
                </View>
              </>
            ) : showProducerProfilePage ? (
              <>
                <Card variant="outlined" style={styles.declarationsIntroCard}>
                  <View style={styles.declarationsIntroRow}>
                    <Ionicons name="person-circle-outline" size={22} color="#0A7F59" />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B' }}>
                        {t('plot_register_producer_later_title')}
                      </ThemedText>
                      <ThemedText type="caption" style={{ marginTop: 4, color: '#1F6B57' }}>
                        {t('plot_register_producer_later_body')}
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                <Card variant="elevated" style={styles.card}>
                  <CardContent>
                    {__DEV__ ? (
                      <>
                        <Input
                          label={t('farmer_id_label')}
                          placeholder={t('farmer_id_placeholder')}
                          value={farmerIdInput}
                          onChangeText={setFarmerIdInput}
                          autoCapitalize="none"
                        />
                        {farmerIdInput.trim().length > 0 && !isUuid(farmerIdInput.trim()) ? (
                          <ThemedText type="caption" style={{ marginTop: 8, color: Brand.warning }}>
                            Use a UUID or leave blank — a local ID is created automatically.
                          </ThemedText>
                        ) : null}
                      </>
                    ) : null}
                    <Input
                      label={t('farmer_name_label')}
                      placeholder={t('farmer_name_placeholder')}
                      value={farmerNameInput}
                      onChangeText={setFarmerNameInput}
                      containerStyle={{ marginTop: 10 }}
                    />
                    <Input
                      label={t('simplified_declaration_postal_label')}
                      placeholder={t('simplified_declaration_postal_ph')}
                      value={postalInput}
                      onChangeText={setPostalInput}
                      multiline
                      containerStyle={{ marginTop: 10 }}
                    />
                    <ThemedText type="caption" style={{ marginTop: 12, marginBottom: 4 }}>
                      {t('simplified_declaration_geo_label')}
                    </ThemedText>
                    <ThemedText type="caption" style={{ marginBottom: 8, color: '#6B7280' }}>
                      {t('simplified_declaration_geo_body')}
                    </ThemedText>
                    {simplifiedDeclarationGeo ? (
                      <ThemedText type="caption" style={{ marginBottom: 8 }}>
                        {formatLatLon(
                          simplifiedDeclarationGeo.latitude,
                          simplifiedDeclarationGeo.longitude,
                        )}
                      </ThemedText>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => void captureSimplifiedDeclarationGeo()}
                      >
                        {t('simplified_declaration_capture_gps')}
                      </Button>
                      {simplifiedDeclarationGeo ? (
                        <Button variant="outline" size="sm" onPress={clearSimplifiedDeclarationGeo}>
                          {t('simplified_declaration_clear_gps')}
                        </Button>
                      ) : null}
                    </View>
                    <ThemedText type="caption" style={{ marginTop: 10, marginBottom: 6 }}>
                      {t('commodity_primary_label')}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {COMMODITY_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.code}
                          onPress={() => setCommodityCode(opt.code)}
                          style={[
                            styles.commodityChip,
                            commodityCode === opt.code && styles.commodityChipSelected,
                          ]}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <ThemedText
                              type="caption"
                              style={{
                                color: commodityCode === opt.code ? '#FFFFFF' : '#374151',
                                fontWeight: '600',
                              }}
                            >
                              {opt.label}
                            </ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                    {!canCompleteProducerProfileForm ? (
                      <ThemedText type="caption" style={{ marginTop: 10, color: Brand.warning }}>
                        {t('plot_register_producer_incomplete')}
                      </ThemedText>
                    ) : null}
                  </CardContent>
                </Card>

                <View style={{ marginTop: 10 }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ backgroundColor: '#0A7F59' }}
                    disabled={!canCompleteProducerProfileForm}
                    onPress={() => {
                      saveProducerProfileFromForm();
                      setShowProducerProfilePage(false);
                      openDeclarationsPage();
                    }}
                  >
                    {t('walk_continue')}
                  </Button>
                </View>
              </>
            ) : showDeclarationsPage ? (
              <>
                <Card variant="outlined" style={styles.declarationsIntroCard}>
                  <View style={styles.declarationsIntroRow}>
                    <Ionicons name="shield-outline" size={22} color="#D47B0B" />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={styles.declarationsIntroTitle}>
                        {declarationMode === 'plot-only'
                          ? t('declarations_plot_intro_title')
                          : t('declarations_intro_title')}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.declarationsIntroBody}>
                        {declarationMode === 'plot-only'
                          ? t('declarations_plot_intro_body')
                          : t('declarations_intro_body')}
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                {declarationMode === 'plot-only' ? (
                  <Card variant="outlined" style={styles.declarationNoteCard}>
                    <ThemedText type="defaultSemiBold">{t('declarations_producer_on_file_title')}</ThemedText>
                    <View style={{ gap: 6, marginTop: 8 }}>
                      <View style={styles.completionListRow}>
                        <View style={[styles.completionDot, { backgroundColor: '#10B981' }]} />
                        <ThemedText type="caption">{t('declarations_fpic_title')}</ThemedText>
                      </View>
                      <View style={styles.completionListRow}>
                        <View style={[styles.completionDot, { backgroundColor: '#10B981' }]} />
                        <ThemedText type="caption">{t('declarations_labor_title')}</ThemedText>
                      </View>
                    </View>
                  </Card>
                ) : null}

                <Card variant="outlined" style={styles.declarationNoteCard}>
                  <ThemedText type="defaultSemiBold">{t('production_system_label')}</ThemedText>
                  <ThemedText type="caption" style={{ marginTop: 6, marginBottom: 10, color: '#4B5563' }}>
                    {t('production_system_hint')}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {PRODUCTION_SYSTEM_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.id}
                        onPress={() => setProductionSystem(opt.id)}
                        style={[
                          styles.commodityChip,
                          productionSystem === opt.id && styles.commodityChipSelected,
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{
                            color: productionSystem === opt.id ? '#FFFFFF' : '#374151',
                            fontWeight: '600',
                          }}
                        >
                          {t(opt.labelKey)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </Card>

                <Pressable style={styles.declarationItemCard} onPress={() => setDeclLandTenure(!declLandTenure)}>
                  <View style={styles.declarationItemRow}>
                    <Checkbox checked={declLandTenure} onChange={setDeclLandTenure} />
                    <View style={styles.declarationItemContent}>
                      <ThemedText type="defaultSemiBold">{t('declarations_land_tenure_title')}</ThemedText>
                      <ThemedText type="caption" style={styles.declarationItemBody}>
                        {t('declarations_land_tenure_body')}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.declarationItemCard}
                  onPress={() => setDeclNoDeforestation(!declNoDeforestation)}
                >
                  <View style={styles.declarationItemRow}>
                    <Checkbox checked={declNoDeforestation} onChange={setDeclNoDeforestation} />
                    <View style={styles.declarationItemContent}>
                      <ThemedText type="defaultSemiBold">{t('declarations_no_deforestation_title')}</ThemedText>
                      <ThemedText type="caption" style={styles.declarationItemBody}>
                        {t('declarations_no_deforestation_body')}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>

                {declarationMode === 'full' ? (
                  <>
                    <Pressable style={styles.declarationItemCard} onPress={() => setFpicConsent(!fpicConsent)}>
                      <View style={styles.declarationItemRow}>
                        <Checkbox checked={fpicConsent} onChange={setFpicConsent} />
                        <View style={styles.declarationItemContent}>
                          <ThemedText type="defaultSemiBold">{t('declarations_fpic_title')}</ThemedText>
                          <ThemedText type="caption" style={styles.declarationItemBody}>
                            {t('declarations_fpic_body')}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.declarationItemCard}
                      onPress={() => {
                        const next = !(laborNoChildLabor && laborNoForcedLabor);
                        setLaborNoChildLabor(next);
                        setLaborNoForcedLabor(next);
                      }}
                    >
                      <View style={styles.declarationItemRow}>
                        <Checkbox
                          checked={laborNoChildLabor && laborNoForcedLabor}
                          onChange={(checked) => {
                            setLaborNoChildLabor(checked);
                            setLaborNoForcedLabor(checked);
                          }}
                        />
                        <View style={styles.declarationItemContent}>
                          <ThemedText type="defaultSemiBold">{t('declarations_labor_title')}</ThemedText>
                          <ThemedText type="caption" style={styles.declarationItemBody}>
                            {t('declarations_labor_body')}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  </>
                ) : null}

                <Card variant="outlined" style={styles.declarationNoteCard}>
                  <ThemedText type="caption" style={styles.declarationNoteText}>
                    {t('declarations_supporting_docs_note')}
                  </ThemedText>
                </Card>

                <View style={{ marginTop: 10 }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ backgroundColor: '#0A7F59' }}
                    disabled={
                      !declLandTenure ||
                      !declNoDeforestation ||
                      (declarationMode === 'full' &&
                        (!fpicConsent || !(laborNoChildLabor && laborNoForcedLabor)))
                    }
                    onPress={handleDeclarationsContinue}
                  >
                    {t('declarations_continue_photos')}
                  </Button>
                </View>
              </>
            ) : showCapturePage && captureMethod === 'walk' ? (
              <>
                <View style={[styles.walkMapPanel, { minHeight: walkMapHeight }]}>
                  {showWalkFieldPreview && points.length === 0 ? (
                    <Image
                      source={STORE_DEMO_WALK_FIELD_MAP}
                      style={[styles.walkMapDemo, { height: walkMapHeight }]}
                      resizeMode="cover"
                      accessibilityLabel={t('walk_title')}
                    />
                  ) : (
                    <MapView
                      style={[styles.walkMap, { height: walkMapHeight - 8 }]}
                      initialRegion={mapAnchorRegion}
                      region={points.length === 0 ? mapAnchorRegion : undefined}
                      mapType={walkMapType}
                    >
                      {offlineTilesEnabled ? (
                        <UrlTile
                          urlTemplate={getOfflineTilesUrlTemplate(offlineTilesPackId ?? undefined)}
                          maximumZ={18}
                          flipY={false}
                        />
                      ) : null}
                      {points.length > 0 ? (
                        <>
                          <Polyline
                            coordinates={[
                              ...points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
                              ...(points.length > 2
                                ? [{ latitude: points[0].latitude, longitude: points[0].longitude }]
                                : []),
                            ]}
                            strokeColor={Brand.primary}
                            strokeWidth={3}
                          />
                          <Marker
                            coordinate={{
                              latitude: points[points.length - 1].latitude,
                              longitude: points[points.length - 1].longitude,
                            }}
                            title={t('walk_last_point')}
                          />
                        </>
                      ) : null}
                    </MapView>
                  )}
                  <View style={styles.coordChip}>
                    <ThemedText type="caption">
                      {showWalkFieldPreview && points.length === 0
                        ? formatLatLon(
                            DEMO_WALK_FIELD_CENTER.latitude,
                            DEMO_WALK_FIELD_CENTER.longitude,
                          )
                        : formatLatLon(mapAnchorRegion.latitude, mapAnchorRegion.longitude)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.gpsStrip}>
                  <View style={[styles.gpsStripDot, { backgroundColor: gpsStrengthColor }]} />
                  <ThemedText type="defaultSemiBold" style={styles.gpsStripLabel}>
                    {t('walk_gps_signal')}: {gpsStrengthLabel}
                  </ThemedText>
                  {isWalkLandingState ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        Alert.alert(t('walk_instructions_title'), t('walk_instructions_body'))
                      }
                    >
                      <Ionicons name="information-circle-outline" size={18} color="#0A7F59" />
                    </Pressable>
                  ) : null}
                </View>

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

                {isWalkLandingState ? (
                  <>
                    <ThemedText type="caption" style={styles.walkTipText}>
                      {t('walk_tip_walk_edge')}
                    </ThemedText>
                    <View style={styles.walkStepsRow}>
                      {[
                        t('walk_tip_step_wait_gps'),
                        t('walk_tip_step_start'),
                        t('walk_tip_step_walk'),
                        t('walk_tip_step_return'),
                      ].map((label, index) => (
                        <View key={label} style={styles.walkStepChip}>
                          <View style={styles.walkStepNumber}>
                            <ThemedText type="caption" style={styles.walkStepNumberText}>
                              {index + 1}
                            </ThemedText>
                          </View>
                          <ThemedText numberOfLines={2} type="caption" style={styles.walkStepLabel}>
                            {label}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {isRecording ? (
                  <View style={styles.averagingTrackCompact}>
                    <View style={[styles.averagingFill, { width: `${averagingProgressPercent}%` }]} />
                  </View>
                ) : null}
              </>
            ) : showCapturePage && captureMethod === 'draw' ? (
              <>
                <Card variant="outlined" style={styles.drawInfoCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
                    <ThemedText type="defaultSemiBold" style={{ flex: 1, color: '#1E3A8A' }}>
                      Trace your plot boundary on the satellite map. Pinch to zoom and tap to add vertices.
                    </ThemedText>
                  </View>
                </Card>

                <View style={styles.drawMapPanel}>
                  <MapView
                    style={styles.drawMap}
                    initialRegion={mapAnchorRegion}
                    mapType={offlineTilesEnabled || lowDataMap ? 'none' : 'standard'}
                    onPress={(e) => {
                      const c = e.nativeEvent.coordinate;
                      addManualVertex(c.latitude, c.longitude);
                    }}
                  >
                    {offlineTilesEnabled ? (
                      <UrlTile
                        urlTemplate={getOfflineTilesUrlTemplate(offlineTilesPackId ?? undefined)}
                        maximumZ={18}
                        flipY={false}
                      />
                    ) : null}
                    {points.length > 0 ? (
                      <>
                        <Polyline
                          coordinates={[
                            ...points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
                            ...(points.length > 2
                              ? [{ latitude: points[0].latitude, longitude: points[0].longitude }]
                              : []),
                          ]}
                          strokeColor={Brand.primary}
                          strokeWidth={3}
                        />
                        {points.map((p, idx) => (
                          <Marker
                            key={`draw-point-${idx}`}
                            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                            title={`Point ${idx + 1}`}
                          />
                        ))}
                      </>
                    ) : null}
                  </MapView>

                  {points.length === 0 ? (
                    <View style={styles.drawMapOverlay}>
                      <Ionicons name="create-outline" size={54} color={Brand.primary} />
                      <ThemedText type="subtitle" style={{ marginTop: 10 }}>
                        Tap to add vertices
                      </ThemedText>
                      <ThemedText type="caption">Connect at least 3 points</ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.drawChip}>
                    <ThemedText type="caption">
                      {offlineTilesEnabled ? 'Offline satellite tiles loaded' : 'Online map active'}
                    </ThemedText>
                  </View>
                </View>
              </>
            ) : showCapturePage && captureMethod !== 'centroid' && captureMethod !== 'walk' ? (
              <View style={styles.buttonRow}>
                <View style={styles.buttonCell}>
                  <Button variant={mode === 'walk' ? 'primary' : 'secondary'} onPress={() => setCaptureMode('walk')} disabled={mode === 'walk'} fullWidth>
                    Walk
                  </Button>
                </View>
                <View style={styles.buttonCell}>
                  <Button variant={mode === 'vertex_avg' ? 'primary' : 'secondary'} onPress={() => setCaptureMode('vertex_avg')} disabled={mode === 'vertex_avg'} fullWidth>
                    X avg
                  </Button>
                </View>
                <View style={styles.buttonCell}>
                  <Button variant={mode === 'manual_trace' ? 'primary' : 'secondary'} onPress={() => setCaptureMode('manual_trace')} disabled={mode === 'manual_trace'} fullWidth>
                    Draw
                  </Button>
                </View>
              </View>
            ) : null}

            {showCapturePage && isWalkCaptureMode ? (
              <View style={{ gap: 8, marginTop: 8 }}>
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
                  <Pressable
                    onPress={() => setSelectedMethodPage(null)}
                    style={styles.otherWaysLink}
                  >
                    <ThemedText type="caption" style={styles.otherWaysLinkText}>
                      {t('walk_other_ways_map')}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                  </Pressable>
                ) : null}
                {!isWalkLandingState && (points.length > 0 || isRecording) ? (
                  <Button variant="ghost" onPress={reset} fullWidth>
                    {t('reset')}
                  </Button>
                ) : null}
              </View>
            ) : null}

            {showCapturePage && captureMethod !== 'draw' && captureMethod !== 'walk' ? (
              <View style={{ marginTop: isWalkLandingState ? 8 : 10 }}>
                <Button
                  variant="secondary"
                  style={{ backgroundColor: '#0A7F59' }}
                  icon={<Ionicons name="play-outline" size={20} color="#FFFFFF" />}
                  onPress={startRecording}
                  disabled={isRecording}
                  fullWidth
                >
                  {isRecording ? t('walk_recording') : captureMethod === 'centroid' ? t('walk_start_center') : t('walk_start_recording')}
                </Button>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && captureMethod !== 'draw' && captureMethod !== 'walk' ? (
              <View style={[styles.buttonRow, { marginTop: 10 }]}>
                <View style={styles.buttonCell}>
                  <Button variant="outline" onPress={stopRecording} disabled={!isRecording} fullWidth>
                    {t('stop')}
                  </Button>
                </View>
                <View style={styles.buttonCell}>
                  <Button variant="ghost" onPress={reset} disabled={!points.length && !isRecording} fullWidth>
                    {t('reset')}
                  </Button>
                </View>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && captureMethod === 'draw' ? (
              <View style={[styles.buttonRow, { marginTop: 12 }]}>
                <View style={styles.buttonCell}>
                  <Button variant="outline" onPress={undoLastVertex} disabled={!points.length} fullWidth>
                    Undo
                  </Button>
                </View>
                <View style={styles.buttonCell}>
                  <Button variant="danger" onPress={reset} disabled={!points.length} fullWidth>
                    Clear
                  </Button>
                </View>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && mode === 'vertex_avg' && isRecording ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                <Button
                  variant="secondary"
                  fullWidth
                  onPress={() => addAveragedVertex(vertexCycleSeconds)}
                >
                  {vertexCycleSeconds === 60 ? t('vertex_avg_60s') : t('vertex_avg_120s')}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => addAveragedVertex(vertexCycleSeconds === 60 ? 120 : 60)}
                >
                  {vertexCycleSeconds === 60 ? t('vertex_avg_120s') : t('vertex_avg_60s')}
                </Button>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && isRecording && captureMethod !== 'walk' ? (
              <View style={styles.statsGrid}>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    Time
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {formatTime(recordingSeconds)}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    Waypoints
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {waypointCount}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    Precision
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {precisionMeters != null ? `${precisionMeters.toFixed(0)}m` : '—'}
                  </ThemedText>
                </View>
                <View style={styles.statChip}>
                  <ThemedText type="caption" style={styles.statLabel}>
                    Area
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.statValue}>
                    {area.hectares > 0 ? `${area.hectares.toFixed(2)}ha` : '—'}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && captureMethod !== 'centroid' && captureMethod !== 'walk' ? (
            <View style={{ marginTop: 10 }}>
              <Button
                variant={captureMethod === 'draw' ? 'primary' : 'danger'}
                fullWidth
                onPress={() => {
                  if (editingPlot) {
                    handleSavePlot();
                    return;
                  }
                  handleSavePlot({ shortPath: true });
                }}
                disabled={!canSavePlot}
              >
                {editingPlot ? t('walk_save_boundary') : t('walk_complete_geolocation')}
              </Button>
            </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && estimatedSize === 'lt4' && captureMethod !== 'walk' ? (
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

            {!isWalkLandingState && showCapturePage && captureMethod !== 'walk' ? (
              <Input
                label={t('walk_declared_area_label')}
                placeholder={t('walk_declared_area_ph')}
                keyboardType="decimal-pad"
                value={declaredAreaHaInput}
                onChangeText={setDeclaredAreaHaInput}
                containerStyle={{ marginTop: 12 }}
              />
            ) : null}

            {!isWalkLandingState && showCapturePage && lastError ? <ThemedText type="subtitle">{lastError}</ThemedText> : null}

            {!isWalkLandingState && showCapturePage && captureMethod !== 'walk' ? (
              <View style={{ marginTop: 10 }}>
                <Checkbox
                  checked={lowDataMap}
                  onChange={setLowDataMap}
                  label={lowDataMap ? t('walk_low_data_on') : t('walk_low_data_off')}
                  description={t('walk_low_data_desc')}
                />
              </View>
            ) : null}

            {!isWalkLandingState && showCapturePage && mode === 'vertex_avg' && captureMethod !== 'walk' ? (
              <Card variant="outlined" style={styles.gpsInfoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Ionicons name="information-circle-outline" size={18} color={Brand.primary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">GPS averaging active</ThemedText>
                    <ThemedText type="caption">
                      Each waypoint averages 60+ seconds of readings to handle canopy interference.
                      Walk slowly and steadily.
                    </ThemedText>
                  </View>
                </View>
              </Card>
            ) : null}
          </CardContent>
        </Card>
        ) : null}

        {false ? (
        <Card variant="outlined" style={styles.card}>
          <CardHeader>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Brand.primary} />
              <ThemedText type="subtitle">Required declarations</ThemedText>
            </View>
          </CardHeader>
          <CardContent>
            <Checkbox
              checked={fpicConsent}
              onChange={setFpicConsent}
              label="FPIC consent"
              description="Free, Prior and Informed Consent obtained."
            />
            <Checkbox
              checked={laborNoChildLabor && laborNoForcedLabor}
              onChange={(checked) => {
                setLaborNoChildLabor(checked);
                setLaborNoForcedLabor(checked);
              }}
              label="Labor standards"
              description="No child or forced labor (ILO compliant)."
              style={{ marginTop: 8 }}
            />
            <Checkbox
              checked={declLandTenure}
              onChange={setDeclLandTenure}
              label="Land tenure"
              description="Legal right to use this land."
              style={{ marginTop: 8 }}
            />
            <Checkbox
              checked={declNoDeforestation}
              onChange={setDeclNoDeforestation}
              label="No deforestation"
              description="Land not deforested after Dec 31, 2020."
              style={{ marginTop: 8 }}
            />
          </CardContent>
        </Card>
        ) : null}


        </>
        ) : null}
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  completionHero: {
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 10,
    color: '#0B4F3B',
    textAlign: 'center',
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
  walkMapDemo: {
    width: '100%',
    height: 248,
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
  plotLandingHeroCard: {
    marginTop: 2,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F7F0',
    borderRadius: 18,
    padding: 16,
  },
  plotLandingHeroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  plotLandingIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotLandingHeadline: {
    color: '#0B4F3B',
    fontSize: scaleText(18),
    lineHeight: scaleText(26),
  },
  plotLandingSubhead: {
    marginTop: 6,
    color: '#1F6B57',
    fontSize: scaleText(14),
    lineHeight: scaleText(20),
  },
  contiguityHelpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  contiguityHelpText: {
    color: '#6B7280',
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
  averagingTrackCompact: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
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

