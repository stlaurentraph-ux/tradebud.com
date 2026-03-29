import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { hydrateSyncAuthFromSettings } from '@/features/api/postPlot';
import {
  deletePlotLocalData,
  initDatabase,
  loadAppState,
  logAuditEvent,
  persistFarmer,
  persistPlots,
  saveFarmerProfilePhotoUri,
} from './persistence';

export type Role = 'farmer';

export type FarmerProfile = {
  id: string;
  name?: string;
  /** Local file URI for profile photo (settings-backed, not sent to backend by default). */
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
};

type AppStateContextValue = {
  farmer?: FarmerProfile;
  plots: Plot[];
  setFarmer: (farmer: FarmerProfile) => void;
  /** Returns the new plot id when created; undefined if no farmer or not called. */
  addPlot: (input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>) => string | undefined;
  renamePlot: (plotId: string, newName: string) => void;
  /** Merge fields into an existing plot (local persistence + audit). */
  updatePlot: (plotId: string, patch: Partial<Plot>) => void;
  removePlot: (plotId: string) => void;
  updateFarmerProfilePhoto: (uri: string | null) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerProfile | undefined>(undefined);
  const [plots, setPlots] = useState<Plot[]>([]);

  useEffect(() => {
    initDatabase()
      .then(() => hydrateSyncAuthFromSettings())
      .then(() => loadAppState())
      .then((loaded) => {
        if (loaded.farmer) {
          setFarmerState(loaded.farmer);
        }
        if (loaded.plots.length > 0) {
          setPlots(loaded.plots);
        }
      })
      .catch(() => undefined);
  }, []);

  const setFarmer = (nextFarmer: FarmerProfile) => {
    setFarmerState((prev) => {
      const merged: FarmerProfile = {
        ...nextFarmer,
        profilePhotoUri: nextFarmer.profilePhotoUri ?? prev?.profilePhotoUri,
      };
      persistFarmer(merged).catch(() => undefined);
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
  };

  const updateFarmerProfilePhoto: AppStateContextValue['updateFarmerProfilePhoto'] = (uri) => {
    setFarmerState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, profilePhotoUri: uri ?? undefined };
      saveFarmerProfilePhotoUri(uri).catch(() => undefined);
      return next;
    });
  };

  const addPlot: AppStateContextValue['addPlot'] = (input) => {
    if (!farmer) {
      return undefined;
    }

    const now = Date.now();
    const id = `${farmer.id}-${now}`;

    const plot: Plot = {
      id,
      farmerId: farmer.id,
      createdAt: now,
      ...input,
    };

    setPlots((prev) => {
      const next = [plot, ...prev];
      persistPlots(next).catch(() => undefined);
      logAuditEvent({
        userId: farmer.id,
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
  };

  return (
    <AppStateContext.Provider
      value={{
        farmer,
        plots,
        setFarmer,
        addPlot,
        renamePlot: (plotId: string, newName: string) => {
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
        },
        updatePlot: (plotId: string, patch: Partial<Plot>) => {
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
        },
        updateFarmerProfilePhoto,
        removePlot: (plotId: string) => {
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
        },
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

