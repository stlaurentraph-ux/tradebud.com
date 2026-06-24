export type CampaignRecipientOnboardingStatus =
  | 'fulfilled'
  | 'accepted'
  | 'refused'
  | 'signed_up'
  | 'invite_sent'
  | 'on_platform';

export type CampaignFulfillmentSource =
  | 'farmer_app_email'
  | 'farmer_app_phone'
  | 'cooperative_on_behalf';

export type CampaignRecipientTimelineEntry = {
  contact_id?: string | null;
  recipient_email: string | null;
  recipient_label?: string;
  delivery_channel?: string | null;
  onboarding_status: CampaignRecipientOnboardingStatus;
  invite_status: string | null;
  decision: 'accept' | 'refuse' | null;
  decision_source: string | null;
  fulfillment_source: CampaignFulfillmentSource | null;
  decided_at: string | null;
  updated_at: string | null;
};

export type CampaignRecipientStatusCounts = Record<CampaignRecipientOnboardingStatus, number>;

export type CampaignRecipientProgressStepId = 'invited' | 'joined' | 'responded' | 'fulfilled';

export type CampaignRecipientProgressStepState =
  | 'complete'
  | 'current'
  | 'upcoming'
  | 'refused'
  | 'skipped';

export type CampaignRecipientProgressStep = {
  id: CampaignRecipientProgressStepId;
  state: CampaignRecipientProgressStepState;
};

export type CampaignRecipientFilter =
  | 'all'
  | 'invite_sent'
  | 'signed_up'
  | 'awaiting_response'
  | 'fulfilled'
  | 'refused';

export type CampaignFunnelMetrics = {
  total: number;
  invited: number;
  joined: number;
  responded: number;
  fulfilled: number;
  progressPercent: number;
};

const PROGRESS_STEP_ORDER: CampaignRecipientProgressStepId[] = [
  'invited',
  'joined',
  'responded',
  'fulfilled',
];

export function getCampaignRecipientDisplayLabel(
  recipient: Pick<CampaignRecipientTimelineEntry, 'recipient_label' | 'recipient_email'>,
): string {
  return recipient.recipient_label?.trim() || recipient.recipient_email?.trim() || 'Unknown recipient';
}

export function getCampaignRecipientChannelIcon(
  channel: string | null | undefined,
): string | null {
  if (channel === 'email') {
    return '📧';
  }
  if (channel === 'whatsapp') {
    return '📱';
  }
  return null;
}

export function getRecipientProgressSteps(
  status: CampaignRecipientOnboardingStatus,
): CampaignRecipientProgressStep[] {
  const states: CampaignRecipientProgressStepState[] = [
    'upcoming',
    'upcoming',
    'upcoming',
    'upcoming',
  ];

  switch (status) {
    case 'invite_sent':
      states[0] = 'complete';
      states[1] = 'current';
      break;
    case 'on_platform':
      states[0] = 'skipped';
      states[1] = 'complete';
      states[2] = 'current';
      break;
    case 'signed_up':
      states[0] = 'complete';
      states[1] = 'complete';
      states[2] = 'current';
      break;
    case 'accepted':
      states[0] = 'complete';
      states[1] = 'complete';
      states[2] = 'complete';
      states[3] = 'current';
      break;
    case 'fulfilled':
      states.fill('complete');
      break;
    case 'refused':
      states[0] = 'complete';
      states[1] = 'complete';
      states[2] = 'refused';
      break;
    default:
      break;
  }

  return PROGRESS_STEP_ORDER.map((id, index) => ({
    id,
    state: states[index] ?? 'upcoming',
  }));
}

export function computeCampaignFunnelMetrics(
  counts: CampaignRecipientStatusCounts | undefined,
  totalRecipients: number,
): CampaignFunnelMetrics {
  const total = Math.max(totalRecipients, 0);
  if (!counts || total === 0) {
    return {
      total: 0,
      invited: 0,
      joined: 0,
      responded: 0,
      fulfilled: 0,
      progressPercent: 0,
    };
  }

  const joined =
    counts.on_platform +
    counts.signed_up +
    counts.accepted +
    counts.fulfilled +
    counts.refused;
  const responded = counts.accepted + counts.fulfilled + counts.refused;
  const fulfilled = counts.fulfilled;
  const invited = total;

  return {
    total,
    invited,
    joined,
    responded,
    fulfilled,
    progressPercent: total > 0 ? Math.round((fulfilled / total) * 100) : 0,
  };
}

export function filterCampaignRecipients(
  recipients: readonly CampaignRecipientTimelineEntry[],
  filter: CampaignRecipientFilter,
): CampaignRecipientTimelineEntry[] {
  if (filter === 'all') {
    return [...recipients];
  }

  return recipients.filter((recipient) => {
    switch (filter) {
      case 'invite_sent':
        return recipient.onboarding_status === 'invite_sent';
      case 'signed_up':
        return recipient.onboarding_status === 'signed_up';
      case 'awaiting_response':
        return (
          recipient.onboarding_status === 'invite_sent' ||
          recipient.onboarding_status === 'on_platform' ||
          recipient.onboarding_status === 'signed_up'
        );
      case 'fulfilled':
        return recipient.onboarding_status === 'fulfilled';
      case 'refused':
        return recipient.onboarding_status === 'refused';
      default:
        return true;
    }
  });
}

export function countCampaignRecipientsForFilter(
  recipients: readonly CampaignRecipientTimelineEntry[],
  filter: CampaignRecipientFilter,
): number {
  return filterCampaignRecipients(recipients, filter).length;
}

export function formatCampaignRecipientOnboardingStatus(status: CampaignRecipientOnboardingStatus): string {
  switch (status) {
    case 'fulfilled':
      return 'Evidence attached';
    case 'accepted':
      return 'Accepted';
    case 'refused':
      return 'Refused';
    case 'signed_up':
      return 'Joined Tracebud';
    case 'invite_sent':
      return 'Invite sent';
    case 'on_platform':
      return 'Existing partner';
    default:
      return status;
  }
}

export function campaignRecipientOnboardingBadgeClass(status: CampaignRecipientOnboardingStatus): string {
  switch (status) {
    case 'fulfilled':
      return 'bg-emerald-600/15 text-emerald-800';
    case 'accepted':
      return 'bg-emerald-500/15 text-emerald-700';
    case 'refused':
      return 'bg-red-500/15 text-red-700';
    case 'signed_up':
      return 'bg-sky-500/15 text-sky-700';
    case 'invite_sent':
      return 'bg-amber-500/15 text-amber-800';
    case 'on_platform':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function campaignFulfillmentSourceBadgeClass(
  source: CampaignFulfillmentSource | null | undefined,
): string {
  switch (source) {
    case 'farmer_app_email':
    case 'farmer_app_phone':
      return 'bg-emerald-600/15 text-emerald-800';
    case 'cooperative_on_behalf':
      return 'bg-amber-500/15 text-amber-900';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function formatCampaignFulfillmentSource(source: CampaignFulfillmentSource): string {
  switch (source) {
    case 'farmer_app_email':
      return 'Responded in Tracebud (email)';
    case 'farmer_app_phone':
      return 'Responded in Tracebud (phone)';
    case 'cooperative_on_behalf':
      return 'Submitted on behalf of farmer';
    default:
      return source;
  }
}

export function summarizeCampaignRecipientStatusCounts(
  counts: CampaignRecipientStatusCounts | undefined,
): string {
  if (!counts) {
    return '';
  }

  const parts: string[] = [];
  if (counts.fulfilled > 0) parts.push(`${counts.fulfilled} fulfilled`);
  if (counts.accepted > 0) parts.push(`${counts.accepted} accepted`);
  if (counts.signed_up > 0) parts.push(`${counts.signed_up} joined`);
  if (counts.invite_sent > 0) parts.push(`${counts.invite_sent} invite sent`);
  if (counts.on_platform > 0) parts.push(`${counts.on_platform} existing partners`);
  if (counts.refused > 0) parts.push(`${counts.refused} refused`);
  return parts.join(' · ');
}

export const CAMPAIGN_RECIPIENT_FILTERS: CampaignRecipientFilter[] = [
  'all',
  'awaiting_response',
  'invite_sent',
  'signed_up',
  'fulfilled',
  'refused',
];
