'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { PlotGeometryHistoryPanel } from '@/components/plots/plot-geometry-history-panel';
import { LocaleContext } from '@/lib/locale-context';
import { plotDetailPath } from '@/lib/plot-detail-paths';
import { usePlotMapPreview } from '@/lib/use-plot-map-preview';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getPlotDetailHistoryPageCopy,
  getPlotsNavLabel,
} from '@/lib/workflow-terminology-labels';

interface PlotDetailHistoryPageContentProps {
  plotId: string;
}

export function PlotDetailHistoryPageContent({ plotId }: PlotDetailHistoryPageContentProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { preview } = usePlotMapPreview(plotId);
  const plotLabel = preview?.name?.trim() || plotId;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getPlotDetailHistoryPageCopy('title', t)}
        subtitle={plotLabel}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getPlotsNavLabel(t), href: '/plots' },
          { label: plotLabel, href: plotDetailPath(plotId) },
          { label: getPlotDetailHistoryPageCopy('breadcrumb', t) },
        ]}
      />
      <div className="flex-1 space-y-4 p-6 pb-24 md:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            {getPlotDetailHistoryPageCopy('description', t)}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={plotDetailPath(plotId)}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {getPlotDetailHistoryPageCopy('back_to_plot', t)}
            </Link>
          </Button>
        </div>
        <PlotGeometryHistoryPanel plotId={plotId} />
      </div>
    </div>
  );
}
