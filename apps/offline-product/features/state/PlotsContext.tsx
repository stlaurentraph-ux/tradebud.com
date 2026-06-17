/**
 * PlotsContext - Separated state management for plots
 *
 * This context handles all plot-related state and operations, separated from
 * farmer profile state to improve performance and reduce re-renders.
 *
 * Migration: Use both PlotsContext and FarmerContext instead of AppStateContext.
 * A compatibility shim AppStateContext can re-export both for backward compatibility.
 */

import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import {
  persistPlots,
  logAuditEvent,
  deletePlotLocalData,
} from './persistence';
import { logError } from '../errors/ErrorLogger';

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
  geometryCapture?: import('@/features/compliance/plotGeometryCapture').PlotGeometryCaptureMetadata;
};

type PlotsContextValue = {
  plots: Plot[];
  /** Returns the new plot id when created; undefined if no farmer or not called. */
  addPlot: (input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>, farmerId: string) => string | undefined;
  renamePlot: (plotId: string, newName: string) => void;
  /** Merge fields into an existing plot (local persistence + audit). */
  updatePlot: (plotId: string, patch: Partial<Plot>, farmerId?: string) => void;
  removePlot: (plotId: string, farmerId?: string) => void;
  setPlots: (plots: Plot[]) => void;
  /** Get a single plot by ID */
  getPlot: (plotId: string) => Plot | undefined;
  /** Get all plots for a specific farmer */
  getPlotsForFarmer: (farmerId: string) => Plot[];
};

const PlotsContext = createContext<PlotsContextValue | undefined>(undefined);

export function PlotsProvider({ children }: { children: ReactNode }) {
  const [plots, setPlots] = useState<Plot[]>([]);

  // Memoized getters to avoid inline function creation
  const getPlot = useCallback((plotId: string): Plot | undefined => {
    return plots.find((p) => p.id === plotId);
  }, [plots]);

  const getPlotsForFarmer = useCallback((farmerId: string): Plot[] => {
    return plots.filter((p) => p.farmerId === farmerId);
  }, [plots]);

  const addPlot = useCallback(
    (input: Omit<Plot, 'id' | 'farmerId' | 'createdAt'>, farmerId: string): string | undefined => {
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
        persistPlots(next).catch((err) => {
          logError(err, { context: 'add_plot', action: 'persist' });
        });

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
        }).catch((err) => {
          logError(err, { context: 'add_plot', action: 'audit_log' });
        });

        return next;
      });

      return id;
    },
    []
  );

  const renamePlot = useCallback((plotId: string, newName: string) => {
    setPlots((prev) => {
      const idx = prev.findIndex((p) => p.id === plotId);
      if (idx < 0) return prev;

      const next = [...prev];
      next[idx] = { ...next[idx], name: newName };

      persistPlots(next).catch((err) => {
        logError(err, { context: 'rename_plot', plotId });
      });

      return next;
    });
  }, []);

  const updatePlot = useCallback(
    (plotId: string, patch: Partial<Plot>, farmerId?: string) => {
      setPlots((prev) => {
        const idx = prev.findIndex((p) => p.id === plotId);
        if (idx < 0) return prev;

        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };

        persistPlots(next).catch((err) => {
          logError(err, { context: 'update_plot', plotId });
        });

        if (farmerId) {
          logAuditEvent({
            userId: farmerId,
            eventType: 'plot_updated',
            payload: { plotId, patch },
          }).catch((err) => {
            logError(err, { context: 'update_plot', action: 'audit_log' });
          });
        }

        return next;
      });
    },
    []
  );

  const removePlot = useCallback((plotId: string, farmerId?: string) => {
    setPlots((prev) => {
      const target = prev.find((p) => p.id === plotId);
      const next = prev.filter((p) => p.id !== plotId);

      persistPlots(next).catch((err) => {
        logError(err, { context: 'remove_plot', plotId });
      });

      deletePlotLocalData(plotId).catch((err) => {
        logError(err, { context: 'remove_plot', action: 'delete_data' });
      });

      if (target && farmerId) {
        logAuditEvent({
          userId: farmerId,
          eventType: 'plot_deleted',
          payload: {
            plotId,
            name: target.name,
            areaHectares: target.areaHectares,
            kind: target.kind,
          },
        }).catch((err) => {
          logError(err, { context: 'remove_plot', action: 'audit_log' });
        });
      }

      return next;
    });
  }, []);

  return (
    <PlotsContext.Provider
      value={{
        plots,
        addPlot,
        renamePlot,
        updatePlot,
        removePlot,
        setPlots,
        getPlot,
        getPlotsForFarmer,
      }}
    >
      {children}
    </PlotsContext.Provider>
  );
}

export function usePlots() {
  const ctx = useContext(PlotsContext);
  if (!ctx) {
    throw new Error('usePlots must be used within PlotsProvider');
  }
  return ctx;
}
