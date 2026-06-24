'use client';

import { useCallback, useContext, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  canApprovePlotGeometry,
  plotGeometryApprovalRecommended,
  normalizePlotGeometryApprovalState,
} from '@/lib/plot-geometry-approval-policy';
import { usePlotGeometryApproval } from '@/lib/use-plot-geometry-approval';
import { usePlotMapPreview } from '@/lib/use-plot-map-preview';
import { getPlotGeometryApprovalCopy } from '@/lib/workflow-terminology-labels';

interface PlotGeometryApprovalCardProps {
  plotId: string;
}

export function PlotGeometryApprovalCard({ plotId }: PlotGeometryApprovalCardProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { preview, isLoading, error: previewError, reload } = usePlotMapPreview(plotId);
  const { approve, isApproving, error: approveError } = usePlotGeometryApproval(plotId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [optimisticApprovedAt, setOptimisticApprovedAt] = useState<string | null>(null);

  const state = useMemo(
    () =>
      preview
        ? normalizePlotGeometryApprovalState({
            geometry_approved_at: (preview as { geometry_approved_at?: string }).geometry_approved_at,
            geometry_capture: preview.geometry_capture,
          })
        : { geometryApprovedAt: null, capture: null },
    [preview],
  );

  const canApprove = canApprovePlotGeometry(user?.active_role);
  const recommended = plotGeometryApprovalRecommended(state.capture);
  const effectiveApprovedAt = optimisticApprovedAt ?? state.geometryApprovedAt;
  const isApproved = Boolean(effectiveApprovedAt);

  const handleApprove = useCallback(async () => {
    const approvedAt = await approve();
    if (approvedAt) {
      setOptimisticApprovedAt(approvedAt);
      setSuccessMessage(getPlotGeometryApprovalCopy('success', t));
      reload();
    }
  }, [approve, reload, t]);

  if (isLoading) {
    return (
      <Card data-testid="plot-geometry-approval-card">
        <CardHeader>
          <CardTitle>{getPlotGeometryApprovalCopy('title', t)}</CardTitle>
        </CardHeader>
        <CardContent>{getPlotGeometryApprovalCopy('loading', t)}</CardContent>
      </Card>
    );
  }

  if (previewError || !preview) {
    return null;
  }

  const bodyCopy = isApproved
    ? getPlotGeometryApprovalCopy('approved_body', t, {
        date: new Date(effectiveApprovedAt as string).toLocaleDateString(),
      })
    : recommended
      ? getPlotGeometryApprovalCopy('recommended_body', t)
      : getPlotGeometryApprovalCopy('body', t);

  return (
    <Card data-testid="plot-geometry-approval-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{getPlotGeometryApprovalCopy('title', t)}</CardTitle>
        <Badge
          data-testid="plot-geometry-approval-badge"
          variant={isApproved ? 'default' : recommended ? 'secondary' : 'outline'}
        >
          {isApproved
            ? getPlotGeometryApprovalCopy('approved_badge', t)
            : recommended
              ? getPlotGeometryApprovalCopy('needs_review_badge', t)
              : getPlotGeometryApprovalCopy('needs_review_badge', t)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{bodyCopy}</p>
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        {approveError ? <p className="text-sm text-destructive">{approveError}</p> : null}
        {canApprove && !isApproved ? (
          <Button
            data-testid="plot-geometry-approval-action"
            disabled={isApproving}
            onClick={handleApprove}
          >
            {isApproving
              ? getPlotGeometryApprovalCopy('approving', t)
              : getPlotGeometryApprovalCopy('approve_action', t)}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
