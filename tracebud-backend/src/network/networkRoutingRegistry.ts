/**
 * Cross-surface network routing mirror — field app ↔ dashboard handoffs.
 * Guard: backend-network-routing-guard.mjs
 * Doc: product-os/04-quality/network-routing-registry.md
 */

export type NetworkRoutingFlowId =
  | 'field_delivery_to_buyer_tenant'
  | 'dashboard_consent_to_field_app'
  | 'dashboard_campaign_inbox_fanout';

export type NetworkRoutingFlow = {
  readonly id: NetworkRoutingFlowId;
  readonly description: string;
  readonly emailResolver: string;
  readonly preconditions: readonly string[];
  readonly backendModules: readonly string[];
  readonly fieldAppSurfaces: readonly string[];
  readonly dashboardSurfaces: readonly string[];
};

export const EMAIL_TENANT_RESOLUTION_MODULE = 'network/email-to-tenant-resolution.ts';

export const NETWORK_ROUTING_FLOWS: readonly NetworkRoutingFlow[] = [
  {
    id: 'field_delivery_to_buyer_tenant',
    description:
      'Farmer records harvest with buyer email or tenant; voucher routes to buyer dashboard when consent is active.',
    emailResolver: EMAIL_TENANT_RESOLUTION_MODULE,
    preconditions: [
      'contact email resolves to buyer tenant (or buyer tenant id from consent picker)',
      'directed delivery auto-creates or activates consent_grants (SHIPMENT_PREPARATION)',
      'revoked/denied grants block new directed delivery',
    ],
    backendModules: [
      'consent/delivery-consent-grant.ts',
      'harvest/delivery-buyer-invite.ts',
      'harvest/claim-delivery-buyer-invites-on-signup.ts',
      'harvest/voucher-delivery-routing.ts',
      'harvest/harvest.service.ts',
      'launch/launch.service.ts',
      'launch/onboarding-email.templates.ts',
      'common/resend-mail.ts',
      'common/tenant-farmer-scope.ts',
    ],
    fieldAppSurfaces: [
      'apps/offline-product/features/harvest/DeliveryRecipientFields.tsx',
      'apps/offline-product/features/harvest/submitHarvest.ts',
      'apps/offline-product/features/harvest/completeHarvestSubmitFlow.ts',
      'apps/offline-product/features/harvest/deliveryBuyerInviteMessages.ts',
      'apps/offline-product/features/harvest/readHarvestSubmitBuyerInvite.ts',
      'apps/offline-product/features/harvest/MultiPlotDeliveryWizard.tsx',
      'apps/offline-product/features/harvest/multiPlotDeliverySession.ts',
      'apps/offline-product/app/(tabs)/harvests.tsx',
    ],
    dashboardSurfaces: [
      'apps/dashboard-product/app/api/harvest/vouchers/route.ts',
    ],
  },
  {
    id: 'dashboard_consent_to_field_app',
    description:
      'Organisation requests data access; pending consent appears in field app Data sharing with optional push.',
    emailResolver: EMAIL_TENANT_RESOLUTION_MODULE,
    preconditions: [
      'farmer_profile linked to Supabase user',
      'consent_grants row status pending → active on approve',
    ],
    backendModules: ['consent/consent.service.ts', 'consent/consent.controller.ts'],
    fieldAppSurfaces: [
      'apps/offline-product/app/data-sharing.tsx',
      'apps/offline-product/features/compliance/consentActions.ts',
    ],
    dashboardSurfaces: ['apps/dashboard-product/app/farmers/[id]/page.tsx'],
  },
  {
    id: 'dashboard_campaign_inbox_fanout',
    description:
      'Campaign send resolves recipient emails to workspace tenants and inserts inbox_requests (dashboard-only).',
    emailResolver: EMAIL_TENANT_RESOLUTION_MODULE,
    preconditions: [
      'recipient email maps to tenant_signup_contacts or admin_users',
      'recipient tenant differs from sender tenant',
    ],
    backendModules: ['inbox/inbox.service.ts', 'requests/requests.service.ts'],
    fieldAppSurfaces: [],
    dashboardSurfaces: [
      'apps/dashboard-product/app/inbox/page.tsx',
      'apps/dashboard-product/app/outreach/page.tsx',
    ],
  },
] as const;

/** Modules that must import the shared email resolver (parity guard). */
export const NETWORK_ROUTING_EMAIL_RESOLVER_CONSUMERS = [
  'harvest/voucher-delivery-routing.ts',
  'inbox/inbox.service.ts',
] as const;

/** tenant-farmer-scope must union consent-grant farmers for buyer voucher visibility. */
export const TENANT_FARMER_SCOPE_CONSENT_MARKER = 'consent_grants';
