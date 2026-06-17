'use client';

import { useContext, useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlotDeforestationDecisionHistory } from '@/lib/use-plot-deforestation-decision-history';
import { LocaleContext } from '@/lib/locale-context';
import {
  getPlotDeforestationDecisionCopy,
  getPlotDeforestationVerdictLabel,
} from '@/lib/plot-deforestation-decision-copy';
import { resolveWorkflowErrorMessage } from '@/lib/workflow-error-copy';

interface PlotDeforestationDecisionHistoryPanelProps {
  plotId: string;
  embedded?: boolean;
  readOnly?: boolean;
}

function verdictVariant(verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown') {
  if (verdict === 'no_deforestation_detected') return 'default';
  if (verdict === 'possible_deforestation_detected') return 'destructive';
  return 'secondary';
}

export function PlotDeforestationDecisionHistoryPanel({
  plotId,
  embedded = false,
  readOnly = false,
}: PlotDeforestationDecisionHistoryPanelProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { events, isLoading, error, runDecision } = usePlotDeforestationDecisionHistory(plotId);
  const [cutoffDate, setCutoffDate] = useState('');
  const [runError, setRunError] = useState<string | null>(null);
  const [runSuccess, setRunSuccess] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{
    cutoffDate: string;
    verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown';
    providerMode: 'glad_s2_primary' | 'radd_fallback' | 'n/a';
  } | null>(null);

  const naLabel = getPlotDeforestationDecisionCopy('na', t);

  const handleRunDecision = async () => {
    setRunError(null);
    setRunSuccess(null);
    setIsRunning(true);
    try {
      const result = await runDecision(cutoffDate);
      setRunSuccess(getPlotDeforestationDecisionCopy('run_success', t, { date: cutoffDate }));
      setLastRun({
        cutoffDate: result.cutoffDate ?? cutoffDate,
        verdict: result.verdict ?? 'unknown',
        providerMode: result.providerMode ?? 'n/a',
      });
    } catch (err) {
      setRunError(resolveWorkflowErrorMessage(err, 'plot_deforestation_decision_run', t));
    } finally {
      setIsRunning(false);
    }
  };

  const panelBody = (
    <>
        {!readOnly ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={cutoffDate}
            onChange={(event) => setCutoffDate(event.target.value)}
            aria-label={getPlotDeforestationDecisionCopy('cutoff_aria_label', t)}
            className="w-52"
          />
          <Button size="sm" onClick={handleRunDecision} disabled={!cutoffDate || isRunning}>
            {isRunning
              ? getPlotDeforestationDecisionCopy('running', t)
              : getPlotDeforestationDecisionCopy('run_cta', t)}
          </Button>
          {runError ? (
            <Button size="sm" variant="outline" onClick={handleRunDecision} disabled={!cutoffDate || isRunning}>
              {getPlotDeforestationDecisionCopy('retry', t)}
            </Button>
          ) : null}
          {runSuccess ? <span className="text-xs text-emerald-700">{runSuccess}</span> : null}
          {runError ? <span className="text-xs text-red-700">{runError}</span> : null}
        </div>
        ) : null}
        {lastRun ? (
          <div className="mb-4 rounded-md border border-border p-2 text-xs text-muted-foreground">
            {getPlotDeforestationDecisionCopy('last_run_summary', t, {
              cutoff: lastRun.cutoffDate,
              verdict: getPlotDeforestationVerdictLabel(lastRun.verdict, t),
              provider: lastRun.providerMode,
            })}
          </div>
        ) : null}
        {isLoading ? (
          <AsyncState
            mode="loading"
            title={getPlotDeforestationDecisionCopy('loading_title', t)}
          />
        ) : error ? (
          <AsyncState
            mode="error"
            title={getPlotDeforestationDecisionCopy('error_title', t)}
            description={error}
          />
        ) : events.length === 0 ? (
          <AsyncState
            mode="empty"
            title={getPlotDeforestationDecisionCopy('empty_title', t)}
            description={getPlotDeforestationDecisionCopy('empty_description', t)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{getPlotDeforestationDecisionCopy('col_timestamp', t)}</TableHead>
                <TableHead>{getPlotDeforestationDecisionCopy('col_cutoff', t)}</TableHead>
                <TableHead>{getPlotDeforestationDecisionCopy('col_verdict', t)}</TableHead>
                <TableHead>{getPlotDeforestationDecisionCopy('col_alerts', t)}</TableHead>
                <TableHead>{getPlotDeforestationDecisionCopy('col_provider', t)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{event.payload.cutoffDate || naLabel}</TableCell>
                  <TableCell>
                    <Badge variant={verdictVariant(event.payload.verdict)}>
                      {getPlotDeforestationVerdictLabel(event.payload.verdict, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getPlotDeforestationDecisionCopy('alerts_ha', t, {
                      count: event.payload.summary?.alertCount ?? naLabel,
                      area: event.payload.summary?.alertAreaHa ?? naLabel,
                    })}
                  </TableCell>
                  <TableCell>{event.payload.providerMode ?? naLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
  );

  if (embedded) {
    return <div className="space-y-3 text-sm">{panelBody}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getPlotDeforestationDecisionCopy('panel_title', t)}</CardTitle>
      </CardHeader>
      <CardContent>{panelBody}</CardContent>
    </Card>
  );
}
