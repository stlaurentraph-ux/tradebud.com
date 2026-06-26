'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Plus,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  ComplianceIssuesKanban,
  type ComplianceIssueRecord,
  type ComplianceIssueSeverity,
  type ComplianceIssueStatus,
} from '@/components/compliance/compliance-issues-kanban';
import { SLAEscalationLadder, SLASummaryCard } from '@/components/compliance/sla-escalation-ladder';
import { issueSlaRowClass, mapIssueRecordToSlaIssue } from '@/lib/compliance-issue-sla';
import { canPersistIssueStatus } from '@/lib/compliance-issue-ownership';
import { getIssueRemediationHref } from '@/lib/compliance-issue-remediation';
import { issueKindBadgeClass } from '@/lib/compliance-issue-ownership';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getIssuesBlockingAlert,
  getIssuesCancelLabel,
  getIssuesCreateButtonLabel,
  getIssuesCreateDialogDescription,
  getIssuesCreateDialogTitle,
  getIssuesCreateSubmitLabel,
  getIssuesDetailLabel,
  getIssuesEmptyMessage,
  getIssuesFilterPlaceholder,
  getIssuesFormLabel,
  getIssuesFormPlaceholder,
  getIssuesKanbanStatusLabel,
  getIssuesKindLabel,
  getIssuesLinkedEntityDisplayLine,
  getIssuesLinkedEntityTypeLabel,
  getIssuesLoadingMessage,
  getIssuesOpenRemediationLabel,
  getIssuesOwnerPrefix,
  getIssuesOwnerRoleLabel,
  getIssuesOwnershipAlertDescription,
  getIssuesOwnershipFilterLabel,
  getIssuesPageSubtitle,
  getIssuesPageTitle,
  getIssuesRequestUpstreamRemediationLabel,
  getIssuesSearchPlaceholder,
  getIssuesSeverityLabel,
  getIssuesSlaLabel,
  getIssuesUpstreamBlockerAlert,
  getIssuesViewModeLabel,
  getWorkflowComplianceNavLabel,
  getWorkflowIssuesNavLabel,
} from '@/lib/workflow-terminology-labels';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';

type ComplianceIssue = ComplianceIssueRecord;
type IssueSeverity = ComplianceIssueSeverity;
type IssueStatus = ComplianceIssueStatus;

type LinkedEntityType = 'plot' | 'batch' | 'package' | 'farmer' | 'campaign' | 'request';

type IssuesViewMode = 'kanban' | 'list';
type IssueKindFilter = ComplianceIssue['issueKind'] | 'all';

export default function ComplianceIssuesPage() {
  return (
    <SearchParamsPageBoundary>
      <ComplianceIssuesPageContent />
    </SearchParamsPageBoundary>
  );
}

function ComplianceIssuesPageContent() {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const searchParams = useSearchParams();
  const role = user?.active_role;
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [viewMode, setViewMode] = useState<IssuesViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<IssueKindFilter>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ComplianceIssue | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [backendBlockingCount, setBackendBlockingCount] = useState<number | null>(null);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const [newIssue, setNewIssue] = useState<{
    title: string;
    description: string;
    severity: IssueSeverity;
    linkedEntityType: LinkedEntityType;
    linkedEntityId: string;
  }>({
    title: '',
    description: '',
    severity: 'WARNING' as IssueSeverity,
    linkedEntityType: 'plot',
    linkedEntityId: '',
  });

  const localBlockingCount = issues.filter((i) => i.severity === 'BLOCKING' && i.status === 'open').length;
  const upstreamBlockerCount = issues.filter((i) => i.issueKind === 'upstream_blocker' && i.status === 'open').length;
  const blockingIssuesCount = role === 'cooperative' ? (backendBlockingCount ?? localBlockingCount) : localBlockingCount;

  useEffect(() => {
    const ownership = searchParams.get('ownership');
    if (
      ownership === 'upstream_blocker' ||
      ownership === 'canonical' ||
      ownership === 'campaign' ||
      ownership === 'request'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setKindFilter(ownership);
    }
  }, [searchParams]);

  useEffect(() => {
    if (role !== 'cooperative') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setBackendBlockingCount(null);
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/insights', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { metrics?: { blocking_issues_count?: number } }) => {
        if (typeof payload?.metrics?.blocking_issues_count === 'number') {
          setBackendBlockingCount(payload.metrics.blocking_issues_count);
        }
      })
      .catch(() => undefined);
  }, [role]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    setIsLoadingIssues(true);
    void fetch('/api/requests/issues', { headers, cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => [])) as Array<{
          id: string;
          title: string;
          description: string;
          severity: IssueSeverity;
          status: IssueStatus;
          owner?: string | null;
          linked_entity_type: LinkedEntityType;
          linked_entity_id: string;
          linked_entity_name: string;
          due_date?: string | null;
          created_at: string;
          resolution_path?: string | null;
          issue_kind?: ComplianceIssue['issueKind'];
          owner_role?: string | null;
          owner_organisation_name?: string | null;
          source_issue_id?: string | null;
          can_update_status?: boolean;
        }>;
        if (!response.ok || !Array.isArray(payload)) {
          return;
        }
        setIssues(
          payload.map((item) => ({
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
            sourceIssueId: item.source_issue_id ?? undefined,
            canUpdateStatus: item.can_update_status,
          })),
        );
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingIssues(false));
  }, [user]);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.linkedEntity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesKind = kindFilter === 'all' || issue.issueKind === kindFilter;
    return matchesSearch && matchesSeverity && matchesStatus && matchesKind;
  });

  const slaTrackedIssues = filteredIssues
    .filter((issue) => issue.dueDate)
    .map((issue) => mapIssueRecordToSlaIssue(issue));

  const handleCreateIssue = () => {
    if (!newIssue.title || !newIssue.linkedEntityId) return;

    const issue: ComplianceIssue = {
      id: `issue_${Date.now()}`,
      title: newIssue.title,
      description: newIssue.description,
      severity: newIssue.severity,
      status: 'open',
      linkedEntity: {
        type: newIssue.linkedEntityType,
        id: newIssue.linkedEntityId,
        name: `${newIssue.linkedEntityType}_${newIssue.linkedEntityId}`,
      },
      createdAt: new Date().toISOString(),
    };

    setIssues([issue, ...issues]);
    setNewIssue({
      title: '',
      description: '',
      severity: 'WARNING',
      linkedEntityType: 'plot',
      linkedEntityId: '',
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateStatus = async (issueId: string, newStatus: IssueStatus) => {
    const issue = issues.find((item) => item.id === issueId);
    if (!canPersistIssueStatus(issueId, issue?.canUpdateStatus)) {
      return;
    }

    const previousIssues = issues;
    setIssues(issues.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)));

    const token = window.sessionStorage.getItem('tracebud_token');
    const response = await fetch(`/api/requests/issues/${encodeURIComponent(issueId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      setIssues(previousIssues);
      return;
    }

    const payload = (await response.json().catch(() => null)) as {
      id?: string;
      status?: IssueStatus;
    } | null;

    if (payload?.id && payload.status) {
      setIssues((current) =>
        current.map((issue) =>
          issue.id === payload.id ? { ...issue, status: payload.status as IssueStatus } : issue,
        ),
      );
    }

    if (newStatus === 'resolved' || newStatus === 'closed') {
      markOnboardingAction('submission_reviewed');
    }
  };

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case 'BLOCKING':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'BLOCKING':
        return 'bg-red-500/20 text-red-700 border-red-200';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-700 border-amber-200';
      case 'INFO':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadgeColor = (status: IssueStatus) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getIssuesPageTitle(role, t)}
        subtitle={getIssuesPageSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getWorkflowComplianceNavLabel(t), href: '/compliance' },
          { label: getWorkflowIssuesNavLabel(t) },
        ]}
        actions={
          <PermissionGate permission="compliance:create_issue">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {getIssuesCreateButtonLabel(role, t)}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{getIssuesCreateDialogTitle(role, t)}</DialogTitle>
                  <DialogDescription>
                    {getIssuesCreateDialogDescription(role, t)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{getIssuesFormLabel('title', t)}</Label>
                    <Input
                      placeholder={getIssuesFormPlaceholder('title', t)}
                      value={newIssue.title}
                      onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{getIssuesFormLabel('description', t)}</Label>
                    <Textarea
                      placeholder={getIssuesFormPlaceholder('description', t)}
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{getIssuesFormLabel('severity', t)}</Label>
                      <Select value={newIssue.severity} onValueChange={(v) => setNewIssue({ ...newIssue, severity: v as IssueSeverity })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFO">{getIssuesSeverityLabel('INFO', t)}</SelectItem>
                          <SelectItem value="WARNING">{getIssuesSeverityLabel('WARNING', t)}</SelectItem>
                          <SelectItem value="BLOCKING">{getIssuesSeverityLabel('BLOCKING', t)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{getIssuesFormLabel('linked_entity_type', t)}</Label>
                      <Select value={newIssue.linkedEntityType} onValueChange={(v) => setNewIssue({ ...newIssue, linkedEntityType: v as LinkedEntityType })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plot">{getIssuesLinkedEntityTypeLabel('plot', role, t)}</SelectItem>
                          <SelectItem value="batch">{getIssuesLinkedEntityTypeLabel('batch', role, t)}</SelectItem>
                          <SelectItem value="package">{getIssuesLinkedEntityTypeLabel('package', role, t)}</SelectItem>
                          <SelectItem value="farmer">{getIssuesLinkedEntityTypeLabel('farmer', role, t)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{getIssuesFormLabel('entity_id', t)}</Label>
                    <Input
                      placeholder={getIssuesFormPlaceholder('entity_id', t)}
                      value={newIssue.linkedEntityId}
                      onChange={(e) => setNewIssue({ ...newIssue, linkedEntityId: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      {getIssuesCancelLabel(t)}
                    </Button>
                    <Button onClick={handleCreateIssue}>{getIssuesCreateSubmitLabel(t)}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        }
      />

      <div className="flex-1 p-6">
        <Alert className="mb-6 border-border bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertDescription>{getIssuesOwnershipAlertDescription(t)}</AlertDescription>
        </Alert>

        {upstreamBlockerCount > 0 ? (
          <Alert className="mb-6 border-violet-300 bg-violet-50">
            <AlertTriangle className="h-4 w-4 text-violet-700" />
            <AlertDescription className="text-violet-900">
              {getIssuesUpstreamBlockerAlert(upstreamBlockerCount, t)}
            </AlertDescription>
          </Alert>
        ) : null}

        {blockingIssuesCount > 0 && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {getIssuesBlockingAlert(blockingIssuesCount, t)}
            </AlertDescription>
          </Alert>
        )}

        {slaTrackedIssues.length > 0 ? (
          <SLASummaryCard issues={slaTrackedIssues} className="mb-6" />
        ) : null}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex rounded-md border border-border p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              onClick={() => setViewMode('kanban')}
            >
              {getIssuesViewModeLabel('kanban', t)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              {getIssuesViewModeLabel('list', t)}
            </Button>
          </div>
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={getIssuesSearchPlaceholder(t)}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as IssueSeverity | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={getIssuesFilterPlaceholder('severity', t)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{getIssuesSeverityLabel('all', t)}</SelectItem>
              <SelectItem value="BLOCKING">{getIssuesSeverityLabel('BLOCKING', t)}</SelectItem>
              <SelectItem value="WARNING">{getIssuesSeverityLabel('WARNING', t)}</SelectItem>
              <SelectItem value="INFO">{getIssuesSeverityLabel('INFO', t)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={getIssuesFilterPlaceholder('status', t)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{getIssuesKanbanStatusLabel('all', t)}</SelectItem>
              <SelectItem value="open">{getIssuesKanbanStatusLabel('open', t)}</SelectItem>
              <SelectItem value="in_progress">{getIssuesKanbanStatusLabel('in_progress', t)}</SelectItem>
              <SelectItem value="resolved">{getIssuesKanbanStatusLabel('resolved', t)}</SelectItem>
              <SelectItem value="closed">{getIssuesKanbanStatusLabel('closed', t)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as IssueKindFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={getIssuesFilterPlaceholder('ownership', t)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{getIssuesOwnershipFilterLabel('all', t)}</SelectItem>
              <SelectItem value="canonical">{getIssuesOwnershipFilterLabel('canonical', t)}</SelectItem>
              <SelectItem value="upstream_blocker">{getIssuesOwnershipFilterLabel('upstream_blocker', t)}</SelectItem>
              <SelectItem value="campaign">{getIssuesOwnershipFilterLabel('campaign', t)}</SelectItem>
              <SelectItem value="request">{getIssuesOwnershipFilterLabel('request', t)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Issues Grid */}
        {isLoadingIssues ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {getIssuesLoadingMessage(t)}
            </CardContent>
          </Card>
        ) : filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-muted-foreground">{getIssuesEmptyMessage(role, t)}</p>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          <ComplianceIssuesKanban
            issues={filteredIssues}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setIsDetailDialogOpen(true);
            }}
            onAdvanceStatus={(issueId, newStatus) => handleUpdateStatus(issueId, newStatus)}
          />
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className={`cursor-pointer transition-colors hover:bg-secondary/50 ${issueSlaRowClass(issue.dueDate)}`}
                onClick={() => {
                  setSelectedIssue(issue);
                  setIsDetailDialogOpen(true);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityBadgeColor(issue.severity)} variant="outline">
                            {getIssuesSeverityLabel(issue.severity, t)}
                          </Badge>
                          <Badge className={getStatusBadgeColor(issue.status)}>
                            {getIssuesKanbanStatusLabel(issue.status, t)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          {getIssuesLinkedEntityDisplayLine(
                            issue.linkedEntity.type,
                            issue.linkedEntity.name,
                            role,
                            t,
                          )}
                        </span>
                        {issue.owner ? (
                          <span>
                            {getIssuesOwnerPrefix(t)} {issue.owner}
                          </span>
                        ) : null}
                        {getIssuesSlaLabel(issue.dueDate, t) ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getIssuesSlaLabel(issue.dueDate, t)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Issue Detail Dialog */}
        {selectedIssue && (
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(selectedIssue.severity)}
                    <div>
                      <DialogTitle>{selectedIssue.title}</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getIssuesDetailLabel('id', t)}: {selectedIssue.id}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityBadgeColor(selectedIssue.severity)} variant="outline">
                    {getIssuesSeverityLabel(selectedIssue.severity, t)}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">{getIssuesDetailLabel('description', t)}</Label>
                  <p className="text-sm mt-1">{selectedIssue.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('status', t)}</Label>
                    {canPersistIssueStatus(selectedIssue.id, selectedIssue.canUpdateStatus) ? (
                      <Select
                        value={selectedIssue.status}
                        onValueChange={(newStatus) => {
                          void handleUpdateStatus(selectedIssue.id, newStatus as IssueStatus);
                          setSelectedIssue({ ...selectedIssue, status: newStatus as IssueStatus });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{getIssuesKanbanStatusLabel('open', t)}</SelectItem>
                          <SelectItem value="in_progress">
                            {getIssuesKanbanStatusLabel('in_progress', t)}
                          </SelectItem>
                          <SelectItem value="resolved">{getIssuesKanbanStatusLabel('resolved', t)}</SelectItem>
                          <SelectItem value="closed">{getIssuesKanbanStatusLabel('closed', t)}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm">{getIssuesKanbanStatusLabel(selectedIssue.status, t)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('ownership', t)}</Label>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {selectedIssue.issueKind ? (
                        <Badge variant="outline" className={issueKindBadgeClass(selectedIssue.issueKind)}>
                          {getIssuesKindLabel(selectedIssue.issueKind, t)}
                        </Badge>
                      ) : null}
                      <span className="text-sm text-muted-foreground">
                        {getIssuesOwnerRoleLabel(selectedIssue.ownerRole, t)}
                        {selectedIssue.ownerOrganisationName
                          ? ` · ${selectedIssue.ownerOrganisationName}`
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedIssue.resolutionPath ? (
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('resolution_path', t)}</Label>
                    <p className="text-sm mt-1">{selectedIssue.resolutionPath}</p>
                  </div>
                ) : null}
                {getIssueRemediationHref(selectedIssue) ? (
                  <Button asChild variant="outline">
                    <a href={getIssueRemediationHref(selectedIssue) ?? '#'}>
                      {selectedIssue.issueKind === 'upstream_blocker'
                        ? getIssuesRequestUpstreamRemediationLabel(t)
                        : getIssuesOpenRemediationLabel(t)}
                    </a>
                  </Button>
                ) : null}
                <div>
                  <Label className="text-muted-foreground">{getIssuesDetailLabel('linked_entity', t)}</Label>
                  <p className="text-sm mt-1">
                    {getIssuesLinkedEntityDisplayLine(
                      selectedIssue.linkedEntity.type,
                      selectedIssue.linkedEntity.name,
                      role,
                      t,
                    )}
                  </p>
                </div>
                {selectedIssue.owner ? (
                  <div>
                    <Label className="text-muted-foreground">{getIssuesDetailLabel('assigned_owner', t)}</Label>
                    <p className="text-sm mt-1">{selectedIssue.owner}</p>
                  </div>
                ) : null}
                {selectedIssue.dueDate ? (
                  <SLAEscalationLadder issue={mapIssueRecordToSlaIssue(selectedIssue)} />
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
