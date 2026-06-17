'use client';

import Link from 'next/link';
import { useContext, useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LocaleContext } from '@/lib/locale-context';
import {
  assessPlotEudrReadiness,
  buildInventoryRowFromMapPreview,
  defaultGroundTruthPhotoSummary,
  normalizeGroundTruthPhotoSummary,
} from '@/lib/plot-eudr-readiness';
import { computePlotTenureStatus } from '@/lib/plot-tenure-status';
import type { PlotMapPreviewRecord } from '@/lib/use-plot-map-preview';
import { useEvidenceFeed } from '@/lib/use-evidence-feed';
import { usePlotLegalSync } from '@/lib/use-plot-legal-sync';
import { getPlotEudrReadinessCopy } from '@/lib/workflow-terminology-labels';

interface PlotEudrReadinessSummaryProps {
  plotId: string;
  preview: PlotMapPreviewRecord | null;
  previewLoading?: boolean;
}

export function PlotEudrReadinessSummary({
  plotId,
  preview,
  previewLoading = false,
}: PlotEudrReadinessSummaryProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { documents, isLoading: evidenceLoading } = useEvidenceFeed({
    plotId,
    enabled: Boolean(plotId),
  });
  const { legalSync, isLoading: legalLoading } = usePlotLegalSync(plotId);

  const tenureEvidence = documents.filter((doc) => doc.evidence_kind === 'tenure_evidence');
  const tenureStatus = computePlotTenureStatus({
    informalTenure: legalSync?.informalTenure ?? null,
    cadastralKey: legalSync?.cadastralKey ?? null,
    tenureEvidenceCount: tenureEvidence.length,
    landTenureDeclared: null,
  });

  const inventoryRow = preview ? buildInventoryRowFromMapPreview(preview) : null;
  const groundTruthPhotos = preview?.ground_truth_photos
    ? normalizeGroundTruthPhotoSummary(preview.ground_truth_photos)
    : defaultGroundTruthPhotoSummary();

  const assessment = useMemo(() => {
    if (!inventoryRow) return null;
    return assessPlotEudrReadiness({
      plot: inventoryRow,
      tenureBadge: tenureStatus.badge,
      tenureEvidenceCount: tenureEvidence.length,
      plotEvidenceCount: documents.length,
      groundTruthPhotos,
    });
  }, [inventoryRow, tenureStatus.badge, tenureEvidence.length, documents.length, groundTruthPhotos]);

  const isLoading = previewLoading || evidenceLoading || legalLoading;

  if (isLoading && !assessment) {
    return (
      <p className="text-sm text-muted-foreground border-t border-border pt-3">
        {getPlotEudrReadinessCopy('loading', t)}
      </p>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {getPlotEudrReadinessCopy('title', t)}
        </h3>
        <Badge variant={assessment.ready ? 'default' : 'secondary'}>
          {assessment.ready
            ? getPlotEudrReadinessCopy('badge_ready', t)
            : getPlotEudrReadinessCopy('badge_incomplete', t)}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{getPlotEudrReadinessCopy('subtitle', t)}</p>

      {assessment.ready ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>{getPlotEudrReadinessCopy('all_clear_title', t)}</AlertTitle>
          <AlertDescription>{getPlotEudrReadinessCopy('all_clear_body', t)}</AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-2 text-sm">
          {assessment.gaps.map((gap) => (
            <li
              key={gap.id}
              className="flex gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
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
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="#plot-evidence" className="text-primary hover:underline">
          {getPlotEudrReadinessCopy('link_evidence', t)}
        </Link>
        <Link href="#plot-tenure" className="text-primary hover:underline">
          {getPlotEudrReadinessCopy('link_tenure', t)}
        </Link>
      </div>
    </div>
  );
}
