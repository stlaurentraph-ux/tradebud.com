'use client';

import { useEffect, useState } from 'react';

export type PlotLegalSyncPayload = {
  plotId: string;
  cadastralKey: string | null;
  informalTenure: boolean | null;
  informalTenureNote: string | null;
  syncedAt: string;
};

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

function mapLegalSyncEvent(raw: unknown): PlotLegalSyncPayload | null {
  const row = asRecord(raw);
  const eventType = row?.event_type ?? row?.eventType;
  if (!row || eventType !== 'plot_legal_synced') return null;
  const payload = asRecord(row?.payload);
  if (!payload) return null;
  const plotId = typeof payload.plotId === 'string' ? payload.plotId : '';
  if (!plotId) return null;
  const ts = row.timestamp;
  const syncedAt =
    typeof ts === 'string'
      ? ts
      : ts instanceof Date
        ? ts.toISOString()
        : new Date().toISOString();

  return {
    plotId,
    cadastralKey:
      typeof payload.cadastralKey === 'string' && payload.cadastralKey.trim()
        ? payload.cadastralKey.trim()
        : null,
    informalTenure:
      payload.informalTenure === true ? true : payload.informalTenure === false ? false : null,
    informalTenureNote:
      typeof payload.informalTenureNote === 'string' && payload.informalTenureNote.trim()
        ? payload.informalTenureNote.trim()
        : null,
    syncedAt,
  };
}

export function usePlotLegalSync(plotId: string) {
  const [legalSync, setLegalSync] = useState<PlotLegalSyncPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = plotId.trim();
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setLegalSync(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/plots/${encodeURIComponent(id)}/compliance-history`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === 'string' ? body.error : 'Could not load plot legal sync.',
          );
        }
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const rows = Array.isArray(payload) ? payload : [];
        const latest = rows
          .map(mapLegalSyncEvent)
          .filter((row): row is PlotLegalSyncPayload => row !== null)
          .sort((a, b) => b.syncedAt.localeCompare(a.syncedAt))[0];
        setLegalSync(latest ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLegalSync(null);
        setError(e instanceof Error ? e.message : 'Could not load plot legal sync.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plotId]);

  return { legalSync, isLoading, error };
}
