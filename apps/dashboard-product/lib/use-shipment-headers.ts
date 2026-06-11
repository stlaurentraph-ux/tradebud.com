'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DDSPackage } from '@/types';
import {
  listCanonicalShipmentHeaders,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { mapShipmentHeadersToListRows, type ShipmentListRow } from '@/lib/shipment-header-mapper';
import { useHarvestPackages } from '@/lib/use-harvest-packages';

export function useShipmentHeaders(tenantId: string | null, ownerLabel = 'Your organisation') {
  const { packages } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const [headers, setHeaders] = useState<CanonicalShipmentHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!tenantId) {
      setHeaders([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    listCanonicalShipmentHeaders()
      .then((rows) => setHeaders(rows))
      .catch((loadError) => {
        setHeaders([]);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load shipments.');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const shipments = useMemo(
    () => mapShipmentHeadersToListRows(headers, packages, ownerLabel),
    [headers, ownerLabel, packages],
  );

  const usedPackageIds = useMemo(
    () => new Set(headers.flatMap((header) => header.package_ids)),
    [headers],
  );

  return { shipments, headers, packages, isLoading, error, reload, usedPackageIds };
}

export type { ShipmentListRow, CanonicalShipmentHeader, DDSPackage };
