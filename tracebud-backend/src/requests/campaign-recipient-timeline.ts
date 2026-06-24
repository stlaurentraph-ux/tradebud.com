export type CampaignRecipientOnboardingStatus =
  | 'fulfilled'
  | 'accepted'
  | 'refused'
  | 'signed_up'
  | 'invite_sent'
  | 'on_platform';

export type CampaignRecipientInviteRow = {
  recipient_email: string;
  status: string;
  claimed_tenant_id: string | null;
  claimed_farmer_profile_id?: string | null;
  sent_at: string | Date | null;
};

export type CampaignRecipientDecisionRow = {
  recipient_email: string;
  decision: 'accept' | 'refuse';
  source: string;
  decided_at: string | Date;
};

export type CampaignRecipientTimelineEntry = {
  recipient_email: string;
  onboarding_status: CampaignRecipientOnboardingStatus;
  invite_status: string | null;
  decision: 'accept' | 'refuse' | null;
  decision_source: string | null;
  decided_at: string | null;
  updated_at: string | null;
};

export type CampaignRecipientStatusCounts = Record<CampaignRecipientOnboardingStatus, number>;

const EMPTY_STATUS_COUNTS: CampaignRecipientStatusCounts = {
  fulfilled: 0,
  accepted: 0,
  refused: 0,
  signed_up: 0,
  invite_sent: 0,
  on_platform: 0,
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

export function deriveCampaignRecipientOnboardingStatus(
  invite: CampaignRecipientInviteRow | null | undefined,
  decision: CampaignRecipientDecisionRow | null | undefined,
): CampaignRecipientOnboardingStatus {
  if (decision?.decision === 'refuse') {
    return 'refused';
  }

  if (decision?.decision === 'accept') {
    if (decision.source.trim().toLowerCase() === 'inbox_fulfillment') {
      return 'fulfilled';
    }
    return 'accepted';
  }

  if (
    invite?.status === 'claimed' ||
    invite?.claimed_tenant_id ||
    invite?.claimed_farmer_profile_id
  ) {
    return 'signed_up';
  }

  if (invite && (invite.status === 'sent' || invite.status === 'pending')) {
    return 'invite_sent';
  }

  if (!invite) {
    return 'on_platform';
  }

  return 'invite_sent';
}

export function buildCampaignRecipientTimeline(input: {
  targetEmails: readonly string[];
  invites: readonly CampaignRecipientInviteRow[];
  decisions: readonly CampaignRecipientDecisionRow[];
}): {
  recipients: CampaignRecipientTimelineEntry[];
  status_counts: CampaignRecipientStatusCounts;
} {
  const inviteByEmail = new Map<string, CampaignRecipientInviteRow>();
  for (const invite of input.invites) {
    inviteByEmail.set(normalizeEmail(invite.recipient_email), invite);
  }

  const decisionByEmail = new Map<string, CampaignRecipientDecisionRow>();
  for (const decision of input.decisions) {
    decisionByEmail.set(normalizeEmail(decision.recipient_email), decision);
  }

  const emails = new Set<string>();
  for (const email of input.targetEmails) {
    const normalized = normalizeEmail(email);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      emails.add(normalized);
    }
  }
  for (const email of inviteByEmail.keys()) {
    emails.add(email);
  }
  for (const email of decisionByEmail.keys()) {
    emails.add(email);
  }

  const status_counts: CampaignRecipientStatusCounts = { ...EMPTY_STATUS_COUNTS };
  const recipients: CampaignRecipientTimelineEntry[] = [];

  for (const recipientEmail of Array.from(emails).sort()) {
    const invite = inviteByEmail.get(recipientEmail) ?? null;
    const decision = decisionByEmail.get(recipientEmail) ?? null;
    const onboarding_status = deriveCampaignRecipientOnboardingStatus(invite, decision);
    status_counts[onboarding_status] += 1;

    const decidedAt = toIso(decision?.decided_at);
    const sentAt = toIso(invite?.sent_at ?? null);
    const updatedAt =
      decidedAt && sentAt
        ? new Date(decidedAt) > new Date(sentAt)
          ? decidedAt
          : sentAt
        : decidedAt ?? sentAt;

    recipients.push({
      recipient_email: recipientEmail,
      onboarding_status,
      invite_status: invite?.status ?? null,
      decision: decision?.decision ?? null,
      decision_source: decision?.source ?? null,
      decided_at: decidedAt,
      updated_at: updatedAt,
    });
  }

  return { recipients, status_counts };
}
