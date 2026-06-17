'use client';

import { useContext, useMemo, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { LocaleContext } from '@/lib/locale-context';
import { usePlotDetailContext } from '@/lib/plot-detail-context';
import { extractGeoJsonCoordinates } from '@/lib/plot-map-preview-geometry';
import {
  getPlotDetailMapCopy,
  getPlotDetailPageSubtitle,
} from '@/lib/workflow-terminology-labels';
import { normalizePlotKind } from '@/lib/plot-inventory';
import { PLOT_MAP_HERO_HEIGHT_CLASS, PlotSatelliteMap } from '@/components/plots/plot-satellite-map';
import { usePlotMapTileProvider } from '@/lib/use-plot-map-tile-provider';

interface PlotMapHeroProps {
  plotId: string;
}

function formatAreaHa(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(value < 0.1 ? 3 : 2)} ha`;
}

function headlineToneClass(tone: 'ready' | 'attention' | 'blocked'): string {
  if (tone === 'ready') return 'text-emerald-700 dark:text-emerald-400';
  if (tone === 'blocked') return 'text-destructive';
  return 'text-amber-800 dark:text-amber-300';
}

export function PlotMapHero({ plotId }: PlotMapHeroProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { preview, previewLoading, previewError, headline } = usePlotDetailContext();
  const { tileProvider, attribution } = usePlotMapTileProvider();
  const [factsOpen, setFactsOpen] = useState(false);

  const kind = preview ? normalizePlotKind(preview.kind) : 'unknown';
  const coordinates = useMemo(
    () => (preview?.geometry ? extractGeoJsonCoordinates(preview.geometry) : []),
    [preview?.geometry],
  );

  const title = preview?.name ?? getPlotDetailPageSubtitle(plotId, t);

  return (
    <Card className="overflow-hidden border-border">
      <CardContent className="p-0">
        <div className={cn('relative w-full bg-muted', PLOT_MAP_HERO_HEIGHT_CLASS)}>
          {previewLoading && !preview ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {getPlotDetailMapCopy('loading', t)}
            </div>
          ) : previewError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <MapPin className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p>{getPlotDetailMapCopy('error', t)}</p>
              <p className="text-xs">{previewError}</p>
            </div>
          ) : coordinates.length > 0 ? (
            <PlotSatelliteMap
              coordinates={coordinates}
              kind={kind}
              interactive
              className="h-full"
              ariaLabel={getPlotDetailMapCopy('aria_label', t)}
              attribution={attribution}
              tileProvider={tileProvider}
              zoomInLabel={getPlotDetailMapCopy('zoom_in', t)}
              zoomOutLabel={getPlotDetailMapCopy('zoom_out', t)}
              resetLabel={getPlotDetailMapCopy('reset_view', t)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <MapPin className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p>{getPlotDetailMapCopy('pending', t)}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {preview?.farmer_name ? (
              <p className="text-sm text-muted-foreground">{preview.farmer_name}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className={cn('text-sm font-semibold', headlineToneClass(headline.tone))}>
              {headline.headline}
            </p>
            <p className="text-xs text-muted-foreground">{headline.supportLine}</p>
          </div>

          <Collapsible open={factsOpen} onOpenChange={setFactsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40"
                aria-expanded={factsOpen}
              >
                {getPlotDetailMapCopy('facts_toggle', t)}
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 transition-transform', factsOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">{getPlotDetailMapCopy('area_label', t)}</dt>
                  <dd className="font-medium">{formatAreaHa(preview?.area_ha ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{getPlotDetailMapCopy('kind_label', t)}</dt>
                  <dd className="font-medium capitalize">{kind === 'unknown' ? '—' : kind}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{getPlotDetailMapCopy('screening_label', t)}</dt>
                  <dd className="font-medium text-xs leading-snug">
                    {headline.supportLine.split(' · ')[0]?.replace('Deforestation screening: ', '') ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{getPlotDetailMapCopy('plot_id_label', t)}</dt>
                  <dd className="font-mono text-xs font-medium">{plotId}</dd>
                </div>
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
