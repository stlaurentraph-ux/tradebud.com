'use client';

import { useMemo, useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlotGeometryHistory } from '@/lib/use-plot-geometry-history';

interface PlotGeometryHistoryPanelProps {
  plotId: string;
}

export function PlotGeometryHistoryPanel({ plotId }: PlotGeometryHistoryPanelProps) {
  const {
    events,
    total,
    page,
    pageSize,
    clampPage,
    setPage,
    sort,
    setSort,
    anomalyProfile,
    setAnomalyProfile,
    signalsOnly,
    setSignalsOnly,
    viewPageMemory,
    setViewPageMemory,
    filter,
    setFilter,
    anomalies,
    anomalySummary,
    anomalySummaryScope,
    isLoading,
    error,
    legacyViewFallbackCount,
    resetLegacyViewFallbackCount,
    reload,
  } = usePlotGeometryHistory(plotId);
  const [groupByDay, setGroupByDay] = useState(true);
  const currentViewKey = `${filter}|${signalsOnly ? 'signals' : 'mixed'}` as const;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const requiresTypedResetConfirmation = legacyViewFallbackCount >= 10;

  const updateSort = (nextSort: 'desc' | 'asc') => {
    setSort(nextSort);
    setPage(1);
  };

  const updateFilter = (nextFilter: 'all' | 'plot_created' | 'plot_geometry_superseded') => {
    const nextViewMemory = { ...viewPageMemory, [currentViewKey]: clampPage(page) };
    setViewPageMemory(nextViewMemory);
    const nextViewKey = `${nextFilter}|${signalsOnly ? 'signals' : 'mixed'}` as const;
    const nextPage = clampPage(nextViewMemory[nextViewKey] || 1);
    setFilter(nextFilter);
    setPage(nextPage);
  };

  const filteredEvents = useMemo(() => {
    const byType = filter === 'all' ? events : events.filter((event) => event.eventType === filter);
    if (!signalsOnly) return byType;
    return byType.filter((event) => anomalies.some((anomaly) => anomaly.eventId === event.id));
  }, [anomalies, events, filter, signalsOnly]);

  const updateAnomalyProfile = (nextProfile: 'strict' | 'balanced' | 'lenient') => {
    setAnomalyProfile(nextProfile);
    setPage(1);
  };

  const updateSignalsOnly = (nextValue: boolean) => {
    const nextViewMemory = { ...viewPageMemory, [currentViewKey]: clampPage(page) };
    setViewPageMemory(nextViewMemory);
    const nextViewKey = `${filter}|${nextValue ? 'signals' : 'mixed'}` as const;
    const nextPage = clampPage(nextViewMemory[nextViewKey] || 1);
    setSignalsOnly(nextValue);
    setPage(nextPage);
  };

  const anomalyByEventId = useMemo(() => {
    return anomalies.reduce<Record<string, string[]>>((acc, anomaly) => {
      acc[anomaly.eventId] = [...(acc[anomaly.eventId] ?? []), anomaly.message];
      return acc;
    }, {});
  }, [anomalies]);

  const timelineRows = useMemo(() => {
    const rows: Array<{ type: 'group'; label: string } | { type: 'event'; event: (typeof filteredEvents)[number] }> = [];
    let previousGroupLabel = '';
    for (const event of filteredEvents) {
      const date = new Date(event.timestamp);
      const groupLabel = Number.isNaN(date.getTime()) ? 'Unknown day' : date.toLocaleDateString();
      if (groupByDay && groupLabel !== previousGroupLabel) {
        rows.push({ type: 'group', label: groupLabel });
        previousGroupLabel = groupLabel;
      }
      rows.push({ type: 'event', event });
    }
    return rows;
  }, [filteredEvents, groupByDay]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geometry Revision History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => updateFilter('all')}>
            All
          </Button>
          <Button
            size="sm"
            variant={filter === 'plot_created' ? 'default' : 'outline'}
            onClick={() => updateFilter('plot_created')}
          >
            Created
          </Button>
          <Button
            size="sm"
            variant={filter === 'plot_geometry_superseded' ? 'default' : 'outline'}
            onClick={() => updateFilter('plot_geometry_superseded')}
          >
            Revised
          </Button>
          <Button size="sm" variant={sort === 'desc' ? 'default' : 'outline'} onClick={() => updateSort('desc')}>
            Newest
          </Button>
          <Button size="sm" variant={sort === 'asc' ? 'default' : 'outline'} onClick={() => updateSort('asc')}>
            Oldest
          </Button>
          <Button size="sm" variant={groupByDay ? 'default' : 'outline'} onClick={() => setGroupByDay((value) => !value)}>
            Group by day
          </Button>
          <Button
            size="sm"
            variant={anomalyProfile === 'strict' ? 'default' : 'outline'}
            onClick={() => updateAnomalyProfile('strict')}
          >
            Strict
          </Button>
          <Button
            size="sm"
            variant={anomalyProfile === 'balanced' ? 'default' : 'outline'}
            onClick={() => updateAnomalyProfile('balanced')}
          >
            Balanced
          </Button>
          <Button
            size="sm"
            variant={anomalyProfile === 'lenient' ? 'default' : 'outline'}
            onClick={() => updateAnomalyProfile('lenient')}
          >
            Lenient
          </Button>
          <Button size="sm" variant={signalsOnly ? 'default' : 'outline'} onClick={() => updateSignalsOnly(!signalsOnly)}>
            Signals only
          </Button>
          {anomalies.length > 0 ? (
            <Badge variant="outline" className="text-amber-700 border-amber-500">
              {anomalies.length} anomaly flag{anomalies.length > 1 ? 's' : ''}
            </Badge>
          ) : null}
          {anomalySummary.total > 0 ? (
            <Badge variant="outline" className="text-xs">
              High {anomalySummary.highSeverity} / Medium {anomalySummary.mediumSeverity}
            </Badge>
          ) : null}
          {anomalySummary.total > 0 ? (
            <Badge variant="outline" className="text-xs">
              Jump {anomalySummary.byType.largeRevisionJump} / Frequent {anomalySummary.byType.frequentSupersession}
            </Badge>
          ) : null}
          {anomalySummary.total > 0 ? (
            <span className="text-xs text-muted-foreground">
              Summary scope: {anomalySummaryScope === 'full_filtered_set' ? 'full filtered set' : 'current page'}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            Showing {filteredEvents.length} of {total || events.length} events (page {page}, sort {sort})
          </span>
          <span className="text-xs text-muted-foreground">Sensitivity: {anomalyProfile}</span>
          {legacyViewFallbackCount > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">
                Legacy preset fallback migrations: {legacyViewFallbackCount}
              </span>
              {confirmingReset ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (requiresTypedResetConfirmation && resetConfirmationText !== 'RESET') return;
                      resetLegacyViewFallbackCount();
                      setConfirmingReset(false);
                      setResetConfirmationText('');
                    }}
                  >
                    Confirm reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setConfirmingReset(false);
                      setResetConfirmationText('');
                    }}
                  >
                    Cancel
                  </Button>
                  {requiresTypedResetConfirmation ? (
                    <label className="text-xs text-muted-foreground">
                      Type RESET to confirm:
                      <input
                        className="ml-2 rounded border bg-background px-2 py-1 text-xs"
                        value={resetConfirmationText}
                        onChange={(event) => setResetConfirmationText(event.target.value)}
                        aria-label="Type RESET to confirm counter reset"
                      />
                    </label>
                  ) : null}
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirmingReset(true)}>
                  Reset migration counter
                </Button>
              )}
            </>
          ) : null}
        </div>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading geometry history..." />
        ) : error ? (
          <AsyncState mode="error" title="Geometry history unavailable" description={error} onRetry={reload} />
        ) : filteredEvents.length === 0 ? (
          <AsyncState mode="empty" title="No geometry revisions yet" description="No immutable geometry events recorded for this plot." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
              <TableHead>Signals</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {timelineRows.map((row) =>
              row.type === 'group' ? (
                <TableRow key={`group-${row.label}`}>
                  <TableCell colSpan={5} className="text-xs font-medium text-muted-foreground bg-muted/30">
                    {row.label}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={row.event.id}>
                  <TableCell>{new Date(row.event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{row.event.eventType}</TableCell>
                  <TableCell>{row.event.userId ?? 'system'}</TableCell>
                  <TableCell>
                    {anomalyByEventId[row.event.id]?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {anomalyByEventId[row.event.id].map((message) => (
                          <Badge key={message} variant="outline" className="text-xs border-amber-500 text-amber-700">
                            {message}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No anomaly</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {typeof row.event.payload.details?.reason === 'string'
                      ? row.event.payload.details.reason
                      : row.event.eventType === 'plot_created'
                        ? 'initial plot capture'
                        : 'not provided'}
                  </TableCell>
                </TableRow>
              ),
            )}
            </TableBody>
          </Table>
        )}
        {!isLoading && !error && total > pageSize ? (
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page * pageSize >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
