'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Hand,
  Unlock,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Play,
  CheckCircle2,
  XCircle,
  User,
  Zap,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrationRun, TimelineEvent, RunStatus } from '@/types/integrations';
import { getMockTimeline, getUserNameById } from '@/lib/integrations-mock-data';

interface RunDetailsDrawerProps {
  run: IntegrationRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: (run: IntegrationRun) => void;
  onRelease: (run: IntegrationRun, force?: boolean) => void;
  onRetry: (run: IntegrationRun) => void;
}

function StatusBadge({ status }: { status: RunStatus }) {
  const variants: Record<RunStatus, { variant: 'info' | 'success' | 'destructive'; label: string }> = {
    started: { variant: 'info', label: 'Started' },
    completed: { variant: 'success', label: 'Completed' },
    failed: { variant: 'destructive', label: 'Failed' },
  };

  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function TimelineEventIcon({ type }: { type: TimelineEvent['type'] }) {
  const iconMap: Record<TimelineEvent['type'], { icon: React.ElementType; className: string }> = {
    draft_saved: { icon: FileText, className: 'text-muted-foreground bg-muted' },
    submitted: { icon: Play, className: 'text-blue-600 bg-blue-100' },
    run_started: { icon: Play, className: 'text-blue-600 bg-blue-100' },
    run_completed: { icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-100' },
    run_failed: { icon: XCircle, className: 'text-red-600 bg-red-100' },
    claimed: { icon: Hand, className: 'text-amber-600 bg-amber-100' },
    released: { icon: Unlock, className: 'text-slate-600 bg-slate-100' },
    retried: { icon: RotateCcw, className: 'text-blue-600 bg-blue-100' },
    stale_released: { icon: Zap, className: 'text-amber-600 bg-amber-100' },
  };

  const { icon: Icon, className } = iconMap[type] || { icon: Clock, className: 'text-muted-foreground bg-muted' };

  return (
    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', className)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function TimelineEventLabel({ type }: { type: TimelineEvent['type'] }) {
  const labels: Record<TimelineEvent['type'], string> = {
    draft_saved: 'Draft Saved',
    submitted: 'Submitted',
    run_started: 'Run Started',
    run_completed: 'Run Completed',
    run_failed: 'Run Failed',
    claimed: 'Claimed',
    released: 'Released',
    retried: 'Retried',
    stale_released: 'Stale Released',
  };

  return <span className="font-medium">{labels[type] || type}</span>;
}

function ExpandablePayload({ payload }: { payload: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        View payload
      </button>
      {expanded && (
        <pre className="mt-2 rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function RunDetailsDrawer({
  run,
  open,
  onOpenChange,
  onClaim,
  onRelease,
  onRetry,
}: RunDetailsDrawerProps) {
  if (!run) return null;
  // TODO: Replace with actual API call
  // GET /v1/integrations/coolfarm-sai/v2/questionnaire-drafts/{id}/runs
  const timeline: TimelineEvent[] = getMockTimeline(run.id);

  const canClaim = run.status === 'failed' && !run.claimedByUserId;
  const canRelease = !!run.claimedByUserId;
  const canRetry = run.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg">Run Details</DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                {run.id}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 -mt-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Status & Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={run.status} />
              <Badge variant="outline" className="font-mono text-xs">
                {run.runType}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Questionnaire</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="font-mono">{run.questionnaireId}</span>
                  <CopyButton text={run.questionnaireId} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attempt</p>
                <p className="mt-0.5 font-medium">{run.attemptCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Queued At</p>
                <p className="mt-0.5">{formatTimestamp(run.queuedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated At</p>
                <p className="mt-0.5">{formatTimestamp(run.updatedAt)}</p>
              </div>
            </div>

            {run.errorCode && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-medium text-red-800">Error Code</p>
                <p className="mt-0.5 font-mono text-sm text-red-700">{run.errorCode}</p>
              </div>
            )}

            {run.claimedByUserId && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Claimed by</p>
                    <p className="text-sm text-amber-700">
                      {getUserNameById(run.claimedByUserId)}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {formatTimestamp(run.claimedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {run.nextRetryAt && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Next Retry</p>
                    <p className="text-sm text-blue-700">
                      {formatTimestamp(run.nextRetryAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onClaim(run)}
                disabled={!canClaim}
              >
                <Hand className="mr-1.5 h-3.5 w-3.5" />
                Claim
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRelease(run, false)}
                disabled={!canRelease}
              >
                <Unlock className="mr-1.5 h-3.5 w-3.5" />
                Release
              </Button>
              {canRelease && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => onRelease(run, true)}
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  Force Release
                </Button>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={() => onRetry(run)}
                disabled={!canRetry}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timeline
            </p>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <TimelineEventIcon type={event.type} />
                    {index < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <TimelineEventLabel type={event.type} />
                      {event.actor && (
                        <span className="text-xs text-muted-foreground">
                          by {event.actor}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </p>
                    {event.payload && <ExpandablePayload payload={event.payload} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
