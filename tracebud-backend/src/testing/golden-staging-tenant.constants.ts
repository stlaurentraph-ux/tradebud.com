/** Canonical golden staging tenant fixtures (automation slice 2.7). */
export const GOLDEN_STAGING_TENANT = {
  recipientTenantId: 'tenant_rwanda_001',
  senderTenantId: 'tenant_brazil_001',
  bootstrapAction: 'seed_golden_path',
  smokeRole: 'compliance_manager',
  onboardingStepKey: 'create_first_campaign',
  demoExporterEmail: 'exporter+demo@tracebud.com',
  goldenInboxRequestIds: ['req_inbox_gp_001', 'req_inbox_gp_002'] as const,
  goldenCampaignIds: ['campaign_gp_001', 'campaign_gp_002'] as const,
} as const;
