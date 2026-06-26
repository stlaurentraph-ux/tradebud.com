'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { ComplianceIssueRecord } from '@/components/compliance/compliance-issues-kanban';
import { SLAEscalationLadder } from '@/components/compliance/sla-escalation-ladder';
import { issueKindBadgeClass } from '@/lib/compliance-issue-ownership';
import { mapIssueRecordToSlaIssue } from '@/lib/compliance-issue-sla';
import { getIssueRemediationHref } from '@/lib/compliance-issue-remediation';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getComplianceIssueDetailCardTitle,
  getComplianceIssueDetailPageSubtitle,
  getComplianceIssueDetailPageTitle,
  getIssuesBackToListLabel,
  getIssuesDetailLabel,
  getIssuesKindLabel,
  getIssuesLinkedEntityDisplayLine,
  getIssuesOpenRemediationLabel,
  getIssuesOwnerRoleLabel,
  getIssuesRequestUpstreamRemediationLabel,
  getIssuesSeverityLabel,
  getIssuesKanbanStatusLabel,
  getWorkflowAsyncStateCopy,
} from '@/lib/workflow-terminology-labels';

type IssueApiRow = {
  id: string;
  title: string;
  description: string;
  severity: ComplianceIssueRecord['severity'];
  status: ComplianceIssueRecord['status'];
  owner?: string | null;
  linked_entity_type: string;
  linked_entity_id: string;
  linked_entity_name: string;
  due_date?: string | null;
  created_at: string;
  resolution_path?: string | null;
  issue_kind?: ComplianceIssueRecord['issueKind'];
  owner_role?: string | null;
  owner_organisation_name?: string | null;
};

function mapApiRow(item: IssueApiRow): ComplianceIssueRecord {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    owner: item.owner ?? undefined,
    linkedEntity: {
      type: item.linked_entity_type,
      id: item.linked_entity_id,
      name: item.linked_entity_name,
    },
    createdAt: item.created_at,
    dueDate: item.due_date ?? undefined,
    resolutionPath: item.resolution_path ?? undefined,
    issueKind: item.issue_kind,
    ownerRole: item.owner_role ?? undefined,
    ownerOrganisationName: item.owner_organisation_name ?? undefined,
  };
}

export default function ComplianceIssueDetailPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [issue, setIssue] = useState<ComplianceIssueRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setIsLoading(false);
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    setIsLoading(true);
    void fetch('/api/requests/issues', { headers, cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => [])) as IssueApiRow[];
        if (!response.ok || !Array.isArray(payload)) {
          throw new Error(getWorkflowAsyncStateCopy('issues.detail', 'error', t).title);
        }
        const match = payload.find((item) => item.id === id);
        if (!match) {
          setIssue(null);
          setError(null);
          return;
        }
        setIssue(mapApiRow(match));
        setError(null);
      })
      .catch((err: unknown) => {
        setIssue(null);
        setError(err instanceof Error ? err.message : getWorkflowAsyncStateCopy('issues.detail', 'error', t).title);
      })
      .finally(() => setIsLoading(false));
  }, [user, id, t]);

  const remediationHref = issue ? getIssueRemediationHref(issue) : null;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={issue?.title ?? getComplianceIssueDetailPageTitle(t)}
        subtitle={getComplianceIssueDetailPageSubtitle(id, t)}
        breadcrumbs={buildAppBreadcrumbs(
          t,
          { name: 'Compliance', href: '/compliance' },
          { name: 'Issues', href: '/compliance/issues' },
          { name: id },
        )}
      />
      <div className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/compliance/issues">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getIssuesBackToListLabel(t)}
          </Link>
        </Button>

        {isLoading ? (
          <AsyncState mode="loading" title={getWorkflowAsyncStateCopy('issues.detail', 'loading', t).title} />
        ) : error ? (
          <AsyncState
            mode="error"
            title={getWorkflowAsyncStateCopy('issues.detail', 'error', t).title}
            description={error}
          />
        ) : !issue ? (
          <AsyncState
            mode="empty"
            title={getWorkflowAsyncStateCopy('issues.detail', 'empty', t).title}
            description={getWorkflowAsyncStateCopy('issues.detail', 'empty', t).description}
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle>{getComplianceIssueDetailCardTitle(t)}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{getIssuesSeverityLabel(issue.severity, t)}</Badge>
                    <Badge>{getIssuesKanbanStatusLabel(issue.status, t)}</Badge>
                    {issue.issueKind ? (
                      <Badge variant="outline" className={issueKindBadgeClass(issue.issueKind)}>
                        {getIssuesKindLabel(issue.issueKind, t)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">{getIssuesDetailLabel('description', t)}</Label>
                  <p className="mt-1 text-sm">{issue.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('ownership', t)}</Label>
                    <p className="mt-1 text-sm">
                      {getIssuesOwnerRoleLabel(issue.ownerRole, t)}
                      {issue.ownerOrganisationName ? ` · ${issue.ownerOrganisationName}` : ''}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('linked_entity', t)}</Label>
                    <p className="mt-1 text-sm">
                      {getIssuesLinkedEntityDisplayLine(
                        issue.linkedEntity.type,
                        issue.linkedEntity.name,
                        role,
                        t,
                      )}
                    </p>
                  </div>
                </div>
                {issue.resolutionPath ? (
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('resolution_path', t)}</Label>
                    <p className="mt-1 text-sm">{issue.resolutionPath}</p>
                  </div>
                ) : null}
                {issue.owner ? (
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('assigned_owner', t)}</Label>
                    <p className="mt-1 text-sm">{issue.owner}</p>
                  </div>
                ) : null}
                {remediationHref ? (
                  <Button asChild variant="outline">
                    <Link href={remediationHref}>
                      {issue.issueKind === 'upstream_blocker'
                        ? getIssuesRequestUpstreamRemediationLabel(t)
                        : getIssuesOpenRemediationLabel(t)}
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
            {issue.dueDate ? <SLAEscalationLadder issue={mapIssueRecordToSlaIssue(issue)} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
