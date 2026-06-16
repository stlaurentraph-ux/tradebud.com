import { t as translate, type Locale } from '@/lib/i18n';
import type { User, TenantRole, LegalWorkflowRole } from '@/types';
import * as en from '@/lib/supply-chain-terminology';
import { getDashboardBreadcrumbLabel, getMiniReviewImporterFilingAction } from '@/lib/terminology-labels';
import { translateNavItemName } from '@/lib/nav-labels';
import { getIssueSlaUrgency } from '@/lib/compliance-issue-sla';
import { isMalformedEudrDdsStatusPayloadError } from '@/lib/eudr-dds-status-feedback';
import type { AdminOrgType, AdminStatus } from '@/lib/admin-service';

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
  'workflow.package.detail.assemble_blocked':
    'Resolve readiness blockers before assembling this shipment.',
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

const PRODUCER_DETAIL_COPY: Record<string, { key: string; fallback: string; cooperativeFallback?: string }> = {
  section_info: {
    key: 'workflow.producers.detail.section.info',
    fallback: 'Producer Information',
    cooperativeFallback: 'Member Information',
  },
  field_name: { key: 'workflow.producers.detail.field.name', fallback: 'Name' },
  field_email: { key: 'workflow.producers.detail.field.email', fallback: 'Email' },
  field_phone: { key: 'workflow.producers.detail.field.phone', fallback: 'Phone' },
  field_organisation: { key: 'workflow.producers.detail.field.organisation', fallback: 'Organisation' },
  field_country: { key: 'workflow.producers.detail.field.country', fallback: 'Country' },
  field_directory_status: {
    key: 'workflow.producers.detail.field.directory_status',
    fallback: 'Directory status',
  },
  section_verification: {
    key: 'workflow.producers.detail.section.verification',
    fallback: 'Verification Status',
  },
  badge_engaged: {
    key: 'workflow.producers.detail.badge.engaged',
    fallback: 'Engaged in programme',
  },
  badge_pending_engagement: {
    key: 'workflow.producers.detail.badge.pending_engagement',
    fallback: 'Pending engagement',
  },
  badge_consent_granted: {
    key: 'workflow.producers.detail.badge.consent_granted',
    fallback: 'CRM consent marked granted',
  },
  badge_consent_not_granted: {
    key: 'workflow.producers.detail.badge.consent_not_granted',
    fallback: 'CRM consent not granted',
  },
  section_field_app: {
    key: 'workflow.producers.detail.section.field_app',
    fallback: 'Field app link',
  },
  field_app_linked: {
    key: 'workflow.producers.detail.field_app.linked',
    fallback: 'Linked to field-app profile. Data access is governed by producer consent grants below.',
  },
  field_app_not_linked: {
    key: 'workflow.producers.detail.field_app.not_linked',
    fallback:
      'Not linked yet. Ask the producer to create a Tracebud field account using {{email}}.',
  },
  resolve_error_no_account: {
    key: 'workflow.producers.detail.resolve_error.no_account',
    fallback:
      'No field-app account linked yet. The producer must sign up with the same email before you can request data access.',
    cooperativeFallback:
      'No field-app account linked yet. The member must sign up with the same email before you can request data access.',
  },
  load_error: {
    key: 'workflow.producers.detail.load_error',
    fallback: 'Failed to load producer.',
    cooperativeFallback: 'Failed to load member.',
  },
};

export function getProducerDetailCopy(
  key: keyof typeof PRODUCER_DETAIL_COPY,
  role?: SupplyChainRole,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = PRODUCER_DETAIL_COPY[key];
  const fallback =
    role === 'cooperative' && entry.cooperativeFallback ? entry.cooperativeFallback : entry.fallback;
  return wf(entry.key, fallback, t, values);
}

const PRODUCER_CONSENT_COPY: Record<string, { key: string; fallback: string; cooperativeFallback?: string }> = {
  title: { key: 'workflow.producers.consent.title', fallback: 'Data access consent' },
  intro: {
    key: 'workflow.producers.consent.intro',
    fallback:
      'Plot and evidence data is only visible after the producer approves a request in the Tracebud field app. The producer can revoke future access at any time. Data already in batches or shipments they sold to you cannot be withdrawn and may be retained for EU compliance (up to 5 years for importers).',
    cooperativeFallback:
      'Plot and evidence data is only visible after the member approves a request in the Tracebud field app. The member can revoke future access at any time. Data already in batches or shipments they sold to you cannot be withdrawn and may be retained for EU compliance (up to 5 years for importers).',
  },
  error_load: {
    key: 'workflow.producers.consent.error.load',
    fallback: 'Failed to load consent grants.',
  },
  message_already_granted: {
    key: 'workflow.producers.consent.message.already_granted',
    fallback: 'Producer already granted access.',
    cooperativeFallback: 'Member already granted access.',
  },
  message_pending: {
    key: 'workflow.producers.consent.message.pending',
    fallback: 'Request sent. The producer must approve in the Tracebud field app under Data sharing.',
    cooperativeFallback: 'Request sent. The member must approve in the Tracebud field app under Data sharing.',
  },
  message_recorded: {
    key: 'workflow.producers.consent.message.recorded',
    fallback: 'Consent request recorded.',
  },
  error_request: {
    key: 'workflow.producers.consent.error.request',
    fallback: 'Failed to request data access.',
  },
  revoked_prefix: {
    key: 'workflow.producers.consent.revoked.prefix',
    fallback: 'Future access revoked by the producer',
    cooperativeFallback: 'Future access revoked by the member',
  },
  revoked_on: { key: 'workflow.producers.consent.revoked.on', fallback: ' on {{date}}' },
  revoked_body: {
    key: 'workflow.producers.consent.revoked.body',
    fallback:
      '. You can no longer view new plots or harvests. Sold batch and shipment lineage already linked before revocation remains available for compliance',
  },
  revoked_until: { key: 'workflow.producers.consent.revoked.until', fallback: ' until {{date}}' },
  revoked_retention_default: {
    key: 'workflow.producers.consent.revoked.retention_default',
    fallback: ' (up to 5 years for importers)',
  },
  link_required: {
    key: 'workflow.producers.consent.link_required',
    fallback: 'Link this directory contact to a field-app account (same email) before you can request data access.',
  },
  no_active_consent: {
    key: 'workflow.producers.consent.no_active',
    fallback:
      "No active data access consent. You cannot view this producer's backed-up plots until they approve your request.",
    cooperativeFallback:
      "No active data access consent. You cannot view this member's backed-up plots until they approve your request.",
  },
  action_sending: { key: 'workflow.producers.consent.action.sending', fallback: 'Sending…' },
  action_pending: { key: 'workflow.producers.consent.action.pending', fallback: 'Request pending approval' },
  action_granted: { key: 'workflow.producers.consent.action.granted', fallback: 'Access already granted' },
  action_request: { key: 'workflow.producers.consent.action.request', fallback: 'Request data access' },
  empty_none: {
    key: 'workflow.producers.consent.empty.none',
    fallback: 'No consent requests yet for {{name}}.',
  },
  scope_prefix: { key: 'workflow.producers.consent.scope.prefix', fallback: 'Can see:' },
  granted_at: { key: 'workflow.producers.consent.granted_at', fallback: 'Granted: {{date}}' },
  revoked_at: { key: 'workflow.producers.consent.revoked_at', fallback: 'Revoked: {{date}}' },
  waiting_approval: {
    key: 'workflow.producers.consent.waiting_approval',
    fallback: 'Waiting for producer approval in the field app.',
    cooperativeFallback: 'Waiting for member approval in the field app.',
  },
  scope_profile: { key: 'workflow.producers.consent.scope.profile', fallback: 'profile' },
  scope_plots: { key: 'workflow.producers.consent.scope.plots', fallback: 'plots' },
  scope_evidence: { key: 'workflow.producers.consent.scope.evidence', fallback: 'evidence' },
};

type ProducerConsentStatus = 'active' | 'pending' | 'revoked' | 'denied';

const PRODUCER_CONSENT_STATUS_COPY: Record<ProducerConsentStatus, { key: string; fallback: string }> = {
  active: { key: 'workflow.producers.consent.status.active', fallback: 'active' },
  pending: { key: 'workflow.producers.consent.status.pending', fallback: 'pending' },
  revoked: { key: 'workflow.producers.consent.status.revoked', fallback: 'revoked' },
  denied: { key: 'workflow.producers.consent.status.denied', fallback: 'denied' },
};

export function getProducerConsentCopy(
  key: keyof typeof PRODUCER_CONSENT_COPY,
  role?: SupplyChainRole,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = PRODUCER_CONSENT_COPY[key];
  const fallback =
    role === 'cooperative' && entry.cooperativeFallback ? entry.cooperativeFallback : entry.fallback;
  return wf(entry.key, fallback, t, values);
}

export function getProducerConsentStatusLabel(status: ProducerConsentStatus, t?: TranslateFn): string {
  const entry = PRODUCER_CONSENT_STATUS_COPY[status];
  return wf(entry.key, entry.fallback, t);
}

export function getProducerConsentScopeLabel(scopeItem: string, t?: TranslateFn): string {
  const keyMap: Record<string, keyof typeof PRODUCER_CONSENT_COPY> = {
    identity: 'scope_profile',
    plots: 'scope_plots',
    evidence: 'scope_evidence',
  };
  const copyKey = keyMap[scopeItem];
  if (!copyKey) return scopeItem;
  return getProducerConsentCopy(copyKey, undefined, t);
}

const APP_CHROME_COPY: Record<string, { key: string; fallback: string }> = {
  eudr_platform: { key: 'workflow.shell.sidebar.eudr_platform', fallback: 'EUDR Platform' },
  active_role: { key: 'workflow.shell.sidebar.active_role', fallback: 'Active role' },
  switch_role: { key: 'workflow.shell.sidebar.switch_role', fallback: 'Switch role' },
  switch_role_aria: { key: 'workflow.shell.sidebar.switch_role_aria', fallback: 'Switch user role' },
  sponsor_view: { key: 'workflow.shell.sidebar.sponsor_view', fallback: 'Sponsor view' },
  sponsor_country: { key: 'workflow.shell.sidebar.sponsor_country', fallback: 'Country' },
  sponsor_brand: { key: 'workflow.shell.sidebar.sponsor_brand', fallback: 'Brand' },
  org_workspace: { key: 'workflow.shell.sidebar.org_workspace', fallback: 'Organisation workspace' },
  tracebud_tenant: { key: 'workflow.shell.sidebar.tracebud_tenant', fallback: 'Tracebud tenant' },
  workspace_fallback: { key: 'workflow.shell.sidebar.workspace_fallback', fallback: 'Workspace' },
  guest: { key: 'workflow.shell.sidebar.guest', fallback: 'Guest' },
  not_logged_in: { key: 'workflow.shell.sidebar.not_logged_in', fallback: 'Not logged in' },
  account_settings: { key: 'workflow.shell.sidebar.account_settings', fallback: 'Account settings' },
  log_out: { key: 'workflow.shell.sidebar.log_out', fallback: 'Log out' },
  user_menu_aria: { key: 'workflow.shell.sidebar.user_menu_aria', fallback: 'User menu for {{name}}' },
  notifications: { key: 'workflow.shell.header.notifications', fallback: 'Notifications' },
  notifications_empty: { key: 'workflow.shell.header.notifications_empty', fallback: 'No notifications yet.' },
  notifications_aria: { key: 'workflow.shell.header.notifications_aria', fallback: 'Notifications' },
  breadcrumb_aria: { key: 'workflow.shell.header.breadcrumb_aria', fallback: 'Breadcrumb' },
  main_nav_aria: { key: 'workflow.shell.sidebar.main_nav_aria', fallback: 'Main navigation' },
  open_menu_aria: { key: 'workflow.shell.mobile.open_menu_aria', fallback: 'Open menu' },
  close_menu_aria: { key: 'workflow.shell.mobile.close_menu_aria', fallback: 'Close menu' },
  mobile_brand: { key: 'workflow.shell.mobile.brand', fallback: 'Tracebud' },
};

export function getAppChromeCopy(
  key: keyof typeof APP_CHROME_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = APP_CHROME_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

const AUTH_COPY: Record<string, { key: string; fallback: string }> = {
  login_title: { key: 'workflow.auth.login.title', fallback: 'Sign in to your account' },
  login_subtitle: {
    key: 'workflow.auth.login.subtitle',
    fallback: 'Enter your credentials to access your Tracebud workspace',
  },
  email_confirmed: {
    key: 'workflow.auth.login.email_confirmed',
    fallback: 'Your email is confirmed. Sign in with your password to continue.',
  },
  intent_recorded: {
    key: 'workflow.auth.login.intent_recorded',
    fallback:
      'Your email action to {{intent}} was recorded. Sign in to continue your compliance workflow.',
  },
  intent_pending: {
    key: 'workflow.auth.login.intent_pending',
    fallback:
      'You clicked an email action to {{intent}}. Sign in to confirm and continue your compliance workflow.',
  },
  intent_accept: { key: 'workflow.auth.login.intent.accept', fallback: 'accept this request' },
  intent_refuse: { key: 'workflow.auth.login.intent.refuse', fallback: 'refuse this request' },
  field_email: { key: 'workflow.auth.field.email', fallback: 'Email' },
  field_password: { key: 'workflow.auth.field.password', fallback: 'Password' },
  field_work_email: { key: 'workflow.auth.field.work_email', fallback: 'Work email' },
  field_full_name: { key: 'workflow.auth.field.full_name', fallback: 'Full name' },
  placeholder_email: { key: 'workflow.auth.placeholder.email', fallback: 'you@company.com' },
  placeholder_password: { key: 'workflow.auth.placeholder.password', fallback: 'Enter your password' },
  placeholder_full_name: { key: 'workflow.auth.placeholder.full_name', fallback: 'Maria Santos' },
  placeholder_password_new: { key: 'workflow.auth.placeholder.password_new', fallback: 'At least 8 characters' },
  forgot_password: { key: 'workflow.auth.login.forgot_password', fallback: 'Forgot password?' },
  forgot_password_sending: { key: 'workflow.auth.login.forgot_password_sending', fallback: 'Sending reset link…' },
  signing_in: { key: 'workflow.auth.login.signing_in', fallback: 'Signing in...' },
  sign_in: { key: 'workflow.auth.login.sign_in', fallback: 'Sign in' },
  new_to_tracebud: { key: 'workflow.auth.login.new_to_tracebud', fallback: 'New to Tracebud?' },
  create_workspace: { key: 'workflow.auth.login.create_workspace', fallback: 'Create workspace' },
  already_have_account: { key: 'workflow.auth.signup.already_have_account', fallback: 'Already have an account?' },
  error_invalid_credentials: {
    key: 'workflow.auth.login.error.invalid_credentials',
    fallback: 'Incorrect email or password. Check your credentials or reset your password below.',
  },
  error_email_not_confirmed: {
    key: 'workflow.auth.login.error.email_not_confirmed',
    fallback: 'Confirm your email using the link we sent you, then sign in again.',
  },
  error_forgot_password_email: {
    key: 'workflow.auth.login.error.forgot_password_email',
    fallback: 'Enter your email address above, then choose forgot password.',
  },
  error_reset_unavailable: {
    key: 'workflow.auth.login.error.reset_unavailable',
    fallback: 'Password reset is unavailable in this environment. Contact support@tracebud.com.',
  },
  reset_notice: {
    key: 'workflow.auth.login.reset_notice',
    fallback: 'If an account exists for {{email}}, a password reset link is on its way.',
  },
  error_reset_send: {
    key: 'workflow.auth.login.error.reset_send',
    fallback: 'Could not send password reset email.',
  },
  error_generic: { key: 'workflow.auth.error.generic', fallback: 'Something went wrong. Please try again.' },
  eudr_platform_tagline: { key: 'workflow.auth.tagline.eudr_platform', fallback: 'EUDR Compliance Platform' },
  show_password: { key: 'workflow.auth.a11y.show_password', fallback: 'Show password' },
  hide_password: { key: 'workflow.auth.a11y.hide_password', fallback: 'Hide password' },
  welcome_back: { key: 'workflow.auth.legacy_login.welcome_back', fallback: 'Welcome back' },
  legacy_login_subtitle: {
    key: 'workflow.auth.legacy_login.subtitle',
    fallback: 'Sign in to your Tracebud Exporter account',
  },
  legacy_login_hint: {
    key: 'workflow.auth.legacy_login.hint',
    fallback: 'Use your Supabase account with an exporter email (e.g., exporter+name@email.com or @tracebud.com)',
  },
  confirm_loading_title: { key: 'workflow.auth.confirm.loading_title', fallback: 'Confirming your email' },
  confirm_success_title: { key: 'workflow.auth.confirm.success_title', fallback: 'Email confirmed' },
  confirm_problem_title: { key: 'workflow.auth.confirm.problem_title', fallback: 'Confirmation problem' },
  confirm_loading_wait: {
    key: 'workflow.auth.confirm.loading_wait',
    fallback: 'Please wait while we verify your link.',
  },
  confirm_success_session: {
    key: 'workflow.auth.confirm.success_session',
    fallback: 'Your email is confirmed. Continue setup or open your dashboard.',
  },
  confirm_sign_in_required_detail: {
    key: 'workflow.auth.confirm.sign_in_required_detail',
    fallback: 'Your email is confirmed. Sign in with the password you chose during signup.',
  },
  confirm_link_invalid: {
    key: 'workflow.auth.confirm.link_invalid',
    fallback:
      'This confirmation link is invalid or has expired. Sign in if you already confirmed, or create a new workspace.',
  },
  confirm_continue_setup: {
    key: 'workflow.auth.confirm.continue_setup',
    fallback: 'Continue workspace setup',
  },
  confirm_go_dashboard: { key: 'workflow.auth.confirm.go_dashboard', fallback: 'Go to dashboard' },
  confirm_sign_in_cta: { key: 'workflow.auth.confirm.sign_in_cta', fallback: 'Sign in' },
  confirm_create_workspace_cta: {
    key: 'workflow.auth.confirm.create_workspace_cta',
    fallback: 'Create workspace',
  },
  logo_alt: { key: 'workflow.auth.brand.logo_alt', fallback: 'Tracebud' },
};

const SIGNUP_COPY: Record<string, { key: string; fallback: string }> = {
  step1_title: { key: 'workflow.auth.signup.step1.title', fallback: 'Create your account' },
  step1_description: {
    key: 'workflow.auth.signup.step1.description',
    fallback: 'Start your Tracebud workspace in a few minutes.',
  },
  step2_title: { key: 'workflow.auth.signup.step2.title', fallback: 'Set up your workspace' },
  step2_description: {
    key: 'workflow.auth.signup.step2.description',
    fallback: 'Tell us about your organization so we can tailor your workflows.',
  },
  step2_resume_description: {
    key: 'workflow.auth.signup.step2.resume_description',
    fallback: 'Your email is confirmed. Choose your organization and role to finish setup.',
  },
  step3_title: { key: 'workflow.auth.signup.step3.title', fallback: 'Your commercial profile' },
  step3_description: {
    key: 'workflow.auth.signup.step3.description',
    fallback: 'Help us personalize onboarding. You can update this later.',
  },
  wizard_step_account: { key: 'workflow.auth.signup.wizard.account', fallback: 'Create account' },
  wizard_step_workspace: { key: 'workflow.auth.signup.wizard.workspace', fallback: 'Workspace' },
  wizard_step_profile: { key: 'workflow.auth.signup.wizard.profile', fallback: 'Profile' },
  trust_headline: {
    key: 'workflow.auth.signup.trust_headline',
    fallback: 'Join 200+ supply chain teams already managing EUDR compliance on Tracebud.',
  },
  trust_no_card: { key: 'workflow.auth.signup.trust.no_card', fallback: 'No credit card required' },
  trust_fast_setup: { key: 'workflow.auth.signup.trust.fast_setup', fallback: 'Set up in under 1 minute' },
  trust_eudr_day_one: { key: 'workflow.auth.signup.trust.eudr_day_one', fallback: 'EUDR-compliant from day one' },
  creating_account: { key: 'workflow.auth.signup.creating_account', fallback: 'Creating account…' },
  create_account: { key: 'workflow.auth.signup.create_account', fallback: 'Create account' },
  terms_prefix: { key: 'workflow.auth.signup.terms_prefix', fallback: "By continuing, you agree to Tracebud's" },
  terms_of_service: { key: 'workflow.auth.signup.terms_of_service', fallback: 'Terms of Service' },
  privacy_policy: { key: 'workflow.auth.signup.privacy_policy', fallback: 'Privacy Policy' },
  field_organization: { key: 'workflow.auth.signup.field.organization', fallback: 'Organization name' },
  placeholder_organization: {
    key: 'workflow.auth.signup.placeholder.organization',
    fallback: 'Acme Coffee Exports Ltd.',
  },
  field_country: { key: 'workflow.auth.signup.field.country', fallback: 'Country' },
  country_placeholder: { key: 'workflow.auth.signup.country_placeholder', fallback: 'Select your country' },
  field_primary_role: { key: 'workflow.auth.signup.field.primary_role', fallback: 'Primary role' },
  supply_chain_roles_title: {
    key: 'workflow.auth.signup.supply_chain_roles_title',
    fallback: 'Supply chain roles performed by this organisation',
  },
  supply_chain_roles_hint: {
    key: 'workflow.auth.signup.supply_chain_roles_hint',
    fallback: 'Select every workflow you run in one tenant. Use a preset or pick roles individually.',
  },
  back: { key: 'workflow.auth.signup.back', fallback: 'Back' },
  continue: { key: 'workflow.auth.signup.continue', fallback: 'Continue' },
  saving: { key: 'workflow.auth.signup.saving', fallback: 'Saving…' },
  field_primary_commodity: { key: 'workflow.auth.signup.field.primary_commodity', fallback: 'Primary commodity' },
  commodity_placeholder: { key: 'workflow.auth.signup.commodity_placeholder', fallback: 'Select a commodity' },
  field_primary_objective: { key: 'workflow.auth.signup.field.primary_objective', fallback: 'Primary objective' },
  objective_placeholder: {
    key: 'workflow.auth.signup.objective_placeholder',
    fallback: 'What brings you to Tracebud?',
  },
  skip_for_now: { key: 'workflow.auth.signup.skip_for_now', fallback: 'Skip for now' },
  finishing: { key: 'workflow.auth.signup.finishing', fallback: 'Finishing…' },
  go_to_dashboard: { key: 'workflow.auth.signup.go_to_dashboard', fallback: 'Go to dashboard' },
  members_count: { key: 'workflow.auth.signup.members_count', fallback: 'Number of members' },
  members_hint: {
    key: 'workflow.auth.signup.members_hint',
    fallback: 'Farmer or producer members in your cooperative.',
  },
  suppliers_count: { key: 'workflow.auth.signup.suppliers_count', fallback: 'Number of suppliers' },
  suppliers_hint_exporter: {
    key: 'workflow.auth.signup.suppliers_hint_exporter',
    fallback: 'Farms, cooperatives, or aggregators you source from.',
  },
  suppliers_hint_importer: {
    key: 'workflow.auth.signup.suppliers_hint_importer',
    fallback: 'Exporters or producers you source from.',
  },
  importers_count: { key: 'workflow.auth.signup.importers_count', fallback: 'Number of importers' },
  importers_hint: { key: 'workflow.auth.signup.importers_hint', fallback: 'EU buyers you ship to.' },
  number_placeholder: { key: 'workflow.auth.signup.number_placeholder', fallback: 'e.g. 50' },
  error_create_account: {
    key: 'workflow.auth.signup.error.create_account',
    fallback: 'Unable to create account.',
  },
  error_complete_workspace: {
    key: 'workflow.auth.signup.error.complete_workspace',
    fallback: 'Unable to complete workspace setup.',
  },
  legacy_wizard_title: {
    key: 'workflow.auth.signup.legacy_wizard.title',
    fallback: 'Create your Tracebud workspace',
  },
  legacy_wizard_progress: {
    key: 'workflow.auth.signup.legacy_wizard.progress',
    fallback: 'Step {{step}} of 3 - fast setup, then immediate first-value onboarding.',
  },
  legacy_value_banner: {
    key: 'workflow.auth.signup.legacy_wizard.value_banner',
    fallback: 'Start your EUDR-ready workspace in under 2 minutes. No credit card required. 30-day trial.',
  },
  creating_workspace: {
    key: 'workflow.auth.signup.legacy_wizard.creating_workspace',
    fallback: 'Creating workspace...',
  },
  submit_create_workspace: {
    key: 'workflow.auth.signup.legacy_wizard.submit_create_workspace',
    fallback: 'Create workspace',
  },
  saving_setup: {
    key: 'workflow.auth.signup.legacy_wizard.saving_setup',
    fallback: 'Saving setup...',
  },
  continue_to_dashboard: {
    key: 'workflow.auth.signup.legacy_wizard.continue_to_dashboard',
    fallback: 'Continue to dashboard',
  },
  placeholder_password_create: {
    key: 'workflow.auth.signup.legacy_wizard.placeholder.password_create',
    fallback: 'Create a secure password',
  },
  placeholder_full_name_short: {
    key: 'workflow.auth.signup.legacy_wizard.placeholder.full_name_short',
    fallback: 'Jane Doe',
  },
  placeholder_country_example: {
    key: 'workflow.auth.signup.legacy_wizard.placeholder.country_example',
    fallback: 'France',
  },
  field_members_optional: {
    key: 'workflow.auth.signup.legacy_wizard.field.members_optional',
    fallback: 'Number of members (optional)',
  },
  field_suppliers_optional: {
    key: 'workflow.auth.signup.legacy_wizard.field.suppliers_optional',
    fallback: 'Number of suppliers (optional)',
  },
  field_importers_optional: {
    key: 'workflow.auth.signup.legacy_wizard.field.importers_optional',
    fallback: 'Number of importers (optional)',
  },
  field_main_commodity_optional: {
    key: 'workflow.auth.signup.legacy_wizard.field.main_commodity_optional',
    fallback: 'Main commodity (optional)',
  },
  supply_chain_roles_hint_examples: {
    key: 'workflow.auth.signup.legacy_wizard.supply_chain_roles_hint_examples',
    fallback:
      'Select every workflow you run in one tenant — e.g. cooperative + exporter, or exporter + importer for a vertically integrated brand.',
  },
  objective_prepare_dds: {
    key: 'workflow.auth.signup.legacy_wizard.objective.prepare_dds',
    fallback: 'Prepare first due diligence package',
  },
  objective_risk_screening: {
    key: 'workflow.auth.signup.legacy_wizard.objective.risk_screening',
    fallback: 'Risk screening',
  },
  objective_audit_readiness: {
    key: 'workflow.auth.signup.legacy_wizard.objective.audit_readiness',
    fallback: 'Audit readiness',
  },
};

const SIGNUP_PRIMARY_ROLE_COPY: Record<
  string,
  { labelKey: string; labelFallback: string; descriptionKey: string; descriptionFallback: string }
> = {
  importer: {
    labelKey: 'workflow.auth.signup.role.importer.label',
    labelFallback: 'Importer',
    descriptionKey: 'workflow.auth.signup.role.importer.description',
    descriptionFallback: 'EU-based company bringing goods into the EU market',
  },
  exporter: {
    labelKey: 'workflow.auth.signup.role.exporter.label',
    labelFallback: 'Exporter',
    descriptionKey: 'workflow.auth.signup.role.exporter.description',
    descriptionFallback: 'Producer-country entity shipping goods to EU buyers',
  },
  cooperative: {
    labelKey: 'workflow.auth.signup.role.cooperative.label',
    labelFallback: 'Supplier / Cooperative',
    descriptionKey: 'workflow.auth.signup.role.cooperative.description',
    descriptionFallback: 'Producer cooperative or aggregator managing upstream supply data',
  },
  compliance_manager: {
    labelKey: 'workflow.auth.signup.role.compliance_manager.label',
    labelFallback: 'Compliance Manager',
    descriptionKey: 'workflow.auth.signup.role.compliance_manager.description',
    descriptionFallback: 'Internal or external compliance professional',
  },
  admin: {
    labelKey: 'workflow.auth.signup.role.admin.label',
    labelFallback: 'Admin',
    descriptionKey: 'workflow.auth.signup.role.admin.description',
    descriptionFallback: 'Platform or tenant administrator',
  },
};

const SIGNUP_COMMODITY_COPY: Record<string, { key: string; fallback: string }> = {
  coffee: { key: 'workflow.auth.signup.commodity.coffee', fallback: 'Coffee' },
  cocoa: { key: 'workflow.auth.signup.commodity.cocoa', fallback: 'Cocoa' },
  soy: { key: 'workflow.auth.signup.commodity.soy', fallback: 'Soy' },
  cattle: { key: 'workflow.auth.signup.commodity.cattle', fallback: 'Cattle' },
  oil_palm: { key: 'workflow.auth.signup.commodity.oil_palm', fallback: 'Oil Palm' },
  rubber: { key: 'workflow.auth.signup.commodity.rubber', fallback: 'Rubber' },
  wood: { key: 'workflow.auth.signup.commodity.wood', fallback: 'Wood' },
};

const SIGNUP_OBJECTIVE_COPY: Record<string, { key: string; fallback: string }> = {
  eudr_compliance: {
    key: 'workflow.auth.signup.objective.eudr_compliance',
    fallback: 'Achieve full EUDR compliance',
  },
  supply_chain_visibility: {
    key: 'workflow.auth.signup.objective.supply_chain_visibility',
    fallback: 'Gain end-to-end supply chain visibility',
  },
  dds_automation: {
    key: 'workflow.auth.signup.objective.dds_automation',
    fallback: 'Automate Due Diligence Statements (DDS)',
  },
  supplier_onboarding: {
    key: 'workflow.auth.signup.objective.supplier_onboarding',
    fallback: 'Onboard and manage suppliers',
  },
  buyer_reporting: {
    key: 'workflow.auth.signup.objective.buyer_reporting',
    fallback: 'Report compliance data to EU buyers',
  },
};

export function getAuthCopy(
  key: keyof typeof AUTH_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = AUTH_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getSignupCopy(
  key: keyof typeof SIGNUP_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = SIGNUP_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getSignupPrimaryRoleLabel(role: string, t?: TranslateFn): string {
  const entry = SIGNUP_PRIMARY_ROLE_COPY[role];
  if (!entry) return role;
  return wf(entry.labelKey, entry.labelFallback, t);
}

export function getSignupPrimaryRoleDescription(role: string, t?: TranslateFn): string {
  const entry = SIGNUP_PRIMARY_ROLE_COPY[role];
  if (!entry) return '';
  return wf(entry.descriptionKey, entry.descriptionFallback, t);
}

export function getSignupCommodityLabel(value: string, t?: TranslateFn): string {
  const entry = SIGNUP_COMMODITY_COPY[value];
  if (!entry) return value;
  return wf(entry.key, entry.fallback, t);
}

export function getSignupObjectiveLabel(value: string, t?: TranslateFn): string {
  const entry = SIGNUP_OBJECTIVE_COPY[value];
  if (!entry) return value;
  return wf(entry.key, entry.fallback, t);
}

const SIGNUP_WIZARD_OBJECTIVE_VALUES = [
  'prepare_first_due_diligence_package',
  'supplier_onboarding',
  'risk_screening',
  'audit_readiness',
] as const;

export function getSignupWizardObjectiveLabel(value: string, t?: TranslateFn): string {
  if (value === 'supplier_onboarding') {
    return getSignupObjectiveLabel('supplier_onboarding', t);
  }
  const map: Record<string, keyof typeof SIGNUP_COPY> = {
    prepare_first_due_diligence_package: 'objective_prepare_dds',
    risk_screening: 'objective_risk_screening',
    audit_readiness: 'objective_audit_readiness',
  };
  const copyKey = map[value];
  return copyKey ? getSignupCopy(copyKey, t) : value;
}

export function getSignupWizardObjectiveOptions(t?: TranslateFn): Array<{ value: string; label: string }> {
  return SIGNUP_WIZARD_OBJECTIVE_VALUES.map((value) => ({
    value,
    label: getSignupWizardObjectiveLabel(value, t),
  }));
}

const EUDR_COMMODITY_VALUES = ['coffee', 'cocoa', 'soy', 'cattle', 'oil_palm', 'rubber', 'wood'] as const;

export function getSignupCommodityOptions(t?: TranslateFn): Array<{ value: string; label: string }> {
  return EUDR_COMMODITY_VALUES.map((value) => ({
    value,
    label: getSignupCommodityLabel(value, t),
  }));
}

const SIGNUP_WIZARD_PRIMARY_ROLES = [
  'importer',
  'exporter',
  'cooperative',
  'compliance_manager',
  'admin',
] as const;

export function getSignupWizardPrimaryRoleOptions(t?: TranslateFn): Array<{ value: string; label: string }> {
  return SIGNUP_WIZARD_PRIMARY_ROLES.map((value) => ({
    value,
    label: getSignupPrimaryRoleLabel(value, t),
  }));
}

export function getSignupStepMeta(
  step: 1 | 2 | 3,
  t?: TranslateFn,
): { title: string; description: string } {
  const titleKey = `step${step}_title` as keyof typeof SIGNUP_COPY;
  const descriptionKey = `step${step}_description` as keyof typeof SIGNUP_COPY;
  return {
    title: getSignupCopy(titleKey, t),
    description: getSignupCopy(descriptionKey, t),
  };
}

const ONBOARDING_CHECKLIST_SHELL_COPY: Record<string, { key: string; fallback: string }> = {
  title_active: { key: 'workflow.onboarding.checklist.title_active', fallback: 'Getting started' },
  title_complete: { key: 'workflow.onboarding.checklist.title_complete', fallback: 'Setup complete' },
  badge_all_done: { key: 'workflow.onboarding.checklist.badge_all_done', fallback: 'All done' },
  subtitle_complete: {
    key: 'workflow.onboarding.checklist.subtitle_complete',
    fallback: 'Your workspace is fully configured.',
  },
  subtitle_active: {
    key: 'workflow.onboarding.checklist.subtitle_active',
    fallback: 'Complete these {{count}} starter tasks to activate your workflow.',
  },
  hide_aria: { key: 'workflow.onboarding.checklist.hide_aria', fallback: 'Hide getting started widget' },
  expand_aria: { key: 'workflow.onboarding.checklist.expand_aria', fallback: 'Expand checklist' },
  collapse_aria: { key: 'workflow.onboarding.checklist.collapse_aria', fallback: 'Collapse checklist' },
  progress_aria: { key: 'workflow.onboarding.checklist.progress_aria', fallback: '{{progress}}% complete' },
  progress_label: { key: 'workflow.onboarding.checklist.progress_label', fallback: '{{progress}}% complete' },
  steps_of: { key: 'workflow.onboarding.checklist.steps_of', fallback: '{{completed}} of {{total}} steps' },
  resume_tour: { key: 'workflow.onboarding.checklist.resume_tour', fallback: 'Resume guided tour' },
  need_help: { key: 'workflow.onboarding.checklist.need_help', fallback: 'Need help?' },
  help_docs: { key: 'workflow.onboarding.checklist.help.docs', fallback: 'Documentation' },
  help_support: { key: 'workflow.onboarding.checklist.help.support', fallback: 'Support' },
  help_video: { key: 'workflow.onboarding.checklist.help.video', fallback: 'Video walkthrough' },
  badge_next: { key: 'workflow.onboarding.checklist.badge_next', fallback: 'Next' },
  aria_completed: { key: 'workflow.onboarding.checklist.aria.completed', fallback: 'Completed' },
  aria_incomplete: { key: 'workflow.onboarding.checklist.aria.incomplete', fallback: 'Incomplete' },
  steps_list_aria: { key: 'workflow.onboarding.checklist.steps_list_aria', fallback: 'Onboarding steps' },
};

type OnboardingChecklistTaskId =
  | 'finish_overview'
  | 'map_organisations'
  | 'launch_programme_campaign'
  | 'launch_first_workflow'
  | 'add_producers';

const ONBOARDING_CHECKLIST_TASK_COPY: Record<
  OnboardingChecklistTaskId,
  { label: { key: string; fallback: string }; description: { key: string; fallback: string }; cta: { key: string; fallback: string } }
> = {
  finish_overview: {
    label: { key: 'workflow.onboarding.checklist.task.finish_overview.label', fallback: 'Finish sponsor overview' },
    description: {
      key: 'workflow.onboarding.checklist.task.finish_overview.description',
      fallback: 'Review governance KPIs, intervention alerts, and sponsor network posture.',
    },
    cta: { key: 'workflow.onboarding.checklist.task.finish_overview.cta', fallback: 'Open overview' },
  },
  map_organisations: {
    label: { key: 'workflow.onboarding.checklist.task.map_organisations.label', fallback: 'Map organisations' },
    description: {
      key: 'workflow.onboarding.checklist.task.map_organisations.description',
      fallback: 'Validate member organisations and sponsor-covered scope across the governed network.',
    },
    cta: { key: 'workflow.onboarding.checklist.task.map_organisations.cta', fallback: 'Open organisations' },
  },
  launch_programme_campaign: {
    label: {
      key: 'workflow.onboarding.checklist.task.launch_programme_campaign.label',
      fallback: 'Launch programme campaign',
    },
    description: {
      key: 'workflow.onboarding.checklist.task.launch_programme_campaign.description',
      fallback: 'Send your first bulk programme campaign to upstream organisations.',
    },
    cta: { key: 'workflow.onboarding.checklist.task.launch_programme_campaign.cta', fallback: 'Launch programme' },
  },
  launch_first_workflow: {
    label: {
      key: 'workflow.onboarding.checklist.task.launch_first_workflow.label.importer',
      fallback: 'Launch campaign',
    },
    description: {
      key: 'workflow.onboarding.checklist.task.launch_first_workflow.description.importer',
      fallback: 'Start your first campaign to collect missing upstream evidence.',
    },
    cta: { key: 'workflow.onboarding.checklist.task.launch_first_workflow.cta', fallback: 'Launch campaign' },
  },
  add_producers: {
    label: {
      key: 'workflow.onboarding.checklist.task.add_producers.label.importer',
      fallback: 'Build network',
    },
    description: {
      key: 'workflow.onboarding.checklist.task.add_producers.description.importer',
      fallback: 'Add counterpart contacts so campaign and request workflows route correctly.',
    },
    cta: { key: 'workflow.onboarding.checklist.task.add_producers.cta.importer', fallback: 'Add contact' },
  },
};

export function getOnboardingChecklistShellCopy(
  key: keyof typeof ONBOARDING_CHECKLIST_SHELL_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ONBOARDING_CHECKLIST_SHELL_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getOnboardingChecklistTaskCopy(
  taskId: OnboardingChecklistTaskId,
  field: 'label' | 'description' | 'cta',
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  const entry = ONBOARDING_CHECKLIST_TASK_COPY[taskId][field];
  let fallback = entry.fallback;
  let key = entry.key;

  if (taskId === 'launch_first_workflow' && field !== 'cta') {
    if (role === 'exporter') {
      key = `workflow.onboarding.checklist.task.launch_first_workflow.${field}.exporter`;
      fallback =
        field === 'label'
          ? 'Start campaign'
          : 'Launch your first campaign to collect missing plot, evidence, and upstream producer data.';
    } else if (role === 'cooperative') {
      key = `workflow.onboarding.checklist.task.launch_first_workflow.${field}.cooperative`;
      fallback =
        field === 'label'
          ? 'Start a campaign'
          : 'Launch your first campaign to collect missing plot geometry, evidence, and member data.';
    }
  }

  if (taskId === 'add_producers') {
    if (role === 'exporter') {
      key = `workflow.onboarding.checklist.task.add_producers.${field}.exporter`;
      fallback =
        field === 'label'
          ? 'Add producers'
          : field === 'description'
            ? 'Build your producer directory so traceability links and requests route correctly.'
            : 'Add producer';
    } else if (role === 'cooperative') {
      key = `workflow.onboarding.checklist.task.add_producers.${field}.cooperative`;
      fallback =
        field === 'label'
          ? 'Build member directory'
          : field === 'description'
            ? 'Create cooperative member records for consent, portability, and aggregation workflows.'
            : 'Add member';
    }
  }

  return wf(key, fallback, t);
}

const SETTINGS_COPY: Record<string, { key: string; fallback: string }> = {
  supply_chain_common_setups: {
    key: 'workflow.settings.supply_chain.common_setups',
    fallback: 'Common setups',
  },
  supply_chain_presets_hint: {
    key: 'workflow.settings.supply_chain.presets_hint',
    fallback: 'Presets fill the role checkboxes below — adjust any time before saving.',
  },
  supply_chain_roles: { key: 'workflow.settings.supply_chain.roles', fallback: 'Supply chain roles' },
  supply_chain_enabled: { key: 'workflow.settings.supply_chain.enabled', fallback: 'Enabled' },
  twofa_title: { key: 'workflow.settings.twofa.title', fallback: 'Enable two-factor authentication' },
  twofa_description: {
    key: 'workflow.settings.twofa.description',
    fallback:
      'Scan the QR code with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code to finish setup.',
  },
  twofa_loading: {
    key: 'workflow.settings.twofa.loading',
    fallback: 'Preparing your authenticator setup...',
  },
  twofa_qr_alt: { key: 'workflow.settings.twofa.qr_alt', fallback: 'Authenticator QR code' },
  twofa_manual_key: { key: 'workflow.settings.twofa.manual_key', fallback: 'Manual setup key:' },
  twofa_code_label: { key: 'workflow.settings.twofa.code_label', fallback: 'Authenticator code' },
  twofa_error_start: { key: 'workflow.settings.twofa.error.start', fallback: 'Failed to start 2FA setup.' },
  twofa_error_code: {
    key: 'workflow.settings.twofa.error.code',
    fallback: 'Enter the 6-digit code from your authenticator app.',
  },
  twofa_error_verify: { key: 'workflow.settings.twofa.error.verify', fallback: 'Verification failed. Try again.' },
  twofa_cancel: { key: 'workflow.settings.twofa.cancel', fallback: 'Cancel' },
  twofa_verifying: { key: 'workflow.settings.twofa.verifying', fallback: 'Verifying...' },
  twofa_verify_enable: { key: 'workflow.settings.twofa.verify_enable', fallback: 'Verify and enable' },
  billing_adoption_title: { key: 'workflow.settings.billing.adoption_title', fallback: 'Adoption offer' },
  billing_adoption_description: {
    key: 'workflow.settings.billing.adoption_description',
    fallback:
      'Your first sealed shipment or first DDS submit is free (€1 each). If you use either free shipment leg, the 3-month subscription-free offer ends that month — subscription billing starts the following month. Otherwise you keep 3 months subscription-free until you ship.',
  },
  billing_subscription_starts: {
    key: 'workflow.settings.billing.subscription_starts',
    fallback: 'Subscription billing starts',
  },
  billing_subscription_free_until: {
    key: 'workflow.settings.billing.subscription_free_until',
    fallback: 'Subscription free until',
  },
  billing_ended: { key: 'workflow.settings.billing.ended', fallback: 'Ended' },
  billing_first_origin_seal: { key: 'workflow.settings.billing.first_origin_seal', fallback: 'First origin seal' },
  billing_first_dds_submit: { key: 'workflow.settings.billing.first_dds_submit', fallback: 'First DDS submit' },
  billing_free_available: { key: 'workflow.settings.billing.free_available', fallback: 'Free — available' },
  billing_used: { key: 'workflow.settings.billing.used', fallback: 'Used' },
  billing_band_title: { key: 'workflow.settings.billing.band_title', fallback: 'Subscription band' },
  billing_band_description: {
    key: 'workflow.settings.billing.band_description',
    fallback:
      'Your monthly price depends on managed contacts (Starter 1–50, Growth 51–500, Scale 501–3,000, Enterprise 3,001+).',
  },
  billing_preview_title: { key: 'workflow.settings.billing.preview_title', fallback: 'Monthly billing preview' },
  billing_preview_description: {
    key: 'workflow.settings.billing.preview_description',
    fallback:
      'Subscription plus metered usage (€1 per origin seal, €1 per destination DDS submit) is invoiced at month end.',
  },
  billing_error_unavailable: {
    key: 'workflow.settings.billing.error.unavailable',
    fallback: 'Billing usage is not available yet. Run backend migrations if this is a new environment.',
  },
  billing_error_load: { key: 'workflow.settings.billing.error.load', fallback: 'Failed to load billing usage.' },
  billing_loading_preview: { key: 'workflow.settings.billing.loading_preview', fallback: 'Loading billing preview…' },
  billing_period: { key: 'workflow.settings.billing.period', fallback: 'Billing period' },
  billing_origin_seals: { key: 'workflow.settings.billing.origin_seals', fallback: 'Origin seals (€1 each)' },
  billing_destination_submits: {
    key: 'workflow.settings.billing.destination_submits',
    fallback: 'Destination DDS submits (€1 each)',
  },
  billing_subscription_period: {
    key: 'workflow.settings.billing.subscription_period',
    fallback: 'Subscription (this period)',
  },
  billing_projected_total: {
    key: 'workflow.settings.billing.projected_total',
    fallback: 'Projected month-end total',
  },
  billing_invoice_status: {
    key: 'workflow.settings.billing.invoice_status',
    fallback: 'Invoice status: {{status}}',
  },
  billing_recent_events: { key: 'workflow.settings.billing.recent_events', fallback: 'Recent metered events' },
  billing_no_events: {
    key: 'workflow.settings.billing.no_events',
    fallback: 'No metered events this period yet.',
  },
};

const SUPPLY_CHAIN_ROLE_LABEL_COPY: Record<string, { key: string; fallback: string }> = {
  cooperative: { key: 'workflow.settings.supply_chain.role.cooperative.label', fallback: 'Cooperative' },
  exporter: {
    key: 'workflow.settings.supply_chain.role.exporter.label',
    fallback: 'Exporter / aggregator',
  },
  importer: {
    key: 'workflow.settings.supply_chain.role.importer.label',
    fallback: 'Importer / EU operator',
  },
};

const SUPPLY_CHAIN_ROLE_DESC_COPY: Record<string, { key: string; fallback: string }> = {
  cooperative: {
    key: 'workflow.settings.supply_chain.role.cooperative.description',
    fallback: 'Member plots, field capture, consent, and cooperative governance.',
  },
  exporter: {
    key: 'workflow.settings.supply_chain.role.exporter.description',
    fallback: 'Batch assembly, lineage integrity, and handoff-ready shipments.',
  },
  importer: {
    key: 'workflow.settings.supply_chain.role.importer.description',
    fallback: 'Verify upstream evidence and submit DDS to TRACES.',
  },
};

const SUPPLY_CHAIN_PRESET_COPY: Record<string, { key: string; fallback: string }> = {
  cooperative_exporter: {
    key: 'workflow.settings.supply_chain.preset.cooperative_exporter',
    fallback: 'Cooperative + exporter',
  },
  brand: {
    key: 'workflow.settings.supply_chain.preset.brand',
    fallback: 'Vertically integrated brand',
  },
  cooperative_importer: {
    key: 'workflow.settings.supply_chain.preset.cooperative_importer',
    fallback: 'Cooperative + EU market',
  },
};

export function getSettingsCopy(
  key: keyof typeof SETTINGS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = SETTINGS_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getSupplyChainRoleOptionLabel(roleId: string, t?: TranslateFn): string {
  const entry = SUPPLY_CHAIN_ROLE_LABEL_COPY[roleId];
  if (!entry) return roleId;
  return wf(entry.key, entry.fallback, t);
}

export function getSupplyChainRoleOptionDescription(roleId: string, t?: TranslateFn): string {
  const entry = SUPPLY_CHAIN_ROLE_DESC_COPY[roleId];
  if (!entry) return '';
  return wf(entry.key, entry.fallback, t);
}

export function getSupplyChainRolePresetLabel(presetId: string, t?: TranslateFn): string {
  const entry = SUPPLY_CHAIN_PRESET_COPY[presetId];
  if (!entry) return presetId;
  return wf(entry.key, entry.fallback, t);
}

export function getSupplyChainRoleMixDescription(roles: string[], t?: TranslateFn): string {
  if (roles.includes('cooperative') && roles.includes('exporter')) {
    return wf(
      'workflow.settings.supply_chain.mix.cooperative_exporter',
      'Integrated cooperative-exporter: capture upstream and prepare export shipments in one tenant.',
      t,
    );
  }
  if (roles.includes('exporter') && roles.includes('importer')) {
    return wf(
      'workflow.settings.supply_chain.mix.brand',
      'Vertically integrated brand: operate origin aggregation and EU filing in one workspace (switch role in the sidebar).',
      t,
    );
  }
  if (roles.includes('cooperative') && roles.includes('importer')) {
    return wf(
      'workflow.settings.supply_chain.mix.cooperative_importer',
      'Cooperative with EU market access: manage members locally and verify/file EU shipments.',
      t,
    );
  }
  if (roles.length === 1) {
    return getSupplyChainRoleOptionDescription(roles[0], t);
  }
  return wf(
    'workflow.settings.supply_chain.mix.multi_role',
    'Multi-role organisation: use the sidebar role switcher to move between workflows.',
    t,
  );
}

const SPONSOR_PANEL_COPY: Record<string, { key: string; fallback: string }> = {
  hero_eyebrow: { key: 'workflow.sponsor.hero.eyebrow', fallback: 'Sponsor oversight' },
  hero_title: {
    key: 'workflow.sponsor.hero.title',
    fallback: 'Network transparency for sustainable markets',
  },
  hero_subtitle_country: {
    key: 'workflow.sponsor.hero.subtitle.country',
    fallback:
      'Coordinate government or development programmes across origins, classify supply chain actors, and track EUDR-ready transparency by country and commodity.',
  },
  hero_subtitle_brand: {
    key: 'workflow.sponsor.hero.subtitle.brand',
    fallback:
      'Give brands and buyers a governed view of supplier networks, sustainable sourcing readiness, and compliance signals across commodities.',
  },
  hero_countries: { key: 'workflow.sponsor.hero.countries', fallback: '{{count}} countries' },
  hero_commodities: { key: 'workflow.sponsor.hero.commodities', fallback: '{{count}} commodities' },
  hero_invite_contact: { key: 'workflow.sponsor.hero.invite_contact', fallback: 'Invite contact' },
  hero_classify_orgs: { key: 'workflow.sponsor.hero.classify_orgs', fallback: 'Classify organisations' },
  coverage_countries_title: { key: 'workflow.sponsor.coverage.countries.title', fallback: 'Countries in scope' },
  coverage_countries_description: {
    key: 'workflow.sponsor.coverage.countries.description',
    fallback: 'Governed organisations and invited contacts by origin market',
  },
  coverage_manage: { key: 'workflow.sponsor.coverage.manage', fallback: 'Manage' },
  coverage_countries_empty: {
    key: 'workflow.sponsor.coverage.countries.empty',
    fallback: 'Add organisations or invite contacts to start mapping your multi-country network.',
  },
  coverage_country_row: {
    key: 'workflow.sponsor.coverage.countries.row',
    fallback: '{{orgs}} orgs · {{contacts}} contacts',
  },
  coverage_nodes: { key: 'workflow.sponsor.coverage.nodes', fallback: '{{count}} nodes' },
  coverage_commodities_title: {
    key: 'workflow.sponsor.coverage.commodities.title',
    fallback: 'Commodities tracked',
  },
  coverage_commodities_description: {
    key: 'workflow.sponsor.coverage.commodities.description',
    fallback: 'Programme coverage across sustainable market supply chains',
  },
  coverage_commodities_empty: {
    key: 'workflow.sponsor.coverage.commodities.empty',
    fallback: 'Launch a programme to classify commodity scope and collect transparency evidence.',
  },
  coverage_commodity_row: {
    key: 'workflow.sponsor.coverage.commodities.row',
    fallback: '{{active}} active · {{total}} total programmes',
  },
  coverage_status_active: { key: 'workflow.sponsor.coverage.status.active', fallback: 'Active' },
  coverage_status_planned: { key: 'workflow.sponsor.coverage.status.planned', fallback: 'Planned' },
  roles_title: { key: 'workflow.sponsor.roles.title', fallback: 'Supply chain roles' },
  roles_description: {
    key: 'workflow.sponsor.roles.description',
    fallback:
      'Classify cooperatives, exporters, importers, producers, and partners to reach end-to-end transparency.',
  },
  roles_invite: { key: 'workflow.sponsor.roles.invite', fallback: 'Invite & classify' },
  roles_empty: {
    key: 'workflow.sponsor.roles.empty',
    fallback:
      'No classified network members yet. Invite contacts and register organisations with their supply chain role.',
  },
  roles_row: {
    key: 'workflow.sponsor.roles.row',
    fallback: '{{orgs}} organisations · {{contacts}} contacts',
  },
  transparency_title: {
    key: 'workflow.sponsor.transparency.title',
    fallback: 'Transparency & sustainable market readiness',
  },
  transparency_description: {
    key: 'workflow.sponsor.transparency.description',
    fallback:
      'Cross-network signals for EUDR-aligned transparency, deforestation-risk visibility, and programme accountability.',
  },
  transparency_cta: { key: 'workflow.sponsor.transparency.cta', fallback: 'Open compliance health' },
  transparency_index: { key: 'workflow.sponsor.transparency.index', fallback: 'Transparency index' },
  transparency_index_hint: {
    key: 'workflow.sponsor.transparency.index_hint',
    fallback: 'Blends plot compliance and organisation readiness',
  },
  transparency_compliance: { key: 'workflow.sponsor.transparency.compliance', fallback: 'Compliance health' },
  transparency_compliance_hint: {
    key: 'workflow.sponsor.transparency.compliance_hint',
    fallback: 'Mapped plots meeting compliance signals',
  },
  transparency_at_risk: { key: 'workflow.sponsor.transparency.at_risk', fallback: 'At-risk organisations' },
  transparency_at_risk_hint: {
    key: 'workflow.sponsor.transparency.at_risk_hint',
    fallback: 'Below readiness threshold across your network',
  },
  transparency_contacts: { key: 'workflow.sponsor.transparency.contacts', fallback: 'Active contacts' },
  transparency_contacts_hint: {
    key: 'workflow.sponsor.transparency.contacts_hint',
    fallback: 'Invited or engaged supply chain contacts',
  },
  unnamed_organisation: { key: 'workflow.sponsor.fallback.unnamed_org', fallback: 'Unnamed Organisation' },
  unknown_country: { key: 'workflow.sponsor.fallback.unknown_country', fallback: 'Unknown' },
  risk_tier_label: { key: 'workflow.sponsor.network.risk_tier', fallback: 'Risk tier {{tier}}' },
  risk_tier_unknown: { key: 'workflow.sponsor.network.risk_unknown', fallback: 'Unknown' },
  risk_tier_high: { key: 'workflow.sponsor.network.risk_high', fallback: 'High' },
  risk_tier_moderate: { key: 'workflow.sponsor.network.risk_moderate', fallback: 'Moderate' },
  risk_tier_low: { key: 'workflow.sponsor.network.risk_low', fallback: 'Low' },
  status_pending_data: { key: 'workflow.sponsor.network.status.pending_data', fallback: 'Pending data' },
  status_at_risk: { key: 'workflow.sponsor.network.status.at_risk', fallback: 'At Risk' },
  status_active: { key: 'workflow.sponsor.network.status.active', fallback: 'Active' },
  programme_default_title: {
    key: 'workflow.sponsor.programme.default_title',
    fallback: 'Programme Campaign',
  },
  programme_scope_recipients: {
    key: 'workflow.sponsor.programme.scope_recipients',
    fallback: '{{count}} recipients',
  },
  programme_status_draft: { key: 'workflow.sponsor.programme.status.draft', fallback: 'Draft' },
  programme_status_completed: { key: 'workflow.sponsor.programme.status.completed', fallback: 'Completed' },
  programme_status_active: { key: 'workflow.sponsor.programme.status.active', fallback: 'Active' },
};

const ONBOARDING_WELCOME_COPY: Record<string, { key: string; fallback: string }> = {
  title: { key: 'workflow.onboarding.welcome.title', fallback: 'Welcome to Tracebud, {{name}}' },
  tagline_fallback: {
    key: 'workflow.onboarding.welcome.tagline_fallback',
    fallback: 'Your workspace is ready. Take a quick guided tour to get up to speed.',
  },
  your_role: { key: 'workflow.onboarding.welcome.your_role', fallback: 'Your role' },
  tour_preview: {
    key: 'workflow.onboarding.welcome.tour_preview',
    fallback: '{{count}}-step guided tour — takes about 3 minutes',
  },
  tour_preview_hint: {
    key: 'workflow.onboarding.welcome.tour_preview_hint',
    fallback:
      'Each step highlights the exact area to click. You can skip at any time and resume later from your dashboard.',
  },
  continue_later: { key: 'workflow.onboarding.welcome.continue_later', fallback: 'Continue later' },
  start_tour: { key: 'workflow.onboarding.welcome.start_tour', fallback: 'Start guided tour' },
};

const WELCOME_CARD_COPY: Record<string, { key: string; fallback: string }> = {
  dismiss_aria: {
    key: 'workflow.onboarding.welcome_card.dismiss_aria',
    fallback: 'Dismiss welcome message',
  },
  title: { key: 'workflow.onboarding.welcome.title', fallback: 'Welcome to Tracebud, {{name}}' },
  name_fallback: { key: 'workflow.onboarding.welcome_card.name_fallback', fallback: 'there' },
  description: {
    key: 'workflow.onboarding.welcome_card.description',
    fallback:
      'Your workspace is ready. You can start managing EUDR compliance right away or take a moment to explore the platform first.',
  },
  start_onboarding: {
    key: 'workflow.onboarding.welcome_card.start_onboarding',
    fallback: 'Start onboarding',
  },
  explore_workspace: {
    key: 'workflow.onboarding.welcome_card.explore_workspace',
    fallback: 'Explore workspace first',
  },
};

const WELCOME_CARD_HIGHLIGHT_KEYS = [
  'workflow.onboarding.welcome_card.highlight.packages',
  'workflow.onboarding.welcome_card.highlight.supply_data',
  'workflow.onboarding.welcome_card.highlight.readiness',
] as const;

const WELCOME_CARD_HIGHLIGHT_FALLBACKS: Record<string, string> = {
  'workflow.onboarding.welcome_card.highlight.packages': 'Prepare shipment-ready traceability packages',
  'workflow.onboarding.welcome_card.highlight.supply_data': 'Manage plots, producers, and upstream supply data',
  'workflow.onboarding.welcome_card.highlight.readiness': 'Track blockers and readiness across your supply chain',
};

const ONBOARDING_WELCOME_HIGHLIGHTS: Record<string, string[]> = {
  cooperative: [
    'workflow.onboarding.welcome.highlight.coop.register',
    'workflow.onboarding.welcome.highlight.coop.respond',
    'workflow.onboarding.welcome.highlight.coop.upload',
  ],
  exporter: [
    'workflow.onboarding.welcome.highlight.exporter.campaigns',
    'workflow.onboarding.welcome.highlight.exporter.batches',
    'workflow.onboarding.welcome.highlight.exporter.shipments',
  ],
  importer: [
    'workflow.onboarding.welcome.highlight.importer.validate',
    'workflow.onboarding.welcome.highlight.importer.campaigns',
    'workflow.onboarding.welcome.highlight.importer.reporting',
  ],
  sponsor: [
    'workflow.onboarding.welcome.highlight.sponsor.network',
    'workflow.onboarding.welcome.highlight.sponsor.programmes',
    'workflow.onboarding.welcome.highlight.sponsor.compliance',
  ],
};

const ONBOARDING_WELCOME_HIGHLIGHT_FALLBACKS: Record<string, string> = {
  'workflow.onboarding.welcome.highlight.coop.register': 'Register producers & plots',
  'workflow.onboarding.welcome.highlight.coop.respond': 'Respond to exporter requests',
  'workflow.onboarding.welcome.highlight.coop.upload': 'Upload harvest evidence',
  'workflow.onboarding.welcome.highlight.exporter.campaigns': 'Run producer and plot completion campaigns',
  'workflow.onboarding.welcome.highlight.exporter.batches': 'Build lineage-safe lots and batches',
  'workflow.onboarding.welcome.highlight.exporter.shipments': 'Prepare and seal shipment packages',
  'workflow.onboarding.welcome.highlight.importer.validate': 'Validate shipment and evidence readiness',
  'workflow.onboarding.welcome.highlight.importer.campaigns': 'Run campaigns and fulfill inbound requests',
  'workflow.onboarding.welcome.highlight.importer.reporting': 'Generate declaration and reporting snapshots',
  'workflow.onboarding.welcome.highlight.sponsor.network': 'Map organisations and classify network contacts',
  'workflow.onboarding.welcome.highlight.sponsor.programmes': 'Launch transparency programmes and bulk campaigns',
  'workflow.onboarding.welcome.highlight.sponsor.compliance': 'Monitor compliance health across markets',
};

const ONBOARDING_TOUR_COPY: Record<string, { key: string; fallback: string }> = {
  step_of: { key: 'workflow.onboarding.tour.step_of', fallback: 'Step {{current}} of {{total}}' },
  aria_step: {
    key: 'workflow.onboarding.tour.aria_step',
    fallback: 'Onboarding step {{current}} of {{total}}: {{title}}',
  },
  skip_aria: { key: 'workflow.onboarding.tour.skip_aria', fallback: 'Skip tour' },
  progress_done: { key: 'workflow.onboarding.tour.progress_done', fallback: '{{completed}} of {{total}} steps done' },
  action_completed: {
    key: 'workflow.onboarding.tour.action_completed',
    fallback: 'Action completed — continue to next step',
  },
  action_pending: {
    key: 'workflow.onboarding.tour.action_pending',
    fallback: 'Complete the action on this page, then click “Next” to proceed.',
  },
  back: { key: 'workflow.onboarding.tour.back', fallback: 'Back' },
  back_welcome_aria: { key: 'workflow.onboarding.tour.back_welcome_aria', fallback: 'Back to welcome' },
  prev_aria: { key: 'workflow.onboarding.tour.prev_aria', fallback: 'Previous step' },
  next: { key: 'workflow.onboarding.tour.next', fallback: 'Next' },
  finish: { key: 'workflow.onboarding.tour.finish', fallback: 'Finish tour' },
  skip_bottom: { key: 'workflow.onboarding.tour.skip_bottom', fallback: 'Skip tour — continue later' },
  contextual_add_member: { key: 'workflow.onboarding.tour.contextual.add_member', fallback: 'Add member' },
  contextual_field_queues: {
    key: 'workflow.onboarding.tour.contextual.field_queues',
    fallback: 'Open field queues',
  },
  contextual_add_contact: { key: 'workflow.onboarding.tour.contextual.add_contact', fallback: 'Add contact' },
  contextual_start_campaign: {
    key: 'workflow.onboarding.tour.contextual.start_campaign',
    fallback: 'Start campaign',
  },
};

const SETTINGS_PAGE_COPY: Record<string, { key: string; fallback: string }> = {
  tab_profile: { key: 'workflow.settings.page.tab.profile', fallback: 'Profile' },
  tab_organization: { key: 'workflow.settings.page.tab.organization', fallback: 'Organization' },
  tab_notifications: { key: 'workflow.settings.page.tab.notifications', fallback: 'Notifications' },
  tab_security: { key: 'workflow.settings.page.tab.security', fallback: 'Security' },
  change_photo: { key: 'workflow.settings.page.change_photo', fallback: 'Change Photo' },
  photo_not_wired: {
    key: 'workflow.settings.page.photo_not_wired',
    fallback: 'Profile photos are not wired yet',
  },
  field_full_name: { key: 'workflow.settings.page.field.full_name', fallback: 'Full Name' },
  field_email: { key: 'workflow.settings.page.field.email', fallback: 'Email' },
  field_phone: { key: 'workflow.settings.page.field.phone', fallback: 'Phone' },
  field_role: { key: 'workflow.settings.page.field.role', fallback: 'Role' },
  sign_in_to_save: {
    key: 'workflow.settings.page.sign_in_to_save',
    fallback: 'Sign out and sign back in to save profile changes.',
  },
  saving: { key: 'workflow.settings.page.saving', fallback: 'Saving...' },
  save_changes: { key: 'workflow.settings.page.save_changes', fallback: 'Save Changes' },
  error_load_profile: { key: 'workflow.settings.page.error.load_profile', fallback: 'Unable to load profile.' },
  error_save_preferences: {
    key: 'workflow.settings.page.error.save_preferences',
    fallback: 'Failed to save preferences.',
  },
  error_name_required: { key: 'workflow.settings.page.error.name_required', fallback: 'Full name is required.' },
  toast_profile_saved: { key: 'workflow.settings.page.toast.profile_saved', fallback: 'Profile saved' },
  error_save_profile: { key: 'workflow.settings.page.error.save_profile', fallback: 'Failed to save profile.' },
  error_security_session: {
    key: 'workflow.settings.page.error.security_session',
    fallback: 'Sign out and sign in again to manage security settings.',
  },
  error_load_security: {
    key: 'workflow.settings.page.error.load_security',
    fallback: 'Unable to load security settings.',
  },
  error_password_mismatch: {
    key: 'workflow.settings.page.error.password_mismatch',
    fallback: 'New passwords do not match.',
  },
  error_password_length: {
    key: 'workflow.settings.page.error.password_length',
    fallback: 'Password must be at least 8 characters.',
  },
  toast_password_updated: { key: 'workflow.settings.page.toast.password_updated', fallback: 'Password updated' },
  error_password_update: {
    key: 'workflow.settings.page.error.password_update',
    fallback: 'Failed to update password.',
  },
  org_settings_title: {
    key: 'workflow.settings.page.org.title',
    fallback: 'Organization Settings',
  },
  org_settings_description: {
    key: 'workflow.settings.page.org.description',
    fallback: 'Manage your organization details',
  },
  org_name: { key: 'workflow.settings.page.org.name', fallback: 'Organization Name' },
  org_type: { key: 'workflow.settings.page.org.type', fallback: 'Organization Type' },
  org_country: { key: 'workflow.settings.page.org.country', fallback: 'Country' },
  org_registration: { key: 'workflow.settings.page.org.registration', fallback: 'Registration Number' },
  org_address: { key: 'workflow.settings.page.org.address', fallback: 'Address' },
  org_api_access: { key: 'workflow.settings.page.org.api_access', fallback: 'API Access' },
  org_regenerate: { key: 'workflow.settings.page.org.regenerate', fallback: 'Regenerate' },
  notifications_title: {
    key: 'workflow.settings.page.notifications.title',
    fallback: 'Notification delivery',
  },
  notifications_description: {
    key: 'workflow.settings.page.notifications.description',
    fallback: 'What Tracebud can send today versus what is still on the roadmap',
  },
  notifications_beta_alert: {
    key: 'workflow.settings.page.notifications.beta_alert',
    fallback:
      'Most toggles in the old settings screen were placeholders. Only the items marked Active today are wired in the current beta setup. Per-user notification preferences are not persisted yet.',
  },
  notifications_active_today: {
    key: 'workflow.settings.page.notifications.active_today',
    fallback: 'Active today',
  },
  notifications_planned: { key: 'workflow.settings.page.notifications.planned', fallback: 'Planned' },
  notifications_email_sent: {
    key: 'workflow.settings.page.notifications.email_sent',
    fallback: 'Email: sent',
  },
  notifications_email_planned: {
    key: 'workflow.settings.page.notifications.email_planned',
    fallback: 'Email: planned',
  },
  notifications_in_app_planned: {
    key: 'workflow.settings.page.notifications.in_app_planned',
    fallback: 'In-app: planned',
  },
  notifications_push_not_wired: {
    key: 'workflow.settings.page.notifications.push_not_wired',
    fallback: 'Push: not wired',
  },
  security_password_title: {
    key: 'workflow.settings.page.security.password_title',
    fallback: 'Change Password',
  },
  security_password_description: {
    key: 'workflow.settings.page.security.password_description',
    fallback: 'Updates your Supabase auth password for this account',
  },
  security_current_password: {
    key: 'workflow.settings.page.security.current_password',
    fallback: 'Current Password',
  },
  security_current_password_hint: {
    key: 'workflow.settings.page.security.current_password_hint',
    fallback: 'Not required for Supabase password reset in-session',
  },
  security_new_password: { key: 'workflow.settings.page.security.new_password', fallback: 'New Password' },
  security_confirm_password: {
    key: 'workflow.settings.page.security.confirm_password',
    fallback: 'Confirm New Password',
  },
  security_updating: { key: 'workflow.settings.page.security.updating', fallback: 'Updating...' },
  security_update_password: {
    key: 'workflow.settings.page.security.update_password',
    fallback: 'Update Password',
  },
  security_twofa_title: {
    key: 'workflow.settings.page.security.twofa_title',
    fallback: 'Two-Factor Authentication',
  },
  security_twofa_description: {
    key: 'workflow.settings.page.security.twofa_description',
    fallback: 'Protect your account with a TOTP authenticator app via Supabase Auth',
  },
  security_status: { key: 'workflow.settings.page.security.status', fallback: 'Status' },
  security_checking_2fa: {
    key: 'workflow.settings.page.security.checking_2fa',
    fallback: 'Checking authenticator status...',
  },
  security_2fa_enabled: {
    key: 'workflow.settings.page.security.2fa_enabled',
    fallback: '2FA is enabled for this account',
  },
  security_2fa_disabled: {
    key: 'workflow.settings.page.security.2fa_disabled',
    fallback: '2FA is currently disabled',
  },
  security_enable_2fa: { key: 'workflow.settings.page.security.enable_2fa', fallback: 'Enable 2FA' },
  security_enabled_badge: { key: 'workflow.settings.page.security.enabled_badge', fallback: 'Enabled' },
  security_sessions_title: {
    key: 'workflow.settings.page.security.sessions_title',
    fallback: 'Active Sessions',
  },
  security_sessions_description: {
    key: 'workflow.settings.page.security.sessions_description',
    fallback: 'Session revocation is not wired in beta yet',
  },
  security_sessions_body: {
    key: 'workflow.settings.page.security.sessions_body',
    fallback:
      'You are signed in on this browser. Multi-device session management will be added in a later release.',
  },
  toast_2fa_enabled: {
    key: 'workflow.settings.page.toast.2fa_enabled',
    fallback: 'Two-factor authentication enabled',
  },
  org_roles_title: { key: 'workflow.settings.org_roles.title', fallback: 'Supply chain roles' },
  org_roles_description: {
    key: 'workflow.settings.org_roles.description',
    fallback:
      'Enable every workflow your organisation performs. Users switch active role from the sidebar without creating separate tenants.',
  },
  org_roles_loading: {
    key: 'workflow.settings.org_roles.loading',
    fallback: 'Loading organisation profile…',
  },
  org_roles_active_session: {
    key: 'workflow.settings.org_roles.active_session',
    fallback: 'Active session role: {{role}}',
  },
  org_roles_save: { key: 'workflow.settings.org_roles.save', fallback: 'Save roles' },
  org_roles_default_landing: {
    key: 'workflow.settings.org_roles.default_landing',
    fallback: 'Default landing role after save: {{role}} (change anytime via sidebar).',
  },
  org_roles_toast_success: {
    key: 'workflow.settings.org_roles.toast_success',
    fallback: 'Supply chain roles updated. Use the sidebar switcher to change active workflow.',
  },
  org_roles_error_save: {
    key: 'workflow.settings.org_roles.error_save',
    fallback: 'Failed to save supply chain roles.',
  },
};

const NOTIFICATION_CAPABILITY_COPY: Record<
  string,
  { title: { key: string; fallback: string }; description: { key: string; fallback: string }; note?: { key: string; fallback: string } }
> = {
  onboarding: {
    title: { key: 'workflow.settings.notifications.onboarding.title', fallback: 'Account & onboarding emails' },
    description: {
      key: 'workflow.settings.notifications.onboarding.description',
      fallback: 'Welcome email after workspace setup and resume reminders for incomplete onboarding.',
    },
    note: {
      key: 'workflow.settings.notifications.onboarding.note',
      fallback: 'Always sent by Tracebud when applicable. Not configurable here yet.',
    },
  },
  campaign_outreach: {
    title: { key: 'workflow.settings.notifications.campaign.title', fallback: 'Campaign outreach emails' },
    description: {
      key: 'workflow.settings.notifications.campaign.description',
      fallback: 'Emails sent to contacts when you launch request or outreach campaigns.',
    },
    note: {
      key: 'workflow.settings.notifications.campaign.note',
      fallback: 'Controlled by campaign actions, not per-user notification preferences.',
    },
  },
  package_updates: {
    title: { key: 'workflow.settings.notifications.packages.title', fallback: 'Package updates' },
    description: {
      key: 'workflow.settings.notifications.packages.description',
      fallback: 'Alerts when shipment package status changes.',
    },
  },
  compliance_alerts: {
    title: { key: 'workflow.settings.notifications.compliance.title', fallback: 'Compliance alerts' },
    description: {
      key: 'workflow.settings.notifications.compliance.description',
      fallback:
        'Email and mobile push when land tenure documents need exporter review or package readiness regresses.',
    },
    note: {
      key: 'workflow.settings.notifications.compliance.note',
      fallback:
        'Tenure MANUAL_REQUIRED/FAILED alerts are sent to cooperative staff and farmers when push tokens are registered.',
    },
  },
  traces_submissions: {
    title: { key: 'workflow.settings.notifications.traces.title', fallback: 'TRACES submissions' },
    description: {
      key: 'workflow.settings.notifications.traces.description',
      fallback: 'Updates when TRACES filing status changes.',
    },
  },
  weekly_reports: {
    title: { key: 'workflow.settings.notifications.weekly.title', fallback: 'Weekly reports' },
    description: {
      key: 'workflow.settings.notifications.weekly.description',
      fallback: 'Scheduled summary of compliance and shipment readiness.',
    },
  },
  system_updates: {
    title: { key: 'workflow.settings.notifications.system.title', fallback: 'System updates' },
    description: {
      key: 'workflow.settings.notifications.system.description',
      fallback: 'Important platform announcements and maintenance notices.',
    },
  },
  push_notifications: {
    title: { key: 'workflow.settings.notifications.push.title', fallback: 'Browser push notifications' },
    description: {
      key: 'workflow.settings.notifications.push.description',
      fallback: 'Real-time alerts in your browser.',
    },
    note: {
      key: 'workflow.settings.notifications.push.note',
      fallback: 'Push delivery is not wired in the dashboard yet.',
    },
  },
};

export function getSponsorPanelCopy(
  key: keyof typeof SPONSOR_PANEL_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = SPONSOR_PANEL_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getSponsorRiskTierLabel(rate: number, hasCompleteness: boolean, t?: TranslateFn): string {
  if (!hasCompleteness) return getSponsorPanelCopy('risk_tier_unknown', t);
  if (rate < 75) return getSponsorPanelCopy('risk_tier_high', t);
  if (rate < 90) return getSponsorPanelCopy('risk_tier_moderate', t);
  return getSponsorPanelCopy('risk_tier_low', t);
}

export function getSponsorNetworkStatusLabel(
  complianceRate: number,
  hasCompleteness: boolean,
  t?: TranslateFn,
): string {
  if (!hasCompleteness) return getSponsorPanelCopy('status_pending_data', t);
  if (complianceRate < 80) return getSponsorPanelCopy('status_at_risk', t);
  return getSponsorPanelCopy('status_active', t);
}

export function getSponsorProgrammeStatusLabel(status: string, t?: TranslateFn): string {
  const normalized = status.toUpperCase();
  if (normalized === 'DRAFT') return getSponsorPanelCopy('programme_status_draft', t);
  if (normalized === 'COMPLETED') return getSponsorPanelCopy('programme_status_completed', t);
  return getSponsorPanelCopy('programme_status_active', t);
}

export function getOnboardingWelcomeCopy(
  key: keyof typeof ONBOARDING_WELCOME_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ONBOARDING_WELCOME_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getWelcomeCardCopy(
  key: keyof typeof WELCOME_CARD_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = WELCOME_CARD_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getWelcomeCardHighlights(t?: TranslateFn): string[] {
  return WELCOME_CARD_HIGHLIGHT_KEYS.map((key) => wf(key, WELCOME_CARD_HIGHLIGHT_FALLBACKS[key] ?? key, t));
}

export function getWelcomeCardCopyManifest(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const entry of Object.values(WELCOME_CARD_COPY)) {
    manifest[entry.key] = entry.fallback;
  }
  for (const [key, fallback] of Object.entries(WELCOME_CARD_HIGHLIGHT_FALLBACKS)) {
    manifest[key] = fallback;
  }
  for (const entry of Object.values(ONBOARDING_WELCOME_COPY)) {
    manifest[entry.key] = entry.fallback;
  }
  for (const [key, fallback] of Object.entries(ONBOARDING_WELCOME_HIGHLIGHT_FALLBACKS)) {
    manifest[key] = fallback;
  }
  for (const entry of Object.values(ONBOARDING_TOUR_COPY)) {
    manifest[entry.key] = entry.fallback;
  }
  return manifest;
}

export function getOnboardingWelcomeHighlights(persona: string, t?: TranslateFn): string[] {
  const keys = ONBOARDING_WELCOME_HIGHLIGHTS[persona] ?? [];
  return keys.map((key) => wf(key, ONBOARDING_WELCOME_HIGHLIGHT_FALLBACKS[key] ?? key, t));
}

export function getOnboardingTourCopy(
  key: keyof typeof ONBOARDING_TOUR_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ONBOARDING_TOUR_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getOnboardingTourContextualAction(stepKey: string, t?: TranslateFn): string | null {
  const map: Record<string, keyof typeof ONBOARDING_TOUR_COPY> = {
    coop_members: 'contextual_add_member',
    coop_field_operations: 'contextual_field_queues',
    imp_network: 'contextual_add_contact',
    imp_campaigns: 'contextual_start_campaign',
  };
  const copyKey = map[stepKey];
  if (!copyKey) return null;
  return getOnboardingTourCopy(copyKey, t);
}

export function getSettingsPageCopy(
  key: keyof typeof SETTINGS_PAGE_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = SETTINGS_PAGE_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getNotificationCapabilityCopy(
  id: string,
  field: 'title' | 'description' | 'note',
  t?: TranslateFn,
): string {
  const entry = NOTIFICATION_CAPABILITY_COPY[id];
  if (!entry) return id;
  const fieldEntry = entry[field];
  if (!fieldEntry) return '';
  return wf(fieldEntry.key, fieldEntry.fallback, t);
}

export {
  getOnboardingStepCopy,
  getOnboardingPersonaCopy,
  localizeOnboardingConfig,
  ONBOARDING_STEP_KEYS,
} from '@/lib/onboarding-step-copy';

export {
  getVirginStateHeadingCopy,
  getVirginStateStepCopy,
  getVirginStateShellCopy,
  getVirginStepsForRole,
  VIRGIN_STEP_IDS,
} from '@/lib/virgin-state-copy';

export { getDemoDataCopy } from '@/lib/demo-data-copy';

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

const ASYNC_STATE_SHELL_COPY: Record<string, { key: string; fallback: string }> = {
  loading: { key: 'workflow.async.shell.loading', fallback: 'Loading...' },
  error: { key: 'workflow.async.shell.error', fallback: 'Something went wrong' },
  empty: { key: 'workflow.async.shell.empty', fallback: 'No data yet' },
  retry: { key: 'workflow.async.shell.retry', fallback: 'Retry' },
};

export function getAsyncStateShellCopy(
  key: keyof typeof ASYNC_STATE_SHELL_COPY,
  t?: TranslateFn,
): string {
  const entry = ASYNC_STATE_SHELL_COPY[key];
  return wf(entry.key, entry.fallback, t);
}

export function getAsyncStateShellCopyManifest(): Record<string, string> {
  return Object.fromEntries(
    Object.values(ASYNC_STATE_SHELL_COPY).map((entry) => [entry.key, entry.fallback]),
  );
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

export function getPackageAssembleBlockedHint(role?: SupplyChainRole, t?: TranslateFn): string {
  return wf(
    'workflow.package.detail.assemble_blocked',
    en.getPackageAssembleBlockedHint(role),
    t,
  );
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

type IntegrationRunStatus = 'started' | 'completed' | 'failed';
type IntegrationRunType = 'validation' | 'scoring';
type IntegrationTimelineEvent =
  | 'draft_saved'
  | 'submitted'
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'claimed'
  | 'released'
  | 'retried'
  | 'stale_released';

export function getIntegrationsRunStatusLabel(status: IntegrationRunStatus, t?: TranslateFn): string {
  const keyMap = {
    started: 'workflow.integrations.status.started',
    completed: 'workflow.integrations.status.completed',
    failed: 'workflow.integrations.status.failed',
  } as const;
  const fallbackMap = { started: 'Started', completed: 'Completed', failed: 'Failed' } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getIntegrationsSummaryStatLabel(
  stat: 'started' | 'completed' | 'failed' | 'stale_claims' | 'last_sweeper',
  t?: TranslateFn,
): string {
  const keyMap = {
    started: 'workflow.integrations.summary.started',
    completed: 'workflow.integrations.summary.completed',
    failed: 'workflow.integrations.summary.failed',
    stale_claims: 'workflow.integrations.summary.stale_claims',
    last_sweeper: 'workflow.integrations.summary.last_sweeper',
  } as const;
  const fallbackMap = {
    started: 'Started',
    completed: 'Completed',
    failed: 'Failed',
    stale_claims: 'Stale Claims',
    last_sweeper: 'Last Sweeper',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getIntegrationsSummaryNeverLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.summary.never', 'Never', t);
}

export function getIntegrationsSummaryReleasedCountLabel(count: number, t?: TranslateFn): string {
  return wf('workflow.integrations.summary.released_count', '{{count}} released', t, { count });
}

export function getIntegrationsFilterSearchPlaceholder(t?: TranslateFn): string {
  return wf('workflow.integrations.filter.search_placeholder', 'Search by Run ID or Questionnaire...', t);
}

export function getIntegrationsFilterClearSearchLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.filter.clear_search', 'Clear search', t);
}

export function getIntegrationsFilterOptionLabel(
  group: 'status' | 'type' | 'claims' | 'all_statuses' | 'started' | 'completed' | 'failed' | 'all_types' | 'validation' | 'scoring' | 'all_claims' | 'claimed' | 'unclaimed' | 'due_now' | 'clear',
  t?: TranslateFn,
): string {
  const keyMap = {
    status: 'workflow.integrations.filter.status',
    type: 'workflow.integrations.filter.type',
    claims: 'workflow.integrations.filter.claims',
    all_statuses: 'workflow.integrations.filter.all_statuses',
    started: 'workflow.integrations.status.started',
    completed: 'workflow.integrations.status.completed',
    failed: 'workflow.integrations.status.failed',
    all_types: 'workflow.integrations.filter.all_types',
    validation: 'workflow.integrations.filter.validation',
    scoring: 'workflow.integrations.filter.scoring',
    all_claims: 'workflow.integrations.filter.all_claims',
    claimed: 'workflow.integrations.filter.claimed',
    unclaimed: 'workflow.integrations.filter.unclaimed',
    due_now: 'workflow.integrations.filter.due_now',
    clear: 'workflow.integrations.filter.clear',
  } as const;
  const fallbackMap = {
    status: 'Status',
    type: 'Type',
    claims: 'Claims',
    all_statuses: 'All Statuses',
    started: 'Started',
    completed: 'Completed',
    failed: 'Failed',
    all_types: 'All Types',
    validation: 'Validation',
    scoring: 'Scoring',
    all_claims: 'All Claims',
    claimed: 'Claimed',
    unclaimed: 'Unclaimed',
    due_now: 'Due Now',
    clear: 'Clear',
  } as const;
  return wf(keyMap[group], fallbackMap[group], t);
}

export function getIntegrationsFilterResultsLabel(filtered: number, total: number, t?: TranslateFn): string {
  return wf('workflow.integrations.filter.showing_runs', 'Showing {{filtered}} of {{total}} runs', t, {
    filtered,
    total,
  });
}

export function getIntegrationsFilterTotalRunsLabel(total: number, t?: TranslateFn): string {
  return wf('workflow.integrations.filter.total_runs', '{{total}} total runs', t, { total });
}

export function getIntegrationsFilterActiveCountLabel(count: number, t?: TranslateFn): string {
  const key =
    count === 1
      ? 'workflow.integrations.filter.active_filters'
      : 'workflow.integrations.filter.active_filters_plural';
  const fallback = count === 1 ? '{{count}} filter' : '{{count}} filters';
  return wf(key, fallback, t, { count });
}

export function getIntegrationsTableLoadingLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.table.loading', 'Loading runs...', t);
}

export function getIntegrationsTableEmptyTitle(t?: TranslateFn): string {
  return wf('workflow.integrations.table.empty_title', 'No runs found', t);
}

export function getIntegrationsTableEmptyDescription(t?: TranslateFn): string {
  return wf(
    'workflow.integrations.table.empty_description',
    'No integration runs match your current filters.',
    t,
  );
}

export function getIntegrationsTableColumnLabel(
  column:
    | 'run_id'
    | 'questionnaire'
    | 'type'
    | 'status'
    | 'attempts'
    | 'error_code'
    | 'next_retry'
    | 'claimed_by'
    | 'updated'
    | 'actions',
  t?: TranslateFn,
): string {
  const keyMap = {
    run_id: 'workflow.integrations.table.run_id',
    questionnaire: 'workflow.integrations.table.questionnaire',
    type: 'workflow.integrations.table.type',
    status: 'workflow.integrations.table.status',
    attempts: 'workflow.integrations.table.attempts',
    error_code: 'workflow.integrations.table.error_code',
    next_retry: 'workflow.integrations.table.next_retry',
    claimed_by: 'workflow.integrations.table.claimed_by',
    updated: 'workflow.integrations.table.updated',
    actions: 'workflow.integrations.table.actions',
  } as const;
  const fallbackMap = {
    run_id: 'Run ID',
    questionnaire: 'Questionnaire',
    type: 'Type',
    status: 'Status',
    attempts: 'Attempts',
    error_code: 'Error Code',
    next_retry: 'Next Retry',
    claimed_by: 'Claimed By',
    updated: 'Updated',
    actions: 'Actions',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getIntegrationsDueBadgeLabel(t?: TranslateFn): string {
  return wf('workflow.integrations.table.due', 'Due', t);
}

export function getIntegrationsActionLabel(
  action: 'view_details' | 'claim' | 'release' | 'force_release' | 'retry',
  t?: TranslateFn,
): string {
  const keyMap = {
    view_details: 'workflow.integrations.action.view_details',
    claim: 'workflow.integrations.action.claim',
    release: 'workflow.integrations.action.release',
    force_release: 'workflow.integrations.action.force_release',
    retry: 'workflow.integrations.action.retry',
  } as const;
  const fallbackMap = {
    view_details: 'View Details',
    claim: 'Claim',
    release: 'Release',
    force_release: 'Force Release',
    retry: 'Retry',
  } as const;
  return wf(keyMap[action], fallbackMap[action], t);
}

export function getIntegrationsConfirmActionCopy(
  action: 'claim' | 'release' | 'force_release' | 'retry',
  runIdPrefix: string,
  t?: TranslateFn,
): {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'destructive';
} {
  const prefix = action === 'force_release' ? 'force_release' : action;
  const titleKey = `workflow.integrations.confirm.${prefix}.title`;
  const descriptionKey = `workflow.integrations.confirm.${prefix}.description`;
  const confirmKey = `workflow.integrations.confirm.${prefix}.confirm`;
  const fallbacks = {
    claim: {
      title: 'Claim Run',
      description: `Are you sure you want to claim run ${runIdPrefix}? This will assign it to you for processing.`,
      confirm: 'Claim',
      variant: 'default' as const,
    },
    release: {
      title: 'Release Run',
      description: `Are you sure you want to release run ${runIdPrefix}?`,
      confirm: 'Release',
      variant: 'default' as const,
    },
    force_release: {
      title: 'Force Release Run',
      description: `Are you sure you want to force release run ${runIdPrefix}? This will remove the current claim regardless of who owns it.`,
      confirm: 'Force Release',
      variant: 'destructive' as const,
    },
    retry: {
      title: 'Retry Run',
      description: `Are you sure you want to retry run ${runIdPrefix}? This will increment the attempt count and requeue the run.`,
      confirm: 'Retry',
      variant: 'default' as const,
    },
  };
  const fallback = fallbacks[action];
  return {
    title: wf(titleKey, fallback.title, t),
    description: wf(descriptionKey, fallback.description, t, { runId: runIdPrefix }),
    confirmLabel: wf(confirmKey, fallback.confirm, t),
    variant: fallback.variant,
  };
}

export function getIntegrationsToastMessage(
  kind: 'claimed' | 'released' | 'force_released' | 'retry' | 'action_failed' | 'bulk_released' | 'bulk_release_failed',
  values?: { runId?: string; count?: number },
  t?: TranslateFn,
): string {
  if (kind === 'bulk_released' && values?.count !== undefined) {
    const key =
      values.count === 1
        ? 'workflow.integrations.toast.bulk_released'
        : 'workflow.integrations.toast.bulk_released_plural';
    const fallback =
      values.count === 1 ? 'Released {{count}} stale claim' : 'Released {{count}} stale claims';
    return wf(key, fallback, t, { count: values.count });
  }
  const keyMap = {
    claimed: 'workflow.integrations.toast.claimed',
    released: 'workflow.integrations.toast.released',
    force_released: 'workflow.integrations.toast.force_released',
    retry: 'workflow.integrations.toast.retry',
    action_failed: 'workflow.integrations.toast.action_failed',
    bulk_released: 'workflow.integrations.toast.bulk_released',
    bulk_release_failed: 'workflow.integrations.toast.bulk_release_failed',
  } as const;
  const fallbackMap = {
    claimed: 'Claimed run {{runId}}',
    released: 'Released run {{runId}}',
    force_released: 'Force released run {{runId}}',
    retry: 'Retry initiated for run {{runId}}',
    action_failed: 'Run action failed.',
    bulk_released: 'Released {{count}} stale claims',
    bulk_release_failed: 'Failed to release stale claims.',
  } as const;
  return wf(keyMap[kind], fallbackMap[kind], t, {
    runId: values?.runId ?? '',
    count: values?.count ?? 0,
  });
}

export function getIntegrationsBulkReleaseDescription(count: number, t?: TranslateFn): string {
  const key =
    count === 1
      ? 'workflow.integrations.bulk_release.description'
      : 'workflow.integrations.bulk_release.description_plural';
  const fallback =
    count === 1
      ? 'This will release runs that have been claimed for longer than the specified threshold. Currently {{count}} stale claim detected.'
      : 'This will release runs that have been claimed for longer than the specified threshold. Currently {{count}} stale claims detected.';
  return wf(key, fallback, t, { count });
}

export function getIntegrationsBulkReleaseLabel(
  field: 'title' | 'stale_threshold' | 'stale_threshold_hint' | 'max_release' | 'max_release_hint' | 'cancel' | 'confirm',
  t?: TranslateFn,
): string {
  const keyMap = {
    title: 'workflow.integrations.bulk_release.title',
    stale_threshold: 'workflow.integrations.bulk_release.stale_threshold',
    stale_threshold_hint: 'workflow.integrations.bulk_release.stale_threshold_hint',
    max_release: 'workflow.integrations.bulk_release.max_release',
    max_release_hint: 'workflow.integrations.bulk_release.max_release_hint',
    cancel: 'workflow.integrations.bulk_release.cancel',
    confirm: 'workflow.integrations.bulk_release.confirm',
  } as const;
  const fallbackMap = {
    title: 'Release Stale Claims',
    stale_threshold: 'Stale Threshold (minutes)',
    stale_threshold_hint: 'Claims older than this will be released',
    max_release: 'Maximum to Release',
    max_release_hint: 'Limit the number of claims released in one operation',
    cancel: 'Cancel',
    confirm: 'Release Stale Claims',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getIntegrationsDrawerLabel(
  field:
    | 'title'
    | 'attempt'
    | 'queued_at'
    | 'updated_at'
    | 'error_code'
    | 'claimed_by'
    | 'view_payload'
    | 'timeline'
    | 'timeline_load_error',
  t?: TranslateFn,
): string {
  const keyMap = {
    title: 'workflow.integrations.drawer.title',
    attempt: 'workflow.integrations.drawer.attempt',
    queued_at: 'workflow.integrations.drawer.queued_at',
    updated_at: 'workflow.integrations.drawer.updated_at',
    error_code: 'workflow.integrations.drawer.error_code',
    claimed_by: 'workflow.integrations.drawer.claimed_by',
    view_payload: 'workflow.integrations.drawer.view_payload',
    timeline: 'workflow.integrations.drawer.timeline',
    timeline_load_error: 'workflow.integrations.drawer.timeline_load_error',
  } as const;
  const fallbackMap = {
    title: 'Run Details',
    attempt: 'Attempt',
    queued_at: 'Queued At',
    updated_at: 'Updated At',
    error_code: 'Error Code',
    claimed_by: 'Claimed by',
    view_payload: 'View payload',
    timeline: 'Timeline',
    timeline_load_error: 'Failed to load run timeline.',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getIntegrationsTimelineEventLabel(type: IntegrationTimelineEvent, t?: TranslateFn): string {
  const keyMap = {
    draft_saved: 'workflow.integrations.timeline.draft_saved',
    submitted: 'workflow.integrations.timeline.submitted',
    run_started: 'workflow.integrations.timeline.run_started',
    run_completed: 'workflow.integrations.timeline.run_completed',
    run_failed: 'workflow.integrations.timeline.run_failed',
    claimed: 'workflow.integrations.timeline.claimed',
    released: 'workflow.integrations.timeline.released',
    retried: 'workflow.integrations.timeline.retried',
    stale_released: 'workflow.integrations.timeline.stale_released',
  } as const;
  const fallbackMap = {
    draft_saved: 'Draft Saved',
    submitted: 'Submitted',
    run_started: 'Run Started',
    run_completed: 'Run Completed',
    run_failed: 'Run Failed',
    claimed: 'Claimed',
    released: 'Released',
    retried: 'Retried',
    stale_released: 'Stale Released',
  } as const;
  return wf(keyMap[type], fallbackMap[type], t);
}

export function getIntegrationsSchedulerLabel(
  field:
    | 'title'
    | 'subtitle'
    | 'token_status'
    | 'token_configured'
    | 'token_not_configured'
    | 'token_env_hint'
    | 'stale_threshold'
    | 'stale_threshold_hint'
    | 'max_release'
    | 'max_release_hint'
    | 'manual_trigger'
    | 'manual_trigger_hint'
    | 'running'
    | 'trigger_now'
    | 'token_required_title'
    | 'token_required_body'
    | 'history_title'
    | 'history_subtitle'
    | 'no_triggers'
    | 'no_triggers_hint'
    | 'last_result'
    | 'claims_released'
    | 'token_version'
    | 'automated_title'
    | 'automated_body'
    | 'load_error'
    | 'token_missing'
    | 'no_stale',
  t?: TranslateFn,
): string {
  const key = `workflow.integrations.scheduler.${field}` as const;
  const fallbackMap: Record<typeof field, string> = {
    title: 'Scheduled Stale Sweeper',
    subtitle: 'Release runs that have been claimed for too long',
    token_status: 'Token Status',
    token_configured: 'Token Configured',
    token_not_configured: 'Token Not Configured',
    token_env_hint: 'Set COOLFARM_SAI_V2_SCHEDULER_TOKEN',
    stale_threshold: 'Stale Threshold (minutes)',
    stale_threshold_hint: 'Claims older than this threshold will be released',
    max_release: 'Maximum to Release',
    max_release_hint: 'Limit the number of claims released per trigger',
    manual_trigger: 'Manual Trigger',
    manual_trigger_hint: 'Run the stale sweeper now with current settings',
    running: 'Running...',
    trigger_now: 'Trigger Now',
    token_required_title: 'Token Required',
    token_required_body:
      'Set the COOLFARM_SAI_V2_SCHEDULER_TOKEN environment variable to enable the scheduled stale sweeper.',
    history_title: 'Trigger History',
    history_subtitle: 'Results from the most recent sweeper execution',
    no_triggers: 'No Recent Triggers',
    no_triggers_hint: 'The stale sweeper has not been triggered yet.',
    last_result: 'Last Trigger Result',
    claims_released: 'Claims Released',
    token_version: 'Token Version',
    automated_title: 'Automated Execution',
    automated_body:
      'When the scheduler token is configured, the stale sweeper runs automatically via cron. Manual triggers use the same endpoint but are recorded with a different trigger source for auditing.',
    load_error: 'Failed to load scheduler settings.',
    token_missing: 'Scheduler token is not configured',
    no_stale: 'No stale claims found to release',
  };
  return wf(key, fallbackMap[field], t);
}

export function getIntegrationsSchedulerTriggerBadgeLabel(
  source: 'scheduled' | 'manual',
  t?: TranslateFn,
): string {
  const key =
    source === 'scheduled'
      ? 'workflow.integrations.scheduler.trigger_scheduled'
      : 'workflow.integrations.scheduler.trigger_manual';
  return wf(key, source === 'scheduled' ? 'Scheduled' : 'Manual', t);
}

export function getHelpPageSubtitle(isCooperative: boolean, t?: TranslateFn): string {
  if (isCooperative) {
    return wf(
      'page.help.subtitle_cooperative',
      'Guidance for field operations, consent, portability, governance, and shipment readiness',
      t,
    );
  }
  return wf('page.help.subtitle', 'Workflow guidance, troubleshooting, and support resources', t);
}

export function getHelpCenterTitle(t?: TranslateFn): string {
  return wf('workflow.help.center_title', 'Help Center', t);
}

export function getHelpCenterIntro(t?: TranslateFn): string {
  return wf(
    'workflow.help.center_intro',
    'Search documentation, troubleshooting guides, and workflow walkthroughs.',
    t,
  );
}

export function getHelpCenterWorkflowHint(isCooperative: boolean, t?: TranslateFn): string {
  if (isCooperative) {
    return wf(
      'workflow.help.center_cooperative',
      'For cooperative workflows, start with Members, Field Operations, Lots & Batches, Governance, and Audit Log.',
      t,
    );
  }
  return wf(
    'workflow.help.center_default',
    'For importer workflows, start with Shipments, Compliance, Evidence, and Reporting guides.',
    t,
  );
}

export function getHelpGuidesSectionTitle(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.help.guides_cooperative' : 'workflow.help.guides_default',
    isCooperative ? 'Cooperative Guides' : 'Recommended Guides',
    t,
  );
}

export function getHelpGuideBadgeLabel(t?: TranslateFn): string {
  return wf('workflow.help.guide_badge', 'Guide', t);
}

export function getHelpGuideItemLabel(
  id:
    | 'coop.onboarding'
    | 'coop.portability'
    | 'coop.geometry'
    | 'coop.yield'
    | 'coop.premium'
    | 'coop.sync'
    | 'default.shipments'
    | 'default.evidence'
    | 'default.issues'
    | 'default.reporting',
  t?: TranslateFn,
): string {
  const keyMap = {
    'coop.onboarding': 'workflow.help.guide.coop.onboarding',
    'coop.portability': 'workflow.help.guide.coop.portability',
    'coop.geometry': 'workflow.help.guide.coop.geometry',
    'coop.yield': 'workflow.help.guide.coop.yield',
    'coop.premium': 'workflow.help.guide.coop.premium',
    'coop.sync': 'workflow.help.guide.coop.sync',
    'default.shipments': 'workflow.help.guide.default.shipments',
    'default.evidence': 'workflow.help.guide.default.evidence',
    'default.issues': 'workflow.help.guide.default.issues',
    'default.reporting': 'workflow.help.guide.default.reporting',
  } as const;
  const fallbackMap = {
    'coop.onboarding': 'Member onboarding and consent capture',
    'coop.portability': 'Portability request review and approval',
    'coop.geometry': 'Plot geometry remediation and duplicate handling',
    'coop.yield': 'Yield-cap blockers and batch appeal workflows',
    'coop.premium': 'Premium governance records and committee approvals',
    'coop.sync': 'Field sync conflicts and offline submission recovery',
    'default.shipments': 'Shipments and declaration readiness',
    'default.evidence': 'Evidence management and retention',
    'default.issues': 'Compliance issue remediation',
    'default.reporting': 'Reporting snapshots and exports',
  } as const;
  return wf(keyMap[id], fallbackMap[id], t);
}

export function getComplianceHealthPageSubtitle(isCountryView: boolean, t?: TranslateFn): string {
  if (isCountryView) {
    return wf(
      'page.compliance_health.subtitle_country',
      'Cross-network board for origin-level readiness, deterioration signals, and escalation pressure',
      t,
    );
  }
  return wf(
    'page.compliance_health.subtitle',
    'Cross-network board for supplier compliance posture and buyer-impacting risk indicators',
    t,
  );
}

export function getComplianceHealthPriorityTitle(t?: TranslateFn): string {
  return wf('workflow.compliance_health.priority_title', 'Priority Risk Patterns', t);
}

export function getComplianceHealthEmphasisLabel(isCountryView: boolean, t?: TranslateFn): string {
  const emphasis = wf(
    isCountryView
      ? 'workflow.compliance_health.emphasis_country'
      : 'workflow.compliance_health.emphasis_brand',
    isCountryView ? 'Country programme' : 'Brand sponsor',
    t,
  );
  return `${wf('workflow.compliance_health.emphasis_prefix', 'Emphasis:', t)} ${emphasis}`;
}

export function getComplianceHealthKpiLabel(
  kpi:
    | 'mapped_plot_ratio'
    | 'yield_warning_rate'
    | 'blocked_batch_rate'
    | 'dds_acceptance'
    | 'shipment_hold_rate'
    | 'mapped_supplier_coverage',
  t?: TranslateFn,
): string {
  const keyMap = {
    mapped_plot_ratio: 'workflow.compliance_health.kpi.mapped_plot_ratio',
    yield_warning_rate: 'workflow.compliance_health.kpi.yield_warning_rate',
    blocked_batch_rate: 'workflow.compliance_health.kpi.blocked_batch_rate',
    dds_acceptance: 'workflow.compliance_health.kpi.dds_acceptance',
    shipment_hold_rate: 'workflow.compliance_health.kpi.shipment_hold_rate',
    mapped_supplier_coverage: 'workflow.compliance_health.kpi.mapped_supplier_coverage',
  } as const;
  const fallbackMap = {
    mapped_plot_ratio: 'Mapped plot ratio',
    yield_warning_rate: 'Yield warning rate',
    blocked_batch_rate: 'Blocked batch rate',
    dds_acceptance: 'DDS acceptance proxy',
    shipment_hold_rate: 'Shipment hold rate',
    mapped_supplier_coverage: 'Mapped supplier coverage',
  } as const;
  return wf(keyMap[kpi], fallbackMap[kpi], t);
}

export function getComplianceHealthWarningLabel(
  warning: 'missing_geometry' | 'shipment_holds' | 'stale_risk' | 'manual_classifications',
  t?: TranslateFn,
): string {
  const keyMap = {
    missing_geometry: 'workflow.compliance_health.warning.missing_geometry',
    shipment_holds: 'workflow.compliance_health.warning.shipment_holds',
    stale_risk: 'workflow.compliance_health.warning.stale_risk',
    manual_classifications: 'workflow.compliance_health.warning.manual_classifications',
  } as const;
  const fallbackMap = {
    missing_geometry: 'Missing geometry evidence',
    shipment_holds: 'Shipment holds',
    stale_risk: 'Stale risk screening',
    manual_classifications: 'Unresolved manual classifications',
  } as const;
  return wf(keyMap[warning], fallbackMap[warning], t);
}

export function getAdminPanelCtaLabel(tab: 'organizations' | 'users', t?: TranslateFn): string {
  return wf(
    tab === 'organizations' ? 'workflow.admin.cta.add_org' : 'workflow.admin.cta.invite_user',
    tab === 'organizations' ? 'Add Organization' : 'Invite User',
    t,
  );
}

export function getAdminPageTitle(t?: TranslateFn): string {
  return wf('workflow.admin.page.title', 'Admin Panel', t);
}

export function getAdminPageSubtitle(t?: TranslateFn): string {
  return wf(
    'workflow.admin.page.subtitle',
    'Manage organizations, user invitations, and role assignments',
    t,
  );
}

export function getAdminTenantRoleLabel(role: TenantRole, t?: TranslateFn): string {
  const keyMap: Record<TenantRole, string> = {
    exporter: 'workflow.admin.role.exporter',
    importer: 'workflow.admin.role.importer',
    cooperative: 'workflow.admin.role.cooperative',
    country_reviewer: 'workflow.admin.role.country_reviewer',
    sponsor: 'workflow.admin.role.sponsor',
  };
  const fallbackMap: Record<TenantRole, string> = {
    exporter: 'Exporter',
    importer: 'Importer',
    cooperative: 'Cooperative',
    country_reviewer: 'Country Reviewer',
    sponsor: 'Sponsor',
  };
  return wf(keyMap[role], fallbackMap[role], t);
}

export function getAdminOrgTypeLabel(type: AdminOrgType, t?: TranslateFn): string {
  const keyMap: Record<AdminOrgType, string> = {
    COOPERATIVE: 'workflow.admin.org_type.cooperative',
    EXPORTER: 'workflow.admin.org_type.exporter',
    IMPORTER: 'workflow.admin.org_type.importer',
  };
  const fallbackMap: Record<AdminOrgType, string> = {
    COOPERATIVE: 'Cooperative',
    EXPORTER: 'Exporter',
    IMPORTER: 'Importer',
  };
  return wf(keyMap[type], fallbackMap[type], t);
}

export function getAdminOrganizationsTableColumnLabel(
  column: 'organization' | 'type' | 'users' | 'status' | 'created',
  t?: TranslateFn,
): string {
  const keyMap = {
    organization: 'workflow.admin.organizations.table.organization',
    type: 'workflow.admin.organizations.table.type',
    users: 'workflow.admin.organizations.table.users',
    status: 'workflow.admin.organizations.table.status',
    created: 'workflow.admin.organizations.table.created',
  } as const;
  const fallbackMap = {
    organization: 'Organization',
    type: 'Type',
    users: 'Users',
    status: 'Status',
    created: 'Created',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getAdminOrgStatusLabel(status: AdminStatus, t?: TranslateFn): string {
  const keyMap: Record<AdminStatus, string> = {
    ACTIVE: 'workflow.admin.organizations.status.active',
    PENDING: 'workflow.admin.organizations.status.pending',
    SUSPENDED: 'workflow.admin.organizations.status.suspended',
  };
  const fallbackMap: Record<AdminStatus, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    SUSPENDED: 'Suspended',
  };
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getOrganisationsPageSubtitle(isCountryView: boolean, t?: TranslateFn): string {
  if (isCountryView) {
    return wf(
      'page.organisations.subtitle_country',
      'Sponsor-scoped directory for network activation, readiness, and country coverage',
      t,
    );
  }
  return wf(
    'page.organisations.subtitle',
    'Sponsor-scoped directory for supplier performance, funded coverage, and value-chain visibility',
    t,
  );
}

export function getOrganisationsStatLabel(
  stat: 'governed' | 'completeness' | 'direct_members',
  t?: TranslateFn,
): string {
  const keyMap = {
    governed: 'workflow.organisations.stat.governed',
    completeness: 'workflow.organisations.stat.completeness',
    direct_members: 'workflow.organisations.stat.direct_members',
  } as const;
  const fallbackMap = {
    governed: 'Governed organisations',
    completeness: 'Average onboarding completeness',
    direct_members: 'Direct sponsor members',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getOrganisationsDirectoryTitle(t?: TranslateFn): string {
  return wf('workflow.organisations.directory_title', 'Organisation Directory', t);
}

export function getOrganisationsDirectoryDescription(isCountryView: boolean, t?: TranslateFn): string {
  return wf(
    isCountryView
      ? 'workflow.organisations.directory_desc_country'
      : 'workflow.organisations.directory_desc_brand',
    isCountryView
      ? 'Prioritises ecosystem activation and readiness by country and organisation type.'
      : 'Prioritises sponsored suppliers and value-chain entities with direct funding impact.',
    t,
  );
}

export function getOrganisationsTableColumnLabel(
  column: 'organisation' | 'type' | 'role' | 'relationship' | 'country' | 'onboarding' | 'coverage',
  t?: TranslateFn,
): string {
  const keyMap = {
    organisation: 'workflow.organisations.table.organisation',
    type: 'workflow.organisations.table.type',
    role: 'workflow.organisations.table.role',
    relationship: 'workflow.organisations.table.relationship',
    country: 'workflow.organisations.table.country',
    onboarding: 'workflow.organisations.table.onboarding',
    coverage: 'workflow.organisations.table.coverage',
  } as const;
  const fallbackMap = {
    organisation: 'Organisation',
    type: 'Type',
    role: 'Role',
    relationship: 'Relationship',
    country: 'Country',
    onboarding: 'Onboarding',
    coverage: 'Coverage',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getOrganisationsAddCta(t?: TranslateFn): string {
  return wf('workflow.organisations.cta.add', 'Add organisation', t);
}

export function getLegalRoleFilterLabel(role: LegalWorkflowRole, t?: TranslateFn): string {
  const keyMap: Record<LegalWorkflowRole, string> = {
    PENDING_MANUAL_CLASSIFICATION: 'workflow.role_decisions.role.pending',
    OPERATOR: 'workflow.role_decisions.role.operator',
    MICRO_SMALL_PRIMARY_OPERATOR: 'workflow.role_decisions.role.micro_small',
    DOWNSTREAM_OPERATOR_FIRST: 'workflow.role_decisions.role.downstream_first',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'workflow.role_decisions.role.downstream_subsequent',
    TRADER: 'workflow.role_decisions.role.trader',
    OUT_OF_SCOPE: 'workflow.role_decisions.role.out_of_scope',
  };
  const fallbackMap: Record<LegalWorkflowRole, string> = {
    PENDING_MANUAL_CLASSIFICATION: 'Pending Classification',
    OPERATOR: 'Operator',
    MICRO_SMALL_PRIMARY_OPERATOR: 'Micro/Small Primary Operator',
    DOWNSTREAM_OPERATOR_FIRST: 'Downstream Operator (First)',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'Downstream Operator (Subsequent)',
    TRADER: 'Trader',
    OUT_OF_SCOPE: 'Out of Scope',
  };
  return wf(keyMap[role], fallbackMap[role], t);
}

export function getLegalRoleDescriptionLabel(role: LegalWorkflowRole, t?: TranslateFn): string {
  const keyMap: Record<LegalWorkflowRole, string> = {
    OUT_OF_SCOPE: 'workflow.role_decisions.role_description.out_of_scope',
    OPERATOR: 'workflow.role_decisions.role_description.operator',
    MICRO_SMALL_PRIMARY_OPERATOR: 'workflow.role_decisions.role_description.micro_small',
    DOWNSTREAM_OPERATOR_FIRST: 'workflow.role_decisions.role_description.downstream_first',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'workflow.role_decisions.role_description.downstream_subsequent',
    TRADER: 'workflow.role_decisions.role_description.trader',
    PENDING_MANUAL_CLASSIFICATION: 'workflow.role_decisions.role_description.pending',
  };
  const fallbackMap: Record<LegalWorkflowRole, string> = {
    OUT_OF_SCOPE: 'Product not in EUDR Annex I scope',
    OPERATOR: 'First person placing product on EU market or exporting',
    MICRO_SMALL_PRIMARY_OPERATOR: 'Operator eligible for simplified primary-operator pathway',
    DOWNSTREAM_OPERATOR_FIRST: 'First downstream operator receiving covered goods',
    DOWNSTREAM_OPERATOR_SUBSEQUENT: 'Later downstream operator in covered chain',
    TRADER: 'Making products available without operator/downstream role',
    PENDING_MANUAL_CLASSIFICATION: 'Legal role cannot be resolved - manual review required',
  };
  return wf(keyMap[role], fallbackMap[role], t);
}

export function getAdminStatLabel(
  stat: 'organizations' | 'total_users' | 'active_users' | 'pending_approval',
  t?: TranslateFn,
): string {
  const keyMap = {
    organizations: 'workflow.admin.stat.organizations',
    total_users: 'workflow.admin.stat.total_users',
    active_users: 'workflow.admin.stat.active_users',
    pending_approval: 'workflow.admin.stat.pending_approval',
  } as const;
  const fallbackMap = {
    organizations: 'Organizations',
    total_users: 'Total Users',
    active_users: 'Active Users',
    pending_approval: 'Pending Approval',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getAdminActionLabel(
  action: 'seed' | 'reset' | 'create' | 'invite',
  t?: TranslateFn,
): string {
  const keyMap = {
    seed: 'workflow.admin.cta.seed',
    reset: 'workflow.admin.cta.reset',
    create: 'workflow.admin.organizations.create',
    invite: 'workflow.admin.users.invite',
  } as const;
  const fallbackMap = {
    seed: 'Seed First Customers',
    reset: 'Reset Demo Data',
    create: 'Create',
    invite: 'Invite',
  } as const;
  return wf(keyMap[action], fallbackMap[action], t);
}

export function getAdminTabLabel(
  tab: 'organizations' | 'users' | 'roles',
  t?: TranslateFn,
): string {
  const keyMap = {
    organizations: 'workflow.admin.tab.organizations',
    users: 'workflow.admin.tab.users',
    roles: 'workflow.admin.tab.roles',
  } as const;
  const fallbackMap = {
    organizations: 'Organizations',
    users: 'Users',
    roles: 'Roles & Permissions',
  } as const;
  return wf(keyMap[tab], fallbackMap[tab], t);
}

export function getAdminSectionCopy(
  section: 'organizations' | 'users' | 'roles',
  field: 'title' | 'subtitle' | 'create_placeholder' | 'country_placeholder',
  t?: TranslateFn,
): string {
  if (section === 'organizations') {
    const keyMap = {
      title: 'workflow.admin.organizations.title',
      subtitle: 'workflow.admin.organizations.subtitle',
      create_placeholder: 'workflow.admin.organizations.create_placeholder',
      country_placeholder: 'workflow.admin.organizations.country_placeholder',
    } as const;
    const fallbackMap = {
      title: 'Organizations',
      subtitle: 'Manage tenant organizations in the system',
      create_placeholder: 'Organization name',
      country_placeholder: 'Country code',
    } as const;
    return wf(keyMap[field], fallbackMap[field], t);
  }
  if (section === 'users') {
    return wf('workflow.admin.users.title', 'Users', t);
  }
  return wf('workflow.admin.roles.title', 'Roles & Permissions', t);
}

export function getAdminToastMessage(kind: 'seeded' | 'reset', t?: TranslateFn): string {
  const keyMap = {
    seeded: 'workflow.admin.toast.seeded',
    reset: 'workflow.admin.toast.reset',
  } as const;
  const fallbackMap = {
    seeded: 'Seeded first-customer demo workspace.',
    reset: 'Reset demo workspace to baseline.',
  } as const;
  return wf(keyMap[kind], fallbackMap[kind], t);
}

export function getOrganisationsAddLabel(
  field:
    | 'title'
    | 'subtitle'
    | 'tab_manual'
    | 'tab_bulk'
    | 'field_name'
    | 'field_type'
    | 'field_role'
    | 'field_relationship'
    | 'field_country'
    | 'placeholder_name'
    | 'placeholder_type'
    | 'placeholder_role'
    | 'placeholder_relationship'
    | 'placeholder_country'
    | 'saving'
    | 'submit'
    | 'csv_hint'
    | 'csv_placeholder'
    | 'upload_csv'
    | 'importing'
    | 'import'
    | 'loading',
  t?: TranslateFn,
): string {
  const keyMap = {
    title: 'workflow.organisations.add.title',
    subtitle: 'workflow.organisations.add.subtitle',
    tab_manual: 'workflow.organisations.add.tab.manual',
    tab_bulk: 'workflow.organisations.add.tab.bulk',
    field_name: 'workflow.organisations.add.field.name',
    field_type: 'workflow.organisations.add.field.type',
    field_role: 'workflow.organisations.add.field.role',
    field_relationship: 'workflow.organisations.add.field.relationship',
    field_country: 'workflow.organisations.add.field.country',
    placeholder_name: 'workflow.organisations.add.placeholder.name',
    placeholder_type: 'workflow.organisations.add.placeholder.type',
    placeholder_role: 'workflow.organisations.add.placeholder.role',
    placeholder_relationship: 'workflow.organisations.add.placeholder.relationship',
    placeholder_country: 'workflow.organisations.add.placeholder.country',
    saving: 'workflow.organisations.add.saving',
    submit: 'workflow.organisations.add.submit',
    csv_hint: 'workflow.organisations.add.csv_hint',
    csv_placeholder: 'workflow.organisations.add.csv_placeholder',
    upload_csv: 'workflow.organisations.add.upload_csv',
    importing: 'workflow.organisations.add.importing',
    import: 'workflow.organisations.add.import',
    loading: 'workflow.organisations.loading',
  } as const;
  const fallbackMap = {
    title: 'Add Organisations',
    subtitle: 'Add organisations manually or import them in bulk via CSV.',
    tab_manual: 'Manual',
    tab_bulk: 'Bulk import',
    field_name: 'Organisation name',
    field_type: 'Type',
    field_role: 'Role in network',
    field_relationship: 'Relationship',
    field_country: 'Country',
    placeholder_name: 'e.g. Highlands Cooperative Union',
    placeholder_type: 'Cooperative / Exporter / Importer / NGO',
    placeholder_role: 'Origin aggregator',
    placeholder_relationship: 'Direct Sponsor Member',
    placeholder_country: 'Peru',
    saving: 'Saving...',
    submit: 'Add organisation',
    csv_hint: 'Expected CSV columns: organisation_name, type, role_in_network, relationship, country',
    csv_placeholder: 'Paste organisation CSV rows here...',
    upload_csv: 'Upload CSV',
    importing: 'Importing...',
    import: 'Import organisations',
    loading: 'Loading organisations from backend...',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getContactsPageTitle(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.contacts.title_cooperative' : 'workflow.contacts.title',
    isCooperative ? 'Members' : 'Contacts',
    t,
  );
}

export function getContactsPageSubtitle(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.contacts.subtitle_cooperative' : 'workflow.contacts.subtitle',
    isCooperative
      ? 'Manage member identity, consent status, and portability readiness'
      : 'Tenant CRM',
    t,
  );
}

export function getContactsStatLabel(
  stat: 'total' | 'active' | 'blocked',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  const keyMap = {
    total: isCooperative ? 'workflow.contacts.stat.total_cooperative' : 'workflow.contacts.stat.total',
    active: isCooperative ? 'workflow.contacts.stat.active_cooperative' : 'workflow.contacts.stat.active',
    blocked: isCooperative ? 'workflow.contacts.stat.blocked_cooperative' : 'workflow.contacts.stat.blocked',
  } as const;
  const fallbackMap = {
    total: isCooperative ? 'Total Members' : 'Total Contacts',
    active: isCooperative ? 'Active Membership' : 'Active Pipeline',
    blocked: isCooperative ? 'Membership Blockers' : 'Blocked',
  } as const;
  return wf(keyMap[stat], fallbackMap[stat], t);
}

export function getContactsSearchPlaceholder(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.contacts.search_cooperative' : 'workflow.contacts.search',
    isCooperative
      ? 'Search member by name, email, cooperative, or status'
      : 'Search by name, email, org',
    t,
  );
}

export function getContactsFilterAllStatusesLabel(t?: TranslateFn): string {
  return wf('workflow.contacts.filter.all_statuses', 'All statuses', t);
}

export function getContactsCtaLabel(
  action: 'import_csv' | 'add',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  if (action === 'import_csv') {
    return wf('workflow.contacts.cta.import_csv', 'Import CSV', t);
  }
  return wf(
    isCooperative ? 'workflow.contacts.cta.add_cooperative' : 'workflow.contacts.cta.add',
    isCooperative ? 'Add Member' : 'Add Contact',
    t,
  );
}

export function getContactsListTitle(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.contacts.list_title_cooperative' : 'workflow.contacts.list_title',
    isCooperative ? 'Member directory' : 'Contact list',
    t,
  );
}

export function getContactsEmptyCopy(
  field: 'title' | 'description' | 'cta',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  const fieldKey = field === 'description' ? 'desc' : field;
  const suffix = isCooperative ? '_cooperative' : '';
  const key = `workflow.contacts.empty_${fieldKey}${suffix}`;
  const fallbacks = {
    title: isCooperative ? 'No members yet' : 'No contacts yet',
    description: isCooperative
      ? 'Add your first cooperative member to anchor consent, portability, and aggregation workflows.'
      : 'Add counterpart contacts so campaigns and request workflows route correctly.',
    cta: isCooperative ? 'Add first member' : 'Add first contact',
  };
  return wf(key, fallbacks[field], t);
}

export function getContactsNoMatchesLabel(isCooperative: boolean, t?: TranslateFn): string {
  return wf(
    isCooperative ? 'workflow.contacts.no_matches_cooperative' : 'workflow.contacts.no_matches',
    isCooperative
      ? 'No members match your search or filters yet.'
      : 'No contacts match your search or filters yet.',
    t,
  );
}

export function getContactsTableColumnLabel(
  column: 'name' | 'email' | 'organization' | 'status' | 'consent' | 'last_activity' | 'update_status',
  t?: TranslateFn,
): string {
  const keyMap = {
    name: 'workflow.contacts.table.name',
    email: 'workflow.contacts.table.email',
    organization: 'workflow.contacts.table.organization',
    status: 'workflow.contacts.table.status',
    consent: 'workflow.contacts.table.consent',
    last_activity: 'workflow.contacts.table.last_activity',
    update_status: 'workflow.contacts.table.update_status',
  } as const;
  const fallbackMap = {
    name: 'Name',
    email: 'Email',
    organization: 'Organization',
    status: 'Status',
    consent: 'Consent',
    last_activity: 'Last activity',
    update_status: 'Update status',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getContactsErrorMessage(kind: 'load' | 'update', t?: TranslateFn): string {
  const keyMap = {
    load: 'workflow.contacts.error.load',
    update: 'workflow.contacts.error.update',
  } as const;
  return wf(keyMap[kind], kind === 'load' ? 'Failed to load contacts.' : 'Failed to update status.', t);
}

export function getContactStatusLabel(
  status: 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked',
  t?: TranslateFn,
): string {
  const keyMap = {
    new: 'workflow.contacts.status.new',
    invited: 'workflow.contacts.status.invited',
    engaged: 'workflow.contacts.status.engaged',
    submitted: 'workflow.contacts.status.submitted',
    inactive: 'workflow.contacts.status.inactive',
    blocked: 'workflow.contacts.status.blocked',
  } as const;
  const fallbackMap = {
    new: 'New',
    invited: 'Invited',
    engaged: 'Engaged',
    submitted: 'Submitted',
    inactive: 'Inactive',
    blocked: 'Blocked',
  } as const;
  return wf(keyMap[status], fallbackMap[status], t);
}

export function getContactConsentLabel(
  status: 'unknown' | 'granted' | 'revoked',
  t?: TranslateFn,
): string {
  const keyMap = {
    unknown: 'workflow.contacts.consent.unknown',
    granted: 'workflow.contacts.consent.granted',
    revoked: 'workflow.contacts.consent.revoked',
  } as const;
  return wf(keyMap[status], status.charAt(0).toUpperCase() + status.slice(1), t);
}

export function getContactTypeLabel(
  type: 'farmer' | 'cooperative' | 'exporter' | 'other',
  t?: TranslateFn,
): string {
  const keyMap = {
    farmer: 'workflow.contacts.type.farmer',
    cooperative: 'workflow.contacts.type.cooperative',
    exporter: 'workflow.contacts.type.exporter',
    other: 'workflow.contacts.type.other',
  } as const;
  const fallbackMap = {
    farmer: 'Farmer',
    cooperative: 'Cooperative',
    exporter: 'Exporter',
    other: 'Other',
  } as const;
  return wf(keyMap[type], fallbackMap[type], t);
}

type ContactsAddMode = 'select' | 'contact' | 'organization' | 'csv';

export function getContactsAddPageTitle(
  mode: ContactsAddMode,
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  if (mode === 'select') {
    return wf(
      isCooperative ? 'workflow.contacts.add.title_select_cooperative' : 'workflow.contacts.add.title_select',
      isCooperative ? 'Add Member or Organization' : 'Add Contact or Organization',
      t,
    );
  }
  if (mode === 'csv') {
    return wf('workflow.contacts.add.title_bulk', 'Bulk Import', t);
  }
  if (mode === 'organization') {
    return wf('workflow.contacts.add.title_organization', 'Add New Organization', t);
  }
  return wf(
    isCooperative ? 'workflow.contacts.add.title_contact_cooperative' : 'workflow.contacts.add.title_contact',
    isCooperative ? 'Add New Member' : 'Add New Contact',
    t,
  );
}

export function getContactsAddBreadcrumbLabel(
  kind: 'add' | 'bulk' | 'add_contact' | 'add_organization',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  const keyMap = {
    add: 'workflow.contacts.add.breadcrumb.add',
    bulk: 'workflow.contacts.add.breadcrumb.bulk',
    add_contact: isCooperative
      ? 'workflow.contacts.add.breadcrumb.add_contact_cooperative'
      : 'workflow.contacts.add.breadcrumb.add_contact',
    add_organization: 'workflow.contacts.add.breadcrumb.add_organization',
  } as const;
  const fallbackMap = {
    add: 'Add',
    bulk: 'Bulk Import',
    add_contact: isCooperative ? 'Add Member' : 'Add Contact',
    add_organization: 'Add Organization',
  } as const;
  return wf(keyMap[kind], fallbackMap[kind], t);
}

export function getContactsAddSectionTitle(
  section: 'individual' | 'bulk' | 'tips',
  t?: TranslateFn,
): string {
  const keyMap = {
    individual: 'workflow.contacts.add.section.individual',
    bulk: 'workflow.contacts.add.section.bulk',
    tips: 'workflow.contacts.add.section.tips',
  } as const;
  const fallbackMap = {
    individual: 'Add Individually',
    bulk: 'Bulk Import',
    tips: 'Tips',
  } as const;
  return wf(keyMap[section], fallbackMap[section], t);
}

export function getContactsAddCardCopy(
  card: 'contact' | 'organization' | 'csv',
  field: 'title' | 'subtitle' | 'description',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  if (card === 'contact') {
    const titleKey = isCooperative ? 'workflow.contacts.add.card.contact.title_cooperative' : 'workflow.contacts.add.card.contact.title';
    const descKey = isCooperative ? 'workflow.contacts.add.card.contact.desc_cooperative' : 'workflow.contacts.add.card.contact.desc';
    const map = {
      title: wf(titleKey, isCooperative ? 'Add Member' : 'Add Contact', t),
      subtitle: wf('workflow.contacts.add.card.contact.subtitle', 'Add an individual person', t),
      description: wf(
        descKey,
        isCooperative
          ? 'Create a new member with personal details, cooperative affiliation, and location information.'
          : 'Create a new contact with personal details, organization affiliation, and location information.',
        t,
      ),
    };
    return map[field];
  }
  if (card === 'organization') {
    const map = {
      title: wf('workflow.contacts.add.card.organization.title', 'Add Organization', t),
      subtitle: wf('workflow.contacts.add.card.organization.subtitle', 'Add a company or cooperative', t),
      description: wf(
        'workflow.contacts.add.card.organization.desc',
        'Create a new organization with business details, certifications, and commodity information.',
        t,
      ),
    };
    return map[field];
  }
  return {
    title: wf('workflow.contacts.add.card.csv.title', 'Import from CSV', t),
    subtitle: wf('workflow.contacts.add.card.csv.subtitle', 'Upload a CSV file with multiple records', t),
    description: wf(
      'workflow.contacts.add.card.csv.desc',
      'Import multiple contacts or organizations at once using a CSV file. You can map columns and preview data before importing.',
      t,
    ),
  }[field];
}

export function getContactsAddTipLabel(tip: 1 | 2 | 3 | 4, isCooperative: boolean, t?: TranslateFn): string {
  const keyMap = {
    1: isCooperative ? 'workflow.contacts.add.tip.1_cooperative' : 'workflow.contacts.add.tip.1',
    2: 'workflow.contacts.add.tip.2',
    3: 'workflow.contacts.add.tip.3',
    4: 'workflow.contacts.add.tip.4',
  } as const;
  const fallbackMap = {
    1: isCooperative
      ? 'Use Add Member for individual farmers or cooperative representatives'
      : 'Use Add Contact for individual people like farmers, managers, or representatives',
    2: 'Use Add Organization for cooperatives, exporters, or other business entities',
    3: 'Use CSV Import when you have many records to add at once',
    4: 'You can download a template CSV to ensure your data is formatted correctly',
  } as const;
  return wf(keyMap[tip], fallbackMap[tip], t);
}

export function getContactsAddToastMessage(
  kind: 'contact_created' | 'member_added' | 'organization_created' | 'import_success',
  values?: { count?: number },
  t?: TranslateFn,
): string {
  if (kind === 'import_success' && values?.count !== undefined) {
    const key =
      values.count === 1
        ? 'workflow.contacts.add.toast.import_success'
        : 'workflow.contacts.add.toast.import_success_plural';
    return wf(key, 'Successfully imported {{count}} record(s)', t, { count: values.count });
  }
  const keyMap = {
    contact_created: 'workflow.contacts.add.toast.contact_created',
    member_added: 'workflow.contacts.add.toast.member_added',
    organization_created: 'workflow.contacts.add.toast.organization_created',
    import_success: 'workflow.contacts.add.toast.import_success',
  } as const;
  const fallbackMap = {
    contact_created: 'Contact created successfully',
    member_added: 'Member added to your directory',
    organization_created: 'Organization created successfully',
    import_success: 'Successfully imported {{count}} record',
  } as const;
  return wf(keyMap[kind], fallbackMap[kind], t, { count: values?.count ?? 1 });
}

export function getContactsWizardStepLabel(
  step: 'basic' | 'organization' | 'location' | 'review',
  t?: TranslateFn,
): string {
  const keyMap = {
    basic: 'workflow.contacts.wizard.step.basic',
    organization: 'workflow.contacts.wizard.step.organization',
    location: 'workflow.contacts.wizard.step.location',
    review: 'workflow.contacts.wizard.step.review',
  } as const;
  const fallbackMap = {
    basic: 'Basic Info',
    organization: 'Organization',
    location: 'Location',
    review: 'Review',
  } as const;
  return wf(keyMap[step], fallbackMap[step], t);
}

export function getContactsWizardSectionCopy(
  section: 'basic' | 'organization' | 'location' | 'review',
  field: 'title' | 'subtitle',
  isCooperative: boolean,
  t?: TranslateFn,
): string {
  const reviewTitleKey = isCooperative
    ? 'workflow.contacts.wizard.review.title_cooperative'
    : 'workflow.contacts.wizard.review.title';
  const map = {
    basic: {
      title: wf('workflow.contacts.wizard.basic.title', 'Basic Information', t),
      subtitle: wf('workflow.contacts.wizard.basic.subtitle', "Enter the contact's personal details", t),
    },
    organization: {
      title: wf('workflow.contacts.wizard.organization.title', 'Organization Details', t),
      subtitle: wf('workflow.contacts.wizard.organization.subtitle', 'Add organization and role information', t),
    },
    location: {
      title: wf('workflow.contacts.wizard.location.title', 'Location Information', t),
      subtitle: wf('workflow.contacts.wizard.location.subtitle', "Specify the contact's location", t),
    },
    review: {
      title: wf(reviewTitleKey, isCooperative ? 'Review Member' : 'Review Contact', t),
      subtitle: wf('workflow.contacts.wizard.review.subtitle', 'Verify the information before saving', t),
    },
  };
  return map[section][field];
}

export function getContactsWizardFieldLabel(
  field:
    | 'full_name'
    | 'email'
    | 'phone'
    | 'contact_type'
    | 'consent_status'
    | 'organization'
    | 'job_title'
    | 'tags'
    | 'country'
    | 'region'
    | 'address'
    | 'notes'
    | 'location',
  t?: TranslateFn,
): string {
  const keyMap = {
    full_name: 'workflow.contacts.wizard.field.full_name',
    email: 'workflow.contacts.wizard.field.email',
    phone: 'workflow.contacts.wizard.field.phone',
    contact_type: 'workflow.contacts.wizard.field.contact_type',
    consent_status: 'workflow.contacts.wizard.field.consent_status',
    organization: 'workflow.contacts.wizard.field.organization',
    job_title: 'workflow.contacts.wizard.field.job_title',
    tags: 'workflow.contacts.wizard.field.tags',
    country: 'workflow.contacts.wizard.field.country',
    region: 'workflow.contacts.wizard.field.region',
    address: 'workflow.contacts.wizard.field.address',
    notes: 'workflow.contacts.wizard.field.notes',
    location: 'workflow.contacts.wizard.field.location',
  } as const;
  const fallbackMap = {
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    contact_type: 'Contact Type',
    consent_status: 'Consent Status',
    organization: 'Organization Name',
    job_title: 'Job Title / Role',
    tags: 'Tags',
    country: 'Country',
    region: 'Region / State',
    address: 'Address',
    notes: 'Additional Notes',
    location: 'Location',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getContactsWizardLockedTypeLabel(label: string, t?: TranslateFn): string {
  return wf('workflow.contacts.wizard.field.contact_type_locked', '{{label}} type', t, { label });
}

export function getContactsWizardTagsHint(t?: TranslateFn): string {
  return wf('workflow.contacts.wizard.field.tags_hint', 'Separate multiple tags with commas', t);
}

export function getContactsWizardPlaceholder(
  field: 'select_type' | 'select_consent',
  t?: TranslateFn,
): string {
  const keyMap = {
    select_type: 'workflow.contacts.wizard.placeholder.select_type',
    select_consent: 'workflow.contacts.wizard.placeholder.select_consent',
  } as const;
  return wf(keyMap[field], field === 'select_type' ? 'Select type' : 'Select consent status', t);
}

export function getContactsWizardActionLabel(
  action: 'cancel' | 'back' | 'next' | 'saving' | 'save_contact' | 'save_member',
  t?: TranslateFn,
): string {
  const keyMap = {
    cancel: 'workflow.contacts.wizard.action.cancel',
    back: 'workflow.contacts.wizard.action.back',
    next: 'workflow.contacts.wizard.action.next',
    saving: 'workflow.contacts.wizard.action.saving',
    save_contact: 'workflow.contacts.wizard.action.save_contact',
    save_member: 'workflow.contacts.wizard.action.save_member',
  } as const;
  const fallbackMap = {
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    saving: 'Saving...',
    save_contact: 'Save Contact',
    save_member: 'Save Member',
  } as const;
  return wf(keyMap[action], fallbackMap[action], t);
}

export function getContactsWizardCreateError(t?: TranslateFn): string {
  return wf('workflow.contacts.wizard.error.create', 'Failed to create contact.', t);
}

export function getContactsAddBackToOptionsLabel(t?: TranslateFn): string {
  return wf('workflow.contacts.add.back_to_options', 'Back to options', t);
}

export function getContactsAddPageSubtitle(isCooperative: boolean, t?: TranslateFn): string {
  if (isCooperative) {
    return wf('workflow.contacts.add.subtitle_cooperative', 'Cooperative member directory', t);
  }
  return getContactsPageSubtitle(false, t);
}

export function getContactsAddImportCta(
  kind: 'contacts' | 'organizations',
  t?: TranslateFn,
): string {
  return wf(
    kind === 'contacts' ? 'workflow.contacts.add.cta.import_contacts' : 'workflow.contacts.add.cta.import_organizations',
    kind === 'contacts' ? 'Import Contacts' : 'Import Organizations',
    t,
  );
}

export function getAdminUsersSubtitle(t?: TranslateFn): string {
  return wf('workflow.admin.users.subtitle', 'Manage user accounts and access', t);
}

export function getAdminRolesSubtitle(t?: TranslateFn): string {
  return wf('workflow.admin.roles.subtitle', 'Configure role-based access control', t);
}

export function getAdminInvitePlaceholder(
  field: 'name' | 'email' | 'select_org',
  t?: TranslateFn,
): string {
  const keyMap = {
    name: 'workflow.admin.invite.name',
    email: 'workflow.admin.invite.email',
    select_org: 'workflow.admin.invite.select_org',
  } as const;
  const fallbackMap = {
    name: 'Full name',
    email: 'Email',
    select_org: 'Select organization',
  } as const;
  return wf(keyMap[field], fallbackMap[field], t);
}

export function getAdminUsersTableColumnLabel(
  column: 'user' | 'email' | 'role' | 'organization' | 'status' | 'last_login',
  t?: TranslateFn,
): string {
  const keyMap = {
    user: 'workflow.admin.users.table.user',
    email: 'workflow.admin.users.table.email',
    role: 'workflow.admin.users.table.role',
    organization: 'workflow.admin.users.table.organization',
    status: 'workflow.admin.users.table.status',
    last_login: 'workflow.admin.users.table.last_login',
  } as const;
  const fallbackMap = {
    user: 'User',
    email: 'Email',
    role: 'Role',
    organization: 'Organization',
    status: 'Status',
    last_login: 'Last Login',
  } as const;
  return wf(keyMap[column], fallbackMap[column], t);
}

export function getAdminUsersLoadingLabel(t?: TranslateFn): string {
  return wf('workflow.admin.users.loading', 'Loading users...', t);
}

export function getAdminRolesCanonicalBadge(t?: TranslateFn): string {
  return wf('workflow.admin.roles.canonical', 'Canonical', t);
}


export function getAdminOrganizationsLoadingLabel(t?: TranslateFn): string {
  return wf('workflow.admin.organizations.loading', 'Loading organizations...', t);
}

const ADMIN_DIAGNOSTICS_COPY: Record<string, { key: string; fallback: string }> = {
  title: { key: 'workflow.admin.diagnostics.title', fallback: 'Deferred Route Gate Diagnostics' },
  subtitle: {
    key: 'workflow.admin.diagnostics.subtitle',
    fallback: 'Recent tenant-scoped gated-entry attempts captured by telemetry (`feature=mvp_gated`).',
  },
  export_csv: { key: 'workflow.admin.diagnostics.export_csv', fallback: 'Export CSV' },
  export_all_csv: { key: 'workflow.admin.diagnostics.export_all_csv', fallback: 'Export All CSV' },
  exporting_all: { key: 'workflow.admin.diagnostics.exporting_all', fallback: 'Exporting all...' },
  refresh: { key: 'workflow.admin.diagnostics.refresh', fallback: 'Refresh' },
  debug_on: { key: 'workflow.admin.diagnostics.debug_on', fallback: 'Debug: On' },
  debug_off: { key: 'workflow.admin.diagnostics.debug_off', fallback: 'Debug: Off' },
  summary: { key: 'workflow.admin.diagnostics.summary', fallback: 'Diagnostics Summary' },
  loading_summary: {
    key: 'workflow.admin.diagnostics.loading_summary',
    fallback: 'Loading diagnostics summary...',
  },
  preset_latest_blocks: {
    key: 'workflow.admin.diagnostics.preset.latest_blocks',
    fallback: 'Latest blocks (24h)',
  },
  preset_weekly_volume: {
    key: 'workflow.admin.diagnostics.preset.weekly_volume',
    fallback: 'Weekly volume',
  },
  preset_campaign_focus: {
    key: 'workflow.admin.diagnostics.preset.campaign_focus',
    fallback: 'Campaigns oldest first',
  },
  preset_reporting_focus: {
    key: 'workflow.admin.diagnostics.preset.reporting_focus',
    fallback: 'Reporting oldest first',
  },
  counter_total_diagnostics: {
    key: 'workflow.admin.diagnostics.counter.total_diagnostics',
    fallback: 'Total diagnostics',
  },
  counter_gated_entry: { key: 'workflow.admin.diagnostics.counter.gated_entry', fallback: 'Gated entry' },
  counter_assignment_exports: {
    key: 'workflow.admin.diagnostics.counter.assignment_exports',
    fallback: 'Assignment exports',
  },
  counter_risk_scores: { key: 'workflow.admin.diagnostics.counter.risk_scores', fallback: 'Risk scores' },
  counter_filing_activity: {
    key: 'workflow.admin.diagnostics.counter.filing_activity',
    fallback: 'Filing activity',
  },
  counter_chat_activity: {
    key: 'workflow.admin.diagnostics.counter.chat_activity',
    fallback: 'Chat activity',
  },
  breakdown_assignment_phase: {
    key: 'workflow.admin.diagnostics.breakdown.assignment_phase',
    fallback: 'Assignment phase: req={{requested}}, ok={{succeeded}}, fail={{failed}}',
  },
  breakdown_assignment_status: {
    key: 'workflow.admin.diagnostics.breakdown.assignment_status',
    fallback: 'Assignment status: active={{active}}, completed={{completed}}, cancelled={{cancelled}}',
  },
  breakdown_risk_band: {
    key: 'workflow.admin.diagnostics.breakdown.risk_band',
    fallback: 'Risk bands: low={{low}}, medium={{medium}}, high={{high}}',
  },
  breakdown_filing_family: {
    key: 'workflow.admin.diagnostics.breakdown.filing_family',
    fallback: 'Filing family: generation={{generation}}, submission={{submission}}',
  },
  breakdown_chat_phase: {
    key: 'workflow.admin.diagnostics.breakdown.chat_phase',
    fallback: 'Chat phase: created={{created}}, posted={{posted}}, replayed={{replayed}}',
  },
  drilldown_requested: { key: 'workflow.admin.diagnostics.drilldown.requested', fallback: 'Requested' },
  drilldown_succeeded: { key: 'workflow.admin.diagnostics.drilldown.succeeded', fallback: 'Succeeded' },
  drilldown_failed: { key: 'workflow.admin.diagnostics.drilldown.failed', fallback: 'Failed' },
  drilldown_active: { key: 'workflow.admin.diagnostics.drilldown.active', fallback: 'Active' },
  drilldown_completed: { key: 'workflow.admin.diagnostics.drilldown.completed', fallback: 'Completed' },
  drilldown_cancelled: { key: 'workflow.admin.diagnostics.drilldown.cancelled', fallback: 'Cancelled' },
  drilldown_low: { key: 'workflow.admin.diagnostics.drilldown.low', fallback: 'Low' },
  drilldown_medium: { key: 'workflow.admin.diagnostics.drilldown.medium', fallback: 'Medium' },
  drilldown_high: { key: 'workflow.admin.diagnostics.drilldown.high', fallback: 'High' },
  drilldown_generation: { key: 'workflow.admin.diagnostics.drilldown.generation', fallback: 'Generation' },
  drilldown_submission: { key: 'workflow.admin.diagnostics.drilldown.submission', fallback: 'Submission' },
  drilldown_created: { key: 'workflow.admin.diagnostics.drilldown.created', fallback: 'Created' },
  drilldown_posted: { key: 'workflow.admin.diagnostics.drilldown.posted', fallback: 'Posted' },
  drilldown_resolved: { key: 'workflow.admin.diagnostics.drilldown.resolved', fallback: 'Resolved' },
  readiness_export_ready: {
    key: 'workflow.admin.diagnostics.readiness.export_ready',
    fallback: 'export-ready',
  },
  readiness_no_export_data: {
    key: 'workflow.admin.diagnostics.readiness.no_export_data',
    fallback: 'no export data',
  },
  readiness_latest: {
    key: 'workflow.admin.diagnostics.readiness.latest',
    fallback: ' | latest {{date}}',
  },
  readiness_label: { key: 'workflow.admin.diagnostics.readiness.label', fallback: 'Readiness' },
  filter_all_gates: { key: 'workflow.admin.diagnostics.filter.all_gates', fallback: 'All gates' },
  filter_request_campaigns: {
    key: 'workflow.admin.diagnostics.filter.request_campaigns',
    fallback: 'Request campaigns',
  },
  filter_annual_reporting: {
    key: 'workflow.admin.diagnostics.filter.annual_reporting',
    fallback: 'Annual reporting',
  },
  filter_last_24h: { key: 'workflow.admin.diagnostics.filter.last_24h', fallback: 'Last 24h' },
  filter_last_7d: { key: 'workflow.admin.diagnostics.filter.last_7d', fallback: 'Last 7 days' },
  filter_last_30d: { key: 'workflow.admin.diagnostics.filter.last_30d', fallback: 'Last 30 days' },
  filter_newest_first: { key: 'workflow.admin.diagnostics.filter.newest_first', fallback: 'Newest first' },
  filter_oldest_first: { key: 'workflow.admin.diagnostics.filter.oldest_first', fallback: 'Oldest first' },
  filter_matching_events: {
    key: 'workflow.admin.diagnostics.filter.matching_events',
    fallback: '{{count}} matching event(s)',
  },
  message_telemetry_auth: {
    key: 'workflow.admin.diagnostics.message.telemetry_auth',
    fallback:
      'Telemetry auth check: current session token may be invalid for backend reads in this environment.',
  },
  message_debug_counters: {
    key: 'workflow.admin.diagnostics.message.debug_counters',
    fallback:
      'Debug counters: mutationEvents={{mutationEvents}}, debounceFlushes={{debounceFlushes}}, fetchLoads={{fetchLoads}}',
  },
  loading_telemetry: {
    key: 'workflow.admin.diagnostics.loading.telemetry',
    fallback: 'Loading gated-entry telemetry...',
  },
  empty_telemetry: {
    key: 'workflow.admin.diagnostics.empty.telemetry',
    fallback: 'No gated-entry attempts captured for this tenant yet.',
  },
  section_export_activity: {
    key: 'workflow.admin.diagnostics.section.export_activity',
    fallback: 'Recent Export Activity',
  },
  loading_export_activity: {
    key: 'workflow.admin.diagnostics.loading.export_activity',
    fallback: 'Loading export activity...',
  },
  empty_export_activity: {
    key: 'workflow.admin.diagnostics.empty.export_activity',
    fallback: 'No export activity captured for this tenant yet.',
  },
  table_captured_at: { key: 'workflow.admin.diagnostics.table.captured_at', fallback: 'Captured At' },
  table_gate: { key: 'workflow.admin.diagnostics.table.gate', fallback: 'Gate' },
  table_role: { key: 'workflow.admin.diagnostics.table.role', fallback: 'Role' },
  table_feature: { key: 'workflow.admin.diagnostics.table.feature', fallback: 'Feature' },
  table_redirect: { key: 'workflow.admin.diagnostics.table.redirect', fallback: 'Redirect' },
  table_exported_at: { key: 'workflow.admin.diagnostics.table.exported_at', fallback: 'Exported At' },
  table_actor: { key: 'workflow.admin.diagnostics.table.actor', fallback: 'Actor' },
  table_rows: { key: 'workflow.admin.diagnostics.table.rows', fallback: 'Rows' },
  table_sort: { key: 'workflow.admin.diagnostics.table.sort', fallback: 'Sort' },
  table_truncated: { key: 'workflow.admin.diagnostics.table.truncated', fallback: 'Truncated' },
  table_phase: { key: 'workflow.admin.diagnostics.table.phase', fallback: 'Phase' },
  table_package: { key: 'workflow.admin.diagnostics.table.package', fallback: 'Package' },
  table_idempotency: { key: 'workflow.admin.diagnostics.table.idempotency', fallback: 'Idempotency' },
  table_traces_ref: { key: 'workflow.admin.diagnostics.table.traces_ref', fallback: 'TRACES Ref' },
  table_thread: { key: 'workflow.admin.diagnostics.table.thread', fallback: 'Thread' },
  table_record: { key: 'workflow.admin.diagnostics.table.record', fallback: 'Record' },
  table_message: { key: 'workflow.admin.diagnostics.table.message', fallback: 'Message' },
  table_template: { key: 'workflow.admin.diagnostics.table.template', fallback: 'Template' },
  table_stage: { key: 'workflow.admin.diagnostics.table.stage', fallback: 'Stage' },
  table_sla: { key: 'workflow.admin.diagnostics.table.sla', fallback: 'SLA' },
  table_band: { key: 'workflow.admin.diagnostics.table.band', fallback: 'Band' },
  table_score: { key: 'workflow.admin.diagnostics.table.score', fallback: 'Score' },
  table_filters: { key: 'workflow.admin.diagnostics.table.filters', fallback: 'Filters' },
  table_error: { key: 'workflow.admin.diagnostics.table.error', fallback: 'Error' },
  filter_all_phases: { key: 'workflow.admin.diagnostics.filter.all_phases', fallback: 'All phases' },
  filter_all_sla_states: { key: 'workflow.admin.diagnostics.filter.all_sla_states', fallback: 'All SLA states' },
  filter_all_bands: { key: 'workflow.admin.diagnostics.filter.all_bands', fallback: 'All bands' },
  filter_all_statuses: { key: 'workflow.admin.diagnostics.filter.all_statuses', fallback: 'All statuses' },
  unknown_actor: { key: 'workflow.admin.diagnostics.unknown_actor', fallback: 'unknown' },
  section_filing: { key: 'workflow.admin.diagnostics.section.filing', fallback: 'Filing Activity' },
  count_filing: {
    key: 'workflow.admin.diagnostics.count.filing',
    fallback: '{{count}} matching filing activity event(s)',
  },
  loading_filing: { key: 'workflow.admin.diagnostics.loading.filing', fallback: 'Loading filing activity...' },
  empty_filing: {
    key: 'workflow.admin.diagnostics.empty.filing',
    fallback: 'No filing activity captured for this tenant yet.',
  },
  filter_filing_generation_requested: {
    key: 'workflow.admin.diagnostics.filter.filing.generation_requested',
    fallback: 'Generation requested',
  },
  filter_filing_generation_generated: {
    key: 'workflow.admin.diagnostics.filter.filing.generation_generated',
    fallback: 'Generation generated',
  },
  filter_filing_submission_requested: {
    key: 'workflow.admin.diagnostics.filter.filing.submission_requested',
    fallback: 'Submission requested',
  },
  filter_filing_submission_accepted: {
    key: 'workflow.admin.diagnostics.filter.filing.submission_accepted',
    fallback: 'Submission accepted',
  },
  filter_filing_submission_replayed: {
    key: 'workflow.admin.diagnostics.filter.filing.submission_replayed',
    fallback: 'Submission replayed',
  },
  section_chat: { key: 'workflow.admin.diagnostics.section.chat', fallback: 'Chat Thread Activity' },
  count_chat: {
    key: 'workflow.admin.diagnostics.count.chat',
    fallback: '{{count}} matching chat-thread event(s)',
  },
  loading_chat: { key: 'workflow.admin.diagnostics.loading.chat', fallback: 'Loading chat-thread activity...' },
  empty_chat: {
    key: 'workflow.admin.diagnostics.empty.chat',
    fallback: 'No chat-thread activity captured for this tenant yet.',
  },
  filter_chat_thread_created: {
    key: 'workflow.admin.diagnostics.filter.chat.thread_created',
    fallback: 'Thread created',
  },
  filter_chat_message_posted: {
    key: 'workflow.admin.diagnostics.filter.chat.message_posted',
    fallback: 'Message posted',
  },
  filter_chat_message_replayed: {
    key: 'workflow.admin.diagnostics.filter.chat.message_replayed',
    fallback: 'Message replayed',
  },
  filter_chat_thread_resolved: {
    key: 'workflow.admin.diagnostics.filter.chat.thread_resolved',
    fallback: 'Thread resolved',
  },
  filter_chat_thread_reopened: {
    key: 'workflow.admin.diagnostics.filter.chat.thread_reopened',
    fallback: 'Thread reopened',
  },
  filter_chat_thread_archived: {
    key: 'workflow.admin.diagnostics.filter.chat.thread_archived',
    fallback: 'Thread archived',
  },
  section_workflow: { key: 'workflow.admin.diagnostics.section.workflow', fallback: 'Workflow Activity' },
  count_workflow: {
    key: 'workflow.admin.diagnostics.count.workflow',
    fallback: '{{count}} matching workflow event(s)',
  },
  loading_workflow: {
    key: 'workflow.admin.diagnostics.loading.workflow',
    fallback: 'Loading workflow activity...',
  },
  empty_workflow: {
    key: 'workflow.admin.diagnostics.empty.workflow',
    fallback: 'No workflow activity captured for this tenant yet.',
  },
  filter_workflow_template_created: {
    key: 'workflow.admin.diagnostics.filter.workflow.template_created',
    fallback: 'Template created',
  },
  filter_workflow_stage_transitioned: {
    key: 'workflow.admin.diagnostics.filter.workflow.stage_transitioned',
    fallback: 'Stage transitioned',
  },
  filter_workflow_sla_warning: {
    key: 'workflow.admin.diagnostics.filter.workflow.sla_warning',
    fallback: 'SLA warning',
  },
  filter_workflow_sla_breached: {
    key: 'workflow.admin.diagnostics.filter.workflow.sla_breached',
    fallback: 'SLA breached',
  },
  filter_workflow_sla_escalated: {
    key: 'workflow.admin.diagnostics.filter.workflow.sla_escalated',
    fallback: 'SLA escalated',
  },
  filter_workflow_sla_recovered: {
    key: 'workflow.admin.diagnostics.filter.workflow.sla_recovered',
    fallback: 'SLA recovered',
  },
  filter_sla_state_on_track: {
    key: 'workflow.admin.diagnostics.filter.sla_state.on_track',
    fallback: 'On track',
  },
  filter_sla_state_warning: {
    key: 'workflow.admin.diagnostics.filter.sla_state.warning',
    fallback: 'Warning',
  },
  filter_sla_state_breached: {
    key: 'workflow.admin.diagnostics.filter.sla_state.breached',
    fallback: 'Breached',
  },
  filter_sla_state_escalated: {
    key: 'workflow.admin.diagnostics.filter.sla_state.escalated',
    fallback: 'Escalated',
  },
  section_risk_score: { key: 'workflow.admin.diagnostics.section.risk_score', fallback: 'Risk Score Activity' },
  count_risk_score: {
    key: 'workflow.admin.diagnostics.count.risk_score',
    fallback: '{{count}} matching risk score event(s)',
  },
  loading_risk_score: {
    key: 'workflow.admin.diagnostics.loading.risk_score',
    fallback: 'Loading risk score activity...',
  },
  empty_risk_score: {
    key: 'workflow.admin.diagnostics.empty.risk_score',
    fallback: 'No risk score activity captured for this tenant yet.',
  },
  filter_risk_requested: { key: 'workflow.admin.diagnostics.filter.risk.requested', fallback: 'Requested' },
  filter_risk_evaluated: { key: 'workflow.admin.diagnostics.filter.risk.evaluated', fallback: 'Evaluated' },
  filter_risk_low_band: {
    key: 'workflow.admin.diagnostics.filter.risk.low_band',
    fallback: 'Low band event',
  },
  filter_risk_medium_band: {
    key: 'workflow.admin.diagnostics.filter.risk.medium_band',
    fallback: 'Medium band event',
  },
  filter_risk_high_band: {
    key: 'workflow.admin.diagnostics.filter.risk.high_band',
    fallback: 'High band event',
  },
  section_assignment_export: {
    key: 'workflow.admin.diagnostics.section.assignment_export',
    fallback: 'Assignment Export Activity',
  },
  count_assignment_export: {
    key: 'workflow.admin.diagnostics.count.assignment_export',
    fallback: '{{count}} matching assignment export event(s)',
  },
  loading_assignment_export: {
    key: 'workflow.admin.diagnostics.loading.assignment_export',
    fallback: 'Loading assignment export activity...',
  },
  empty_assignment_export: {
    key: 'workflow.admin.diagnostics.empty.assignment_export',
    fallback: 'No assignment export activity captured for this tenant yet.',
  },
  toast_telemetry_no_rows_page: {
    key: 'workflow.admin.diagnostics.toast.telemetry_no_rows_page',
    fallback: 'No telemetry rows available for export on this page.',
  },
  toast_telemetry_exported_page: {
    key: 'workflow.admin.diagnostics.toast.telemetry_exported_page',
    fallback: 'Telemetry CSV exported for current page.',
  },
  toast_telemetry_no_rows_filters: {
    key: 'workflow.admin.diagnostics.toast.telemetry_no_rows_filters',
    fallback: 'No telemetry rows available for export for current filters.',
  },
  toast_telemetry_exported_count: {
    key: 'workflow.admin.diagnostics.toast.telemetry_exported_count',
    fallback: 'Exported {{count}} telemetry rows.',
  },
  toast_telemetry_export_capped: {
    key: 'workflow.admin.diagnostics.toast.telemetry_export_capped',
    fallback: 'Export capped at {{limit}} rows. Narrow filters for complete extraction.',
  },
  toast_telemetry_export_failed: {
    key: 'workflow.admin.diagnostics.toast.telemetry_export_failed',
    fallback: 'Failed to export telemetry rows.',
  },
  toast_debug_enabled: {
    key: 'workflow.admin.diagnostics.toast.debug_enabled',
    fallback: 'Telemetry debug enabled for this session.',
  },
  toast_debug_disabled: {
    key: 'workflow.admin.diagnostics.toast.debug_disabled',
    fallback: 'Telemetry debug disabled.',
  },
  toast_assignment_no_rows: {
    key: 'workflow.admin.diagnostics.toast.assignment_no_rows',
    fallback: 'No assignment export activity rows available for current filters.',
  },
  toast_assignment_exported_page: {
    key: 'workflow.admin.diagnostics.toast.assignment_exported_page',
    fallback: 'Assignment export activity CSV exported.',
  },
  toast_assignment_exported_count: {
    key: 'workflow.admin.diagnostics.toast.assignment_exported_count',
    fallback: 'Exported {{count}} assignment export activity rows.',
  },
  toast_assignment_export_failed: {
    key: 'workflow.admin.diagnostics.toast.assignment_export_failed',
    fallback: 'Failed to export assignment export activity.',
  },
  toast_risk_no_rows: {
    key: 'workflow.admin.diagnostics.toast.risk_no_rows',
    fallback: 'No risk score activity rows available for current filters.',
  },
  toast_risk_exported_page: {
    key: 'workflow.admin.diagnostics.toast.risk_exported_page',
    fallback: 'Risk score activity CSV exported.',
  },
  toast_risk_exported_count: {
    key: 'workflow.admin.diagnostics.toast.risk_exported_count',
    fallback: 'Exported {{count}} risk score activity rows.',
  },
  toast_risk_export_failed: {
    key: 'workflow.admin.diagnostics.toast.risk_export_failed',
    fallback: 'Failed to export risk score activity.',
  },
  toast_filing_no_rows: {
    key: 'workflow.admin.diagnostics.toast.filing_no_rows',
    fallback: 'No filing activity rows available for current filters.',
  },
  toast_filing_exported_page: {
    key: 'workflow.admin.diagnostics.toast.filing_exported_page',
    fallback: 'Filing activity CSV exported.',
  },
  toast_filing_exported_count: {
    key: 'workflow.admin.diagnostics.toast.filing_exported_count',
    fallback: 'Exported {{count}} filing activity rows.',
  },
  toast_filing_export_failed: {
    key: 'workflow.admin.diagnostics.toast.filing_export_failed',
    fallback: 'Failed to export filing activity.',
  },
  toast_org_created: { key: 'workflow.admin.toast.org_created', fallback: 'Organization created.' },
  toast_org_failed: { key: 'workflow.admin.toast.org_failed', fallback: 'Failed to create organization.' },
  toast_user_invited: { key: 'workflow.admin.toast.user_invited', fallback: 'User invited.' },
  toast_invite_failed: { key: 'workflow.admin.toast.invite_failed', fallback: 'Failed to invite user.' },
  toast_role_updated: { key: 'workflow.admin.toast.role_updated', fallback: 'Role updated.' },
  toast_role_failed: { key: 'workflow.admin.toast.role_failed', fallback: 'Failed to update role.' },
  toast_user_status_updated: {
    key: 'workflow.admin.toast.user_status_updated',
    fallback: 'User status updated.',
  },
  toast_user_status_failed: {
    key: 'workflow.admin.toast.user_status_failed',
    fallback: 'Failed to update user status.',
  },
  yes: { key: 'workflow.admin.diagnostics.yes', fallback: 'Yes' },
  no: { key: 'workflow.admin.diagnostics.no', fallback: 'No' },
  pagination_previous: { key: 'workflow.admin.diagnostics.pagination.previous', fallback: 'Previous' },
  pagination_next: { key: 'workflow.admin.diagnostics.pagination.next', fallback: 'Next' },
  pagination_page: {
    key: 'workflow.admin.diagnostics.pagination.page',
    fallback: 'Page {{page}} of {{totalPages}}',
  },
};

export function getAdminDiagnosticsCopy(
  key: keyof typeof ADMIN_DIAGNOSTICS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ADMIN_DIAGNOSTICS_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getAdminDiagnosticsLabel(
  key: keyof typeof ADMIN_DIAGNOSTICS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  return getAdminDiagnosticsCopy(key, t, values);
}

export function getAdminDiagnosticsPresetLabel(
  presetId: 'latest_blocks' | 'weekly_volume' | 'campaign_focus' | 'reporting_focus',
  t?: TranslateFn,
): string {
  const keyMap = {
    latest_blocks: 'preset_latest_blocks',
    weekly_volume: 'preset_weekly_volume',
    campaign_focus: 'preset_campaign_focus',
    reporting_focus: 'preset_reporting_focus',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[presetId], t);
}

export function getAdminFilingPhaseFilterLabel(
  phase:
    | 'all'
    | 'generation_requested'
    | 'generation_generated'
    | 'submission_requested'
    | 'submission_accepted'
    | 'submission_replayed',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_phases',
    generation_requested: 'filter_filing_generation_requested',
    generation_generated: 'filter_filing_generation_generated',
    submission_requested: 'filter_filing_submission_requested',
    submission_accepted: 'filter_filing_submission_accepted',
    submission_replayed: 'filter_filing_submission_replayed',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[phase], t);
}

export function getAdminChatPhaseFilterLabel(
  phase: 'all' | 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_phases',
    created: 'filter_chat_thread_created',
    posted: 'filter_chat_message_posted',
    replayed: 'filter_chat_message_replayed',
    resolved: 'filter_chat_thread_resolved',
    reopened: 'filter_chat_thread_reopened',
    archived: 'filter_chat_thread_archived',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[phase], t);
}

export function getAdminWorkflowPhaseFilterLabel(
  phase:
    | 'all'
    | 'template_created'
    | 'stage_transitioned'
    | 'sla_warning'
    | 'sla_breached'
    | 'sla_escalated'
    | 'sla_recovered',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_phases',
    template_created: 'filter_workflow_template_created',
    stage_transitioned: 'filter_workflow_stage_transitioned',
    sla_warning: 'filter_workflow_sla_warning',
    sla_breached: 'filter_workflow_sla_breached',
    sla_escalated: 'filter_workflow_sla_escalated',
    sla_recovered: 'filter_workflow_sla_recovered',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[phase], t);
}

export function getAdminWorkflowSlaFilterLabel(
  state: 'all' | 'on_track' | 'warning' | 'breached' | 'escalated',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_sla_states',
    on_track: 'filter_sla_state_on_track',
    warning: 'filter_sla_state_warning',
    breached: 'filter_sla_state_breached',
    escalated: 'filter_sla_state_escalated',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[state], t);
}

export function getAdminRiskScorePhaseFilterLabel(
  phase: 'all' | 'requested' | 'evaluated' | 'low' | 'medium' | 'high',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_phases',
    requested: 'filter_risk_requested',
    evaluated: 'filter_risk_evaluated',
    low: 'filter_risk_low_band',
    medium: 'filter_risk_medium_band',
    high: 'filter_risk_high_band',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[phase], t);
}

export function getAdminRiskScoreBandFilterLabel(
  band: 'all' | 'low' | 'medium' | 'high',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_bands',
    low: 'drilldown_low',
    medium: 'drilldown_medium',
    high: 'drilldown_high',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[band], t);
}

export function getAdminAssignmentPhaseFilterLabel(
  phase: 'all' | 'requested' | 'succeeded' | 'failed',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_phases',
    requested: 'drilldown_requested',
    succeeded: 'drilldown_succeeded',
    failed: 'drilldown_failed',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[phase], t);
}

export function getAdminAssignmentStatusFilterLabel(
  status: 'all' | 'active' | 'completed' | 'cancelled',
  t?: TranslateFn,
): string {
  const keyMap = {
    all: 'filter_all_statuses',
    active: 'drilldown_active',
    completed: 'drilldown_completed',
    cancelled: 'drilldown_cancelled',
  } as const;
  return getAdminDiagnosticsCopy(keyMap[status], t);
}

const ADMIN_ENTITLEMENTS_COPY: Record<string, { key: string; fallback: string }> = {
  title: { key: 'workflow.admin.entitlements.title', fallback: 'Launch Feature Entitlements (Admin)' },
  action_loading: { key: 'workflow.admin.entitlements.action.loading', fallback: 'Loading...' },
  action_load: { key: 'workflow.admin.entitlements.action.load', fallback: 'Load entitlements' },
  table_feature: { key: 'workflow.admin.entitlements.table.feature', fallback: 'Feature' },
  table_status: { key: 'workflow.admin.entitlements.table.status', fallback: 'Status' },
  table_updated_at: { key: 'workflow.admin.entitlements.table.updated_at', fallback: 'Updated at' },
  table_actions: { key: 'workflow.admin.entitlements.table.actions', fallback: 'Actions' },
  empty: {
    key: 'workflow.admin.entitlements.empty',
    fallback: 'No entitlement rows loaded yet. Use the Load entitlements action.',
  },
  action_enable: { key: 'workflow.admin.entitlements.action.enable', fallback: 'Enable' },
  action_trial: { key: 'workflow.admin.entitlements.action.trial', fallback: 'Trial' },
  action_disable: { key: 'workflow.admin.entitlements.action.disable', fallback: 'Disable' },
  status_enabled: { key: 'workflow.admin.entitlements.status.enabled', fallback: 'Enabled' },
  status_disabled: { key: 'workflow.admin.entitlements.status.disabled', fallback: 'Disabled' },
  status_trial: { key: 'workflow.admin.entitlements.status.trial', fallback: 'Trial' },
  toast_loaded: { key: 'workflow.admin.entitlements.toast.loaded', fallback: 'Launch entitlements loaded.' },
  toast_load_error: {
    key: 'workflow.admin.entitlements.toast.load_error',
    fallback: 'Failed to read launch entitlements.',
  },
  toast_updated: {
    key: 'workflow.admin.entitlements.toast.updated',
    fallback: 'Updated entitlement: {{feature}} -> {{status}}.',
  },
  toast_update_error: {
    key: 'workflow.admin.entitlements.toast.update_error',
    fallback: 'Failed to update launch entitlement.',
  },
};

export function getAdminEntitlementsCopy(
  key: keyof typeof ADMIN_ENTITLEMENTS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ADMIN_ENTITLEMENTS_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getAdminEntitlementStatusLabel(
  status: 'enabled' | 'disabled' | 'trial',
  t?: TranslateFn,
): string {
  const keyMap = {
    enabled: 'status_enabled',
    disabled: 'status_disabled',
    trial: 'status_trial',
  } as const;
  return getAdminEntitlementsCopy(keyMap[status], t);
}

const ADMIN_EUDR_DDS_COPY: Record<string, { key: string; fallback: string }> = {
  title_submit: { key: 'workflow.admin.eudr.title.submit', fallback: 'EUDR DDS Submit (Operator Trigger)' },
  title_status: { key: 'workflow.admin.eudr.title.status', fallback: 'EUDR DDS Status Read (Operator Trigger)' },
  preset_import: { key: 'workflow.admin.eudr.preset.import', fallback: 'Import sample' },
  preset_export: { key: 'workflow.admin.eudr.preset.export', fallback: 'Export sample' },
  preset_domestic: { key: 'workflow.admin.eudr.preset.domestic', fallback: 'Domestic sample' },
  action_copy_json: { key: 'workflow.admin.eudr.action.copy_json', fallback: 'Copy JSON' },
  action_load_sample: { key: 'workflow.admin.eudr.action.load_sample', fallback: 'Load sample JSON' },
  action_submit: { key: 'workflow.admin.eudr.action.submit', fallback: 'Submit DDS' },
  action_submitting: { key: 'workflow.admin.eudr.action.submitting', fallback: 'Submitting...' },
  action_check: { key: 'workflow.admin.eudr.action.check_status', fallback: 'Check Status' },
  action_checking: { key: 'workflow.admin.eudr.action.checking', fallback: 'Checking...' },
  field_idempotency_key: { key: 'workflow.admin.eudr.field.idempotency_key', fallback: 'Idempotency key' },
  field_statement_json: { key: 'workflow.admin.eudr.field.statement_json', fallback: 'Statement JSON' },
  field_reference_number: {
    key: 'workflow.admin.eudr.field.reference_number',
    fallback: 'Reference number',
  },
  placeholder_idempotency: { key: 'workflow.admin.eudr.placeholder.idempotency', fallback: 'eudr_dds_...' },
  placeholder_reference: { key: 'workflow.admin.eudr.placeholder.reference', fallback: 'TB-REF-...' },
  error_last: { key: 'workflow.admin.eudr.error.last', fallback: 'Last status error:' },
  action_copy_error_context: {
    key: 'workflow.admin.eudr.action.copy_error_context',
    fallback: 'Copy error context',
  },
  action_download_error_json: {
    key: 'workflow.admin.eudr.action.download_error_json',
    fallback: 'Download error JSON',
  },
  hint_download_folder: {
    key: 'workflow.admin.eudr.hint.download_folder',
    fallback: 'Downloads are saved by your browser to its default Downloads folder.',
  },
  hint_suggested_filename: {
    key: 'workflow.admin.eudr.hint.suggested_filename',
    fallback: 'Suggested filename:',
  },
  action_copy_filename: { key: 'workflow.admin.eudr.action.copy_filename', fallback: 'Copy filename' },
  hint_timestamp_token: {
    key: 'workflow.admin.eudr.hint.timestamp_token',
    fallback: 'Note: {{token}} is replaced at download time.',
  },
  hint_retry: { key: 'workflow.admin.eudr.hint.retry', fallback: 'Retry + Escalation Hint:' },
  status_last_check: {
    key: 'workflow.admin.eudr.status.last_check',
    fallback: 'Last status check: {{checkedAt}} - {{referenceNumber}} (HTTP {{statusCode}})',
  },
  action_copy_payload: { key: 'workflow.admin.eudr.action.copy_payload', fallback: 'Copy payload' },
  action_download_json: { key: 'workflow.admin.eudr.action.download_json', fallback: 'Download JSON' },
  aria_copy_error_context: {
    key: 'workflow.admin.eudr.aria.copy_error_context',
    fallback: 'Copy DDS status error context JSON',
  },
  aria_download_error_json: {
    key: 'workflow.admin.eudr.aria.download_error_json',
    fallback: 'Download DDS status error context JSON',
  },
  aria_copy_filename: {
    key: 'workflow.admin.eudr.aria.copy_filename',
    fallback: 'Copy DDS status error export filename',
  },
  toast_statement_not_object: {
    key: 'workflow.admin.eudr.toast.statement_not_object',
    fallback: 'EUDR statement must be a JSON object.',
  },
  toast_statement_invalid_json: {
    key: 'workflow.admin.eudr.toast.statement_invalid_json',
    fallback: 'EUDR statement must be valid JSON.',
  },
  toast_idempotency_required: {
    key: 'workflow.admin.eudr.toast.idempotency_required',
    fallback: 'Idempotency key is required.',
  },
  toast_submit_failed: {
    key: 'workflow.admin.eudr.toast.submit_failed',
    fallback: 'Failed to submit EUDR DDS payload.',
  },
  toast_submit_success: {
    key: 'workflow.admin.eudr.toast.submit_success',
    fallback: 'EUDR DDS submitted (status {{statusCode}}).',
  },
  toast_submit_replayed: {
    key: 'workflow.admin.eudr.toast.submit_replayed',
    fallback: 'EUDR DDS replay acknowledged (status {{statusCode}}). No duplicate side effects created.',
  },
  toast_sample_loaded: {
    key: 'workflow.admin.eudr.toast.sample_loaded',
    fallback: 'Loaded sample EUDR DDS payload ({{preset}}).',
  },
  toast_statement_copied: {
    key: 'workflow.admin.eudr.toast.statement_copied',
    fallback: 'EUDR statement JSON copied to clipboard.',
  },
  toast_statement_copy_failed: {
    key: 'workflow.admin.eudr.toast.statement_copy_failed',
    fallback: 'Failed to copy EUDR statement JSON.',
  },
  toast_reference_required: {
    key: 'workflow.admin.eudr.toast.reference_required',
    fallback: 'Reference number is required for status read.',
  },
  toast_status_read_failed: {
    key: 'workflow.admin.eudr.toast.status_read_failed',
    fallback: 'Failed to read EUDR DDS status.',
  },
  toast_status_read_success: {
    key: 'workflow.admin.eudr.toast.status_read_success',
    fallback: 'EUDR DDS status read completed (status {{statusCode}}).',
  },
  toast_status_malformed: {
    key: 'workflow.admin.eudr.toast.status_malformed',
    fallback: 'EUDR returned malformed status payload. Retry the check or escalate to integration support.',
  },
  hint_retry_message: {
    key: 'workflow.admin.eudr.hint.retry_message',
    fallback:
      'Retry once after 30 seconds. If it repeats, capture this reference and escalate to integration support.',
  },
  toast_payload_copied: {
    key: 'workflow.admin.eudr.toast.payload_copied',
    fallback: 'EUDR status payload copied to clipboard.',
  },
  toast_payload_copy_failed: {
    key: 'workflow.admin.eudr.toast.payload_copy_failed',
    fallback: 'Failed to copy EUDR status payload.',
  },
  toast_error_context_copied: {
    key: 'workflow.admin.eudr.toast.error_context_copied',
    fallback: 'EUDR status error context copied to clipboard.',
  },
  toast_error_context_copy_failed: {
    key: 'workflow.admin.eudr.toast.error_context_copy_failed',
    fallback: 'Failed to copy EUDR status error context.',
  },
  toast_error_context_downloaded: {
    key: 'workflow.admin.eudr.toast.error_context_downloaded',
    fallback: 'EUDR status error context downloaded.',
  },
  toast_error_filename_copied: {
    key: 'workflow.admin.eudr.toast.error_filename_copied',
    fallback: 'EUDR status error filename copied to clipboard.',
  },
  toast_error_filename_copy_failed: {
    key: 'workflow.admin.eudr.toast.error_filename_copy_failed',
    fallback: 'Failed to copy EUDR status error filename.',
  },
  toast_payload_downloaded: {
    key: 'workflow.admin.eudr.toast.payload_downloaded',
    fallback: 'EUDR status payload downloaded.',
  },
};

export function getAdminEudrDdsCopy(
  key: keyof typeof ADMIN_EUDR_DDS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ADMIN_EUDR_DDS_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getAdminEudrDdsSubmitSuccessMessage(
  input: { statusCode?: number; replayed?: boolean },
  t?: TranslateFn,
): string {
  const statusCode = input.statusCode ?? 200;
  if (input.replayed) {
    return getAdminEudrDdsCopy('toast_submit_replayed', t, { statusCode });
  }
  return getAdminEudrDdsCopy('toast_submit_success', t, { statusCode });
}

export function getAdminEudrDdsStatusErrorMessage(input: { message?: string }, t?: TranslateFn): string {
  const message = input.message?.trim();
  if (!message) {
    return getAdminEudrDdsCopy('toast_status_read_failed', t);
  }
  if (isMalformedEudrDdsStatusPayloadError({ message })) {
    return getAdminEudrDdsCopy('toast_status_malformed', t);
  }
  return message;
}

const ADMIN_WEBHOOK_COPY: Record<string, { key: string; fallback: string }> = {
  title_registrations: {
    key: 'workflow.admin.webhook.title.registrations',
    fallback: 'Integration Webhook Registrations',
  },
  count_registrations: {
    key: 'workflow.admin.webhook.count.registrations',
    fallback: '{{count}} registered webhook event(s)',
  },
  loading_registrations: {
    key: 'workflow.admin.webhook.loading.registrations',
    fallback: 'Loading integration webhooks...',
  },
  empty_registrations: {
    key: 'workflow.admin.webhook.empty.registrations',
    fallback: 'No integration webhooks captured for this tenant yet.',
  },
  table_webhook: { key: 'workflow.admin.webhook.table.webhook', fallback: 'Webhook' },
  table_endpoint: { key: 'workflow.admin.webhook.table.endpoint', fallback: 'Endpoint' },
  table_policy: { key: 'workflow.admin.webhook.table.policy', fallback: 'Policy' },
  title_delivery: { key: 'workflow.admin.webhook.title.delivery', fallback: 'Webhook Delivery Evidence' },
  selected_webhook: {
    key: 'workflow.admin.webhook.selected',
    fallback: 'Selected webhook: {{webhookId}}',
  },
  select_webhook_hint: {
    key: 'workflow.admin.webhook.select_hint',
    fallback: 'Select a webhook row to inspect deliveries',
  },
  loading_delivery: {
    key: 'workflow.admin.webhook.loading.delivery',
    fallback: 'Loading webhook delivery evidence...',
  },
  empty_no_selection: {
    key: 'workflow.admin.webhook.empty.no_selection',
    fallback: 'Select a webhook registration to load immutable delivery evidence.',
  },
  empty_delivery: {
    key: 'workflow.admin.webhook.empty.delivery',
    fallback: 'No delivery evidence captured for this webhook yet.',
  },
  table_phase: { key: 'workflow.admin.webhook.table.phase', fallback: 'Phase' },
  table_delivery: { key: 'workflow.admin.webhook.table.delivery', fallback: 'Delivery' },
  table_attempt: { key: 'workflow.admin.webhook.table.attempt', fallback: 'Attempt' },
  table_status: { key: 'workflow.admin.webhook.table.status', fallback: 'Status' },
};

export function getAdminWebhookCopy(
  key: keyof typeof ADMIN_WEBHOOK_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ADMIN_WEBHOOK_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

const ADMIN_RBAC_COPY: Record<string, { key: string; fallback: string }> = {
  title: { key: 'workflow.admin.rbac.title', fallback: 'RBAC Permission Matrix' },
  subtitle: {
    key: 'workflow.admin.rbac.subtitle',
    fallback: 'View role-based access control permissions for commercial and legal workflow roles',
  },
  back_to_admin: { key: 'workflow.admin.rbac.back_to_admin', fallback: 'Back to Admin' },
  info_title: {
    key: 'workflow.admin.rbac.info.title',
    fallback: 'Understanding the Permission System',
  },
  info_body_prefix: {
    key: 'workflow.admin.rbac.info.body_prefix',
    fallback: 'Tracebud separates',
  },
  info_commercial_label: {
    key: 'workflow.admin.rbac.info.commercial_label',
    fallback: 'Commercial Permissions',
  },
  info_body_mid: {
    key: 'workflow.admin.rbac.info.body_mid',
    fallback: '(what features users can access based on their commercial tier) from',
  },
  info_legal_label: {
    key: 'workflow.admin.rbac.info.legal_label',
    fallback: 'Legal Workflow Permissions',
  },
  info_body_suffix: {
    key: 'workflow.admin.rbac.info.body_suffix',
    fallback:
      "(what legal actions users can take per EUDR requirements). A user's legal role is determined per workflow, not as a static label.",
  },
  tab_commercial: { key: 'workflow.admin.rbac.tab.commercial', fallback: 'Commercial Tier' },
  tab_legal: { key: 'workflow.admin.rbac.tab.legal', fallback: 'Legal Workflow' },
  commercial_title: {
    key: 'workflow.admin.rbac.commercial.title',
    fallback: 'Commercial Tier Permission Matrix',
  },
  commercial_subtitle: {
    key: 'workflow.admin.rbac.commercial.subtitle',
    fallback: 'Permissions available to each tenant role based on their commercial tier subscription',
  },
  table_permission: { key: 'workflow.admin.rbac.table.permission', fallback: 'Permission' },
  role_sponsor: { key: 'workflow.admin.rbac.role.sponsor', fallback: 'Network Sponsor' },
  group_packages_shipments: {
    key: 'workflow.admin.rbac.group.packages_shipments',
    fallback: 'Packages/Shipments',
  },
  group_plots: { key: 'workflow.admin.rbac.group.plots', fallback: 'Plots' },
  group_farmers: { key: 'workflow.admin.rbac.group.farmers', fallback: 'Farmers' },
  group_compliance: { key: 'workflow.admin.rbac.group.compliance', fallback: 'Compliance' },
  group_requests: { key: 'workflow.admin.rbac.group.requests', fallback: 'Requests' },
  group_reports: { key: 'workflow.admin.rbac.group.reports', fallback: 'Reports' },
  group_admin: { key: 'workflow.admin.rbac.group.admin', fallback: 'Admin' },
  perm_packages_view: { key: 'workflow.admin.rbac.perm.packages_view', fallback: 'View Packages' },
  perm_packages_create: { key: 'workflow.admin.rbac.perm.packages_create', fallback: 'Create Packages' },
  perm_packages_edit: { key: 'workflow.admin.rbac.perm.packages_edit', fallback: 'Edit Packages' },
  perm_packages_delete: { key: 'workflow.admin.rbac.perm.packages_delete', fallback: 'Delete Packages' },
  perm_packages_seal_shipment: {
    key: 'workflow.admin.rbac.perm.packages_seal_shipment',
    fallback: 'Seal Shipment',
  },
  perm_packages_submit_traces: {
    key: 'workflow.admin.rbac.perm.packages_submit_traces',
    fallback: 'Submit to TRACES (importer only)',
  },
  perm_packages_approve: { key: 'workflow.admin.rbac.perm.packages_approve', fallback: 'Approve Packages' },
  perm_plots_view: { key: 'workflow.admin.rbac.perm.plots_view', fallback: 'View Plots' },
  perm_plots_create: { key: 'workflow.admin.rbac.perm.plots_create', fallback: 'Create Plots' },
  perm_plots_edit: { key: 'workflow.admin.rbac.perm.plots_edit', fallback: 'Edit Plots' },
  perm_plots_delete: { key: 'workflow.admin.rbac.perm.plots_delete', fallback: 'Delete Plots' },
  perm_plots_bulk_upload: { key: 'workflow.admin.rbac.perm.plots_bulk_upload', fallback: 'Bulk Upload' },
  perm_farmers_view: { key: 'workflow.admin.rbac.perm.farmers_view', fallback: 'View Farmers' },
  perm_farmers_create: { key: 'workflow.admin.rbac.perm.farmers_create', fallback: 'Create Farmers' },
  perm_farmers_edit: { key: 'workflow.admin.rbac.perm.farmers_edit', fallback: 'Edit Farmers' },
  perm_farmers_delete: { key: 'workflow.admin.rbac.perm.farmers_delete', fallback: 'Delete Farmers' },
  perm_farmers_link_validation: {
    key: 'workflow.admin.rbac.perm.farmers_link_validation',
    fallback: 'Link Validation',
  },
  perm_compliance_view: { key: 'workflow.admin.rbac.perm.compliance_view', fallback: 'View Compliance' },
  perm_compliance_run_check: { key: 'workflow.admin.rbac.perm.compliance_run_check', fallback: 'Run Check' },
  perm_compliance_approve: { key: 'workflow.admin.rbac.perm.compliance_approve', fallback: 'Approve' },
  perm_compliance_create_issue: {
    key: 'workflow.admin.rbac.perm.compliance_create_issue',
    fallback: 'Create Issue',
  },
  perm_compliance_resolve_issue: {
    key: 'workflow.admin.rbac.perm.compliance_resolve_issue',
    fallback: 'Resolve Issue',
  },
  perm_requests_view: { key: 'workflow.admin.rbac.perm.requests_view', fallback: 'View Requests' },
  perm_requests_create: { key: 'workflow.admin.rbac.perm.requests_create', fallback: 'Create Requests' },
  perm_requests_send: { key: 'workflow.admin.rbac.perm.requests_send', fallback: 'Send Requests' },
  perm_requests_respond: { key: 'workflow.admin.rbac.perm.requests_respond', fallback: 'Respond' },
  perm_reports_view: { key: 'workflow.admin.rbac.perm.reports_view', fallback: 'View Reports' },
  perm_reports_generate: { key: 'workflow.admin.rbac.perm.reports_generate', fallback: 'Generate' },
  perm_reports_export: { key: 'workflow.admin.rbac.perm.reports_export', fallback: 'Export' },
  perm_admin_view: { key: 'workflow.admin.rbac.perm.admin_view', fallback: 'View Admin' },
  perm_admin_manage_users: {
    key: 'workflow.admin.rbac.perm.admin_manage_users',
    fallback: 'Manage Users',
  },
  perm_admin_manage_roles: {
    key: 'workflow.admin.rbac.perm.admin_manage_roles',
    fallback: 'Manage Roles',
  },
  perm_roles_manual_classify: {
    key: 'workflow.admin.rbac.perm.roles_manual_classify',
    fallback: 'Manual Role Classification',
  },
  legal_roles_title: {
    key: 'workflow.admin.rbac.legal.roles_title',
    fallback: 'EUDR Legal Workflow Roles',
  },
  legal_roles_subtitle: {
    key: 'workflow.admin.rbac.legal.roles_subtitle',
    fallback: "Legal roles are determined per workflow based on the entity's position in the supply chain",
  },
  legal_matrix_title: {
    key: 'workflow.admin.rbac.legal.matrix_title',
    fallback: 'Legal Workflow Permission Matrix',
  },
  legal_matrix_subtitle: {
    key: 'workflow.admin.rbac.legal.matrix_subtitle',
    fallback: 'What legal actions each workflow role can perform under EUDR',
  },
  no_legal_permissions: {
    key: 'workflow.admin.rbac.legal.no_permissions',
    fallback: 'No legal permissions',
  },
  legal_perm_submit_dds: { key: 'workflow.admin.rbac.legal_perm.submit_dds', fallback: 'Submit DDS' },
  legal_perm_submit_simplified_declaration: {
    key: 'workflow.admin.rbac.legal_perm.submit_simplified_declaration',
    fallback: 'Submit Simplified Declaration',
  },
  legal_perm_retain_reference: {
    key: 'workflow.admin.rbac.legal_perm.retain_reference',
    fallback: 'Retain Reference',
  },
  legal_perm_downstream_reference: {
    key: 'workflow.admin.rbac.legal_perm.downstream_reference',
    fallback: 'Downstream Reference',
  },
  legal_perm_trader_retention: {
    key: 'workflow.admin.rbac.legal_perm.trader_retention',
    fallback: 'Trader Retention',
  },
  legal_perm_acknowledge_liability: {
    key: 'workflow.admin.rbac.legal_perm.acknowledge_liability',
    fallback: 'Acknowledge Liability',
  },
};

const RBAC_PERMISSION_GROUP_COPY_KEYS = {
  packages_shipments: 'group_packages_shipments',
  plots: 'group_plots',
  farmers: 'group_farmers',
  compliance: 'group_compliance',
  requests: 'group_requests',
  reports: 'group_reports',
  admin: 'group_admin',
} as const;

const RBAC_COMMERCIAL_PERMISSION_COPY_KEYS: Record<string, keyof typeof ADMIN_RBAC_COPY> = {
  'packages:view': 'perm_packages_view',
  'packages:create': 'perm_packages_create',
  'packages:edit': 'perm_packages_edit',
  'packages:delete': 'perm_packages_delete',
  'packages:seal_shipment': 'perm_packages_seal_shipment',
  'packages:submit_traces': 'perm_packages_submit_traces',
  'packages:approve': 'perm_packages_approve',
  'plots:view': 'perm_plots_view',
  'plots:create': 'perm_plots_create',
  'plots:edit': 'perm_plots_edit',
  'plots:delete': 'perm_plots_delete',
  'plots:bulk_upload': 'perm_plots_bulk_upload',
  'farmers:view': 'perm_farmers_view',
  'farmers:create': 'perm_farmers_create',
  'farmers:edit': 'perm_farmers_edit',
  'farmers:delete': 'perm_farmers_delete',
  'farmers:link_validation': 'perm_farmers_link_validation',
  'compliance:view': 'perm_compliance_view',
  'compliance:run_check': 'perm_compliance_run_check',
  'compliance:approve': 'perm_compliance_approve',
  'compliance:create_issue': 'perm_compliance_create_issue',
  'compliance:resolve_issue': 'perm_compliance_resolve_issue',
  'requests:view': 'perm_requests_view',
  'requests:create': 'perm_requests_create',
  'requests:send': 'perm_requests_send',
  'requests:respond': 'perm_requests_respond',
  'reports:view': 'perm_reports_view',
  'reports:generate': 'perm_reports_generate',
  'reports:export': 'perm_reports_export',
  'admin:view': 'perm_admin_view',
  'admin:manage_users': 'perm_admin_manage_users',
  'admin:manage_roles': 'perm_admin_manage_roles',
  'roles:manual_classify': 'perm_roles_manual_classify',
};

const RBAC_LEGAL_PERMISSION_COPY_KEYS: Record<string, keyof typeof ADMIN_RBAC_COPY> = {
  'legal:submit_dds': 'legal_perm_submit_dds',
  'legal:submit_simplified_declaration': 'legal_perm_submit_simplified_declaration',
  'legal:retain_reference': 'legal_perm_retain_reference',
  'legal:downstream_reference': 'legal_perm_downstream_reference',
  'legal:trader_retention': 'legal_perm_trader_retention',
  'legal:acknowledge_liability': 'legal_perm_acknowledge_liability',
};

export type AdminRbacPermissionGroupId = keyof typeof RBAC_PERMISSION_GROUP_COPY_KEYS;

export function getAdminRbacCopy(
  key: keyof typeof ADMIN_RBAC_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = ADMIN_RBAC_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getAdminRbacCommercialRoleLabel(role: TenantRole, t?: TranslateFn): string {
  if (role === 'sponsor') {
    return getAdminRbacCopy('role_sponsor', t);
  }
  return getAdminTenantRoleLabel(role, t);
}

export function getAdminRbacPermissionGroupLabel(groupId: AdminRbacPermissionGroupId, t?: TranslateFn): string {
  return getAdminRbacCopy(RBAC_PERMISSION_GROUP_COPY_KEYS[groupId], t);
}

export function getAdminRbacCommercialPermissionLabel(permKey: string, t?: TranslateFn): string {
  const copyKey = RBAC_COMMERCIAL_PERMISSION_COPY_KEYS[permKey];
  if (!copyKey) return permKey;
  return getAdminRbacCopy(copyKey, t);
}

export function getAdminRbacLegalPermissionLabel(permKey: string, t?: TranslateFn): string {
  const copyKey = RBAC_LEGAL_PERMISSION_COPY_KEYS[permKey];
  if (!copyKey) return permKey.replace('legal:', '');
  return getAdminRbacCopy(copyKey, t);
}

export function getOrganizationTypeLabel(
  value: 'cooperative' | 'exporter' | 'importer' | 'processor' | 'trader' | 'other',
  t?: TranslateFn,
): string {
  const keyMap = {
    cooperative: 'workflow.contacts.org_type.cooperative',
    exporter: 'workflow.contacts.org_type.exporter',
    importer: 'workflow.contacts.org_type.importer',
    processor: 'workflow.contacts.org_type.processor',
    trader: 'workflow.contacts.org_type.trader',
    other: 'workflow.contacts.org_type.other',
  } as const;
  const fallbackMap = {
    cooperative: 'Cooperative',
    exporter: 'Exporter',
    importer: 'Importer',
    processor: 'Processor',
    trader: 'Trader',
    other: 'Other',
  } as const;
  return wf(keyMap[value], fallbackMap[value], t);
}

export function getOrganizationSizeLabel(
  value: 'micro' | 'small' | 'medium' | 'large',
  t?: TranslateFn,
): string {
  const keyMap = {
    micro: 'workflow.contacts.org_size.micro',
    small: 'workflow.contacts.org_size.small',
    medium: 'workflow.contacts.org_size.medium',
    large: 'workflow.contacts.org_size.large',
  } as const;
  const fallbackMap = {
    micro: 'Micro (1-9 employees)',
    small: 'Small (10-49 employees)',
    medium: 'Medium (50-249 employees)',
    large: 'Large (250+ employees)',
  } as const;
  return wf(keyMap[value], fallbackMap[value], t);
}

export function getContactsOrganizationWizardLabel(key: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    step_basic: 'workflow.contacts.org_wizard.step.basic',
    step_details: 'workflow.contacts.org_wizard.step.details',
    step_location: 'workflow.contacts.org_wizard.step.location',
    step_review: 'workflow.contacts.org_wizard.step.review',
    basic_title: 'workflow.contacts.org_wizard.basic.title',
    basic_subtitle: 'workflow.contacts.org_wizard.basic.subtitle',
    details_title: 'workflow.contacts.org_wizard.details.title',
    details_subtitle: 'workflow.contacts.org_wizard.details.subtitle',
    location_title: 'workflow.contacts.org_wizard.location.title',
    location_subtitle: 'workflow.contacts.org_wizard.location.subtitle',
    review_title: 'workflow.contacts.org_wizard.review.title',
    review_subtitle: 'workflow.contacts.org_wizard.review.subtitle',
    field_name: 'workflow.contacts.org_wizard.field.name',
    field_type: 'workflow.contacts.org_wizard.field.type',
    field_registration: 'workflow.contacts.org_wizard.field.registration',
    field_email: 'workflow.contacts.org_wizard.field.email',
    field_phone: 'workflow.contacts.org_wizard.field.phone',
    field_website: 'workflow.contacts.org_wizard.field.website',
    field_size: 'workflow.contacts.org_wizard.field.size',
    field_commodities: 'workflow.contacts.org_wizard.field.commodities',
    field_certifications: 'workflow.contacts.org_wizard.field.certifications',
    field_country: 'workflow.contacts.org_wizard.field.country',
    field_region: 'workflow.contacts.org_wizard.field.region',
    field_address: 'workflow.contacts.org_wizard.field.address',
    field_notes: 'workflow.contacts.org_wizard.field.notes',
    field_location: 'workflow.contacts.org_wizard.field.location',
    placeholder_select_type: 'workflow.contacts.org_wizard.placeholder.select_type',
    placeholder_select_size: 'workflow.contacts.org_wizard.placeholder.select_size',
    hint_commodities: 'workflow.contacts.org_wizard.hint.commodities',
    hint_certifications: 'workflow.contacts.org_wizard.hint.certifications',
    action_cancel: 'workflow.contacts.org_wizard.action.cancel',
    action_back: 'workflow.contacts.org_wizard.action.back',
    action_next: 'workflow.contacts.org_wizard.action.next',
    action_saving: 'workflow.contacts.org_wizard.action.saving',
    action_save: 'workflow.contacts.org_wizard.action.save',
    error_create: 'workflow.contacts.org_wizard.error.create',
  };
  const fallbackMap: Record<string, string> = {
    step_basic: 'Basic Info',
    step_details: 'Details',
    step_location: 'Location',
    step_review: 'Review',
    basic_title: 'Basic Information',
    basic_subtitle: "Enter the organization's core details",
    details_title: 'Organization Details',
    details_subtitle: 'Add more information about the organization',
    location_title: 'Location Information',
    location_subtitle: "Specify the organization's location",
    review_title: 'Review Organization',
    review_subtitle: 'Verify the information before saving',
    field_name: 'Organization Name',
    field_type: 'Organization Type',
    field_registration: 'Registration Number',
    field_email: 'Primary Email',
    field_phone: 'Primary Phone',
    field_website: 'Website',
    field_size: 'Organization Size',
    field_commodities: 'Commodities',
    field_certifications: 'Certifications',
    field_country: 'Country',
    field_region: 'Region / State',
    field_address: 'Full Address',
    field_notes: 'Additional Notes',
    field_location: 'Location',
    placeholder_select_type: 'Select type',
    placeholder_select_size: 'Select size',
    hint_commodities: 'List the primary commodities this organization handles',
    hint_certifications: 'List any relevant certifications (comma-separated)',
    action_cancel: 'Cancel',
    action_back: 'Back',
    action_next: 'Next',
    action_saving: 'Saving...',
    action_save: 'Save Organization',
    error_create: 'Failed to create organization.',
  };
  return wf(keyMap[key] ?? key, fallbackMap[key] ?? key, t);
}

export function getContactsCsvWizardLabel(key: string, t?: TranslateFn): string {
  const keyMap: Record<string, string> = {
    step_upload: 'workflow.contacts.csv.step.upload',
    step_map: 'workflow.contacts.csv.step.map',
    step_review: 'workflow.contacts.csv.step.review',
    step_import: 'workflow.contacts.csv.step.import',
    title_upload: 'workflow.contacts.csv.title.upload',
    desc_upload_contacts: 'workflow.contacts.csv.desc.upload_contacts',
    desc_upload_organizations: 'workflow.contacts.csv.desc.upload_organizations',
    dropzone_title: 'workflow.contacts.csv.dropzone.title',
    dropzone_subtitle: 'workflow.contacts.csv.dropzone.subtitle',
    download_template: 'workflow.contacts.csv.action.download_template',
    requirements_title: 'workflow.contacts.csv.requirements.title',
    requirements_headers: 'workflow.contacts.csv.requirements.headers',
    requirements_delimiter: 'workflow.contacts.csv.requirements.delimiter',
    requirements_required: 'workflow.contacts.csv.requirements.required',
    requirements_max_rows: 'workflow.contacts.csv.requirements.max_rows',
    title_map: 'workflow.contacts.csv.title.map',
    desc_map: 'workflow.contacts.csv.desc.map',
    map_required_warning: 'workflow.contacts.csv.map.required_warning',
    csv_column: 'workflow.contacts.csv.map.csv_column',
    sample: 'workflow.contacts.csv.map.sample',
    sample_empty: 'workflow.contacts.csv.map.sample_empty',
    map_to_field: 'workflow.contacts.csv.map.to_field',
    title_review: 'workflow.contacts.csv.title.review',
    desc_review: 'workflow.contacts.csv.desc.review',
    validation_errors: 'workflow.contacts.csv.validation.title',
    row_prefix: 'workflow.contacts.csv.validation.row_prefix',
    and_more: 'workflow.contacts.csv.validation.and_more',
    table_status: 'workflow.contacts.csv.table.status',
    status_error: 'workflow.contacts.csv.table.status_error',
    status_ready: 'workflow.contacts.csv.table.status_ready',
    status_skipped: 'workflow.contacts.csv.table.status_skipped',
    showing_first: 'workflow.contacts.csv.table.showing_first',
    title_complete: 'workflow.contacts.csv.title.complete',
    desc_complete_contacts: 'workflow.contacts.csv.desc.complete_contacts',
    desc_complete_organizations: 'workflow.contacts.csv.desc.complete_organizations',
    success_count: 'workflow.contacts.csv.summary.success',
    failed_count: 'workflow.contacts.csv.summary.failed',
    import_errors: 'workflow.contacts.csv.summary.errors',
    action_cancel: 'workflow.contacts.csv.action.cancel',
    action_back: 'workflow.contacts.csv.action.back',
    action_next: 'workflow.contacts.csv.action.next',
    action_importing: 'workflow.contacts.csv.action.importing',
    action_import_records: 'workflow.contacts.csv.action.import_records',
    action_done: 'workflow.contacts.csv.action.done',
    error_upload_csv: 'workflow.contacts.csv.error.upload_csv',
    error_empty_csv: 'workflow.contacts.csv.error.empty_csv',
    error_read_file: 'workflow.contacts.csv.error.read_file',
    error_import_failed: 'workflow.contacts.csv.error.import_failed',
  };
  const fallbackMap: Record<string, string> = {
    step_upload: 'Upload File',
    step_map: 'Map Fields',
    step_review: 'Review',
    step_import: 'Import',
    title_upload: 'Upload CSV File',
    desc_upload_contacts: 'Upload a CSV file with contact data',
    desc_upload_organizations: 'Upload a CSV file with organization data',
    dropzone_title: 'Drag and drop your CSV file here',
    dropzone_subtitle: 'or click to browse',
    download_template: 'Download Template',
    requirements_title: 'CSV Requirements',
    requirements_headers: 'First row should contain column headers',
    requirements_delimiter: 'Use comma (,) as the delimiter',
    requirements_required: 'Required fields:',
    requirements_max_rows: 'Maximum 1,000 rows per import',
    title_map: 'Map Fields',
    desc_map: 'Match your CSV columns to the correct fields',
    map_required_warning: 'Please map all required fields:',
    csv_column: 'CSV Column',
    sample: 'Sample:',
    sample_empty: '(empty)',
    map_to_field: 'Map to Field',
    title_review: 'Review Data',
    desc_review: 'Select the rows you want to import',
    validation_errors: 'Validation Errors',
    row_prefix: 'Row',
    and_more: '...and {{count}} more errors',
    table_status: 'Status',
    status_error: 'Error',
    status_ready: 'Ready',
    status_skipped: 'Skipped',
    showing_first: 'Showing first {{shown}} of {{total}} rows',
    title_complete: 'Import Complete',
    desc_complete_contacts: '{{count}} contacts imported successfully',
    desc_complete_organizations: '{{count}} organizations imported successfully',
    success_count: 'Successfully imported',
    failed_count: 'Failed to import',
    import_errors: 'Import Errors',
    action_cancel: 'Cancel',
    action_back: 'Back',
    action_next: 'Next',
    action_importing: 'Importing...',
    action_import_records: 'Import {{count}} Records',
    action_done: 'Done',
    error_upload_csv: 'Please upload a CSV file.',
    error_empty_csv: 'The CSV file appears to be empty.',
    error_read_file: 'Failed to read the file. Please try again.',
    error_import_failed: 'Import failed. Please try again.',
  };
  return wf(keyMap[key] ?? key, fallbackMap[key] ?? key, t);
}

type FlatCopyEntry = { key: string; fallback: string; cooperativeFallback?: string };

function flattenCopyRegistry(registry: Record<string, FlatCopyEntry>): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const entry of Object.values(registry)) {
    manifest[entry.key] = entry.fallback;
  }
  return manifest;
}

function flattenSignupPrimaryRoleCopy(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const entry of Object.values(SIGNUP_PRIMARY_ROLE_COPY)) {
    manifest[entry.labelKey] = entry.labelFallback;
    manifest[entry.descriptionKey] = entry.descriptionFallback;
  }
  return manifest;
}

function flattenOnboardingChecklistTaskCopy(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const task of Object.values(ONBOARDING_CHECKLIST_TASK_COPY)) {
    manifest[task.label.key] = task.label.fallback;
    manifest[task.description.key] = task.description.fallback;
    manifest[task.cta.key] = task.cta.fallback;
  }
  return manifest;
}

function flattenNotificationCapabilityCopy(): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const capability of Object.values(NOTIFICATION_CAPABILITY_COPY)) {
    manifest[capability.title.key] = capability.title.fallback;
    manifest[capability.description.key] = capability.description.fallback;
    if (capability.note) {
      manifest[capability.note.key] = capability.note.fallback;
    }
  }
  return manifest;
}

/** All workflow helper keys with English fallbacks — used for en.json parity CI. */
export function collectWorkflowTerminologyCopyManifest(): Record<string, string> {
  return {
    ...WORKFLOW_LABELS,
    ...flattenCopyRegistry(PRODUCER_DETAIL_COPY),
    ...flattenCopyRegistry(PRODUCER_CONSENT_COPY),
    ...flattenCopyRegistry(PRODUCER_CONSENT_STATUS_COPY),
    ...flattenCopyRegistry(APP_CHROME_COPY),
    ...flattenCopyRegistry(AUTH_COPY),
    ...flattenCopyRegistry(SIGNUP_COPY),
    ...flattenSignupPrimaryRoleCopy(),
    ...flattenCopyRegistry(SIGNUP_COMMODITY_COPY),
    ...flattenCopyRegistry(SIGNUP_OBJECTIVE_COPY),
    ...flattenCopyRegistry(ONBOARDING_CHECKLIST_SHELL_COPY),
    ...flattenOnboardingChecklistTaskCopy(),
    ...flattenCopyRegistry(SETTINGS_COPY),
    ...flattenCopyRegistry(SUPPLY_CHAIN_ROLE_LABEL_COPY),
    ...flattenCopyRegistry(SUPPLY_CHAIN_ROLE_DESC_COPY),
    ...flattenCopyRegistry(SUPPLY_CHAIN_PRESET_COPY),
    ...flattenCopyRegistry(SPONSOR_PANEL_COPY),
    ...flattenCopyRegistry(ONBOARDING_WELCOME_COPY),
    ...flattenCopyRegistry(WELCOME_CARD_COPY),
    ...ONBOARDING_WELCOME_HIGHLIGHT_FALLBACKS,
    ...WELCOME_CARD_HIGHLIGHT_FALLBACKS,
    ...flattenCopyRegistry(ONBOARDING_TOUR_COPY),
    ...flattenCopyRegistry(SETTINGS_PAGE_COPY),
    ...flattenNotificationCapabilityCopy(),
    ...flattenCopyRegistry(ASYNC_STATE_SHELL_COPY),
    ...flattenCopyRegistry(ADMIN_DIAGNOSTICS_COPY),
    ...flattenCopyRegistry(ADMIN_ENTITLEMENTS_COPY),
    ...flattenCopyRegistry(ADMIN_EUDR_DDS_COPY),
    ...flattenCopyRegistry(ADMIN_WEBHOOK_COPY),
    ...flattenCopyRegistry(ADMIN_RBAC_COPY),
  };
}
