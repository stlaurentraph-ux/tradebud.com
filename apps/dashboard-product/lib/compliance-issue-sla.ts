export type IssueSlaUrgency = 'overdue' | 'today' | 'soon' | 'normal';

export function getIssueSlaUrgency(dueDate?: string): IssueSlaUrgency | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

export function formatIssueSlaLabel(dueDate?: string): string | null {
  const urgency = getIssueSlaUrgency(dueDate);
  if (!urgency || !dueDate) return null;
  const formatted = new Date(dueDate).toLocaleDateString();
  switch (urgency) {
    case 'overdue':
      return `Overdue since ${formatted}`;
    case 'today':
      return `Due today (${formatted})`;
    case 'soon':
      return `Due ${formatted}`;
    default:
      return `Due ${formatted}`;
  }
}

export function issueSlaRowClass(dueDate?: string): string {
  const urgency = getIssueSlaUrgency(dueDate);
  if (urgency === 'overdue') return 'bg-red-50/80 border-red-100';
  if (urgency === 'today' || urgency === 'soon') return 'bg-amber-50/60 border-amber-100';
  return '';
}

type KanbanIssueSeverity = 'INFO' | 'WARNING' | 'BLOCKING';
type KanbanIssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type IssueRecordForSla = {
  id: string;
  title: string;
  description: string;
  severity: KanbanIssueSeverity;
  status: KanbanIssueStatus;
  dueDate?: string;
  resolutionPath?: string;
  createdAt: string;
};

function mapKanbanStatusToSlaStatus(status: KanbanIssueStatus): 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' {
  if (status === 'in_progress') return 'IN_PROGRESS';
  if (status === 'resolved' || status === 'closed') return 'RESOLVED';
  return 'OPEN';
}

/** Adapts kanban/list issue records for SLA ladder components that expect `ComplianceIssue`. */
export function mapIssueRecordToSlaIssue(record: IssueRecordForSla): import('@/types').ComplianceIssue {
  const urgency = getIssueSlaUrgency(record.dueDate);
  return {
    id: record.id,
    type: 'MISSING_EVIDENCE',
    severity: record.severity,
    status: mapKanbanStatusToSlaStatus(record.status),
    title: record.title,
    description: record.description,
    remediation_guidance: record.resolutionPath ?? '',
    sla_due_at: record.dueDate,
    sla_breached: urgency === 'overdue',
    regulatory_profile_version: '1.0',
    created_at: record.createdAt,
    updated_at: record.createdAt,
  };
}
