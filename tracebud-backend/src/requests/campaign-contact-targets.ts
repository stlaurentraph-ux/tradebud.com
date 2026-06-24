const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CampaignTargetInput = {
  contact_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  organization?: string | null;
  farmer_id?: string | null;
  plot_id?: string | null;
};

export type ResolvedCampaignTargetFields = {
  target_contact_ids: string[];
  target_contact_emails: string[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPersistedContactId(contactId: string): boolean {
  const trimmed = contactId.trim();
  if (!trimmed) {
    return false;
  }
  return !trimmed.startsWith('manual-') && !trimmed.startsWith('org-');
}

export function resolveCampaignTargetFields(
  targets: readonly CampaignTargetInput[],
): ResolvedCampaignTargetFields {
  const contactIds = new Set<string>();
  const emails = new Set<string>();

  for (const target of targets) {
    const contactId = target.contact_id?.trim();
    if (contactId && isPersistedContactId(contactId)) {
      contactIds.add(contactId);
    }

    const email = target.email ? normalizeEmail(target.email) : '';
    if (EMAIL_PATTERN.test(email)) {
      emails.add(email);
    }
  }

  return {
    target_contact_ids: Array.from(contactIds),
    target_contact_emails: Array.from(emails),
  };
}
