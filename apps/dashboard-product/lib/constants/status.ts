import React from 'react';
import {
  Edit,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';

export type StatusType =
  | 'DRAFT'
  | 'READY'
  | 'SEALED'
  | 'ARCHIVED'
  | 'ON_HOLD'
  | 'PENDING'
  | 'READY_TO_SUBMIT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING_CONFIRMATION'
  | 'AMENDMENT_DRAFT'
  | 'AMENDED_SUBMITTED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWN'
  | 'SUPERSEDED'
  | 'OPEN'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'APPROVED'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

export const STATUS_ICONS: Record<StatusType, React.ElementType> = {
  DRAFT: Edit,
  READY: Download,
  SEALED: CheckCircle,
  ARCHIVED: Check,
  ON_HOLD: AlertTriangle,
  PENDING: Clock,
  READY_TO_SUBMIT: CheckCircle2,
  SUBMITTED: Clock,
  ACCEPTED: Check,
  REJECTED: X,
  PENDING_CONFIRMATION: Clock,
  AMENDMENT_DRAFT: Edit,
  AMENDED_SUBMITTED: Clock,
  WITHDRAWAL_REQUESTED: AlertTriangle,
  WITHDRAWN: X,
  SUPERSEDED: Check,
  OPEN: AlertTriangle,
  RESOLVED: CheckCircle,
  ESCALATED: AlertTriangle,
  APPROVED: Check,
  UNAVAILABLE: AlertTriangle,
  BLOCKED: AlertTriangle,
  IN_PROGRESS: Clock,
  SUCCESS: Check,
  ERROR: X,
  WARNING: AlertTriangle,
  INFO: Clock,
};

export const STATUS_LABELS: Record<StatusType, string> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  SEALED: 'Sealed',
  ARCHIVED: 'Archived',
  ON_HOLD: 'On hold',
  PENDING: 'Pending',
  READY_TO_SUBMIT: 'Ready to submit',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  PENDING_CONFIRMATION: 'Pending confirmation',
  AMENDMENT_DRAFT: 'Amendment draft',
  AMENDED_SUBMITTED: 'Amended submitted',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  WITHDRAWN: 'Withdrawn',
  SUPERSEDED: 'Superseded',
  OPEN: 'Open',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
  APPROVED: 'Approved',
  UNAVAILABLE: 'Unavailable',
  BLOCKED: 'Blocked',
  IN_PROGRESS: 'In progress',
  SUCCESS: 'Success',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Info',
};

/**
 * Get the semantic category for a status
 */
export function getStatusCategory(
  status: StatusType
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'ACCEPTED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'SUCCESS':
    case 'SEALED':
      return 'success';
    case 'PENDING':
    case 'ON_HOLD':
    case 'PENDING_CONFIRMATION':
    case 'WARNING':
    case 'UNAVAILABLE':
      return 'warning';
    case 'REJECTED':
    case 'ERROR':
    case 'BLOCKED':
    case 'OPEN':
    case 'ESCALATED':
      return 'error';
    case 'READY':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
    case 'INFO':
    case 'READY_TO_SUBMIT':
      return 'info';
    default:
      return 'neutral';
  }
}
