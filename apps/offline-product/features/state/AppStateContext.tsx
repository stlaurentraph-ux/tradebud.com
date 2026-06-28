/**
 * AppStateContext (DEPRECATED - For backward compatibility only)
 *
 * This context is maintained for backward compatibility. New code should use:
 * - useFarmer() for farmer profile state
 * - usePlots() for plots state
 *
 * Rationale: Splitting state into separate contexts improves performance by
 * reducing unnecessary re-renders when only one part of state changes.
 *
 * See STATE_MIGRATION_GUIDE.md for migration instructions.
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { hydrateSyncAuthFromSettings } from '@/features/api/syncAuthSession';
import {
  farmerProfilesEqual,
  hasProducerAttestationsComplete,
  mergeFarmerProfileFromDisk,
  mergeFarmerProfileOnUpdate,
} from '@/features/compliance/farmerDeclarations';
import type { PlotGeometryCaptureMetadata } from '@/features/compliance/plotGeometryCapture';
import {
  deletePlotLocalData,
  initDatabase,
  loadAppState,
  logAuditEvent,
  persistFarmer,
  persistPlots,
  saveFarmerProfilePhotoUri,
} from './persistence';
import { queueFieldDevicePreferencesSync } from '@/features/sync/syncFieldDevicePreferences';
import { queueFarmerProfilePhotoSync } from '@/features/sync/syncFarmerProfilePhoto';

export type Role = 'farmer';

export type FarmerProfile = {
  id: string;
  name?: string;
  /** Local file URI for profile photo (synced via audit + Supabase Storage when signed in). */
  profilePhotoUri?: string | null;
  role: Role;
  selfDeclared: boolean;
  selfDeclaredAt?: number;
  fpicConsent?: boolean;
  laborNoChildLabor?: boolean;
  laborNoForcedLabor?: boolean;
  /** One-time simplified declaration: postal or mailing address (EUDR micro/small operator path). */
  postalAddress?: string;
  /** Primary commodity for this producer (HS-style codes later; values: coffee, cocoa, rubber, soy, timber). */
  commodityCode?: string;
  /**
   * Optional WGS84 point for micro/small simplified declaration path (postal OR basic geolocation).
   * Six-decimal precision when captured from the device.
   */
  declarationLatitude?: number;
  declarationLongitude?: number;
  declarationGeoCapturedAt?: number;
};

export type PlotPoint = {
  latitude: number;
  longitude: number;
};

export type Plot = {
  id: string;
  farmerId: string;
  name: string;
  createdAt: number;
  areaSquareMeters: number;
  areaHectares: number;
  kind: 'point' | 'polygon';
  points: PlotPoint[];
  declaredAreaHectares?: number;
  discrepancyPercent?: number;
  precisionMetersAtSave?: number | null;
  geometryCapture?: PlotGeometryCaptureMetadata;
  landTenureDeclared?: boolean;
  landTenureDeclaredAt?: number;
  noDeforestationDeclared?: boolean;
  noDeforestationDeclaredAt?: number;
};

type AppStateContextValue = {
  farmer?: FarmerProfile;
  /** Stable display name — never flashes empty while the same farmer id is active. */
  farmerDisplayName?: string;
  plots: Plot[];
  /** True after SQLite init + auth hydrate + first disk load attempt finishes. */
  isAppReady: boolean;
  setFarmer: (farmer: FarmerProfile) => void;
  /** Persist farmer to SQLite and update in-memory state (await for critical saves). */
  saveFarmer: (farmer: FarmerProfile) => Promise<void>;
  /** Returns the new plot id when created; undefined if no farmer id is available. */
  addPlot: (
    input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>,
    options?: { farmerId?: string },
  ) => string | undefined;
  renamePlot: (plotId: string, newName: string) => void;
  /** Merge fields into an existing plot (local persistence + audit). */
  updatePlot: (plotId: string, patch: Partial<Plot>) => void;
  removePlot: (plotId: string) => void;
  updateFarmerProfilePhoto: (uri: string | null) => void;
  /** Reload farmer + plots from SQLite. */
  reloadFromDisk: () => Promise<void>;
  /** True when SQLite init / first disk load failed — state may be incomplete; do not treat as a fresh install. */
  bootError: boolean;
  /** Re-attempt the SQLite boot sequence after a {@link bootError}. */
  retryBoot: () => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function shouldHealFarmerProfileOnDisk(
  merged: FarmerProfile | undefined,
  diskFarmer: FarmerProfile | undefined,
): merged is FarmerProfile {
  if (!merged) return false;
  const mergedName = merged.name?.trim();
  const diskName = diskFarmer?.name?.trim();
  if (mergedName && !diskName) return true;
  return (
    hasProducerAttestationsComplete(merged) &&
    !hasProducerAttestationsComplete(diskFarmer)
  );
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerProfile | undefined>(undefined);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [bootNonce, setBootNonce] = useState(0);
  const reloadGenerationRef = useRef(0);

  const retryBoot = useCallback(() => {
    setBootError(false);
    setIsAppReady(false);
    setBootNonce((nonce) => nonce + 1);
  }, []);
  const displayNameByFarmerIdRef = useRef<Map<string, string>>(new Map());

  const farmerDisplayName = useMemo(() => {
    const id = farmer?.id?.trim();
    const current = farmer?.name?.trim();
    if (id && current) {
      displayNameByFarmerIdRef.current.set(id, current);
      return current;
    }
    if (id) {
      return displayNameByFarmerIdRef.current.get(id);
    }
    return undefined;
  }, [farmer?.id, farmer?.name]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let bootFailed = false;
      try {
        await initDatabase();
        await hydrateSyncAuthFromSettings();
        const loaded = await loadAppState();
        if (!cancelled) {
          if (loaded.farmer) {
            setFarmerState((prev) => {
              const merged = mergeFarmerProfileFromDisk(prev, loaded.farmer) ?? loaded.farmer;
              if (shouldHealFarmerProfileOnDisk(merged, loaded.farmer)) {
                persistFarmer(merged).catch(() => undefined);
              }
              return merged;
            });
          }
          if (loaded.plots.length > 0) setPlots(loaded.plots);
          setBootError(false);
        }
      } catch (error) {
        bootFailed = true;
        // A boot failure must not masquerade as a fresh install: surface it so the UI can
        // offer recovery instead of presenting empty state that could overwrite real data.
        if (!cancelled) {
          setBootError(true);
        }
        if (__DEV__) {
          console.warn('[AppState] boot failed', error);
        }
        void import('@/features/observability/sentryClient')
          .then((module) => module.reportErrorToSentry(error, { scope: 'app_state_boot' }))
          .catch(() => undefined);
      } finally {
        if (!cancelled) {
          setIsAppReady(true);
          if (process.env.EXPO_PUBLIC_MAESTRO_CI === '1' && Platform.OS === 'android') {
            console.warn(`[MaestroBoot] app state ready bootError=${bootFailed}`);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootNonce]);

  const persistMergedFarmer = useCallback((merged: FarmerProfile) => {
    persistFarmer(merged).catch(() => undefined);
  }, []);

  const reloadFromDisk = useCallback(async () => {
    const generation = ++reloadGenerationRef.current;
    const loaded = await loadAppState();
    if (generation !== reloadGenerationRef.current) return;
    setFarmerState((prev) => {
      const merged = mergeFarmerProfileFromDisk(prev, loaded.farmer);
      if (merged && prev && farmerProfilesEqual(prev, merged)) {
        return prev;
      }
      if (shouldHealFarmerProfileOnDisk(merged, loaded.farmer)) {
        persistMergedFarmer(merged);
      }
      return merged;
    });
    setPlots(loaded.plots);
  }, [persistMergedFarmer]);

  const setFarmer = useCallback((nextFarmer: FarmerProfile) => {
    setFarmerState((prev) => {
      const merged = mergeFarmerProfileOnUpdate(prev, nextFarmer);
      persistMergedFarmer(merged);
      return merged;
    });
    logAuditEvent({
      userId: nextFarmer.id,
      eventType: 'farmer_set',
      payload: {
        role: nextFarmer.role,
        selfDeclared: nextFarmer.selfDeclared,
        selfDeclaredAt: nextFarmer.selfDeclaredAt ?? null,
        fpicConsent: nextFarmer.fpicConsent ?? null,
        laborNoChildLabor: nextFarmer.laborNoChildLabor ?? null,
        laborNoForcedLabor: nextFarmer.laborNoForcedLabor ?? null,
        postalAddress: nextFarmer.postalAddress ?? null,
        commodityCode: nextFarmer.commodityCode ?? null,
        declarationLatitude: nextFarmer.declarationLatitude ?? null,
        declarationLongitude: nextFarmer.declarationLongitude ?? null,
        declarationGeoCapturedAt: nextFarmer.declarationGeoCapturedAt ?? null,
      },
    }).catch(() => undefined);
    void queueFieldDevicePreferencesSync(nextFarmer).catch(() => undefined);
  }, [persistMergedFarmer]);

  const saveFarmer = useCallback(async (nextFarmer: FarmerProfile) => {
    let merged!: FarmerProfile;
    setFarmerState((prev) => {
      merged = mergeFarmerProfileOnUpdate(prev, nextFarmer);
      return merged;
    });
    await persistFarmer(merged);
    logAuditEvent({
      userId: merged.id,
      eventType: 'farmer_set',
      payload: {
        role: merged.role,
        selfDeclared: merged.selfDeclared,
        selfDeclaredAt: merged.selfDeclaredAt ?? null,
        fpicConsent: merged.fpicConsent ?? null,
        laborNoChildLabor: merged.laborNoChildLabor ?? null,
        laborNoForcedLabor: merged.laborNoForcedLabor ?? null,
        postalAddress: merged.postalAddress ?? null,
        commodityCode: merged.commodityCode ?? null,
        declarationLatitude: merged.declarationLatitude ?? null,
        declarationLongitude: merged.declarationLongitude ?? null,
        declarationGeoCapturedAt: merged.declarationGeoCapturedAt ?? null,
      },
    }).catch(() => undefined);
  }, []);

  const updateFarmerProfilePhoto = useCallback((uri: string | null) => {
    setFarmerState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, profilePhotoUri: uri ?? undefined };
      saveFarmerProfilePhotoUri(uri).catch(() => undefined);
      void queueFarmerProfilePhotoSync({ farmerId: prev.id, localUri: uri }).catch(() => undefined);
      return next;
    });
  }, []);

  const addPlot = useCallback<AppStateContextValue['addPlot']>((input, options) => {
    const farmerId = options?.farmerId?.trim() || farmer?.id;
    if (!farmerId) {
      return undefined;
    }

    const now = Date.now();
    const id = `${farmerId}-${now}`;

    const plot: Plot = {
      id,
      farmerId,
      createdAt: now,
      ...input,
    };

    setPlots((prev) => {
      const next = [plot, ...prev];
      persistPlots(next).catch(() => undefined);
      logAuditEvent({
        userId: farmerId,
        eventType: 'plot_created',
        payload: {
          plotId: plot.id,
          areaHectares: plot.areaHectares,
          kind: plot.kind,
          declaredAreaHectares: plot.declaredAreaHectares ?? null,
          discrepancyPercent: plot.discrepancyPercent ?? null,
          precisionMetersAtSave: plot.precisionMetersAtSave ?? null,
        },
      }).catch(() => undefined);
      return next;
    });
    return id;
  }, [farmer]);

  const renamePlot = useCallback((plotId: string, newName: string) => {
    setPlots((prev) => {
      const next = prev.map((p) =>
        p.id === plotId
          ? {
              ...p,
              name: newName,
            }
          : p,
      );
      persistPlots(next).catch(() => undefined);
      return next;
    });
  }, []);

  const updatePlot = useCallback((plotId: string, patch: Partial<Plot>) => {
    setPlots((prev) => {
      const idx = prev.findIndex((p) => p.id === plotId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      persistPlots(next).catch(() => undefined);
      logAuditEvent({
        userId: farmer?.id,
        eventType: 'plot_updated',
        payload: { plotId, patch },
      }).catch(() => undefined);
      return next;
    });
  }, [farmer?.id]);

  const removePlot = useCallback((plotId: string) => {
    setPlots((prev) => {
      const target = prev.find((p) => p.id === plotId);
      const next = prev.filter((p) => p.id !== plotId);
      persistPlots(next).catch(() => undefined);
      deletePlotLocalData(plotId).catch(() => undefined);
      if (target) {
        logAuditEvent({
          userId: farmer?.id,
          eventType: 'plot_deleted',
          payload: {
            plotId,
            name: target.name,
            areaHectares: target.areaHectares,
            kind: target.kind,
          },
        }).catch(() => undefined);
      }
      return next;
    });
  }, [farmer?.id]);

  const value = useMemo(
    () => ({
      farmer,
      farmerDisplayName,
      plots,
      isAppReady,
      setFarmer,
      saveFarmer,
      addPlot,
      renamePlot,
      updatePlot,
      removePlot,
      updateFarmerProfilePhoto,
      reloadFromDisk,
      bootError,
      retryBoot,
    }),
    [
      farmer,
      farmerDisplayName,
      plots,
      isAppReady,
      setFarmer,
      saveFarmer,
      addPlot,
      renamePlot,
      updatePlot,
      removePlot,
      updateFarmerProfilePhoto,
      reloadFromDisk,
      bootError,
      retryBoot,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

/**
 * Primary app state hook — reads from AppStateProvider.
 * FarmerProvider/PlotsProvider are optional split contexts for future migration.
 */
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
