import { t as translate, type Locale } from '@/lib/i18n';
import type { User } from '@/types';
import * as en from '@/lib/supply-chain-terminology';
import { getDashboardBreadcrumbLabel, getMiniReviewImporterFilingAction } from '@/lib/terminology-labels';
import { translateNavItemName } from '@/lib/nav-labels';
import { getIssueSlaUrgency } from '@/lib/compliance-issue-sla';

type SupplyChainRole = User['active_role'] | null | undefined;
type TranslateFn = (key: string) => string;
export type WorkflowBreadcrumb = { label: string; href?: string };

const WORKFLOW_LABELS: Record<string, string> = {
  'workflow.nav.operations': 'Operations',
  'workflow.nav.compliance': 'Compliance',
  'workflow.nav.issues': 'Issues',
  'workflow.packages.title.shipments': 'Shipments',
  'workflow.packages.title.dds': 'DDS Packages',
  'workflow.packages.subtitle.importer':
    'Validate shipment completeness, coverage, and declaration readiness before TRACES filing',
  'workflow.packages.subtitle.exporter':
    'Assemble shipment packages from lineage-safe upstream inputs and hand off to your importer',
  'workflow.packages.subtitle.cooperative':
    'Prepare cooperative handoff shipments with lineage coverage, blocker checks, and premium context',
  'workflow.packages.subtitle.default': 'Manage Deforestation Due Diligence Statement packages',
  'workflow.packages.cta.new_shipment': 'New Shipment',
  'workflow.packages.cta.new_package': 'New Package',
  'workflow.packages.tab.my_shipments': 'My Shipments',
  'workflow.packages.tab.my_packages': 'My Packages',
  'workflow.packages.tab.shared_shipments': 'Shared Shipments ({{count}})',
  'workflow.packages.tab.shared_with_me': 'Shared With Me ({{count}})',
  'workflow.packages.loading.shipments': 'Loading shipments...',
  'workflow.packages.loading.packages': 'Loading packages...',
  'workflow.compliance.title.cooperative': 'Cooperative Data Readiness Check',
  'workflow.compliance.title.importer': 'Compliance',
  'workflow.compliance.title.default': 'Zero-Risk Pre-Flight Check',
  'workflow.compliance.subtitle.cooperative':
    'Validate member evidence and plot readiness before export handoff',
  'workflow.compliance.subtitle.importer':
    'Validate role decisions, references, and declaration readiness before TRACES submission',
  'workflow.compliance.subtitle.default':
    'Comprehensive compliance verification before handoff to your importer',
  'workflow.compliance.back.shipment': 'Back to Shipment',
  'workflow.compliance.back.package': 'Back to Package',
  'workflow.compliance.hub_empty.importer':
    'Select a shipment from Shipments to run declaration readiness checks before TRACES filing.',
  'workflow.compliance.hub_empty.default':
    'Select a shipment from Shipments to run package compliance checks, or use the review queues above for field evidence.',
  'workflow.compliance.overview.shipment': 'Shipment Compliance Overview',
  'workflow.compliance.overview.package': 'Package Compliance Overview',
  'workflow.compliance.blocker_tail.importer': 'Resolve blockers before you submit the DDS to TRACES.',
  'workflow.compliance.blocker_tail.default':
    'Resolve blockers before sealing and handing off to your importer.',
  'workflow.compliance.readiness_empty.importer':
    'Select a shipment from Shipments to load backend readiness diagnostics.',
  'workflow.compliance.readiness_empty.default':
    'Select a package from Packages to load backend readiness diagnostics.',
  'workflow.compliance.no_reason_codes.importer':
    'No backend readiness reason codes reported for this shipment.',
  'workflow.compliance.no_reason_codes.default':
    'No backend readiness reason codes reported for this package.',
  'workflow.compliance.back_to_list.shipments': 'Back to Shipments',
  'workflow.compliance.back_to_list.packages': 'Back to Packages',
  'workflow.compliance.back_to_list.dds': 'Back to DDS Packages',
  'workflow.issues.title.default': 'Compliance Issues',
  'workflow.issues.title.short': 'Issues',
  'workflow.issues.subtitle.importer':
    'Manage blockers, warnings, and escalations linked to shipment and TRACES filing workflows',
  'workflow.issues.subtitle.cooperative':
    'Resolve field, lineage, consent, portability, and premium-governance blockers',
  'workflow.issues.subtitle.default':
    'Manage and track compliance blockers before shipment seal and importer handoff',
  'workflow.issues.create.exception': 'New Exception',
  'workflow.issues.create.cooperative': 'New Cooperative Issue',
  'workflow.issues.create.default': 'New Issue',
  'workflow.issues.dialog.title.importer': 'Create Workflow Exception',
  'workflow.issues.dialog.title.cooperative': 'Create Cooperative Issue',
  'workflow.issues.dialog.title.default': 'Create Compliance Issue',
  'workflow.issues.dialog.description.importer':
    'Add a blocker or warning to track before you submit DDS to TRACES.',
  'workflow.issues.dialog.description.cooperative':
    'Track operational blockers like duplicate members, blocked yield checks, consent gaps, portability reviews, or premium approvals.',
  'workflow.issues.dialog.description.default':
    'Add a compliance issue to track before sealing and handing off to your importer.',
  'workflow.issues.linked_entity.shipment': 'Shipment',
  'workflow.issues.linked_entity.package': 'Package',
  'workflow.compliance.queue.title': 'Compliance Issues Queue',
  'workflow.compliance.queue.subtitle': 'Review and resolve compliance issues sorted by severity and SLA',
  'workflow.compliance.queue.breadcrumb': 'Issues Queue',
  'workflow.compliance.queue.stat.blocking': 'Blocking Issues',
  'workflow.compliance.queue.stat.pending': 'Packages Pending',
  'workflow.compliance.queue.stat.critical_sla': 'Critical SLA',
  'workflow.compliance.queue.stat.total': 'Total in Queue',
  'workflow.compliance.queue.filters': 'Filters',
  'workflow.compliance.queue.filter.status': 'Status:',
  'workflow.compliance.queue.filter.risk': 'Risk:',
  'workflow.compliance.queue.filter.severity': 'Severity:',
  'workflow.compliance.queue.filter.all': 'all',
  'workflow.compliance.queue.status.open': 'Open',
  'workflow.compliance.queue.status.in_progress': 'In Progress',
  'workflow.compliance.queue.status.resolved': 'Resolved',
  'workflow.compliance.queue.status.escalated': 'Escalated',
  'workflow.compliance.queue.loading': 'Loading compliance queue...',
  'workflow.compliance.queue.empty': 'No packages match the selected filters',
  'workflow.compliance.queue.review_issues': 'Review Issues',
  'workflow.compliance.queue.risk_suffix': 'Risk',
  'workflow.producers.title.cooperative': 'Members',
  'workflow.producers.title.default': 'Producers',
  'workflow.producers.subtitle.cooperative':
    'Manage member identities, consent status, and linked plot portfolios',
  'workflow.producers.subtitle.default':
    'Manage producer identities, onboarding status, and linked plot portfolios',
  'workflow.producers.cta.add.cooperative': 'Add Member',
  'workflow.producers.cta.add.default': 'Add Producer',
  'workflow.producers.filters': 'Filters',
  'workflow.producers.stat.total.cooperative': 'Total Members',
  'workflow.producers.stat.total.default': 'Total Producers',
  'workflow.producers.stat.total_hint': 'Active in directory',
  'workflow.producers.stat.compliant': 'Compliant',
  'workflow.producers.stat.compliant_hint': 'All requirements met',
  'workflow.producers.stat.partial': 'Partial Compliance',
  'workflow.producers.stat.partial_hint': 'Some requirements pending',
  'workflow.producers.stat.fpic': 'With FPIC Consent',
  'workflow.producers.stat.fpic_hint': 'Consent granted',
  'workflow.producers.search.cooperative': 'Search by member name, email, or cooperative...',
  'workflow.producers.search.default': 'Search by producer name, email, or cooperative...',
  'workflow.producers.table.title.cooperative': 'Registered Members',
  'workflow.producers.table.title.default': 'Registered Producers',
  'workflow.producers.empty.none.cooperative':
    'No members yet. Add your first member to start building your directory.',
  'workflow.producers.empty.none.default':
    'No producers yet. Add your first producer to start building your upstream directory.',
  'workflow.producers.empty.cta.cooperative': 'Add first member',
  'workflow.producers.empty.cta.default': 'Add first producer',
  'workflow.producers.empty.filter.cooperative': 'No members match your search or filters.',
  'workflow.producers.empty.filter.default': 'No producers match your search or filters.',
  'workflow.producers.filter.title.cooperative': 'Filter members',
  'workflow.producers.filter.title.default': 'Filter producers',
  'workflow.producers.filter.description.cooperative':
    'Narrow the member directory by compliance, consent, and onboarding status.',
  'workflow.producers.filter.description.default':
    'Narrow the producer directory by compliance, consent, and onboarding status.',
  'workflow.producers.compliance.compliant': 'Compliant',
  'workflow.producers.compliance.non_compliant': 'Non-Compliant',
  'workflow.producers.compliance.partial': 'Partial',
  'workflow.producers.new.title.cooperative': 'Add Member',
  'workflow.producers.new.title.default': 'Add Producer',
  'workflow.producers.new.subtitle.cooperative': 'Register a member in your cooperative directory',
  'workflow.producers.new.subtitle.default': 'Register a producer in your upstream directory',
  'workflow.producers.new.breadcrumb': 'Add',
  'workflow.producers.back.cooperative': 'Back to members',
  'workflow.producers.back.default': 'Back to producers',
  'workflow.producers.detail.fallback.cooperative': 'Member',
  'workflow.producers.detail.fallback.default': 'Producer',
  'workflow.producers.detail.loading.cooperative': 'Loading member…',
  'workflow.producers.detail.loading.default': 'Loading producer…',
  'workflow.producers.detail.not_found.cooperative': 'Member contact not found in your directory.',
  'workflow.producers.detail.not_found.default': 'Producer contact not found in your directory.',
  'workflow.plots.title': 'Plots',
  'workflow.plots.subtitle.cooperative':
    'Track member plot coverage, geometry quality, and compliance risk with field-capture overlays',
  'workflow.plots.subtitle.default': 'Manage plot inventory and deforestation risk assessments',
  'workflow.plots.cta.add': 'Add Plot',
  'workflow.plots.cta.filters': 'Filters',
  'workflow.plots.stat.total': 'Total Plots',
  'workflow.plots.stat.total_ha': '{{ha}} hectares total',
  'workflow.plots.stat.low.cooperative': 'Mapped & Low Risk',
  'workflow.plots.stat.low.default': 'Low Risk',
  'workflow.plots.stat.low_hint.cooperative': 'Ready for batch lineage inclusion',
  'workflow.plots.stat.low_hint.default': 'Ready for compliance',
  'workflow.plots.stat.medium.cooperative': 'Needs Field Review',
  'workflow.plots.stat.medium.default': 'Medium Risk',
  'workflow.plots.stat.medium_hint.cooperative': 'Geometry/legal checks pending',
  'workflow.plots.stat.medium_hint.default': 'Requires review',
  'workflow.plots.stat.high.cooperative': 'Blocked / High Risk',
  'workflow.plots.stat.high.default': 'High Risk',
  'workflow.plots.stat.high_hint.cooperative': 'Escalate to issues and appeals',
  'workflow.plots.stat.high_hint.default': 'Action needed',
  'workflow.plots.search.cooperative': 'Search by plot name, ID, or member-linked records...',
  'workflow.plots.search.default': 'Search by plot name or ID...',
  'workflow.plots.table.title.cooperative': 'Plot Registry and Capture Quality',
  'workflow.plots.table.title.default': 'Plot Inventory',
  'workflow.plots.table.origin.cooperative': 'Member',
  'workflow.plots.table.origin.default': 'Producer',
  'workflow.plots.empty': 'No plots found',
  'workflow.plots.risk.low': 'Low Risk',
  'workflow.plots.risk.medium': 'Medium Risk',
  'workflow.plots.risk.high': 'High Risk',
  'workflow.plots.risk.unknown': 'Unknown Risk',
  'workflow.plots.detail.title': 'Plot Detail',
  'workflow.plots.detail.subtitle': 'Plot identifier: {{id}}',
  'workflow.compliance.plot_review.title': 'Plot review queue',
  'workflow.compliance.plot_review.subtitle':
    'Adjudicate satellite flags, overlap risk, and ground-truth evidence before plots clear to compliant',
  'workflow.compliance.plot_review.breadcrumb': 'Plot review',
  'workflow.compliance.plot_review.tenure_banner':
    'Producer-in-possession tenure files with low AI confidence route to the tenure document review queue.',
  'workflow.compliance.plot_review.tenure_cta': 'Open tenure review queue',
  'workflow.compliance.plot_review.stat.awaiting': 'Plots awaiting review',
  'workflow.compliance.plot_review.stat.high_priority': 'High priority',
  'workflow.compliance.plot_review.stat.auto_clear': 'Auto-clearance eligible',
  'workflow.compliance.plot_review.loading': 'Loading plot review queue…',
  'workflow.compliance.plot_review.empty': 'No plots currently require compliance review.',
  'workflow.compliance.plot_review.status.under_review': 'Under review',
  'workflow.compliance.plot_review.status.degradation_risk': 'Overlap risk',
  'workflow.compliance.plot_review.status.deforestation_detected': 'Deforestation flagged',
  'workflow.compliance.plot_review.screening.title': 'GFW screening explainability',
  'workflow.compliance.plot_review.screening.alert_tier': 'Alert tier: {{tier}}',
  'workflow.compliance.plot_review.screening.context_adjusted': 'Context-adjusted',
  'workflow.compliance.plot_review.screening.integrated_alerts': 'Integrated alerts',
  'workflow.compliance.plot_review.screening.tree_cover': 'Tropical tree cover (avg)',
  'workflow.compliance.plot_review.screening.hansen_loss': 'Hansen loss (post-cutoff)',
  'workflow.compliance.plot_review.screening.natural_forest': 'Natural forest overlap',
  'workflow.compliance.plot_review.screening.last_screened': 'Last screened {{date}}',
  'workflow.compliance.plot_review.open_plot': 'Open plot',
  'workflow.compliance.plot_review.uphold_block': 'Uphold block',
  'workflow.compliance.plot_review.clear_compliant': 'Clear to compliant',
  'workflow.compliance.plot_review.priority_suffix': '{{priority}} priority',
  'workflow.compliance.plot_review.auto_clear_badge': 'Auto-clear eligible',
  'workflow.compliance.plot_review.overlap.title': 'Overlap signals',
  'workflow.compliance.plot_review.overlap.summary':
    'SINAPH overlap: {{sinaph}} · Indigenous overlap: {{indigenous}}',
  'workflow.compliance.plot_review.yes': 'yes',
  'workflow.compliance.plot_review.no': 'no',
  'workflow.compliance.plot_review.photos.title': 'Ground-truth photos',
  'workflow.compliance.plot_review.photos.summary':
    '{{verified}}/{{required}} clearance-verified ({{geo}} on-plot, {{timestamp}} after {{cutoff}})',
  'workflow.compliance.plot_review.photos.empty': 'No synced photo batch yet.',
  'workflow.compliance.plot_review.screening.hits_ha': '{{count}} hits · {{area}}',
  'workflow.compliance.plot_review.screening.dataset_ok': '{{dataset}}: ok',
  'workflow.compliance.plot_review.screening.dataset_error': '{{dataset}}: {{error}}',
  'workflow.compliance.plot_review.screening.dataset_failed': '{{dataset}}: failed',
  'workflow.compliance.plot_review.producer_fallback': 'Producer',
  'workflow.compliance.plot_review.area_na': 'Area n/a',
  'workflow.compliance.plot_review.dialog.clear_title': 'Clear plot review',
  'workflow.compliance.plot_review.dialog.uphold_title': 'Uphold plot block',
  'workflow.compliance.plot_review.dialog.description': '{{name}} — {{status}}. This decision is audited.',
  'workflow.compliance.plot_review.dialog.reason_label': 'Reason',
  'workflow.compliance.plot_review.dialog.reason_placeholder':
    'Explain the evidence reviewed and why this outcome is justified.',
  'workflow.compliance.plot_review.dialog.cancel': 'Cancel',
  'workflow.compliance.plot_review.dialog.saving': 'Saving…',
  'workflow.compliance.plot_review.dialog.confirm_clear': 'Confirm clearance',
  'workflow.compliance.plot_review.dialog.confirm_uphold': 'Confirm uphold',
  'workflow.compliance.plot_review.reason_min_length': 'Enter a reason with at least 8 characters.',
  'workflow.compliance.plot_review.decision_failed': 'Decision failed.',
  'workflow.compliance.tenure_review.title': 'Tenure document review',
  'workflow.compliance.tenure_review.subtitle':
    'Confirm AI tenure extractions for producer-in-possession and informal land evidence',
  'workflow.compliance.tenure_review.breadcrumb': 'Tenure review',
  'workflow.compliance.tenure_review.stat.awaiting': 'Documents awaiting review',
  'workflow.compliance.tenure_review.stat.manual': 'Manual review required',
  'workflow.compliance.tenure_review.stat.failed': 'Parse failed',
  'workflow.compliance.tenure_review.loading': 'Loading tenure review queue…',
  'workflow.compliance.tenure_review.empty': 'No tenure documents currently require human review.',
  'workflow.compliance.tenure_review.open_plot': 'Open plot',
  'workflow.compliance.tenure_review.confirm_cta': 'Confirm tenure review',
  'workflow.compliance.tenure_review.dialog.title': 'Confirm tenure review',
  'workflow.compliance.tenure_review.dialog.description':
    'Accept this tenure document after manual review. This clears the compliance issue and allows the plot land checklist to pass when other requirements are met.',
  'workflow.compliance.tenure_review.plot_fallback': 'Plot',
  'workflow.compliance.tenure_review.producer_fallback': 'Producer',
  'workflow.compliance.tenure_review.document_fallback': 'Tenure document',
  'workflow.compliance.tenure_review.ai_extraction.title': 'AI extraction',
  'workflow.compliance.tenure_review.ai_extraction.detected': 'Detected: {{type}}',
  'workflow.compliance.tenure_review.ai_extraction.none': 'No tenure type detected',
  'workflow.compliance.tenure_review.ai_extraction.confidence': 'Confidence {{pct}}%',
  'workflow.compliance.tenure_review.cadastral.title': 'Cadastral cross-check',
  'workflow.compliance.tenure_review.cadastral.match': 'Declared Clave matches document extraction.',
  'workflow.compliance.tenure_review.cadastral.mismatch':
    'Mismatch: declared {{declared}} vs extracted {{extracted}}',
  'workflow.compliance.tenure_review.cadastral.awaiting': 'Awaiting declared Clave or clearer extraction.',
  'workflow.compliance.tenure_review.missing.title': 'Missing elements',
  'workflow.compliance.tenure_review.missing.review_quality': 'Review document quality and issuer details.',
  'workflow.compliance.tenure_review.dialog.reason_label': 'Reason',
  'workflow.compliance.tenure_review.dialog.reason_placeholder':
    'Explain why this document is acceptable for EUDR land-use evidence.',
  'workflow.compliance.tenure_review.dialog.note_label': 'Note (optional)',
  'workflow.compliance.tenure_review.dialog.note_placeholder': 'Optional reviewer note for audit trail.',
  'workflow.compliance.tenure_review.dialog.cancel': 'Cancel',
  'workflow.compliance.tenure_review.dialog.saving': 'Saving…',
  'workflow.compliance.tenure_review.dialog.confirm': 'Confirm review',
  'workflow.compliance.tenure_review.reason_min_length': 'Enter a reason with at least 8 characters.',
  'workflow.compliance.tenure_review.confirm_failed': 'Confirmation failed.',
  'workflow.producers.filter.compliance_label': 'Compliance',
  'workflow.producers.filter.compliance_all': 'All compliance states',
  'workflow.producers.filter.fpic_label': 'FPIC consent',
  'workflow.producers.filter.fpic_all': 'All consent states',
  'workflow.producers.filter.fpic_signed': 'Consent granted',
  'workflow.producers.filter.fpic_pending': 'Consent pending',
  'workflow.producers.filter.status_label': 'Onboarding status',
  'workflow.producers.filter.status_all': 'All statuses',
  'workflow.producers.filter.status.new': 'New',
  'workflow.producers.filter.status.invited': 'Invited',
  'workflow.producers.filter.status.engaged': 'Engaged',
  'workflow.producers.filter.status.submitted': 'Submitted',
  'workflow.producers.filter.status.inactive': 'Inactive',
  'workflow.producers.filter.status.blocked': 'Blocked',
  'workflow.producers.filter.clear': 'Clear filters',
  'workflow.producers.filter.apply': 'Apply',
  'workflow.producers.table.col.name': 'Name',
  'workflow.producers.table.col.phone': 'Phone',
  'workflow.producers.table.col.cooperative': 'Cooperative',
  'workflow.producers.table.col.status': 'Status',
  'workflow.producers.table.col.fpic': 'FPIC',
  'workflow.producers.table.col.compliance': 'Compliance',
  'workflow.content.review.stat.needs_review': 'Needs review',
  'workflow.content.review.stat.missed': 'Missed items',
  'workflow.content.review.stat.overdue_tasks': 'Overdue tasks',
  'workflow.content.review.queue.title': 'Review queue',
  'workflow.content.review.queue.empty': 'No items awaiting review.',
  'workflow.content.review.untitled': 'Untitled',
  'workflow.async.crm.prospects.loading': 'Loading prospects...',
  'workflow.async.crm.prospects.error': 'Failed to load prospects',
  'workflow.async.crm.prospects.empty': 'No prospects yet',
  'workflow.async.crm.prospects.empty_hint': 'Add leads from website forms or manual research.',
  'workflow.async.crm.templates.loading': 'Loading templates...',
  'workflow.async.crm.templates.error': 'Failed to load templates',
  'workflow.async.crm.templates.empty': 'No templates found',
  'workflow.async.crm.templates.empty_hint': 'Adjust your filter or seed template data.',
  'workflow.async.crm.daily_actions.loading': 'Loading daily actions...',
  'workflow.async.crm.daily_actions.error': 'Failed to load daily actions',
  'workflow.async.crm.daily_actions.empty': 'No actions for this day',
  'workflow.async.crm.daily_actions.empty_hint': 'Try another date or generate actions in Supabase.',
  'workflow.async.content.calendar.loading': 'Loading content calendar...',
  'workflow.async.content.calendar.error': 'Failed to load content calendar',
  'workflow.async.content.calendar.empty': 'No content scheduled yet',
  'workflow.async.content.calendar.empty_hint': 'Add calendar items to see publishing rhythm.',
  'workflow.async.content.tasks.loading': 'Loading content tasks...',
  'workflow.async.content.tasks.error': 'Failed to load content tasks',
  'workflow.async.content.tasks.empty': 'No content tasks yet',
  'workflow.async.content.tasks.empty_hint': 'Generate tasks from cadence settings.',
  'workflow.async.content.review.loading': 'Loading review data...',
  'workflow.async.content.review.error': 'Failed to load review data',
  'workflow.async.content.review.empty': 'No review items pending',
  'workflow.async.content.review.empty_hint': 'Draft and scheduled content will appear here.',
  'workflow.harvest.nav.lots_batches': 'Lots & Batches',
  'workflow.harvest.nav.batches': 'Batches',
  'workflow.harvest.subtitle.cooperative':
    'Manage cooperative aggregation, lineage lock readiness, and yield appeal workflows before export handoff',
  'workflow.harvest.subtitle.exporter':
    'Bundle harvest vouchers into identity-preserved batches before shipment assembly and importer handoff',
  'workflow.harvest.subtitle.default':
    'Manage aggregation inputs and batch-level yield plausibility checks',
  'workflow.harvest.cta.add_batch': 'Add Batch Input',
  'workflow.harvest.metric.total_batches': 'Total Batches',
  'workflow.harvest.metric.tracked_lots': 'Tracked Lots & Batches',
  'workflow.harvest.metric.total_weight': 'Total Weight',
  'workflow.harvest.metric.aggregated_volume': 'Aggregated Volume',
  'workflow.harvest.metric.avg_yield': 'Avg Yield/Ha',
  'workflow.harvest.metric.avg_yield_check': 'Avg Yield/Ha Check',
  'workflow.harvest.metric.flagged_batches': 'Flagged Batches',
  'workflow.harvest.metric.blocked_queues': 'Blocked / Appeal Queues',
  'workflow.harvest.search.cooperative': 'Search by lot/batch ID, plot, member, or lineage issues...',
  'workflow.harvest.search.default': 'Search by batch ID, plot, or producer...',
  'workflow.harvest.empty_filter': 'No lots or batches match your filters',
  'workflow.harvest.origin.member': 'Member',
  'workflow.harvest.origin.producer': 'Producer',
  'workflow.harvest.yield_cap.title': 'Yield Cap Validation',
  'workflow.harvest.yield_cap.body.base':
    "Each lot or batch input is cross-referenced against the plot's biological carrying capacity (plot area × expected yield). Weights above capacity trigger warnings or blocks to prevent illicit blending or laundering.",
  'workflow.harvest.yield_cap.body.cooperative':
    "Each lot or batch input is cross-referenced against the plot's biological carrying capacity (plot area × expected yield). Weights above capacity trigger warnings or blocks to prevent illicit blending or laundering. Cooperative teams can route blocked records into yield appeals before lineage lock and shipment assembly.",
  'workflow.harvest.yield_cap.body.exporter':
    "Each lot or batch input is cross-referenced against the plot's biological carrying capacity (plot area × expected yield). Weights above capacity trigger warnings or blocks to prevent illicit blending or laundering. Resolve warnings before assembling shipments for importer handoff.",
  'workflow.shipments.subtitle.importer':
    'Review upstream shipments and assemble EU filing packages before TRACES submission',
  'workflow.shipments.subtitle.exporter':
    'Combine batches into shipment headers, validate coverage, seal, and share with your importer',
  'workflow.shipments.subtitle.default':
    'Combine batches into shipment headers, validate coverage, and prepare for downstream filing',
  'workflow.shipments.cta.new': 'New Shipment',
  'workflow.package.entity.shipment': 'shipment',
  'workflow.package.entity.package': 'package',
  'workflow.package.entity.shipment_cap': 'Shipment',
  'workflow.package.entity.package_cap': 'Package',
  'workflow.package.detail.loading.shipment': 'Loading shipment details...',
  'workflow.package.detail.loading.package': 'Loading package details...',
  'workflow.package.detail.load_error.shipment': 'Failed to load shipment',
  'workflow.package.detail.load_error.package': 'Failed to load package',
  'workflow.package.detail.not_found.shipment': 'Shipment not found.',
  'workflow.package.detail.not_found.package': 'Package not found.',
  'workflow.package.detail.status_card': '{{entity}} Status',
  'workflow.package.detail.sidebar': '{{entity}} Details',
  'workflow.package.detail.code': 'Code',
  'workflow.package.detail.traces_reference': 'TRACES Reference',
  'workflow.package.detail.handoff_reference': 'Handoff Reference',
  'workflow.package.detail.run_compliance.importer': 'Run Declaration Checks',
  'workflow.package.detail.run_compliance.default': 'Run Compliance',
  'workflow.package.detail.assemble': 'Assemble Shipment',
  'workflow.package.detail.submit.submitting': 'Submitting...',
  'workflow.package.detail.submit.handoff': 'Submit downstream handoff',
  'workflow.package.detail.submitted.importer':
    'This shipment has been filed and is awaiting TRACES confirmation.',
  'workflow.package.detail.submitted.default':
    'This package has been submitted and is awaiting importer acceptance for EU filing.',
  'workflow.package.detail.filing_workflow.title.importer': 'TRACES Filing Workflow',
  'workflow.package.detail.filing_workflow.title.default': 'Filing Workflow',
  'workflow.package.detail.filing_workflow.hint.importer':
    'Generate artifacts and submit the DDS to TRACES when readiness checks pass.',
  'workflow.package.detail.filing_workflow.hint.exporter':
    'Generate artifacts, seal the shipment, and hand off to your importer for EU filing.',
  'workflow.package.detail.filing_workflow.hint.default':
    'Generate artifacts and submit when readiness checks pass.',
  'workflow.package.detail.preflight.title.importer': 'TRACES filing blockers',
  'workflow.package.detail.preflight.title.default': 'Filing preflight blockers',
  'workflow.package.detail.readiness.shipment': 'Shipment readiness requirements',
  'workflow.package.detail.readiness.package': 'Package readiness requirements',
  'workflow.package.detail.recent_events.shipment': 'Recent shipment events',
  'workflow.package.detail.recent_events.package': 'Recent package events',
  'workflow.package.detail.generate.generating': 'Generating...',
  'workflow.package.detail.generate.default': 'Generate filing artifacts',
  'workflow.package.detail.generate.success.importer':
    'Filing artifacts generated. Ready for TRACES submission.',
  'workflow.package.detail.generate.success.exporter':
    'Filing artifacts generated. Ready to seal and hand off to your importer.',
  'workflow.package.detail.generate.success.default': 'Filing artifacts generated. Package is ready to submit.',
  'workflow.package.detail.submit.error.shipment': 'Failed to submit shipment.',
  'workflow.package.detail.submit.error.package': 'Failed to submit package.',
  'workflow.package.detail.producers.cooperative': 'Associated Members',
  'workflow.package.detail.producers.default': 'Associated Producers',
  'workflow.package.detail.link_member': 'Link Member',
  'workflow.package.detail.link_producer': 'Link Producer',
  'workflow.package.detail.no_producers.cooperative': 'No members linked yet',
  'workflow.package.detail.no_producers.default': 'No producers linked yet',
  'workflow.package.detail.quick_stats.members': 'Members',
  'workflow.package.detail.quick_stats.producers': 'Producers',
  'workflow.package.detail.liability.importer':
    'By generating filing artifacts, you acknowledge liability for TRACES declaration accuracy and EUDR compliance.',
  'workflow.package.detail.liability.default':
    'By generating filing artifacts, you acknowledge liability for shipment data accuracy and downstream EU filing readiness.',
  'workflow.package.detail.loading_readiness': 'Loading readiness checks...',
  'workflow.package.detail.generate.error': 'Failed to generate filing artifacts.',
  'workflow.package.detail.sla.immediate': 'Immediate action required',
  'workflow.package.detail.remediation.run_compliance': 'Run compliance checks',
  'workflow.package.detail.filing_status_prefix': 'Current backend status:',
  'workflow.package.detail.readiness_blockers_heading': 'Readiness blockers:',
  'workflow.package.detail.compliance_status': 'Compliance Status',
  'workflow.package.detail.plots.title': 'Associated Plots',
  'workflow.package.detail.plots.add': 'Add Plot',
  'workflow.package.detail.plots.empty': 'No plots associated yet',
  'workflow.package.detail.plots.add_first': 'Add First Plot',
  'workflow.package.detail.plot.meta': '{{area}} ha - Risk: {{risk}}',
  'workflow.package.detail.status.verified': 'Verified',
  'workflow.package.detail.status.pending': 'Pending',
  'workflow.package.detail.fpic.label': 'FPIC:',
  'workflow.package.detail.fpic.signed': 'Signed',
  'workflow.package.detail.labor.label': 'Labor:',
  'workflow.package.detail.labor.compliant': 'Compliant',
  'workflow.package.detail.season_year': 'Season / Year',
  'workflow.package.detail.season_value': 'Season {{season}} {{year}}',
  'workflow.package.detail.created': 'Created',
  'workflow.package.detail.updated': 'Last Updated',
  'workflow.package.detail.submitted_date': 'Submitted',
  'workflow.package.detail.quick_stats': 'Quick Stats',
  'workflow.package.detail.quick_stats.plots': 'Plots',
  'workflow.package.detail.quick_stats.total_ha': 'Total Ha',
  'workflow.package.detail.liability.modal_title': 'Liability Acknowledgement',
  'workflow.package.detail.liability.acknowledge': 'I Acknowledge',
  'workflow.package.detail.preflight.description.importer':
    'Resolve the following before submitting to TRACES: {{blockers}}',
  'workflow.package.detail.preflight.description.handoff':
    'Resolve the following before sealing or handing off: {{blockers}}',
  'workflow.package.detail.preflight.description.default':
    'Resolve the following before generating or submitting: {{blockers}}',
  'workflow.package.detail.submit.success.replayed': 'Submission replayed from idempotency cache.',
  'workflow.package.detail.submit.success.importer': 'DDS submitted to TRACES{{suffix}}.',
  'workflow.package.detail.submit.success.handoff': 'Downstream handoff submitted{{suffix}}.',
  'workflow.package.detail.submit.success.default': 'Package submitted{{suffix}}.',
  'workflow.package.detail.back_to_entity': 'Back to {{entity}}',
  'workflow.package.create.title.shipment': 'Create New Shipment',
  'workflow.package.create.title.package': 'Create New Package',
  'workflow.package.create.subtitle.exporter':
    'Select harvest vouchers and build a shipment package for importer handoff',
  'workflow.package.create.subtitle.importer':
    'Importer workspaces review upstream shipments; exporters and cooperatives create new shipment packages',
  'workflow.package.create.subtitle.default':
    'Select harvest vouchers to start a DDS package for EUDR compliance',
  'workflow.package.create.success.shipment':
    'Shipment package created from selected harvest vouchers.',
  'workflow.package.create.success.package': 'DDS package created from selected harvest vouchers.',
  'workflow.package.create.info.shipment': 'Shipment Information',
  'workflow.package.create.info.package': 'Package Information',
  'workflow.package.create.preview.shipment': 'Shipment Preview',
  'workflow.package.create.preview.package': 'Package Preview',
  'workflow.package.create.submit.creating': 'Creating...',
  'workflow.package.create.submit.shipment': 'Create Shipment',
  'workflow.package.create.submit.package': 'Create Package',
  'workflow.package.voucher.description.exporter':
    'Select verified harvest vouchers to bundle into this shipment for importer handoff',
  'workflow.package.voucher.description.importer':
    'Importer workspaces assemble upstream shipments; voucher selection is managed by exporters and cooperatives',
  'workflow.package.voucher.description.default':
    'Select verified harvest vouchers to include in this package',
  'workflow.package.voucher.loading': 'Loading harvest vouchers...',
  'workflow.package.voucher.empty.none': 'No harvest vouchers are available for this organisation yet.',
  'workflow.package.voucher.empty.upstream':
    'No eligible harvest vouchers are available. Capture harvests in the field app or show ineligible vouchers to review blockers before shipment assembly.',
  'workflow.package.voucher.empty.default':
    'No eligible harvest vouchers are available. Capture harvests in the field app or show ineligible vouchers to review blockers.',
  'workflow.package.assemble.breadcrumb': 'Assemble Shipment',
  'workflow.package.assemble.title': 'Assemble Shipment - {{code}}',
  'workflow.package.assemble.subtitle.importer': 'Review sealed shipment coverage before TRACES filing',
  'workflow.package.assemble.subtitle.exporter': 'Seal shipment and hand off to your importer for EU filing',
  'workflow.package.assemble.subtitle.default': 'Seal upstream shipment before downstream compliance filing',
  'workflow.package.assemble.sealed.importer':
    'This shipment is sealed ({{reference}}). Continue to compliance before TRACES filing.',
  'workflow.package.assemble.sealed.default':
    'This shipment is sealed ({{reference}}). Hand off to your importer for EU filing.',
  'workflow.package.assemble.seal_billing.exporter':
    'Sealing meters €1 origin usage for this month. Your importer pays €1 when they submit DDS to TRACES.',
  'workflow.package.assemble.seal_billing.default':
    'Sealing meters €1 origin usage for this month when you file to TRACES.',
  'workflow.package.assemble.loading': 'Loading shipment assembly…',
  'workflow.package.assemble.step.select.label': 'Select Batches',
  'workflow.package.assemble.step.select.hint': 'Confirm voucher packages',
  'workflow.package.assemble.step1.confirm': 'Step 1: Confirm {{batchLabel}}',
  'workflow.package.assemble.select_intro':
    'This package is always included. Add more voucher bundles if this shipment spans multiple batches.',
  'workflow.package.assemble.no_vouchers':
    'No harvest vouchers are linked to this package yet. Add vouchers from package creation before sealing.',
  'workflow.package.assemble.additional_batches': 'Additional batches (optional)',
  'workflow.package.assemble.lineage_total': 'Batch lineage total',
  'workflow.package.assemble.lineage_summary': '{{kg}} kg across {{count}} batch(es)',
  'workflow.package.assemble.step2.title': 'Step 2: Allocate Coverage to Shipment Lines',
  'workflow.package.assemble.allocate_intro':
    'Distribute batch lineage across shipment lines. Full line-level coverage editing ships with canonical shipment_lines.',
  'workflow.package.assemble.allocate_summary':
    '{{batches}} batch(es) · {{plots}} contributing plot(s) · {{kg}} kg in this shipment draft.',
  'workflow.package.assemble.declared_weight': 'Declared shipment weight (kg)',
  'workflow.package.assemble.weight_must_match': 'Must match the batch lineage total ({{kg}} kg).',
  'workflow.package.assemble.step3.title': 'Step 3: Validate Role Classification & Blocking Issues',
  'workflow.package.assemble.weight_match_ok':
    'Shipment weight matches batch lineage ({{kg}} kg).',
  'workflow.package.assemble.blockers_count':
    '{{count}} blocking readiness issue(s) on the primary package.',
  'workflow.package.assemble.seal.warning.exporter':
    'Sealing is binding. Exporters assume liability for the accuracy of shipment data before EU filing.',
  'workflow.package.assemble.seal.warning.cooperative':
    'Sealing is binding. Cooperative operators assume liability for the accuracy of shipment data before EU filing.',
  'workflow.package.assemble.seal.selected_batches': 'Selected batches',
  'workflow.package.assemble.seal.declared_weight': 'Declared shipment weight',
  'workflow.package.assemble.seal.first_free':
    'Your first shipment seal is free. Using it ends the 3-month subscription-free offer this month.',
  'workflow.package.assemble.liability.title': 'I acknowledge operator liability',
  'workflow.package.assemble.liability.body':
    'I confirm this shipment data is accurate, complete, and compliant with EUDR requirements.',
  'workflow.package.assemble.seal.confirm': 'I confirm I want to seal this shipment now',
  'workflow.package.assemble.seal.cta': 'Seal & Finalize Shipment',
  'workflow.package.assemble.seal.cta.progress': 'Sealing…',
  'workflow.package.assemble.seal.success':
    'Shipment sealed. €1 origin usage metered for this month. Continue to compliance for filing.',
  'workflow.package.assemble.seal.error': 'Failed to seal shipment.',
  'workflow.package.submit.breadcrumb.importer': 'Submit to TRACES',
  'workflow.package.submit.breadcrumb.default': 'Submit',
  'workflow.package.submit.route_prefix': 'Route enabled. Return to',
  'workflow.package.submit.route_suffix': 'to continue.',
  'workflow.package.compliance.breadcrumb': 'Compliance',
  'workflow.package.compliance.route_prefix': 'Route enabled. You can navigate back to',
  'workflow.package.edit.breadcrumb': 'Edit',
  'workflow.package.edit.route_prefix': 'Route enabled. Continue development from',
  'workflow.package.timeline.breadcrumb': 'Timeline',
  'workflow.assembly.back': 'Back',
  'workflow.assembly.cancel': 'Cancel',
  'workflow.assembly.next.allocate': 'Next: Allocate Coverage',
  'workflow.assembly.next.validate': 'Next: Validate Issues',
  'workflow.assembly.next.seal': 'Next: Seal Shipment',
  'workflow.assembly.shipment.step1.intro':
    'These voucher bundles are locked into this shipment. Edit batch membership from shipment settings before sealing.',
  'workflow.assembly.shipment.no_batches': 'No linked batches found. Add batches when creating the shipment.',
  'workflow.assembly.shipment.allocate_intro':
    'Map batch lineage to shipment lines before EU filing. Full line-level coverage editing ships with canonical shipment_headers.',
  'workflow.assembly.shipment.allocate_summary':
    '{{batches}} batch(es) · {{plots}} contributing plot(s) · {{kg}} kg batch lineage in this shipment draft.',
  'workflow.assembly.shipment.weight_match_ok':
    'Shipment weight matches batch lineage ({{kg}} kg).',
  'workflow.assembly.shipment.seal.declared_weight': 'Declared shipment weight',
  'workflow.assembly.shipment.seal.lineage_total': 'Batch lineage total',
  'workflow.assembly.shipment.seal.first_free':
    'Your first shipment seal is free. Using it ends the 3-month subscription-free offer this month — subscription billing starts next month.',
  'workflow.assembly.shipment.liability.title': 'I acknowledge operator liability for this EU shipment',
  'workflow.assembly.shipment.seal.confirm': 'I confirm I want to seal this shipment now',
  'workflow.assembly.shipment.seal.cta': 'Seal Shipment',
  'workflow.assembly.shipment.seal.cta.progress': 'Sealing…',
  'workflow.assembly.shipment.seal.success':
    'Shipment sealed. €1 origin usage metered for this month. Continue to compliance for filing.',
  'workflow.assembly.shipment.seal.error': 'Failed to seal shipment.',
  'workflow.package.submit.title.importer': 'Submit to TRACES',
  'workflow.package.submit.title.default': 'Submit {{entity}}',
  'workflow.package.submit.subtitle.importer': 'TRACES filing workflow for shipment {{id}}',
  'workflow.package.submit.subtitle.default': 'Downstream handoff workflow for {{entity}} {{id}}',
  'workflow.package.submit.card.importer': 'TRACES Submission Wizard',
  'workflow.package.submit.card.default': 'Submission Wizard',
  'workflow.package.submit.detail_link': '{{entity}} detail',
  'workflow.package.compliance.title.importer': 'Shipment Compliance',
  'workflow.package.compliance.title.default': '{{entity}} Compliance',
  'workflow.package.compliance.subtitle.importer': 'Declaration readiness review for shipment {{id}}',
  'workflow.package.compliance.subtitle.default': 'Compliance review for {{entity}} {{id}}',
  'workflow.package.compliance.card.importer': 'Declaration Readiness',
  'workflow.package.compliance.card.default': 'Compliance Detail',
  'workflow.package.edit.title': 'Edit {{entity}}',
  'workflow.package.edit.subtitle': 'Editing {{entityLower}} {{id}}',
  'workflow.package.edit.card': '{{entity}} Edit Form',
  'workflow.package.timeline.title': 'Timeline: {{code}}',
  'workflow.package.timeline.subtitle.shipment':
    'Complete audit history of shipment state changes and handoff events',
  'workflow.package.timeline.subtitle.package': 'Complete audit history of package state changes and events',
  'workflow.package.timeline.back': 'Back to {{entity}}',
  'workflow.package.timeline.audit.title.shipment': 'Shipment audit timeline',
  'workflow.package.timeline.audit.title.package': 'Package audit timeline',
  'workflow.package.timeline.audit.description.shipment':
    'Chronological history derived from shipment record updates',
  'workflow.package.timeline.audit.description.package':
    'Chronological history derived from package record updates',
  'workflow.package.table.search.shipment': 'Search shipments...',
  'workflow.package.table.search.package': 'Search packages...',
  'workflow.package.table.code_column': '{{entity}} Code',
  'workflow.package.table.empty.shipment': 'No shipments found',
  'workflow.package.table.empty.package': 'No packages found',
  'workflow.package.table.edit': 'Edit {{entity}}',
  'workflow.package.table.delete': 'Delete {{entity}}',
  'workflow.package.table.run_check.importer': 'Run Declaration Check',
  'workflow.package.table.run_check.default': 'Run Compliance Check',
  'workflow.shipment.flow_hint':
    'Harvest vouchers → Batch → Shipment. Batches preserve plot lineage; shipments are sealed for importer EU filing.',
  'workflow.shipment.new.subtitle.exporter':
    'Select batches (voucher packages) to combine into one shipment before sealing and importer handoff',
  'workflow.shipment.new.subtitle.cooperative':
    'Select member batches to combine into one cooperative shipment assembly',
  'workflow.shipment.new.subtitle.default':
    'Select batches (voucher packages) to combine into one EU-bound shipment',
  'workflow.shipment.batch_select.exporter':
    'Each batch is a voucher bundle from verified plots. Combine batches into this shipment before sealing and handoff to your importer.',
  'workflow.shipment.batch_select.cooperative':
    'Each batch bundles member harvest vouchers with plot lineage preserved. Combine batches before cooperative shipment assembly.',
  'workflow.shipment.batch_select.default':
    'Each batch is a voucher bundle from verified plots. Combine one or more batches into this shipment.',
  'workflow.shipment.no_batches.cooperative':
    'No eligible batches available. Record batch inputs from member harvest vouchers first.',
  'workflow.shipment.no_batches.default':
    'No eligible batches available. Create batches from harvest vouchers first.',
  'workflow.harvest.new.title': 'Record Batch Input',
  'workflow.harvest.new.subtitle.cooperative':
    'Capture member harvest weight against plot yield capacity before bundling into lineage-safe batches',
  'workflow.harvest.new.subtitle.exporter':
    'Capture aggregation weight against plot yield capacity before shipment assembly and importer handoff',
  'workflow.harvest.new.subtitle.default':
    'Capture aggregation weight against plot yield capacity for lot and batch tracking',
  'workflow.harvest.new.intake_alert':
    'Batch inputs are stored in your workspace audit trail when the backend is available, with a local fallback for offline yield checks. Field teams can later sync authoritative harvest vouchers from mobile capture.',
  'workflow.harvest.new.card_title': 'Batch intake details',
  'workflow.harvest.new.card_description.upstream':
    'Enter plot, origin, and weight data to validate capacity before batch bundling and shipment assembly.',
  'workflow.harvest.new.card_description.default':
    'Enter plot, producer, and weight data to validate capacity before shipment assembly.',
  'workflow.harvest.new.submit.saving': 'Saving...',
  'workflow.harvest.new.submit.default': 'Record batch input',
  'workflow.harvest.new.success.synced':
    'Batch input recorded and synced to your workspace audit trail',
  'workflow.harvest.new.success.local':
    'Batch input recorded locally (backend sync unavailable)',
  'workflow.harvest.new.breadcrumb': 'New',
  'workflow.harvest.detail.title': 'Batch Detail',
  'workflow.harvest.detail.subtitle': 'Batch identifier: {{id}}',
  'workflow.harvest.detail.card_title': 'Batch Record',
  'workflow.harvest.detail.placeholder':
    'Route enabled and ready for detailed batch lineage and yield data.',
  'workflow.dds.subtitle.importer':
    'Prepare and submit Due Diligence Statements to TRACES with canonical lifecycle states',
  'workflow.dds.subtitle.default': 'Review DDS package states — only importers submit to TRACES',
  'workflow.dds.preflight.importer': 'All checks must pass before you submit to TRACES NT',
  'workflow.dds.preflight.default': 'All checks must pass before your importer submits to TRACES NT',
  'workflow.dds.ready.importer':
    'All 7 checks passed. This DDS package is ready for submission to TRACES NT.',
  'workflow.dds.ready.default':
    'All 7 checks passed. Hand off to your importer for TRACES NT submission.',
  'workflow.evidence.title.short': 'Evidence',
  'workflow.evidence.title.fpic': 'FPIC Repository',
  'workflow.evidence.subtitle.importer':
    'Review, complete, and retain evidence for shipment and TRACES declaration defensibility',
  'workflow.evidence.subtitle.cooperative':
    'Manage consent, portability, and cooperative evidence with full provenance chain',
  'workflow.evidence.subtitle.default':
    'Manage Free Prior Informed Consent documents with full provenance chain',
  'workflow.compliance.plot.title.importer': 'Evidence-by-Evidence Readiness Analysis',
  'workflow.compliance.plot.title.default': 'Plot-by-Plot Compliance Analysis',
  'workflow.compliance.plot.subtitle.importer':
    'Detailed readiness assessment for all linked evidence records',
  'workflow.compliance.plot.subtitle.default': 'Detailed deforestation assessment for all plots',
  'workflow.compliance.plot.ready.importer':
    'This shipment is ready for EU filing. Proceed to submit your DDS to TRACES.',
  'workflow.compliance.plot.ready.default':
    'This shipment is ready to hand off to your importer for EU filing.',
  'workflow.dashboard.subtitle.exporter':
    'Assemble lineage-safe shipments and prepare handoff to your importer',
  'workflow.dashboard.subtitle.importer': 'Verify upstream evidence and submit EU due diligence (TRACES)',
  'workflow.dashboard.subtitle.cooperative':
    'Manage members, field operations, consent, portability, and cooperative governance',
  'workflow.dashboard.subtitle.reviewer':
    'Review and verify compliance submissions in your jurisdiction',
  'workflow.dashboard.subtitle.sponsor':
    'Govern network health, delegated admin scope, programme outcomes, and sponsored coverage',
  'workflow.dashboard.subtitle.default': 'Welcome to Tracebud',
  'workflow.package.create.validation.supplier_required': 'Supplier or cooperative name is required.',
  'workflow.package.create.validation.supplier_max': 'Supplier name must be {{max}} characters or fewer.',
  'workflow.package.create.validation.season': 'Season must be A or B.',
  'workflow.package.create.validation.year': 'Year must be between {{min}} and {{max}}.',
  'workflow.package.create.validation.notes_max': 'Notes must be {{max}} characters or fewer.',
  'workflow.package.create.validation.voucher.upstream':
    'Select at least one eligible harvest voucher before assembling a shipment.',
  'workflow.package.create.validation.voucher.default': 'Select at least one eligible harvest voucher.',
  'workflow.shipment.assemble_cta': 'Assemble & Seal',
  'workflow.shipment.status_title': 'Shipment status',
  'workflow.shipment.select_batches_title': 'Select Batches',
  'workflow.shipment.loading_batches': 'Loading batches…',
  'workflow.shipment.creating': 'Creating…',
  'workflow.shipment.create_and_assemble': 'Create & Assemble',
  'workflow.shipment.assemble_page_title': 'Assemble {{reference}}',
  'workflow.shipment.assemble_breadcrumb': 'Assemble',
  'workflow.shipment.back_to_shipment': 'Back to Shipment',
  'workflow.shipment.loading_assembly': 'Loading shipment assembly…',
  'workflow.shipment.step.included_batches': 'Included Batches',
  'workflow.shipment.step.included_batches_hint': 'Voucher packages in this shipment',
  'workflow.shipment.step.allocate_coverage': 'Allocate Coverage',
  'workflow.shipment.step.allocate_coverage_hint': 'Assign to shipment lines',
  'workflow.shipment.step.validate_issues': 'Validate Issues',
  'workflow.shipment.step.validate_issues_hint': 'Check blocking conditions',
  'workflow.shipment.step.seal': 'Seal Shipment',
  'workflow.shipment.step.seal_hint': 'Finalize before EU filing',
  'workflow.shipment.step1.included': 'Step 1: Included {{batchLabel}}',
  'workflow.shipment.step2.allocate': 'Step 2: Allocate Coverage',
  'workflow.shipment.step3.validate': 'Step 3: Validate Issues',
  'workflow.shipment.step4.seal': 'Step 4: Seal Shipment',
  'workflow.dds.title': 'DDS Workspace',
  'workflow.dds.new_package': 'New DDS Package',
  'workflow.dds.tab.packages': 'DDS Packages',
  'workflow.dds.tab.preflight': 'Pre-flight Checklist',
  'workflow.dds.tab.states': 'State Diagram',
  'workflow.dds.loading': 'Loading DDS packages...',
  'workflow.dds.preflight_score': 'Pre-flight Score',
  'workflow.dds.preflight.check.deforestation.name': 'Deforestation Check',
  'workflow.dds.preflight.check.deforestation.description': 'Verify no deforestation on or after cutoff date',
  'workflow.dds.preflight.check.degradation.name': 'Degradation Check',
  'workflow.dds.preflight.check.degradation.description': 'Verify no degradation on or after cutoff date',
  'workflow.dds.preflight.check.tenure.name': 'Tenure Check',
  'workflow.dds.preflight.check.tenure.description': 'Verify legitimate tenure or possession',
  'workflow.dds.preflight.check.protected_area.name': 'Protected Area Check',
  'workflow.dds.preflight.check.protected_area.description': 'Verify no protected areas involvement',
  'workflow.dds.preflight.check.fpic.name': 'FPIC Check',
  'workflow.dds.preflight.check.fpic.description': 'Verify Free Prior Informed Consent obtained',
  'workflow.dds.preflight.check.yield_capacity.name': 'Yield Capacity Check',
  'workflow.dds.preflight.check.yield_capacity.description': 'Verify production capacity & competence',
  'workflow.dds.preflight.check.data_completeness.name': 'Data Completeness',
  'workflow.dds.preflight.check.data_completeness.description': 'Verify all required fields populated',
  'workflow.evidence.upload_cta.importer': 'Upload evidence',
  'workflow.evidence.upload_cta.default': 'Upload document',
  'workflow.evidence.summary.total.importer': 'Total evidence records',
  'workflow.evidence.summary.total.cooperative': 'Total evidence files',
  'workflow.evidence.summary.total.default': 'Total documents',
  'workflow.evidence.summary.verified': 'Verified',
  'workflow.evidence.summary.pending.importer': 'Pending review',
  'workflow.evidence.summary.pending.cooperative': 'Consent review queue',
  'workflow.evidence.summary.renewal.cooperative': 'Consent renewal due',
  'workflow.evidence.summary.renewal.default': 'Renewal due',
  'workflow.evidence.summary.expired': 'Expired',
  'workflow.evidence.search.importer':
    'Search by evidence title, shipment reference, partner, or hash...',
  'workflow.evidence.search.cooperative':
    'Search by member, plot, shipment, consent artifact, or hash...',
  'workflow.evidence.search.default': 'Search by name, farmer, community, or hash...',
  'workflow.evidence.filter.status': 'Status:',
  'workflow.evidence.filter.all': 'All',
  'workflow.evidence.filter.verified': 'Verified',
  'workflow.evidence.filter.pending': 'Pending',
  'workflow.evidence.filter.renewal': 'Renewal',
  'workflow.evidence.filter.expired': 'Expired',
  'workflow.evidence.loading': 'Loading evidence records...',
  'workflow.evidence.empty.importer': 'No evidence records match your filters',
  'workflow.evidence.empty.default': 'No documents match your filters',
  'workflow.evidence.doc_type.community_minutes': 'Community Minutes',
  'workflow.evidence.doc_type.consent_form': 'Consent Form',
  'workflow.evidence.doc_type.agreement': 'Agreement',
  'workflow.evidence.doc_type.affidavit': 'Affidavit',
  'workflow.evidence.uploaded': 'Uploaded:',
  'workflow.evidence.expires': 'Expires:',
  'workflow.evidence.uploader': 'Uploader',
  'workflow.evidence.hash_full': 'Full SHA-256 Hash',
  'workflow.evidence.linked_entities': 'Linked entities',
  'workflow.evidence.review_history': 'Review history',
  'workflow.evidence.view_full': 'View full document',
  'workflow.evidence.delete': 'Delete',
  'workflow.evidence.upload.page.title': 'Upload FPIC Evidence',
  'workflow.evidence.upload.page.subtitle':
    'Submit consent and supporting documents for FPIC review',
  'workflow.evidence.upload.breadcrumb': 'Upload',
  'workflow.evidence.upload.back': 'Back to FPIC',
  'workflow.evidence.upload.form_title': 'FPIC Upload',
  'workflow.evidence.upload.placeholder':
    'This route is active and ready for upload form wiring.',
  'workflow.dds.new.title': 'New DDS Package',
  'workflow.dds.new.subtitle': 'Create a new deforestation due diligence package',
  'workflow.dds.new.breadcrumb': 'New',
  'workflow.dds.new.back': 'Back to DDS Workspace',
  'workflow.dds.new.form_title': 'DDS Creation Form',
  'workflow.dds.new.placeholder': 'This route is now live and ready for form implementation.',
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
  return WORKFLOW_LABELS[key] ?? key;
}

function wf(
  key: string,
  fallback: string,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const resolved = resolveLabel(key, t);
  const text = resolved === key ? fallback : resolved;
  return values ? interpolate(text, values) : text;
}

function usesShipmentWorkflowLanguage(role?: SupplyChainRole): boolean {
  return role === 'importer' || role === 'exporter' || role === 'cooperative';
}

export function getWorkflowOperationsNavLabel(t?: TranslateFn): string {
  return wf('workflow.nav.operations', 'Operations', t);
}

export function getWorkflowComplianceNavLabel(t?: TranslateFn): string {
  return wf('workflow.nav.compliance', 'Compliance', t);
}

export function getWorkflowIssuesNavLabel(t?: TranslateFn): string {
  return wf('workflow.nav.issues', 'Issues', t);
}

export function getPackagesPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  if (usesShipmentWorkflowLanguage(role)) {
    return wf('workflow.packages.title.shipments', en.getPackagesPageTitle(role), t);
  }
  return wf('workflow.packages.title.dds', en.getPackagesPageTitle(role), t);
}

export function getPackagesPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.packages.subtitle.importer'
      : role === 'exporter'
        ? 'workflow.packages.subtitle.exporter'
        : role === 'cooperative'
          ? 'workflow.packages.subtitle.cooperative'
          : 'workflow.packages.subtitle.default';
  return wf(key, en.getPackagesPageSubtitle(role), t);
}

export function getNewPackageCtaLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  if (usesShipmentWorkflowLanguage(role)) {
    return wf('workflow.packages.cta.new_shipment', en.getNewPackageCtaLabel(role), t);
  }
  return wf('workflow.packages.cta.new_package', en.getNewPackageCtaLabel(role), t);
}

export function getMyPackagesTabLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'importer') {
    return wf('workflow.packages.tab.my_shipments', en.getMyPackagesTabLabel(role), t);
  }
  return wf('workflow.packages.tab.my_packages', en.getMyPackagesTabLabel(role), t);
}

export function getSharedPackagesTabLabel(role?: SupplyChainRole, count = 0, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.packages.tab.shared_shipments' : 'workflow.packages.tab.shared_with_me';
  return wf(key, en.getSharedPackagesTabLabel(role, count), t, { count });
}

export function getPackagesLoadingMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.packages.loading.shipments'
    : 'workflow.packages.loading.packages';
  return wf(key, en.getPackagesLoadingMessage(role), t);
}

export function getCompliancePageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.compliance.title.cooperative'
      : role === 'importer'
        ? 'workflow.compliance.title.importer'
        : 'workflow.compliance.title.default';
  return wf(key, en.getCompliancePageTitle(role), t);
}

export function getCompliancePageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.compliance.subtitle.cooperative'
      : role === 'importer'
        ? 'workflow.compliance.subtitle.importer'
        : 'workflow.compliance.subtitle.default';
  return wf(key, en.getCompliancePageSubtitle(role), t);
}

export function getComplianceBackLinkLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.compliance.back.shipment' : 'workflow.compliance.back.package';
  return wf(key, en.getComplianceBackLinkLabel(role), t);
}

export function getComplianceHubEmptyHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.compliance.hub_empty.importer' : 'workflow.compliance.hub_empty.default';
  return wf(key, en.getComplianceHubEmptyHint(role), t);
}

export function getComplianceOverviewTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.compliance.overview.shipment' : 'workflow.compliance.overview.package';
  return wf(key, en.getComplianceOverviewTitle(role), t);
}

export function getComplianceBlockerAlertTail(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.compliance.blocker_tail.importer' : 'workflow.compliance.blocker_tail.default';
  return wf(key, en.getComplianceBlockerAlertTail(role), t);
}

export function getComplianceReadinessEmptyHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.readiness_empty.importer'
      : 'workflow.compliance.readiness_empty.default';
  return wf(key, en.getComplianceReadinessEmptyHint(role), t);
}

export function getComplianceNoReasonCodesMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.no_reason_codes.importer'
      : 'workflow.compliance.no_reason_codes.default';
  return wf(key, en.getComplianceNoReasonCodesMessage(role), t);
}

export function getPackageDetailBackLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    usesShipmentWorkflowLanguage(role)
      ? 'workflow.compliance.back_to_list.shipments'
      : role === 'importer'
        ? 'workflow.compliance.back_to_list.shipments'
        : 'workflow.compliance.back_to_list.dds',
    en.getPackageDetailBackLabel(role),
    t,
  );
}

export function getIssuesPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' || role === 'cooperative'
      ? 'workflow.issues.title.short'
      : 'workflow.issues.title.default';
  return wf(key, en.getIssuesPageTitle(role), t);
}

export function getIssuesPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.issues.subtitle.importer'
      : role === 'cooperative'
        ? 'workflow.issues.subtitle.cooperative'
        : 'workflow.issues.subtitle.default';
  return wf(key, en.getIssuesPageSubtitle(role), t);
}

export function getIssuesCreateButtonLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.issues.create.exception'
      : role === 'cooperative'
        ? 'workflow.issues.create.cooperative'
        : 'workflow.issues.create.default';
  return wf(key, en.getIssuesCreateButtonLabel(role), t);
}

export function getIssuesCreateDialogTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.issues.dialog.title.importer'
      : role === 'cooperative'
        ? 'workflow.issues.dialog.title.cooperative'
        : 'workflow.issues.dialog.title.default';
  return wf(key, en.getIssuesCreateDialogTitle(role), t);
}

export function getIssuesCreateDialogDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.issues.dialog.description.importer'
      : role === 'cooperative'
        ? 'workflow.issues.dialog.description.cooperative'
        : 'workflow.issues.dialog.description.default';
  return wf(key, en.getIssuesCreateDialogDescription(role), t);
}

export function getIssuesLinkedEntityShipmentLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.issues.linked_entity.shipment' : 'workflow.issues.linked_entity.package';
  return wf(key, en.getIssuesLinkedEntityShipmentLabel(role), t);
}

export function getComplianceQueuePageTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.title', 'Compliance Issues Queue', t);
}

export function getComplianceQueuePageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.queue.subtitle',
    'Review and resolve compliance issues sorted by severity and SLA',
    t,
  );
}

export function getComplianceQueueBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.breadcrumb', 'Issues Queue', t);
}

export function buildComplianceQueueBreadcrumbs(t?: TranslateFn): WorkflowBreadcrumb[] {
  return [
    { label: getDashboardBreadcrumbLabel(t), href: '/' },
    { label: getWorkflowComplianceNavLabel(t) },
    { label: getComplianceQueueBreadcrumbLabel(t) },
  ];
}

export function getComplianceQueueStatusLabel(
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED',
  t?: TranslateFn,
): string {
  const keyMap = {
    OPEN: 'workflow.compliance.queue.status.open',
    IN_PROGRESS: 'workflow.compliance.queue.status.in_progress',
    RESOLVED: 'workflow.compliance.queue.status.resolved',
    ESCALATED: 'workflow.compliance.queue.status.escalated',
  } as const;
  const fallbackMap = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    ESCALATED: 'Escalated',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getComplianceQueueStatLabel(
  stat: 'blocking' | 'pending' | 'critical_sla' | 'total',
  t?: TranslateFn,
): string {
  const keyMap = {
    blocking: 'workflow.compliance.queue.stat.blocking',
    pending: 'workflow.compliance.queue.stat.pending',
    critical_sla: 'workflow.compliance.queue.stat.critical_sla',
    total: 'workflow.compliance.queue.stat.total',
  } as const;
  const fallbackMap = {
    blocking: 'Blocking Issues',
    pending: 'Packages Pending',
    critical_sla: 'Critical SLA',
    total: 'Total in Queue',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getComplianceQueueFiltersLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.filters', 'Filters', t);
}

export function getComplianceQueueFilterGroupLabel(
  group: 'status' | 'risk' | 'severity',
  t?: TranslateFn,
): string {
  const keyMap = {
    status: 'workflow.compliance.queue.filter.status',
    risk: 'workflow.compliance.queue.filter.risk',
    severity: 'workflow.compliance.queue.filter.severity',
  } as const;
  const fallbackMap = { status: 'Status:', risk: 'Risk:', severity: 'Severity:' } as const;
  return wf(keyMap[group], fallbackMap[group], t);
}

export function getComplianceQueueFilterAllLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.filter.all', 'all', t);
}

export function getComplianceQueueLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.loading', 'Loading compliance queue...', t);
}

export function getComplianceQueueEmptyMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.empty', 'No packages match the selected filters', t);
}

export function getComplianceQueueReviewIssuesLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.review_issues', 'Review Issues', t);
}

export function getComplianceQueueRiskSuffixLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.queue.risk_suffix', 'Risk', t);
}

export function getProducersNavLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const name = role === 'cooperative' ? 'Members' : 'Producers';
  return translateNavItemName(name, t ?? ((key) => key));
}

export function getProducersPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.producers.title.cooperative' : 'workflow.producers.title.default';
  return wf(key, role === 'cooperative' ? 'Members' : 'Producers', t);
}

export function getProducersPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.producers.subtitle.cooperative' : 'workflow.producers.subtitle.default';
  return wf(
    key,
    role === 'cooperative'
      ? 'Manage member identities, consent status, and linked plot portfolios'
      : 'Manage producer identities, onboarding status, and linked plot portfolios',
    t,
  );
}

export function getAddProducerCtaLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.producers.cta.add.cooperative' : 'workflow.producers.cta.add.default';
  return wf(key, role === 'cooperative' ? 'Add Member' : 'Add Producer', t);
}

export function getProducerComplianceLabel(
  status: 'compliant' | 'non_compliant' | 'partial',
  t?: TranslateFn,
): string {
  const keyMap = {
    compliant: 'workflow.producers.compliance.compliant',
    non_compliant: 'workflow.producers.compliance.non_compliant',
    partial: 'workflow.producers.compliance.partial',
  } as const;
  const fallbackMap = {
    compliant: 'Compliant',
    non_compliant: 'Non-Compliant',
    partial: 'Partial',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getProducerNewPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.producers.new.title.cooperative' : 'workflow.producers.new.title.default';
  return wf(key, role === 'cooperative' ? 'Add Member' : 'Add Producer', t);
}

export function getProducerNewPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.producers.new.subtitle.cooperative' : 'workflow.producers.new.subtitle.default';
  return wf(
    key,
    role === 'cooperative'
      ? 'Register a member in your cooperative directory'
      : 'Register a producer in your upstream directory',
    t,
  );
}

export function getProducerNewBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.producers.new.breadcrumb', 'Add', t);
}

export function getBackToProducersLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.producers.back.cooperative' : 'workflow.producers.back.default';
  return wf(key, role === 'cooperative' ? 'Back to members' : 'Back to producers', t);
}

export function getProducerDetailFallbackTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.producers.detail.fallback.cooperative'
      : 'workflow.producers.detail.fallback.default';
  return wf(key, role === 'cooperative' ? 'Member' : 'Producer', t);
}

export function getProducerLoadingMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.producers.detail.loading.cooperative'
      : 'workflow.producers.detail.loading.default';
  return wf(key, role === 'cooperative' ? 'Loading member…' : 'Loading producer…', t);
}

export function getProducerNotFoundMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.producers.detail.not_found.cooperative'
      : 'workflow.producers.detail.not_found.default';
  return wf(
    key,
    role === 'cooperative'
      ? 'Member contact not found in your directory.'
      : 'Producer contact not found in your directory.',
    t,
  );
}

function producerRoleKey(role: SupplyChainRole | null | undefined, cooperativeKey: string, defaultKey: string): string {
  return role === 'cooperative' ? cooperativeKey : defaultKey;
}

export function getProducersFiltersLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filters', 'Filters', t);
}

export function getProducersStatTotalLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.stat.total.cooperative', 'workflow.producers.stat.total.default'),
    role === 'cooperative' ? 'Total Members' : 'Total Producers',
    t,
  );
}

export function getProducersSearchPlaceholder(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.search.cooperative', 'workflow.producers.search.default'),
    role === 'cooperative'
      ? 'Search by member name, email, or cooperative...'
      : 'Search by producer name, email, or cooperative...',
    t,
  );
}

export function getProducersTableTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.table.title.cooperative', 'workflow.producers.table.title.default'),
    role === 'cooperative' ? 'Registered Members' : 'Registered Producers',
    t,
  );
}

export function getProducersEmptyNoneMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.empty.none.cooperative', 'workflow.producers.empty.none.default'),
    role === 'cooperative'
      ? 'No members yet. Add your first member to start building your directory.'
      : 'No producers yet. Add your first producer to start building your upstream directory.',
    t,
  );
}

export function getProducersEmptyFilterMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.empty.filter.cooperative', 'workflow.producers.empty.filter.default'),
    role === 'cooperative' ? 'No members match your search or filters.' : 'No producers match your search or filters.',
    t,
  );
}

export function getProducersEmptyCtaLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.empty.cta.cooperative', 'workflow.producers.empty.cta.default'),
    role === 'cooperative' ? 'Add first member' : 'Add first producer',
    t,
  );
}

export function getProducersStatTotalHint(t?: TranslateFn): string {
  return wf('workflow.producers.stat.total_hint', 'Active in directory', t);
}

export function getProducersStatCompliantLabel(t?: TranslateFn): string {
  return wf('workflow.producers.stat.compliant', 'Compliant', t);
}

export function getProducersStatCompliantHint(t?: TranslateFn): string {
  return wf('workflow.producers.stat.compliant_hint', 'All requirements met', t);
}

export function getProducersStatPartialLabel(t?: TranslateFn): string {
  return wf('workflow.producers.stat.partial', 'Partial Compliance', t);
}

export function getProducersStatPartialHint(t?: TranslateFn): string {
  return wf('workflow.producers.stat.partial_hint', 'Some requirements pending', t);
}

export function getProducersStatFpicLabel(t?: TranslateFn): string {
  return wf('workflow.producers.stat.fpic', 'With FPIC Consent', t);
}

export function getProducersStatFpicHint(t?: TranslateFn): string {
  return wf('workflow.producers.stat.fpic_hint', 'Consent granted', t);
}

export function getProducersFilterDialogTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(role, 'workflow.producers.filter.title.cooperative', 'workflow.producers.filter.title.default'),
    role === 'cooperative' ? 'Filter members' : 'Filter producers',
    t,
  );
}

export function getProducersFilterDialogDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    producerRoleKey(
      role,
      'workflow.producers.filter.description.cooperative',
      'workflow.producers.filter.description.default',
    ),
    role === 'cooperative'
      ? 'Narrow the member directory by compliance, consent, and onboarding status.'
      : 'Narrow the producer directory by compliance, consent, and onboarding status.',
    t,
  );
}

export function getPlotsPageTitle(t?: TranslateFn): string {
  return wf('workflow.plots.title', 'Plots', t);
}

export function getPlotsNavLabel(t?: TranslateFn): string {
  return translateNavItemName('Plots', t ?? ((key) => key));
}

export function getPlotsPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.plots.subtitle.cooperative' : 'workflow.plots.subtitle.default';
  return wf(
    key,
    role === 'cooperative'
      ? 'Track member plot coverage, geometry quality, and compliance risk with field-capture overlays'
      : 'Manage plot inventory and deforestation risk assessments',
    t,
  );
}

function plotRoleKey(role: SupplyChainRole | null | undefined, cooperativeKey: string, defaultKey: string): string {
  return role === 'cooperative' ? cooperativeKey : defaultKey;
}

export function getPlotsSearchPlaceholder(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    plotRoleKey(role, 'workflow.plots.search.cooperative', 'workflow.plots.search.default'),
    role === 'cooperative'
      ? 'Search by plot name, ID, or member-linked records...'
      : 'Search by plot name or ID...',
    t,
  );
}

export function getPlotsTableTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    plotRoleKey(role, 'workflow.plots.table.title.cooperative', 'workflow.plots.table.title.default'),
    role === 'cooperative' ? 'Plot Registry and Capture Quality' : 'Plot Inventory',
    t,
  );
}

export function getPlotsOriginColumnLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    plotRoleKey(role, 'workflow.plots.table.origin.cooperative', 'workflow.plots.table.origin.default'),
    role === 'cooperative' ? 'Member' : 'Producer',
    t,
  );
}

export function getPlotsEmptyMessage(t?: TranslateFn): string {
  return wf('workflow.plots.empty', 'No plots found', t);
}

export function getPlotsAddCtaLabel(t?: TranslateFn): string {
  return wf('workflow.plots.cta.add', 'Add Plot', t);
}

export function getPlotsFiltersLabel(t?: TranslateFn): string {
  return wf('workflow.plots.cta.filters', 'Filters', t);
}

export function getPlotsStatLabel(
  stat: 'total' | 'low' | 'medium' | 'high',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const keyMap = {
    total: 'workflow.plots.stat.total',
    low: plotRoleKey(role, 'workflow.plots.stat.low.cooperative', 'workflow.plots.stat.low.default'),
    medium: plotRoleKey(role, 'workflow.plots.stat.medium.cooperative', 'workflow.plots.stat.medium.default'),
    high: plotRoleKey(role, 'workflow.plots.stat.high.cooperative', 'workflow.plots.stat.high.default'),
  } as const;
  const fallbackMap = {
    total: 'Total Plots',
    low: role === 'cooperative' ? 'Mapped & Low Risk' : 'Low Risk',
    medium: role === 'cooperative' ? 'Needs Field Review' : 'Medium Risk',
    high: role === 'cooperative' ? 'Blocked / High Risk' : 'High Risk',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getPlotsStatHint(
  stat: 'total' | 'low' | 'medium' | 'high',
  role?: SupplyChainRole,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  if (stat === 'total') {
    return wf('workflow.plots.stat.total_ha', '{{ha}} hectares total', t, values);
  }
  const keyMap = {
    low: plotRoleKey(role, 'workflow.plots.stat.low_hint.cooperative', 'workflow.plots.stat.low_hint.default'),
    medium: plotRoleKey(
      role,
      'workflow.plots.stat.medium_hint.cooperative',
      'workflow.plots.stat.medium_hint.default',
    ),
    high: plotRoleKey(role, 'workflow.plots.stat.high_hint.cooperative', 'workflow.plots.stat.high_hint.default'),
  } as const;
  const fallbackMap = {
    low: role === 'cooperative' ? 'Ready for batch lineage inclusion' : 'Ready for compliance',
    medium: role === 'cooperative' ? 'Geometry/legal checks pending' : 'Requires review',
    high: role === 'cooperative' ? 'Escalate to issues and appeals' : 'Action needed',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t, values);
}

export function getPlotDeforestationRiskLabel(
  risk: 'low' | 'medium' | 'high' | 'unknown',
  t?: TranslateFn,
): string {
  const keyMap = {
    low: 'workflow.plots.risk.low',
    medium: 'workflow.plots.risk.medium',
    high: 'workflow.plots.risk.high',
    unknown: 'workflow.plots.risk.unknown',
  } as const;
  const fallbackMap = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    unknown: 'Unknown Risk',
  } as const;
  return wf(keyMap[risk], fallbackMap[risk], t);
}

export function getPlotDetailPageTitle(t?: TranslateFn): string {
  return wf('workflow.plots.detail.title', 'Plot Detail', t);
}

export function getPlotDetailPageSubtitle(id: string, t?: TranslateFn): string {
  return wf('workflow.plots.detail.subtitle', `Plot identifier: ${id}`, t, { id });
}

export type WorkflowAsyncCopyScope =
  | 'crm.prospects'
  | 'crm.templates'
  | 'crm.daily_actions'
  | 'content.calendar'
  | 'content.tasks'
  | 'content.review'
  | 'issues.detail';

export function getWorkflowAsyncStateCopy(
  scope: WorkflowAsyncCopyScope,
  mode: 'loading' | 'error' | 'empty',
  t?: TranslateFn,
): { title: string; description?: string } {
  const titleKey = `workflow.async.${scope}.${mode}`;
  const hintKey = `workflow.async.${scope}.${mode}_hint`;
  const fallbackTitles: Record<WorkflowAsyncCopyScope, Record<'loading' | 'error' | 'empty', string>> = {
    'crm.prospects': {
      loading: 'Loading prospects...',
      error: 'Failed to load prospects',
      empty: 'No prospects yet',
    },
    'crm.templates': {
      loading: 'Loading templates...',
      error: 'Failed to load templates',
      empty: 'No templates found',
    },
    'crm.daily_actions': {
      loading: 'Loading daily actions...',
      error: 'Failed to load daily actions',
      empty: 'No actions for this day',
    },
    'content.calendar': {
      loading: 'Loading content calendar...',
      error: 'Failed to load content calendar',
      empty: 'No content scheduled yet',
    },
    'content.tasks': {
      loading: 'Loading content tasks...',
      error: 'Failed to load content tasks',
      empty: 'No content tasks yet',
    },
    'content.review': {
      loading: 'Loading review data...',
      error: 'Failed to load review data',
      empty: 'No review items pending',
    },
    'issues.detail': {
      loading: 'Loading issue...',
      error: 'Failed to load issue',
      empty: 'Issue not found',
    },
  };
  const fallbackHints: Partial<Record<WorkflowAsyncCopyScope, string>> = {
    'crm.prospects': 'Add leads from website forms or manual research.',
    'crm.templates': 'Adjust your filter or seed template data.',
    'crm.daily_actions': 'Try another date or generate actions in Supabase.',
    'content.calendar': 'Add calendar items to see publishing rhythm.',
    'content.tasks': 'Generate tasks from cadence settings.',
    'content.review': 'Draft and scheduled content will appear here.',
    'issues.detail': 'Return to the issues list or open the issue from compliance workflows.',
  };
  const title = wf(titleKey, fallbackTitles[scope][mode], t);
  if (mode !== 'empty') {
    return { title };
  }
  const description = wf(hintKey, fallbackHints[scope] ?? '', t);
  return description ? { title, description } : { title };
}

export function buildPlotReviewBreadcrumbs(t?: TranslateFn): WorkflowBreadcrumb[] {
  return [
    { label: getDashboardBreadcrumbLabel(t), href: '/' },
    { label: getWorkflowComplianceNavLabel(t), href: '/compliance' },
    { label: getPlotReviewBreadcrumbLabel(t) },
  ];
}

export function getPlotReviewPageTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.title', 'Plot review queue', t);
}

export function getPlotReviewPageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot_review.subtitle',
    'Adjudicate satellite flags, overlap risk, and ground-truth evidence before plots clear to compliant',
    t,
  );
}

export function getPlotReviewBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.breadcrumb', 'Plot review', t);
}

export function getPlotReviewStatusLabel(status: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    under_review: 'workflow.compliance.plot_review.status.under_review',
    degradation_risk: 'workflow.compliance.plot_review.status.degradation_risk',
    deforestation_detected: 'workflow.compliance.plot_review.status.deforestation_detected',
  };
  const fallbackMap: Record<string, string> = {
    under_review: 'Under review',
    degradation_risk: 'Overlap risk',
    deforestation_detected: 'Deforestation flagged',
  };
  const key = keyMap[status];
  if (!key) return status;
  return wf(key, fallbackMap[status] ?? status, t);
}

export function getPlotReviewStatLabel(
  stat: 'awaiting' | 'high_priority' | 'auto_clear',
  t?: TranslateFn,
): string {
  const keyMap = {
    awaiting: 'workflow.compliance.plot_review.stat.awaiting',
    high_priority: 'workflow.compliance.plot_review.stat.high_priority',
    auto_clear: 'workflow.compliance.plot_review.stat.auto_clear',
  } as const;
  const fallbackMap = {
    awaiting: 'Plots awaiting review',
    high_priority: 'High priority',
    auto_clear: 'Auto-clearance eligible',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getPlotReviewScreeningTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.screening.title', 'GFW screening explainability', t);
}

export function getPlotReviewScreeningMetricLabel(
  metric: 'integrated_alerts' | 'tree_cover' | 'hansen_loss' | 'natural_forest',
  t?: TranslateFn,
): string {
  const keyMap = {
    integrated_alerts: 'workflow.compliance.plot_review.screening.integrated_alerts',
    tree_cover: 'workflow.compliance.plot_review.screening.tree_cover',
    hansen_loss: 'workflow.compliance.plot_review.screening.hansen_loss',
    natural_forest: 'workflow.compliance.plot_review.screening.natural_forest',
  } as const;
  const fallbackMap = {
    integrated_alerts: 'Integrated alerts',
    tree_cover: 'Tropical tree cover (avg)',
    hansen_loss: 'Hansen loss (post-cutoff)',
    natural_forest: 'Natural forest overlap',
  } as const;
  return wf(keyMap[metric], fallbackMap[metric], t);
}

export function getPlotReviewTenureBanner(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot_review.tenure_banner',
    'Producer-in-possession tenure files with low AI confidence route to the tenure document review queue.',
    t,
  );
}

export function getPlotReviewTenureCta(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.tenure_cta', 'Open tenure review queue', t);
}

export function getPlotReviewLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.loading', 'Loading plot review queue…', t);
}

export function getPlotReviewEmptyMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.empty', 'No plots currently require compliance review.', t);
}

export function getPlotReviewOpenPlotLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.open_plot', 'Open plot', t);
}

export function getPlotReviewUpholdBlockLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.uphold_block', 'Uphold block', t);
}

export function getPlotReviewClearCompliantLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.clear_compliant', 'Clear to compliant', t);
}

export function getPlotReviewYesNoLabel(value: boolean, t?: TranslateFn): string {
  return wf(
    value ? 'workflow.compliance.plot_review.yes' : 'workflow.compliance.plot_review.no',
    value ? 'yes' : 'no',
    t,
  );
}

export function getPlotReviewPriorityBadgeLabel(priority: string, t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.priority_suffix', `${priority} priority`, t, { priority });
}

export function getPlotReviewAutoClearBadgeLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.auto_clear_badge', 'Auto-clear eligible', t);
}

export function getPlotReviewOverlapTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.overlap.title', 'Overlap signals', t);
}

export function getPlotReviewOverlapSummary(
  sinaphOverlap: boolean,
  indigenousOverlap: boolean,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.compliance.plot_review.overlap.summary',
    `SINAPH overlap: ${sinaphOverlap ? 'yes' : 'no'} · Indigenous overlap: ${indigenousOverlap ? 'yes' : 'no'}`,
    t,
    { sinaph: getPlotReviewYesNoLabel(sinaphOverlap, t), indigenous: getPlotReviewYesNoLabel(indigenousOverlap, t) },
  );
}

export function getPlotReviewPhotosTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.photos.title', 'Ground-truth photos', t);
}

export function getPlotReviewPhotosSummary(
  verified: number,
  required: number,
  geo: number,
  timestamp: number,
  cutoff: string,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.compliance.plot_review.photos.summary',
    `${verified}/${required} clearance-verified (${geo} on-plot, ${timestamp} after ${cutoff})`,
    t,
    { verified, required, geo, timestamp, cutoff },
  );
}

export function getPlotReviewPhotosEmptyMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.photos.empty', 'No synced photo batch yet.', t);
}

export function getPlotReviewScreeningAlertTierLabel(tier: string, t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.screening.alert_tier', `Alert tier: ${tier}`, t, { tier });
}

export function getPlotReviewScreeningContextAdjustedLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.screening.context_adjusted', 'Context-adjusted', t);
}

export function getPlotReviewScreeningHitsHaLabel(
  count: number | string,
  area: string,
  t?: TranslateFn,
): string {
  return wf('workflow.compliance.plot_review.screening.hits_ha', `${count} hits · ${area}`, t, {
    count,
    area,
  });
}

export function getPlotReviewScreeningLastScreenedLabel(date: string, t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.screening.last_screened', `Last screened ${date}`, t, { date });
}

export function getPlotReviewScreeningDatasetLabel(
  dataset: string,
  ok: boolean,
  error?: string | null,
  t?: TranslateFn,
): string {
  if (ok) {
    return wf('workflow.compliance.plot_review.screening.dataset_ok', `${dataset}: ok`, t, { dataset });
  }
  if (error) {
    return wf('workflow.compliance.plot_review.screening.dataset_error', `${dataset}: ${error}`, t, {
      dataset,
      error,
    });
  }
  return wf('workflow.compliance.plot_review.screening.dataset_failed', `${dataset}: failed`, t, { dataset });
}

export function getPlotReviewProducerFallback(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.producer_fallback', 'Producer', t);
}

export function getPlotReviewAreaNaLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.area_na', 'Area n/a', t);
}

export function getPlotReviewDialogTitle(action: 'clear' | 'uphold', t?: TranslateFn): string {
  const key =
    action === 'clear'
      ? 'workflow.compliance.plot_review.dialog.clear_title'
      : 'workflow.compliance.plot_review.dialog.uphold_title';
  return wf(key, action === 'clear' ? 'Clear plot review' : 'Uphold plot block', t);
}

export function getPlotReviewDialogDescription(name: string, status: string, t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot_review.dialog.description',
    `${name} — ${status}. This decision is audited.`,
    t,
    { name, status },
  );
}

export function getPlotReviewDialogReasonLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.dialog.reason_label', 'Reason', t);
}

export function getPlotReviewDialogReasonPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot_review.dialog.reason_placeholder',
    'Explain the evidence reviewed and why this outcome is justified.',
    t,
  );
}

export function getPlotReviewDialogCancelLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.dialog.cancel', 'Cancel', t);
}

export function getPlotReviewDialogSavingLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.dialog.saving', 'Saving…', t);
}

export function getPlotReviewDialogConfirmLabel(action: 'clear' | 'uphold', t?: TranslateFn): string {
  const key =
    action === 'clear'
      ? 'workflow.compliance.plot_review.dialog.confirm_clear'
      : 'workflow.compliance.plot_review.dialog.confirm_uphold';
  return wf(key, action === 'clear' ? 'Confirm clearance' : 'Confirm uphold', t);
}

export function getPlotReviewReasonMinLengthMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot_review.reason_min_length',
    'Enter a reason with at least 8 characters.',
    t,
  );
}

export function getPlotReviewDecisionFailedMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.plot_review.decision_failed', 'Decision failed.', t);
}

export function buildTenureReviewBreadcrumbs(t?: TranslateFn): WorkflowBreadcrumb[] {
  return [
    { label: getDashboardBreadcrumbLabel(t), href: '/' },
    { label: getWorkflowComplianceNavLabel(t), href: '/compliance' },
    { label: getTenureReviewBreadcrumbLabel(t) },
  ];
}

export function getTenureReviewPageTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.title', 'Tenure document review', t);
}

export function getTenureReviewPageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.subtitle',
    'Confirm AI tenure extractions for producer-in-possession and informal land evidence',
    t,
  );
}

export function getTenureReviewBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.breadcrumb', 'Tenure review', t);
}

export function getTenureReviewStatLabel(
  stat: 'awaiting' | 'manual' | 'failed',
  t?: TranslateFn,
): string {
  const keyMap = {
    awaiting: 'workflow.compliance.tenure_review.stat.awaiting',
    manual: 'workflow.compliance.tenure_review.stat.manual',
    failed: 'workflow.compliance.tenure_review.stat.failed',
  } as const;
  const fallbackMap = {
    awaiting: 'Documents awaiting review',
    manual: 'Manual review required',
    failed: 'Parse failed',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getTenureReviewLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.loading', 'Loading tenure review queue…', t);
}

export function getTenureReviewEmptyMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.empty',
    'No tenure documents currently require human review.',
    t,
  );
}

export function getTenureReviewOpenPlotLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.open_plot', 'Open plot', t);
}

export function getTenureReviewConfirmCta(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.confirm_cta', 'Confirm tenure review', t);
}

export function getTenureReviewDialogTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.title', 'Confirm tenure review', t);
}

export function getTenureReviewDialogDescription(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.dialog.description',
    'Accept this tenure document after manual review. This clears the compliance issue and allows the plot land checklist to pass when other requirements are met.',
    t,
  );
}

export function getTenureReviewPlotFallback(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.plot_fallback', 'Plot', t);
}

export function getTenureReviewProducerFallback(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.producer_fallback', 'Producer', t);
}

export function getTenureReviewDocumentFallback(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.document_fallback', 'Tenure document', t);
}

export function getTenureReviewAiExtractionTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.ai_extraction.title', 'AI extraction', t);
}

export function getTenureReviewAiDetectedLabel(tenureType: string, t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.ai_extraction.detected', `Detected: ${tenureType}`, t, {
    type: tenureType,
  });
}

export function getTenureReviewAiNoneDetectedMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.ai_extraction.none', 'No tenure type detected', t);
}

export function getTenureReviewAiConfidenceLabel(pct: number, t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.ai_extraction.confidence', `Confidence ${pct}%`, t, { pct });
}

export function getTenureReviewCadastralTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.cadastral.title', 'Cadastral cross-check', t);
}

export function getTenureReviewCadastralMatchMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.cadastral.match',
    'Declared Clave matches document extraction.',
    t,
  );
}

export function getTenureReviewCadastralMismatchMessage(
  declared: string,
  extracted: string,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.compliance.tenure_review.cadastral.mismatch',
    `Mismatch: declared ${declared} vs extracted ${extracted}`,
    t,
    { declared, extracted },
  );
}

export function getTenureReviewCadastralAwaitingMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.cadastral.awaiting',
    'Awaiting declared Clave or clearer extraction.',
    t,
  );
}

export function getTenureReviewMissingTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.missing.title', 'Missing elements', t);
}

export function getTenureReviewMissingReviewQualityMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.missing.review_quality',
    'Review document quality and issuer details.',
    t,
  );
}

export function getTenureReviewDialogReasonLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.reason_label', 'Reason', t);
}

export function getTenureReviewDialogReasonPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.dialog.reason_placeholder',
    'Explain why this document is acceptable for EUDR land-use evidence.',
    t,
  );
}

export function getTenureReviewDialogNoteLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.note_label', 'Note (optional)', t);
}

export function getTenureReviewDialogNotePlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.dialog.note_placeholder',
    'Optional reviewer note for audit trail.',
    t,
  );
}

export function getTenureReviewDialogCancelLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.cancel', 'Cancel', t);
}

export function getTenureReviewDialogSavingLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.saving', 'Saving…', t);
}

export function getTenureReviewDialogConfirmLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.dialog.confirm', 'Confirm review', t);
}

export function getTenureReviewReasonMinLengthMessage(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.tenure_review.reason_min_length',
    'Enter a reason with at least 8 characters.',
    t,
  );
}

export function getTenureReviewConfirmFailedMessage(t?: TranslateFn): string {
  return wf('workflow.compliance.tenure_review.confirm_failed', 'Confirmation failed.', t);
}

export function getProducersFilterComplianceLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filter.compliance_label', 'Compliance', t);
}

export function getProducersFilterComplianceOption(
  value: 'all' | 'compliant' | 'partial' | 'non_compliant',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'workflow.producers.filter.compliance_all',
    compliant: 'workflow.producers.compliance.compliant',
    partial: 'workflow.producers.compliance.partial',
    non_compliant: 'workflow.producers.compliance.non_compliant',
  } as const;
  const fallbackMap = {
    all: 'All compliance states',
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
  } as const;
  return wf(keyMap[value], fallbackMap[value], t);
}

export function getProducersFilterFpicLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filter.fpic_label', 'FPIC consent', t);
}

export function getProducersFilterFpicOption(value: 'all' | 'signed' | 'pending', t?: TranslateFn): string {
  const keyMap = {
    all: 'workflow.producers.filter.fpic_all',
    signed: 'workflow.producers.filter.fpic_signed',
    pending: 'workflow.producers.filter.fpic_pending',
  } as const;
  const fallbackMap = {
    all: 'All consent states',
    signed: 'Consent granted',
    pending: 'Consent pending',
  } as const;
  return wf(keyMap[value], fallbackMap[value], t);
}

export function getProducersFilterStatusLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filter.status_label', 'Onboarding status', t);
}

export function getProducersFilterStatusOption(
  value: 'all' | 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'workflow.producers.filter.status_all',
    new: 'workflow.producers.filter.status.new',
    invited: 'workflow.producers.filter.status.invited',
    engaged: 'workflow.producers.filter.status.engaged',
    submitted: 'workflow.producers.filter.status.submitted',
    inactive: 'workflow.producers.filter.status.inactive',
    blocked: 'workflow.producers.filter.status.blocked',
  } as const;
  const fallbackMap = {
    all: 'All statuses',
    new: 'New',
    invited: 'Invited',
    engaged: 'Engaged',
    submitted: 'Submitted',
    inactive: 'Inactive',
    blocked: 'Blocked',
  } as const;
  return wf(keyMap[value], fallbackMap[value], t);
}

export function getProducersFilterClearLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filter.clear', 'Clear filters', t);
}

export function getProducersFilterApplyLabel(t?: TranslateFn): string {
  return wf('workflow.producers.filter.apply', 'Apply', t);
}

export function getProducersTableColumnLabel(
  column: 'name' | 'phone' | 'cooperative' | 'status' | 'fpic' | 'compliance',
  t?: TranslateFn,
): string {
  const keyMap = {
    name: 'workflow.producers.table.col.name',
    phone: 'workflow.producers.table.col.phone',
    cooperative: 'workflow.producers.table.col.cooperative',
    status: 'workflow.producers.table.col.status',
    fpic: 'workflow.producers.table.col.fpic',
    compliance: 'workflow.producers.table.col.compliance',
  } as const;
  const fallbackMap = {
    name: 'Name',
    phone: 'Phone',
    cooperative: 'Cooperative',
    status: 'Status',
    fpic: 'FPIC',
    compliance: 'Compliance',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getContentReviewStatLabel(
  stat: 'needs_review' | 'missed' | 'overdue_tasks',
  t?: TranslateFn,
): string {
  const keyMap = {
    needs_review: 'workflow.content.review.stat.needs_review',
    missed: 'workflow.content.review.stat.missed',
    overdue_tasks: 'workflow.content.review.stat.overdue_tasks',
  } as const;
  const fallbackMap = {
    needs_review: 'Needs review',
    missed: 'Missed items',
    overdue_tasks: 'Overdue tasks',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getContentReviewQueueTitle(t?: TranslateFn): string {
  return wf('workflow.content.review.queue.title', 'Review queue', t);
}

export function getContentReviewQueueEmptyMessage(t?: TranslateFn): string {
  return wf('workflow.content.review.queue.empty', 'No items awaiting review.', t);
}

export function getContentReviewUntitledLabel(t?: TranslateFn): string {
  return wf('workflow.content.review.untitled', 'Untitled', t);
}

export function getContentReviewStatusLabel(
  status: 'needs_review' | 'draft' | 'approved' | 'published' | string,
  t?: TranslateFn,
): string {
  const keyMap: Record<string, string> = {
    needs_review: 'workflow.content.review.status.needs_review',
    draft: 'workflow.content.review.status.draft',
    approved: 'workflow.content.review.status.approved',
    published: 'workflow.content.review.status.published',
  };
  const fallbackMap: Record<string, string> = {
    needs_review: 'Needs review',
    draft: 'Draft',
    approved: 'Approved',
    published: 'Published',
  };
  const key = keyMap[status];
  if (key) return wf(key, fallbackMap[status], t);
  return status.replace(/_/g, ' ');
}

export function getIssuesOwnershipAlertDescription(t?: TranslateFn): string {
  return wf(
    'workflow.issues.alert.ownership',
    'Issues are owned by one organisation. Upstream blockers are read-only visibility into exporter or cooperative remediation — use campaigns or inbox to request fixes. Status updates apply only to issues owned by your workspace.',
    t,
  );
}

export function getIssuesUpstreamBlockerAlert(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.issues.alert.upstream_blocker',
    '{{count}} upstream blocker(s) affect shared shipments. Your organisation can escalate, but remediation is owned by the upstream exporter or cooperative.',
    t,
    { count },
  );
}

export function getIssuesBlockingAlert(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.issues.alert.blocking',
    '{{count}} blocking issue(s) preventing shipment sealing.',
    t,
    { count },
  );
}

export function getIssuesViewModeLabel(mode: 'kanban' | 'list', t?: TranslateFn): string {
  const keyMap = { kanban: 'workflow.issues.view.kanban', list: 'workflow.issues.view.list' } as const;
  const fallbackMap = { kanban: 'Kanban', list: 'List' } as const;
  return wf(keyMap[mode], fallbackMap[mode], t);
}

export function getIssuesSearchPlaceholder(t?: TranslateFn): string {
  return wf('workflow.issues.search.placeholder', 'Search issues...', t);
}

export function getIssuesFilterPlaceholder(
  filter: 'severity' | 'status' | 'ownership',
  t?: TranslateFn,
): string {
  const keyMap = {
    severity: 'workflow.issues.filter.placeholder.severity',
    status: 'workflow.issues.filter.placeholder.status',
    ownership: 'workflow.issues.filter.placeholder.ownership',
  } as const;
  const fallbackMap = {
    severity: 'Filter by severity',
    status: 'Filter by status',
    ownership: 'Filter by ownership',
  } as const;
  return wf(keyMap[filter], fallbackMap[filter], t);
}

export function getIssuesSeverityLabel(severity: 'BLOCKING' | 'WARNING' | 'INFO' | 'all', t?: TranslateFn): string {
  const keyMap = {
    all: 'workflow.issues.severity.all',
    BLOCKING: 'workflow.issues.severity.blocking',
    WARNING: 'workflow.issues.severity.warning',
    INFO: 'workflow.issues.severity.info',
  } as const;
  const fallbackMap = {
    all: 'All Severities',
    BLOCKING: 'Blocking',
    WARNING: 'Warning',
    INFO: 'Info',
  } as const;
  return wf(keyMap[severity], fallbackMap[severity], t);
}

export function getIssuesKanbanStatusLabel(
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'all',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'workflow.issues.status.all',
    open: 'workflow.issues.status.open',
    in_progress: 'workflow.issues.status.in_progress',
    resolved: 'workflow.issues.status.resolved',
    closed: 'workflow.issues.status.closed',
  } as const;
  const fallbackMap = {
    all: 'All Statuses',
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getIssuesOwnershipFilterLabel(
  kind: 'all' | 'canonical' | 'upstream_blocker' | 'campaign' | 'request',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'workflow.issues.ownership.all',
    canonical: 'workflow.issues.ownership.canonical',
    upstream_blocker: 'workflow.issues.ownership.upstream_blocker',
    campaign: 'workflow.issues.ownership.campaign',
    request: 'workflow.issues.ownership.request',
  } as const;
  const fallbackMap = {
    all: 'All ownership',
    canonical: 'Owned by your org',
    upstream_blocker: 'Upstream blockers',
    campaign: 'Campaign follow-up',
    request: 'Inbox actions',
  } as const;
  return wf(keyMap[kind], fallbackMap[kind], t);
}

export function getIssuesLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.issues.loading', 'Loading issues...', t);
}

export function getIssuesEmptyMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.issues.empty.importer'
      : role === 'cooperative'
        ? 'workflow.issues.empty.cooperative'
        : 'workflow.issues.empty.default';
  const fallback =
    role === 'importer'
      ? 'No workflow exceptions found'
      : role === 'cooperative'
        ? 'No cooperative issues found'
        : 'No compliance issues found';
  return wf(key, fallback, t);
}

export function getIssuesFormLabel(
  field: 'title' | 'description' | 'severity' | 'linked_entity_type' | 'entity_id',
  t?: TranslateFn,
): string {
  const keyMap = {
    title: 'workflow.issues.form.title',
    description: 'workflow.issues.form.description',
    severity: 'workflow.issues.form.severity',
    linked_entity_type: 'workflow.issues.form.linked_entity_type',
    entity_id: 'workflow.issues.form.entity_id',
  } as const;
  const fallbackMap = {
    title: 'Title',
    description: 'Description',
    severity: 'Severity',
    linked_entity_type: 'Linked Entity Type',
    entity_id: 'Entity ID',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getIssuesFormPlaceholder(
  field: 'title' | 'description' | 'entity_id',
  t?: TranslateFn,
): string {
  const keyMap = {
    title: 'workflow.issues.form.placeholder.title',
    description: 'workflow.issues.form.placeholder.description',
    entity_id: 'workflow.issues.form.placeholder.entity_id',
  } as const;
  const fallbackMap = {
    title: 'Issue title',
    description: 'Detailed description',
    entity_id: 'plot_001, batch_001, etc.',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getIssuesLinkedEntityTypeLabel(
  type: 'plot' | 'batch' | 'package' | 'farmer',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  if (type === 'package') return getIssuesLinkedEntityShipmentLabel(role, t);
  if (type === 'farmer') {
    const key =
      role === 'cooperative' ? 'workflow.issues.linked_entity.member' : 'workflow.issues.linked_entity.farmer';
    return wf(key, role === 'cooperative' ? 'Member' : 'Farmer', t);
  }
  const keyMap = { plot: 'workflow.issues.linked_entity.plot', batch: 'workflow.issues.linked_entity.batch' } as const;
  const fallbackMap = { plot: 'Plot', batch: 'Batch' } as const;
  return wf(keyMap[type], fallbackMap[type], t);
}

export function getIssuesCancelLabel(t?: TranslateFn): string {
  return wf('workflow.issues.form.cancel', 'Cancel', t);
}

export function getIssuesCreateSubmitLabel(t?: TranslateFn): string {
  return wf('workflow.issues.form.create', 'Create Issue', t);
}

export function getIssuesOwnerRoleLabel(role: string | null | undefined, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    cooperative: 'workflow.issues.owner_role.cooperative',
    exporter: 'workflow.issues.owner_role.exporter',
    importer: 'workflow.issues.owner_role.importer',
    farmer: 'workflow.issues.owner_role.farmer',
    system: 'workflow.issues.owner_role.system',
  };
  const fallbackMap: Record<string, string> = {
    cooperative: 'Cooperative',
    exporter: 'Exporter',
    importer: 'Importer',
    farmer: 'Farmer / field',
    system: 'System',
  };
  if (role && keyMap[role]) return wf(keyMap[role], fallbackMap[role], t);
  return wf('workflow.issues.owner_role.unassigned', 'Unassigned', t);
}

export function getIssuesKindLabel(kind: string | null | undefined, t?: TranslateFn): string {
  if (kind === 'canonical') return getIssuesOwnershipFilterLabel('canonical', t);
  if (kind === 'upstream_blocker') return getIssuesOwnershipFilterLabel('upstream_blocker', t);
  if (kind === 'campaign') return getIssuesOwnershipFilterLabel('campaign', t);
  if (kind === 'request') return getIssuesOwnershipFilterLabel('request', t);
  return wf('workflow.issues.kind.default', 'Issue', t);
}

export function getIssuesDetailLabel(
  field:
    | 'description'
    | 'status'
    | 'ownership'
    | 'resolution_path'
    | 'linked_entity'
    | 'assigned_owner'
    | 'id',
  t?: TranslateFn,
): string {
  const keyMap = {
    description: 'workflow.issues.detail.description',
    status: 'workflow.issues.detail.status',
    ownership: 'workflow.issues.detail.ownership',
    resolution_path: 'workflow.issues.detail.resolution_path',
    linked_entity: 'workflow.issues.detail.linked_entity',
    assigned_owner: 'workflow.issues.detail.assigned_owner',
    id: 'workflow.issues.detail.id',
  } as const;
  const fallbackMap = {
    description: 'Description',
    status: 'Status',
    ownership: 'Ownership',
    resolution_path: 'Resolution path',
    linked_entity: 'Linked Entity',
    assigned_owner: 'Assigned owner',
    id: 'ID',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getIssuesKanbanColumnLabel(
  column: 'open' | 'in_progress' | 'resolved',
  t?: TranslateFn,
): string {
  const keyMap = {
    open: 'workflow.issues.kanban.column.open',
    in_progress: 'workflow.issues.kanban.column.in_progress',
    resolved: 'workflow.issues.kanban.column.resolved',
  } as const;
  const fallbackMap = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getIssuesKanbanOverdueSuffix(count: number, t?: TranslateFn): string {
  return wf('workflow.issues.kanban.overdue_suffix', ' · {{count}} overdue', t, { count });
}

export function getIssuesKanbanColumnEmpty(
  column: 'open' | 'in_progress' | 'resolved',
  t?: TranslateFn,
): string {
  const keyMap = {
    open: 'workflow.issues.kanban.empty.open',
    in_progress: 'workflow.issues.kanban.empty.in_progress',
    resolved: 'workflow.issues.kanban.empty.resolved',
  } as const;
  const fallbackMap = {
    open: 'No open issues',
    in_progress: 'No in progress issues',
    resolved: 'No resolved issues',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getIssuesRemediationOwnerPrefix(t?: TranslateFn): string {
  return wf('workflow.issues.card.remediation_owner', 'Remediation owner:', t);
}

export function getIssuesOwnerPrefix(t?: TranslateFn): string {
  return wf('workflow.issues.card.owner', 'Owner:', t);
}

export function getIssuesLinkedEntityDisplayLine(
  entityType: string,
  entityName: string,
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const knownTypes = ['plot', 'batch', 'package', 'farmer'] as const;
  const typeLabel = knownTypes.includes(entityType as (typeof knownTypes)[number])
    ? getIssuesLinkedEntityTypeLabel(entityType as 'plot' | 'batch' | 'package' | 'farmer', role, t)
    : entityType;
  return wf(
    'workflow.issues.card.linked_entity',
    '{{type}}: {{name}}',
    t,
    { type: typeLabel, name: entityName },
  );
}

export function getIssuesAdvanceStatusLabel(
  nextStatus: 'in_progress' | 'resolved',
  t?: TranslateFn,
): string {
  const key =
    nextStatus === 'in_progress'
      ? 'workflow.issues.action.mark_in_progress'
      : 'workflow.issues.action.mark_resolved';
  const fallback = nextStatus === 'in_progress' ? 'Mark in progress' : 'Mark resolved';
  return wf(key, fallback, t);
}

export function getIssuesOpenRemediationLabel(t?: TranslateFn): string {
  return wf('workflow.issues.action.open_remediation', 'Open remediation', t);
}

export function getIssuesRequestUpstreamRemediationLabel(t?: TranslateFn): string {
  return wf('workflow.issues.action.request_upstream', 'Request upstream remediation', t);
}

export function getComplianceHubBackendReadinessTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.backend_readiness', 'Backend Readiness Status', t);
}

export function getComplianceHubReadinessStatusDescription(
  status: string,
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.hub.readiness_desc.shipment'
      : 'workflow.compliance.hub.readiness_desc.package';
  const fallback =
    role === 'importer'
      ? `Shipment readiness is ${status}.`
      : `Package readiness is ${status}.`;
  return wf(key, fallback, t, { status });
}

export function getComplianceHubPlotFallbackName(index: number, t?: TranslateFn): string {
  return wf('workflow.compliance.hub.plot_fallback', 'Plot {{n}}', t, { n: index });
}

export function getComplianceHubDeclaredAreaEvidence(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.declared_area_evidence', 'Declared area evidence', t);
}

export function getIssuesSlaLabel(dueDate: string | undefined, t?: TranslateFn): string | null {
  const urgency = getIssueSlaUrgency(dueDate);
  if (!urgency || !dueDate) return null;
  const formatted = new Date(dueDate).toLocaleDateString();
  switch (urgency) {
    case 'overdue':
      return wf('workflow.issues.sla.overdue', 'Overdue since {{date}}', t, { date: formatted });
    case 'today':
      return wf('workflow.issues.sla.today', 'Due today ({{date}})', t, { date: formatted });
    default:
      return wf('workflow.issues.sla.due', 'Due {{date}}', t, { date: formatted });
  }
}

export function getComplianceCheckSummaryTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.checks.summary_title.importer'
      : 'workflow.compliance.checks.summary_title.default';
  return wf(key, role === 'importer' ? 'Declaration Readiness Summary' : 'Compliance Summary', t);
}

export function getComplianceCheckOverallLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.checks.overall.importer'
      : 'workflow.compliance.checks.overall.default';
  return wf(key, role === 'importer' ? 'Overall Declaration Readiness' : 'Overall Compliance', t);
}

export function getComplianceCheckCountSuffix(
  kind: 'passed' | 'warnings' | 'failed',
  t?: TranslateFn,
): string {
  const keyMap = {
    passed: 'workflow.compliance.checks.count.passed',
    warnings: 'workflow.compliance.checks.count.warnings',
    failed: 'workflow.compliance.checks.count.failed',
  } as const;
  const fallbackMap = { passed: 'Passed', warnings: 'Warnings', failed: 'Failed' } as const;
  return wf(keyMap[kind], fallbackMap[kind], t);
}

export function getComplianceCheckListTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.checks.list_title.importer'
      : 'workflow.compliance.checks.list_title.default';
  return wf(key, role === 'importer' ? 'Readiness Checks' : 'Compliance Checks', t);
}

export function getComplianceCheckStatusLabel(
  status: 'compliant' | 'warning' | 'failed' | 'pending',
  t?: TranslateFn,
): string {
  const keyMap = {
    compliant: 'workflow.compliance.checks.status.passed',
    warning: 'workflow.compliance.checks.status.warning',
    failed: 'workflow.compliance.checks.status.failed',
    pending: 'workflow.compliance.checks.status.pending',
  } as const;
  const fallbackMap = {
    compliant: 'Passed',
    warning: 'Warning',
    failed: 'Failed',
    pending: 'Pending',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getEvidenceRequirementVerifiedSummary(
  verified: number,
  total: number,
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.evidence.verified_summary.importer'
      : 'workflow.compliance.evidence.verified_summary.default';
  const fallback =
    role === 'importer'
      ? '{{verified}}/{{total}} evidence records verified'
      : '{{verified}}/{{total}} evidence items verified';
  return wf(key, fallback, t, { verified, total });
}

export function getEvidenceRequirementAutonomousCheck(
  status: 'pass' | 'fail' | 'warning' | string,
  t?: TranslateFn,
): string {
  const label =
    status === 'pass'
      ? wf('workflow.compliance.evidence.autonomous.pass', 'pass', t)
      : status;
  return wf('workflow.compliance.evidence.autonomous.prefix', 'Autonomous check: {{status}}', t, {
    status: label,
  });
}

export function getEvidenceRequirementProvidedTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.evidence.provided_title', 'Provided Evidence', t);
}

export function getEvidenceRequirementMissingTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.evidence.missing_title', 'Missing Evidence', t);
}

export function getEvidenceRequirementMissingHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.evidence.missing_hint.importer'
      : 'workflow.compliance.evidence.missing_hint.default';
  return wf(
    key,
    role === 'importer'
      ? 'This evidence type is required before declaration submission'
      : 'This evidence type is required to verify deforestation compliance',
    t,
  );
}

export function getEvidenceRequirementAutonomousDocChecksTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.evidence.autonomous_doc_checks', 'Autonomous document checks', t);
}

export function getEvidenceRequirementRemediationPrefix(t?: TranslateFn): string {
  return wf('workflow.compliance.evidence.remediation_prefix', 'Remediation:', t);
}

export function getEvidenceRequirementUploadCta(t?: TranslateFn): string {
  return wf('workflow.compliance.evidence.upload_cta', 'Upload Evidence', t);
}

export function getEvidenceRequirementViewDetailsCta(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.evidence.view_details.importer'
      : 'workflow.compliance.evidence.view_details.default';
  return wf(key, role === 'importer' ? 'View Readiness Details' : 'View Details', t);
}

export function getEvidenceItemStatusLabel(
  status: 'verified' | 'pending' | 'rejected' | string,
  t?: TranslateFn,
): string {
  const keyMap: Record<string, string> = {
    verified: 'workflow.compliance.evidence.item_status.verified',
    pending: 'workflow.compliance.evidence.item_status.pending',
    rejected: 'workflow.compliance.evidence.item_status.rejected',
  };
  const fallbackMap: Record<string, string> = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
  };
  if (keyMap[status]) return wf(keyMap[status], fallbackMap[status], t);
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getComplianceReviewHubPlotDescription(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.hub.plot_review.desc',
    'Screen plots for overlap, deforestation signals, and geometry issues before approval.',
    t,
  );
}

export function getComplianceReviewHubPlotCta(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.plot_review.cta', 'Open plot review', t);
}

export function getComplianceReviewHubTenureDescription(t?: TranslateFn): string {
  return wf(
    'workflow.compliance.hub.tenure_review.desc',
    'Confirm AI tenure extractions for producer-in-possession and informal land evidence.',
    t,
  );
}

export function getComplianceReviewHubTenureCta(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.tenure_review.cta', 'Open tenure review queue', t);
}

export function getComplianceReviewHubTenureAwaitingBadge(count: number, t?: TranslateFn): string {
  return wf('workflow.compliance.hub.tenure_review.awaiting', '{{count}} awaiting', t, { count });
}

export function getInboxPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.inbox.title.requests' : 'workflow.inbox.title.default';
  return wf(key, role === 'importer' ? 'Requests' : 'Inbox', t);
}

export function getInboxPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.inbox.subtitle.importer' : 'workflow.inbox.subtitle.default';
  return wf(
    key,
    role === 'importer'
      ? 'Fulfill inbound requests from downstream partners and customers'
      : 'Review and fulfill requests received from downstream partners',
    t,
  );
}

export function getInboxCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.inbox.card.importer' : 'workflow.inbox.card.default';
  return wf(key, role === 'importer' ? 'Inbound Requests' : 'Incoming Requests', t);
}

export function getInboxStatusLabel(status: 'Pending' | 'Fulfilled', t?: TranslateFn): string {
  const keyMap = {
    Pending: 'workflow.inbox.status.pending',
    Fulfilled: 'workflow.inbox.status.fulfilled',
  } as const;
  const fallbackMap = { Pending: 'Pending', Fulfilled: 'Fulfilled' } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getInboxLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.inbox.loading', 'Loading requests...', t);
}

export function getInboxEmptyTitle(status: 'Pending' | 'Fulfilled', t?: TranslateFn): string {
  const key =
    status === 'Pending' ? 'workflow.inbox.empty.title.pending' : 'workflow.inbox.empty.title.fulfilled';
  const fallback = `No ${status.toLowerCase()} requests`;
  return wf(key, fallback, t);
}

export function getInboxEmptyDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.inbox.empty.desc.importer' : 'workflow.inbox.empty.desc.default';
  return wf(
    key,
    role === 'importer'
      ? 'Requests from downstream customers and regulators appear here for response and fulfillment.'
      : 'When downstream partners send requests, they will appear here for response and fulfillment.',
    t,
  );
}

export function getInboxTableColumnLabel(
  column: 'id' | 'title' | 'from' | 'type' | 'due' | 'status' | 'actions',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  if (column === 'id') {
    const key = role === 'importer' ? 'workflow.inbox.col.inbound_id' : 'workflow.inbox.col.request_id';
    return wf(key, role === 'importer' ? 'Inbound ID' : 'Request ID', t);
  }
  const keyMap = {
    title: 'workflow.inbox.col.title',
    from: 'workflow.inbox.col.from',
    type: 'workflow.inbox.col.type',
    due: 'workflow.inbox.col.due',
    status: 'workflow.inbox.col.status',
    actions: 'workflow.inbox.col.actions',
  } as const;
  const fallbackMap = {
    title: 'Title',
    from: 'From',
    type: 'Type',
    due: 'Due',
    status: 'Status',
    actions: 'Actions',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getInboxFulfillButtonLabel(t?: TranslateFn): string {
  return wf('workflow.inbox.action.fulfill', 'Fulfill', t);
}

export function getInboxCompletedLabel(t?: TranslateFn): string {
  return wf('workflow.inbox.action.completed', 'Completed', t);
}

export function getOutreachPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.title.campaigns' : 'workflow.outreach.title.default';
  return wf(key, role === 'importer' ? 'Campaigns' : 'Outreach', t);
}

export function getOutreachPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.subtitle.importer' : 'workflow.outreach.subtitle.default';
  return wf(
    key,
    role === 'importer'
      ? 'Launch and monitor outbound data-collection campaigns to upstream partners'
      : 'Draft, send, and track requests to upstream partners',
    t,
  );
}

export function getOutreachCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.card.importer' : 'workflow.outreach.card.default';
  return wf(key, role === 'importer' ? 'Outbound Campaigns' : 'Outgoing Requests', t);
}

export function getOutreachNewButtonLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.cta.campaign' : 'workflow.outreach.cta.request';
  return wf(key, role === 'importer' ? 'New Campaign' : 'New Request', t);
}

export function getOutreachStatusLabel(
  status: 'Draft' | 'Sent' | 'Completed' | 'Archived',
  t?: TranslateFn,
): string {
  const keyMap = {
    Draft: 'workflow.outreach.status.draft',
    Sent: 'workflow.outreach.status.sent',
    Completed: 'workflow.outreach.status.completed',
    Archived: 'workflow.outreach.status.archived',
  } as const;
  const fallbackMap = {
    Draft: 'Draft',
    Sent: 'Sent',
    Completed: 'Completed',
    Archived: 'Archived',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getOutreachLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.outreach.loading', 'Loading campaigns...', t);
}

export function getOutreachEmptyTitle(
  status: 'Draft' | 'Sent' | 'Completed' | 'Archived',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const key =
    role === 'importer' ? 'workflow.outreach.empty.title.importer' : 'workflow.outreach.empty.title.default';
  const fallback =
    role === 'importer'
      ? `No ${status.toLowerCase()} campaigns`
      : `No ${status.toLowerCase()} outreach requests`;
  return wf(key, fallback, t, { status: status.toLowerCase() });
}

export function getOutreachEmptyDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.empty.desc.importer' : 'workflow.outreach.empty.desc.default';
  return wf(
    key,
    role === 'importer'
      ? 'Start a campaign to collect missing evidence and references from upstream partners.'
      : 'Create a new request to start collecting evidence from your upstream partners.',
    t,
  );
}

export function getOutreachTableColumnLabel(
  column: 'id' | 'counterpart' | 'commodity' | 'date' | 'responses' | 'status' | 'actions',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  if (column === 'id') {
    const key = role === 'importer' ? 'workflow.outreach.col.campaign_id' : 'workflow.outreach.col.request_id';
    return wf(key, role === 'importer' ? 'Campaign ID' : 'Request ID', t);
  }
  const keyMap = {
    counterpart: 'workflow.outreach.col.counterpart',
    commodity: 'workflow.outreach.col.commodity',
    date: 'workflow.outreach.col.date',
    responses: 'workflow.outreach.col.responses',
    status: 'workflow.outreach.col.status',
    actions: 'workflow.outreach.col.actions',
  } as const;
  const fallbackMap = {
    counterpart: 'Counterpart Name',
    commodity: 'Commodity',
    date: 'Date',
    responses: 'Responses',
    status: 'Status',
    actions: 'Actions',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getOutreachRecipientCountLabel(count: number, t?: TranslateFn): string {
  const key =
    count === 1 ? 'workflow.outreach.recipient.singular' : 'workflow.outreach.recipient.plural';
  const fallback = count === 1 ? '1 recipient' : `${count} recipients`;
  return wf(key, fallback, t, { count });
}

export function getOutreachResponsesSummary(accepted: number, pending: number, t?: TranslateFn): string {
  return wf(
    'workflow.outreach.responses.summary',
    '{{accepted}} accepted · {{pending}} pending',
    t,
    { accepted, pending },
  );
}

export function getOutreachViewTimelineLabel(t?: TranslateFn): string {
  return wf('workflow.outreach.action.view_timeline', 'View timeline', t);
}

export function getOutreachWizardDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.outreach.wizard.desc.importer' : 'workflow.outreach.wizard.desc.default';
  return wf(
    key,
    role === 'importer'
      ? 'Create a new outbound campaign to collect missing upstream evidence and references'
      : 'Create a new request campaign for producer, plot, or evidence data',
    t,
  );
}

export function getComplianceHubScoreLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.score', 'Compliance Score', t);
}

export function getComplianceHubEvidenceRecordsLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.evidence_records', 'Evidence Records', t);
}

export function getComplianceHubTotalPlotsLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.total_plots', 'Total Plots', t);
}

export function getComplianceHubCompliantLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.compliant', 'Compliant', t);
}

export function getComplianceHubIssuesLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.issues', 'Issues', t);
}

export function getComplianceHubIssuesDetectedAlert(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.compliance.hub.issues_detected',
    'Issues Detected: {{count}} blocker(s) detected by backend readiness checks.',
    t,
    { count },
  );
}

export function getComplianceHubReadinessTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.readiness_title', 'Backend Readiness Reason Codes', t);
}

export function getComplianceHubLoadingReadiness(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.loading_readiness', 'Loading readiness diagnostics...', t);
}

export function getComplianceHubStatusPrefix(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.status_prefix', 'Status:', t);
}

export function getComplianceHubRemediationPrefix(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.remediation_prefix', 'Remediation:', t);
}

export function getComplianceHubNoPlotEvidence(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.no_plot_evidence', 'No plot evidence loaded for this package yet.', t);
}

export function getComplianceHubEvidenceVerificationTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.evidence_verification', 'Evidence Verification', t);
}

export function getComplianceHubLoadingEvidence(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.loading_evidence', 'Loading package evidence diagnostics...', t);
}

export function getComplianceHubNoEvidenceRequirements(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.no_evidence_requirements', 'No evidence requirements to display.', t);
}

export function getComplianceHubReadyHandoffCta(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.cta.ready_handoff', 'Ready for Shipment Handoff', t);
}

export function getComplianceHubProceedExportCta(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.cta.proceed_export', 'Proceed to Export', t);
}

export function getComplianceHubResolveIssuesCta(t?: TranslateFn): string {
  return wf('workflow.compliance.hub.cta.resolve_issues', 'Resolve Issues', t);
}

export function getComplianceReasonCodeRemediation(code: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    DOC_MISSING: 'workflow.compliance.reason.DOC_MISSING',
    DOC_PENDING_REVIEW: 'workflow.compliance.reason.DOC_PENDING_REVIEW',
    DOC_REJECTED: 'workflow.compliance.reason.DOC_REJECTED',
    DOC_STALE: 'workflow.compliance.reason.DOC_STALE',
    DOC_SOURCE_MISSING: 'workflow.compliance.reason.DOC_SOURCE_MISSING',
    TENURE_REVIEW_REQUIRED: 'workflow.compliance.reason.TENURE_REVIEW_REQUIRED',
    TENURE_PARSE_PENDING: 'workflow.compliance.reason.TENURE_PARSE_PENDING',
  };
  const fallbackMap: Record<string, string> = {
    DOC_MISSING: 'Upload missing document artifacts and re-run readiness checks.',
    DOC_PENDING_REVIEW: 'Complete reviewer validation before submission.',
    DOC_REJECTED: 'Upload corrected documents and request a fresh review.',
    DOC_STALE: 'Refresh outdated documents with current evidence versions.',
    DOC_SOURCE_MISSING: 'Attach source metadata for audit traceability.',
    TENURE_REVIEW_REQUIRED:
      'Open Tenure review and confirm AI tenure extractions for affected plots before submitting this package.',
    TENURE_PARSE_PENDING:
      'Wait for tenure document AI review to finish, or refresh plot tenure status after farmers sync evidence.',
  };
  const key = keyMap[code];
  if (key) return wf(key, fallbackMap[code], t);
  return wf(
    'workflow.compliance.reason.default',
    'Resolve the flagged readiness issue and re-run checks.',
    t,
  );
}

export function getBatchPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'cooperative' || role === 'exporter') {
    return wf('workflow.harvest.nav.lots_batches', en.getBatchPageTitle(role), t);
  }
  return wf('workflow.harvest.nav.batches', en.getBatchPageTitle(role), t);
}

export function getHarvestListPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.harvest.subtitle.cooperative'
      : role === 'exporter'
        ? 'workflow.harvest.subtitle.exporter'
        : 'workflow.harvest.subtitle.default';
  return wf(key, en.getHarvestListPageSubtitle(role), t);
}

export function getAddBatchInputCtaLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.cta.add_batch', en.getAddBatchInputCtaLabel(role), t);
}

export function getHarvestTotalBatchesMetricLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.harvest.metric.tracked_lots' : 'workflow.harvest.metric.total_batches';
  return wf(key, en.getHarvestTotalBatchesMetricLabel(role), t);
}

export function getHarvestAggregatedVolumeLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.harvest.metric.aggregated_volume' : 'workflow.harvest.metric.total_weight';
  return wf(key, en.getHarvestAggregatedVolumeLabel(role), t);
}

export function getHarvestAvgYieldMetricLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.harvest.metric.avg_yield_check' : 'workflow.harvest.metric.avg_yield';
  return wf(key, en.getHarvestAvgYieldMetricLabel(role), t);
}

export function getHarvestFlaggedBatchesMetricLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.harvest.metric.blocked_queues' : 'workflow.harvest.metric.flagged_batches';
  return wf(key, en.getHarvestFlaggedBatchesMetricLabel(role), t);
}

export function getHarvestSearchPlaceholder(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.harvest.search.cooperative' : 'workflow.harvest.search.default';
  return wf(key, en.getHarvestSearchPlaceholder(role), t);
}

export function getHarvestEmptyFilterMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.empty_filter', en.getHarvestEmptyFilterMessage(role), t);
}

export function getHarvestOriginColumnLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'cooperative' ? 'workflow.harvest.origin.member' : 'workflow.harvest.origin.producer';
  return wf(key, en.getHarvestOriginColumnLabel(role), t);
}

export function getHarvestYieldCapInfoTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.yield_cap.title', en.getHarvestYieldCapInfoTitle(role), t);
}

export function getHarvestYieldCapInfoBody(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.harvest.yield_cap.body.cooperative'
      : role === 'exporter'
        ? 'workflow.harvest.yield_cap.body.exporter'
        : 'workflow.harvest.yield_cap.body.base';
  return wf(key, en.getHarvestYieldCapInfoBody(role), t);
}

export function getShipmentNavLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.packages.title.shipments', en.getShipmentNavLabel(role), t);
}

export function getShipmentPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.shipments.subtitle.importer'
      : role === 'exporter'
        ? 'workflow.shipments.subtitle.exporter'
        : 'workflow.shipments.subtitle.default';
  return wf(key, en.getShipmentPageSubtitle(role), t);
}

export function getNewShipmentLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.shipments.cta.new', en.getNewShipmentLabel(role), t);
}

function getPackageEntityLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.entity.shipment'
    : 'workflow.package.entity.package';
  return wf(key, en.getPackageEntityLabel(role), t);
}

function getPackageEntityLabelCapitalized(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.entity.shipment_cap'
    : 'workflow.package.entity.package_cap';
  const fallback = en.getPackageEntityLabelCapitalized(role);
  const resolved = wf(key, fallback, t);
  return resolved === key ? fallback : resolved;
}

export function buildPackageBreadcrumbs(
  role: SupplyChainRole | undefined,
  packageCode: string,
  packageId: string,
  tail?: WorkflowBreadcrumb,
  t?: TranslateFn,
): WorkflowBreadcrumb[] {
  const items: WorkflowBreadcrumb[] = [
    { label: getDashboardBreadcrumbLabel(t), href: '/' },
    { label: getPackagesPageTitle(role, t), href: '/packages' },
    { label: packageCode, href: `/packages/${packageId}` },
  ];
  if (tail) items.push(tail);
  return items;
}

export function getPackageLoadingMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.loading.shipment'
    : 'workflow.package.detail.loading.package';
  return wf(key, en.getPackageLoadingMessage(role), t);
}

export function getPackageLoadErrorPrefix(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.load_error.shipment'
    : 'workflow.package.detail.load_error.package';
  return wf(key, en.getPackageLoadErrorPrefix(role), t);
}

export function getPackageNotFoundMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.not_found.shipment'
    : 'workflow.package.detail.not_found.package';
  return wf(key, en.getPackageNotFoundMessage(role), t);
}

export function getBackToPackageDetailLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.detail.back_to_entity',
    en.getBackToPackageDetailLabel(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageDetailStatusCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.detail.status_card',
    en.getPackageDetailStatusCardTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageDetailsSidebarTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.detail.sidebar',
    en.getPackageDetailsSidebarTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageCodeLabel(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.package.detail.code', en.getPackageCodeLabel(), t);
}

export function getTracesReferenceLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.traces_reference'
      : 'workflow.package.detail.handoff_reference';
  return wf(key, en.getTracesReferenceLabel(role), t);
}

export function getRunPackageComplianceLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.run_compliance.importer'
      : 'workflow.package.detail.run_compliance.default';
  return wf(key, en.getRunPackageComplianceLabel(role), t);
}

export function getAssembleShipmentActionLabel(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.package.detail.assemble', en.getAssembleShipmentActionLabel(), t);
}

export function getPackageSubmitActionLabel(
  role?: SupplyChainRole,
  isSubmitting = false,
  t?: TranslateFn,
): string {
  if (isSubmitting) {
    return wf('workflow.package.detail.submit.submitting', en.getPackageSubmitActionLabel(role, true), t);
  }
  if (role === 'importer') return getMiniReviewImporterFilingAction(t);
  return wf('workflow.package.detail.submit.handoff', en.getPackageSubmitActionLabel(role), t);
}

export function getPackageSubmittedAwaitingMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.submitted.importer'
      : 'workflow.package.detail.submitted.default';
  return wf(key, en.getPackageSubmittedAwaitingMessage(role), t);
}

export function getPackageFilingWorkflowTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.filing_workflow.title.importer'
      : 'workflow.package.detail.filing_workflow.title.default';
  return wf(key, en.getPackageFilingWorkflowTitle(role), t);
}

export function getPackageFilingWorkflowHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.filing_workflow.hint.importer'
      : role === 'exporter' || role === 'cooperative'
        ? 'workflow.package.detail.filing_workflow.hint.exporter'
        : 'workflow.package.detail.filing_workflow.hint.default';
  return wf(key, en.getPackageFilingWorkflowHint(role), t);
}

export function getPackagePreflightBlockersTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.preflight.title.importer'
      : 'workflow.package.detail.preflight.title.default';
  return wf(key, en.getPackagePreflightBlockersTitle(role), t);
}

export function getPackagePreflightBlockersDescription(
  role: SupplyChainRole | undefined,
  blockers: string[],
  t?: TranslateFn,
): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.preflight.description.importer'
      : role === 'exporter' || role === 'cooperative'
        ? 'workflow.package.detail.preflight.description.handoff'
        : 'workflow.package.detail.preflight.description.default';
  return wf(key, en.getPackagePreflightBlockersDescription(role, blockers), t, {
    blockers: blockers.join(', '),
  });
}

export function getPackageLoadingReadinessMessage(t?: TranslateFn): string {
  return wf('workflow.package.detail.loading_readiness', 'Loading readiness checks...', t);
}

export function getPackageGenerateErrorMessage(t?: TranslateFn): string {
  return wf('workflow.package.detail.generate.error', 'Failed to generate filing artifacts.', t);
}

export function getPackageSlaImmediateLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.sla.immediate', 'Immediate action required', t);
}

export function getPackageRemediationRunComplianceLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.remediation.run_compliance', 'Run compliance checks', t);
}

export function getPackageFilingStatusPrefix(t?: TranslateFn): string {
  return wf('workflow.package.detail.filing_status_prefix', 'Current backend status:', t);
}

export function getPackageReadinessBlockersHeading(t?: TranslateFn): string {
  return wf('workflow.package.detail.readiness_blockers_heading', 'Readiness blockers:', t);
}

export function getPackageDetailComplianceStatusLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.compliance_status', 'Compliance Status', t);
}

export function getPackageAssociatedPlotsTitle(t?: TranslateFn): string {
  return wf('workflow.package.detail.plots.title', 'Associated Plots', t);
}

export function getPackageAddPlotLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.plots.add', 'Add Plot', t);
}

export function getPackageNoPlotsMessage(t?: TranslateFn): string {
  return wf('workflow.package.detail.plots.empty', 'No plots associated yet', t);
}

export function getPackageAddFirstPlotLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.plots.add_first', 'Add First Plot', t);
}

export function formatPackagePlotMeta(area: number, risk: string, t?: TranslateFn): string {
  return wf('workflow.package.detail.plot.meta', `${area} ha - Risk: ${risk}`, t, { area, risk });
}

export function getPackageVerifiedStatusLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.status.verified', 'Verified', t);
}

export function getPackagePendingStatusLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.status.pending', 'Pending', t);
}

export function getPackageFpicLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.fpic.label', 'FPIC:', t);
}

export function getPackageFpicStatusLabel(signed: boolean, t?: TranslateFn): string {
  return signed
    ? wf('workflow.package.detail.fpic.signed', 'Signed', t)
    : getPackagePendingStatusLabel(t);
}

export function getPackageLaborLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.labor.label', 'Labor:', t);
}

export function getPackageLaborStatusLabel(compliant: boolean, t?: TranslateFn): string {
  return compliant
    ? wf('workflow.package.detail.labor.compliant', 'Compliant', t)
    : getPackagePendingStatusLabel(t);
}

export function getPackageSeasonYearLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.season_year', 'Season / Year', t);
}

export function formatPackageSeasonYear(season: string, year: number, t?: TranslateFn): string {
  return wf('workflow.package.detail.season_value', `Season ${season} ${year}`, t, { season, year });
}

export function getPackageCreatedLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.created', 'Created', t);
}

export function getPackageUpdatedLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.updated', 'Last Updated', t);
}

export function getPackageSubmittedDateLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.submitted_date', 'Submitted', t);
}

export function getPackageQuickStatsTitle(t?: TranslateFn): string {
  return wf('workflow.package.detail.quick_stats', 'Quick Stats', t);
}

export function getPackageQuickStatsPlotsLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.quick_stats.plots', 'Plots', t);
}

export function getPackageQuickStatsTotalHaLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.quick_stats.total_ha', 'Total Ha', t);
}

export function getPackageLiabilityModalTitle(t?: TranslateFn): string {
  return wf('workflow.package.detail.liability.modal_title', 'Liability Acknowledgement', t);
}

export function getPackageLiabilityAcknowledgeLabel(t?: TranslateFn): string {
  return wf('workflow.package.detail.liability.acknowledge', 'I Acknowledge', t);
}

export function getCommonCancelLabel(t?: TranslateFn): string {
  return wf('common.cancel', 'Cancel', t);
}

export function getPackageReadinessEntityLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.readiness.shipment'
    : 'workflow.package.detail.readiness.package';
  return wf(key, en.getPackageReadinessEntityLabel(role), t);
}

export function getPackageRecentEventsTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.recent_events.shipment'
    : 'workflow.package.detail.recent_events.package';
  return wf(key, en.getPackageRecentEventsTitle(role), t);
}

export function getGenerateFilingArtifactsLabel(isGenerating = false, t?: TranslateFn): string {
  if (isGenerating) {
    return wf('workflow.package.detail.generate.generating', en.getGenerateFilingArtifactsLabel(true), t);
  }
  return wf('workflow.package.detail.generate.default', en.getGenerateFilingArtifactsLabel(false), t);
}

export function getGenerateFilingArtifactsSuccessToast(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.generate.success.importer'
      : role === 'exporter' || role === 'cooperative'
        ? 'workflow.package.detail.generate.success.exporter'
        : 'workflow.package.detail.generate.success.default';
  return wf(key, en.getGenerateFilingArtifactsSuccessToast(role), t);
}

export function getPackageSubmitErrorMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.detail.submit.error.shipment'
    : 'workflow.package.detail.submit.error.package';
  return wf(key, en.getPackageSubmitErrorMessage(role), t);
}

export function getPackageSubmitSuccessToast(
  role: SupplyChainRole | undefined,
  tracesReference?: string | null,
  replayed = false,
  t?: TranslateFn,
): string {
  if (replayed) {
    return wf(
      'workflow.package.detail.submit.success.replayed',
      'Submission replayed from idempotency cache.',
      t,
    );
  }
  const suffix = tracesReference ? ` (${tracesReference})` : '';
  if (role === 'importer') {
    return wf('workflow.package.detail.submit.success.importer', `DDS submitted to TRACES${suffix}.`, t, {
      suffix,
    });
  }
  if (role === 'exporter' || role === 'cooperative') {
    return wf(
      'workflow.package.detail.submit.success.handoff',
      `Downstream handoff submitted${suffix}.`,
      t,
      { suffix },
    );
  }
  return wf('workflow.package.detail.submit.success.default', `Package submitted${suffix}.`, t, { suffix });
}

export function getAssociatedProducersCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.package.detail.producers.cooperative'
      : 'workflow.package.detail.producers.default';
  return wf(key, en.getAssociatedProducersCardTitle(role), t);
}

export function getLinkProducerActionLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' ? 'workflow.package.detail.link_member' : 'workflow.package.detail.link_producer';
  return wf(key, en.getLinkProducerActionLabel(role), t);
}

export function getNoProducersLinkedMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.package.detail.no_producers.cooperative'
      : 'workflow.package.detail.no_producers.default';
  return wf(key, en.getNoProducersLinkedMessage(role), t);
}

export function getQuickStatsProducerLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.package.detail.quick_stats.members'
      : 'workflow.package.detail.quick_stats.producers';
  return wf(key, en.getQuickStatsProducerLabel(role), t);
}

export function getLiabilityAcknowledgementBody(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.detail.liability.importer'
      : 'workflow.package.detail.liability.default';
  return wf(key, en.getLiabilityAcknowledgementBody(role), t);
}

export function getPackageCreateTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter' || role === 'importer'
      ? 'workflow.package.create.title.shipment'
      : 'workflow.package.create.title.package';
  return wf(key, en.getPackageCreateTitle(role), t);
}

export function getPackageCreateSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter'
      ? 'workflow.package.create.subtitle.exporter'
      : role === 'importer'
        ? 'workflow.package.create.subtitle.importer'
        : 'workflow.package.create.subtitle.default';
  return wf(key, en.getPackageCreateSubtitle(role), t);
}

export function getPackageCreateSuccessToast(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter' || role === 'cooperative'
      ? 'workflow.package.create.success.shipment'
      : 'workflow.package.create.success.package';
  return wf(key, en.getPackageCreateSuccessToast(role), t);
}

export function getPackageCreateBackLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return getPackageDetailBackLabel(role, t);
}

export function getPackageCreateInfoCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.create.info.shipment'
    : 'workflow.package.create.info.package';
  return wf(key, en.getPackageCreateInfoCardTitle(role), t);
}

export function getPackageCreatePreviewTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.create.preview.shipment'
    : 'workflow.package.create.preview.package';
  return wf(key, en.getPackageCreatePreviewTitle(role), t);
}

export function getPackageCreateSubmitLabel(
  role?: SupplyChainRole,
  isSubmitting = false,
  t?: TranslateFn,
): string {
  if (isSubmitting) {
    return wf('workflow.package.create.submit.creating', en.getPackageCreateSubmitLabel(role, true), t);
  }
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.create.submit.shipment'
    : 'workflow.package.create.submit.package';
  return wf(key, en.getPackageCreateSubmitLabel(role), t);
}

export function getHarvestVoucherSectionDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter' || role === 'cooperative'
      ? 'workflow.package.voucher.description.exporter'
      : role === 'importer'
        ? 'workflow.package.voucher.description.importer'
        : 'workflow.package.voucher.description.default';
  return wf(key, en.getHarvestVoucherSectionDescription(role), t);
}

export function getHarvestVoucherLoadingMessage(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.package.voucher.loading', en.getHarvestVoucherLoadingMessage(), t);
}

export function getHarvestVoucherEmptyMessage(
  role?: SupplyChainRole,
  showIneligible = false,
  t?: TranslateFn,
): string {
  if (showIneligible) {
    return wf('workflow.package.voucher.empty.none', en.getHarvestVoucherEmptyMessage(role, true), t);
  }
  const key =
    role === 'cooperative' || role === 'exporter'
      ? 'workflow.package.voucher.empty.upstream'
      : 'workflow.package.voucher.empty.default';
  return wf(key, en.getHarvestVoucherEmptyMessage(role, false), t);
}

export function getBatchNavLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'cooperative' || role === 'exporter') {
    return wf('workflow.harvest.nav.lots_batches', en.getBatchNavLabel(role), t);
  }
  return wf('workflow.harvest.nav.batches', en.getBatchNavLabel(role), t);
}

export function getAssembleShipmentSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.assemble.subtitle.importer'
      : role === 'exporter' || role === 'cooperative'
        ? 'workflow.package.assemble.subtitle.exporter'
        : 'workflow.package.assemble.subtitle.default';
  return wf(key, en.getAssembleShipmentSubtitle(role), t);
}

export function getAssembleBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.breadcrumb', en.getAssembleBreadcrumbLabel(), t);
}

export function getAssemblePageTitle(packageCode: string, t?: TranslateFn): string {
  return wf('workflow.package.assemble.title', en.getAssemblePageTitle(packageCode), t, { code: packageCode });
}

export function getAssembleSealedAlertMessage(
  role: SupplyChainRole | undefined,
  shipmentReference: string,
  t?: TranslateFn,
): string {
  const key =
    role === 'importer'
      ? 'workflow.package.assemble.sealed.importer'
      : 'workflow.package.assemble.sealed.default';
  return wf(key, en.getAssembleSealedAlertMessage(role, shipmentReference), t, {
    reference: shipmentReference,
  });
}

export function getSealBillingHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter' || role === 'cooperative'
      ? 'workflow.package.assemble.seal_billing.exporter'
      : 'workflow.package.assemble.seal_billing.default';
  return wf(key, en.getSealBillingHint(role), t);
}

export function getPackageAssembleLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.package.assemble.loading', 'Loading shipment assembly…', t);
}

export function getPackageAssemblySteps(t?: TranslateFn) {
  const shipmentSteps = getShipmentAssemblySteps(t);
  return [
    {
      id: 'select_batches' as const,
      label: wf('workflow.package.assemble.step.select.label', 'Select Batches', t),
      description: wf('workflow.package.assemble.step.select.hint', 'Confirm voucher packages', t),
    },
    ...shipmentSteps.slice(1),
  ];
}

export function getPackageAssembleStep1Title(batchLabel: string, t?: TranslateFn): string {
  return wf('workflow.package.assemble.step1.confirm', `Step 1: Confirm ${batchLabel}`, t, { batchLabel });
}

export function getPackageAssembleSelectIntro(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.select_intro',
    'This package is always included. Add more voucher bundles if this shipment spans multiple batches.',
    t,
  );
}

export function getPackageAssembleNoVouchersAlert(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.no_vouchers',
    'No harvest vouchers are linked to this package yet. Add vouchers from package creation before sealing.',
    t,
  );
}

export function getPackageAssembleAdditionalBatchesLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.additional_batches', 'Additional batches (optional)', t);
}

export function getPackageAssembleLineageTotalLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.lineage_total', 'Batch lineage total', t);
}

export function formatPackageAssembleLineageSummary(
  kg: number,
  batchCount: number,
  t?: TranslateFn,
): string {
  return wf('workflow.package.assemble.lineage_summary', `${kg} kg across ${batchCount} batch(es)`, t, {
    kg: kg.toLocaleString(),
    count: batchCount,
  });
}

export function getPackageAssembleStep2Title(t?: TranslateFn): string {
  return wf('workflow.package.assemble.step2.title', 'Step 2: Allocate Coverage to Shipment Lines', t);
}

export function getPackageAssembleAllocateIntro(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.allocate_intro',
    'Distribute batch lineage across shipment lines. Full line-level coverage editing ships with canonical shipment_lines.',
    t,
  );
}

export function formatPackageAssembleAllocateSummary(
  batches: number,
  plots: number,
  kg: number,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.package.assemble.allocate_summary',
    `${batches} batch(es) · ${plots} contributing plot(s) · ${kg} kg in this shipment draft.`,
    t,
    { batches, plots, kg: kg.toLocaleString() },
  );
}

export function getPackageAssembleDeclaredWeightLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.declared_weight', 'Declared shipment weight (kg)', t);
}

export function formatPackageAssembleWeightMustMatch(kg: number, t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.weight_must_match',
    `Must match the batch lineage total (${kg} kg).`,
    t,
    { kg: kg.toLocaleString() },
  );
}

export function getPackageAssembleStep3Title(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.step3.title',
    'Step 3: Validate Role Classification & Blocking Issues',
    t,
  );
}

export function formatPackageAssembleWeightMatchOk(kg: number, t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.weight_match_ok',
    `Shipment weight matches batch lineage (${kg} kg).`,
    t,
    { kg: kg.toLocaleString() },
  );
}

export function formatPackageAssembleBlockersCount(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.blockers_count',
    `${count} blocking readiness issue(s) on the primary package.`,
    t,
    { count },
  );
}

export function getPackageAssembleSealWarning(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.package.assemble.seal.warning.cooperative'
      : 'workflow.package.assemble.seal.warning.exporter';
  const fallback =
    role === 'cooperative'
      ? 'Sealing is binding. Cooperative operators assume liability for the accuracy of shipment data before EU filing.'
      : 'Sealing is binding. Exporters assume liability for the accuracy of shipment data before EU filing.';
  return wf(key, fallback, t);
}

export function getPackageAssembleSelectedBatchesLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.seal.selected_batches', 'Selected batches', t);
}

export function getPackageAssembleSealDeclaredWeightLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.seal.declared_weight', 'Declared shipment weight', t);
}

export function getPackageAssembleFirstSealFreeHint(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.seal.first_free',
    'Your first shipment seal is free. Using it ends the 3-month subscription-free offer this month.',
    t,
  );
}

export function getPackageAssembleLiabilityTitle(t?: TranslateFn): string {
  return wf('workflow.package.assemble.liability.title', 'I acknowledge operator liability', t);
}

export function getPackageAssembleLiabilityBody(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.liability.body',
    'I confirm this shipment data is accurate, complete, and compliant with EUDR requirements.',
    t,
  );
}

export function getPackageAssembleSealConfirmLabel(t?: TranslateFn): string {
  return wf('workflow.package.assemble.seal.confirm', 'I confirm I want to seal this shipment now', t);
}

export function getPackageAssembleSealCtaLabel(isSealing: boolean, t?: TranslateFn): string {
  if (isSealing) {
    return wf('workflow.package.assemble.seal.cta.progress', 'Sealing…', t);
  }
  return wf('workflow.package.assemble.seal.cta', 'Seal & Finalize Shipment', t);
}

export function getPackageAssembleSealSuccessToast(t?: TranslateFn): string {
  return wf(
    'workflow.package.assemble.seal.success',
    'Shipment sealed. €1 origin usage metered for this month. Continue to compliance for filing.',
    t,
  );
}

export function getPackageAssembleSealErrorToast(t?: TranslateFn): string {
  return wf('workflow.package.assemble.seal.error', 'Failed to seal shipment.', t);
}

export function getAssemblyBackLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.back', 'Back', t);
}

export function getAssemblyCancelLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.cancel', 'Cancel', t);
}

export function getAssemblyNextAllocateLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.next.allocate', 'Next: Allocate Coverage', t);
}

export function getAssemblyNextValidateLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.next.validate', 'Next: Validate Issues', t);
}

export function getAssemblyNextSealLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.next.seal', 'Next: Seal Shipment', t);
}

export function getShipmentAssembleStep1Intro(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.step1.intro',
    'These voucher bundles are locked into this shipment. Edit batch membership from shipment settings before sealing.',
    t,
  );
}

export function getShipmentAssembleNoBatchesAlert(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.no_batches',
    'No linked batches found. Add batches when creating the shipment.',
    t,
  );
}

export function getShipmentAssembleAllocateIntro(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.allocate_intro',
    'Map batch lineage to shipment lines before EU filing. Full line-level coverage editing ships with canonical shipment_headers.',
    t,
  );
}

export function formatShipmentAssembleAllocateSummary(
  batches: number,
  plots: number,
  kg: number,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.assembly.shipment.allocate_summary',
    `${batches} batch(es) · ${plots} contributing plot(s) · ${kg} kg batch lineage in this shipment draft.`,
    t,
    { batches, plots, kg: kg.toLocaleString() },
  );
}

export function formatShipmentAssembleWeightMatchOk(kg: number, t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.weight_match_ok',
    `Shipment weight matches batch lineage (${kg} kg).`,
    t,
    { kg: kg.toLocaleString() },
  );
}

export function getShipmentAssembleSealDeclaredWeightLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.shipment.seal.declared_weight', 'Declared shipment weight', t);
}

export function getShipmentAssembleSealLineageTotalLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.shipment.seal.lineage_total', 'Batch lineage total', t);
}

export function getShipmentAssembleFirstSealFreeHint(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.seal.first_free',
    'Your first shipment seal is free. Using it ends the 3-month subscription-free offer this month — subscription billing starts next month.',
    t,
  );
}

export function getShipmentAssembleLiabilityTitle(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.liability.title',
    'I acknowledge operator liability for this EU shipment',
    t,
  );
}

export function getShipmentAssembleSealConfirmLabel(t?: TranslateFn): string {
  return wf('workflow.assembly.shipment.seal.confirm', 'I confirm I want to seal this shipment now', t);
}

export function getShipmentAssembleSealCtaLabel(isSealing: boolean, t?: TranslateFn): string {
  if (isSealing) {
    return wf('workflow.assembly.shipment.seal.cta.progress', 'Sealing…', t);
  }
  return wf('workflow.assembly.shipment.seal.cta', 'Seal Shipment', t);
}

export function getShipmentAssembleSealSuccessToast(t?: TranslateFn): string {
  return wf(
    'workflow.assembly.shipment.seal.success',
    'Shipment sealed. €1 origin usage metered for this month. Continue to compliance for filing.',
    t,
  );
}

export function getShipmentAssembleSealErrorToast(t?: TranslateFn): string {
  return wf('workflow.assembly.shipment.seal.error', 'Failed to seal shipment.', t);
}

export function getPackageSubmitBreadcrumbLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.submit.breadcrumb.importer'
      : 'workflow.package.submit.breadcrumb.default';
  return wf(key, role === 'importer' ? 'Submit to TRACES' : 'Submit', t);
}

export function getPackageSubmitRoutePrefix(t?: TranslateFn): string {
  return wf('workflow.package.submit.route_prefix', 'Route enabled. Return to', t);
}

export function getPackageSubmitRouteSuffix(t?: TranslateFn): string {
  return wf('workflow.package.submit.route_suffix', 'to continue.', t);
}

export function getPackageComplianceBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.package.compliance.breadcrumb', 'Compliance', t);
}

export function getPackageComplianceRoutePrefix(t?: TranslateFn): string {
  return wf(
    'workflow.package.compliance.route_prefix',
    'Route enabled. You can navigate back to',
    t,
  );
}

export function getPackageEditBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.package.edit.breadcrumb', 'Edit', t);
}

export function getPackageEditRoutePrefix(t?: TranslateFn): string {
  return wf('workflow.package.edit.route_prefix', 'Route enabled. Continue development from', t);
}

export function getPackageTimelineBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.package.timeline.breadcrumb', 'Timeline', t);
}

export function getPackageSubmitPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'importer') {
    return wf('workflow.package.submit.title.importer', en.getPackageSubmitPageTitle(role), t);
  }
  return wf(
    'workflow.package.submit.title.default',
    en.getPackageSubmitPageTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageSubmitPageSubtitle(
  role: SupplyChainRole | undefined,
  id: string,
  t?: TranslateFn,
): string {
  if (role === 'importer') {
    return wf('workflow.package.submit.subtitle.importer', en.getPackageSubmitPageSubtitle(role, id), t, { id });
  }
  return wf(
    'workflow.package.submit.subtitle.default',
    en.getPackageSubmitPageSubtitle(role, id),
    t,
    { entity: getPackageEntityLabel(role, t), id },
  );
}

export function getPackageSubmitCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.package.submit.card.importer' : 'workflow.package.submit.card.default';
  return wf(key, en.getPackageSubmitCardTitle(role), t);
}

export function getPackageComplianceDetailLinkLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.submit.detail_link',
    en.getPackageComplianceDetailLinkLabel(role),
    t,
    { entity: getPackageEntityLabel(role, t) },
  );
}

export function getPackageCompliancePageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  if (role === 'importer') {
    return wf('workflow.package.compliance.title.importer', en.getPackageCompliancePageTitle(role), t);
  }
  return wf(
    'workflow.package.compliance.title.default',
    en.getPackageCompliancePageTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageCompliancePageSubtitle(
  role: SupplyChainRole | undefined,
  id: string,
  t?: TranslateFn,
): string {
  if (role === 'importer') {
    return wf(
      'workflow.package.compliance.subtitle.importer',
      en.getPackageCompliancePageSubtitle(role, id),
      t,
      { id },
    );
  }
  return wf(
    'workflow.package.compliance.subtitle.default',
    en.getPackageCompliancePageSubtitle(role, id),
    t,
    { entity: getPackageEntityLabel(role, t), id },
  );
}

export function getPackageComplianceCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.compliance.card.importer'
      : 'workflow.package.compliance.card.default';
  return wf(key, en.getPackageComplianceCardTitle(role), t);
}

export function getPackageEditPageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.edit.title',
    en.getPackageEditPageTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageEditPageSubtitle(
  role: SupplyChainRole | undefined,
  id: string,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.package.edit.subtitle',
    en.getPackageEditPageSubtitle(role, id),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t), entityLower: getPackageEntityLabel(role, t), id },
  );
}

export function getPackageEditCardTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.edit.card',
    en.getPackageEditCardTitle(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageTimelinePageTitle(packageCode: string, t?: TranslateFn): string {
  return wf('workflow.package.timeline.title', en.getPackageTimelinePageTitle(packageCode), t, {
    code: packageCode,
  });
}

export function getPackageTimelinePageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.timeline.subtitle.shipment'
    : 'workflow.package.timeline.subtitle.package';
  return wf(key, en.getPackageTimelinePageSubtitle(role), t);
}

export function getPackageTimelineBackLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.timeline.back',
    en.getPackageTimelineBackLabel(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackageTimelineAuditTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.timeline.audit.title.shipment'
    : 'workflow.package.timeline.audit.title.package';
  return wf(key, en.getPackageTimelineAuditTitle(role), t);
}

export function getPackageTimelineAuditDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.timeline.audit.description.shipment'
    : 'workflow.package.timeline.audit.description.package';
  return wf(key, en.getPackageTimelineAuditDescription(role), t);
}

export function getPackagesTableTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  return getPackagesPageTitle(role, t);
}

export function getPackagesTableSearchPlaceholder(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.table.search.shipment'
    : 'workflow.package.table.search.package';
  return wf(key, en.getPackagesTableSearchPlaceholder(role), t);
}

export function getPackagesTableCodeColumnLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.table.code_column',
    en.getPackagesTableCodeColumnLabel(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getEditPackageActionLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.table.edit',
    en.getEditPackageActionLabel(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getDeletePackageActionLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.table.delete',
    en.getDeletePackageActionLabel(role),
    t,
    { entity: getPackageEntityLabelCapitalized(role, t) },
  );
}

export function getPackagesTableEmptyMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = usesShipmentWorkflowLanguage(role)
    ? 'workflow.package.table.empty.shipment'
    : 'workflow.package.table.empty.package';
  return wf(key, en.getPackagesTableEmptyMessage(role), t);
}

export function getRunComplianceCheckActionLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.package.table.run_check.importer'
      : 'workflow.package.table.run_check.default';
  return wf(key, en.getRunComplianceCheckActionLabel(role), t);
}

export function getSupplyChainFlowHint(t?: TranslateFn): string {
  return wf('workflow.shipment.flow_hint', en.SUPPLY_CHAIN_FLOW_HINT, t);
}

export function getShipmentsListBackLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return getPackageDetailBackLabel(role, t);
}

export function getNewShipmentPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter'
      ? 'workflow.shipment.new.subtitle.exporter'
      : role === 'cooperative'
        ? 'workflow.shipment.new.subtitle.cooperative'
        : 'workflow.shipment.new.subtitle.default';
  return wf(key, en.getNewShipmentPageSubtitle(role), t);
}

export function getShipmentBatchSelectDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter'
      ? 'workflow.shipment.batch_select.exporter'
      : role === 'cooperative'
        ? 'workflow.shipment.batch_select.cooperative'
        : 'workflow.shipment.batch_select.default';
  return wf(key, en.getShipmentBatchSelectDescription(role), t);
}

export function getShipmentNoEligibleBatchesMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.shipment.no_batches.cooperative'
      : 'workflow.shipment.no_batches.default';
  return wf(key, en.getShipmentNoEligibleBatchesMessage(role), t);
}

export function getHarvestNewPageTitle(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.new.title', en.getHarvestNewPageTitle(), t);
}

export function getHarvestNewPageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.harvest.new.subtitle.cooperative'
      : role === 'exporter'
        ? 'workflow.harvest.new.subtitle.exporter'
        : 'workflow.harvest.new.subtitle.default';
  return wf(key, en.getHarvestNewPageSubtitle(role), t);
}

export function getHarvestNewIntakeAlert(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.new.intake_alert', en.getHarvestNewIntakeAlert(), t);
}

export function getHarvestNewCardTitle(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.new.card_title', en.getHarvestNewCardTitle(), t);
}

export function getHarvestNewCardDescription(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative' || role === 'exporter'
      ? 'workflow.harvest.new.card_description.upstream'
      : 'workflow.harvest.new.card_description.default';
  return wf(key, en.getHarvestNewCardDescription(role), t);
}

export function getHarvestOriginFieldLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  return getHarvestOriginColumnLabel(role, t);
}

export function getHarvestNewBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.harvest.new.breadcrumb', 'New', t);
}

export function getHarvestRecordSubmitLabel(isSubmitting = false, t?: TranslateFn): string {
  if (isSubmitting) {
    return wf('workflow.harvest.new.submit.saving', en.getHarvestRecordSubmitLabel(true), t);
  }
  return wf('workflow.harvest.new.submit.default', en.getHarvestRecordSubmitLabel(false), t);
}

export function getHarvestRecordSuccessToast(persistedRemotely: boolean, t?: TranslateFn): string {
  const key = persistedRemotely
    ? 'workflow.harvest.new.success.synced'
    : 'workflow.harvest.new.success.local';
  return wf(key, en.getHarvestRecordSuccessToast(persistedRemotely), t);
}

export function getHarvestDetailPageTitle(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.detail.title', en.getHarvestDetailPageTitle(), t);
}

export function getHarvestDetailPageSubtitle(id: string, t?: TranslateFn): string {
  return wf('workflow.harvest.detail.subtitle', en.getHarvestDetailPageSubtitle(id), t, { id });
}

export function getHarvestDetailCardTitle(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.detail.card_title', en.getHarvestDetailCardTitle(), t);
}

export function getHarvestDetailPlaceholder(_role?: SupplyChainRole, t?: TranslateFn): string {
  return wf('workflow.harvest.detail.placeholder', en.getHarvestDetailPlaceholder(), t);
}

export function getDdsWorkspaceSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.dds.subtitle.importer' : 'workflow.dds.subtitle.default';
  return wf(key, en.getDdsWorkspaceSubtitle(role), t);
}

export function getDdsPreflightTracesHint(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.dds.preflight.importer' : 'workflow.dds.preflight.default';
  return wf(key, en.getDdsPreflightTracesHint(role), t);
}

export function getDdsReadyForTracesMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key = role === 'importer' ? 'workflow.dds.ready.importer' : 'workflow.dds.ready.default';
  return wf(key, en.getDdsReadyForTracesMessage(role), t);
}

export function getEvidencePageTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' || role === 'cooperative'
      ? 'workflow.evidence.title.short'
      : 'workflow.evidence.title.fpic';
  return wf(key, en.getEvidencePageTitle(role), t);
}

export function getEvidencePageSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.evidence.subtitle.importer'
      : role === 'cooperative'
        ? 'workflow.evidence.subtitle.cooperative'
        : 'workflow.evidence.subtitle.default';
  return wf(key, en.getEvidencePageSubtitle(role), t);
}

export type EvidenceDocType = 'community_minutes' | 'consent_form' | 'agreement' | 'affidavit';

export function getEvidenceUploadCtaLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.evidence.upload_cta.importer' : 'workflow.evidence.upload_cta.default';
  return wf(key, role === 'importer' ? 'Upload evidence' : 'Upload document', t);
}

export function getEvidenceSummaryTotalLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.evidence.summary.total.importer'
      : role === 'cooperative'
        ? 'workflow.evidence.summary.total.cooperative'
        : 'workflow.evidence.summary.total.default';
  return wf(key, 'Total documents', t);
}

export function getEvidenceSummaryVerifiedLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.summary.verified', 'Verified', t);
}

export function getEvidenceSummaryPendingLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.evidence.summary.pending.cooperative'
      : 'workflow.evidence.summary.pending.importer';
  return wf(key, 'Pending review', t);
}

export function getEvidenceSummaryRenewalLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'cooperative'
      ? 'workflow.evidence.summary.renewal.cooperative'
      : 'workflow.evidence.summary.renewal.default';
  return wf(key, 'Renewal due', t);
}

export function getEvidenceSummaryExpiredLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.summary.expired', 'Expired', t);
}

export function getEvidenceSearchPlaceholder(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.evidence.search.importer'
      : role === 'cooperative'
        ? 'workflow.evidence.search.cooperative'
        : 'workflow.evidence.search.default';
  return wf(key, 'Search by name, farmer, community, or hash...', t);
}

export function getEvidenceFilterStatusLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.filter.status', 'Status:', t);
}

export function getEvidenceFilterStatusOption(
  status: 'all' | 'verified' | 'pending_review' | 'renewal_due' | 'expired',
  t?: TranslateFn,
): string {
  const map: Record<typeof status, string> = {
    all: 'workflow.evidence.filter.all',
    verified: 'workflow.evidence.filter.verified',
    pending_review: 'workflow.evidence.filter.pending',
    renewal_due: 'workflow.evidence.filter.renewal',
    expired: 'workflow.evidence.filter.expired',
  };
  const fallbacks: Record<typeof status, string> = {
    all: 'All',
    verified: 'Verified',
    pending_review: 'Pending',
    renewal_due: 'Renewal',
    expired: 'Expired',
  };
  return wf(map[status], fallbacks[status], t);
}

export function getEvidenceLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.evidence.loading', 'Loading evidence records...', t);
}

export function getEvidenceEmptyMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'workflow.evidence.empty.importer' : 'workflow.evidence.empty.default';
  return wf(key, 'No documents match your filters', t);
}

export function getEvidenceDocTypeLabel(type: EvidenceDocType, t?: TranslateFn): string {
  return wf(`workflow.evidence.doc_type.${type}`, type.replace(/_/g, ' '), t);
}

export function getEvidenceUploadedLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.uploaded', 'Uploaded:', t);
}

export function getEvidenceExpiresLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.expires', 'Expires:', t);
}

export function getEvidenceUploaderLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.uploader', 'Uploader', t);
}

export function getEvidenceHashFullLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.hash_full', 'Full SHA-256 Hash', t);
}

export function getEvidenceLinkedEntitiesLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.linked_entities', 'Linked entities', t);
}

export function getEvidenceReviewHistoryLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.review_history', 'Review history', t);
}

export function getEvidenceViewFullLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.view_full', 'View full document', t);
}

export function getEvidenceDeleteLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.delete', 'Delete', t);
}

export function getEvidenceUploadPageTitle(t?: TranslateFn): string {
  return wf('workflow.evidence.upload.page.title', 'Upload FPIC Evidence', t);
}

export function getEvidenceUploadPageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.evidence.upload.page.subtitle',
    'Submit consent and supporting documents for FPIC review',
    t,
  );
}

export function getEvidenceUploadBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.upload.breadcrumb', 'Upload', t);
}

export function getEvidenceUploadBackLabel(t?: TranslateFn): string {
  return wf('workflow.evidence.upload.back', 'Back to FPIC', t);
}

export function getEvidenceUploadFormTitle(t?: TranslateFn): string {
  return wf('workflow.evidence.upload.form_title', 'FPIC Upload', t);
}

export function getEvidenceUploadPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.evidence.upload.placeholder',
    'This route is active and ready for upload form wiring.',
    t,
  );
}

export function getDdsNewPageTitle(t?: TranslateFn): string {
  return wf('workflow.dds.new.title', 'New DDS Package', t);
}

export function getDdsNewPageSubtitle(t?: TranslateFn): string {
  return wf('workflow.dds.new.subtitle', 'Create a new deforestation due diligence package', t);
}

export function getDdsNewBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.dds.new.breadcrumb', 'New', t);
}

export function getDdsNewBackLabel(t?: TranslateFn): string {
  return wf('workflow.dds.new.back', 'Back to DDS Workspace', t);
}

export function getDdsNewFormTitle(t?: TranslateFn): string {
  return wf('workflow.dds.new.form_title', 'DDS Creation Form', t);
}

export function getDdsNewPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.dds.new.placeholder',
    'This route is now live and ready for form implementation.',
    t,
  );
}

export function getPlotBreakdownTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.title.importer'
      : 'workflow.compliance.plot.title.default';
  return wf(key, en.getPlotBreakdownTitle(role), t);
}

export function getPlotBreakdownSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.subtitle.importer'
      : 'workflow.compliance.plot.subtitle.default';
  return wf(key, en.getPlotBreakdownSubtitle(role), t);
}

export function getPlotReadyMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.ready.importer'
      : 'workflow.compliance.plot.ready.default';
  return wf(key, en.getPlotReadyMessage(role), t);
}

export function getPlotBreakdownStatTotalLabel(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.stat.total.importer'
      : 'workflow.compliance.plot.stat.total.default';
  return wf(key, role === 'importer' ? 'Total Records' : 'Total Plots', t);
}

export function getPlotBreakdownStatCompliantLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot.stat.compliant', 'Compliant', t);
}

export function getPlotBreakdownStatNonCompliantLabel(t?: TranslateFn): string {
  return wf('workflow.compliance.plot.stat.non_compliant', 'Non-Compliant', t);
}

export function getPlotBreakdownDetailsSectionTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.details.importer'
      : 'workflow.compliance.plot.details.default';
  return wf(key, role === 'importer' ? 'Evidence Details' : 'Plot Details', t);
}

export function getPlotBreakdownRiskPrefix(t?: TranslateFn): string {
  return wf('workflow.compliance.plot.risk_prefix', 'Risk:', t);
}

export function getPlotBreakdownComplianceBadge(isCompliant: boolean, t?: TranslateFn): string {
  return isCompliant
    ? getPlotBreakdownStatCompliantLabel(t)
    : getPlotBreakdownStatNonCompliantLabel(t);
}

export function getPlotBreakdownBlockingTitle(t?: TranslateFn): string {
  return wf('workflow.compliance.plot.blocking.title', 'Blocking Issues Detected', t);
}

export function getPlotBreakdownBlockingItem(plotName: string, t?: TranslateFn): string {
  return wf(
    'workflow.compliance.plot.blocking.item',
    '{{name}} has deforestation evidence requiring resolution',
    t,
    { name: plotName },
  );
}

export function getPlotBreakdownViewDetailsCta(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.view_details.importer'
      : 'workflow.compliance.plot.view_details.default';
  return wf(key, role === 'importer' ? 'View Exception Details' : 'View Evidence Details', t);
}

export function getPlotBreakdownAllReadyTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer'
      ? 'workflow.compliance.plot.all_ready.importer'
      : 'workflow.compliance.plot.all_ready.default';
  return wf(key, role === 'importer' ? 'All Records Ready' : 'All Plots Verified', t);
}

export function getComplianceHubPackageIdLine(packageId: string | null | undefined, t?: TranslateFn): string {
  return wf('workflow.compliance.hub.package_id', 'ID: {{id}}', t, { id: packageId ?? 'n/a' });
}

export function formatSlaTimeRemaining(hours: number, t?: TranslateFn): string {
  if (hours <= 0) return wf('workflow.sla.time.overdue', 'Overdue', t);
  if (hours < 1) {
    return wf('workflow.sla.time.minutes', '{{minutes}}m', t, { minutes: Math.round(hours * 60) });
  }
  if (hours < 24) {
    return wf('workflow.sla.time.hours', '{{hours}}h', t, { hours: Math.round(hours) });
  }
  if (hours < 48) {
    return wf('workflow.sla.time.hours_days', '{{hours}}h ({{days}}d)', t, {
      hours: Math.round(hours),
      days: Math.round(hours / 24),
    });
  }
  return wf('workflow.sla.time.days', '{{days}}d', t, { days: Math.round(hours / 24) });
}

export function getSlaProgressLabel(t?: TranslateFn): string {
  return wf('workflow.sla.progress_label', 'SLA', t);
}

export function getSlaEscalationTimelineTitle(t?: TranslateFn): string {
  return wf('workflow.sla.timeline.title', 'SLA Escalation Timeline', t);
}

export function getSlaEscalationSeverityDescription(
  severity: string,
  initialHours: number,
  t?: TranslateFn,
): string {
  return wf(
    'workflow.sla.timeline.severity_desc',
    '{{severity}} severity - {{hours}}h initial SLA',
    t,
    { severity, hours: initialHours },
  );
}

export function getSlaEscalationLevelName(levelName: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    'Initial Assignment': 'workflow.sla.level.initial_assignment',
    'First Reminder': 'workflow.sla.level.first_reminder',
    'Manager Escalation': 'workflow.sla.level.manager_escalation',
    'Manager Alert': 'workflow.sla.level.manager_alert',
    'Compliance Lead': 'workflow.sla.level.compliance_lead',
    'Auto-Hold': 'workflow.sla.level.auto_hold',
    Reminder: 'workflow.sla.level.reminder',
    'SLA Breach': 'workflow.sla.level.sla_breach',
  };
  const key = keyMap[levelName];
  if (key) return wf(key, levelName, t);
  return levelName;
}

export function getSlaEscalationTargetRole(targetRole: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    'Assigned Owner': 'workflow.sla.role.assigned_owner',
    'Team Manager': 'workflow.sla.role.team_manager',
    'Compliance Lead': 'workflow.sla.role.compliance_lead',
    System: 'workflow.sla.role.system',
  };
  const key = keyMap[targetRole];
  if (key) return wf(key, targetRole, t);
  return targetRole;
}

export function getSlaEscalationActionLabel(action: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    notify: 'workflow.sla.action.notify',
    escalate: 'workflow.sla.action.escalate',
    auto_hold: 'workflow.sla.action.auto_hold',
  };
  const key = keyMap[action];
  if (key) {
    const fallbackMap: Record<string, string> = {
      notify: 'notify',
      escalate: 'escalate',
      auto_hold: 'auto_hold',
    };
    return wf(key, fallbackMap[action], t);
  }
  return action;
}

export function getSlaEscalationTriggerLabel(hoursBeforeBreach: number, t?: TranslateFn): string {
  if (hoursBeforeBreach === 0) {
    return wf('workflow.sla.trigger.at_breach', 'At breach', t);
  }
  return wf('workflow.sla.trigger.before_due', '{{hours}}h before due', t, { hours: hoursBeforeBreach });
}

export function getSlaEscalationCurrentBadge(t?: TranslateFn): string {
  return wf('workflow.sla.badge.current', 'Current', t);
}

export function getSlaRequestExtensionCta(t?: TranslateFn): string {
  return wf('workflow.sla.action.request_extension', 'Request Extension', t);
}

export function getSlaManualEscalateCta(t?: TranslateFn): string {
  return wf('workflow.sla.action.manual_escalate', 'Manual Escalate', t);
}

export function getSlaExtensionDialogTitle(t?: TranslateFn): string {
  return wf('workflow.sla.extension.title', 'Request SLA Extension', t);
}

export function getSlaExtensionDialogDescription(t?: TranslateFn): string {
  return wf(
    'workflow.sla.extension.description',
    'Provide a reason for extending the SLA deadline. This will be recorded in the audit log.',
    t,
  );
}

export function getSlaExtensionCurrentDeadlineLabel(t?: TranslateFn): string {
  return wf('workflow.sla.extension.current_deadline', 'Current Deadline', t);
}

export function getSlaExtensionReasonLabel(t?: TranslateFn): string {
  return wf('workflow.sla.extension.reason', 'Reason for Extension', t);
}

export function getSlaExtensionReasonPlaceholder(t?: TranslateFn): string {
  return wf('workflow.sla.extension.reason_placeholder', 'Explain why an extension is needed...', t);
}

export function getSlaExtensionSubmitCta(t?: TranslateFn): string {
  return wf('workflow.sla.extension.submit', 'Submit Request', t);
}

export function getSlaSummaryTitle(t?: TranslateFn): string {
  return wf('workflow.sla.summary.title', 'SLA Health', t);
}

export function getSlaSummaryOnTrackLabel(t?: TranslateFn): string {
  return wf('workflow.sla.summary.on_track', 'On Track', t);
}

export function getSlaSummaryAtRiskLabel(t?: TranslateFn): string {
  return wf('workflow.sla.summary.at_risk', 'At Risk', t);
}

export function getSlaSummaryBreachedLabel(t?: TranslateFn): string {
  return wf('workflow.sla.summary.breached', 'Breached', t);
}

export function getComplianceIssueDetailPageTitle(t?: TranslateFn): string {
  return wf('workflow.issues.detail.page_title', 'Compliance Issue', t);
}

export function getComplianceIssueDetailPageSubtitle(id: string, t?: TranslateFn): string {
  return wf('workflow.issues.detail.page_subtitle', 'Issue identifier: {{id}}', t, { id });
}

export function getComplianceIssueDetailCardTitle(t?: TranslateFn): string {
  return wf('workflow.issues.detail.card_title', 'Issue Detail', t);
}

export function getComplianceIssueDetailPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.issues.detail.placeholder',
    'Route enabled and ready for issue detail wiring.',
    t,
  );
}

export function getIssuesBackToListLabel(t?: TranslateFn): string {
  return wf('workflow.issues.detail.back_to_list', 'Back to issues', t);
}

export function getIntegrationsRunQueueTabLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.tab.run_queue', 'Run Queue', t);
}

export function getIntegrationsSchedulerTabLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.tab.scheduler', 'Scheduler', t);
}

export function getFieldOpsPageTitle(t?: TranslateFn): string {
  return wf('workflow.field_ops.title', 'Field Operations', t);
}

export function getFieldOpsPageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.field_ops.subtitle',
    'Coordinate field agents, mobile capture quality, and remediation campaigns',
    t,
  );
}

export function getFieldOpsStatLabel(
  stat: 'active_agents' | 'coverage' | 'sync_conflicts' | 'revoked_devices',
  t?: TranslateFn,
): string {
  const keyMap = {
    active_agents: 'workflow.field_ops.stat.active_agents',
    coverage: 'workflow.field_ops.stat.coverage',
    sync_conflicts: 'workflow.field_ops.stat.sync_conflicts',
    revoked_devices: 'workflow.field_ops.stat.revoked_devices',
  } as const;
  const fallbackMap = {
    active_agents: 'Active field agents',
    coverage: 'Coverage completed',
    sync_conflicts: 'Sync conflicts',
    revoked_devices: 'Revoked devices',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getFieldOpsTenureDescription(t?: TranslateFn): string {
  return wf(
    'workflow.field_ops.tenure.desc',
    'Confirm AI tenure extractions after farmers sync land documents from the field app.',
    t,
  );
}

export function getFieldOpsRemediationQueuesTitle(t?: TranslateFn): string {
  return wf('workflow.field_ops.remediation.title', 'Capture Remediation Queues', t);
}

export function getFieldOpsCreateCampaignCta(t?: TranslateFn): string {
  return wf('workflow.field_ops.remediation.create_campaign', 'Create Campaign', t);
}

export function getFieldOpsQueueItemLabel(
  item:
    | 'missing_member_profile'
    | 'missing_consent_grant'
    | 'missing_geometry_upgrade'
    | 'duplicate_reviews'
    | 'overdue_request_followup',
  t?: TranslateFn,
): string {
  const keyMap = {
    missing_member_profile: 'workflow.field_ops.queue.missing_member_profile',
    missing_consent_grant: 'workflow.field_ops.queue.missing_consent_grant',
    missing_geometry_upgrade: 'workflow.field_ops.queue.missing_geometry_upgrade',
    duplicate_reviews: 'workflow.field_ops.queue.duplicate_reviews',
    overdue_request_followup: 'workflow.field_ops.queue.overdue_request_followup',
  } as const;
  const fallbackMap = {
    missing_member_profile: 'Missing member profile',
    missing_consent_grant: 'Missing consent grant',
    missing_geometry_upgrade: 'Missing geometry upgrade',
    duplicate_reviews: 'Unresolved duplicate reviews',
    overdue_request_followup: 'Overdue request follow-up',
  } as const;
  return wf(keyMap[item], fallbackMap[item], t);
}

export function getGeometryRemediationPanelTitle(t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.title', 'Boundary capture follow-up', t);
}

export function getGeometryRemediationPanelDescription(t?: TranslateFn): string {
  return wf(
    'workflow.field_ops.geometry.description',
    'Recent mobile uploads rejected for self-intersection, overlap, or GPS sliver shape. Ask the member to redo the boundary on their phone, then retry upload.',
    t,
  );
}

export function getGeometryRemediationRecentBadge(count: number, t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.recent_badge', '{{count}} recent', t, { count });
}

export function getGeometryRemediationLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.loading', 'Loading geometry rejections…', t);
}

export function getGeometryRemediationEmptyMessage(t?: TranslateFn): string {
  return wf(
    'workflow.field_ops.geometry.empty',
    'No recent boundary rejections for this cooperative.',
    t,
  );
}

export function getGeometryRemediationUnnamedPlot(t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.unnamed_plot', 'Unnamed plot', t);
}

export function getGeometryRemediationMemberFixHint(t?: TranslateFn): string {
  return wf(
    'workflow.field_ops.geometry.member_fix',
    'Member fix: Plot details → Redo boundary on map → Upload plot to Tracebud.',
    t,
  );
}

export function getGeometryRemediationOpenPlotsCta(t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.open_plots', 'Open plot registry', t);
}

export function getGeometryRemediationFarmerSuffix(farmerId: string, t?: TranslateFn): string {
  return wf('workflow.field_ops.geometry.farmer_suffix', ' · farmer {{id}}…', t, {
    id: String(farmerId).slice(0, 8),
  });
}

export function getDashboardSubtitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter'
      ? 'workflow.dashboard.subtitle.exporter'
      : role === 'importer'
        ? 'workflow.dashboard.subtitle.importer'
        : role === 'cooperative'
          ? 'workflow.dashboard.subtitle.cooperative'
          : role === 'country_reviewer'
            ? 'workflow.dashboard.subtitle.reviewer'
            : role === 'sponsor'
              ? 'workflow.dashboard.subtitle.sponsor'
              : 'workflow.dashboard.subtitle.default';
  return wf(key, en.getDashboardSubtitle(role), t);
}

const PACKAGE_CREATE_MIN_YEAR = 2020;
const PACKAGE_CREATE_MAX_YEAR = 2030;
const PACKAGE_CREATE_MAX_SUPPLIER_LENGTH = 120;
const PACKAGE_CREATE_MAX_NOTES_LENGTH = 2000;

export function getPackageCreateVoucherValidationError(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'exporter' || role === 'cooperative'
      ? 'workflow.package.create.validation.voucher.upstream'
      : 'workflow.package.create.validation.voucher.default';
  return wf(key, en.getPackageCreateVoucherValidationError(role), t);
}

export type PackageCreateValidationForm = {
  supplier_name: string;
  season: string;
  year: number;
  notes: string;
  voucherIds: string[];
};

export type PackageCreateFieldErrors = Partial<Record<keyof PackageCreateValidationForm, string>>;

export function validatePackageCreateForm(
  form: PackageCreateValidationForm,
  role?: SupplyChainRole,
  t?: TranslateFn,
): PackageCreateFieldErrors {
  const errors: PackageCreateFieldErrors = {};
  const supplier = form.supplier_name.trim();

  if (!supplier) {
    errors.supplier_name = wf(
      'workflow.package.create.validation.supplier_required',
      'Supplier or cooperative name is required.',
      t,
    );
  } else if (supplier.length > PACKAGE_CREATE_MAX_SUPPLIER_LENGTH) {
    errors.supplier_name = wf(
      'workflow.package.create.validation.supplier_max',
      `Supplier name must be ${PACKAGE_CREATE_MAX_SUPPLIER_LENGTH} characters or fewer.`,
      t,
      { max: PACKAGE_CREATE_MAX_SUPPLIER_LENGTH },
    );
  }

  if (form.season !== 'A' && form.season !== 'B') {
    errors.season = wf('workflow.package.create.validation.season', 'Season must be A or B.', t);
  }

  if (
    !Number.isFinite(form.year) ||
    form.year < PACKAGE_CREATE_MIN_YEAR ||
    form.year > PACKAGE_CREATE_MAX_YEAR
  ) {
    errors.year = wf(
      'workflow.package.create.validation.year',
      `Year must be between ${PACKAGE_CREATE_MIN_YEAR} and ${PACKAGE_CREATE_MAX_YEAR}.`,
      t,
      { min: PACKAGE_CREATE_MIN_YEAR, max: PACKAGE_CREATE_MAX_YEAR },
    );
  }

  if (form.notes.trim().length > PACKAGE_CREATE_MAX_NOTES_LENGTH) {
    errors.notes = wf(
      'workflow.package.create.validation.notes_max',
      `Notes must be ${PACKAGE_CREATE_MAX_NOTES_LENGTH} characters or fewer.`,
      t,
      { max: PACKAGE_CREATE_MAX_NOTES_LENGTH },
    );
  }

  if (!Array.isArray(form.voucherIds) || form.voucherIds.length === 0) {
    errors.voucherIds = getPackageCreateVoucherValidationError(role, t);
  }

  return errors;
}

export function hasPackageCreateErrors(errors: PackageCreateFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getShipmentAssembleCtaLabel(t?: TranslateFn): string {
  return wf('workflow.shipment.assemble_cta', 'Assemble & Seal', t);
}

export function getShipmentStatusTitle(t?: TranslateFn): string {
  return wf('workflow.shipment.status_title', 'Shipment status', t);
}

export function getShipmentSelectBatchesTitle(t?: TranslateFn): string {
  return wf('workflow.shipment.select_batches_title', 'Select Batches', t);
}

export function getShipmentLoadingBatchesMessage(t?: TranslateFn): string {
  return wf('workflow.shipment.loading_batches', 'Loading batches…', t);
}

export function getShipmentCreatingLabel(t?: TranslateFn): string {
  return wf('workflow.shipment.creating', 'Creating…', t);
}

export function getShipmentCreateAndAssembleLabel(t?: TranslateFn): string {
  return wf('workflow.shipment.create_and_assemble', 'Create & Assemble', t);
}

export function getShipmentAssemblePageTitle(reference: string, t?: TranslateFn): string {
  return wf('workflow.shipment.assemble_page_title', `Assemble ${reference}`, t, { reference });
}

export function getShipmentAssembleBreadcrumbLabel(t?: TranslateFn): string {
  return wf('workflow.shipment.assemble_breadcrumb', 'Assemble', t);
}

export function getShipmentBackToShipmentLabel(t?: TranslateFn): string {
  return wf('workflow.shipment.back_to_shipment', 'Back to Shipment', t);
}

export function getShipmentLoadingAssemblyMessage(t?: TranslateFn): string {
  return wf('workflow.shipment.loading_assembly', 'Loading shipment assembly…', t);
}

export function getShipmentAssemblySteps(t?: TranslateFn) {
  return [
    {
      id: 'select_batches' as const,
      label: wf('workflow.shipment.step.included_batches', 'Included Batches', t),
      description: wf('workflow.shipment.step.included_batches_hint', 'Voucher packages in this shipment', t),
    },
    {
      id: 'allocate_coverage' as const,
      label: wf('workflow.shipment.step.allocate_coverage', 'Allocate Coverage', t),
      description: wf('workflow.shipment.step.allocate_coverage_hint', 'Assign to shipment lines', t),
    },
    {
      id: 'validate_issues' as const,
      label: wf('workflow.shipment.step.validate_issues', 'Validate Issues', t),
      description: wf('workflow.shipment.step.validate_issues_hint', 'Check blocking conditions', t),
    },
    {
      id: 'seal_shipment' as const,
      label: wf('workflow.shipment.step.seal', 'Seal Shipment', t),
      description: wf('workflow.shipment.step.seal_hint', 'Finalize before EU filing', t),
    },
  ];
}

export function getShipmentAssemblyStepTitle(
  step: 1 | 2 | 3 | 4,
  batchLabel: string,
  t?: TranslateFn,
): string {
  const keys = {
    1: 'workflow.shipment.step1.included',
    2: 'workflow.shipment.step2.allocate',
    3: 'workflow.shipment.step3.validate',
    4: 'workflow.shipment.step4.seal',
  } as const;
  const fallbacks = {
    1: `Step 1: Included ${batchLabel}`,
    2: 'Step 2: Allocate Coverage',
    3: 'Step 3: Validate Issues',
    4: 'Step 4: Seal Shipment',
  } as const;
  return wf(keys[step], fallbacks[step], t, step === 1 ? { batchLabel } : undefined);
}

export function getDdsWorkspaceTitle(t?: TranslateFn): string {
  return wf('workflow.dds.title', 'DDS Workspace', t);
}

export function getDdsNewPackageLabel(t?: TranslateFn): string {
  return wf('workflow.dds.new_package', 'New DDS Package', t);
}

export function getDdsTabLabels(t?: TranslateFn) {
  return {
    packages: wf('workflow.dds.tab.packages', 'DDS Packages', t),
    preflight: wf('workflow.dds.tab.preflight', 'Pre-flight Checklist', t),
    states: wf('workflow.dds.tab.states', 'State Diagram', t),
  };
}

export function getDdsLoadingMessage(t?: TranslateFn): string {
  return wf('workflow.dds.loading', 'Loading DDS packages...', t);
}

export function getDdsPreflightScoreLabel(t?: TranslateFn): string {
  return wf('workflow.dds.preflight_score', 'Pre-flight Score', t);
}

export function getDdsPreflightChecks(t?: TranslateFn) {
  const checks = [
    {
      id: 'deforestation',
      name: 'Deforestation Check',
      description: 'Verify no deforestation on or after cutoff date',
    },
    {
      id: 'degradation',
      name: 'Degradation Check',
      description: 'Verify no degradation on or after cutoff date',
    },
    {
      id: 'tenure',
      name: 'Tenure Check',
      description: 'Verify legitimate tenure or possession',
    },
    {
      id: 'protected_area',
      name: 'Protected Area Check',
      description: 'Verify no protected areas involvement',
    },
    {
      id: 'fpic',
      name: 'FPIC Check',
      description: 'Verify Free Prior Informed Consent obtained',
    },
    {
      id: 'yield_capacity',
      name: 'Yield Capacity Check',
      description: 'Verify production capacity & competence',
    },
    {
      id: 'data_completeness',
      name: 'Data Completeness',
      description: 'Verify all required fields populated',
    },
  ] as const;

  return checks.map((check) => ({
    id: check.id,
    name: wf(`workflow.dds.preflight.check.${check.id}.name`, check.name, t),
    description: wf(`workflow.dds.preflight.check.${check.id}.description`, check.description, t),
    status: 'pass' as const,
  }));
}

export type ReportsAudience = 'default' | 'importer' | 'cooperative';

export function getReportsPageHeader(
  audience: ReportsAudience,
  t?: TranslateFn,
): { title: string; description: string } {
  if (audience === 'importer') {
    return {
      title: wf('page.reports.title_importer', 'Reporting', t),
      description: wf(
        'page.reports.subtitle_importer',
        'Generate annual and operational reporting snapshots with compliance traceability',
        t,
      ),
    };
  }
  if (audience === 'cooperative') {
    return {
      title: wf('page.reports.title_cooperative', 'Reporting', t),
      description: wf(
        'page.reports.subtitle_cooperative',
        'Track cooperative health, premium distribution, and compliance readiness snapshots',
        t,
      ),
    };
  }
  return {
    title: wf('page.reports.title', 'Reports & Analytics', t),
    description: wf('page.reports.subtitle', 'Generate compliance reports and view analytics', t),
  };
}

export function getReportsPeriodLabel(period: '6months', t?: TranslateFn): string {
  const keyMap = { '6months': 'workflow.reports.period.6months' } as const;
  const fallbackMap = { '6months': 'Last 6 Months' } as const;
  return wf(keyMap[period], fallbackMap[period], t);
}

export function getReportsGenerateCta(audience: ReportsAudience, t?: TranslateFn): string {
  if (audience === 'importer') {
    return wf('workflow.reports.cta.generate_snapshot', 'Generate Snapshot', t);
  }
  return wf('workflow.reports.cta.generate_report', 'Generate Report', t);
}

export function getReportsQuickStatLabel(
  stat:
    | 'compliance_rate'
    | 'declaration_readiness'
    | 'member_data_completeness'
    | 'compliant_plots'
    | 'compliant_evidence'
    | 'active_members'
    | 'packages_ytd'
    | 'shipments_ytd'
    | 'active_campaigns'
    | 'reports_generated'
    | 'reporting_snapshots'
    | 'mapped_plot_coverage',
  audience: ReportsAudience,
  t?: TranslateFn,
): string {
  if (audience === 'cooperative') {
    const cooperativeMap = {
      compliance_rate: 'workflow.reports.stat.member_data_completeness',
      declaration_readiness: 'workflow.reports.stat.member_data_completeness',
      member_data_completeness: 'workflow.reports.stat.member_data_completeness',
      compliant_plots: 'workflow.reports.stat.active_members',
      compliant_evidence: 'workflow.reports.stat.active_members',
      active_members: 'workflow.reports.stat.active_members',
      packages_ytd: 'workflow.reports.stat.active_campaigns',
      shipments_ytd: 'workflow.reports.stat.active_campaigns',
      active_campaigns: 'workflow.reports.stat.active_campaigns',
      reports_generated: 'workflow.reports.stat.mapped_plot_coverage',
      reporting_snapshots: 'workflow.reports.stat.mapped_plot_coverage',
      mapped_plot_coverage: 'workflow.reports.stat.mapped_plot_coverage',
    } as const;
    const cooperativeFallback = {
      compliance_rate: 'Member Data Completeness',
      declaration_readiness: 'Member Data Completeness',
      member_data_completeness: 'Member Data Completeness',
      compliant_plots: 'Active Members',
      compliant_evidence: 'Active Members',
      active_members: 'Active Members',
      packages_ytd: 'Active Campaigns',
      shipments_ytd: 'Active Campaigns',
      active_campaigns: 'Active Campaigns',
      reports_generated: 'Mapped Plot Coverage',
      reporting_snapshots: 'Mapped Plot Coverage',
      mapped_plot_coverage: 'Mapped Plot Coverage',
    } as const;
    return wf(cooperativeMap[stat], cooperativeFallback[stat], t);
  }
  if (audience === 'importer') {
    const importerMap = {
      compliance_rate: 'workflow.reports.stat.declaration_readiness',
      declaration_readiness: 'workflow.reports.stat.declaration_readiness',
      member_data_completeness: 'workflow.reports.stat.declaration_readiness',
      compliant_plots: 'workflow.reports.stat.compliant_evidence',
      compliant_evidence: 'workflow.reports.stat.compliant_evidence',
      active_members: 'workflow.reports.stat.compliant_evidence',
      packages_ytd: 'workflow.reports.stat.shipments_ytd',
      shipments_ytd: 'workflow.reports.stat.shipments_ytd',
      active_campaigns: 'workflow.reports.stat.shipments_ytd',
      reports_generated: 'workflow.reports.stat.reporting_snapshots',
      reporting_snapshots: 'workflow.reports.stat.reporting_snapshots',
      mapped_plot_coverage: 'workflow.reports.stat.reporting_snapshots',
    } as const;
    const importerFallback = {
      compliance_rate: 'Declaration Readiness Rate',
      declaration_readiness: 'Declaration Readiness Rate',
      member_data_completeness: 'Declaration Readiness Rate',
      compliant_plots: 'Compliant Evidence Records',
      compliant_evidence: 'Compliant Evidence Records',
      active_members: 'Compliant Evidence Records',
      packages_ytd: 'Shipments (YTD)',
      shipments_ytd: 'Shipments (YTD)',
      active_campaigns: 'Shipments (YTD)',
      reports_generated: 'Reporting Snapshots',
      reporting_snapshots: 'Reporting Snapshots',
      mapped_plot_coverage: 'Reporting Snapshots',
    } as const;
    return wf(importerMap[stat], importerFallback[stat], t);
  }
  const defaultMap = {
    compliance_rate: 'workflow.reports.stat.compliance_rate',
    declaration_readiness: 'workflow.reports.stat.compliance_rate',
    member_data_completeness: 'workflow.reports.stat.compliance_rate',
    compliant_plots: 'workflow.reports.stat.compliant_plots',
    compliant_evidence: 'workflow.reports.stat.compliant_plots',
    active_members: 'workflow.reports.stat.compliant_plots',
    packages_ytd: 'workflow.reports.stat.packages_ytd',
    shipments_ytd: 'workflow.reports.stat.packages_ytd',
    active_campaigns: 'workflow.reports.stat.packages_ytd',
    reports_generated: 'workflow.reports.stat.reports_generated',
    reporting_snapshots: 'workflow.reports.stat.reports_generated',
    mapped_plot_coverage: 'workflow.reports.stat.reports_generated',
  } as const;
  const defaultFallback = {
    compliance_rate: 'Compliance Rate',
    declaration_readiness: 'Compliance Rate',
    member_data_completeness: 'Compliance Rate',
    compliant_plots: 'Compliant Plots',
    compliant_evidence: 'Compliant Plots',
    active_members: 'Compliant Plots',
    packages_ytd: 'Packages (YTD)',
    shipments_ytd: 'Packages (YTD)',
    active_campaigns: 'Packages (YTD)',
    reports_generated: 'Reports Generated',
    reporting_snapshots: 'Reports Generated',
    mapped_plot_coverage: 'Reports Generated',
  } as const;
  return wf(defaultMap[stat], defaultFallback[stat], t);
}

export function getReportsTrendTitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'cooperative'
      ? 'workflow.reports.trend.title.cooperative'
      : audience === 'importer'
        ? 'workflow.reports.trend.title.importer'
        : 'workflow.reports.trend.title.default';
  const fallback =
    audience === 'cooperative'
      ? 'Operational Trend'
      : audience === 'importer'
        ? 'Declaration Trends'
        : 'Submission Trends';
  return wf(key, fallback, t);
}

export function getReportsTrendSubtitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'cooperative'
      ? 'workflow.reports.trend.subtitle.cooperative'
      : audience === 'importer'
        ? 'workflow.reports.trend.subtitle.importer'
        : 'workflow.reports.trend.subtitle.default';
  const fallback =
    audience === 'cooperative'
      ? 'Monthly field-capture completion and governance approval cadence'
      : audience === 'importer'
        ? 'Monthly shipment declaration submissions and outcomes'
        : 'Monthly package submission and approval rates';
  return wf(key, fallback, t);
}

export function getReportsTrendLegendLabel(
  kind: 'approved' | 'pending',
  audience: ReportsAudience,
  t?: TranslateFn,
): string {
  if (kind === 'approved') {
    const key =
      audience === 'cooperative'
        ? 'workflow.reports.trend.legend.approved.cooperative'
        : 'workflow.reports.trend.legend.approved.default';
    return wf(key, audience === 'cooperative' ? 'Completed' : 'Approved', t);
  }
  const key =
    audience === 'cooperative'
      ? 'workflow.reports.trend.legend.pending.cooperative'
      : 'workflow.reports.trend.legend.pending.default';
  return wf(key, audience === 'cooperative' ? 'Outstanding' : 'Pending', t);
}

export function getReportsDistributionTitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'default'
      ? 'workflow.reports.distribution.title.default'
      : 'workflow.reports.distribution.title.readiness';
  return wf(key, audience === 'default' ? 'Compliance Distribution' : 'Readiness Distribution', t);
}

export function getReportsDistributionSubtitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'cooperative'
      ? 'workflow.reports.distribution.subtitle.cooperative'
      : audience === 'importer'
        ? 'workflow.reports.distribution.subtitle.importer'
        : 'workflow.reports.distribution.subtitle.default';
  const fallback =
    audience === 'cooperative'
      ? 'Breakdown of cooperative readiness status'
      : audience === 'importer'
        ? 'Breakdown of shipment readiness status'
        : 'Breakdown of plot compliance status';
  return wf(key, fallback, t);
}

export function getReportsReadinessStatusLabel(
  status: 'Compliant' | 'Warnings' | 'Blocked',
  t?: TranslateFn,
): string {
  const keyMap = {
    Compliant: 'workflow.reports.readiness.compliant',
    Warnings: 'workflow.reports.readiness.warnings',
    Blocked: 'workflow.reports.readiness.blocked',
  } as const;
  return wf(keyMap[status], status, t);
}

export function getReportsSectionGenerateTitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'cooperative'
      ? 'workflow.reports.section.generate.cooperative'
      : audience === 'importer'
        ? 'workflow.reports.section.generate.importer'
        : 'workflow.reports.section.generate.default';
  const fallback =
    audience === 'cooperative'
      ? 'Generate Cooperative Reports'
      : audience === 'importer'
        ? 'Generate Reporting Snapshots'
        : 'Generate Reports';
  return wf(key, fallback, t);
}

export function getReportsGenerateButtonLabel(t?: TranslateFn): string {
  return wf('workflow.reports.generate', 'Generate', t);
}

export function getReportsRecentTitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'importer'
      ? 'workflow.reports.recent.title.importer'
      : 'workflow.reports.recent.title.default';
  return wf(key, audience === 'importer' ? 'Recent Snapshots' : 'Recent Reports', t);
}

export function getReportsRecentSubtitle(audience: ReportsAudience, t?: TranslateFn): string {
  const key =
    audience === 'importer'
      ? 'workflow.reports.recent.subtitle.importer'
      : 'workflow.reports.recent.subtitle.default';
  return wf(
    key,
    audience === 'importer' ? 'Previously generated reporting snapshots' : 'Previously generated reports',
    t,
  );
}

export function getReportsFilterLabel(t?: TranslateFn): string {
  return wf('workflow.reports.filter', 'Filter', t);
}

export function getReportsTypeCardCopy(
  type: 'compliance' | 'package' | 'deforestation' | 'activity',
  field: 'title' | 'description',
  t?: TranslateFn,
): string {
  const fallbacks = {
    compliance: {
      title: 'Compliance Report',
      description: 'Full EUDR compliance status across all packages and plots',
    },
    package: {
      title: 'Package Summary',
      description: 'Overview of DDS packages with submission status',
    },
    deforestation: {
      title: 'Deforestation Risk',
      description: 'Plot-level deforestation risk assessment breakdown',
    },
    activity: {
      title: 'Activity Log',
      description: 'Detailed audit trail of all system activities',
    },
  } as const;
  return wf(`workflow.reports.type.${type}.${field}`, fallbacks[type][field], t);
}

export function getRoleDecisionsStatLabel(
  stat: 'total' | 'pending' | 'operator' | 'simplified' | 'downstream',
  t?: TranslateFn,
): string {
  const keyMap = {
    total: 'workflow.role_decisions.stat.total',
    pending: 'workflow.role_decisions.stat.pending',
    operator: 'workflow.role_decisions.stat.operator',
    simplified: 'workflow.role_decisions.stat.simplified',
    downstream: 'workflow.role_decisions.stat.downstream',
  } as const;
  const fallbackMap = {
    total: 'Total Decisions',
    pending: 'Pending Review',
    operator: 'Operators',
    simplified: 'Simplified Path',
    downstream: 'Downstream',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getRoleDecisionsManualClassifyAlertTitle(t?: TranslateFn): string {
  return wf('workflow.role_decisions.alert.title', 'Manual Classification Required', t);
}

export function getRoleDecisionsManualClassifyAlertBody(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.alert.body',
    '{{count}} shipment(s) are held with PENDING_MANUAL_CLASSIFICATION status. No DDS can be submitted and no shipment can be sealed until these are resolved.',
    t,
    { count },
  );
}

export function getRoleDecisionsReviewPendingCta(t?: TranslateFn): string {
  return wf('workflow.role_decisions.alert.cta', 'Review Pending', t);
}

export function getRoleDecisionsSearchPlaceholder(t?: TranslateFn): string {
  return wf('workflow.role_decisions.search_placeholder', 'Search by shipment code or organization...', t);
}

export function getRoleDecisionsFilterAllRolesLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.filter.all_roles', 'All Roles', t);
}

export function getRoleDecisionsPendingSectionTitle(count: number, t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.section.pending',
    'Pending Manual Classification ({{count}})',
    t,
    { count },
  );
}

export function getRoleDecisionsResolvedSectionTitle(count: number, t?: TranslateFn): string {
  return wf('workflow.role_decisions.section.resolved', 'Resolved Decisions ({{count}})', t, { count });
}

export function getRoleDecisionsEmptyState(t?: TranslateFn): string {
  return wf('workflow.role_decisions.empty', 'No role decisions available yet for this tenant.', t);
}

export function getRoleDecisionsHoldReasonPrefix(t?: TranslateFn): string {
  return wf('workflow.role_decisions.hold_reason', 'Hold Reason:', t);
}

export function getRoleDecisionsViewDetailsLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.view_details', 'View Details', t);
}

export function getRoleDecisionsClassifyLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.classify', 'Classify', t);
}

export function getRoleDecisionsViewLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.view', 'View', t);
}

export function getRoleDecisionsTableColumnLabel(
  column: 'shipment' | 'organization' | 'legal_role' | 'workflow' | 'decided' | 'actions',
  t?: TranslateFn,
): string {
  const keyMap = {
    shipment: 'workflow.role_decisions.table.shipment',
    organization: 'workflow.role_decisions.table.organization',
    legal_role: 'workflow.role_decisions.table.legal_role',
    workflow: 'workflow.role_decisions.table.workflow',
    decided: 'workflow.role_decisions.table.decided',
    actions: 'workflow.role_decisions.table.actions',
  } as const;
  const fallbackMap = {
    shipment: 'Shipment',
    organization: 'Organization',
    legal_role: 'Legal Role',
    workflow: 'Workflow',
    decided: 'Decided',
    actions: 'Actions',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getRoleDecisionsDetailDialogTitle(t?: TranslateFn): string {
  return wf('workflow.role_decisions.detail.title', 'Role Decision Details', t);
}

export function getRoleDecisionsDetailDialogSubtitle(shipmentCode: string, t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.detail.subtitle',
    'Legal workflow role classification for {{shipment}}',
    t,
    { shipment: shipmentCode },
  );
}

export function getRoleDecisionsDetailFieldLabel(
  field:
    | 'legal_role'
    | 'workflow_type'
    | 'organization'
    | 'regulatory_profile'
    | 'role_definition'
    | 'decision_path'
    | 'hold_reason',
  t?: TranslateFn,
): string {
  const keyMap = {
    legal_role: 'workflow.role_decisions.detail.legal_role',
    workflow_type: 'workflow.role_decisions.detail.workflow_type',
    organization: 'workflow.role_decisions.detail.organization',
    regulatory_profile: 'workflow.role_decisions.detail.regulatory_profile',
    role_definition: 'workflow.role_decisions.detail.role_definition',
    decision_path: 'workflow.role_decisions.detail.decision_path',
    hold_reason: 'workflow.role_decisions.detail.hold_reason',
  } as const;
  const fallbackMap = {
    legal_role: 'Legal Role',
    workflow_type: 'Workflow Type',
    organization: 'Organization',
    regulatory_profile: 'Regulatory Profile',
    role_definition: 'Role Definition',
    decision_path: 'Decision Path',
    hold_reason: 'Hold Reason',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getRoleDecisionsCloseLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.close', 'Close', t);
}

export function getRoleDecisionsManualClassifyCta(t?: TranslateFn): string {
  return wf('workflow.role_decisions.manual_classify', 'Manually Classify', t);
}

export function getRoleDecisionsClassifyDialogTitle(t?: TranslateFn): string {
  return wf('workflow.role_decisions.classify_dialog.title', 'Manual Role Classification', t);
}

export function getRoleDecisionsClassifyDialogSubtitle(shipmentCode: string, t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.classify_dialog.subtitle',
    'Override the automatic role decision for {{shipment}}',
    t,
    { shipment: shipmentCode },
  );
}

export function getRoleDecisionsClassifyNewRoleLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.classify_dialog.new_role', 'New Legal Role', t);
}

export function getRoleDecisionsClassifySelectRolePlaceholder(t?: TranslateFn): string {
  return wf('workflow.role_decisions.classify_dialog.select_role', 'Select a role...', t);
}

export function getRoleDecisionsClassifyJustificationLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.classify_dialog.justification', 'Justification (Required)', t);
}

export function getRoleDecisionsClassifyJustificationPlaceholder(t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.classify_dialog.justification_placeholder',
    'Explain why this manual classification is appropriate...',
    t,
  );
}

export function getRoleDecisionsClassifyAuditHint(t?: TranslateFn): string {
  return wf(
    'workflow.role_decisions.classify_dialog.audit_hint',
    'This will be recorded in the audit log with your user ID and timestamp.',
    t,
  );
}

export function getRoleDecisionsCancelLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.cancel', 'Cancel', t);
}

export function getRoleDecisionsConfirmClassificationLabel(t?: TranslateFn): string {
  return wf('workflow.role_decisions.confirm_classification', 'Confirm Classification', t);
}

export function getIntegrationsRunQueueLoadErrorLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.run_queue.load_error', 'Failed to load run operations data.', t);
}

export function getIntegrationsReleaseStaleLabel(count: number, t?: TranslateFn): string {
  return wf('workflow.integrations.run_queue.release_stale', 'Release Stale ({{count}})', t, { count });
}

export function getIntegrationsSchedulerLoadingLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.scheduler.loading', 'Loading scheduler config...', t);
}
