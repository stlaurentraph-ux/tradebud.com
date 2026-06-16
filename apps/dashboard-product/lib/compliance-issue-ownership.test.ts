import { describe, expect, it } from 'vitest';
import {
  canPersistIssueStatus,
  formatIssueKindLabel,
  formatOwnerRoleLabel,
  isUpstreamBlockerIssue,
} from './compliance-issue-ownership';

describe('compliance-issue-ownership', () => {
  it('formats owner role labels', () => {
    expect(formatOwnerRoleLabel('cooperative')).toBe('Cooperative');
    expect(formatOwnerRoleLabel('exporter')).toBe('Exporter');
  });

  it('formats issue kind labels', () => {
    expect(formatIssueKindLabel('upstream_blocker')).toBe('Upstream blocker');
    expect(formatIssueKindLabel('canonical')).toBe('Owned by your org');
  });

  it('detects upstream blockers and persistable canonical issues', () => {
    expect(isUpstreamBlockerIssue('upstream_blocker')).toBe(true);
    expect(canPersistIssueStatus('issue_compliance_abc', true)).toBe(true);
    expect(canPersistIssueStatus('issue_upstream_abc', false)).toBe(false);
  });
});
