'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DDSPackage } from '@/types';
import {
  listCanonicalShipmentHeaders,
  type CanonicalShipmentHeader,
} from '@/lib/shipment-headers-client';
import { mapShipmentHeadersToListRows, type ShipmentListRow } from '@/lib/shipment-header-mapper';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { useDemoData } from '@/lib/demo-data-context';
import { listMockShipmentHeaders } from '@/lib/mocks/shipment-headers';

export function useShipmentHeaders(tenantId: string | null, ownerLabel = 'Your organisation') {
  const { demoDataEnabled } = useDemoData();
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

    if (demoDataEnabled) {
      setHeaders(listMockShipmentHeaders());
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
  }, [tenantId, demoDataEnabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
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
