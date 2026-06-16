'use client';

import { useState, useEffect, useContext } from 'react';
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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SchedulerConfig, StaleReleaseResult, TriggerSource } from '@/types/integrations';
import { fetchRunSummary, fetchSchedulerConfig, triggerStaleSweeper } from '@/lib/integrations-v2-api';
import { LocaleContext } from '@/lib/locale-context';
import {
  getIntegrationsSchedulerLabel,
  getIntegrationsSchedulerLoadingLabel,
  getIntegrationsSchedulerTriggerBadgeLabel,
  getIntegrationsToastMessage,
} from '@/lib/workflow-terminology-labels';

function TokenStatusIndicator({
  configured,
  version,
  t,
}: {
  configured: boolean;
  version: string | null;
  t?: (key: string) => string;
}) {
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
            <p className="text-sm font-medium text-emerald-700">{getIntegrationsSchedulerLabel('token_configured', t)}</p>
            {version && (
              <p className="text-xs text-emerald-600">
                {getIntegrationsSchedulerLabel('token_version', t)}: {version}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700">{getIntegrationsSchedulerLabel('token_not_configured', t)}</p>
            <p className="text-xs text-red-600">{getIntegrationsSchedulerLabel('token_env_hint', t)}</p>
          </div>
        </>
      )}
    </div>
  );
}

function TriggerResultCard({
  result,
  t,
}: {
  result: StaleReleaseResult | null;
  t?: (key: string) => string;
}) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getIntegrationsSchedulerLabel('no_triggers', t)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getIntegrationsSchedulerLabel('no_triggers_hint', t)}
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
        {getIntegrationsSchedulerTriggerBadgeLabel('scheduled', t)}
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Zap className="h-3 w-3" />
        {getIntegrationsSchedulerTriggerBadgeLabel('manual', t)}
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="font-medium">{getIntegrationsSchedulerLabel('last_result', t)}</p>
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
          <p className="text-xs text-muted-foreground">{getIntegrationsSchedulerLabel('claims_released', t)}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">{result.releasedCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{getIntegrationsSchedulerLabel('token_version', t)}</p>
          <p className="mt-0.5 text-lg font-medium">{result.tokenVersion || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export function SchedulerSection() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [lastResult, setLastResult] = useState<StaleReleaseResult | null>(null);

  // Form state
  const [staleMinutes, setStaleMinutes] = useState(60);
  const [limit, setLimit] = useState(100);
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);

  // Load config
  useEffect(() => {
    const loadSchedulerData = async () => {
      try {
        const [loadedConfig, summary] = await Promise.all([fetchSchedulerConfig(), fetchRunSummary()]);
        const loadedLastResult: StaleReleaseResult | null = summary.lastSweeperRun
          ? {
              releasedCount: summary.lastSweeperReleasedCount,
              timestamp: summary.lastSweeperRun,
              triggerSource: summary.lastSweeperTriggerSource === 'scheduled' ? 'scheduled' : 'manual',
              tokenVersion: summary.lastSweeperTokenVersion ?? loadedConfig.tokenVersion,
            }
          : null;

        setConfig(loadedConfig);
        setLastResult(loadedLastResult);
        setStaleMinutes(loadedConfig.defaultStaleMinutes);
        setLimit(loadedConfig.defaultLimit);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : getIntegrationsSchedulerLabel('load_error', t));
      } finally {
        setIsLoading(false);
      }
    };

    void loadSchedulerData();
  }, []);

  const handleTrigger = async () => {
    if (!config?.tokenConfigured) {
      toast.error(getIntegrationsSchedulerLabel('token_missing', t));
      return;
    }

    setIsTriggerLoading(true);
    try {
      const newResult = await triggerStaleSweeper(staleMinutes, limit);
      setLastResult({
        ...newResult,
        tokenVersion: newResult.tokenVersion ?? config.tokenVersion,
      });

      if (newResult.releasedCount > 0) {
        toast.success(getIntegrationsToastMessage('bulk_released', { count: newResult.releasedCount }, t));
      } else {
        toast.info(getIntegrationsSchedulerLabel('no_stale', t));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getIntegrationsSchedulerLabel('load_error', t));
    } finally {
      setIsTriggerLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{getIntegrationsSchedulerLoadingLabel(t)}</p>
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
              <CardTitle className="text-lg">{getIntegrationsSchedulerLabel('title', t)}</CardTitle>
              <CardDescription>{getIntegrationsSchedulerLabel('subtitle', t)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Status */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              {getIntegrationsSchedulerLabel('token_status', t)}
            </Label>
            <div className="mt-2">
              <TokenStatusIndicator
                configured={config?.tokenConfigured ?? false}
                version={config?.tokenVersion ?? null}
                t={t}
              />
            </div>
          </div>

          <Separator />

          {/* Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduler-stale-minutes">
                {getIntegrationsSchedulerLabel('stale_threshold', t)}
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
                {getIntegrationsSchedulerLabel('stale_threshold_hint', t)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduler-limit">
                {getIntegrationsSchedulerLabel('max_release', t)}
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
                {getIntegrationsSchedulerLabel('max_release_hint', t)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Trigger Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{getIntegrationsSchedulerLabel('manual_trigger', t)}</p>
              <p className="text-xs text-muted-foreground">
                {getIntegrationsSchedulerLabel('manual_trigger_hint', t)}
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
                  {getIntegrationsSchedulerLabel('running', t)}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {getIntegrationsSchedulerLabel('trigger_now', t)}
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
                    {getIntegrationsSchedulerLabel('token_required_title', t)}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {getIntegrationsSchedulerLabel('token_required_body', t)}
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
              <CardTitle className="text-lg">{getIntegrationsSchedulerLabel('history_title', t)}</CardTitle>
              <CardDescription>
                {getIntegrationsSchedulerLabel('history_subtitle', t)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TriggerResultCard result={lastResult} t={t} />

          {/* Info about scheduled runs */}
          <div className="mt-6 rounded-md bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{getIntegrationsSchedulerLabel('automated_title', t)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getIntegrationsSchedulerLabel('automated_body', t)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
