'use client';

import { useEffect, useState, startTransition } from 'react';

export interface PlotDeforestationDecisionHistoryEvent {
  id: string;
  timestamp: string;
  userId: string | null;
  deviceId: string | null;
  eventType: 'plot_deforestation_decision_recorded';
  payload: {
    plotId: string;
    cutoffDate: string;
    verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown';
    provider?: string;
    providerMode?: 'glad_s2_primary' | 'radd_fallback';
    summary?: {
      alertCount: number | null;
      alertAreaHa: number | null;
    };
  };
}

export interface PlotDeforestationDecisionRunResult {
  ok: boolean;
  plotId?: string;
  cutoffDate?: string;
  verdict?: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown';
  providerMode?: 'glad_s2_primary' | 'radd_fallback';
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapEvent(raw: unknown): PlotDeforestationDecisionHistoryEvent {
  const input = asRecord(raw) ?? {};
  const payload = asRecord(input.payload) ?? {};
  const summary = asRecord(payload.summary);
  const ts = input.timestamp;
  const timestamp =
    typeof ts === 'string'
      ? ts
      : ts instanceof Date
        ? ts.toISOString()
        : new Date(
            typeof ts === 'number' || typeof ts === 'string' ? ts : Date.now(),
          ).toISOString();
  const verdictRaw = payload.verdict;
  const verdict =
    verdictRaw === 'no_deforestation_detected' || verdictRaw === 'possible_deforestation_detected'
      ? verdictRaw
      : 'unknown';
  const providerModeRaw = payload.providerMode;
  const providerMode =
    providerModeRaw === 'radd_fallback' || providerModeRaw === 'glad_s2_primary'
      ? providerModeRaw
      : undefined;
  const userIdRaw = input.userId ?? input.user_id;
  const deviceIdRaw = input.deviceId ?? input.device_id;
  return {
    id: String(input.id ?? ''),
    timestamp,
    userId: userIdRaw == null ? null : String(userIdRaw),
    deviceId: deviceIdRaw == null ? null : String(deviceIdRaw),
    eventType: 'plot_deforestation_decision_recorded',
    payload: {
      plotId: String(payload.plotId ?? ''),
      cutoffDate: String(payload.cutoffDate ?? ''),
      verdict,
      provider: typeof payload.provider === 'string' ? payload.provider : undefined,
      providerMode,
      summary:
        summary && typeof summary === 'object'
          ? {
              alertCount:
                typeof summary.alertCount === 'number' ? summary.alertCount : null,
              alertAreaHa:
                typeof summary.alertAreaHa === 'number' ? summary.alertAreaHa : null,
            }
          : undefined,
    },
  };
}

export function usePlotDeforestationDecisionHistory(plotId: string) {
  const [events, setEvents] = useState<PlotDeforestationDecisionHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((value) => value + 1);

  const runDecision = async (cutoffDate: string): Promise<PlotDeforestationDecisionRunResult> => {
    if (!cutoffDate) {
      throw new Error('cutoffDate is required.');
    }
    const response = await fetch(
      `/api/plots/${encodeURIComponent(plotId)}/deforestation-decision?cutoffDate=${encodeURIComponent(cutoffDate)}`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: getAuthHeaders(),
      },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to run deforestation decision.');
    }
    const body = (await response.json().catch(() => ({}))) as PlotDeforestationDecisionRunResult;
    reload();
    return body;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!plotId) {
        startTransition(() => {
          setEvents([]);
          setError(null);
          setIsLoading(false);
        });
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/plots/${encodeURIComponent(plotId)}/deforestation-decision-history`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Deforestation decision history API unavailable.');
        }
        const body = (await response.json()) as unknown;
        const rows = Array.isArray(body) ? body : [];
        if (!cancelled) {
          setEvents(rows.map(mapEvent).filter((event) => event.id.length > 0));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load deforestation decision history.');
          setEvents([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [plotId, reloadTick]);

  return { events, isLoading, error, reload, runDecision };
}
