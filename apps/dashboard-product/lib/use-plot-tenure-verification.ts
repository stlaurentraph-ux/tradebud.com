'use client';

import { useCallback, useEffect, useState } from 'react';

export type TenureParseStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'MANUAL_REQUIRED';

export interface PlotTenureVerificationRecord {
  id: string;
  plot_id: string;
  storage_path: string;
  mime_type: string | null;
  evidence_label: string | null;
  parse_status: TenureParseStatus;
  parse_result: Record<string, unknown> | null;
  parse_confidence: number | null;
  parse_reviewed_by: string | null;
  parse_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizeRecord(raw: unknown): PlotTenureVerificationRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;
  const parseStatus = row.parse_status;
  const status: TenureParseStatus =
    parseStatus === 'PENDING' ||
    parseStatus === 'IN_PROGRESS' ||
    parseStatus === 'COMPLETED' ||
    parseStatus === 'FAILED' ||
    parseStatus === 'MANUAL_REQUIRED'
      ? parseStatus
      : 'PENDING';

  return {
    id,
    plot_id: typeof row.plot_id === 'string' ? row.plot_id : '',
    storage_path: typeof row.storage_path === 'string' ? row.storage_path : '',
    mime_type: typeof row.mime_type === 'string' ? row.mime_type : null,
    evidence_label: typeof row.evidence_label === 'string' ? row.evidence_label : null,
    parse_status: status,
    parse_result:
      row.parse_result && typeof row.parse_result === 'object' && !Array.isArray(row.parse_result)
        ? (row.parse_result as Record<string, unknown>)
        : null,
    parse_confidence:
      typeof row.parse_confidence === 'number' && Number.isFinite(row.parse_confidence)
        ? row.parse_confidence
        : null,
    parse_reviewed_by:
      typeof row.parse_reviewed_by === 'string' ? row.parse_reviewed_by : null,
    parse_reviewed_at: typeof row.parse_reviewed_at === 'string' ? row.parse_reviewed_at : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  };
}

export function tenureParseStatusLabel(status: TenureParseStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'AI review complete';
    case 'MANUAL_REQUIRED':
      return 'Manual review required';
    case 'IN_PROGRESS':
      return 'AI review in progress';
    case 'FAILED':
      return 'AI review failed';
    default:
      return 'AI review pending';
  }
}

export function summarizePlotTenureParse(
  records: PlotTenureVerificationRecord[],
): TenureParseStatus | null {
  if (records.length === 0) return null;
  const priority: TenureParseStatus[] = [
    'FAILED',
    'MANUAL_REQUIRED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
  ];
  for (const status of priority) {
    if (records.some((row) => row.parse_status === status)) return status;
  }
  return records[0]?.parse_status ?? null;
}

function recordsNeedPolling(records: PlotTenureVerificationRecord[]): boolean {
  return records.some(
    (row) => row.parse_status === 'PENDING' || row.parse_status === 'IN_PROGRESS',
  );
}

export function usePlotTenureVerification(
  plotId: string,
  options?: { pollWhilePending?: boolean },
) {
  const [records, setRecords] = useState<PlotTenureVerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const id = plotId.trim();
    if (!id) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/plots/${encodeURIComponent(id)}/tenure-verification`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.error === 'string' ? body.error : 'Could not load tenure verification.',
        );
      }
      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : [];
      setRecords(
        rows
          .map(normalizeRecord)
          .filter((row): row is PlotTenureVerificationRecord => row !== null),
      );
    } catch (e) {
      setRecords([]);
      setError(e instanceof Error ? e.message : 'Could not load tenure verification.');
    } finally {
      setIsLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!options?.pollWhilePending) return;
    if (!recordsNeedPolling(records)) return;
    const timer = window.setInterval(() => {
      void reload();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [options?.pollWhilePending, records, reload]);

  return { records, isLoading, error, reload };
}
