'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PlotTenureStatusPanel } from '@/components/plots/plot-tenure-status-panel';
import { PlotEvidencePanel } from '@/components/evidence/plot-evidence-panel';
import { PlotDeforestationDecisionHistoryPanel } from '@/components/plots/plot-deforestation-decision-history-panel';
import { PlotAssignmentLifecyclePanel } from '@/components/plots/plot-assignment-lifecycle-panel';
import { PlotDetailAuditHistoryLink } from '@/components/plots/plot-detail-audit-history-link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { usePlotDetailContext } from '@/lib/plot-detail-context';
import {
  canRunPlotDeforestationScreening,
  getDefaultPlotDetailSectionOpen,
  isPlotScreeningClear,
  shouldShowPlotDetailSection,
  type PlotDetailSectionId,
} from '@/lib/plot-detail-section-policy';
import { LocaleContext } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import { getPlotDetailSectionsCopy } from '@/lib/workflow-terminology-labels';

interface PlotDetailSectionsProps {
  plotId: string;
  openSectionRequest: PlotDetailSectionId | null;
  onOpenSectionRequestHandled: () => void;
}

function SectionShell({
  id,
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      id={id}
      open={open}
      onOpenChange={onOpenChange}
      className="scroll-mt-20 rounded-lg border border-border bg-card"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
          aria-expanded={open}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ChevronDown
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-4 pb-4 pt-2">
        {open ? children : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PlotDetailSections({
  plotId,
  openSectionRequest,
  onOpenSectionRequestHandled,
}: PlotDetailSectionsProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { assessment, preview } = usePlotDetailContext();
  const role = user?.active_role;
  const hasGaps = (assessment?.gaps.length ?? 0) > 0;
  const screeningClear = isPlotScreeningClear(preview?.status);

  const [openSections, setOpenSections] = useState<Record<PlotDetailSectionId, boolean>>(() =>
    getDefaultPlotDetailSectionOpen({ role, hasGaps, screeningClear }),
  );

  const setSectionOpen = useCallback((section: PlotDetailSectionId, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [section]: open }));
  }, []);

  useEffect(() => {
    if (!openSectionRequest) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    setSectionOpen(openSectionRequest, true);
    onOpenSectionRequestHandled();
    const el = document.getElementById(`plot-section-${openSectionRequest}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [openSectionRequest, onOpenSectionRequestHandled, setSectionOpen]);

  const readOnlyScreening = !canRunPlotDeforestationScreening(role);

  return (
    <div className="space-y-3">
      {shouldShowPlotDetailSection('documents', role) ? (
        <SectionShell
          id="plot-section-documents"
          title={getPlotDetailSectionsCopy('documents_title', t)}
          description={getPlotDetailSectionsCopy('documents_description', t)}
          open={openSections.documents}
          onOpenChange={(open) => setSectionOpen('documents', open)}
        >
          <div className="space-y-4">
            <PlotTenureStatusPanel plotId={plotId} embedded />
            <PlotEvidencePanel plotId={plotId} embedded />
          </div>
        </SectionShell>
      ) : null}

      {shouldShowPlotDetailSection('screening', role) ? (
        <SectionShell
          id="plot-section-screening"
          title={getPlotDetailSectionsCopy('screening_title', t)}
          description={getPlotDetailSectionsCopy('screening_description', t)}
          open={openSections.screening}
          onOpenChange={(open) => setSectionOpen('screening', open)}
        >
          <PlotDeforestationDecisionHistoryPanel plotId={plotId} embedded readOnly={readOnlyScreening} />
        </SectionShell>
      ) : null}

      <PlotDetailAuditHistoryLink plotId={plotId} />

      {shouldShowPlotDetailSection('field_ops', role) ? (
        <SectionShell
          id="plot-section-field_ops"
          title={getPlotDetailSectionsCopy('field_ops_title', t)}
          description={getPlotDetailSectionsCopy('field_ops_description', t)}
          open={openSections.field_ops}
          onOpenChange={(open) => setSectionOpen('field_ops', open)}
        >
          <PlotAssignmentLifecyclePanel plotId={plotId} embedded />
        </SectionShell>
      ) : null}
    </div>
  );
}
