import { describe, expect, it } from 'vitest';
import {
  buildPackageBreadcrumbs,
  buildComplianceQueueBreadcrumbs,
  getCompliancePageTitle,
  getComplianceQueuePageTitle,
  getDashboardSubtitle,
  getDdsPreflightChecks,
  getDdsReadyForTracesMessage,
  getDdsWorkspaceSubtitle,
  getDdsWorkspaceTitle,
  getEvidenceEmptyMessage,
  getEvidencePageTitle,
  getEvidenceSummaryTotalLabel,
  getEvidenceUploadCtaLabel,
  getHarvestListPageSubtitle,
  getIssuesPageSubtitle,
  getPackageCreateTitle,
  getPackageAssembleSealCtaLabel,
  getPackagePreflightBlockersDescription,
  getPackageSubmitBreadcrumbLabel,
  getPackageSubmitPageTitle,
  getPackageSubmitSuccessToast,
  getPackageTimelineBreadcrumbLabel,
  getPackagesPageTitle,
  getPlotDeforestationRiskLabel,
  getPlotDetailPageSubtitle,
  getPlotReviewOverlapSummary,
  getPlotReviewPageTitle,
  getContentReviewStatLabel,
  getContentReviewStatusLabel,
  getInboxPageTitle,
  getIssuesBlockingAlert,
  getComplianceCheckSummaryTitle,
  getPlotBreakdownBlockingTitle,
  getSlaEscalationTimelineTitle,
  getFieldOpsPageTitle,
  getReportsPageHeader,
  getRoleDecisionsStatLabel,
  getHelpPageSubtitle,
  getContactsPageTitle,
  getContactStatusLabel,
  getContactConsentLabel,
  getContactTypeLabel,
  getHarvestFilterStatusLabel,
  getHarvestReceiveDeliveryCopy,
  getProducerDetailHref,
  getProducersNavHref,
  getContactsAddPageTitle,
  getContactsWizardStepLabel,
  getAdminUsersSubtitle,
  getAdminUsersTableColumnLabel,
  getAdminDiagnosticsPresetLabel,
  getAdminDiagnosticsCopy,
  getAdminEntitlementsCopy,
  getAdminEntitlementStatusLabel,
  getAdminEudrDdsCopy,
  getAdminWebhookCopy,
  getProducerDetailCopy,
  getProducerConsentCopy,
  getProducerConsentStatusLabel,
  getAppChromeCopy,
  getAuthCopy,
  getSignupCopy,
  getOnboardingChecklistTaskCopy,
  getSettingsCopy,
  getSettingsPageCopy,
  getSponsorPanelCopy,
  getOnboardingWelcomeCopy,
  getOnboardingTourCopy,
  getOnboardingStepCopy,
  localizeOnboardingConfig,
  getVirginStateHeadingCopy,
  getDemoDataCopy,
  getWelcomeCardCopy,
  getAsyncStateShellCopy,
  getSupplyChainRolePresetLabel,
  getAdminFilingPhaseFilterLabel,
  getAdminEudrDdsSubmitSuccessMessage,
  getAdminEudrDdsStatusErrorMessage,
  getAdminPageTitle,
  getAdminTenantRoleLabel,
  getAdminRbacCopy,
  getAdminRbacCommercialPermissionLabel,
  getLegalRoleFilterLabel,
  getLegalRoleDescriptionLabel,
  formatSlaTimeRemaining,
  getIssuesKanbanColumnLabel,
  getIssuesSlaLabel,
  getIssuesOpenRemediationLabel,
  getOutreachPageTitle,
  getProducersFilterComplianceOption,
  getProducersTableColumnLabel,
  getTenureReviewCadastralMatchMessage,
  getTenureReviewPageTitle,
  getWorkflowAsyncStateCopy,
  getPlotReadyMessage,
  getProducerComplianceLabel,
  getProducersPageTitle,
  getContactsEmptyCopy,
  getSharedPackagesTabLabel,
  getShipmentAssembleCtaLabel,
  getShipmentPageSubtitle,
  getTracesReferenceLabel,
  validatePackageCreateForm,
} from './workflow-terminology-labels';

describe('workflow-terminology-labels', () => {
  it('keeps shipment workflow titles for supply-chain roles', () => {
    expect(getPackagesPageTitle('importer')).toBe('Shipments');
    expect(getPackagesPageTitle('country_reviewer')).toBe('DDS Packages');
  });

  it('preserves TRACES and handoff language in compliance and issues copy', () => {
    expect(getCompliancePageTitle('importer')).toBe('Compliance');
    expect(getCompliancePageTitle('exporter')).toBe('Zero-Risk Pre-Flight Check');
    expect(getIssuesPageSubtitle('importer')).toContain('TRACES');
    expect(getIssuesPageSubtitle('exporter')).toContain('importer handoff');
  });

  it('interpolates shared tab counts', () => {
    expect(getSharedPackagesTabLabel('importer', 3)).toBe('Shared Shipments (3)');
  });

  it('uses origin-role harvest subtitles', () => {
    expect(getHarvestListPageSubtitle('exporter')).toContain('importer handoff');
    expect(getHarvestListPageSubtitle('cooperative')).toContain('export handoff');
  });

  it('uses role-aware shipment page subtitles', () => {
    expect(getShipmentPageSubtitle('importer')).toContain('TRACES');
    expect(getShipmentPageSubtitle('exporter')).toContain('importer');
  });

  it('builds locale-aware package breadcrumbs', () => {
    expect(buildPackageBreadcrumbs('importer', 'SHP-001', 'pkg_1')).toEqual([
      { label: 'Dashboard', href: '/' },
      { label: 'Shipments', href: '/packages' },
      { label: 'SHP-001', href: '/packages/pkg_1' },
    ]);
  });

  it('keeps TRACES filing labels on package detail actions', () => {
    expect(getPackageSubmitPageTitle('importer')).toBe('Submit to TRACES');
    expect(getTracesReferenceLabel('importer')).toBe('TRACES Reference');
    expect(getTracesReferenceLabel('exporter')).toBe('Handoff Reference');
    expect(getPackageCreateTitle('exporter')).toBe('Create New Shipment');
  });

  it('preserves DDS and evidence workspace TRACES copy', () => {
    expect(getDdsWorkspaceSubtitle('importer')).toContain('TRACES');
    expect(getDdsReadyForTracesMessage('exporter')).toContain('importer');
    expect(getEvidencePageTitle('importer')).toBe('Evidence');
    expect(getPlotReadyMessage('importer')).toContain('TRACES');
  });

  it('validates package create forms with locale-aware voucher errors', () => {
    const errors = validatePackageCreateForm(
      {
        supplier_name: 'Coop',
        season: 'A',
        year: 2026,
        notes: '',
        voucherIds: [],
      },
      'exporter',
    );
    expect(errors.voucherIds).toContain('shipment');
  });

  it('exposes DDS preflight checks and shipment assembly labels', () => {
    expect(getDdsPreflightChecks()).toHaveLength(7);
    expect(getShipmentAssembleCtaLabel()).toBe('Assemble & Seal');
    expect(getDdsWorkspaceTitle()).toBe('DDS Workspace');
  });

  it('exposes role-aware evidence repository labels', () => {
    expect(getEvidenceUploadCtaLabel('importer')).toBe('Upload evidence');
    expect(getEvidenceSummaryTotalLabel('cooperative')).toBe('Total evidence files');
    expect(getEvidenceEmptyMessage('importer')).toContain('evidence records');
  });

  it('exposes package child-route breadcrumbs and assembly seal CTA', () => {
    expect(getPackageSubmitBreadcrumbLabel('importer')).toBe('Submit to TRACES');
    expect(getPackageSubmitBreadcrumbLabel('exporter')).toBe('Submit');
    expect(getPackageTimelineBreadcrumbLabel()).toBe('Timeline');
    expect(getPackageAssembleSealCtaLabel(false)).toBe('Seal & Finalize Shipment');
    expect(getPackageAssembleSealCtaLabel(true)).toBe('Sealing…');
  });

  it('localizes package detail preflight and submit success copy', () => {
    expect(getPackagePreflightBlockersDescription('importer', ['Missing plot geometry'])).toContain('TRACES');
    expect(getPackageSubmitSuccessToast('importer', 'REF-1', false)).toContain('TRACES');
    expect(getPackageSubmitSuccessToast('exporter', null, true)).toContain('replayed');
  });

  it('localizes compliance queue, producers, and plots workflow pages', () => {
    expect(getComplianceQueuePageTitle()).toBe('Compliance Issues Queue');
    expect(buildComplianceQueueBreadcrumbs()[2]?.label).toBe('Issues Queue');
    expect(getProducersPageTitle('cooperative')).toBe('Members');
    expect(getProducersPageTitle('exporter')).toBe('Suppliers');
    expect(getContactsEmptyCopy('title', 'exporter')).toBe('No suppliers yet');
    expect(getProducerComplianceLabel('partial')).toBe('Partial');
    expect(getPlotDeforestationRiskLabel('high')).toBe('High Risk');
    expect(getPlotDetailPageSubtitle('plot-42')).toBe('Plot identifier: plot-42');
  });

  it('localizes review queues and async workflow states', () => {
    expect(getPlotReviewPageTitle()).toBe('Plot review queue');
    expect(getTenureReviewPageTitle()).toBe('Tenure document review');
    expect(getWorkflowAsyncStateCopy('crm.prospects', 'empty').title).toBe('No prospects yet');
    expect(getWorkflowAsyncStateCopy('content.calendar', 'loading').title).toBe(
      'Loading content calendar...',
    );
    expect(getWorkflowAsyncStateCopy('issues.detail', 'empty').title).toBe('Issue not found');
  });

  it('localizes plot review cards and producer filter options', () => {
    expect(getPlotReviewOverlapSummary(true, false)).toContain('yes');
    expect(getProducersFilterComplianceOption('partial')).toBe('Partial');
    expect(getTenureReviewCadastralMatchMessage()).toContain('Clave');
    expect(getProducersTableColumnLabel('compliance')).toBe('Compliance');
    expect(getContentReviewStatLabel('overdue_tasks')).toBe('Overdue tasks');
    expect(getContentReviewStatusLabel('needs_review')).toBe('Needs review');
    expect(getInboxPageTitle('importer')).toBe('Requests');
    expect(getOutreachPageTitle('exporter')).toBe('Outreach');
    expect(getIssuesBlockingAlert(3)).toContain('3');
    expect(getIssuesKanbanColumnLabel('in_progress')).toBe('In progress');
    expect(getIssuesOpenRemediationLabel()).toBe('Open remediation');
    expect(getComplianceCheckSummaryTitle('importer')).toContain('Declaration');
    const overdue = new Date();
    overdue.setDate(overdue.getDate() - 2);
    expect(getIssuesSlaLabel(overdue.toISOString())).toContain('Overdue');
    expect(getPlotBreakdownBlockingTitle()).toContain('Blocking');
    expect(getSlaEscalationTimelineTitle()).toContain('SLA');
    expect(formatSlaTimeRemaining(0)).toBe('Overdue');
    expect(getFieldOpsPageTitle()).toBe('Field Operations');
    expect(getRoleDecisionsStatLabel('pending')).toBe('Pending Review');
    expect(getReportsPageHeader('importer').title).toBe('Reporting');
    expect(getHelpPageSubtitle(false)).toBe('Workflow guidance, troubleshooting, and support resources');
    expect(getContactsPageTitle(true)).toBe('Members');
    expect(getLegalRoleDescriptionLabel('OPERATOR')).toContain('EU market');
  });

  it('localizes contacts add flow, status labels, and admin users table', () => {
    expect(getContactStatusLabel('engaged')).toBe('Engaged');
    expect(getContactConsentLabel('granted')).toBe('Granted');
    expect(getContactTypeLabel('farmer')).toBe('Producer / farmer');
    expect(getContactsPageTitle('exporter')).toBe('Suppliers');
    expect(getProducersNavHref('exporter')).toBe('/contacts');
    expect(getProducerDetailHref('contact_1')).toBe('/farmers/contact_1');
    expect(getHarvestFilterStatusLabel('warning')).toBe('Warning');
    expect(getHarvestReceiveDeliveryCopy('assemble_cta', undefined, undefined, 'exporter')).toBe(
      'Create shipment',
    );
    expect(getHarvestReceiveDeliveryCopy('browse_toggle', undefined, undefined, 'exporter')).toBe(
      'Browse supplier vouchers',
    );
    expect(getContactsAddPageTitle('select', true)).toBe('Add Member or Organization');
    expect(getContactsWizardStepLabel('review')).toBe('Review');
    expect(getAdminUsersSubtitle()).toBe('Manage user accounts and access');
    expect(getAdminUsersTableColumnLabel('last_login')).toBe('Last Login');
    expect(getAdminDiagnosticsPresetLabel('latest_blocks')).toBe('Latest blocks (24h)');
    expect(getAdminDiagnosticsCopy('filter_matching_events', undefined, { count: 3 })).toContain('3');
    expect(getAdminEntitlementsCopy('action_load')).toBe('Load entitlements');
    expect(getAdminEntitlementStatusLabel('enabled')).toBe('Enabled');
    expect(getAdminEudrDdsCopy('action_submit')).toBe('Submit DDS');
    expect(getAdminWebhookCopy('title_registrations')).toBe('Integration Webhook Registrations');
    expect(getAdminDiagnosticsCopy('pagination_page', undefined, { page: 2, totalPages: 5 })).toContain('2');
    expect(getProducerDetailCopy('section_info')).toBe('Producer Information');
    expect(getProducerDetailCopy('badge_engaged')).toBe('Engaged in programme');
    expect(getAdminFilingPhaseFilterLabel('submission_accepted')).toBe('Submission accepted');
    expect(getAdminDiagnosticsCopy('section_workflow')).toBe('Workflow Activity');
    expect(getAdminDiagnosticsCopy('toast_org_created')).toBe('Organization created.');
    expect(getAdminEudrDdsSubmitSuccessMessage({ statusCode: 201 }, undefined)).toContain('201');
    expect(getAdminEudrDdsStatusErrorMessage({ message: 'EUDR DDS status response was not valid JSON' })).toContain('malformed');
    expect(getAdminPageTitle()).toBe('Admin Panel');
    expect(getAdminTenantRoleLabel('importer')).toBe('Importer');
    expect(getAdminRbacCopy('title')).toBe('RBAC Permission Matrix');
    expect(getAdminRbacCommercialPermissionLabel('packages:submit_traces')).toContain('TRACES');
    expect(getAdminRbacCommercialPermissionLabel('roles:manual_classify')).toBe('Manual Role Classification');
    expect(getLegalRoleFilterLabel('OPERATOR')).toBe('Operator');
    expect(getProducerConsentCopy('title')).toBe('Data access consent');
    expect(getProducerConsentCopy('action_request', 'cooperative')).toBe('Request data access');
    expect(getProducerConsentStatusLabel('pending')).toBe('pending');
    expect(getAppChromeCopy('eudr_platform')).toBe('EUDR Platform');
    expect(getAppChromeCopy('user_menu_aria', undefined, { name: 'Alex' })).toContain('Alex');
    expect(getAuthCopy('login_title')).toBe('Sign in to your account');
    expect(getSignupCopy('create_account')).toBe('Create account');
    expect(getOnboardingChecklistTaskCopy('finish_overview', 'label')).toBe('Finish sponsor overview');
    expect(getSupplyChainRolePresetLabel('cooperative_exporter')).toBe('Cooperative + exporter');
    expect(getSettingsCopy('twofa_title')).toBe('Enable two-factor authentication');
    expect(getSponsorPanelCopy('hero_title')).toBe('Network transparency for sustainable markets');
    expect(getOnboardingWelcomeCopy('start_tour')).toBe('Start guided tour');
    expect(getOnboardingTourCopy('finish')).toBe('Finish tour');
    expect(getOnboardingStepCopy('coop_overview', 'label')).toBe('Overview');
    expect(getVirginStateHeadingCopy('sponsor', 'title')).toBe('Build your sponsor oversight network');
    expect(getDemoDataCopy('sidebar_label')).toBe('Demo data');
    expect(getWelcomeCardCopy('start_onboarding')).toBe('Start onboarding');
    expect(getAsyncStateShellCopy('retry')).toBe('Retry');
    expect(getSettingsPageCopy('tab_security')).toBe('Security');
  });
});
