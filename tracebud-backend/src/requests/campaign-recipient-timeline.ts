export type CampaignRecipientOnboardingStatus =
  | 'fulfilled'
  | 'accepted'
  | 'refused'
  | 'signed_up'
  | 'invite_sent'
  | 'on_platform';

export type CampaignRecipientTargetContact = {
  contact_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

export type CampaignRecipientInviteRow = {
  contact_id?: string | null;
  recipient_email: string | null;
  delivery_channel?: string | null;
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
  contact_id: string | null;
  recipient_email: string | null;
  recipient_label: string;
  delivery_channel: string | null;
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
  targetEmails?: readonly string[];
  targetContacts?: readonly CampaignRecipientTargetContact[];
  invites: readonly CampaignRecipientInviteRow[];
  decisions: readonly CampaignRecipientDecisionRow[];
}): {
  recipients: CampaignRecipientTimelineEntry[];
  status_counts: CampaignRecipientStatusCounts;
} {
  const inviteByContactId = new Map<string, CampaignRecipientInviteRow>();
  const inviteByEmail = new Map<string, CampaignRecipientInviteRow>();
  for (const invite of input.invites) {
    if (invite.contact_id) {
      inviteByContactId.set(invite.contact_id, invite);
    }
    if (invite.recipient_email) {
      inviteByEmail.set(normalizeEmail(invite.recipient_email), invite);
    }
  }

  const decisionByEmail = new Map<string, CampaignRecipientDecisionRow>();
  for (const decision of input.decisions) {
    decisionByEmail.set(normalizeEmail(decision.recipient_email), decision);
  }

  const status_counts: CampaignRecipientStatusCounts = { ...EMPTY_STATUS_COUNTS };
  const recipients: CampaignRecipientTimelineEntry[] = [];

  const pushRecipient = (params: {
    contact_id: string | null;
    recipient_email: string | null;
    recipient_label: string;
    delivery_channel: string | null;
    invite: CampaignRecipientInviteRow | null;
    decision: CampaignRecipientDecisionRow | null;
  }) => {
    const onboarding_status = deriveCampaignRecipientOnboardingStatus(params.invite, params.decision);
    status_counts[onboarding_status] += 1;
    const decidedAt = toIso(params.decision?.decided_at);
    const sentAt = toIso(params.invite?.sent_at ?? null);
    const updatedAt =
      decidedAt && sentAt
        ? new Date(decidedAt) > new Date(sentAt)
          ? decidedAt
          : sentAt
        : decidedAt ?? sentAt;

    recipients.push({
      contact_id: params.contact_id,
      recipient_email: params.recipient_email,
      recipient_label: params.recipient_label,
      delivery_channel: params.delivery_channel,
      onboarding_status,
      invite_status: params.invite?.status ?? null,
      decision: params.decision?.decision ?? null,
      decision_source: params.decision?.source ?? null,
      decided_at: decidedAt,
      updated_at: updatedAt,
    });
  };

  if (input.targetContacts && input.targetContacts.length > 0) {
    for (const contact of input.targetContacts) {
      const email = contact.email?.trim().toLowerCase() ?? null;
      const invite =
        inviteByContactId.get(contact.contact_id) ??
        (email ? inviteByEmail.get(email) ?? null : null);
      const decision = email ? decisionByEmail.get(email) ?? null : null;
      pushRecipient({
        contact_id: contact.contact_id,
        recipient_email: email,
        recipient_label: email ?? contact.phone?.trim() ?? contact.full_name,
        delivery_channel:
          invite?.delivery_channel ?? (email ? 'email' : contact.phone ? 'whatsapp' : null),
        invite,
        decision,
      });
    }
    return { recipients, status_counts };
  }

  const emails = new Set<string>();
  for (const email of input.targetEmails ?? []) {
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

  for (const recipientEmail of Array.from(emails).sort()) {
    const invite = inviteByEmail.get(recipientEmail) ?? null;
    const decision = decisionByEmail.get(recipientEmail) ?? null;
    pushRecipient({
      contact_id: invite?.contact_id ?? null,
      recipient_email: recipientEmail,
      recipient_label: recipientEmail,
      delivery_channel: invite?.delivery_channel ?? 'email',
      invite,
      decision,
    });
  }

  return { recipients, status_counts };
}
