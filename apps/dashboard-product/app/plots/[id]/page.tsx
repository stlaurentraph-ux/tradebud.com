'use client';

import { useContext } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlotGeometryHistoryPanel } from '@/components/plots/plot-geometry-history-panel';
import { PlotAssignmentLifecyclePanel } from '@/components/plots/plot-assignment-lifecycle-panel';
import { PlotDeforestationDecisionHistoryPanel } from '@/components/plots/plot-deforestation-decision-history-panel';
import { PlotTenureStatusPanel } from '@/components/plots/plot-tenure-status-panel';
import { PlotEvidencePanel } from '@/components/evidence/plot-evidence-panel';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getPlotDetailPageSubtitle,
  getPlotDetailPageTitle,
  getPlotsNavLabel,
} from '@/lib/workflow-terminology-labels';

export default function PlotDetailPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getPlotDetailPageTitle(t)}
        subtitle={getPlotDetailPageSubtitle(id, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getPlotsNavLabel(t), href: '/plots' },
          { label: id },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Plot Record</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled and ready for detailed plot data wiring.
          </CardContent>
        </Card>
        <PlotTenureStatusPanel plotId={id} />
        <div id="plot-evidence">
          <PlotEvidencePanel plotId={id} />
        </div>
        <PlotDeforestationDecisionHistoryPanel plotId={id} />
        <PlotGeometryHistoryPanel plotId={id} />
        <PlotAssignmentLifecyclePanel plotId={id} />
      </div>
    </div>
  );
}

