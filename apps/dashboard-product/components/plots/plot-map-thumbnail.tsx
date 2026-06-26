'use client';

import { useContext, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { PlotSatelliteMap } from '@/components/plots/plot-satellite-map';
import { extractGeoJsonCoordinates } from '@/lib/plot-map-preview-geometry';
import { normalizePlotKind } from '@/lib/plot-inventory';
import { useIntersectionOnce } from '@/lib/use-intersection-once';
import { usePlotMapPreview } from '@/lib/use-plot-map-preview';
import { usePlotMapTileProvider } from '@/lib/use-plot-map-tile-provider';
import { LocaleContext } from '@/lib/locale-context';
import { getPlotDetailMapCopy } from '@/lib/workflow-terminology-labels';

interface PlotMapThumbnailProps {
  plotId: string;
  className?: string;
}

export function PlotMapThumbnail({ plotId, className }: PlotMapThumbnailProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { ref, isVisible } = useIntersectionOnce<HTMLDivElement>();
  const { preview, isLoading, error } = usePlotMapPreview(plotId, { enabled: isVisible });
  const { tileProvider, attribution } = usePlotMapTileProvider();

  const kind = preview ? normalizePlotKind(preview.kind) : 'unknown';
  const geometry = preview?.geometry;
  const coordinates = useMemo(
    () => (geometry ? extractGeoJsonCoordinates(geometry) : []),
    [geometry],
  );

  return (
    <div
      ref={ref}
      className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted ${className ?? ''}`}
      aria-hidden={!isVisible}
    >
      {!isVisible ? (
        <div className="flex h-full items-center justify-center">
          <MapPin className="h-4 w-4 text-muted-foreground/50" />
        </div>
      ) : isLoading && !preview ? (
        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">…</div>
      ) : error || coordinates.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <MapPin className="h-4 w-4 text-muted-foreground/60" />
        </div>
      ) : (
        <PlotSatelliteMap
          coordinates={coordinates}
          kind={kind}
          className="h-full"
          ariaLabel={getPlotDetailMapCopy('aria_label', t)}
          attribution={attribution}
          tileProvider={tileProvider}
        />
      )}
    </div>
  );
}
