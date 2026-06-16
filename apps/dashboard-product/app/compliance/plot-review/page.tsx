'use client';

import { useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Layers, MapPin, ShieldAlert, TreeDeciduous } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { useAuth } from '@/lib/auth-context';
import { hasAnyPermission } from '@/lib/rbac';
import {
  contextSignalClass,
  parsePlotScreeningContext,
  type PlotScreeningContext,
} from '@/lib/plot-screening-context';
import { usePlotReviewQueue, type PlotReviewQueueItem } from '@/lib/use-plot-review-queue';
import { LocaleContext } from '@/lib/locale-context';
import {
  buildPlotReviewBreadcrumbs,
  getPlotReviewAutoClearBadgeLabel,
  getPlotReviewClearCompliantLabel,
  getPlotReviewDecisionFailedMessage,
  getPlotReviewDialogCancelLabel,
  getPlotReviewDialogConfirmLabel,
  getPlotReviewDialogDescription,
  getPlotReviewDialogReasonLabel,
  getPlotReviewDialogReasonPlaceholder,
  getPlotReviewDialogSavingLabel,
  getPlotReviewDialogTitle,
  getPlotReviewEmptyMessage,
  getPlotReviewLoadingMessage,
  getPlotReviewOpenPlotLabel,
  getPlotReviewOverlapSummary,
  getPlotReviewOverlapTitle,
  getPlotReviewPageSubtitle,
  getPlotReviewPageTitle,
  getPlotReviewPhotosEmptyMessage,
  getPlotReviewPhotosSummary,
  getPlotReviewPhotosTitle,
  getPlotReviewPriorityBadgeLabel,
  getPlotReviewProducerFallback,
  getPlotReviewAreaNaLabel,
  getPlotReviewReasonMinLengthMessage,
  getPlotReviewScreeningAlertTierLabel,
  getPlotReviewScreeningContextAdjustedLabel,
  getPlotReviewScreeningDatasetLabel,
  getPlotReviewScreeningHitsHaLabel,
  getPlotReviewScreeningLastScreenedLabel,
  getPlotReviewScreeningMetricLabel,
  getPlotReviewScreeningTitle,
  getPlotReviewStatLabel,
  getPlotReviewStatusLabel,
  getPlotReviewTenureBanner,
  getPlotReviewTenureCta,
  getPlotReviewUpholdBlockLabel,
} from '@/lib/workflow-terminology-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function statusLabel(status: string, t?: (key: string) => string): string {
  return getPlotReviewStatusLabel(status, t);
}

function formatHa(value: number | null): string {
  if (value == null) return 'n/a';
  return `${value.toFixed(value < 0.1 ? 3 : 2)} ha`;
}

function formatPct(value: number | null): string {
  if (value == null) return 'n/a';
  return `${value.toFixed(1)}%`;
}

function ScreeningExplainabilityCard({
  screening,
  t,
}: {
  screening: PlotScreeningContext;
  t?: (key: string) => string;
}) {
  return (
    <div className="rounded-md border p-3 space-y-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium flex items-center gap-2">
          <TreeDeciduous className="h-4 w-4" />
          {getPlotReviewScreeningTitle(t)}
        </p>
        <div className="flex flex-wrap gap-2">
          {screening.signalTier ? (
            <Badge variant="outline" className="capitalize">
              {getPlotReviewScreeningAlertTierLabel(screening.signalTier, t)}
            </Badge>
          ) : null}
          <Badge variant="outline" className={cn('capitalize', contextSignalClass(screening.signal))}>
            {screening.signalLabel}
          </Badge>
          {screening.contextAdjusted ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
              {getPlotReviewScreeningContextAdjustedLabel(t)}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">{getPlotReviewScreeningMetricLabel('integrated_alerts', t)}</p>
          <p className="font-medium">
            {getPlotReviewScreeningHitsHaLabel(screening.alertCount ?? 'n/a', formatHa(screening.alertAreaHa), t)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{getPlotReviewScreeningMetricLabel('tree_cover', t)}</p>
          <p className="font-medium">{formatPct(screening.tropicalTreeCoverAvgPct)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{getPlotReviewScreeningMetricLabel('hansen_loss', t)}</p>
          <p className="font-medium">{formatHa(screening.treeCoverLossHa)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{getPlotReviewScreeningMetricLabel('natural_forest', t)}</p>
          <p className="font-medium">{formatHa(screening.naturalForestHa)}</p>
        </div>
      </div>

      {screening.datasets.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 mt-0.5" />
          {screening.datasets.map((layer) => (
            <span key={layer.dataset} className="rounded border px-2 py-0.5">
              {getPlotReviewScreeningDatasetLabel(layer.dataset, layer.ok, layer.error, t)}
            </span>
          ))}
        </div>
      ) : null}

      {screening.screenedAt ? (
        <p className="text-xs text-muted-foreground">
          {getPlotReviewScreeningLastScreenedLabel(new Date(screening.screenedAt).toLocaleString(), t)}
        </p>
      ) : null}
    </div>
  );
}

function priorityClass(priority: PlotReviewQueueItem['reviewPriority']): string {
  if (priority === 'high') return 'bg-red-500/15 text-red-700 border-red-200';
  if (priority === 'medium') return 'bg-amber-500/15 text-amber-700 border-amber-200';
  return 'bg-blue-500/15 text-blue-700 border-blue-200';
}

export default function PlotReviewQueuePage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const { items, isLoading, error, submitDecision } = usePlotReviewQueue(true);
  const canAdjudicate = hasAnyPermission(user, ['compliance:approve', 'compliance:resolve_issue']);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PlotReviewQueueItem | null>(null);
  const [action, setAction] = useState<'clear' | 'uphold'>('clear');
  const [reason, setReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const counts = useMemo(() => {
    return {
      total: items.length,
      high: items.filter((item) => item.reviewPriority === 'high').length,
      autoEligible: items.filter((item) => item.autoClearanceEligible).length,
    };
  }, [items]);

  const openDecision = (item: PlotReviewQueueItem, nextAction: 'clear' | 'uphold') => {
    setSelected(item);
    setAction(nextAction);
    setReason('');
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selected || reason.trim().length < 8) {
      setSubmitError(getPlotReviewReasonMinLengthMessage(t));
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitDecision(selected.id, action, reason.trim());
      setDialogOpen(false);
      setSelected(null);
    } catch (submitErr) {
      setSubmitError(submitErr instanceof Error ? submitErr.message : getPlotReviewDecisionFailedMessage(t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGate permission="compliance:view">
      <div className="flex flex-col">
        <AppHeader
          title={getPlotReviewPageTitle(t)}
          subtitle={getPlotReviewPageSubtitle(t)}
          breadcrumbs={buildPlotReviewBreadcrumbs(t)}
        />

        <div className="flex-1 space-y-6 p-6">
          <div className="rounded-md border bg-secondary/20 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">{getPlotReviewTenureBanner(t)}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/compliance/tenure-review">{getPlotReviewTenureCta(t)}</Link>
            </Button>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground mt-1">{getPlotReviewStatLabel('awaiting', t)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{counts.high}</p>
                <p className="text-sm text-muted-foreground mt-1">{getPlotReviewStatLabel('high_priority', t)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-emerald-600">{counts.autoEligible}</p>
                <p className="text-sm text-muted-foreground mt-1">{getPlotReviewStatLabel('auto_clear', t)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
                {getPlotReviewLoadingMessage(t)}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
                {getPlotReviewEmptyMessage(t)}
              </div>
            ) : (
              items.map((item) => {
                const photos = item.groundTruthPhotos;
                const screening = parsePlotScreeningContext(item.deforestation_screening);
                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {item.farmer_name ?? getPlotReviewProducerFallback(t)} ·{' '}
                            {item.area_ha != null
                              ? `${Number(item.area_ha).toFixed(2)} ha`
                              : getPlotReviewAreaNaLabel(t)}
                            {item.production_system ? ` · ${item.production_system}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn('capitalize', priorityClass(item.reviewPriority))}>
                            {getPlotReviewPriorityBadgeLabel(item.reviewPriority, t)}
                          </Badge>
                          <Badge variant="outline">{statusLabel(item.status, t)}</Badge>
                          {item.autoClearanceEligible ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              {getPlotReviewAutoClearBadgeLabel(t)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 text-sm">
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            {getPlotReviewOverlapTitle(t)}
                          </p>
                          <p className="text-muted-foreground">
                            {getPlotReviewOverlapSummary(
                              item.sinaph_overlap ?? false,
                              item.indigenous_overlap ?? false,
                              t,
                            )}
                          </p>
                        </div>
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {getPlotReviewPhotosTitle(t)}
                          </p>
                          {photos ? (
                            <p className="text-muted-foreground">
                              {getPlotReviewPhotosSummary(
                                photos.clearanceVerifiedCount,
                                photos.minRequired,
                                photos.geoVerifiedCount,
                                photos.timestampVerifiedCount,
                                photos.cutoffDate,
                                t,
                              )}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">{getPlotReviewPhotosEmptyMessage(t)}</p>
                          )}
                        </div>
                        {screening ? <ScreeningExplainabilityCard screening={screening} t={t} /> : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/plots/${item.id}`}>{getPlotReviewOpenPlotLabel(t)}</Link>
                        </Button>
                        {canAdjudicate ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDecision(item, 'uphold')}
                            >
                              <AlertTriangle className="mr-1 h-4 w-4" />
                              {getPlotReviewUpholdBlockLabel(t)}
                            </Button>
                            <Button size="sm" onClick={() => openDecision(item, 'clear')}>
                              {getPlotReviewClearCompliantLabel(t)}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getPlotReviewDialogTitle(action, t)}</DialogTitle>
              <DialogDescription>
                {selected
                  ? getPlotReviewDialogDescription(selected.name, statusLabel(selected.status, t), t)
                  : null}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="plot-review-reason">{getPlotReviewDialogReasonLabel(t)}</Label>
              <Textarea
                id="plot-review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={getPlotReviewDialogReasonPlaceholder(t)}
                rows={4}
              />
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                {getPlotReviewDialogCancelLabel(t)}
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? getPlotReviewDialogSavingLabel(t) : getPlotReviewDialogConfirmLabel(action, t)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
