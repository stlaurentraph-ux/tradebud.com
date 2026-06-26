import {
  buildCampaignRecipientTimeline,
  type CampaignRecipientDecisionRow,
  type CampaignRecipientInviteRow,
  type CampaignRecipientStatusCounts,
  type CampaignRecipientTargetContact,
} from './campaign-recipient-timeline';

type CampaignFunnelStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'EXPIRED'
  | 'CANCELLED';

export function buildRecipientStatusCountsForCampaign(input: {
  campaign: { target_contact_emails: string[]; target_contact_ids: string[] };
  targetContacts: readonly CampaignRecipientTargetContact[];
  invites: readonly CampaignRecipientInviteRow[];
  decisions: readonly CampaignRecipientDecisionRow[];
}): CampaignRecipientStatusCounts {
  return buildCampaignRecipientTimeline({
    targetEmails:
      input.targetContacts.length > 0 ? undefined : input.campaign.target_contact_emails ?? [],
    targetContacts: input.targetContacts.length > 0 ? input.targetContacts : undefined,
    invites: input.invites,
    decisions: input.decisions,
  }).status_counts;
}

export function isCampaignEligibleForRecipientFunnel(status: CampaignFunnelStatus): boolean {
  return status !== 'DRAFT' && status !== 'QUEUED' && status !== 'CANCELLED';
}
