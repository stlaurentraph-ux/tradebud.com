import { describe, expect, it } from 'vitest';
import { getIssueRemediationHref, isPersistedComplianceIssue } from './compliance-issue-remediation';
import type { ComplianceIssueRecord } from '@/components/compliance/compliance-issues-kanban';

const baseIssue: ComplianceIssueRecord = {
  id: 'issue_campaign_abc',
  title: 'Campaign follow-up',
  description: 'Missing evidence',
  severity: 'WARNING',
  status: 'open',
  linkedEntity: { type: 'campaign', id: 'camp-1', name: 'Q1 campaign' },
  createdAt: new Date().toISOString(),
};

describe('compliance-issue-remediation', () => {
  it('detects persisted compliance issues by id prefix', () => {
    expect(isPersistedComplianceIssue('issue_compliance_123')).toBe(true);
    expect(isPersistedComplianceIssue('issue_campaign_123')).toBe(false);
  });

  it('builds remediation links for derived issue types', () => {
    expect(getIssueRemediationHref(baseIssue)).toBe('/outreach?campaign=camp-1');
    expect(
      getIssueRemediationHref({
        ...baseIssue,
        issueKind: 'upstream_blocker',
        linkedEntity: { type: 'plot', id: 'plot-1', name: 'Plot 1' },
      }),
    ).toBe('/outreach?new=1');
    expect(
      getIssueRemediationHref({
        ...baseIssue,
        linkedEntity: { type: 'request', id: 'req-1', name: 'Inbound request' },
      }),
    ).toBe('/inbox');
  });
});
