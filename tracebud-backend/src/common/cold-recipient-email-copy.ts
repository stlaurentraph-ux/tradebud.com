/** Audience classification for cold transactional outreach (campaign + delivery). */

export type CampaignRecipientAudience =
  | 'farmer'
  | 'cooperative'
  | 'exporter'
  | 'trader'
  | 'processing_facility'
  | 'importer'
  | 'other';

export type CampaignSenderRole =
  | 'importer'
  | 'exporter'
  | 'cooperative'
  | 'sponsor'
  | 'compliance_manager'
  | 'admin'
  | 'other';

const OPERATIONAL_SUPPLY_CHAIN_SENDER_ROLES = ['importer', 'exporter', 'cooperative'] as const;

const CONTACT_TYPE_ALIASES: Record<string, CampaignRecipientAudience> = {
  farmer: 'farmer',
  producer: 'farmer',
  cooperative: 'cooperative',
  coop: 'cooperative',
  exporter: 'exporter',
  trader: 'trader',
  broker: 'trader',
  processing_facility: 'processing_facility',
  washing_station: 'processing_facility',
  importer: 'importer',
  buyer: 'importer',
  sponsor: 'importer',
};

export function normalizeCampaignRecipientAudience(
  raw: string | null | undefined,
): CampaignRecipientAudience {
  const key = (raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!key) return 'other';
  if (key in CONTACT_TYPE_ALIASES) {
    return CONTACT_TYPE_ALIASES[key];
  }
  return 'other';
}

export function normalizeCampaignSenderRole(raw: string | null | undefined): CampaignSenderRole {
  const key = (raw ?? '').trim().toLowerCase();
  if (key === 'importer' || key === 'exporter' || key === 'cooperative' || key === 'sponsor') {
    return key;
  }
  if (key === 'compliance_manager') return 'compliance_manager';
  if (key === 'admin') return 'admin';
  return 'other';
}

function normalizeRoleToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function hasOperationalSupplyChainRole(roles: readonly string[]): boolean {
  const normalized = roles.map(normalizeRoleToken).filter(Boolean);
  return OPERATIONAL_SUPPLY_CHAIN_SENDER_ROLES.some((role) => normalized.includes(role));
}

/** Resolve sender voice from tenant profile + admin role signals (no DB). */
export function resolveCampaignSenderRoleFromSignals(input: {
  supplyChainRoles?: readonly string[] | null;
  primaryRole?: string | null;
  adminRoles?: readonly string[] | null;
}): CampaignSenderRole {
  const supplyRoles = (input.supplyChainRoles ?? []).map(normalizeRoleToken).filter(Boolean);
  if (supplyRoles.includes('sponsor')) return 'sponsor';
  if (supplyRoles.includes('importer')) return 'importer';
  if (supplyRoles.includes('exporter')) return 'exporter';
  if (supplyRoles.includes('cooperative')) return 'cooperative';

  const adminRoles = (input.adminRoles ?? []).map(normalizeRoleToken).filter(Boolean);
  if (adminRoles.includes('sponsor')) return 'sponsor';

  const primaryRole = normalizeRoleToken(input.primaryRole ?? '');
  if (primaryRole === 'compliance_manager' && !hasOperationalSupplyChainRole(supplyRoles)) {
    return 'sponsor';
  }
  if (primaryRole === 'compliance_manager') return 'compliance_manager';
  if (primaryRole === 'admin') return 'admin';
  if (adminRoles.includes('compliance_manager')) return 'compliance_manager';
  if (adminRoles.includes('admin')) return 'admin';
  if (adminRoles.includes('importer')) return 'importer';
  if (adminRoles.includes('exporter')) return 'exporter';
  if (adminRoles.includes('cooperative')) return 'cooperative';

  return 'other';
}

export function recipientAudienceLabel(audience: CampaignRecipientAudience): string {
  switch (audience) {
    case 'farmer':
      return 'farmer';
    case 'cooperative':
      return 'cooperative';
    case 'exporter':
      return 'exporter';
    case 'trader':
      return 'trader';
    case 'processing_facility':
      return 'processing facility';
    case 'importer':
      return 'importer';
    default:
      return 'supply chain partner';
  }
}

export function senderRoleLabel(role: CampaignSenderRole): string {
  switch (role) {
    case 'importer':
      return 'importer';
    case 'exporter':
      return 'exporter';
    case 'cooperative':
      return 'cooperative';
    case 'sponsor':
      return 'network sponsor';
    case 'compliance_manager':
      return 'compliance team';
    case 'admin':
      return 'organization';
    default:
      return 'organization';
  }
}

export function tracebudExplainerSentence(): string {
  return 'Tracebud is a platform farmers, cooperatives, exporters, and buyers use to capture origin data once, share it with consent, and meet EU deforestation rules (EUDR).';
}

export function campaignSenderContextLine(senderOrg: string, senderRole: CampaignSenderRole): string {
  const org = senderOrg.trim() || 'An organization';
  switch (senderRole) {
    case 'importer':
      return `${org} is collecting supply-chain evidence from partners to meet EU due-diligence requirements.`;
    case 'exporter':
      return `${org} is requesting evidence from suppliers to prepare export compliance records.`;
    case 'cooperative':
      return `${org} is coordinating compliance data collection across member producers.`;
    case 'sponsor':
      return `${org} is running a Tracebud compliance programme and has included you in this governed network request.`;
    default:
      return `${org} is requesting supply-chain evidence through Tracebud.`;
  }
}

export function campaignConnectLabel(audience: CampaignRecipientAudience): string {
  if (audience === 'farmer') {
    return 'Open Tracebud field app';
  }
  return 'View request on Tracebud';
}

export function buildCampaignWhyRespondBullets(audience: CampaignRecipientAudience): string[] {
  switch (audience) {
    case 'farmer':
      return [
        'Respond with plot and evidence data from your phone — even offline',
        'Control what you share and reuse records for future buyers',
        'Help your cooperative or buyer stay aligned on EU compliance',
      ];
    case 'cooperative':
      return [
        'Collect and review member evidence in one workspace',
        'Forward structured requests to farmers without manual chasing',
        'Keep due-diligence records reusable across buyers and shipments',
      ];
    case 'exporter':
      return [
        'See the full request and due date in one dashboard',
        'Request missing evidence from cooperatives and farmers in Tracebud',
        'Build reusable EUDR-ready records for your buyers',
      ];
    case 'importer':
      return [
        'Review supplier responses in a structured compliance workspace',
        'Track request status and due dates across your network',
        'Maintain auditable evidence for EU deforestation due diligence',
      ];
    case 'trader':
    case 'processing_facility':
      return [
        'Confirm what evidence is needed and when it is due',
        'Share structured origin data with upstream and downstream partners',
        'Avoid duplicate paperwork across buyers and shipments',
      ];
    default:
      return [
        'See the request details and due date in one place',
        'Upload or coordinate required evidence without email chains',
        'Reuse compliance records across future requests',
      ];
  }
}

export function buildBulletsHtml(bullets: readonly string[]): string {
  return bullets
    .map(
      (line) =>
        `<tr><td style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#374151;">&#8226;&nbsp; ${line}</td></tr>`,
    )
    .join('');
}

export function buildBulletsText(bullets: readonly string[]): string {
  return bullets.map((line) => `  • ${line}`).join('\n');
}

export function buildCampaignSmsBody(input: {
  senderOrg: string;
  campaignTitle: string;
  claimUrl: string;
  audience: CampaignRecipientAudience;
  senderRole?: CampaignSenderRole;
}): string {
  const org = input.senderOrg.trim() || 'A partner';
  const title = input.campaignTitle.trim() || 'compliance request';
  const roleHint =
    input.audience === 'farmer'
      ? 'Open Tracebud on your phone to respond.'
      : 'Create your Tracebud workspace to respond.';
  const requestLead =
    input.senderRole === 'sponsor'
      ? `${org} invited you to a Tracebud compliance programme ("${title}")`
      : `${org} sent you a compliance request ("${title}") on Tracebud`;
  return `${requestLead} — ${roleHint} ${input.claimUrl}`;
}
