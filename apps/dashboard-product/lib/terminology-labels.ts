import { t as translate, type Locale } from '@/lib/i18n';
import type { User } from '@/types';

type SupplyChainRole = User['active_role'] | null | undefined;
type TranslateFn = (key: string) => string;

const EN_TERMINOLOGY_LABELS: Record<string, string> = {
  'terminology.dashboard.breadcrumb': 'Dashboard',
  'terminology.importer.incoming_shipments_hint': 'From verified exporters',
  'terminology.importer.traces_ready_hint': 'Ready for TRACES filing after your review',
  'terminology.importer.upstream_activity_hint':
    'Upstream activity will appear once exporters share sealed shipments and campaigns generate responses.',
  'terminology.importer.review_queue_description':
    'Incoming shipments needing verification or TRACES filing preparation',
  'terminology.importer.review_queue_empty_description':
    'Launch a campaign or wait for exporters to share sealed shipments.',
  'terminology.traces_filing_hint.importer':
    'Review sealed shipments from exporters, then submit the DDS to TRACES.',
  'terminology.traces_filing_hint.exporter':
    'Seal shipments and hand off to your importer — they submit the DDS to TRACES.',
  'terminology.traces_filing_hint.default':
    'Only importers submit the Due Diligence Statement to TRACES.',
  'terminology.mini_review.filing_action': 'Prepare TRACES filing',
  'dashboard.importer.campaign.description':
    'Launch campaigns to collect missing upstream evidence from exporters and supply-chain partners',
  'dashboard.importer.campaign.empty_description':
    'Start your first campaign to request missing plot geometry, evidence, and producer data from upstream partners.',
  'dashboard.importer.campaign.empty_cta': 'Launch first campaign',
  'dashboard.importer.kpi.incoming_shipments': 'Incoming Shipments',
  'dashboard.importer.kpi.pending_review': 'Pending Review',
  'dashboard.importer.kpi.pending_review_hint': 'Awaiting compliance verification',
  'dashboard.importer.kpi.eudr_compliant': 'EUDR Compliant',
  'dashboard.importer.kpi.traced_origins': 'Traced Origins',
  'dashboard.importer.kpi.traced_origins_hint': 'Verified plot locations',
  'dashboard.importer.compliance_status.title': 'Shipment Compliance Status',
  'dashboard.importer.compliance_status.description':
    'Overview of incoming shipments by verification status',
  'dashboard.importer.compliance_status.fully_compliant': 'Fully Compliant',
  'dashboard.importer.compliance_status.ready': 'Ready',
  'dashboard.importer.compliance_status.on_hold': 'On Hold',
  'dashboard.importer.compliance_status.draft': 'Draft',
  'dashboard.importer.traceability.title': 'Supply Chain Traceability',
  'dashboard.importer.traceability.description': 'Live metrics from your current tenant data',
  'dashboard.importer.traceability.origin_countries': 'Origin Countries',
  'dashboard.importer.traceability.origin_hint': 'Verified source locations',
  'dashboard.importer.traceability.origin_available': 'Origin data available',
  'dashboard.importer.traceability.origin_none': 'No origin data yet',
  'dashboard.importer.traceability.deforestation_free': 'Deforestation Free',
  'dashboard.importer.traceability.baseline_hint': 'Post Dec 31, 2020 baseline',
  'dashboard.importer.traceability.verified_pct': '{{pct}}% Verified',
  'dashboard.importer.quick_action.view_shipments': 'View All Shipments',
  'dashboard.importer.quick_action.view_shipments_hint': 'Browse incoming shipments shared with you',
  'dashboard.importer.quick_action.compliance_queue': 'Compliance queue',
  'dashboard.importer.quick_action.add_contact': 'Add network contact',
  'dashboard.importer.quick_action.add_contact_hint':
    'Register upstream partners for campaigns and requests',
  'dashboard.importer.quick_action.launch_campaign': 'Launch campaign',
  'dashboard.importer.quick_action.launch_campaign_hint': 'Request missing upstream evidence at scale',
  'dashboard.north_star.priority_label': 'Your priority',
  'dashboard.north_star.importer.awaiting_review': 'Awaiting your review',
  'dashboard.north_star.importer.ready_filing': 'Ready for EU filing',
  'dashboard.north_star.importer.open_queue': 'Open review queue',
  'dashboard.north_star.importer.review_hint':
    'Verify upstream evidence before you submit DDS to TRACES',
  'dashboard.north_star.importer.filing_hint':
    'You are the final compliance owner — submit DDS to TRACES when checks pass',
  'dashboard.north_star.importer.filing_cta': 'Prepare TRACES submission',
  'terminology.exporter.sealed_count': '{{count}} sealed and handoff-ready',
  'terminology.exporter.shipment_track_description':
    'Track shipments across readiness, seal, and importer handoff states',
  'terminology.exporter.submitted_queue_hint': 'Awaiting importer acceptance for EU filing',
  'terminology.exporter.handoff_hint': '{{count}} sealed — awaiting importer acceptance for EU filing',
  'dashboard.exporter.campaign.description':
    'Launch outbound requests to collect missing producer, plot, and evidence data',
  'dashboard.exporter.pipeline.title': 'Shipment Readiness Pipeline',
  'dashboard.exporter.pipeline.description': 'Track draft-to-seal progression and queue health',
  'dashboard.exporter.sla.label': 'SLA: {{days}}d',
  'dashboard.exporter.sla.active': '{{days}}d active',
  'dashboard.exporter.kpi.active_shipments': 'Active shipments',
  'dashboard.exporter.kpi.blocking_issues': 'Blocking issues',
  'dashboard.exporter.kpi.blocking_issues_hint': 'Preventing shipment seal',
  'dashboard.exporter.kpi.yield_failures': 'Yield failures',
  'dashboard.exporter.kpi.yield_failures_hint': 'Awaiting resolution or appeal',
  'dashboard.exporter.kpi.ready_to_seal': 'Ready to seal',
  'dashboard.exporter.kpi.ready_to_seal_hint': 'Shipment packages awaiting seal',
  'dashboard.exporter.status_pipeline.title': 'Shipment status pipeline',
  'dashboard.exporter.activity_empty':
    'Activity will appear here once your team starts onboarding and submission workflows.',
  'dashboard.exporter.quick.batches': 'Manage lots & batches',
  'dashboard.exporter.quick.batches_hint': 'Build lineage-safe inputs before shipment assembly',
  'dashboard.exporter.quick.shipments': 'Prepare shipments',
  'dashboard.exporter.quick.shipments_hint': 'Assemble lines and validate coverage readiness',
  'dashboard.exporter.quick.producer': 'Add suppliers',
  'dashboard.exporter.quick.producer_hint': 'Register upstream suppliers by activity — bulk import from CSV',
  'dashboard.north_star.exporter.ready_seal': 'Shipments ready to seal',
  'dashboard.north_star.exporter.handoff_ready': 'Handoff-ready shipments',
  'dashboard.north_star.exporter.seal_hint': 'Validate coverage and seal before sharing with your importer',
  'dashboard.north_star.exporter.seal_cta': 'Seal shipments',
  'dashboard.north_star.exporter.view_sealed_cta': 'View sealed shipments',
  'dashboard.cooperative.campaign.description':
    'Launch campaigns to collect missing plot geometry, evidence, and member data from your network',
  'dashboard.cooperative.campaign.empty_description':
    'Create your first campaign to request missing field data and evidence from cooperative members.',
  'dashboard.cooperative.campaign.empty_cta': 'Launch first campaign',
  'dashboard.cooperative.kpi.members': 'Members',
  'dashboard.cooperative.kpi.members_hint': 'Profiles managed by cooperative',
  'dashboard.cooperative.kpi.plot_coverage': 'Mapped Plot Coverage',
  'dashboard.cooperative.kpi.plot_coverage_hint': '{{compliant}}/{{total}} plots compliant',
  'dashboard.cooperative.kpi.blocked_batches': 'Blocked Batch Alerts',
  'dashboard.cooperative.kpi.blocked_batches_hint': 'Yield appeal and evidence follow-up',
  'dashboard.cooperative.kpi.premium_governance': 'Premium Governance',
  'dashboard.cooperative.kpi.premium_governance_hint': 'Portability reviews awaiting sign-off',
  'dashboard.cooperative.health.title': 'Readiness and Cooperative Health',
  'dashboard.cooperative.health.description':
    'Operational readiness signals blended with cooperative-strength indicators.',
  'dashboard.cooperative.health.consent_title': 'Members missing consent',
  'dashboard.cooperative.health.consent_hint': 'Prioritize portability-ready consent renewals',
  'dashboard.cooperative.health.geometry_title': 'Plots missing geometry',
  'dashboard.cooperative.health.geometry_hint': 'Point-only and invalid geometry records in queue',
  'dashboard.cooperative.health.overdue_title': 'Requests overdue',
  'dashboard.cooperative.health.overdue_hint': 'Inbound partner asks past SLA',
  'dashboard.cooperative.activity.title': 'Cooperative activity',
  'dashboard.cooperative.activity.description':
    'Member onboarding, batch intake, campaigns, and shipment events',
  'dashboard.cooperative.activity.empty':
    'Activity will appear once members are onboarded and field capture or batch workflows begin.',
  'dashboard.cooperative.panel.members_title': 'Members and Portability',
  'dashboard.cooperative.panel.members_description':
    'Manage producer identity, consent status, and transfer readiness.',
  'dashboard.cooperative.panel.field_title': 'Field Capture and Plots',
  'dashboard.cooperative.panel.field_description':
    'Close data gaps in plot geometry and field operations quality.',
  'dashboard.cooperative.panel.batches_title': 'Batches, Shipments, and Premiums',
  'dashboard.cooperative.panel.batches_description':
    'Monitor aggregation integrity and cooperative value-distribution flows.',
  'dashboard.cooperative.action.add_member': 'Add member',
  'dashboard.cooperative.action.member_directory': 'Open member directory',
  'dashboard.cooperative.action.portability_queue': 'Review portability queue',
  'dashboard.cooperative.action.consent_missing': 'Consent artifacts missing',
  'dashboard.cooperative.action.plot_registry': 'Plot registry and map review',
  'dashboard.cooperative.action.boundary_followup': 'Boundary capture follow-up',
  'dashboard.cooperative.action.field_remediation': 'Field remediation queues',
  'dashboard.cooperative.action.duplicate_flags': 'Duplicate and deforestation flags',
  'dashboard.cooperative.action.add_batch': 'Add batch input',
  'dashboard.cooperative.action.batch_integrity': 'Lots and batch integrity',
  'dashboard.cooperative.action.shipment_readiness': 'Shipment seal readiness',
  'dashboard.cooperative.action.premium_payout': 'Premium approvals and payout split',
  'dashboard.cooperative.badge.new': 'New',
  'dashboard.cooperative.badge.pending': '{{count}} pending',
  'dashboard.cooperative.badge.blocked': '{{count}} blocked',
  'dashboard.cooperative.badge.ready': '{{count}} ready',
  'dashboard.cooperative.badge.plots': '{{count}} plots',
  'dashboard.north_star.cooperative.member_actions': 'Member actions needed',
  'dashboard.north_star.cooperative.hint':
    '{{consentGaps}} consent gaps · {{pendingPlots}} plots pending verification',
  'dashboard.north_star.cooperative.open_requests': 'Open field requests',
  'dashboard.north_star.cooperative.open_members': 'Open members',
  'terminology.reviewer.jurisdiction_activity_hint':
    'Review activity will appear when exporters submit packages for your jurisdiction.',
  'dashboard.reviewer.triage.title': 'Issue triage',
  'dashboard.reviewer.triage.description':
    'Operational counts from your tenant issue board — not satellite classifications',
  'dashboard.reviewer.triage.blocking': 'Blocking issues',
  'dashboard.reviewer.triage.blocking_hint':
    'Shipments or plots that must be resolved before approval',
  'dashboard.reviewer.triage.yield_warnings': 'Yield warnings',
  'dashboard.reviewer.triage.yield_hint': 'Plausibility or coverage warnings needing review',
  'dashboard.reviewer.triage.pending_review': 'Packages awaiting review',
  'dashboard.reviewer.triage.pending_hint': 'Ready shipments in your jurisdiction queue',
  'dashboard.reviewer.quick.review_queue': 'Review Queue',
  'dashboard.reviewer.quick.review_queue_hint': 'Process pending verifications',
  'dashboard.reviewer.quick.plot_registry': 'Plot Registry',
  'dashboard.reviewer.quick.plot_registry_hint': 'View all registered plots',
  'dashboard.reviewer.quick.reports': 'Generate Reports',
  'dashboard.reviewer.quick.reports_hint': 'Export compliance data',
  'dashboard.north_star.reviewer.awaiting_review': 'Packages awaiting review',
  'dashboard.north_star.reviewer.flagged_hint': '{{count}} flagged items in your jurisdiction',
  'dashboard.north_star.reviewer.start_cta': 'Start reviewing',
  'dashboard.sponsor.campaign.title': 'Programmes',
  'dashboard.sponsor.campaign.description':
    'Launch sponsor-funded programmes to collect compliance evidence across countries and commodities',
  'dashboard.sponsor.campaign.create': 'New programme',
  'dashboard.sponsor.campaign.empty_title': 'No programmes yet',
  'dashboard.sponsor.campaign.empty_description':
    'Create your first programme to onboard supply chain partners and close transparency gaps.',
  'dashboard.sponsor.campaign.empty_cta': 'Launch first programme',
  'dashboard.sponsor.campaign.list_link': 'View all programmes',
  'dashboard.sponsor.stat.countries': 'Countries in scope',
  'dashboard.sponsor.stat.countries_hint': '{{count}} governed organisations',
  'dashboard.sponsor.stat.commodities': 'Commodities tracked',
  'dashboard.sponsor.stat.commodities_hint': '{{count}} programmes launched',
  'dashboard.sponsor.stat.commodities_loading': 'Loading programmes',
  'dashboard.sponsor.stat.roles': 'Supply chain roles',
  'dashboard.sponsor.stat.roles_hint': '{{count}} active contacts',
  'dashboard.sponsor.stat.transparency': 'Transparency index',
  'dashboard.sponsor.stat.transparency_hint': '{{count}} at-risk organisations',
  'dashboard.sponsor.emphasis.title': 'Sponsor emphasis',
  'dashboard.sponsor.emphasis.country':
    'Prioritising government and country programme oversight.',
  'dashboard.sponsor.emphasis.brand': 'Prioritising brand-led sustainable sourcing oversight.',
  'dashboard.sponsor.emphasis.switch_hint': 'Switch emphasis from the sidebar.',
  'dashboard.sponsor.network_health.title': 'Network health snapshot',
  'dashboard.sponsor.network_health.description':
    'Organisation readiness and escalation pressure across your governed network.',
  'dashboard.sponsor.network_health.view_all': 'View all',
  'dashboard.sponsor.network_health.empty':
    'No organisation data yet. Register organisations to populate network health.',
  'dashboard.sponsor.network_health.add_orgs': 'Add organisations',
  'dashboard.sponsor.governance_activity.title': 'Governance activity',
  'dashboard.sponsor.governance_activity.description':
    'Delegated admin, programme, and transparency events',
  'dashboard.sponsor.governance_activity.empty':
    'Activity will appear once organisations, contacts, and programmes generate events.',
  'dashboard.sponsor.programme.title': 'Programme performance',
  'dashboard.sponsor.programme.description':
    'Interventions and transparency outcomes across commodities',
  'dashboard.sponsor.programme.new_cta': 'New programme',
  'dashboard.sponsor.programme.adoption_hint':
    'Adoption and evidence collection across governed entities',
  'dashboard.sponsor.programme.empty':
    'No programmes yet. Launch one to start multi-commodity transparency collection.',
  'dashboard.sponsor.programme.empty_cta': 'Launch first programme',
  'dashboard.sponsor.intervention.title': 'Intervention queue',
  'dashboard.sponsor.intervention.description': 'Urgent sponsor-level actions',
  'dashboard.sponsor.intervention.policy':
    '{{count}} policy exceptions pending approval',
  'dashboard.sponsor.intervention.billing':
    '{{count}} organisations with uncovered billing dependencies',
  'dashboard.sponsor.intervention.readiness':
    '{{count}} organisations below readiness threshold',
  'dashboard.sponsor.quick.delegated_admin': 'Delegated admin',
  'dashboard.sponsor.quick.delegated_admin_hint': 'Review scoped interventions',
  'dashboard.sponsor.quick.reporting': 'Network reporting',
  'dashboard.sponsor.quick.reporting_hint': 'Country and commodity outcomes',
  'dashboard.sponsor.quick.billing': 'Billing & coverage',
  'dashboard.sponsor.quick.billing_hint': '{{count}} at-risk orgs with funding dependencies',
  'dashboard.north_star.sponsor.transparency_index': 'Network transparency index',
  'dashboard.north_star.sponsor.at_risk_hint': '{{count}} at-risk organisations in your network',
  'dashboard.north_star.sponsor.cta': 'Review compliance health',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}

function resolveLabel(key: string, t?: TranslateFn, locale: Locale = 'en'): string {
  if (t) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  const fromLocale = translate(key, locale);
  if (fromLocale !== key) return fromLocale;
  return EN_TERMINOLOGY_LABELS[key] ?? key;
}

export function getDashboardBreadcrumbLabel(t?: TranslateFn): string {
  return resolveLabel('terminology.dashboard.breadcrumb', t);
}

export function getImporterIncomingShipmentsHint(t?: TranslateFn): string {
  return resolveLabel('terminology.importer.incoming_shipments_hint', t);
}

export function getImporterTracesReadyHint(t?: TranslateFn): string {
  return resolveLabel('terminology.importer.traces_ready_hint', t);
}

export function getImporterUpstreamActivityHint(t?: TranslateFn): string {
  return resolveLabel('terminology.importer.upstream_activity_hint', t);
}

export function getImporterReviewQueueDescription(t?: TranslateFn): string {
  return resolveLabel('terminology.importer.review_queue_description', t);
}

export function getImporterReviewQueueEmptyDescription(t?: TranslateFn): string {
  return resolveLabel('terminology.importer.review_queue_empty_description', t);
}

export function getTracesFilingHint(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'importer') return resolveLabel('terminology.traces_filing_hint.importer', t);
  if (role === 'exporter') return resolveLabel('terminology.traces_filing_hint.exporter', t);
  return resolveLabel('terminology.traces_filing_hint.default', t);
}

export function getMiniReviewImporterFilingAction(t?: TranslateFn): string {
  return resolveLabel('terminology.mini_review.filing_action', t);
}

export function getImporterDashboardLabels(t?: TranslateFn) {
  return {
    campaignDescription: resolveLabel('dashboard.importer.campaign.description', t),
    campaignEmptyDescription: resolveLabel('dashboard.importer.campaign.empty_description', t),
    campaignEmptyCta: resolveLabel('dashboard.importer.campaign.empty_cta', t),
    kpiIncomingShipments: resolveLabel('dashboard.importer.kpi.incoming_shipments', t),
    kpiPendingReview: resolveLabel('dashboard.importer.kpi.pending_review', t),
    kpiPendingReviewHint: resolveLabel('dashboard.importer.kpi.pending_review_hint', t),
    kpiEudrCompliant: resolveLabel('dashboard.importer.kpi.eudr_compliant', t),
    kpiTracedOrigins: resolveLabel('dashboard.importer.kpi.traced_origins', t),
    kpiTracedOriginsHint: resolveLabel('dashboard.importer.kpi.traced_origins_hint', t),
    complianceStatusTitle: resolveLabel('dashboard.importer.compliance_status.title', t),
    complianceStatusDescription: resolveLabel('dashboard.importer.compliance_status.description', t),
    complianceFullyCompliant: resolveLabel('dashboard.importer.compliance_status.fully_compliant', t),
    complianceReady: resolveLabel('dashboard.importer.compliance_status.ready', t),
    complianceOnHold: resolveLabel('dashboard.importer.compliance_status.on_hold', t),
    complianceDraft: resolveLabel('dashboard.importer.compliance_status.draft', t),
    traceabilityTitle: resolveLabel('dashboard.importer.traceability.title', t),
    traceabilityDescription: resolveLabel('dashboard.importer.traceability.description', t),
    traceabilityOriginCountries: resolveLabel('dashboard.importer.traceability.origin_countries', t),
    traceabilityOriginHint: resolveLabel('dashboard.importer.traceability.origin_hint', t),
    traceabilityOriginAvailable: resolveLabel('dashboard.importer.traceability.origin_available', t),
    traceabilityOriginNone: resolveLabel('dashboard.importer.traceability.origin_none', t),
    traceabilityDeforestationFree: resolveLabel('dashboard.importer.traceability.deforestation_free', t),
    traceabilityBaselineHint: resolveLabel('dashboard.importer.traceability.baseline_hint', t),
    tracesFilingHint: getTracesFilingHint('importer', t),
    quickViewShipments: resolveLabel('dashboard.importer.quick_action.view_shipments', t),
    quickViewShipmentsHint: resolveLabel('dashboard.importer.quick_action.view_shipments_hint', t),
    quickComplianceQueue: resolveLabel('dashboard.importer.quick_action.compliance_queue', t),
    quickAddContact: resolveLabel('dashboard.importer.quick_action.add_contact', t),
    quickAddContactHint: resolveLabel('dashboard.importer.quick_action.add_contact_hint', t),
    quickLaunchCampaign: resolveLabel('dashboard.importer.quick_action.launch_campaign', t),
    quickLaunchCampaignHint: resolveLabel('dashboard.importer.quick_action.launch_campaign_hint', t),
  };
}

export function formatImporterVerifiedPct(pct: number, t?: TranslateFn): string {
  return interpolate(resolveLabel('dashboard.importer.traceability.verified_pct', t), { pct });
}

export function getImporterNorthStarLabels(
  mode: 'inbox' | 'review' | 'filing',
  t?: TranslateFn,
): Pick<
  import('@/lib/dashboard-north-star').NorthStarConfig,
  'label' | 'hint' | 'ctaLabel'
> {
  if (mode === 'inbox') {
    return {
      label: resolveLabel('dashboard.north_star.importer.inbox_pending', t),
      hint: resolveLabel('dashboard.north_star.importer.inbox_hint', t),
      ctaLabel: resolveLabel('dashboard.north_star.importer.inbox_cta', t),
    };
  }
  if (mode === 'review') {
    return {
      label: resolveLabel('dashboard.north_star.importer.awaiting_review', t),
      hint: resolveLabel('dashboard.north_star.importer.review_hint', t),
      ctaLabel: resolveLabel('dashboard.north_star.importer.open_queue', t),
    };
  }
  return {
    label: resolveLabel('dashboard.north_star.importer.ready_filing', t),
    hint: resolveLabel('dashboard.north_star.importer.filing_hint', t),
    ctaLabel: resolveLabel('dashboard.north_star.importer.filing_cta', t),
  };
}

export function getNorthStarPriorityLabel(t?: TranslateFn): string {
  return resolveLabel('dashboard.north_star.priority_label', t);
}

export function getExporterSealedCountLabel(sealedCount: number, t?: TranslateFn): string {
  return interpolate(resolveLabel('terminology.exporter.sealed_count', t), { count: sealedCount });
}

export function getExporterShipmentTrackDescription(t?: TranslateFn): string {
  return resolveLabel('terminology.exporter.shipment_track_description', t);
}

export function getExporterSubmittedQueueHint(t?: TranslateFn): string {
  return resolveLabel('terminology.exporter.submitted_queue_hint', t);
}

export function formatExporterSlaLabel(days: number, t?: TranslateFn): string {
  return interpolate(resolveLabel('dashboard.exporter.sla.label', t), { days });
}

export function formatExporterSlaActive(days: number, t?: TranslateFn): string {
  return interpolate(resolveLabel('dashboard.exporter.sla.active', t), { days });
}

export function formatExporterComplianceRateSrOnly(
  pct: number,
  compliant: number,
  total: number,
  t?: TranslateFn,
): string {
  return interpolate(resolveLabel('dashboard.exporter.compliance_rate_sr', t), {
    pct,
    compliant,
    total,
  });
}

export function getExporterDashboardLabels(t?: TranslateFn) {
  return {
    campaignDescription: resolveLabel('dashboard.exporter.campaign.description', t),
    pipelineTitle: resolveLabel('dashboard.exporter.pipeline.title', t),
    pipelineDescription: resolveLabel('dashboard.exporter.pipeline.description', t),
    kpiActiveShipments: resolveLabel('dashboard.exporter.kpi.active_shipments', t),
    kpiBlockingIssues: resolveLabel('dashboard.exporter.kpi.blocking_issues', t),
    kpiBlockingIssuesHint: resolveLabel('dashboard.exporter.kpi.blocking_issues_hint', t),
    kpiYieldFailures: resolveLabel('dashboard.exporter.kpi.yield_failures', t),
    kpiYieldFailuresHint: resolveLabel('dashboard.exporter.kpi.yield_failures_hint', t),
    kpiReadyToSeal: resolveLabel('dashboard.exporter.kpi.ready_to_seal', t),
    kpiReadyToSealHint: resolveLabel('dashboard.exporter.kpi.ready_to_seal_hint', t),
    plotsNeedAttention: resolveLabel('dashboard.exporter.plots_need_attention', t),
    plotsNeedAttentionHint: resolveLabel('dashboard.exporter.plots_need_attention_hint', t),
    plotsNeedAttentionCta: resolveLabel('dashboard.exporter.plots_need_attention_cta', t),
    statusPipelineTitle: resolveLabel('dashboard.exporter.status_pipeline.title', t),
    activityEmpty: resolveLabel('dashboard.exporter.activity_empty', t),
    quickBatches: resolveLabel('dashboard.exporter.quick.batches', t),
    quickBatchesHint: resolveLabel('dashboard.exporter.quick.batches_hint', t),
    quickShipments: resolveLabel('dashboard.exporter.quick.shipments', t),
    quickShipmentsHint: resolveLabel('dashboard.exporter.quick.shipments_hint', t),
    quickProducer: resolveLabel('dashboard.exporter.quick.producer', t),
    quickProducerHint: resolveLabel('dashboard.exporter.quick.producer_hint', t),
  };
}

export function getExporterNorthStarLabels(
  mode: 'blockers' | 'yield' | 'seal' | 'handoff',
  sealedCount: number,
  t?: TranslateFn,
): Pick<import('@/lib/dashboard-north-star').NorthStarConfig, 'label' | 'hint' | 'ctaLabel'> {
  if (mode === 'blockers') {
    return {
      label: resolveLabel('dashboard.north_star.exporter.blockers.label', t),
      hint: resolveLabel('dashboard.north_star.exporter.blockers.hint', t),
      ctaLabel: resolveLabel('dashboard.north_star.exporter.blockers.cta', t),
    };
  }
  if (mode === 'yield') {
    return {
      label: resolveLabel('dashboard.north_star.exporter.yield.label', t),
      hint: resolveLabel('dashboard.north_star.exporter.yield.hint', t),
      ctaLabel: resolveLabel('dashboard.north_star.exporter.yield.cta', t),
    };
  }
  if (mode === 'seal') {
    return {
      label: resolveLabel('dashboard.north_star.exporter.ready_seal', t),
      hint: resolveLabel('dashboard.north_star.exporter.seal_hint', t),
      ctaLabel: resolveLabel('dashboard.north_star.exporter.seal_cta', t),
    };
  }
  return {
    label: resolveLabel('dashboard.north_star.exporter.handoff_ready', t),
    hint: interpolate(resolveLabel('terminology.exporter.handoff_hint', t), { count: sealedCount }),
    ctaLabel: resolveLabel('dashboard.north_star.exporter.view_sealed_cta', t),
  };
}

export function getCooperativeDashboardLabels(t?: TranslateFn) {
  return {
    campaignDescription: resolveLabel('dashboard.cooperative.campaign.description', t),
    campaignEmptyDescription: resolveLabel('dashboard.cooperative.campaign.empty_description', t),
    campaignEmptyCta: resolveLabel('dashboard.cooperative.campaign.empty_cta', t),
    kpiMembers: resolveLabel('dashboard.cooperative.kpi.members', t),
    kpiMembersHint: resolveLabel('dashboard.cooperative.kpi.members_hint', t),
    kpiPlotCoverage: resolveLabel('dashboard.cooperative.kpi.plot_coverage', t),
    kpiBlockedBatches: resolveLabel('dashboard.cooperative.kpi.blocked_batches', t),
    kpiBlockedBatchesHint: resolveLabel('dashboard.cooperative.kpi.blocked_batches_hint', t),
    kpiPremiumGovernance: resolveLabel('dashboard.cooperative.kpi.premium_governance', t),
    kpiPremiumGovernanceHint: resolveLabel('dashboard.cooperative.kpi.premium_governance_hint', t),
    healthTitle: resolveLabel('dashboard.cooperative.health.title', t),
    healthDescription: resolveLabel('dashboard.cooperative.health.description', t),
    healthConsentTitle: resolveLabel('dashboard.cooperative.health.consent_title', t),
    healthConsentHint: resolveLabel('dashboard.cooperative.health.consent_hint', t),
    healthGeometryTitle: resolveLabel('dashboard.cooperative.health.geometry_title', t),
    healthGeometryHint: resolveLabel('dashboard.cooperative.health.geometry_hint', t),
    healthOverdueTitle: resolveLabel('dashboard.cooperative.health.overdue_title', t),
    healthOverdueHint: resolveLabel('dashboard.cooperative.health.overdue_hint', t),
    activityTitle: resolveLabel('dashboard.cooperative.activity.title', t),
    activityDescription: resolveLabel('dashboard.cooperative.activity.description', t),
    activityEmpty: resolveLabel('dashboard.cooperative.activity.empty', t),
    panelMembersTitle: resolveLabel('dashboard.cooperative.panel.members_title', t),
    panelMembersDescription: resolveLabel('dashboard.cooperative.panel.members_description', t),
    panelFieldTitle: resolveLabel('dashboard.cooperative.panel.field_title', t),
    panelFieldDescription: resolveLabel('dashboard.cooperative.panel.field_description', t),
    panelBatchesTitle: resolveLabel('dashboard.cooperative.panel.batches_title', t),
    panelBatchesDescription: resolveLabel('dashboard.cooperative.panel.batches_description', t),
    actionAddMember: resolveLabel('dashboard.cooperative.action.add_member', t),
    actionMemberDirectory: resolveLabel('dashboard.cooperative.action.member_directory', t),
    actionPortabilityQueue: resolveLabel('dashboard.cooperative.action.portability_queue', t),
    actionConsentMissing: resolveLabel('dashboard.cooperative.action.consent_missing', t),
    actionPlotRegistry: resolveLabel('dashboard.cooperative.action.plot_registry', t),
    actionBoundaryFollowup: resolveLabel('dashboard.cooperative.action.boundary_followup', t),
    actionFieldRemediation: resolveLabel('dashboard.cooperative.action.field_remediation', t),
    actionDuplicateFlags: resolveLabel('dashboard.cooperative.action.duplicate_flags', t),
    actionAddBatch: resolveLabel('dashboard.cooperative.action.add_batch', t),
    actionRegisterDelivery: resolveLabel('dashboard.cooperative.action.register_delivery', t),
    actionBatchIntegrity: resolveLabel('dashboard.cooperative.action.batch_integrity', t),
    actionShipmentReadiness: resolveLabel('dashboard.cooperative.action.shipment_readiness', t),
    actionPremiumPayout: resolveLabel('dashboard.cooperative.action.premium_payout', t),
    badgeNew: resolveLabel('dashboard.cooperative.badge.new', t),
  };
}

export function formatCooperativePlotCoverageHint(
  compliant: number,
  total: number,
  t?: TranslateFn,
): string {
  return interpolate(resolveLabel('dashboard.cooperative.kpi.plot_coverage_hint', t), {
    compliant,
    total,
  });
}

export function formatCooperativeBadge(
  key: 'pending' | 'blocked' | 'ready' | 'plots',
  count: number,
  t?: TranslateFn,
): string {
  return interpolate(resolveLabel(`dashboard.cooperative.badge.${key}`, t), { count });
}

export function getCooperativeNorthStarLabels(
  consentGaps: number,
  pendingPlots: number,
  incomingPending: number,
  t?: TranslateFn,
): Pick<import('@/lib/dashboard-north-star').NorthStarConfig, 'label' | 'hint' | 'ctaLabel'> {
  return {
    label: resolveLabel('dashboard.north_star.cooperative.member_actions', t),
    hint: interpolate(resolveLabel('dashboard.north_star.cooperative.hint', t), {
      consentGaps,
      pendingPlots,
    }),
    ctaLabel:
      incomingPending > 0
        ? resolveLabel('dashboard.north_star.cooperative.open_requests', t)
        : resolveLabel('dashboard.north_star.cooperative.open_members', t),
  };
}

export function getReviewerJurisdictionActivityHint(t?: TranslateFn): string {
  return resolveLabel('terminology.reviewer.jurisdiction_activity_hint', t);
}

export function getReviewerDashboardLabels(t?: TranslateFn) {
  return {
    triageTitle: resolveLabel('dashboard.reviewer.triage.title', t),
    triageDescription: resolveLabel('dashboard.reviewer.triage.description', t),
    triageBlocking: resolveLabel('dashboard.reviewer.triage.blocking', t),
    triageBlockingHint: resolveLabel('dashboard.reviewer.triage.blocking_hint', t),
    triageYieldWarnings: resolveLabel('dashboard.reviewer.triage.yield_warnings', t),
    triageYieldHint: resolveLabel('dashboard.reviewer.triage.yield_hint', t),
    triagePendingReview: resolveLabel('dashboard.reviewer.triage.pending_review', t),
    triagePendingHint: resolveLabel('dashboard.reviewer.triage.pending_hint', t),
    quickReviewQueue: resolveLabel('dashboard.reviewer.quick.review_queue', t),
    quickReviewQueueHint: resolveLabel('dashboard.reviewer.quick.review_queue_hint', t),
    quickPlotRegistry: resolveLabel('dashboard.reviewer.quick.plot_registry', t),
    quickPlotRegistryHint: resolveLabel('dashboard.reviewer.quick.plot_registry_hint', t),
    quickReports: resolveLabel('dashboard.reviewer.quick.reports', t),
    quickReportsHint: resolveLabel('dashboard.reviewer.quick.reports_hint', t),
  };
}

export function getReviewerNorthStarLabels(
  flaggedCount: number,
  t?: TranslateFn,
): Pick<import('@/lib/dashboard-north-star').NorthStarConfig, 'label' | 'hint' | 'ctaLabel'> {
  return {
    label: resolveLabel('dashboard.north_star.reviewer.awaiting_review', t),
    hint: interpolate(resolveLabel('dashboard.north_star.reviewer.flagged_hint', t), {
      count: flaggedCount,
    }),
    ctaLabel: resolveLabel('dashboard.north_star.reviewer.start_cta', t),
  };
}

export function getSponsorDashboardLabels(t?: TranslateFn) {
  return {
    campaignTitle: resolveLabel('dashboard.sponsor.campaign.title', t),
    campaignDescription: resolveLabel('dashboard.sponsor.campaign.description', t),
    campaignCreate: resolveLabel('dashboard.sponsor.campaign.create', t),
    campaignEmptyTitle: resolveLabel('dashboard.sponsor.campaign.empty_title', t),
    campaignEmptyDescription: resolveLabel('dashboard.sponsor.campaign.empty_description', t),
    campaignEmptyCta: resolveLabel('dashboard.sponsor.campaign.empty_cta', t),
    campaignListLink: resolveLabel('dashboard.sponsor.campaign.list_link', t),
    emphasisTitle: resolveLabel('dashboard.sponsor.emphasis.title', t),
    emphasisCountry: resolveLabel('dashboard.sponsor.emphasis.country', t),
    emphasisBrand: resolveLabel('dashboard.sponsor.emphasis.brand', t),
    emphasisSwitchHint: resolveLabel('dashboard.sponsor.emphasis.switch_hint', t),
    networkHealthTitle: resolveLabel('dashboard.sponsor.network_health.title', t),
    networkHealthDescription: resolveLabel('dashboard.sponsor.network_health.description', t),
    networkHealthViewAll: resolveLabel('dashboard.sponsor.network_health.view_all', t),
    networkHealthEmpty: resolveLabel('dashboard.sponsor.network_health.empty', t),
    networkHealthAddOrgs: resolveLabel('dashboard.sponsor.network_health.add_orgs', t),
    governanceActivityTitle: resolveLabel('dashboard.sponsor.governance_activity.title', t),
    governanceActivityDescription: resolveLabel('dashboard.sponsor.governance_activity.description', t),
    governanceActivityEmpty: resolveLabel('dashboard.sponsor.governance_activity.empty', t),
    programmeTitle: resolveLabel('dashboard.sponsor.programme.title', t),
    programmeDescription: resolveLabel('dashboard.sponsor.programme.description', t),
    programmeNewCta: resolveLabel('dashboard.sponsor.programme.new_cta', t),
    programmeAdoptionHint: resolveLabel('dashboard.sponsor.programme.adoption_hint', t),
    programmeEmpty: resolveLabel('dashboard.sponsor.programme.empty', t),
    programmeEmptyCta: resolveLabel('dashboard.sponsor.programme.empty_cta', t),
    interventionTitle: resolveLabel('dashboard.sponsor.intervention.title', t),
    interventionDescription: resolveLabel('dashboard.sponsor.intervention.description', t),
    quickDelegatedAdmin: resolveLabel('dashboard.sponsor.quick.delegated_admin', t),
    quickDelegatedAdminHint: resolveLabel('dashboard.sponsor.quick.delegated_admin_hint', t),
    quickReporting: resolveLabel('dashboard.sponsor.quick.reporting', t),
    quickReportingHint: resolveLabel('dashboard.sponsor.quick.reporting_hint', t),
    quickBilling: resolveLabel('dashboard.sponsor.quick.billing', t),
    statCountries: resolveLabel('dashboard.sponsor.stat.countries', t),
    statCommodities: resolveLabel('dashboard.sponsor.stat.commodities', t),
    statRoles: resolveLabel('dashboard.sponsor.stat.roles', t),
    statTransparency: resolveLabel('dashboard.sponsor.stat.transparency', t),
  };
}

export function formatSponsorStatHint(
  key: 'countries' | 'commodities' | 'roles' | 'transparency' | 'commodities_loading',
  values: Record<string, string | number>,
  t?: TranslateFn,
): string {
  const map: Record<string, string> = {
    countries: 'dashboard.sponsor.stat.countries_hint',
    commodities: 'dashboard.sponsor.stat.commodities_hint',
    commodities_loading: 'dashboard.sponsor.stat.commodities_loading',
    roles: 'dashboard.sponsor.stat.roles_hint',
    transparency: 'dashboard.sponsor.stat.transparency_hint',
  };
  return interpolate(resolveLabel(map[key], t), values);
}

export function formatSponsorBillingQuickHint(atRiskOrgs: number, t?: TranslateFn): string {
  return interpolate(resolveLabel('dashboard.sponsor.quick.billing_hint', t), {
    count: atRiskOrgs,
  });
}

export function getSponsorInterventionItems(
  counts: { pendingApprovals: number; uncoveredCoverage: number; belowReadiness: number },
  t?: TranslateFn,
) {
  return [
    {
      title: interpolate(resolveLabel('dashboard.sponsor.intervention.policy', t), {
        count: counts.pendingApprovals,
      }),
      area: 'Delegated Admin',
    },
    {
      title: interpolate(resolveLabel('dashboard.sponsor.intervention.billing', t), {
        count: counts.uncoveredCoverage,
      }),
      area: 'Billing & Coverage',
    },
    {
      title: interpolate(resolveLabel('dashboard.sponsor.intervention.readiness', t), {
        count: counts.belowReadiness,
      }),
      area: 'Issues',
    },
  ];
}

export function getSponsorNorthStarLabels(
  atRiskOrganisations: number,
  t?: TranslateFn,
): Pick<import('@/lib/dashboard-north-star').NorthStarConfig, 'label' | 'hint' | 'ctaLabel'> {
  return {
    label: resolveLabel('dashboard.north_star.sponsor.transparency_index', t),
    hint: interpolate(resolveLabel('dashboard.north_star.sponsor.at_risk_hint', t), {
      count: atRiskOrganisations,
    }),
    ctaLabel: resolveLabel('dashboard.north_star.sponsor.cta', t),
  };
}
