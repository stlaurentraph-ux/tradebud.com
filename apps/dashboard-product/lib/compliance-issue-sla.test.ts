import { describe, expect, it } from 'vitest';
import { formatIssueSlaLabel, getIssueSlaUrgency, mapIssueRecordToSlaIssue } from './compliance-issue-sla';

describe('compliance-issue-sla', () => {
  it('marks past due dates as overdue', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 2);
    expect(getIssueSlaUrgency(dueDate.toISOString())).toBe('overdue');
    expect(formatIssueSlaLabel(dueDate.toISOString())).toContain('Overdue');
  });

  it('marks near-term due dates as soon', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    expect(getIssueSlaUrgency(dueDate.toISOString())).toBe('soon');
  });

  it('maps kanban issue records for SLA ladder components', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const mapped = mapIssueRecordToSlaIssue({
      id: 'issue_1',
      title: 'Test',
      description: 'Desc',
      severity: 'WARNING',
      status: 'open',
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString(),
    });
    expect(mapped.sla_due_at).toBeTruthy();
    expect(mapped.severity).toBe('WARNING');
    expect(mapped.status).toBe('OPEN');
  });
});
