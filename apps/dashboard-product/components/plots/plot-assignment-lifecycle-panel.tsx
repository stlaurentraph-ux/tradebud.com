'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
interface PlotAssignmentLifecyclePanelProps {
  plotId: string;
}

interface AssignmentListItem {
  assignmentId: string;
  plotId: string;
  agentUserId: string;
  agentName?: string | null;
  agentEmail?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  assignedAt: string;
  endedAt: string | null;
}

interface AssignmentListResponse {
  items: AssignmentListItem[];
  total: number;
  limit: number;
  offset: number;
}

interface AssignmentQueryOptions {
  limit: number;
  offset: number;
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function mapAssignmentError(raw: string): string {
  if (raw.includes('ASN-001')) return 'Assignment already active. Reuse existing assignment or close it first.';
  if (raw.includes('ASN-002')) return 'Assignment not found. Verify the assignment ID.';
  if (raw.includes('ASN-003')) return 'Invalid assignment transition. Refresh status before retrying.';
  if (raw.includes('ASN-004')) return 'Assignment system is unavailable. Contact operator support.';
  return raw;
}

export function PlotAssignmentLifecyclePanel({ plotId }: PlotAssignmentLifecyclePanelProps) {
  const [assignmentId, setAssignmentId] = useState('');
  const [agentUserId, setAgentUserId] = useState('');
  const [reason, setReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [fromDays, setFromDays] = useState(30);
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const buildAssignmentsUrl = useCallback(({ limit, offset }: AssignmentQueryOptions) => {
    const requestUrl = new URL(`/api/plots/${encodeURIComponent(plotId)}/assignments`, window.location.origin);
    requestUrl.searchParams.set('status', statusFilter);
    requestUrl.searchParams.set('fromDays', String(fromDays));
    requestUrl.searchParams.set('limit', String(limit));
    requestUrl.searchParams.set('offset', String(offset));
    if (agentFilter.trim()) requestUrl.searchParams.set('agentUserId', agentFilter.trim());
    return requestUrl;
  }, [plotId, statusFilter, fromDays, agentFilter]);

  const loadAssignments = useCallback(async () => {
    if (!plotId) return;
    setIsLoadingList(true);
    try {
      // Agent/status/day filters keep large history readable.
      // Querystring is server-driven for performance and consistent totals.
      const pagedResponse = await fetch(buildAssignmentsUrl({ limit: pageSize, offset: (page - 1) * pageSize }).toString(), {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      const payload = (await pagedResponse.json().catch(() => ({}))) as AssignmentListResponse | { error?: string };
      if (!pagedResponse.ok) {
        throw new Error(mapAssignmentError((payload as { error?: string }).error ?? 'Assignment list unavailable.'));
      }
      const pagePayload = payload as AssignmentListResponse;
      setAssignments(Array.isArray(pagePayload.items) ? pagePayload.items : []);
      setTotal(typeof pagePayload.total === 'number' ? pagePayload.total : 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load assignments.');
    } finally {
      setIsLoadingList(false);
    }
  }, [plotId, buildAssignmentsUrl, page, pageSize]);

  const exportAssignmentsCsv = async () => {
    if (!plotId) return;
    setIsExporting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const exportUrl = buildAssignmentsUrl({ limit: 5000, offset: 0 });
      exportUrl.searchParams.set('format', 'csv');
      const response = await fetch(exportUrl.toString(), {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        throw new Error(mapAssignmentError(raw || 'Assignment export unavailable.'));
      }
      const csvText = await response.text();
      const rowCount = Number(response.headers.get('x-export-row-count') ?? '0');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `plot-${plotId}-assignments-${statusFilter}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatusMessage(`Exported ${rowCount} assignment rows to CSV.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Assignment export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const run = async (mode: 'create' | 'complete' | 'cancel') => {
    if (!plotId) return;
    setIsWorking(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      if (!assignmentId.trim()) {
        throw new Error('Assignment ID is required.');
      }
      const headers = {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() ?? {}),
      };
      const body =
        mode === 'create'
          ? { assignmentId: assignmentId.trim(), agentUserId: agentUserId.trim() }
          : { reason: reason.trim() || undefined };
      const endpoint =
        mode === 'create'
          ? `/api/plots/${encodeURIComponent(plotId)}/assignments`
          : `/api/plots/assignments/${encodeURIComponent(assignmentId.trim())}/${mode}`;
      if (mode === 'create' && !agentUserId.trim()) {
        throw new Error('Agent user ID is required for assignment creation.');
      }

      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; status?: string };
      if (!response.ok) {
        throw new Error(mapAssignmentError(payload.error ?? 'Assignment lifecycle request failed.'));
      }
      const targetState = mode === 'create' ? payload.status ?? 'active' : mode;
      setStatusMessage(`Assignment ${assignmentId.trim()} is now ${targetState}.`);
      await loadAssignments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected assignment lifecycle error.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Lifecycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Assignment ID"
            value={assignmentId}
            onChange={(event) => setAssignmentId(event.target.value)}
            aria-label="Assignment ID"
          />
          <Input
            placeholder="Agent user ID (UUID for create)"
            value={agentUserId}
            onChange={(event) => setAgentUserId(event.target.value)}
            aria-label="Agent user ID"
          />
        </div>
        <Input
          placeholder="Transition reason (optional for complete/cancel)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-label="Transition reason"
        />
        <div className="grid gap-2 md:grid-cols-4">
          <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => { setStatusFilter('all'); setPage(1); }}>
            All
          </Button>
          <Button size="sm" variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => { setStatusFilter('active'); setPage(1); }}>
            Active
          </Button>
          <Button size="sm" variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => { setStatusFilter('completed'); setPage(1); }}>
            Completed
          </Button>
          <Button size="sm" variant={statusFilter === 'cancelled' ? 'default' : 'outline'} onClick={() => { setStatusFilter('cancelled'); setPage(1); }}>
            Cancelled
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Filter by agent user ID"
            value={agentFilter}
            onChange={(event) => { setAgentFilter(event.target.value); setPage(1); }}
            aria-label="Filter by agent user ID"
          />
          <Input
            type="number"
            min={1}
            placeholder="From last N days"
            value={String(fromDays)}
            onChange={(event) => { setFromDays(Math.max(1, Number(event.target.value || '30'))); setPage(1); }}
            aria-label="From last N days"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => run('create')} disabled={isWorking}>
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('complete')} disabled={isWorking}>
            Complete
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('cancel')} disabled={isWorking}>
            Cancel
          </Button>
        </div>
        {statusMessage ? (
          <Alert>
            <AlertTitle>Assignment updated</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Assignment action failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Assignment History</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void exportAssignmentsCsv()} disabled={isExporting || isLoadingList}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => void loadAssignments()} disabled={isLoadingList}>
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Status legend:</span>
            <Badge variant="outline" className="text-emerald-700 border-emerald-400" title="Active means assignment is open and field collection is in progress.">
              active
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-400" title="Completed means assignment was closed after field work finished.">
              completed
            </Badge>
            <Badge variant="outline" className="text-amber-700 border-amber-400" title="Cancelled means assignment was terminated before completion.">
              cancelled
            </Badge>
          </div>
          {assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No assignments found for this plot.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((item, index) => (
                  <TableRow
                    key={item.assignmentId || `${item.agentUserId || 'agent'}-${index}`}
                    onClick={() => setAssignmentId(item.assignmentId)}
                    className="cursor-pointer"
                  >
                    <TableCell>{item.assignmentId}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.status === 'active'
                            ? 'text-emerald-700 border-emerald-400'
                            : item.status === 'completed'
                              ? 'text-blue-700 border-blue-400'
                              : 'text-amber-700 border-amber-400'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.agentName ? `${item.agentName} (${item.agentUserId})` : item.agentUserId}
                      {item.agentEmail ? (
                        <div className="text-xs text-muted-foreground">{item.agentEmail}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {typeof item.assignedAt === 'string' && item.assignedAt.length > 0
                        ? new Date(item.assignedAt).toLocaleString()
                        : 'unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > pageSize ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * pageSize >= total}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
