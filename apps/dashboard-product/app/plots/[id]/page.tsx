'use client';

import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlotGeometryHistoryPanel } from '@/components/plots/plot-geometry-history-panel';
import { PlotAssignmentLifecyclePanel } from '@/components/plots/plot-assignment-lifecycle-panel';
import { PlotDeforestationDecisionHistoryPanel } from '@/components/plots/plot-deforestation-decision-history-panel';

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Plot Detail"
        subtitle={`Plot identifier: ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Plots', href: '/plots' },
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
        <PlotDeforestationDecisionHistoryPanel plotId={id} />
        <PlotGeometryHistoryPanel plotId={id} />
        <PlotAssignmentLifecyclePanel plotId={id} />
      </div>
    </div>
  );
}

