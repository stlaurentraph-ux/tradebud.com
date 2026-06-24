import type { RequestCampaignStatus } from '@/lib/use-requests';

export function mapCampaignStatusToOutreachUi(status: RequestCampaignStatus): string {
  if (status === 'DRAFT') return 'Draft';
  if (status === 'QUEUED' || status === 'RUNNING') return 'Sent';
  if (status === 'COMPLETED' || status === 'PARTIAL') return 'Completed';
  return 'Archived';
}
