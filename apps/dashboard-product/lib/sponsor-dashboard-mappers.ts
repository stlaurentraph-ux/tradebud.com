export type ProgrammeStatus = 'Draft' | 'Sent' | 'Completed' | 'Archived';

export type BackendOrganisation = {
  id?: string;
  name?: string;
  country?: string;
  onboardingCompleteness?: number;
  relationship?: string;
  fundingCoverage?: string;
};

export type BackendCampaign = {
  id?: string;
  title?: string;
  status?: string;
  target_organization_ids?: unknown[];
  target_farmer_ids?: unknown[];
  target_plot_ids?: unknown[];
  target_contact_emails?: unknown[];
  commodity?: string;
};

export function mapBackendStatus(status: string): ProgrammeStatus {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Archived';
    case 'QUEUED':
    case 'RUNNING':
    case 'PARTIAL':
    case 'EXPIRED':
    default:
      return 'Sent';
  }
}

export function deriveInterventionCounts(
  organisations: BackendOrganisation[],
  campaigns: BackendCampaign[]
): { pendingApprovals: number; uncoveredCoverage: number; belowReadiness: number } {
  const pendingApprovals = campaigns.filter(
    (item) => typeof item.status === 'string' && item.status.toUpperCase() === 'DRAFT'
  ).length;
  const uncoveredCoverage = organisations.filter(
    (org) => String(org.fundingCoverage ?? '').toLowerCase() === 'pass-through'
  ).length;
  const belowReadiness = organisations.filter((org) => Number(org.onboardingCompleteness ?? 0) < 80).length;

  return { pendingApprovals, uncoveredCoverage, belowReadiness };
}
