export type ComplianceIssueOwnerRole = 'cooperative' | 'exporter' | 'importer' | 'farmer' | 'system';

export type OperationalIssueKind = 'canonical' | 'campaign' | 'request' | 'upstream_blocker';

export function inferOwnerRoleForLinkedEntity(linkedEntityType: string): ComplianceIssueOwnerRole {
  const normalized = linkedEntityType.trim().toLowerCase();
  if (normalized === 'plot' || normalized === 'farmer') {
    return 'cooperative';
  }
  if (normalized === 'tenure_verification') {
    return 'exporter';
  }
  if (normalized === 'package' || normalized === 'batch') {
    return 'exporter';
  }
  return 'exporter';
}

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
      return 'Inbox request';
    default:
      return 'Issue';
  }
}
