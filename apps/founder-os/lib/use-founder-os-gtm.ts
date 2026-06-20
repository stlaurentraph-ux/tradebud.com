'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MarketRegistry, ObjectionLog, Partnership, PenetrationMetric, Pilot } from '@/types';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Request failed.');
  return body;
}

export function useMarkets() {
  const [markets, setMarkets] = useState<MarketRegistry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setMarkets((await fetchJson<{ markets: MarketRegistry[] }>('/api/crm/markets')).markets ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { markets, isLoading, error, reload, createMarket: async (input: { country_code: string; country_name: string; commodity: string; segment: string; entry_wedge?: string }) => {
    const body = await fetchJson<{ market: MarketRegistry }>('/api/crm/markets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    setMarkets((p) => [...p, body.market]);
  }};
}

export function usePilots() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setPilots((await fetchJson<{ pilots: Pilot[] }>('/api/crm/pilots')).pilots ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { pilots, isLoading, error, reload,
    createPilot: async (input: { name: string; country?: string; commodity?: string; notes?: string }) => {
      const body = await fetchJson<{ pilot: Pilot }>('/api/crm/pilots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      setPilots((p) => [body.pilot, ...p]);
    },
    updatePilotStatus: async (id: string, status: string) => {
      const body = await fetchJson<{ pilot: Pilot }>('/api/crm/pilots', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      setPilots((p) => p.map((x) => (x.id === id ? body.pilot : x)));
    },
  };
}

export function usePartnerships() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setPartnerships((await fetchJson<{ partnerships: Partnership[] }>('/api/crm/partnerships')).partnerships ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { partnerships, isLoading, error, reload, createPartnership: async (input: { organization_name: string; partner_type: string; country?: string; notes?: string }) => {
    const body = await fetchJson<{ partnership: Partnership }>('/api/crm/partnerships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    setPartnerships((p) => [body.partnership, ...p]);
  }};
}

export function useObjections() {
  const [objections, setObjections] = useState<ObjectionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reload = useCallback(async () => {
    setIsLoading(true);
    try { setObjections((await fetchJson<{ objections: ObjectionLog[] }>('/api/crm/objections')).objections ?? []); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { objections, isLoading, error: null, reload, createObjection: async (input: { category: string; objection_text: string; response_text?: string }) => {
    const body = await fetchJson<{ objection: ObjectionLog }>('/api/crm/objections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    setObjections((p) => [body.objection, ...p]);
  }};
}

export function usePenetrationMetrics() {
  const [metrics, setMetrics] = useState<PenetrationMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setMetrics((await fetchJson<{ metrics: PenetrationMetric[] }>('/api/crm/intelligence')).metrics ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsLoading(false); }
  }, []);
  const refreshIcp = useCallback(async () => {
    const body = await fetchJson<{ updated: number; metrics: PenetrationMetric[] }>('/api/crm/intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh_icp' }) });
    setMetrics(body.metrics ?? []); return body.updated;
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { metrics, isLoading, error, reload, refreshIcp };
}
