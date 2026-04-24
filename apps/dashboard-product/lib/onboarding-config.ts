// ============================================================
// ONBOARDING CONFIGURATION
// Role-based step config + microcopy for all 3 personas
// ============================================================

import type { TenantRole } from '@/types';
import type { CommercialPermission } from '@/lib/rbac';

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
  /** Optional permission gate so steps render only when relevant */
  requiredPermission?: CommercialPermission;
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
    key: 'coop_add_contact',
    label: 'Add contacts',
    title: 'Register your first contacts',
    description: 'Add cooperative member contacts so requests and evidence follow-up are routed to the right people.',
    ctaLabel: 'Open contacts',
    ctaHref: '/contacts',
    targetSelector: '[data-onboarding="nav-contacts"]',
    requiresAction: false,
    icon: 'Users',
  },
  {
    key: 'coop_send_requests',
    label: 'Send requests',
    title: 'Send requests to your member network',
    description: 'Launch request campaigns to collect the latest plot and evidence updates from cooperative members.',
    ctaLabel: 'Open requests',
    ctaHref: '/outreach',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: false,
    icon: 'Send',
  },
  {
    key: 'coop_review_plots',
    label: 'Review plots',
    title: 'Review uploaded farm plots',
    description:
      'Farmers or field operators upload parcel boundaries via the offline app. Review data quality here, then Tracebud compliance performs final filing validation.',
    ctaLabel: 'Open plots',
    ctaHref: '/plots',
    targetSelector: '[data-onboarding="nav-plots"]',
    requiresAction: true,
    actionKey: 'first_plot_captured',
    icon: 'MapPin',
  },
  {
    key: 'coop_fpic',
    label: 'FPIC',
    title: 'Track FPIC consent evidence',
    description: 'Use FPIC to capture and review consent artifacts before forwarding evidence downstream.',
    ctaLabel: 'Open FPIC',
    ctaHref: '/fpic',
    targetSelector: '[data-onboarding="nav-fpic"]',
    requiresAction: false,
    icon: 'FileCheck',
    requiredPermission: 'fpic:view',
  },
  {
    key: 'coop_compliance',
    label: 'Compliance',
    title: 'Run cooperative readiness checks',
    description: 'Review data quality and missing evidence so member submissions are ready for buyer handoff.',
    ctaLabel: 'Open compliance',
    ctaHref: '/compliance',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
    requiredPermission: 'compliance:view',
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
    key: 'exp_producers',
    label: 'Add producers',
    title: 'Create your producer directory',
    description: 'Add producers early so traceability links, requests, and coverage checks stay grounded in real upstream entities.',
    ctaLabel: 'Open producers',
    ctaHref: '/farmers',
    targetSelector: '[data-onboarding="nav-farmers"]',
    requiresAction: true,
    actionKey: 'contacts_uploaded',
    icon: 'Users',
  },
  {
    key: 'exp_evidence',
    label: 'Evidence',
    title: 'Validate evidence coverage',
    description: 'Review evidence records to confirm producer, plot, and shipment artifacts are complete before sealing.',
    ctaLabel: 'Open evidence',
    ctaHref: '/fpic',
    targetSelector: '[data-onboarding="nav-fpic"]',
    requiresAction: false,
    icon: 'FileCheck',
    requiredPermission: 'fpic:view',
  },
  {
    key: 'exp_campaign',
    label: 'Create campaign',
    title: 'Send your first data-request campaign',
    description: 'Campaigns batch-request plot geometry, harvest records, or evidence from multiple suppliers at once.',
    ctaLabel: 'Open campaigns',
    ctaHref: '/outreach',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: true,
    actionKey: 'campaign_created',
    icon: 'Send',
  },
  {
    key: 'exp_lots_batches',
    label: 'Lots & batches',
    title: 'Build your first aggregation batch',
    description: 'Use lots and batches to aggregate upstream inputs, run yield plausibility checks, and lock lineage.',
    ctaLabel: 'Open lots & batches',
    ctaHref: '/harvests',
    targetSelector: '[data-onboarding="nav-harvests"]',
    requiresAction: false,
    icon: 'Leaf',
  },
  {
    key: 'exp_issues',
    label: 'Resolve issues',
    title: 'Review sealing blockers',
    description: 'Use the issues board to assign and resolve blockers that prevent shipment sealing and downstream handoff.',
    ctaLabel: 'Open issues',
    ctaHref: '/compliance/issues',
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
    key: 'imp_network',
    label: 'Network',
    title: 'Set up your importer network',
    description: 'Add counterpart contacts so campaigns and inbound requests route to the right teams.',
    ctaLabel: 'Open network',
    ctaHref: '/contacts',
    targetSelector: '[data-onboarding="nav-contacts"]',
    requiresAction: false,
    icon: 'Users',
  },
  {
    key: 'imp_campaigns',
    label: 'Campaigns',
    title: 'Launch your first campaign',
    description: 'Send outbound campaigns to collect missing upstream evidence and references.',
    ctaLabel: 'Open campaigns',
    ctaHref: '/outreach',
    targetSelector: '[data-onboarding="nav-outreach"]',
    requiresAction: false,
    icon: 'Send',
  },
  {
    key: 'imp_requests',
    label: 'Requests',
    title: 'Track inbound requests',
    description: 'Review and fulfill requests from downstream customers and partners.',
    ctaLabel: 'Open requests',
    ctaHref: '/inbox',
    targetSelector: '[data-onboarding="nav-inbox"]',
    requiresAction: false,
    icon: 'Inbox',
  },
  {
    key: 'imp_shipments',
    label: 'Shipments',
    title: 'Review shipment readiness',
    description: 'Check inbound shipment completeness and status before declaration submission.',
    ctaLabel: 'Open shipments',
    ctaHref: '/packages',
    targetSelector: '[data-onboarding="nav-packages"]',
    requiresAction: false,
    icon: 'Package',
  },
  {
    key: 'imp_compliance',
    label: 'Compliance',
    title: 'Run declaration readiness checks',
    description: 'Resolve blockers and warnings so shipments are ready for DDS submission.',
    ctaLabel: 'Open compliance',
    ctaHref: '/compliance',
    targetSelector: '[data-onboarding="nav-compliance"]',
    requiresAction: true,
    actionKey: 'compliance_check_run',
    icon: 'ShieldCheck',
  },
  {
    key: 'imp_evidence',
    label: 'Evidence',
    title: 'Validate supporting evidence',
    description: 'Review evidence records and provenance before making declaration decisions.',
    ctaLabel: 'Open evidence',
    ctaHref: '/fpic',
    targetSelector: '[data-onboarding="nav-fpic"]',
    requiresAction: false,
    icon: 'FileCheck',
    requiredPermission: 'fpic:view',
  },
  {
    key: 'imp_reporting',
    label: 'Reporting',
    title: 'Generate your first reporting snapshot',
    description: 'Create reporting snapshots for annual obligations and operational follow-up.',
    ctaLabel: 'Open reporting',
    ctaHref: '/reports',
    targetSelector: '[data-onboarding="nav-reports"]',
    requiresAction: true,
    actionKey: 'insight_generated',
    icon: 'FileText',
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
    tagline: 'Aggregate upstream inputs, validate lineage, and prepare shipment-ready traceability.',
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
