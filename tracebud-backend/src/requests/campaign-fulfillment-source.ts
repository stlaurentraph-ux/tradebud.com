import type {
  CampaignRecipientDecisionRow,
  CampaignRecipientInviteRow,
} from './campaign-recipient-timeline';

export type CampaignFulfillmentSource =
  | 'farmer_app_email'
  | 'farmer_app_phone'
  | 'cooperative_on_behalf';

export type CampaignFulfillmentDecisionSource =
  | 'inbox_fulfillment'
  | 'consent_grant_fulfillment';

const FULFILLMENT_DECISION_SOURCES = new Set<string>([
  'inbox_fulfillment',
  'consent_grant_fulfillment',
]);

export function isCampaignFulfillmentDecisionSource(source: string | null | undefined): boolean {
  return FULFILLMENT_DECISION_SOURCES.has(source?.trim().toLowerCase() ?? '');
}

export function deriveFarmerAppFulfillmentSource(
  invite: Pick<CampaignRecipientInviteRow, 'delivery_channel' | 'claimed_farmer_profile_id'> | null | undefined,
): CampaignFulfillmentSource {
  const channel = invite?.delivery_channel?.trim().toLowerCase();
  if (channel === 'whatsapp' || channel === 'sms') {
    return 'farmer_app_phone';
  }
  return 'farmer_app_email';
}

export function resolveCampaignFulfillmentSource(input: {
  invite: CampaignRecipientInviteRow | null | undefined;
  decision: CampaignRecipientDecisionRow | null | undefined;
}): CampaignFulfillmentSource | null {
  const decision = input.decision;
  if (decision?.decision !== 'accept') {
    return null;
  }

  const stored = decision.fulfillment_source?.trim() as CampaignFulfillmentSource | undefined;
  if (
    stored === 'farmer_app_email' ||
    stored === 'farmer_app_phone' ||
    stored === 'cooperative_on_behalf'
  ) {
    return stored;
  }

  if (!isCampaignFulfillmentDecisionSource(decision.source)) {
    return null;
  }

  if (input.invite?.claimed_farmer_profile_id) {
    return deriveFarmerAppFulfillmentSource(input.invite);
  }

  return 'cooperative_on_behalf';
}

export function shouldTreatCooperativeFulfillmentAsPending(input: {
  fulfillmentSource: CampaignFulfillmentSource | null;
  requireFarmerAppConfirmation: boolean;
}): boolean {
  return (
    input.requireFarmerAppConfirmation &&
    input.fulfillmentSource === 'cooperative_on_behalf'
  );
}

export function buildPhoneOnlyDecisionEmail(deliveryAddress: string): string {
  const normalized = deliveryAddress.trim().replace(/[^\d+]/g, '');
  const digits = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  return `phone:${digits}@campaign.local`;
}

export function resolveCampaignDecisionRecipientEmail(input: {
  recipientEmail?: string | null;
  deliveryAddress?: string | null;
}): string | null {
  const email = input.recipientEmail?.trim().toLowerCase();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email;
  }
  const phone = input.deliveryAddress?.trim();
  if (phone) {
    return buildPhoneOnlyDecisionEmail(phone);
  }
  return null;
}
