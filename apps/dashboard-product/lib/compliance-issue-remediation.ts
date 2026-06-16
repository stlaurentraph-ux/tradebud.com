import type { ComplianceIssueRecord } from '@/components/compliance/compliance-issues-kanban';

const PERSISTED_ISSUE_PREFIX = 'issue_compliance_';

export function isPersistedComplianceIssue(issueId: string, canUpdateStatus?: boolean): boolean {
  return issueId.startsWith(PERSISTED_ISSUE_PREFIX) && canUpdateStatus !== false;
}

export function getIssueRemediationHref(issue: ComplianceIssueRecord): string | null {
  if (issue.issueKind === 'upstream_blocker') {
    return '/outreach?new=1';
  }

  const { type, id } = issue.linkedEntity;
  if (type === 'campaign') {
    return `/outreach?campaign=${encodeURIComponent(id)}`;
  }
  if (type === 'request') {
    return '/inbox';
  }
  if (type === 'tenure_verification' || type === 'plot') {
    return '/plots';
  }
  if (type === 'package') {
    return `/packages/${encodeURIComponent(id)}`;
  }
  return null;
}
