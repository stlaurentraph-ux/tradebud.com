'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ChevronRight, History } from 'lucide-react';
import { LocaleContext } from '@/lib/locale-context';
import { plotHistoryPath } from '@/lib/plot-detail-paths';
import {
  getPlotDetailHistoryPageCopy,
  getPlotDetailSectionsCopy,
} from '@/lib/workflow-terminology-labels';

interface PlotDetailAuditHistoryLinkProps {
  plotId: string;
}

export function PlotDetailAuditHistoryLink({ plotId }: PlotDetailAuditHistoryLinkProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <Link
      href={plotHistoryPath(plotId)}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex min-w-0 items-start gap-3">
        <History className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {getPlotDetailSectionsCopy('history_title', t)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getPlotDetailSectionsCopy('history_description', t)}
          </p>
          <p className="text-xs font-medium text-primary">
            {getPlotDetailHistoryPageCopy('link_cta', t)}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
