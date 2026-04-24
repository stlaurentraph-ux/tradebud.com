// ============================================================
// ONBOARDING CONFIGURATION
// Role-based step config + microcopy for all 3 personas
// ============================================================

import type { TenantRole } from '@/types';

// Maps to the 3 onboarding personas from the goal spec
export type OnboardingPersona = 'cooperative' | 'exporter' | 'importer';

export interface OnboardingStep {
  /** Unique key used for persistence / analytics */
  key: string;
  /** Short label shown in progress bar */
  label: string;
  /** Tooltip headline (max ~40 chars) */
  title: string;
  /** Tooltip body copy (max 2 lines) */
  description: string;
  /** CTA button label */
  ctaLabel: string;
  /** Route the CTA navigates to */
  ctaHref: string;
  /**
   * CSS selector or data-attribute used to spotlight the target element.
   * null = no spotlight (e.g. modal-only step)
   */
  targetSelector: string | null;
  /** Whether this step requires a real user action to be marked complete */
  requiresAction: boolean;
  /** Action key that marks this step complete (matches OnboardingActionKey) */
  actionKey?: string;
  /** Inline icon name from lucide-react */
  icon: string;
}

export interface OnboardingConfig {
  persona: OnboardingPersona;
  displayName: string;
  tagline: string;
  steps: OnboardingStep[];
}

// ─────────────────────────────────────────────────────────────
// PRODUCER / COOPERATIVE
// ─────────────────────────────────────────────────────────────
const COOPERATIVE_STEPS: OnboardingStep[] = [
  {
    key: 'coop_welcome',
    label: 'Welcome',
    title: 'Your cooperative workspace is ready',
    description: 'Tracebud helps you coordinate members, capture plots, and respond to requests from exporters.',
    ctaLabel: 'Get started',
    ctaHref: '/',
    targetSelector: null,
    requiresAction: false,
    icon: 'Sparkles',
  },
  {
    key: 'coop_overview',
    label: 'Overview',
    title: 'This is your dashboard overview',
    description: 'See key metrics, pending actions, and quick links to manage your farmers and plots.',
    ctaLabel: 'View overview',
    ctaHref: '/',
    targetSelector: '[data-onboarding="nav-overview"]',
    requiresAction: false,
    icon: 'LayoutDashboard',
  },
  {
    key: 'coop_add_farmer',
    label: 'Add a farmer',
    title: 'Register your first farmer',
    description: 'Add a member profile so their plots are linked to your cooperative for compliance tracing.',
    ctaLabel: 'Open farmers',
    ctaHref: '/farmers',
    targetSelector: '[data-onboarding="nav-farmers"]',
    requiresAction: false,
    icon: 'Users',
  },
  {
    key: 'coop_send_farmer_requests',
    label: 'Send requests',
    title: 'Request farmers to map their plots',
    description: 'Send requests to farmers asking them to map their parcels via the mobile app or provide legal documents.',
    ctaLabel: 'Open outgoing requests',
    ctaHref: '/requests?tab=outgoing-farmers',
    targetSelector: '[data-onboarding="nav-requests"]',
    requiresAction: false,
    icon: 'Send',
  },
  {
    key: 'coop_review_plots',
    label: 'Review plots',
    title: 'Review uploaded farm plots',
    description: 'Farmers or field operators will upload parcel boundaries via the offline app. Review and approve them here.',
    ctaLabel: 'Open plots',
    ctaHref: '/plots',
    targetSelector: '[data-onboarding="nav-plots"]',
    requiresAction: true,
    actionKey: 'first_plot_captured',
    icon: 'MapPin',
  },
  {
    key: 'coop_inbox',
    label: 'Check inbox',
    title: 'Review incoming requests from buyers',
    description: 'Exporters and importers will send data requests here. Accept or decline to keep your pipeline moving.',
    ctaLabel: 'Open inbox',
    ctaHref: '/inbox',
    targetSelector: '[data-onboarding="nav-inbox"]',
    requiresAction: false,
    icon: 'Inbox',
  },
  {
    key: 'coop_sync_submission',
    label: 'First harvest',
    title: 'Record your first harvest batch',
    description: 'Log a harvest record to start building the evidence chain that exporters need to file their DDS.',
    ctaLabel: 'Open harvests',
    ctaHref: '/harvests',
    targetSelector: '[data-onboarding="nav-harvests"]',
    requiresAction: true,
    actionKey: 'first_submission_synced',
    icon: 'Leaf',
  },
];

// ─────────────────────────────────────────────────────────────
// EXPORTER
// ─────────────────────────────────────────────────────────────
const EXPORTER_STEPS: OnboardingStep[] = [
  {
    key: 'exp_welcome',
    label: 'Welcome',
    title: 'Ready to manage your supply chain',
    description: 'Tracebud lets you collect supplier data, run compliance checks, and submit DDS packages to TRACES NT.',
    ctaLabel: 'Get started',
    ctaHref: '/',
    targetSelector: null,
    requiresAction: false,
    icon: 'Sparkles',
  },
  {
    key: 'exp_contacts',
    label: 'Add contacts',
    title: 'Upload your supplier contacts',
    description: 'Add producers and cooperatives so data requests route to the right people automatically.',
    ctaLabel: 'Open contacts',
    ctaHref: '/contacts',
    targetSelector: '[data-onboarding="nav-contacts"]',
    requiresAction: true,
    actionKey: 'contacts_uploaded',
    icon: 'Contact',
  },
  {
    key: 'exp_campaign',
    label: 'Create campaign',
    title: 'Send your first data-request campaign',
    description: 'Campaigns batch-request plot geometry, harvest records, or evidence from multiple suppliers at once.',
    ctaLabel: 'Open campaigns',
    ctaHref: '/requests',
    targetSelector: '[data-onboarding="nav-requests"]',
    requiresAction: true,
    actionKey: 'campaign_created',
    icon: 'Send',
  },
  {
    key: 'exp_package',
    label: 'Build package',
    title: 'Create your first DDS package',
    description: 'A package groups plots, evidence, and shipment data into a single submission unit for TRACES NT.',
    ctaLabel: 'Open packages',
    ctaHref: '/packages/new',
    targetSelector: '[data-onboarding="nav-packages"]',
    requiresAction: false,
    icon: 'Package',
  },
  {
    key: 'exp_compliance',
    label: 'Run checks',
    title: 'Run your first compliance check',
    description: 'Validate deforestation risk and evidence completeness before sealing the package for submission.',
    ctaLabel: 'Open compliance',
    ctaHref: '/compliance',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
  },
];

// ─────────────────────────────────────────────────────────────
// IMPORTER / BRAND
// ─────────────────────────────────────────────────────────────
const IMPORTER_STEPS: OnboardingStep[] = [
  {
    key: 'imp_welcome',
    label: 'Welcome',
    title: 'Manage your compliance obligations',
    description: 'As the DDS owner, you review inbound data, check completeness, and file statements to TRACES NT.',
    ctaLabel: 'Get started',
    ctaHref: '/',
    targetSelector: null,
    requiresAction: false,
    icon: 'Sparkles',
  },
  {
    key: 'imp_review_packages',
    label: 'Review packages',
    title: 'Check incoming DDS packages',
    description: 'Packages sent by exporters appear here. Review completeness before accepting or requesting changes.',
    ctaLabel: 'Open packages',
    ctaHref: '/packages',
    targetSelector: '[data-onboarding="nav-packages"]',
    requiresAction: false,
    icon: 'Package',
  },
  {
    key: 'imp_compliance_queue',
    label: 'Compliance queue',
    title: 'Resolve blocking compliance issues',
    description: 'Address flagged deforestation risks and missing evidence to unblock DDS readiness.',
    ctaLabel: 'Open compliance',
    ctaHref: '/compliance/queue',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'submission_reviewed',
    icon: 'AlertCircle',
  },
  {
    key: 'imp_dds',
    label: 'Prepare DDS',
    title: 'Start your first Due Diligence Statement',
    description: 'Create a DDS filing draft. Tracebud pre-fills fields from verified package and plot data.',
    ctaLabel: 'Open DDS',
    ctaHref: '/dds/new',
    targetSelector: '[data-onboarding="nav-dds"]',
    requiresAction: false,
    icon: 'FileText',
  },
  {
    key: 'imp_role_decision',
    label: 'Role check',
    title: 'Confirm your legal role classification',
    description: 'Run the role-decision check to confirm whether you file as Operator, Trader, or Downstream Operator.',
    ctaLabel: 'Run role check',
    ctaHref: '/role-decisions',
    targetSelector: '[data-onboarding="nav-role-decisions"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'Scale',
  },
];

// ─────────────────────────────────────────────────────────────
// CONFIG MAP
// ─────────────────────────────────────────────────────────────
export const ONBOARDING_CONFIGS: Record<OnboardingPersona, OnboardingConfig> = {
  cooperative: {
    persona: 'cooperative',
    displayName: 'Producer / Cooperative',
    tagline: 'Coordinate members, capture plots, and respond to supply-chain requests.',
    steps: COOPERATIVE_STEPS,
  },
  exporter: {
    persona: 'exporter',
    displayName: 'Exporter',
    tagline: 'Collect supplier data, run compliance checks, and submit DDS packages.',
    steps: EXPORTER_STEPS,
  },
  importer: {
    persona: 'importer',
    displayName: 'Importer / Brand',
    tagline: 'Own the DDS filing process, review data, and meet EUDR obligations.',
    steps: IMPORTER_STEPS,
  },
};

// Map TenantRole → OnboardingPersona
export function tenantRoleToPersona(role: TenantRole): OnboardingPersona {
  if (role === 'cooperative') return 'cooperative';
  if (role === 'importer' || role === 'country_reviewer') return 'importer';
  return 'exporter';
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS EVENT MAP
// ─────────────────────────────────────────────────────────────
export type OnboardingAnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed';

export interface OnboardingAnalyticsPayload {
  event: OnboardingAnalyticsEvent;
  persona: OnboardingPersona;
  stepKey?: string;
  stepIndex?: number;
  totalSteps?: number;
}

/** Fire analytics events (no-op stub — swap for real impl). */
export function trackOnboardingEvent(payload: OnboardingAnalyticsPayload): void {
  if (typeof window === 'undefined') return;
  // Replace with your analytics provider (PostHog, Segment, etc.)
  // eslint-disable-next-line no-console
  console.log('[onboarding]', payload.event, payload);
}
