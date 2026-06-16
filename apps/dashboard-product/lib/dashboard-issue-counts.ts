export type SummaryIssueRow = {
  severity?: string;
  status?: string;
  issue_kind?: string;
};

const ACTIVE_STATUSES = new Set(['open', 'in_progress']);

export function countUpstreamBlockers(issues: SummaryIssueRow[]): number {
  return issues.filter(
    (issue) => issue.issue_kind === 'upstream_blocker' && ACTIVE_STATUSES.has(issue.status ?? ''),
  ).length;
}

export function countOwnedBlockingIssues(issues: SummaryIssueRow[]): number {
  return issues.filter(
    (issue) =>
      issue.issue_kind === 'canonical' &&
      issue.severity === 'BLOCKING' &&
      ACTIVE_STATUSES.has(issue.status ?? ''),
  ).length;
}
