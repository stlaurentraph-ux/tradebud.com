import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { initDatabase, loadAppState, logAuditEvent, persistFarmer, persistPlots } from './persistence';

export type Role = 'farmer';

export type FarmerProfile = {
  id: string;
  name?: string;
  role: Role;
  selfDeclared: boolean;
  selfDeclaredAt?: number;
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
  addPlot: (input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerProfile | undefined>(undefined);
  const [plots, setPlots] = useState<Plot[]>([]);

  useEffect(() => {
    initDatabase();
    loadAppState().then((loaded) => {
      if (loaded.farmer) {
        setFarmerState(loaded.farmer);
      }
      if (loaded.plots.length > 0) {
        setPlots(loaded.plots);
      }
    });
  }, []);

  const setFarmer = (nextFarmer: FarmerProfile) => {
    setFarmerState(nextFarmer);
    persistFarmer(nextFarmer);
    logAuditEvent({
      userId: nextFarmer.id,
      eventType: 'farmer_set',
      payload: {
        role: nextFarmer.role,
        selfDeclared: nextFarmer.selfDeclared,
        selfDeclaredAt: nextFarmer.selfDeclaredAt ?? null,
      },
    });
  };

  const addPlot: AppStateContextValue['addPlot'] = (input) => {
    if (!farmer) {
      return;
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
      persistPlots(next);
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
      });
      return next;
    });
  };

  return (
    <AppStateContext.Provider value={{ farmer, plots, setFarmer, addPlot }}>
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

