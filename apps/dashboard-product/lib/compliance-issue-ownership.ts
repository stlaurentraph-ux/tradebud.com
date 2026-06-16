export type ComplianceIssueOwnerRole = 'cooperative' | 'exporter' | 'importer' | 'farmer' | 'system';

export type ComplianceIssueKind = 'canonical' | 'campaign' | 'request' | 'upstream_blocker';

export function formatOwnerRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'cooperative':
      return 'Cooperative';
    case 'exporter':
      return 'Exporter';
    case 'importer':
      return 'Importer';
    case 'farmer':
      return 'Farmer / field';
    case 'system':
      return 'System';
    default:
      return 'Unassigned';
  }
}

export function formatIssueKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case 'canonical':
      return 'Owned by your org';
    case 'upstream_blocker':
      return 'Upstream blocker';
    case 'campaign':
      return 'Campaign follow-up';
    case 'request':
      return 'Inbox action';
    default:
      return 'Issue';
  }
}

export function issueKindBadgeClass(kind: string | null | undefined): string {
  switch (kind) {
    case 'upstream_blocker':
      return 'bg-violet-500/15 text-violet-800 border-violet-200';
    case 'canonical':
      return 'bg-emerald-500/15 text-emerald-800 border-emerald-200';
    case 'campaign':
      return 'bg-sky-500/15 text-sky-800 border-sky-200';
    case 'request':
      return 'bg-amber-500/15 text-amber-800 border-amber-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function canPersistIssueStatus(issueId: string, canUpdateStatus?: boolean): boolean {
  return Boolean(canUpdateStatus && issueId.startsWith('issue_compliance_'));
}

export function isUpstreamBlockerIssue(kind: string | null | undefined): boolean {
  return kind === 'upstream_blocker';
}
