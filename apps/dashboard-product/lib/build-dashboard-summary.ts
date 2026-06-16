import { countOwnedBlockingIssues, countUpstreamBlockers } from '@/lib/dashboard-issue-counts';
import type { ShipmentStatus } from '@/types';
import type { TimelineEvent } from '@/components/ui/timeline-row';

export type HarvestPackage = {
  id: string;
  code?: string;
  status?: ShipmentStatus;
  updated_at?: string;
  created_at?: string;
  compliance_status?: string;
  farmers?: Array<{ id: string }>;
  plots?: Array<{ id: string; verified?: boolean }>;
};

export type DashboardSummaryMetrics = {
  total_packages: number;
  packages_by_status: Record<ShipmentStatus, number>;
  total_plots: number;
  compliant_plots: number;
  total_farmers: number;
  incoming_requests_pending: number;
  outgoing_requests_pending: number;
  blocking_issues_count: number;
  yield_failures_count: number;
  upstream_blockers_count: number;
  owned_blocking_issues_count: number;
  recent_activity: TimelineEvent[];
  members_missing_consent?: number;
  requests_overdue?: number;
  portability_reviews_pending?: number;
  geometry_remediation_count?: number;
  organisation_count?: number;
  contact_count?: number;
};

type Campaign = { id: string; status?: string };
type InboxRequest = { id: string; status?: string };
type OperationalIssue = { id: string; severity?: string; status?: string; issue_kind?: string };

export function normalizeBackendArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const keyed = value as {
      data?: unknown;
      items?: unknown;
      campaigns?: unknown;
      packages?: unknown;
      requests?: unknown;
      contacts?: unknown;
    };
    if (Array.isArray(keyed.data)) return keyed.data as T[];
    if (Array.isArray(keyed.items)) return keyed.items as T[];
    if (Array.isArray(keyed.campaigns)) return keyed.campaigns as T[];
    if (Array.isArray(keyed.packages)) return keyed.packages as T[];
    if (Array.isArray(keyed.requests)) return keyed.requests as T[];
    if (Array.isArray(keyed.contacts)) return keyed.contacts as T[];
  }
  return [];
}

export function buildDashboardSummaryMetrics(input: {
  packages: HarvestPackage[];
  campaigns: Campaign[];
  inboxRequests: InboxRequest[];
  operationalIssues: OperationalIssue[];
  cooperativeMetrics?: Record<string, unknown>;
  organisationCount?: number;
  contactCount?: number;
}): DashboardSummaryMetrics {
  const packageCounts: Record<ShipmentStatus, number> = {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  };

  const producerIds = new Set<string>();
  const plotIds = new Set<string>();
  let compliantPlots = 0;
  let blockingIssues = 0;
  let yieldFailures = 0;

  for (const pkg of input.packages) {
    const status = (pkg.status ?? 'DRAFT') as ShipmentStatus;
    packageCounts[status] = (packageCounts[status] ?? 0) + 1;
    if (pkg.compliance_status === 'BLOCKED') blockingIssues += 1;
    if (pkg.compliance_status === 'WARNINGS') yieldFailures += 1;
    for (const farmer of pkg.farmers ?? []) {
      producerIds.add(farmer.id);
    }
    for (const plot of pkg.plots ?? []) {
      plotIds.add(plot.id);
      if (plot.verified) compliantPlots += 1;
    }
  }

  const recentActivity: TimelineEvent[] = input.packages
    .slice()
    .sort((left, right) => new Date(right.updated_at ?? 0).getTime() - new Date(left.updated_at ?? 0).getTime())
    .slice(0, 8)
    .map((pkg) => ({
      id: pkg.id,
      eventType: 'status_change' as const,
      timestamp: pkg.updated_at ?? pkg.created_at ?? new Date().toISOString(),
      userName: 'System',
      description: `Shipment ${pkg.code ?? pkg.id} moved to ${pkg.status ?? 'DRAFT'}`,
      metadata: {
        compliance: pkg.compliance_status ?? 'unknown',
      },
    }));

  return {
    total_packages: input.packages.length,
    packages_by_status: packageCounts,
    total_plots: plotIds.size,
    compliant_plots: compliantPlots,
    total_farmers: producerIds.size,
    incoming_requests_pending: input.inboxRequests.filter((item) => item.status === 'pending').length,
    outgoing_requests_pending: input.campaigns.filter((campaign) => {
      const status = campaign.status?.toUpperCase();
      return status === 'DRAFT' || status === 'QUEUED' || status === 'RUNNING';
    }).length,
    blocking_issues_count: blockingIssues,
    yield_failures_count: yieldFailures,
    upstream_blockers_count: countUpstreamBlockers(input.operationalIssues),
    owned_blocking_issues_count: countOwnedBlockingIssues(input.operationalIssues),
    recent_activity: recentActivity,
    ...(input.cooperativeMetrics ?? {}),
    ...(input.organisationCount !== undefined ? { organisation_count: input.organisationCount } : {}),
    ...(input.contactCount !== undefined ? { contact_count: input.contactCount } : {}),
  };
}
