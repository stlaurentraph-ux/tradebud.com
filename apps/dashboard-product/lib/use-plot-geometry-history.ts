'use client';

import { useEffect, useMemo, useState } from 'react';

export interface PlotGeometryHistoryEvent {
  id: string;
  timestamp: string;
  userId: string | null;
  deviceId: string | null;
  eventType: 'plot_created' | 'plot_geometry_superseded';
  payload: {
    plotId: string;
    details?: Record<string, unknown>;
  };
}

interface PlotGeometryHistoryResponse {
  items?: PlotGeometryHistoryEvent[];
  anomalies?: GeometryHistoryAnomaly[];
  anomalySummary?: GeometryHistoryAnomalySummary;
  total?: number;
  limit?: number;
  offset?: number;
  signalsOnly?: boolean;
  anomalySummaryScope?: 'current_page' | 'full_filtered_set';
}

export type GeometryHistoryFilter = 'all' | 'plot_created' | 'plot_geometry_superseded';
export type GeometryHistoryAnomalyProfile = 'strict' | 'balanced' | 'lenient';
export type GeometryHistoryViewKey =
  | 'all|mixed'
  | 'all|signals'
  | 'plot_created|mixed'
  | 'plot_created|signals'
  | 'plot_geometry_superseded|mixed'
  | 'plot_geometry_superseded|signals';

interface GeometryHistoryPreset {
  filter: GeometryHistoryFilter;
  sort: 'desc' | 'asc';
  anomalyProfile: GeometryHistoryAnomalyProfile;
  signalsOnly: boolean;
  viewPageMemory?: Partial<Record<GeometryHistoryViewKey, number>>;
}

type LegacyGeometryHistoryPreset = Partial<{
  modePageMemory: { mixed?: number; signalsOnly?: number };
  filterPageMemory: { all?: number; plot_created?: number; plot_geometry_superseded?: number };
}>;

export interface GeometryHistoryAnomaly {
  eventId: string;
  type: 'large_revision_jump' | 'frequent_supersession';
  severity: 'medium' | 'high';
  message: string;
}

export interface GeometryHistoryAnomalySummary {
  total: number;
  highSeverity: number;
  mediumSeverity: number;
  byType: {
    largeRevisionJump: number;
    frequentSupersession: number;
  };
}

const PRESET_STORAGE_PREFIX = 'tb:geometry-history:preset:';
const LEGACY_VIEW_FALLBACK_COUNTER_KEY = 'tb:geometry-history:legacy-view-fallback-count';
const ALL_VIEW_KEYS: GeometryHistoryViewKey[] = [
  'all|mixed',
  'all|signals',
  'plot_created|mixed',
  'plot_created|signals',
  'plot_geometry_superseded|mixed',
  'plot_geometry_superseded|signals',
];

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('tracebud_user');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === 'string' && parsed.id.length > 0 ? parsed.id : null;
  } catch {
    return null;
  }
}

function getPresetStorageKey(plotId: string): string | null {
  const userId = getCurrentUserId();
  if (!userId || !plotId) return null;
  return `${PRESET_STORAGE_PREFIX}${userId}:${plotId}`;
}

function incrementLegacyViewFallbackCounter() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LEGACY_VIEW_FALLBACK_COUNTER_KEY);
    const parsed = raw != null ? Number(raw) : 0;
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed + 1 : 1;
    localStorage.setItem(LEGACY_VIEW_FALLBACK_COUNTER_KEY, String(next));
  } catch {
    // Best-effort telemetry only; avoid impacting history loading.
  }
}

function readLegacyViewFallbackCounter(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LEGACY_VIEW_FALLBACK_COUNTER_KEY);
    const parsed = raw != null ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  } catch {
    return 0;
  }
}

function clearLegacyViewFallbackCounter() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_VIEW_FALLBACK_COUNTER_KEY);
  } catch {
    // Best-effort only.
  }
}

function readPreset(plotId: string): GeometryHistoryPreset | null {
  if (typeof window === 'undefined') return null;
  const key = getPresetStorageKey(plotId);
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GeometryHistoryPreset> & LegacyGeometryHistoryPreset;
    const filter =
      parsed.filter === 'plot_created' || parsed.filter === 'plot_geometry_superseded' ? parsed.filter : 'all';
    const sort = parsed.sort === 'asc' ? 'asc' : 'desc';
    const anomalyProfile =
      parsed.anomalyProfile === 'strict' || parsed.anomalyProfile === 'lenient' ? parsed.anomalyProfile : 'balanced';
    const modePageMemory = parsed.modePageMemory && typeof parsed.modePageMemory === 'object' ? parsed.modePageMemory : undefined;
    const filterPageMemory =
      parsed.filterPageMemory && typeof parsed.filterPageMemory === 'object' ? parsed.filterPageMemory : undefined;
    let usedLegacyFallback = false;
    const parsedViewPageMemory = ALL_VIEW_KEYS.reduce<Partial<Record<GeometryHistoryViewKey, number>>>((acc, key) => {
      const directValue =
        parsed.viewPageMemory && typeof parsed.viewPageMemory === 'object' ? parsed.viewPageMemory[key] : undefined;
      const fallbackValue =
        key === 'all|mixed'
          ? modePageMemory?.mixed ?? filterPageMemory?.all
          : key === 'all|signals'
            ? modePageMemory?.signalsOnly
            : key === 'plot_created|mixed'
              ? filterPageMemory?.plot_created ?? modePageMemory?.mixed
              : key === 'plot_created|signals'
                ? modePageMemory?.signalsOnly
                : key === 'plot_geometry_superseded|mixed'
                  ? filterPageMemory?.plot_geometry_superseded ?? modePageMemory?.mixed
                  : modePageMemory?.signalsOnly;
      if (directValue == null && typeof fallbackValue === 'number' && Number.isFinite(fallbackValue)) {
        usedLegacyFallback = true;
      }
      const value = directValue ?? fallbackValue;
      if (typeof value === 'number' && Number.isFinite(value)) {
        acc[key] = Math.max(1, Math.trunc(value));
      }
      return acc;
    }, {});
    if (usedLegacyFallback) incrementLegacyViewFallbackCounter();
    return {
      filter,
      sort,
      anomalyProfile,
      signalsOnly: parsed.signalsOnly === true,
      viewPageMemory: parsedViewPageMemory,
    };
  } catch {
    return null;
  }
}

function buildInitialViewPageMemory(preset: GeometryHistoryPreset | null): Record<GeometryHistoryViewKey, number> {
  const allMixed = Math.max(1, Math.trunc(preset?.viewPageMemory?.['all|mixed'] ?? 1));
  const allSignals = Math.max(1, Math.trunc(preset?.viewPageMemory?.['all|signals'] ?? 1));
  return {
    'all|mixed': allMixed,
    'all|signals': allSignals,
    'plot_created|mixed': Math.max(1, Math.trunc(preset?.viewPageMemory?.['plot_created|mixed'] ?? allMixed)),
    'plot_created|signals': Math.max(1, Math.trunc(preset?.viewPageMemory?.['plot_created|signals'] ?? allSignals)),
    'plot_geometry_superseded|mixed': Math.max(
      1,
      Math.trunc(preset?.viewPageMemory?.['plot_geometry_superseded|mixed'] ?? allMixed),
    ),
    'plot_geometry_superseded|signals': Math.max(
      1,
      Math.trunc(preset?.viewPageMemory?.['plot_geometry_superseded|signals'] ?? allSignals),
    ),
  };
}

function writePreset(plotId: string, preset: GeometryHistoryPreset) {
  if (typeof window === 'undefined') return;
  const key = getPresetStorageKey(plotId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(preset));
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function usePlotGeometryHistory(plotId: string) {
  const preset = useMemo(() => readPreset(plotId), [plotId]);
  const [events, setEvents] = useState<PlotGeometryHistoryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageRaw] = useState(1);
  const pageSize = 20;
  const [sort, setSort] = useState<'desc' | 'asc'>(preset?.sort ?? 'desc');
  const [filter, setFilter] = useState<GeometryHistoryFilter>(preset?.filter ?? 'all');
  const [anomalyProfile, setAnomalyProfile] = useState<GeometryHistoryAnomalyProfile>(preset?.anomalyProfile ?? 'balanced');
  const [signalsOnly, setSignalsOnly] = useState<boolean>(preset?.signalsOnly ?? false);
  const [viewPageMemory, setViewPageMemory] = useState<Record<GeometryHistoryViewKey, number>>(
    () => buildInitialViewPageMemory(preset),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legacyViewFallbackCount, setLegacyViewFallbackCount] = useState<number>(() => readLegacyViewFallbackCounter());
  const [anomalies, setAnomalies] = useState<GeometryHistoryAnomaly[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<GeometryHistoryAnomalySummary>({
    total: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    byType: { largeRevisionJump: 0, frequentSupersession: 0 },
  });
  const [anomalySummaryScope, setAnomalySummaryScope] = useState<'current_page' | 'full_filtered_set'>('current_page');
  const [reloadTick, setReloadTick] = useState(0);
  const clampPage = (candidate: number) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    return Math.min(Math.max(1, Math.trunc(candidate)), maxPage);
  };
  const setPage = (next: number | ((previousPage: number) => number)) => {
    setPageRaw((previousPage) => {
      const candidate = typeof next === 'function' ? next(previousPage) : next;
      if (total <= 0) return Math.max(1, Math.trunc(candidate));
      return clampPage(candidate);
    });
  };

  const reload = () => setReloadTick((tick) => tick + 1);
  const resetLegacyViewFallbackCount = () => {
    clearLegacyViewFallbackCounter();
    setLegacyViewFallbackCount(0);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!plotId) {
        setEvents([]);
        setAnomalies([]);
        setAnomalySummary({
          total: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          byType: { largeRevisionJump: 0, frequentSupersession: 0 },
        });
        setAnomalySummaryScope('current_page');
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          limit: String(pageSize),
          offset: String((page - 1) * pageSize),
          sort,
          anomalyProfile,
          signalsOnly: String(signalsOnly),
        });
        const response = await fetch(`/api/plots/${encodeURIComponent(plotId)}/geometry-history?${query.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Geometry history API unavailable.');
        }
        const body = (await response.json()) as PlotGeometryHistoryResponse | PlotGeometryHistoryEvent[];
        if (!cancelled) {
          if (Array.isArray(body)) {
            setEvents(body);
            setAnomalies([]);
            setAnomalySummary({
              total: 0,
              highSeverity: 0,
              mediumSeverity: 0,
              byType: { largeRevisionJump: 0, frequentSupersession: 0 },
            });
            setAnomalySummaryScope('current_page');
            setTotal(body.length);
          } else {
            const nextEvents = body.items ?? [];
            setEvents(nextEvents);
            const nextAnomalies =
              Array.isArray(body.anomalies) && body.anomalies.length > 0 ? body.anomalies : deriveAnomalies(nextEvents);
            setAnomalies(nextAnomalies);
            setAnomalySummary(
              body.anomalySummary ?? summarizeAnomalies(nextAnomalies),
            );
            setAnomalySummaryScope(body.anomalySummaryScope ?? (signalsOnly ? 'full_filtered_set' : 'current_page'));
            setTotal(body.total ?? 0);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load geometry history.');
          setEvents([]);
          setAnomalies([]);
          setAnomalySummary({
            total: 0,
            highSeverity: 0,
            mediumSeverity: 0,
            byType: { largeRevisionJump: 0, frequentSupersession: 0 },
          });
          setAnomalySummaryScope('current_page');
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [anomalyProfile, page, pageSize, plotId, reloadTick, signalsOnly, sort]);

  useEffect(() => {
    if (!plotId) return;
    writePreset(plotId, { filter, sort, anomalyProfile, signalsOnly, viewPageMemory });
  }, [anomalyProfile, filter, plotId, signalsOnly, sort, viewPageMemory]);

  const deriveAnomalies = (nextEvents: PlotGeometryHistoryEvent[]): GeometryHistoryAnomaly[] => {
    const anomalyRows: GeometryHistoryAnomaly[] = [];
    const superseded = nextEvents.filter((event) => event.eventType === 'plot_geometry_superseded');

    for (const event of superseded) {
      const details = event.payload.details ?? {};
      const correctionVariancePct = parseNumeric(
        (details as Record<string, unknown>).geometryNormalization &&
          typeof (details as Record<string, unknown>).geometryNormalization === 'object'
          ? ((details as Record<string, unknown>).geometryNormalization as Record<string, unknown>)
              .correctionVariancePct
          : null,
      );
      if (correctionVariancePct != null && correctionVariancePct >= 3) {
        anomalyRows.push({
          eventId: event.id,
          type: 'large_revision_jump',
          severity: correctionVariancePct >= 4 ? 'high' : 'medium',
          message: `Large revision jump: ${correctionVariancePct.toFixed(2)}% area correction variance.`,
        });
      }
    }

    for (let index = 1; index < superseded.length; index += 1) {
      const current = superseded[index];
      const previous = superseded[index - 1];
      const currentTime = Date.parse(current.timestamp);
      const previousTime = Date.parse(previous.timestamp);
      if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) continue;
      const diffMinutes = Math.abs(previousTime - currentTime) / (1000 * 60);
      if (diffMinutes <= 120) {
        anomalyRows.push({
          eventId: current.id,
          type: 'frequent_supersession',
          severity: diffMinutes <= 30 ? 'high' : 'medium',
          message: `Frequent supersession: another geometry change within ${Math.round(diffMinutes)} minutes.`,
        });
      }
    }

    return anomalyRows;
  };

  const summarizeAnomalies = (items: GeometryHistoryAnomaly[]): GeometryHistoryAnomalySummary => {
    let highSeverity = 0;
    let mediumSeverity = 0;
    let largeRevisionJump = 0;
    let frequentSupersession = 0;
    for (const anomaly of items) {
      if (anomaly.severity === 'high') highSeverity += 1;
      else mediumSeverity += 1;
      if (anomaly.type === 'large_revision_jump') largeRevisionJump += 1;
      else frequentSupersession += 1;
    }
    return {
      total: items.length,
      highSeverity,
      mediumSeverity,
      byType: {
        largeRevisionJump,
        frequentSupersession,
      },
    };
  };

  return {
    events,
    total,
    page,
    pageSize,
    clampPage,
    setPage,
    sort,
    setSort,
    anomalyProfile,
    setAnomalyProfile,
    signalsOnly,
    setSignalsOnly,
    viewPageMemory,
    setViewPageMemory,
    filter,
    setFilter,
    anomalies,
    anomalySummary,
    anomalySummaryScope,
    isLoading,
    error,
    legacyViewFallbackCount,
    resetLegacyViewFallbackCount,
    reload,
  };
}
