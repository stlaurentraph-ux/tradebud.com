'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { AlertCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { PermissionGate } from '@/components/common/permission-gate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_ISSUE_KANBAN_COLUMNS,
  getKanbanAdvanceStatus,
  type DashboardOperationalIssueSeverity,
  type DashboardOperationalIssueStatus,
} from '@/lib/dashboardComplianceIssuesRegistry';
import {
  getIssueSlaUrgency,
  issueSlaRowClass,
} from '@/lib/compliance-issue-sla';
import { getIssueRemediationHref, isPersistedComplianceIssue } from '@/lib/compliance-issue-remediation';
import { issueKindBadgeClass } from '@/lib/compliance-issue-ownership';
import type { ComplianceIssueKind } from '@/lib/compliance-issue-ownership';
import { LocaleContext } from '@/lib/locale-context';
import {
  getIssuesAdvanceStatusLabel,
  getIssuesKanbanColumnEmpty,
  getIssuesKanbanColumnLabel,
  getIssuesKanbanOverdueSuffix,
  getIssuesKindLabel,
  getIssuesLinkedEntityDisplayLine,
  getIssuesOpenRemediationLabel,
  getIssuesOwnerPrefix,
  getIssuesOwnerRoleLabel,
  getIssuesRemediationOwnerPrefix,
  getIssuesSeverityLabel,
  getIssuesSlaLabel,
} from '@/lib/workflow-terminology-labels';

export type ComplianceIssueSeverity = DashboardOperationalIssueSeverity;
export type ComplianceIssueStatus = DashboardOperationalIssueStatus;

export interface ComplianceIssueRecord {
  id: string;
  title: string;
  description: string;
  severity: ComplianceIssueSeverity;
  status: ComplianceIssueStatus;
  owner?: string;
  linkedEntity: {
    type: string;
    id: string;
    name: string;
  };
  createdAt: string;
  dueDate?: string;
  resolutionPath?: string;
  issueKind?: ComplianceIssueKind;
  ownerRole?: string;
  ownerOrganisationName?: string | null;
  sourceIssueId?: string | null;
  canUpdateStatus?: boolean;
}

const KANBAN_COLUMNS = DASHBOARD_ISSUE_KANBAN_COLUMNS;

function severityIcon(severity: ComplianceIssueSeverity) {
  if (severity === 'BLOCKING') return <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />;
  if (severity === 'WARNING') return <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />;
  return <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />;
}

function severityBadgeClass(severity: ComplianceIssueSeverity): string {
  if (severity === 'BLOCKING') return 'bg-red-500/15 text-red-700 border-red-200';
  if (severity === 'WARNING') return 'bg-amber-500/15 text-amber-800 border-amber-200';
  return 'bg-blue-500/15 text-blue-700 border-blue-200';
}

interface ComplianceIssuesKanbanProps {
  issues: ComplianceIssueRecord[];
  onSelectIssue: (issue: ComplianceIssueRecord) => void;
  onAdvanceStatus?: (issueId: string, status: ComplianceIssueStatus) => void;
}

export function ComplianceIssuesKanban({
  issues,
  onSelectIssue,
  onAdvanceStatus,
}: ComplianceIssuesKanbanProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {KANBAN_COLUMNS.map((column) => {
        const columnIssues = issues.filter((issue) =>
          (column.statuses as readonly ComplianceIssueStatus[]).includes(issue.status),
        );
        const overdueCount = columnIssues.filter((issue) => getIssueSlaUrgency(issue.dueDate) === 'overdue').length;
        const columnLabel = getIssuesKanbanColumnLabel(column.key, t);
        return (
          <Card key={column.key} className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>{columnLabel}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {columnIssues.length}
                  {overdueCount > 0 ? getIssuesKanbanOverdueSuffix(overdueCount, t) : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnIssues.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  {getIssuesKanbanColumnEmpty(column.key, t)}
                </p>
              ) : (
                columnIssues.map((issue) => {
                  const slaLabel = getIssuesSlaLabel(issue.dueDate, t);
                  const urgency = getIssueSlaUrgency(issue.dueDate);
                  const nextStatus = getKanbanAdvanceStatus(issue.status);
                  const canAdvanceStatus = Boolean(
                    nextStatus &&
                      onAdvanceStatus &&
                      isPersistedComplianceIssue(issue.id, issue.canUpdateStatus),
                  );
                  const remediationHref = getIssueRemediationHref(issue);
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => onSelectIssue(issue)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors hover:bg-secondary/40',
                        issueSlaRowClass(issue.dueDate),
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {severityIcon(issue.severity)}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium leading-snug">{issue.title}</p>
                            <Badge variant="outline" className={severityBadgeClass(issue.severity)}>
                              {getIssuesSeverityLabel(issue.severity, t)}
                            </Badge>
                            {issue.issueKind ? (
                              <Badge variant="outline" className={issueKindBadgeClass(issue.issueKind)}>
                                {getIssuesKindLabel(issue.issueKind, t)}
                              </Badge>
                            ) : null}
                          </div>
                          {issue.ownerRole || issue.ownerOrganisationName ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {getIssuesRemediationOwnerPrefix(t)}{' '}
                              {getIssuesOwnerRoleLabel(issue.ownerRole, t)}
                              {issue.ownerOrganisationName ? ` · ${issue.ownerOrganisationName}` : ''}
                            </p>
                          ) : null}
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{issue.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span>
                              {getIssuesLinkedEntityDisplayLine(
                                issue.linkedEntity.type,
                                issue.linkedEntity.name,
                                undefined,
                                t,
                              )}
                            </span>
                            {issue.owner ? (
                              <span>
                                {getIssuesOwnerPrefix(t)} {issue.owner}
                              </span>
                            ) : null}
                            {slaLabel ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  urgency === 'overdue' && 'font-medium text-red-700',
                                  urgency === 'today' && 'font-medium text-amber-700',
                                )}
                              >
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                {slaLabel}
                              </span>
                            ) : null}
                          </div>
                          {canAdvanceStatus ? (
                            <PermissionGate permission="compliance:resolve_issue">
                              <span
                                role="presentation"
                                className="mt-2 inline-flex text-[11px] font-medium text-primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (nextStatus) {
                                    onAdvanceStatus?.(issue.id, nextStatus);
                                  }
                                }}
                                onKeyDown={(event) => event.stopPropagation()}
                              >
                                {getIssuesAdvanceStatusLabel(nextStatus as 'in_progress' | 'resolved', t)}
                              </span>
                            </PermissionGate>
                          ) : remediationHref ? (
                            <Link
                              href={remediationHref}
                              className="mt-2 inline-flex text-[11px] font-medium text-primary hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {getIssuesOpenRemediationLabel(t)}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
