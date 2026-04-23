'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Filter, AlertTriangle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { usePackages } from '@/lib/use-packages';
import { cn } from '@/lib/utils';
import type { DDSPackage } from '@/types';

// Canonical compliance severity levels
type ComplianceSeverity = 'INFO' | 'WARNING' | 'BLOCKING';
type ComplianceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

interface ComplianceIssue {
  id: string;
  package_id: string;
  title: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  created_at: string;
  sla_hours: number;
}

interface QueuedPackage {
  id: string;
  code: string;
  supplier_name: string;
  plots_count: number;
  risk_level: 'low' | 'medium' | 'high';
  submitted_date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  compliance_issues: ComplianceIssue[];
  sla_hours_remaining: number;
}

const mockComplianceIssues: ComplianceIssue[] = [];

function mapPackagesToQueue(packages: DDSPackage[]): QueuedPackage[] {
  return packages
    .map((p) => {
      const issues = mockComplianceIssues.filter((ci) => ci.package_id === p.id);
      const blockingCount = issues.filter((i) => i.severity === 'BLOCKING').length;
      const status: QueuedPackage['status'] =
        blockingCount > 0
          ? 'OPEN'
          : p.status === 'ON_HOLD'
            ? 'ESCALATED'
            : p.status === 'SUBMITTED'
              ? 'IN_PROGRESS'
              : 'RESOLVED';

      return {
        id: p.id,
        code: p.code,
        supplier_name: p.supplier_name,
        plots_count: p.plots.length,
        risk_level: (p.plots.some((pl) => pl.deforestation_risk === 'high')
          ? 'high'
          : p.plots.some((pl) => pl.deforestation_risk === 'medium')
            ? 'medium'
            : 'low') as 'low' | 'medium' | 'high',
        submitted_date: p.created_at,
        status,
        compliance_issues: issues,
        sla_hours_remaining: blockingCount > 0 ? 2 : status === 'IN_PROGRESS' ? 12 : 48,
      };
    })
    .slice(0, 8);
}

function getRiskColor(risk: 'low' | 'medium' | 'high') {
  return risk === 'high'
    ? 'bg-destructive/20 text-destructive'
    : risk === 'medium'
    ? 'bg-amber-500/20 text-amber-600'
    : 'bg-emerald-500/20 text-emerald-600';
}

function getSLAColor(hoursRemaining: number): string {
  if (hoursRemaining <= 4) return 'text-destructive bg-destructive/10';
  if (hoursRemaining <= 12) return 'text-amber-600 bg-amber-100';
  return 'text-emerald-600 bg-emerald-100';
}

function getStatusLabel(status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED') {
  switch (status) {
    case 'RESOLVED':
      return 'Resolved';
    case 'ESCALATED':
      return 'Escalated';
    case 'IN_PROGRESS':
      return 'In Progress';
    default:
      return 'Open';
  }
}

export default function ComplianceQueuePage() {
  const { packages, isLoading, error } = usePackages();
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED'
  >('all');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'BLOCKING' | 'WARNING' | 'INFO'>('all');

  const sortedQueue = useMemo(() => {
    const queue = mapPackagesToQueue(packages);
    const severityOrder = { BLOCKING: 0, WARNING: 1, INFO: 2 };
    return [...queue].sort((a, b) => {
      const maxSeverityA = a.compliance_issues.length
        ? Math.min(...a.compliance_issues.map((i) => severityOrder[i.severity]))
        : severityOrder.INFO;
      const maxSeverityB = b.compliance_issues.length
        ? Math.min(...b.compliance_issues.map((i) => severityOrder[i.severity]))
        : severityOrder.INFO;
      return maxSeverityA - maxSeverityB;
    });
  }, [packages]);

  const filteredQueue = useMemo(() => {
    return sortedQueue.filter((item) => {
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedRisk !== 'all' && item.risk_level !== selectedRisk) return false;
      if (selectedSeverity !== 'all') {
        const hasSeverity = item.compliance_issues.some((i) => i.severity === selectedSeverity);
        if (!hasSeverity) return false;
      }
      return true;
    });
  }, [sortedQueue, selectedStatus, selectedRisk, selectedSeverity]);

  const pendingCount = sortedQueue.filter((p) => p.status === 'OPEN').length;
  const blockingCount = sortedQueue.reduce((sum, p) => sum + p.compliance_issues.filter((i) => i.severity === 'BLOCKING').length, 0);

  return (
    <PermissionGate permission="compliance:view">
      <div className="flex flex-col">
        <AppHeader
          title="Compliance Issues Queue"
          subtitle="Review and resolve compliance issues sorted by severity and SLA"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Compliance' },
            { label: 'Issues Queue' },
          ]}
        />

        <div className="flex-1 space-y-6 p-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-destructive">{blockingCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Blocking Issues</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Packages Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {sortedQueue.filter((p) => p.sla_hours_remaining <= 4).length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Critical SLA</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{sortedQueue.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total in Queue</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        className="capitalize"
                      >
                        {status === 'all' ? 'all' : getStatusLabel(status)}
                      </Button>
                    ),
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Risk:</span>
                  {(['all', 'low', 'medium', 'high'] as const).map((risk) => (
                    <Button
                      key={risk}
                      variant={selectedRisk === risk ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRisk(risk)}
                      className="capitalize"
                    >
                      {risk}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  {(['all', 'BLOCKING', 'WARNING', 'INFO'] as const).map((sev) => (
                    <Button
                      key={sev}
                      variant={selectedSeverity === sev ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSeverity(sev)}
                      className="capitalize"
                    >
                      {sev}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue List - Sorted by Severity */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
                <p className="text-sm text-muted-foreground">Loading compliance queue...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
                <p className="text-sm text-muted-foreground">No packages match the selected filters</p>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const maxSeverity = item.compliance_issues.length > 0 
                  ? item.compliance_issues.reduce((max, i) => {
                      const order = { BLOCKING: 0, WARNING: 1, INFO: 2 };
                      return order[i.severity] < order[max.severity] ? i : max;
                    }).severity
                  : 'INFO';

                return (
                  <Card key={item.id} className={`hover:shadow-md transition-shadow ${maxSeverity === 'BLOCKING' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <CardContent className="pt-6 pb-4">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Link
                                href={`/packages/${item.id}`}
                                className="text-sm font-semibold text-primary hover:underline"
                              >
                                {item.code}
                              </Link>
                              <Badge variant="outline" className={cn('capitalize', getRiskColor(item.risk_level))}>
                                {item.risk_level} Risk
                              </Badge>
                              {maxSeverity !== 'INFO' && (
                                <SeverityBadge severity={maxSeverity} />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{item.supplier_name}</span>
                              {' • '}
                              {item.plots_count} plot{item.plots_count !== 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* SLA Countdown */}
                          <div className={cn('flex flex-col items-end gap-1 px-3 py-1 rounded-lg', getSLAColor(item.sla_hours_remaining))}>
                            <p className="text-xs font-semibold">SLA</p>
                            <p className="text-sm font-bold">{item.sla_hours_remaining}h</p>
                          </div>
                        </div>

                        {/* Compliance Issues */}
                        {item.compliance_issues.length > 0 && (
                          <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              {item.compliance_issues.length} Issue{item.compliance_issues.length !== 1 ? 's' : ''}
                            </p>
                            <ul className="space-y-1">
                              {item.compliance_issues.map((issue) => (
                                <li key={issue.id} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <SeverityBadge severity={issue.severity} compact />
                                  <span>{issue.title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/compliance/issues?package=${item.id}`}>
                              Review Issues
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
