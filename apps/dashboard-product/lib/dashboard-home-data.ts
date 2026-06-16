import type { TimelineEvent } from '@/components/ui/timeline-row';
import type { RequestCampaign } from '@/lib/use-requests';
import type { SponsorDashboardSummaryPayload } from '@/lib/build-sponsor-dashboard-summary';
import type { DDSPackage } from '@/types';

/** Prefetched home data from page.tsx — avoids duplicate client fetches. */
export interface DashboardHomeResources {
  packages: DDSPackage[];
  packagesLoading: boolean;
  packagesError: string | null;
  campaigns?: RequestCampaign[];
  campaignsLoading?: boolean;
  activityEvents: TimelineEvent[];
  activityLoaded: boolean;
  sponsorSummary?: SponsorDashboardSummaryPayload;
}

export function toHarvestPackageFromDds(pkg: DDSPackage) {
  return {
    id: pkg.id,
    code: pkg.code,
    status: pkg.status,
    updated_at: pkg.updated_at,
    created_at: pkg.created_at,
    compliance_status: pkg.compliance_status,
    farmers: pkg.farmers?.map((farmer) => ({ id: farmer.id })),
    plots: pkg.plots?.map((plot) => ({ id: plot.id, verified: plot.verified })),
  };
}

export function normalizeSummaryCampaigns(input: unknown): RequestCampaign[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? item.id ?? 'Campaign'),
      request_type: String(item.request_type ?? 'GENERAL_EVIDENCE'),
      status: String(item.status ?? 'DRAFT').toUpperCase() as RequestCampaign['status'],
      due_at: String(item.due_at ?? item.created_at ?? new Date().toISOString()),
      created_at: String(item.created_at ?? new Date().toISOString()),
      updated_at: String(item.updated_at ?? item.created_at ?? new Date().toISOString()),
      target_contact_emails: Array.isArray(item.target_contact_emails)
        ? item.target_contact_emails.map(String)
        : undefined,
      accepted_count: typeof item.accepted_count === 'number' ? item.accepted_count : undefined,
      pending_count: typeof item.pending_count === 'number' ? item.pending_count : undefined,
      expired_count: typeof item.expired_count === 'number' ? item.expired_count : undefined,
    }))
    .filter((campaign) => campaign.id.length > 0);
}
