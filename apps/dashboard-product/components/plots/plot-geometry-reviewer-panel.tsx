'use client';

import { useContext, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlotSatelliteMap, type PlotMapOverlayPolygon } from '@/components/plots/plot-satellite-map';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  geometryCaptureNeedsReview,
  normalizePlotGeometryCapture,
} from '@/lib/plot-geometry-capture';
import { canRevisePlotGeometry } from '@/lib/plot-geometry-reviewer-policy';
import {
  areaVariancePercent,
  polygonAreaHectares,
  polygonToGeoJson,
  simplifyPolygonRing,
} from '@/lib/plot-geometry-simplify';
import { extractGeoJsonCoordinates } from '@/lib/plot-map-preview-geometry';
import { normalizePlotKind } from '@/lib/plot-inventory';
import { usePlotGeometryRevision } from '@/lib/use-plot-geometry-revision';
import { usePlotMapPreview } from '@/lib/use-plot-map-preview';
import { usePlotMapTileProvider } from '@/lib/use-plot-map-tile-provider';
import { getPlotGeometryReviewerCopy } from '@/lib/workflow-terminology-labels';

const REVIEWER_MAP_HEIGHT_CLASS = 'h-[280px]';
const AREA_VARIANCE_LIMIT_PCT = 5;

interface PlotGeometryReviewerPanelProps {
  plotId: string;
}

function formatHa(value: number): string {
  return `${value.toFixed(value < 0.1 ? 3 : 2)} ha`;
}

export function PlotGeometryReviewerPanel({ plotId }: PlotGeometryReviewerPanelProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { preview, isLoading, error, reload } = usePlotMapPreview(plotId);
  const { tileProvider, attribution } = usePlotMapTileProvider();
  const { applyRevision, isApplying, error: applyError } = usePlotGeometryRevision(plotId);
  const [toleranceM, setToleranceM] = useState(8);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const role = user?.active_role;
  const kind = preview ? normalizePlotKind(preview.kind) : 'unknown';
  const coordinates = useMemo(
    () => (preview?.geometry ? extractGeoJsonCoordinates(preview.geometry) : []),
    [preview?.geometry],
  );
  const capture = useMemo(
    () => normalizePlotGeometryCapture(preview?.geometry_capture),
    [preview?.geometry_capture],
  );
  const needsReview = geometryCaptureNeedsReview(capture);

  const simplified = useMemo(
    () => simplifyPolygonRing(coordinates, toleranceM),
    [coordinates, toleranceM],
  );
  const beforeAreaHa = useMemo(() => polygonAreaHectares(coordinates), [coordinates]);
  const afterAreaHa = useMemo(() => polygonAreaHectares(simplified), [simplified]);
  const variancePct = useMemo(
    () => areaVariancePercent(beforeAreaHa, afterAreaHa),
    [beforeAreaHa, afterAreaHa],
  );

  const overlayPolygons = useMemo((): PlotMapOverlayPolygon[] => {
    const vertexDelta = coordinates.length - simplified.length;
    const overlays: PlotMapOverlayPolygon[] = [{ coordinates, variant: 'current' }];
    if (vertexDelta > 0 && simplified.length >= 3) {
      overlays.push({ coordinates: simplified, variant: 'suggested' });
    }
    return overlays;
  }, [coordinates, simplified]);

  const canShow =
    canRevisePlotGeometry(role) && kind === 'polygon' && coordinates.length >= 3;

  const vertexDelta = coordinates.length - simplified.length;
  const hasSimplification = vertexDelta > 0;
  const varianceBlocked = variancePct != null && variancePct > AREA_VARIANCE_LIMIT_PCT;
  const canApply =
    hasSimplification && !varianceBlocked && reason.trim().length >= 8 && !isApplying;

  const handleApply = async () => {
    setSuccessMessage(null);
    try {
      await applyRevision({
        geometry: polygonToGeoJson(simplified),
        reason: reason.trim(),
        reviewerAssist: true,
      });
      setSuccessMessage(getPlotGeometryReviewerCopy('apply_success', t));
      setReason('');
      reload();
    } catch {
      // error surfaced via hook
    }
  };

  if (!canShow) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">
            {getPlotGeometryReviewerCopy('title', t)}
          </CardTitle>
          {needsReview ? (
            <Badge variant="secondary">
              {getPlotGeometryReviewerCopy('needs_review_badge', t)}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {getPlotGeometryReviewerCopy('description', t)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`relative w-full overflow-hidden rounded-md border border-border bg-muted ${REVIEWER_MAP_HEIGHT_CLASS}`}
        >
          {isLoading && !preview ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {getPlotGeometryReviewerCopy('loading', t)}
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : coordinates.length > 0 ? (
            <PlotSatelliteMap
              coordinates={coordinates}
              kind="polygon"
              overlayPolygons={overlayPolygons}
              tileProvider={tileProvider}
              className="h-full"
              ariaLabel={getPlotGeometryReviewerCopy('map_aria', t)}
              attribution={attribution}
            />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`tolerance-${plotId}`}>
              {getPlotGeometryReviewerCopy('tolerance_label', t)}
            </Label>
            <input
              id={`tolerance-${plotId}`}
              type="range"
              min={2}
              max={40}
              step={1}
              value={toleranceM}
              onChange={(event) => setToleranceM(Number(event.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {getPlotGeometryReviewerCopy('tolerance_value', t, { meters: toleranceM })}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">
                {getPlotGeometryReviewerCopy('vertices_label', t)}
              </dt>
              <dd className="font-medium">
                {coordinates.length} → {simplified.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {getPlotGeometryReviewerCopy('area_label', t)}
              </dt>
              <dd className="font-medium">
                {formatHa(beforeAreaHa)} → {formatHa(afterAreaHa)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">
                {getPlotGeometryReviewerCopy('variance_label', t)}
              </dt>
              <dd className={varianceBlocked ? 'font-medium text-destructive' : 'font-medium'}>
                {variancePct == null ? '—' : `${variancePct.toFixed(2)}%`}
                {varianceBlocked
                  ? ` · ${getPlotGeometryReviewerCopy('variance_blocked', t)}`
                  : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`reason-${plotId}`}>
            {getPlotGeometryReviewerCopy('reason_label', t)}
          </Label>
          <Input
            id={`reason-${plotId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={getPlotGeometryReviewerCopy('reason_placeholder', t)}
          />
        </div>

        {!hasSimplification ? (
          <p className="text-xs text-muted-foreground">
            {getPlotGeometryReviewerCopy('no_simplification', t)}
          </p>
        ) : null}

        {applyError ? <p className="text-sm text-destructive">{applyError}</p> : null}
        {successMessage ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        ) : null}

        <Button type="button" disabled={!canApply} onClick={() => void handleApply()}>
          {isApplying
            ? getPlotGeometryReviewerCopy('applying', t)
            : getPlotGeometryReviewerCopy('apply', t)}
        </Button>
      </CardContent>
    </Card>
  );
}
