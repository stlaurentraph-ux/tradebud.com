'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  Search,
  AlertOctagon,
  Building2,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  getLegalRoleDisplayName,
  getLegalRoleDescription,
  getLegalRoleBadgeColor,
} from '@/lib/rbac';
import type { LegalWorkflowRole, RoleDecision } from '@/types';
const roleDecisions: (RoleDecision & {
  shipment_code: string;
  organization_name: string;
  created_at: string;
})[] = [];

// Statistics
const stats = {
  total: roleDecisions.length,
  pending: roleDecisions.filter((d) => d.determined_role === 'PENDING_MANUAL_CLASSIFICATION').length,
  operator: roleDecisions.filter((d) => d.determined_role === 'OPERATOR').length,
  simplified: roleDecisions.filter((d) => d.determined_role === 'MICRO_SMALL_PRIMARY_OPERATOR').length,
  downstream: roleDecisions.filter((d) =>
    d.determined_role === 'DOWNSTREAM_OPERATOR_FIRST' ||
    d.determined_role === 'DOWNSTREAM_OPERATOR_SUBSEQUENT'
  ).length,
};

export default function RoleDecisionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<LegalWorkflowRole | 'all'>('all');
  const [selectedDecision, setSelectedDecision] = useState<(typeof roleDecisions)[number] | null>(null);
  const [classifyDialogOpen, setClassifyDialogOpen] = useState(false);
  const [classificationNotes, setClassificationNotes] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<LegalWorkflowRole | ''>('');

  const filteredDecisions = roleDecisions.filter((decision) => {
    const matchesSearch =
      decision.shipment_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.organization_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || decision.determined_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const pendingDecisions = filteredDecisions.filter(
    (d) => d.determined_role === 'PENDING_MANUAL_CLASSIFICATION'
  );
  const resolvedDecisions = filteredDecisions.filter(
    (d) => d.determined_role !== 'PENDING_MANUAL_CLASSIFICATION'
  );

  const handleManualClassify = () => {
    // In production, this would call the API
    console.log('[v0] Manual classification:', {
      decision: selectedDecision,
      newRole: selectedClassification,
      notes: classificationNotes,
    });
    setClassifyDialogOpen(false);
    setSelectedDecision(null);
    setClassificationNotes('');
    setSelectedClassification('');
  };

  return (
    <>
      <AppHeader title="Role Decisions" />

      <div className="flex-1 space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Legal Role Decisions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and manage legal workflow role classifications per EUDR Section 5
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Decisions</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className={stats.pending > 0 ? 'border-red-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <AlertOctagon className={`h-4 w-4 ${stats.pending > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pending > 0 ? 'text-red-600' : ''}`}>
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Operators</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.operator}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Simplified Path</CardTitle>
              <CheckCircle className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.simplified}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Downstream</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.downstream}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Manual Classification Alert */}
        {stats.pending > 0 && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Manual Classification Required</h4>
                <p className="text-sm text-red-700 mt-1">
                  {stats.pending} shipment(s) are held with PENDING_MANUAL_CLASSIFICATION status.
                  No DDS can be submitted and no shipment can be sealed until these are resolved.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-500 text-red-700 hover:bg-red-50"
                onClick={() => setFilterRole('PENDING_MANUAL_CLASSIFICATION')}
              >
                Review Pending
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by shipment code or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as LegalWorkflowRole | 'all')}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="PENDING_MANUAL_CLASSIFICATION">Pending Classification</option>
              <option value="OPERATOR">Operator</option>
              <option value="MICRO_SMALL_PRIMARY_OPERATOR">Micro/Small Primary Operator</option>
              <option value="DOWNSTREAM_OPERATOR_FIRST">Downstream Operator (First)</option>
              <option value="DOWNSTREAM_OPERATOR_SUBSEQUENT">Downstream Operator (Subsequent)</option>
              <option value="TRADER">Trader</option>
              <option value="OUT_OF_SCOPE">Out of Scope</option>
            </select>
          </div>
        </div>

        {/* Pending Decisions Section */}
        {pendingDecisions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Pending Manual Classification ({pendingDecisions.length})
            </h2>
            <div className="grid gap-4">
              {pendingDecisions.map((decision) => (
                <Card key={decision.workflow_object_id} className="border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getLegalRoleBadgeColor(decision.determined_role)}>
                            {getLegalRoleDisplayName(decision.determined_role)}
                          </Badge>
                          <span className="text-sm font-medium">{decision.shipment_code}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {decision.organization_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(decision.decided_at).toLocaleDateString()}
                          </span>
                        </div>
                        {decision.hold_reason && (
                          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-800">
                            <strong>Hold Reason:</strong> {decision.hold_reason}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          View Details
                        </Button>
                        <PermissionGate permission="roles:manual_classify">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDecision(decision);
                              setClassifyDialogOpen(true);
                            }}
                          >
                            Classify
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Decisions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Resolved Decisions ({resolvedDecisions.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              {resolvedDecisions.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No role decisions available yet for this tenant.
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Shipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Legal Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Workflow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Decided
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resolvedDecisions.map((decision) => (
                      <tr key={decision.workflow_object_id} className="hover:bg-secondary/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/packages/${decision.workflow_object_id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {decision.shipment_code}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-foreground">{decision.organization_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getLegalRoleBadgeColor(decision.determined_role)}>
                            {getLegalRoleDisplayName(decision.determined_role)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">
                            {decision.determined_workflow.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">
                            {new Date(decision.decided_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDecision(decision)}
                          >
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Detail Dialog */}
        <Dialog open={!!selectedDecision && !classifyDialogOpen} onOpenChange={() => setSelectedDecision(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Role Decision Details</DialogTitle>
              <DialogDescription>
                Legal workflow role classification for {selectedDecision?.shipment_code}
              </DialogDescription>
            </DialogHeader>
            {selectedDecision && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Legal Role</Label>
                    <div className="mt-1">
                      <Badge className={getLegalRoleBadgeColor(selectedDecision.determined_role)}>
                        {getLegalRoleDisplayName(selectedDecision.determined_role)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Workflow Type</Label>
                    <p className="mt-1 text-sm font-medium">
                      {selectedDecision.determined_workflow.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Organization</Label>
                    <p className="mt-1 text-sm">{selectedDecision.organization_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Regulatory Profile</Label>
                    <p className="mt-1 text-sm">{selectedDecision.regulatory_profile_version}</p>
                  </div>
                </div>

                {/* Role Description */}
                <div className="rounded-lg bg-secondary/50 p-4">
                  <Label className="text-xs text-muted-foreground">Role Definition</Label>
                  <p className="mt-1 text-sm">
                    {getLegalRoleDescription(selectedDecision.determined_role)}
                  </p>
                </div>

                {/* Decision Path (Audit Trail) */}
                <div>
                  <Label className="text-xs text-muted-foreground">Decision Path</Label>
                  <div className="mt-2 space-y-2">
                    {selectedDecision.decision_path.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className={step.includes('Result:') ? 'font-semibold' : ''}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hold Reason */}
                {selectedDecision.hold_reason && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <Label className="text-xs text-red-600">Hold Reason</Label>
                    <p className="mt-1 text-sm text-red-800">{selectedDecision.hold_reason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedDecision(null)}>
                    Close
                  </Button>
                  {selectedDecision.determined_role === 'PENDING_MANUAL_CLASSIFICATION' && (
                    <PermissionGate permission="roles:manual_classify">
                      <Button onClick={() => setClassifyDialogOpen(true)}>
                        Manually Classify
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Classification Dialog */}
        <Dialog open={classifyDialogOpen} onOpenChange={setClassifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Role Classification</DialogTitle>
              <DialogDescription>
                Override the automatic role decision for {selectedDecision?.shipment_code}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDecision?.hold_reason && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
                  <strong>Hold Reason:</strong> {selectedDecision.hold_reason}
                </div>
              )}

              <div>
                <Label>New Legal Role</Label>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value as LegalWorkflowRole)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a role...</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="MICRO_SMALL_PRIMARY_OPERATOR">Micro/Small Primary Operator</option>
                  <option value="DOWNSTREAM_OPERATOR_FIRST">Downstream Operator (First)</option>
                  <option value="DOWNSTREAM_OPERATOR_SUBSEQUENT">Downstream Operator (Subsequent)</option>
                  <option value="TRADER">Trader</option>
                  <option value="OUT_OF_SCOPE">Out of Scope</option>
                </select>
              </div>

              <div>
                <Label>Justification (Required)</Label>
                <Textarea
                  placeholder="Explain why this manual classification is appropriate..."
                  value={classificationNotes}
                  onChange={(e) => setClassificationNotes(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be recorded in the audit log with your user ID and timestamp.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setClassifyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleManualClassify}
                  disabled={!selectedClassification || !classificationNotes.trim()}
                >
                  Confirm Classification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
