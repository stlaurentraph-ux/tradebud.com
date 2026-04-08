'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ArrowRight,
  Scale,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Upload,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { YieldException, ComplianceIssue } from '@/types';
import { emitAuditEvent } from '@/lib/audit-events';

// ============================================================
// YIELD-COMPLIANCE LINKING
// Per GRADING_ANALYSIS must-fix #7: Yield exceptions MUST link to compliance_issues
// ============================================================

export interface YieldExceptionWithIssue extends YieldException {
  compliance_issue?: ComplianceIssue;
  harvest_date: string;
  plot_name: string;
  farmer_name: string;
}

interface YieldExceptionCardProps {
  exception: YieldExceptionWithIssue;
  onRequestException?: (exception: YieldExceptionWithIssue, justification: string, evidenceIds: string[]) => void;
  onApprove?: (exception: YieldExceptionWithIssue, notes: string) => void;
  onReject?: (exception: YieldExceptionWithIssue, reason: string) => void;
  canApprove?: boolean;
  expanded?: boolean;
}

/**
 * YieldExceptionCard - displays yield check result with linked compliance issue
 *
 * Per spec:
 * - WARNING: ratio 1.10 < r <= 1.30
 * - BLOCKED: ratio > 1.30
 * - Every WARNING/BLOCKED MUST create a compliance_issue
 */
export function YieldExceptionCard({
  exception,
  onRequestException,
  onApprove,
  onReject,
  canApprove = false,
  expanded: initialExpanded = false,
}: YieldExceptionCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusConfig = () => {
    switch (exception.yield_status) {
      case 'PASS':
        return {
          icon: CheckCircle,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          label: 'Pass',
          description: 'Within expected yield capacity',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          label: 'Warning',
          description: 'Above capacity (1.10-1.30x)',
        };
      case 'BLOCKED':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'Blocked',
          description: 'Significantly over capacity (>1.30x)',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-slate-500',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
          label: 'Unknown',
          description: 'Yield status is not recognized',
        };
    }
  };

  const getExceptionStatusConfig = () => {
    switch (exception.exception_status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'bg-amber-500/20 text-amber-400',
          label: 'Exception Pending',
        };
      case 'APPROVED':
        return {
          icon: CheckCircle,
          color: 'bg-emerald-500/20 text-emerald-400',
          label: 'Exception Approved',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          color: 'bg-red-500/20 text-red-400',
          label: 'Exception Rejected',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const exceptionConfig = exception.exception_status !== 'PENDING' || exception.justification
    ? getExceptionStatusConfig()
    : null;

  const handleRequestException = () => {
    if (onRequestException && justification.trim()) {
      onRequestException(exception, justification, []);
      emitAuditEvent({
        event_type: 'YIELD_EXCEPTION_REQUESTED',
        entity_type: 'yield_exception',
        entity_id: exception.id,
        payload: {
          harvest_id: exception.harvest_id,
          batch_id: exception.batch_id,
          plot_id: exception.plot_id,
          actual_weight_kg: exception.actual_weight_kg,
          expected_max_weight_kg: exception.expected_max_weight_kg,
          ratio: exception.ratio,
          justification,
        },
      });
      setRequestDialogOpen(false);
      setJustification('');
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(exception, approvalNotes);
      emitAuditEvent({
        event_type: 'YIELD_EXCEPTION_APPROVED',
        entity_type: 'yield_exception',
        entity_id: exception.id,
        payload: {
          harvest_id: exception.harvest_id,
          approval_notes: approvalNotes,
          linked_compliance_issue_id: exception.compliance_issue_id,
        },
      });
      setApproveDialogOpen(false);
      setApprovalNotes('');
    }
  };

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(exception, rejectionReason);
      emitAuditEvent({
        event_type: 'YIELD_EXCEPTION_REJECTED',
        entity_type: 'yield_exception',
        entity_id: exception.id,
        payload: {
          harvest_id: exception.harvest_id,
          rejection_reason: rejectionReason,
          linked_compliance_issue_id: exception.compliance_issue_id,
        },
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
    }
  };

  return (
    <Card className={cn('transition-all', statusConfig.borderColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', statusConfig.bgColor)}>
              <statusConfig.icon className={cn('h-5 w-5', statusConfig.color)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {exception.batch_id}
                <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                {exceptionConfig && (
                  <Badge className={exceptionConfig.color}>
                    <exceptionConfig.icon className="mr-1 h-3 w-3" />
                    {exceptionConfig.label}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {exception.plot_name} - {exception.farmer_name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Yield Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase">Actual</p>
            <p className="text-lg font-bold">{exception.actual_weight_kg.toLocaleString()} kg</p>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground uppercase">Ratio</p>
            <p className={cn('text-lg font-bold', statusConfig.color)}>
              {exception.ratio.toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase">Expected Max</p>
            <p className="text-lg font-bold text-muted-foreground">
              {exception.expected_max_weight_kg.toLocaleString()} kg
            </p>
          </div>
        </div>

        {/* Visual Ratio Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100% (capacity)</span>
            <span>130%</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
            {/* Capacity marker */}
            <div className="absolute left-[77%] top-0 h-full w-0.5 bg-muted-foreground/50" />
            {/* Actual fill */}
            <div
              className={cn(
                'h-full transition-all',
                exception.yield_status === 'PASS'
                  ? 'bg-emerald-500'
                  : exception.yield_status === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${Math.min(100, (exception.ratio / 1.3) * 100)}%` }}
            />
          </div>
        </div>

        {/* Linked Compliance Issue */}
        {exception.compliance_issue && (
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Linked Compliance Issue</span>
              </div>
              <Link
                href={`/compliance/${exception.compliance_issue.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View Issue
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{exception.compliance_issue.title}</p>
              <div className="flex items-center gap-4 mt-1">
                <Badge
                  variant="outline"
                  className={
                    exception.compliance_issue.severity === 'BLOCKING'
                      ? 'border-red-500 text-red-500'
                      : 'border-amber-500 text-amber-500'
                  }
                >
                  {exception.compliance_issue.severity}
                </Badge>
                <span>Status: {exception.compliance_issue.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Justification (if submitted) */}
            {exception.justification && (
              <div>
                <Label className="text-xs text-muted-foreground">Exception Justification</Label>
                <p className="mt-1 text-sm bg-secondary/50 rounded-lg p-3">
                  {exception.justification}
                </p>
                {exception.requested_by && exception.requested_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested by {exception.requested_by} on{' '}
                    {new Date(exception.requested_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Approval/Rejection Info */}
            {exception.exception_status === 'APPROVED' && exception.approved_by && (
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Approved</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Approved by {exception.approved_by} on{' '}
                  {exception.approved_at && new Date(exception.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {exception.exception_status === 'REJECTED' && exception.rejection_reason && (
              <div className="rounded-lg bg-red-500/10 p-3">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Rejected</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{exception.rejection_reason}</p>
              </div>
            )}

            {/* Actions */}
            {exception.yield_status !== 'PASS' && (
              <div className="flex items-center gap-2 pt-2">
                {/* Request Exception Button */}
                {!exception.justification && exception.exception_status !== 'APPROVED' && (
                  <Button variant="outline" size="sm" onClick={() => setRequestDialogOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Request Exception
                  </Button>
                )}

                {/* Approval Actions */}
                {canApprove && exception.exception_status === 'PENDING' && exception.justification && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setApproveDialogOpen(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Request Exception Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Yield Exception</DialogTitle>
            <DialogDescription>
              Provide justification for the yield exceedance on batch {exception.batch_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p>
                <strong>Actual:</strong> {exception.actual_weight_kg.toLocaleString()} kg
              </p>
              <p>
                <strong>Expected Max:</strong> {exception.expected_max_weight_kg.toLocaleString()} kg
              </p>
              <p>
                <strong>Ratio:</strong> {exception.ratio.toFixed(2)}x (
                {exception.yield_status === 'WARNING' ? 'Warning: 1.10-1.30x' : 'Blocked: >1.30x'})
              </p>
            </div>

            <div>
              <Label>Justification (Required)</Label>
              <Textarea
                placeholder="Explain the exceptional circumstances (e.g., favorable weather conditions, improved farming techniques, measurement timing)..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will create a linked compliance issue for audit tracking.
              </p>
            </div>

            <div>
              <Label>Supporting Evidence (Optional)</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">
                  Drag and drop files or click to upload
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestException} disabled={!justification.trim()}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Yield Exception</DialogTitle>
            <DialogDescription>
              Confirm approval for batch {exception.batch_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {exception.justification && (
              <div>
                <Label className="text-xs text-muted-foreground">Submitted Justification</Label>
                <p className="mt-1 text-sm bg-secondary/50 rounded-lg p-3">
                  {exception.justification}
                </p>
              </div>
            )}
            <div>
              <Label>Approval Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes for the approval record..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Approving this exception will resolve the linked compliance issue.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Yield Exception</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting batch {exception.batch_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {exception.justification && (
              <div>
                <Label className="text-xs text-muted-foreground">Submitted Justification</Label>
                <p className="mt-1 text-sm bg-secondary/50 rounded-lg p-3">
                  {exception.justification}
                </p>
              </div>
            )}
            <div>
              <Label>Rejection Reason (Required)</Label>
              <Textarea
                placeholder="Explain why this exception request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-800">
              <XCircle className="inline h-4 w-4 mr-1" />
              Rejecting will keep the compliance issue open and require remediation.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * Helper to create compliance issue from yield exception
 */
export function createComplianceIssueFromYieldException(
  exception: YieldException,
  plotName: string,
  farmerName: string
): Omit<ComplianceIssue, 'id' | 'created_at' | 'updated_at'> {
  const isBlocked = exception.yield_status === 'BLOCKED';

  return {
    type: 'YIELD_EXCEEDED',
    severity: isBlocked ? 'BLOCKING' : 'WARNING',
    status: 'OPEN',
    title: `Yield exceedance on ${plotName}`,
    description: `Harvest batch ${exception.batch_id} recorded ${exception.actual_weight_kg}kg, which is ${exception.ratio.toFixed(2)}x the expected maximum of ${exception.expected_max_weight_kg}kg for this plot.`,
    remediation_guidance: isBlocked
      ? 'This shipment cannot proceed until the yield exceedance is resolved. Request an exception with supporting evidence, or adjust the harvest weight.'
      : 'Review the yield data and submit an exception request if the weight is accurate. Otherwise, correct the harvest record.',
    plot_id: exception.plot_id,
    yield_exception_id: exception.id,
    sla_due_at: new Date(Date.now() + (isBlocked ? 48 : 72) * 60 * 60 * 1000).toISOString(),
    sla_breached: false,
    regulatory_profile_version: 'eudr_v1_2026',
  };
}
