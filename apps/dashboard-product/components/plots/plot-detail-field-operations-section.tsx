'use client';

import { useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PlotAssignmentLifecyclePanel } from '@/components/plots/plot-assignment-lifecycle-panel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { canViewPlotFieldOperations } from '@/lib/plot-detail-field-ops';
import { cn } from '@/lib/utils';
import { getPlotDetailFieldOpsCopy } from '@/lib/workflow-terminology-labels';

interface PlotDetailFieldOperationsSectionProps {
  plotId: string;
}

export function PlotDetailFieldOperationsSection({ plotId }: PlotDetailFieldOperationsSectionProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [open, setOpen] = useState(false);

  if (!canViewPlotFieldOperations(user?.active_role)) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-card">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
          aria-expanded={open}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {getPlotDetailFieldOpsCopy('title', t)}
            </p>
            <p className="text-xs text-muted-foreground">
              {getPlotDetailFieldOpsCopy('description', t)}
            </p>
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
        {open ? <PlotAssignmentLifecyclePanel plotId={plotId} embedded /> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
