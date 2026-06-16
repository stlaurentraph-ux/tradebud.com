import { describe, expect, it } from 'vitest';
import { countOwnedBlockingIssues, countUpstreamBlockers } from './dashboard-issue-counts';

describe('dashboard-issue-counts', () => {
  const issues = [
    { issue_kind: 'upstream_blocker', status: 'open', severity: 'BLOCKING' },
    { issue_kind: 'upstream_blocker', status: 'resolved', severity: 'BLOCKING' },
    { issue_kind: 'canonical', status: 'open', severity: 'BLOCKING' },
    { issue_kind: 'canonical', status: 'open', severity: 'WARNING' },
  ];

  it('counts active upstream blockers', () => {
    expect(countUpstreamBlockers(issues)).toBe(1);
  });

  it('counts owned blocking canonical issues', () => {
    expect(countOwnedBlockingIssues(issues)).toBe(1);
  });
});
