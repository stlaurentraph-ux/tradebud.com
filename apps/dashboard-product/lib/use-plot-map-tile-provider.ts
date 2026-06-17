'use client';

import { useMemo } from 'react';
import {
  plotMapAttribution,
  resolvePlotMapTileProvider,
  type PlotMapTileProviderId,
} from '@/lib/plot-map-tile-provider';
import { useCommercialProfile } from '@/lib/use-commercial-profile';

export function usePlotMapTileProvider(): {
  tileProvider: PlotMapTileProviderId;
  attribution: string;
} {
  const { profile } = useCommercialProfile();
  const tileProvider = useMemo(() => resolvePlotMapTileProvider(profile), [profile]);
  const attribution = useMemo(() => plotMapAttribution(tileProvider), [tileProvider]);
  return { tileProvider, attribution };
}
