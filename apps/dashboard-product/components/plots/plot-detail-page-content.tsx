'use client';

import { useContext, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { PlotMapHero } from '@/components/plots/plot-map-hero';
import { PlotGeometryReviewerPanel } from '@/components/plots/plot-geometry-reviewer-panel';
import { PlotGeometryApprovalCard } from '@/components/plots/plot-geometry-approval-card';
import { PlotDetailSections } from '@/components/plots/plot-detail-sections';
import { PlotDetailWhatsMissingCard } from '@/components/plots/plot-detail-whats-missing-card';
import { PlotDetailProvider, usePlotDetailContext } from '@/lib/plot-detail-context';
import type { PlotDetailSectionId } from '@/lib/plot-detail-section-policy';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import { getPlotsNavLabel } from '@/lib/workflow-terminology-labels';

function PlotDetailPageInner({ plotId }: { plotId: string }) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { preview } = usePlotDetailContext();
  const [openSectionRequest, setOpenSectionRequest] = useState<PlotDetailSectionId | null>(null);

  const plotLabel = preview?.name?.trim() || plotId;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={plotLabel}
        subtitle={getPlotsNavLabel(t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getPlotsNavLabel(t), href: '/plots' },
          { label: plotLabel },
        ]}
      />
      <div className="flex-1 space-y-4 p-6 pb-24 md:pb-6">
        <PlotMapHero plotId={plotId} />
        <PlotGeometryApprovalCard plotId={plotId} />
        <PlotGeometryReviewerPanel plotId={plotId} />
        <PlotDetailWhatsMissingCard onOpenSection={setOpenSectionRequest} />
        <PlotDetailSections
          plotId={plotId}
          openSectionRequest={openSectionRequest}
          onOpenSectionRequestHandled={() => setOpenSectionRequest(null)}
        />
      </div>
    </div>
  );
}

export function PlotDetailPageContent({ plotId }: { plotId: string }) {
  return (
    <PlotDetailProvider plotId={plotId}>
      <PlotDetailPageInner plotId={plotId} />
    </PlotDetailProvider>
  );
}
