'use client';

import { useMemo, useState } from 'react';
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

function statusLabel(status: string): string {
  switch (status) {
    case 'under_review':
      return 'Under review';
    case 'degradation_risk':
      return 'Overlap risk';
    case 'deforestation_detected':
      return 'Deforestation flagged';
    default:
      return status;
  }
}

function formatHa(value: number | null): string {
  if (value == null) return 'n/a';
  return `${value.toFixed(value < 0.1 ? 3 : 2)} ha`;
}

function formatPct(value: number | null): string {
  if (value == null) return 'n/a';
  return `${value.toFixed(1)}%`;
}

function ScreeningExplainabilityCard({ screening }: { screening: PlotScreeningContext }) {
  return (
    <div className="rounded-md border p-3 space-y-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium flex items-center gap-2">
          <TreeDeciduous className="h-4 w-4" />
          GFW screening explainability
        </p>
        <div className="flex flex-wrap gap-2">
          {screening.signalTier ? (
            <Badge variant="outline" className="capitalize">
              Alert tier: {screening.signalTier}
            </Badge>
          ) : null}
          <Badge variant="outline" className={cn('capitalize', contextSignalClass(screening.signal))}>
            {screening.signalLabel}
          </Badge>
          {screening.contextAdjusted ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
              Context-adjusted
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">Integrated alerts</p>
          <p className="font-medium">
            {screening.alertCount ?? 'n/a'} hits · {formatHa(screening.alertAreaHa)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Tropical tree cover (avg)</p>
          <p className="font-medium">{formatPct(screening.tropicalTreeCoverAvgPct)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Hansen loss (post-cutoff)</p>
          <p className="font-medium">{formatHa(screening.treeCoverLossHa)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Natural forest overlap</p>
          <p className="font-medium">{formatHa(screening.naturalForestHa)}</p>
        </div>
      </div>

      {screening.datasets.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 mt-0.5" />
          {screening.datasets.map((layer) => (
            <span key={layer.dataset} className="rounded border px-2 py-0.5">
              {layer.dataset}: {layer.ok ? 'ok' : layer.error ?? 'failed'}
            </span>
          ))}
        </div>
      ) : null}

      {screening.screenedAt ? (
        <p className="text-xs text-muted-foreground">
          Last screened {new Date(screening.screenedAt).toLocaleString()}
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
      setSubmitError('Enter a reason with at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitDecision(selected.id, action, reason.trim());
      setDialogOpen(false);
      setSelected(null);
    } catch (submitErr) {
      setSubmitError(submitErr instanceof Error ? submitErr.message : 'Decision failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGate permission="compliance:view">
      <div className="flex flex-col">
        <AppHeader
          title="Plot review queue"
          subtitle="Adjudicate satellite flags, overlap risk, and ground-truth evidence before plots clear to compliant"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Compliance', href: '/compliance' },
            { label: 'Plot review' },
          ]}
        />

        <div className="flex-1 space-y-6 p-6">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Plots awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{counts.high}</p>
                <p className="text-sm text-muted-foreground mt-1">High priority</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-emerald-600">{counts.autoEligible}</p>
                <p className="text-sm text-muted-foreground mt-1">Auto-clearance eligible</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
                Loading plot review queue…
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
                No plots currently require compliance review.
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
                            {item.farmer_name ?? 'Producer'} ·{' '}
                            {item.area_ha != null ? `${Number(item.area_ha).toFixed(2)} ha` : 'Area n/a'}
                            {item.production_system ? ` · ${item.production_system}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn('capitalize', priorityClass(item.reviewPriority))}>
                            {item.reviewPriority} priority
                          </Badge>
                          <Badge variant="outline">{statusLabel(item.status)}</Badge>
                          {item.autoClearanceEligible ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              Auto-clear eligible
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
                            Overlap signals
                          </p>
                          <p className="text-muted-foreground">
                            SINAPH overlap: {item.sinaph_overlap ? 'yes' : 'no'} · Indigenous overlap:{' '}
                            {item.indigenous_overlap ? 'yes' : 'no'}
                          </p>
                        </div>
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Ground-truth photos
                          </p>
                          {photos ? (
                            <p className="text-muted-foreground">
                              {photos.clearanceVerifiedCount}/{photos.minRequired} clearance-verified (
                              {photos.geoVerifiedCount} on-plot, {photos.timestampVerifiedCount} after{' '}
                              {photos.cutoffDate})
                            </p>
                          ) : (
                            <p className="text-muted-foreground">No synced photo batch yet.</p>
                          )}
                        </div>
                        {screening ? <ScreeningExplainabilityCard screening={screening} /> : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/plots/${item.id}`}>Open plot</Link>
                        </Button>
                        {canAdjudicate ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDecision(item, 'uphold')}
                            >
                              <AlertTriangle className="mr-1 h-4 w-4" />
                              Uphold block
                            </Button>
                            <Button size="sm" onClick={() => openDecision(item, 'clear')}>
                              Clear to compliant
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
              <DialogTitle>
                {action === 'clear' ? 'Clear plot review' : 'Uphold plot block'}
              </DialogTitle>
              <DialogDescription>
                {selected
                  ? `${selected.name} — ${statusLabel(selected.status)}. This decision is audited.`
                  : null}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="plot-review-reason">Reason</Label>
              <Textarea
                id="plot-review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the evidence reviewed and why this outcome is justified."
                rows={4}
              />
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : action === 'clear' ? 'Confirm clearance' : 'Confirm uphold'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
