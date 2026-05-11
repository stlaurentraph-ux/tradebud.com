'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SchedulerConfig, StaleReleaseResult, TriggerSource } from '@/types/integrations';
import { getMockSchedulerConfig, getMockLastTriggerResult } from '@/lib/integrations-mock-data';

function TokenStatusIndicator({ configured, version }: { configured: boolean; version: string | null }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2',
        configured
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      )}
    >
      {configured ? (
        <>
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Token Configured</p>
            {version && (
              <p className="text-xs text-emerald-600">Version: {version}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700">Token Not Configured</p>
            <p className="text-xs text-red-600">Set COOLFARM_SAI_V2_SCHEDULER_TOKEN</p>
          </div>
        </>
      )}
    </div>
  );
}

function TriggerResultCard({ result }: { result: StaleReleaseResult | null }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">No Recent Triggers</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The stale sweeper has not been triggered yet.
        </p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSourceBadge = (source: TriggerSource) => {
    return source === 'scheduled' ? (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Scheduled
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Zap className="h-3 w-3" />
        Manual
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="font-medium">Last Trigger Result</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTimestamp(result.timestamp)}
          </p>
        </div>
        {getSourceBadge(result.triggerSource)}
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Claims Released</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">{result.releasedCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Token Version</p>
          <p className="mt-0.5 text-lg font-medium">{result.tokenVersion || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export function SchedulerSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [lastResult, setLastResult] = useState<StaleReleaseResult | null>(null);

  // Form state
  const [staleMinutes, setStaleMinutes] = useState(60);
  const [limit, setLimit] = useState(100);
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);

  // Load config
  useEffect(() => {
    // TODO: Replace with actual API call to get scheduler config
    const timer = setTimeout(() => {
      const mockConfig = getMockSchedulerConfig();
      const mockResult = getMockLastTriggerResult();
      setConfig(mockConfig);
      setLastResult(mockResult);
      setStaleMinutes(mockConfig.defaultStaleMinutes);
      setLimit(mockConfig.defaultLimit);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleTrigger = async () => {
    if (!config?.tokenConfigured) {
      toast.error('Scheduler token is not configured');
      return;
    }

    setIsTriggerLoading(true);

    // TODO: Replace with actual API call
    // POST /v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger
    // Headers: { 'x-tracebud-scheduler-token': '***' }
    // Body: { staleMinutes, limit }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const releasedCount = Math.floor(Math.random() * 5);
    const newResult: StaleReleaseResult = {
      releasedCount,
      timestamp: new Date().toISOString(),
      triggerSource: 'manual',
      tokenVersion: config.tokenVersion,
    };

    setLastResult(newResult);
    setIsTriggerLoading(false);

    if (releasedCount > 0) {
      toast.success(`Released ${releasedCount} stale claim${releasedCount !== 1 ? 's' : ''}`);
    } else {
      toast.info('No stale claims found to release');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading scheduler config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Stale Sweeper Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Scheduled Stale Sweeper</CardTitle>
              <CardDescription>
                Release runs that have been claimed for too long
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Status */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Token Status
            </Label>
            <div className="mt-2">
              <TokenStatusIndicator
                configured={config?.tokenConfigured ?? false}
                version={config?.tokenVersion ?? null}
              />
            </div>
          </div>

          <Separator />

          {/* Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduler-stale-minutes">
                Stale Threshold (minutes)
              </Label>
              <Input
                id="scheduler-stale-minutes"
                type="number"
                min={1}
                max={1440}
                value={staleMinutes}
                onChange={(e) => setStaleMinutes(Number(e.target.value))}
                disabled={!config?.tokenConfigured}
              />
              <p className="text-xs text-muted-foreground">
                Claims older than this threshold will be released
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduler-limit">
                Maximum to Release
              </Label>
              <Input
                id="scheduler-limit"
                type="number"
                min={1}
                max={1000}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={!config?.tokenConfigured}
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of claims released per trigger
              </p>
            </div>
          </div>

          <Separator />

          {/* Trigger Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Trigger</p>
              <p className="text-xs text-muted-foreground">
                Run the stale sweeper now with current settings
              </p>
            </div>
            <Button
              onClick={handleTrigger}
              disabled={!config?.tokenConfigured || isTriggerLoading}
              className="min-w-[140px]"
            >
              {isTriggerLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Trigger Now
                </>
              )}
            </Button>
          </div>

          {!config?.tokenConfigured && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Token Required
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Set the COOLFARM_SAI_V2_SCHEDULER_TOKEN environment variable
                    to enable the scheduled stale sweeper.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Trigger Result */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Trigger History</CardTitle>
              <CardDescription>
                Results from the most recent sweeper execution
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TriggerResultCard result={lastResult} />

          {/* Info about scheduled runs */}
          <div className="mt-6 rounded-md bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Automated Execution</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When the scheduler token is configured, the stale sweeper runs
                  automatically via cron. Manual triggers use the same endpoint
                  but are recorded with a different trigger source for auditing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
