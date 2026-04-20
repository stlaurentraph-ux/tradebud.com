'use client';

import { useEffect, useState, startTransition } from 'react';

export interface PackageReadinessIssue {
  code: string;
  message: string;
  severity: 'blocker' | 'warning';
}

export interface PackageReadinessResult {
  packageId: string;
  status: 'blocked' | 'warning_review' | 'ready_to_submit';
  blockers: PackageReadinessIssue[];
  warnings: PackageReadinessIssue[];
  checkedAt: string;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePackageReadiness(packageId: string | null) {
  const [data, setData] = useState<PackageReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      startTransition(() => {
        setData(null);
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setIsLoading(true);
      setError(null);
    });

    fetch(`/api/harvest/packages/${encodeURIComponent(packageId)}/readiness`, {
      method: 'GET',
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        } & PackageReadinessResult;

        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load package readiness.');
        }
        if (!cancelled) {
          setData(body);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load package readiness.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  return { data, isLoading, error };
}
