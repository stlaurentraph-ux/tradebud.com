'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDemoData } from '@/lib/demo-data-context';
import { getPlotById } from '@/lib/mocks/plots';
import { normalizePlotKind, type PlotKind } from '@/lib/plot-inventory';
import type { PlotGroundTruthPhotoSummary } from '@/lib/plot-eudr-readiness';
import { defaultGroundTruthPhotoSummary, normalizeGroundTruthPhotoSummary } from '@/lib/plot-eudr-readiness';
export type PlotMapPreviewRecord = {
  id: string;
  name: string;
  kind: PlotKind;
  area_ha: number | null;
  status: string;
  farmer_id?: string;
  farmer_name?: string | null;
  geometry: Record<string, unknown> | null;
  ground_truth_photos?: PlotGroundTruthPhotoSummary | Record<string, unknown> | null;
  geometry_capture?: Record<string, unknown> | null;
};

const DEMO_GEOMETRIES: Record<string, Record<string, unknown>> = {
  plot_001: {
    type: 'Polygon',
    coordinates: [
      [
        [30.0612, -1.9441],
        [30.0624, -1.9441],
        [30.0624, -1.9432],
        [30.0612, -1.9432],
        [30.0612, -1.9441],
      ],
    ],
  },
  plot_002: {
    type: 'Point',
    coordinates: [29.635, -1.499],
  },
};

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function buildDemoPreview(plotId: string): PlotMapPreviewRecord | null {
  const plot = getPlotById(plotId);
  if (!plot) return null;
  return {
    id: plot.id,
    name: plot.name,
    kind: plot.geometry ? 'polygon' : 'point',
    area_ha: plot.area_hectares,
    status: plot.verified ? 'compliant' : 'under_review',
    farmer_id: plot.farmer_id,
    geometry: DEMO_GEOMETRIES[plot.id] ?? {
      type: 'Point',
      coordinates: [30.06 + (plot.id.charCodeAt(plot.id.length - 1) % 10) * 0.002, -1.94],
    },
    ground_truth_photos: defaultGroundTruthPhotoSummary(),
  };
}

function normalizePreview(payload: unknown): PlotMapPreviewRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;

  const areaRaw = row.area_ha;
  const areaHa =
    typeof areaRaw === 'number'
      ? areaRaw
      : typeof areaRaw === 'string'
        ? Number(areaRaw)
        : null;

  return {
    id,
    name: typeof row.name === 'string' ? row.name : `Plot ${id.slice(0, 8)}`,
    kind: normalizePlotKind(row.kind),
    area_ha: Number.isFinite(areaHa) ? areaHa : null,
    status: typeof row.status === 'string' ? row.status : 'unknown',
    farmer_id: typeof row.farmer_id === 'string' ? row.farmer_id : undefined,
    farmer_name: typeof row.farmer_name === 'string' ? row.farmer_name : null,
    geometry:
      row.geometry && typeof row.geometry === 'object'
        ? (row.geometry as Record<string, unknown>)
        : null,
    ground_truth_photos: row.ground_truth_photos
      ? normalizeGroundTruthPhotoSummary(row.ground_truth_photos)
      : defaultGroundTruthPhotoSummary(),
    geometry_capture: row.geometry_capture
      ? (row.geometry_capture as Record<string, unknown>)
      : null,
  };
}

export function usePlotMapPreview(plotId: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { demoDataEnabled } = useDemoData();
  const [preview, setPreview] = useState<PlotMapPreviewRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!plotId || !enabled) return;
    setIsLoading(true);
    setError(null);

    if (demoDataEnabled) {
      setPreview(buildDemoPreview(plotId));
      setIsLoading(false);
      return;
    }

    fetch(`/api/plots/${encodeURIComponent(plotId)}/map-preview`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? 'Plot map preview unavailable.');
        }
        const normalized = normalizePreview(body);
        if (!normalized) {
          throw new Error('Plot map preview response was invalid.');
        }
        setPreview(normalized);
      })
      .catch((loadError) => {
        setPreview(null);
        setError(loadError instanceof Error ? loadError.message : 'Plot map preview unavailable.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [plotId, demoDataEnabled, enabled]);

  useEffect(() => {
    if (!plotId || !enabled) {
      if (!enabled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
        setIsLoading(false);
      } else {
        setPreview(null);
        setError(null);
        setIsLoading(false);
      }
      return;
    }
    reload();
  }, [plotId, reload, enabled]);

  return { preview, isLoading, error, reload };
}
