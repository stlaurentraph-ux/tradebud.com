'use client';

import { useEffect, useState, startTransition } from 'react';

export interface PackageEvidenceDocument {
  evidenceId: string;
  packageId: string;
  plotId: string | null;
  title: string;
  type: 'tenure_evidence' | 'labor_evidence' | 'fpic_repository' | 'protected_area_permit';
  reviewStatus: 'verified' | 'pending' | 'rejected';
  source: string;
  capturedAt: string | null;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePackageEvidenceDocuments(packageId: string | null) {
  const [data, setData] = useState<PackageEvidenceDocument[] | null>(null);
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

    fetch(`/api/harvest/packages/${encodeURIComponent(packageId)}/evidence-documents`, {
      method: 'GET',
      cache: 'no-store',
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => [])) as PackageEvidenceDocument[] | { error?: string };
        if (!response.ok) {
          if (!Array.isArray(body)) {
            throw new Error(body.error ?? 'Failed to load package evidence documents.');
          }
          throw new Error('Failed to load package evidence documents.');
        }
        if (!cancelled) {
          setData(Array.isArray(body) ? body : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load package evidence documents.');
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
