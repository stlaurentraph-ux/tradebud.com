'use client';

import { useCallback, useEffect, useState } from 'react';
import { listShipmentAssemblies, type ShipmentAssemblyRecord } from '@/lib/shipment-assembly-service';

export function useShipmentAssemblies(tenantId: string | null) {
  const [shipments, setShipments] = useState<ShipmentAssemblyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!tenantId) {
      setShipments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    listShipmentAssemblies(tenantId)
      .then((rows) => setShipments(rows))
      .catch((loadError) => {
        setShipments([]);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load shipments.');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const usedPackageIds = new Set(shipments.flatMap((shipment) => shipment.package_ids));

  return { shipments, isLoading, error, reload, usedPackageIds };
}
