'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildMapTiles,
  buildPolygonSvgPath,
  clampPlotMapZoom,
  computePlotMapView,
  computePlotMapViewAtZoom,
  panPlotMapView,
  projectLngLatToContainer,
  resolvePlotMapDevicePixelRatio,
  type LatLng,
  type PlotMapView,
} from '@/lib/plot-map-preview-geometry';
import type { PlotMapTileProviderId } from '@/lib/plot-map-tile-provider';
import { useElementSize } from '@/lib/use-element-size';

export const PLOT_MAP_HERO_HEIGHT_CLASS = 'h-[420px] sm:h-[480px]';

export type PlotMapOverlayPolygon = {
  coordinates: LatLng[];
  variant: 'current' | 'suggested';
};

interface PlotSatelliteMapProps {
  coordinates: LatLng[];
  kind: 'point' | 'polygon' | 'unknown';
  overlayPolygons?: PlotMapOverlayPolygon[];
  tileProvider?: PlotMapTileProviderId;
  interactive?: boolean;
  className?: string;
  ariaLabel: string;
  attribution: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetLabel?: string;
}

function coordinatesForView(
  coordinates: LatLng[],
  overlayPolygons?: PlotMapOverlayPolygon[],
): LatLng[] {
  if (overlayPolygons?.length) {
    return overlayPolygons.flatMap((polygon) => polygon.coordinates);
  }
  return coordinates;
}

function buildInitialView(
  coordinates: LatLng[],
  kind: 'point' | 'polygon' | 'unknown',
  renderWidth: number,
  renderHeight: number,
  overlayPolygons?: PlotMapOverlayPolygon[],
): PlotMapView | null {
  const viewCoords = coordinatesForView(coordinates, overlayPolygons);
  if (viewCoords.length === 0 || renderWidth <= 0 || renderHeight <= 0) return null;
  const viewKind = overlayPolygons?.length || kind === 'polygon' ? 'polygon' : kind;
  return computePlotMapView(viewCoords, viewKind, renderWidth, renderHeight);
}

export function PlotSatelliteMap({
  coordinates,
  kind,
  overlayPolygons,
  tileProvider = 'esri',
  interactive = false,
  className,
  ariaLabel,
  attribution,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  resetLabel = 'Reset map view',
}: PlotSatelliteMapProps) {
  const { ref: containerRef, size, isMeasured } = useElementSize<HTMLDivElement>();
  const devicePixelRatio = resolvePlotMapDevicePixelRatio(
    typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  );
  const renderWidth = Math.max(1, Math.round(size.width * devicePixelRatio));
  const renderHeight = Math.max(1, Math.round(size.height * devicePixelRatio));

  const initialView = useMemo(
    () => buildInitialView(coordinates, kind, renderWidth, renderHeight, overlayPolygons),
    [coordinates, kind, overlayPolygons, renderWidth, renderHeight],
  );

  const [view, setView] = useState<PlotMapView | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const applyZoomDelta = useCallback(
    (delta: number) => {
      setView((current) => {
        if (!current) return current;
        const nextZoom = clampPlotMapZoom(current.zoom + delta);
        if (nextZoom === current.zoom) return current;
        return computePlotMapViewAtZoom(current.center, nextZoom, renderWidth, renderHeight);
      });
    },
    [renderHeight, renderWidth],
  );

  const resetView = useCallback(() => {
    setView(initialView);
  }, [initialView]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !view) return;
      dragRef.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [interactive, view],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !view || !dragRef.current) return;
      const deltaX = (event.clientX - dragRef.current.x) * devicePixelRatio;
      const deltaY = (event.clientY - dragRef.current.y) * devicePixelRatio;
      dragRef.current = { x: event.clientX, y: event.clientY };
      setView((current) =>
        current ? panPlotMapView(current, renderWidth, renderHeight, deltaX, deltaY) : current,
      );
    },
    [devicePixelRatio, interactive, renderHeight, renderWidth, view],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!interactive || !view) return;
      event.preventDefault();
      applyZoomDelta(event.deltaY < 0 ? 1 : -1);
    },
    [applyZoomDelta, interactive, view],
  );

  const tiles = useMemo(() => {
    if (!view) return [];
    return buildMapTiles(view, renderWidth, renderHeight, tileProvider);
  }, [renderHeight, renderWidth, tileProvider, view]);

  const overlayPaths = useMemo(() => {
    if (!view || !overlayPolygons?.length) return [];
    return overlayPolygons
      .filter((polygon) => polygon.coordinates.length >= 3)
      .map((polygon) => ({
        variant: polygon.variant,
        d: buildPolygonSvgPath(polygon.coordinates, view, renderWidth, renderHeight),
      }));
  }, [overlayPolygons, renderHeight, renderWidth, view]);

  const polygonPath = useMemo(() => {
    if (!view || overlayPolygons?.length || kind !== 'polygon' || coordinates.length < 3) return '';
    return buildPolygonSvgPath(coordinates, view, renderWidth, renderHeight);
  }, [coordinates, kind, overlayPolygons, renderHeight, renderWidth, view]);

  const pinPoint = useMemo(() => {
    if (!view || coordinates.length === 0) return null;
    return projectLngLatToContainer(coordinates[0], view, renderWidth, renderHeight);
  }, [coordinates, renderHeight, renderWidth, view]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        interactive && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{ touchAction: interactive ? 'none' : undefined }}
    >
      {!isMeasured ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          …
        </div>
      ) : view ? (
        <>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: renderWidth,
              height: renderHeight,
              transform: `scale(${1 / devicePixelRatio})`,
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
              {tiles.map((tile) => (
                // Dynamic XYZ map-tile grid with computed pixel offsets — next/image
                // cannot optimize per-tile external URLs and would break the transform layout.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${tile.url}-${tile.left}-${tile.top}`}
                  src={tile.url}
                  alt=""
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: tile.left,
                    top: tile.top,
                    width: tile.width,
                    height: tile.height,
                  }}
                  draggable={false}
                />
              ))}
            </div>
            <svg
              viewBox={`0 0 ${renderWidth} ${renderHeight}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={ariaLabel}
            >
              {overlayPaths.map((path, index) =>
                path.variant === 'current' ? (
                  <path
                    key={`overlay-current-${index}`}
                    d={path.d}
                    fill="rgba(10, 127, 89, 0.12)"
                    stroke="#0A7F59"
                    strokeWidth={2 * devicePixelRatio}
                  />
                ) : (
                  <path
                    key={`overlay-suggested-${index}`}
                    d={path.d}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth={2 * devicePixelRatio}
                    strokeDasharray={`${6 * devicePixelRatio} ${4 * devicePixelRatio}`}
                  />
                ),
              )}
              {polygonPath ? (
                <path
                  d={polygonPath}
                  fill="rgba(10, 127, 89, 0.28)"
                  stroke="#0A7F59"
                  strokeWidth={3 * devicePixelRatio}
                />
              ) : null}
              {pinPoint && !overlayPolygons?.length ? (
                <>
                  <circle
                    cx={pinPoint.x}
                    cy={pinPoint.y}
                    r={kind === 'point' ? 12 * devicePixelRatio : 9 * devicePixelRatio}
                    fill="rgba(10, 127, 89, 0.35)"
                    stroke="#0A7F59"
                    strokeWidth={2 * devicePixelRatio}
                  />
                  <circle
                    cx={pinPoint.x}
                    cy={pinPoint.y}
                    r={3 * devicePixelRatio}
                    fill="#0A7F59"
                  />
                </>
              ) : null}
            </svg>
          </div>

          <p className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/55 px-2 py-0.5 text-[10px] text-white/90">
            {attribution}
          </p>

          {interactive ? (
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/90 shadow-sm"
                aria-label={zoomInLabel}
                onClick={() => applyZoomDelta(1)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/90 shadow-sm"
                aria-label={zoomOutLabel}
                onClick={() => applyZoomDelta(-1)}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/90 shadow-sm"
                aria-label={resetLabel}
                onClick={resetView}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
