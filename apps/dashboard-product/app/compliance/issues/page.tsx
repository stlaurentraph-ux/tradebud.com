'use client';

import React, { useState } from 'react';
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
import { markOnboardingAction } from '@/lib/onboarding-actions';

type IssueSeverity = 'INFO' | 'WARNING' | 'BLOCKING';
type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  owner?: string;
  linkedEntity: {
    type: 'plot' | 'batch' | 'package' | 'farmer';
    id: string;
    name: string;
  };
  createdAt: string;
  dueDate?: string;
  resolutionPath?: string;
}

type LinkedEntityType = ComplianceIssue['linkedEntity']['type'];

const mockIssues: ComplianceIssue[] = [];

export default function ComplianceIssuesPage() {
  const [issues, setIssues] = useState<ComplianceIssue[]>(mockIssues);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ComplianceIssue | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

  const blockingIssuesCount = issues.filter((i) => i.severity === 'BLOCKING' && i.status === 'open').length;

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.linkedEntity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

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

  const handleUpdateStatus = (issueId: string, newStatus: IssueStatus) => {
    setIssues(issues.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)));
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
        title="Compliance Issues"
        subtitle="Manage and track compliance blockers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Compliance', href: '/compliance' },
          { label: 'Issues' },
        ]}
        actions={
          <PermissionGate permission="compliance:create_issue">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Compliance Issue</DialogTitle>
                  <DialogDescription>Add a new compliance issue for tracking</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="Issue title"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Detailed description"
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Severity</Label>
                      <Select value={newIssue.severity} onValueChange={(v) => setNewIssue({ ...newIssue, severity: v as IssueSeverity })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFO">Info</SelectItem>
                          <SelectItem value="WARNING">Warning</SelectItem>
                          <SelectItem value="BLOCKING">Blocking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Linked Entity Type</Label>
                      <Select value={newIssue.linkedEntityType} onValueChange={(v) => setNewIssue({ ...newIssue, linkedEntityType: v as 'plot' | 'batch' | 'package' | 'farmer' })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plot">Plot</SelectItem>
                          <SelectItem value="batch">Batch</SelectItem>
                          <SelectItem value="package">Package</SelectItem>
                          <SelectItem value="farmer">Farmer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Entity ID</Label>
                    <Input
                      placeholder="plot_001, batch_001, etc."
                      value={newIssue.linkedEntityId}
                      onChange={(e) => setNewIssue({ ...newIssue, linkedEntityId: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateIssue}>Create Issue</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        }
      />

      <div className="flex-1 p-6">
        {blockingIssuesCount > 0 && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {blockingIssuesCount} blocking issue(s) preventing shipment sealing.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as IssueSeverity | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="BLOCKING">Blocking</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Issues Grid */}
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-muted-foreground">No compliance issues found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
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
                            {issue.severity}
                          </Badge>
                          <Badge className={getStatusBadgeColor(issue.status)}>{issue.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{issue.linkedEntity.type}: {issue.linkedEntity.name}</span>
                        {issue.owner && <span>Owner: {issue.owner}</span>}
                        {issue.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                        )}
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(selectedIssue.severity)}
                    <div>
                      <DialogTitle>{selectedIssue.title}</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">ID: {selectedIssue.id}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityBadgeColor(selectedIssue.severity)} variant="outline">
                    {selectedIssue.severity}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedIssue.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Select
                      value={selectedIssue.status}
                      onValueChange={(newStatus) => {
                        handleUpdateStatus(selectedIssue.id, newStatus as IssueStatus);
                        setSelectedIssue({ ...selectedIssue, status: newStatus as IssueStatus });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Linked Entity</Label>
                    <p className="text-sm mt-1">
                      {selectedIssue.linkedEntity.type}: {selectedIssue.linkedEntity.name}
                    </p>
                  </div>
                </div>
                {selectedIssue.owner && (
                  <div>
                    <Label className="text-muted-foreground">Owner</Label>
                    <p className="text-sm mt-1">{selectedIssue.owner}</p>
                  </div>
                )}
                {selectedIssue.resolutionPath && (
                  <div>
                    <Label className="text-muted-foreground">Resolution Path</Label>
                    <p className="text-sm mt-1">{selectedIssue.resolutionPath}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
