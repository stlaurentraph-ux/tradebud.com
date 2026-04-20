'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlotDeforestationDecisionHistory } from '@/lib/use-plot-deforestation-decision-history';

interface PlotDeforestationDecisionHistoryPanelProps {
  plotId: string;
}

function verdictVariant(verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown') {
  if (verdict === 'no_deforestation_detected') return 'default';
  if (verdict === 'possible_deforestation_detected') return 'destructive';
  return 'secondary';
}

export function PlotDeforestationDecisionHistoryPanel({ plotId }: PlotDeforestationDecisionHistoryPanelProps) {
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

  const handleRunDecision = async () => {
    setRunError(null);
    setRunSuccess(null);
    setIsRunning(true);
    try {
      const result = await runDecision(cutoffDate);
      setRunSuccess(`Decision run recorded for cutoff ${cutoffDate}.`);
      setLastRun({
        cutoffDate: result.cutoffDate ?? cutoffDate,
        verdict: result.verdict ?? 'unknown',
        providerMode: result.providerMode ?? 'n/a',
      });
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run deforestation decision.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deforestation Decision History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={cutoffDate}
            onChange={(event) => setCutoffDate(event.target.value)}
            aria-label="Deforestation cutoff date"
            className="w-52"
          />
          <Button
            size="sm"
            onClick={handleRunDecision}
            disabled={!cutoffDate || isRunning}
          >
            {isRunning ? 'Running...' : 'Run decision'}
          </Button>
          {runError ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDecision}
              disabled={!cutoffDate || isRunning}
            >
              Retry
            </Button>
          ) : null}
          {runSuccess ? <span className="text-xs text-emerald-700">{runSuccess}</span> : null}
          {runError ? <span className="text-xs text-red-700">{runError}</span> : null}
        </div>
        {lastRun ? (
          <div className="mb-4 rounded-md border border-border p-2 text-xs text-muted-foreground">
            Last run: cutoff {lastRun.cutoffDate} | verdict {lastRun.verdict} | provider mode {lastRun.providerMode}
          </div>
        ) : null}
        {isLoading ? (
          <AsyncState mode="loading" title="Loading deforestation decisions..." />
        ) : error ? (
          <AsyncState mode="error" title="Deforestation decision history unavailable" description={error} />
        ) : events.length === 0 ? (
          <AsyncState
            mode="empty"
            title="No decision events yet"
            description="Run a cutoff-date deforestation decision to create immutable decision evidence."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Cutoff Date</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Provider Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{event.payload.cutoffDate || 'n/a'}</TableCell>
                  <TableCell>
                    <Badge variant={verdictVariant(event.payload.verdict)}>{event.payload.verdict}</Badge>
                  </TableCell>
                  <TableCell>
                    {event.payload.summary?.alertCount ?? 'n/a'} / {event.payload.summary?.alertAreaHa ?? 'n/a'} ha
                  </TableCell>
                  <TableCell>{event.payload.providerMode ?? 'n/a'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
