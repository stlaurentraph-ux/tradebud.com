'use client';

import { useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePlotDetailContext } from '@/lib/plot-detail-context';
import { getPlotReadinessGapAction } from '@/lib/plot-detail-gap-actions';
import { LocaleContext } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import { getPlotEudrReadinessCopy, getPlotEudrReadinessGapsSummary } from '@/lib/workflow-terminology-labels';
import type { PlotDetailSectionId } from '@/lib/plot-detail-section-policy';

interface PlotDetailWhatsMissingCardProps {
  onOpenSection: (section: PlotDetailSectionId) => void;
}

export function PlotDetailWhatsMissingCard({ onOpenSection }: PlotDetailWhatsMissingCardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { assessment, isLoading } = usePlotDetailContext();
  const [expanded, setExpanded] = useState(false);

  const gaps = assessment?.gaps ?? [];
  const ready = assessment?.ready ?? false;
  const gapsSummary = getPlotEudrReadinessGapsSummary(gaps, t);

  const primaryAction = useMemo(() => {
    if (!assessment || ready) return null;
    const blocking = gaps.filter((g) => g.severity === 'blocking');
    const ordered = [...(blocking.length > 0 ? blocking : gaps)];
    const first = ordered[0];
    if (!first) return null;
    return getPlotReadinessGapAction(first.id);
  }, [assessment, gaps, ready]);

  if (isLoading && !assessment) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          {getPlotEudrReadinessCopy('loading', t)}
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return null;
  }

  if (ready) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {getPlotEudrReadinessCopy('all_clear_title', t)}
            </p>
            <p className="text-xs text-muted-foreground">
              {getPlotEudrReadinessCopy('all_clear_body', t)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {getPlotEudrReadinessCopy('title', t)}
              </p>
              <p className="text-xs text-muted-foreground">{gapsSummary}</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                {expanded ? 'Hide list' : 'Show list'}
                <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="pt-2">
            <ul className="space-y-2 text-sm">
              {gaps.map((gap) => {
                const action = getPlotReadinessGapAction(gap.id);
                return (
                  <li
                    key={gap.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex min-w-0 gap-2">
                      <AlertCircle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          gap.severity === 'blocking' ? 'text-destructive' : 'text-amber-500'
                        }`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-medium text-foreground">{gap.label}</p>
                        <p className="text-xs text-muted-foreground">{gap.detail}</p>
                      </div>
                    </div>
                    {action.href ? (
                      <Button variant="outline" size="sm" className="shrink-0" asChild>
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                    ) : action.section ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => onOpenSection(action.section!)}
                      >
                        {action.label}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {primaryAction ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3 md:hidden">
            {primaryAction.href ? (
              <Button size="sm" className="w-full" asChild>
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : primaryAction.section ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onOpenSection(primaryAction.section!)}
              >
                {primaryAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
