import type { User } from '@/types';

type SupplyChainRole = User['active_role'] | null | undefined;

/** Voucher bundles (dds_package) — upstream identity-preserved lots. */
export function getBatchNavLabel(role?: SupplyChainRole): string {
  if (role === 'cooperative' || role === 'exporter') {
    return 'Lots & Batches';
  }
  return 'Batches';
}

export function getBatchPageTitle(role?: SupplyChainRole): string {
  return getBatchNavLabel(role);
}

export function getBatchPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Bundle member harvest vouchers into lineage-safe batches before export handoff';
  }
  if (role === 'exporter') {
    return 'Bundle producer harvest vouchers into identity-preserved batches';
  }
  return 'Manage voucher-backed batch packages from verified plots';
}

export function getNewBatchLabel(_role?: SupplyChainRole): string {
  return 'New Batch';
}

/** EU-bound shipment assemblies combining one or more batches. */
export function getShipmentNavLabel(_role?: SupplyChainRole): string {
  return 'Shipments';
}

export function getShipmentPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Review upstream shipments and assemble EU filing packages before TRACES submission';
  }
  if (role === 'exporter') {
    return 'Combine batches into shipment headers, validate coverage, seal, and share with your importer';
  }
  return 'Combine batches into shipment headers, validate coverage, and prepare for downstream filing';
}

export function getNewShipmentLabel(_role?: SupplyChainRole): string {
  return 'New Shipment';
}

export const SUPPLY_CHAIN_FLOW_HINT =
  'Harvest vouchers → Batch → Shipment. Batches preserve plot lineage; shipments are sealed for importer EU filing.';

/** Importers own TRACES DDS submission; exporters hand off sealed shipments upstream. */
export function getTracesFilingOwnerLabel(_role?: SupplyChainRole): string {
  return 'Importer (TRACES)';
}

export function getTracesFilingHint(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Review sealed shipments from exporters, then submit the DDS to TRACES.';
  }
  if (role === 'exporter') {
    return 'Seal shipments and hand off to your importer — they submit the DDS to TRACES.';
  }
  return 'Only importers submit the Due Diligence Statement to TRACES.';
}

export function getDashboardSubtitle(role?: SupplyChainRole): string {
  switch (role) {
    case 'exporter':
      return 'Assemble lineage-safe shipments and prepare handoff to your importer';
    case 'importer':
      return 'Verify upstream evidence and submit EU due diligence (TRACES)';
    case 'cooperative':
      return 'Manage members, field operations, consent, portability, and cooperative governance';
    case 'country_reviewer':
      return 'Review and verify compliance submissions in your jurisdiction';
    case 'sponsor':
      return 'Govern network health, delegated admin scope, programme outcomes, and sponsored coverage';
    default:
      return 'Welcome to Tracebud';
  }
}

export function getExporterSealedHandoffLabel(sealedCount: number): string {
  return `${sealedCount} sealed — awaiting importer acceptance for EU filing`;
}

export function getExporterShipmentTrackDescription(): string {
  return 'Track shipments across readiness, seal, and importer handoff states';
}

export function getExporterSealedCountLabel(sealedCount: number): string {
  return `${sealedCount} sealed and handoff-ready`;
}

export function getImporterIncomingShipmentsHint(): string {
  return 'From verified exporters';
}

export function getImporterTracesReadyHint(): string {
  return 'Ready for TRACES filing after your review';
}

export function getImporterUpstreamActivityHint(): string {
  return 'Upstream activity will appear once exporters share sealed shipments and campaigns generate responses.';
}

export function getImporterReviewQueueDescription(): string {
  return 'Incoming shipments needing verification or TRACES filing preparation';
}

export function getImporterReviewQueueEmptyDescription(): string {
  return 'Launch a campaign or wait for exporters to share sealed shipments.';
}

export function getReviewerJurisdictionActivityHint(): string {
  return 'Review activity will appear when exporters submit packages for your jurisdiction.';
}

export function getNorthStarExporterSealHint(): string {
  return 'Validate coverage and seal before sharing with your importer';
}

export function getNorthStarExporterHandoffHint(sealedCount: number): string {
  return getExporterSealedHandoffLabel(sealedCount);
}

export function getNorthStarImporterReviewHint(): string {
  return 'Verify upstream evidence before you submit DDS to TRACES';
}

export function getNorthStarImporterFilingHint(): string {
  return 'You are the final compliance owner — submit DDS to TRACES when checks pass';
}

export function getNorthStarImporterFilingCta(): string {
  return 'Prepare TRACES submission';
}

export function getMiniReviewImporterFilingAction(): string {
  return 'Prepare TRACES filing';
}

export function usesShipmentWorkflowLanguage(role?: SupplyChainRole): boolean {
  return role === 'importer' || role === 'exporter' || role === 'cooperative';
}

export function getPackagesPageTitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? getShipmentNavLabel(role) : 'DDS Packages';
}

export function getPackagesPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Validate shipment completeness, coverage, and declaration readiness before TRACES filing';
  }
  if (role === 'exporter') {
    return 'Assemble shipment packages from lineage-safe upstream inputs and hand off to your importer';
  }
  if (role === 'cooperative') {
    return 'Prepare cooperative handoff shipments with lineage coverage, blocker checks, and premium context';
  }
  return 'Manage Deforestation Due Diligence Statement packages';
}

export function getNewPackageCtaLabel(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? getNewShipmentLabel(role) : 'New Package';
}

export function getPackagesLoadingMessage(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Loading shipments...' : 'Loading packages...';
}

export function getMyPackagesTabLabel(role?: SupplyChainRole): string {
  return role === 'importer' ? 'My Shipments' : 'My Packages';
}

export function getSharedPackagesTabLabel(role?: SupplyChainRole, count = 0): string {
  if (role === 'importer') {
    return `Shared Shipments (${count})`;
  }
  return `Shared With Me (${count})`;
}

export function getPackageEntityLabel(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'shipment' : 'package';
}

export function getPackageEntityLabelCapitalized(role?: SupplyChainRole): string {
  const label = getPackageEntityLabel(role);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCompliancePageTitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') return 'Cooperative Data Readiness Check';
  if (role === 'importer') return 'Compliance';
  return 'Zero-Risk Pre-Flight Check';
}

export function getCompliancePageSubtitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Validate member evidence and plot readiness before export handoff';
  }
  if (role === 'importer') {
    return 'Validate role decisions, references, and declaration readiness before TRACES submission';
  }
  return 'Comprehensive compliance verification before handoff to your importer';
}

export function getComplianceBackLinkLabel(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Back to Shipment' : 'Back to Package';
}

export function getComplianceHubEmptyHint(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Select a shipment from Shipments to run declaration readiness checks before TRACES filing.';
  }
  return 'Select a shipment from Shipments to run package compliance checks, or use the review queues above for field evidence.';
}

export function getComplianceOverviewTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Shipment Compliance Overview' : 'Package Compliance Overview';
}

export function getComplianceBlockerAlertTail(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Resolve blockers before you submit the DDS to TRACES.';
  }
  return 'Resolve blockers before sealing and handing off to your importer.';
}

export function getComplianceReadinessEmptyHint(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Select a shipment from Shipments to load backend readiness diagnostics.';
  }
  return 'Select a package from Packages to load backend readiness diagnostics.';
}

export function getComplianceNoReasonCodesMessage(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'No backend readiness reason codes reported for this shipment.';
  }
  return 'No backend readiness reason codes reported for this package.';
}

export function getPackageCreateTitle(role?: SupplyChainRole): string {
  if (role === 'exporter' || role === 'importer') return 'Create New Shipment';
  return 'Create New Package';
}

export function getPackageCreateSubtitle(role?: SupplyChainRole): string {
  if (role === 'exporter') {
    return 'Select harvest vouchers and build a shipment package for importer handoff';
  }
  if (role === 'importer') {
    return 'Importer workspaces review upstream shipments; exporters and cooperatives create new shipment packages';
  }
  return 'Select harvest vouchers to start a DDS package for EUDR compliance';
}

export function getPackageCreateSuccessToast(role?: SupplyChainRole): string {
  if (role === 'exporter' || role === 'cooperative') {
    return 'Shipment package created from selected harvest vouchers.';
  }
  return 'DDS package created from selected harvest vouchers.';
}

export function getPackageSubmitActionLabel(role?: SupplyChainRole, isSubmitting = false): string {
  if (isSubmitting) return 'Submitting...';
  if (role === 'importer') return getMiniReviewImporterFilingAction();
  return 'Submit downstream handoff';
}

export function getPackageSubmittedAwaitingMessage(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'This shipment has been filed and is awaiting TRACES confirmation.';
  }
  return 'This package has been submitted and is awaiting importer acceptance for EU filing.';
}

export function getAssembleShipmentSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Review sealed shipment coverage before TRACES filing';
  }
  if (role === 'exporter' || role === 'cooperative') {
    return 'Seal shipment and hand off to your importer for EU filing';
  }
  return 'Seal upstream shipment before downstream compliance filing';
}

export function getSealBillingHint(role?: SupplyChainRole): string {
  if (role === 'exporter' || role === 'cooperative') {
    return 'Sealing meters €1 origin usage for this month. Your importer pays €1 when they submit DDS to TRACES.';
  }
  return 'Sealing meters €1 origin usage for this month when you file to TRACES.';
}

export function getEvidencePageTitle(role?: SupplyChainRole): string {
  if (role === 'importer' || role === 'cooperative') return 'Evidence';
  return 'FPIC Repository';
}

export function getEvidencePageSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Review, complete, and retain evidence for shipment and TRACES declaration defensibility';
  }
  if (role === 'cooperative') {
    return 'Manage consent, portability, and cooperative evidence with full provenance chain';
  }
  return 'Manage Free Prior Informed Consent documents with full provenance chain';
}

export function getDdsWorkspaceSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Prepare and submit Due Diligence Statements to TRACES with canonical lifecycle states';
  }
  return 'Review DDS package states — only importers submit to TRACES';
}

export function getDdsPreflightTracesHint(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'All checks must pass before you submit to TRACES NT';
  }
  return 'All checks must pass before your importer submits to TRACES NT';
}

export function getDdsReadyForTracesMessage(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'All 7 checks passed. This DDS package is ready for submission to TRACES NT.';
  }
  return 'All 7 checks passed. Hand off to your importer for TRACES NT submission.';
}

export function getPlotBreakdownTitle(role?: SupplyChainRole): string {
  return role === 'importer'
    ? 'Evidence-by-Evidence Readiness Analysis'
    : 'Plot-by-Plot Compliance Analysis';
}

export function getPlotBreakdownSubtitle(role?: SupplyChainRole): string {
  return role === 'importer'
    ? 'Detailed readiness assessment for all linked evidence records'
    : 'Detailed deforestation assessment for all plots';
}

export function getPlotReadyMessage(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'This shipment is ready for EU filing. Proceed to submit your DDS to TRACES.';
  }
  return 'This shipment is ready to hand off to your importer for EU filing.';
}

export function getIssuesPageTitle(role?: SupplyChainRole): string {
  if (role === 'importer' || role === 'cooperative') return 'Issues';
  return 'Compliance Issues';
}

export function getIssuesPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Manage blockers, warnings, and escalations linked to shipment and TRACES filing workflows';
  }
  if (role === 'cooperative') {
    return 'Resolve field, lineage, consent, portability, and premium-governance blockers';
  }
  return 'Manage and track compliance blockers before shipment seal and importer handoff';
}

export function getIssuesCreateButtonLabel(role?: SupplyChainRole): string {
  if (role === 'importer') return 'New Exception';
  if (role === 'cooperative') return 'New Cooperative Issue';
  return 'New Issue';
}

export function getIssuesCreateDialogTitle(role?: SupplyChainRole): string {
  if (role === 'importer') return 'Create Workflow Exception';
  if (role === 'cooperative') return 'Create Cooperative Issue';
  return 'Create Compliance Issue';
}

export function getIssuesCreateDialogDescription(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Add a blocker or warning to track before you submit DDS to TRACES.';
  }
  if (role === 'cooperative') {
    return 'Track operational blockers like duplicate members, blocked yield checks, consent gaps, portability reviews, or premium approvals.';
  }
  return 'Add a compliance issue to track before sealing and handing off to your importer.';
}

export function getIssuesLinkedEntityShipmentLabel(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Shipment' : 'Package';
}

export function getHarvestListPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Manage cooperative aggregation, lineage lock readiness, and yield appeal workflows before export handoff';
  }
  if (role === 'exporter') {
    return 'Bundle harvest vouchers into identity-preserved batches before shipment assembly and importer handoff';
  }
  return 'Manage aggregation inputs and batch-level yield plausibility checks';
}

export function getAddBatchInputCtaLabel(_role?: SupplyChainRole): string {
  return 'Add Batch Input';
}

export function getHarvestTotalBatchesMetricLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Tracked Lots & Batches' : 'Total Batches';
}

export function getHarvestAggregatedVolumeLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Aggregated Volume' : 'Total Weight';
}

export function getHarvestAvgYieldMetricLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Avg Yield/Ha Check' : 'Avg Yield/Ha';
}

export function getHarvestFlaggedBatchesMetricLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Blocked / Appeal Queues' : 'Flagged Batches';
}

export function getHarvestSearchPlaceholder(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Search by lot/batch ID, plot, member, or lineage issues...';
  }
  return 'Search by batch ID, plot, or producer...';
}

export function getHarvestEmptyFilterMessage(_role?: SupplyChainRole): string {
  return 'No lots or batches match your filters';
}

export function getHarvestOriginColumnLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Member' : 'Producer';
}

export function getHarvestYieldCapInfoTitle(_role?: SupplyChainRole): string {
  return 'Yield Cap Validation';
}

export function getHarvestYieldCapInfoBody(role?: SupplyChainRole): string {
  const base =
    "Each lot or batch input is cross-referenced against the plot's biological carrying capacity (plot area × expected yield). Weights above capacity trigger warnings or blocks to prevent illicit blending or laundering.";
  if (role === 'cooperative') {
    return `${base} Cooperative teams can route blocked records into yield appeals before lineage lock and shipment assembly.`;
  }
  if (role === 'exporter') {
    return `${base} Resolve warnings before assembling shipments for importer handoff.`;
  }
  return base;
}

export function getHarvestNewPageTitle(_role?: SupplyChainRole): string {
  return 'Record Batch Input';
}

export function getHarvestNewPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Capture member harvest weight against plot yield capacity before bundling into lineage-safe batches';
  }
  if (role === 'exporter') {
    return 'Capture aggregation weight against plot yield capacity before shipment assembly and importer handoff';
  }
  return 'Capture aggregation weight against plot yield capacity for lot and batch tracking';
}

export function getHarvestNewIntakeAlert(_role?: SupplyChainRole): string {
  return 'Batch inputs are stored in your workspace audit trail when the backend is available, with a local fallback for offline yield checks. Field teams can later sync authoritative harvest vouchers from mobile capture.';
}

export function getHarvestNewCardTitle(_role?: SupplyChainRole): string {
  return 'Batch intake details';
}

export function getHarvestNewCardDescription(role?: SupplyChainRole): string {
  if (role === 'cooperative' || role === 'exporter') {
    return 'Enter plot, origin, and weight data to validate capacity before batch bundling and shipment assembly.';
  }
  return 'Enter plot, producer, and weight data to validate capacity before shipment assembly.';
}

export function getHarvestOriginFieldLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Member' : 'Producer';
}

export function getHarvestRecordSubmitLabel(isSubmitting = false): string {
  return isSubmitting ? 'Saving...' : 'Record batch input';
}

export function getHarvestRecordSuccessToast(persistedRemotely: boolean): string {
  return persistedRemotely
    ? 'Batch input recorded and synced to your workspace audit trail'
    : 'Batch input recorded locally (backend sync unavailable)';
}

export function getHarvestDetailPageTitle(_role?: SupplyChainRole): string {
  return 'Batch Detail';
}

export function getHarvestDetailPageSubtitle(id: string): string {
  return `Batch identifier: ${id}`;
}

export function getHarvestDetailCardTitle(_role?: SupplyChainRole): string {
  return 'Batch Record';
}

export function getHarvestDetailPlaceholder(_role?: SupplyChainRole): string {
  return 'Route enabled and ready for detailed batch lineage and yield data.';
}

export function getHarvestVoucherSectionDescription(role?: SupplyChainRole): string {
  if (role === 'exporter' || role === 'cooperative') {
    return 'Select verified harvest vouchers to bundle into this shipment for importer handoff';
  }
  if (role === 'importer') {
    return 'Importer workspaces assemble upstream shipments; voucher selection is managed by exporters and cooperatives';
  }
  return 'Select verified harvest vouchers to include in this package';
}

export function getHarvestVoucherLoadingMessage(_role?: SupplyChainRole): string {
  return 'Loading harvest vouchers...';
}

export function getHarvestVoucherEmptyMessage(role?: SupplyChainRole, showIneligible = false): string {
  if (showIneligible) {
    return 'No harvest vouchers are available for this organisation yet.';
  }
  if (role === 'cooperative' || role === 'exporter') {
    return 'No eligible harvest vouchers are available. Capture harvests in the field app or show ineligible vouchers to review blockers before shipment assembly.';
  }
  return 'No eligible harvest vouchers are available. Capture harvests in the field app or show ineligible vouchers to review blockers.';
}

export function getPackageCreateVoucherValidationError(role?: SupplyChainRole): string {
  if (role === 'exporter' || role === 'cooperative') {
    return 'Select at least one eligible harvest voucher before assembling a shipment.';
  }
  return 'Select at least one eligible harvest voucher.';
}

export function getShipmentBatchSelectDescription(role?: SupplyChainRole): string {
  if (role === 'exporter') {
    return 'Each batch is a voucher bundle from verified plots. Combine batches into this shipment before sealing and handoff to your importer.';
  }
  if (role === 'cooperative') {
    return 'Each batch bundles member harvest vouchers with plot lineage preserved. Combine batches before cooperative shipment assembly.';
  }
  return 'Each batch is a voucher bundle from verified plots. Combine one or more batches into this shipment.';
}

export function getShipmentNoEligibleBatchesMessage(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'No eligible batches available. Record batch inputs from member harvest vouchers first.';
  }
  return 'No eligible batches available. Create batches from harvest vouchers first.';
}

export type WorkflowBreadcrumb = { label: string; href?: string };

export function getDashboardBreadcrumbLabel(): string {
  return 'Dashboard';
}

export function buildPackageBreadcrumbs(
  role: SupplyChainRole | undefined,
  packageCode: string,
  packageId: string,
  tail?: WorkflowBreadcrumb,
): WorkflowBreadcrumb[] {
  const items: WorkflowBreadcrumb[] = [
    { label: getDashboardBreadcrumbLabel(), href: '/' },
    { label: getPackagesPageTitle(role), href: '/packages' },
    { label: packageCode, href: `/packages/${packageId}` },
  ];
  if (tail) items.push(tail);
  return items;
}

export function getPackageDetailBackLabel(role?: SupplyChainRole): string {
  return `Back to ${getPackagesPageTitle(role)}`;
}

export function getBackToPackageDetailLabel(role?: SupplyChainRole): string {
  return `Back to ${getPackageEntityLabelCapitalized(role)}`;
}

export function getPackageLoadingMessage(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role)
    ? 'Loading shipment details...'
    : 'Loading package details...';
}

export function getPackageLoadErrorPrefix(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Failed to load shipment' : 'Failed to load package';
}

export function getPackageNotFoundMessage(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Shipment not found.' : 'Package not found.';
}

export function getRunPackageComplianceLabel(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Run Declaration Checks' : 'Run Compliance';
}

export function getAssembleShipmentActionLabel(_role?: SupplyChainRole): string {
  return 'Assemble Shipment';
}

export function getPackagePreflightBlockersTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'TRACES filing blockers' : 'Filing preflight blockers';
}

export function getPackagePreflightBlockersDescription(
  role: SupplyChainRole | undefined,
  blockers: string[],
): string {
  const action =
    role === 'importer'
      ? 'submitting to TRACES'
      : role === 'exporter' || role === 'cooperative'
        ? 'sealing or handing off'
        : 'generating or submitting';
  return `Resolve the following before ${action}: ${blockers.join(', ')}`;
}

export function getPackageReadinessEntityLabel(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role)
    ? 'Shipment readiness requirements'
    : 'Package readiness requirements';
}

export function getPackageRecentEventsTitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Recent shipment events' : 'Recent package events';
}

export function getPackageFilingWorkflowTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'TRACES Filing Workflow' : 'Filing Workflow';
}

export function getPackageFilingWorkflowHint(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Generate artifacts and submit the DDS to TRACES when readiness checks pass.';
  }
  if (role === 'exporter' || role === 'cooperative') {
    return 'Generate artifacts, seal the shipment, and hand off to your importer for EU filing.';
  }
  return 'Generate artifacts and submit when readiness checks pass.';
}

export function getGenerateFilingArtifactsLabel(isGenerating = false): string {
  return isGenerating ? 'Generating...' : 'Generate filing artifacts';
}

export function getGenerateFilingArtifactsSuccessToast(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Filing artifacts generated. Ready for TRACES submission.';
  }
  if (role === 'exporter' || role === 'cooperative') {
    return 'Filing artifacts generated. Ready to seal and hand off to your importer.';
  }
  return 'Filing artifacts generated. Package is ready to submit.';
}

export function getPackageSubmitSuccessToast(
  role: SupplyChainRole | undefined,
  tracesReference?: string | null,
  replayed = false,
): string {
  if (replayed) return 'Submission replayed from idempotency cache.';
  const suffix = tracesReference ? ` (${tracesReference})` : '';
  if (role === 'importer') return `DDS submitted to TRACES${suffix}.`;
  if (role === 'exporter' || role === 'cooperative') {
    return `Downstream handoff submitted${suffix}.`;
  }
  return `Package submitted${suffix}.`;
}

export function getPackageSubmitErrorMessage(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Failed to submit shipment.' : 'Failed to submit package.';
}

export function getPackageDetailStatusCardTitle(role?: SupplyChainRole): string {
  return `${getPackageEntityLabelCapitalized(role)} Status`;
}

export function getPackageDetailsSidebarTitle(role?: SupplyChainRole): string {
  return `${getPackageEntityLabelCapitalized(role)} Details`;
}

export function getPackageCodeLabel(_role?: SupplyChainRole): string {
  return 'Code';
}

export function getTracesReferenceLabel(role?: SupplyChainRole): string {
  if (role === 'importer') return 'TRACES Reference';
  return 'Handoff Reference';
}

export function getAssociatedProducersCardTitle(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Associated Members' : 'Associated Producers';
}

export function getLinkProducerActionLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Link Member' : 'Link Producer';
}

export function getNoProducersLinkedMessage(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'No members linked yet' : 'No producers linked yet';
}

export function getQuickStatsProducerLabel(role?: SupplyChainRole): string {
  return role === 'cooperative' ? 'Members' : 'Producers';
}

export function getLiabilityAcknowledgementBody(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'By generating filing artifacts, you acknowledge liability for TRACES declaration accuracy and EUDR compliance.';
  }
  return 'By generating filing artifacts, you acknowledge liability for shipment data accuracy and downstream EU filing readiness.';
}

export function getAssemblePageTitle(packageCode: string): string {
  return `Assemble Shipment - ${packageCode}`;
}

export function getAssembleBreadcrumbLabel(): string {
  return 'Assemble Shipment';
}

export function getAssembleSealedAlertMessage(
  role: SupplyChainRole | undefined,
  shipmentReference: string,
): string {
  if (role === 'importer') {
    return `This shipment is sealed (${shipmentReference}). Continue to compliance before TRACES filing.`;
  }
  return `This shipment is sealed (${shipmentReference}). Hand off to your importer for EU filing.`;
}

export function getPackageEditPageTitle(role?: SupplyChainRole): string {
  return `Edit ${getPackageEntityLabelCapitalized(role)}`;
}

export function getPackageEditPageSubtitle(role: SupplyChainRole | undefined, id: string): string {
  return `Editing ${getPackageEntityLabel(role)} ${id}`;
}

export function getPackageEditCardTitle(role?: SupplyChainRole): string {
  return `${getPackageEntityLabelCapitalized(role)} Edit Form`;
}

export function getPackageCompliancePageTitle(role?: SupplyChainRole): string {
  return role === 'importer'
    ? 'Shipment Compliance'
    : `${getPackageEntityLabelCapitalized(role)} Compliance`;
}

export function getPackageCompliancePageSubtitle(role: SupplyChainRole | undefined, id: string): string {
  if (role === 'importer') {
    return `Declaration readiness review for shipment ${id}`;
  }
  return `Compliance review for ${getPackageEntityLabel(role)} ${id}`;
}

export function getPackageComplianceCardTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Declaration Readiness' : 'Compliance Detail';
}

export function getPackageComplianceDetailLinkLabel(role?: SupplyChainRole): string {
  return `${getPackageEntityLabel(role)} detail`;
}

export function getPackageSubmitPageTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Submit to TRACES' : `Submit ${getPackageEntityLabelCapitalized(role)}`;
}

export function getPackageSubmitPageSubtitle(role: SupplyChainRole | undefined, id: string): string {
  if (role === 'importer') {
    return `TRACES filing workflow for shipment ${id}`;
  }
  return `Downstream handoff workflow for ${getPackageEntityLabel(role)} ${id}`;
}

export function getPackageSubmitCardTitle(role?: SupplyChainRole): string {
  return role === 'importer' ? 'TRACES Submission Wizard' : 'Submission Wizard';
}

export function getPackageTimelinePageTitle(packageCode: string): string {
  return `Timeline: ${packageCode}`;
}

export function getPackageTimelinePageSubtitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role)
    ? 'Complete audit history of shipment state changes and handoff events'
    : 'Complete audit history of package state changes and events';
}

export function getPackageTimelineBackLabel(role?: SupplyChainRole): string {
  return `Back to ${getPackageEntityLabelCapitalized(role)}`;
}

export function getPackageTimelineAuditTitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Shipment audit timeline' : 'Package audit timeline';
}

export function getPackageTimelineAuditDescription(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role)
    ? 'Chronological history derived from shipment record updates'
    : 'Chronological history derived from package record updates';
}

export function getPackageCreateBackLabel(role?: SupplyChainRole): string {
  return getPackageDetailBackLabel(role);
}

export function getPackageCreateInfoCardTitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Shipment Information' : 'Package Information';
}

export function getPackageCreatePreviewTitle(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Shipment Preview' : 'Package Preview';
}

export function getPackageCreateSubmitLabel(role?: SupplyChainRole, isSubmitting = false): string {
  if (isSubmitting) return 'Creating...';
  return usesShipmentWorkflowLanguage(role) ? 'Create Shipment' : 'Create Package';
}

export function getPackagesTableTitle(role?: SupplyChainRole): string {
  return getPackagesPageTitle(role);
}

export function getPackagesTableSearchPlaceholder(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'Search shipments...' : 'Search packages...';
}

export function getPackagesTableCodeColumnLabel(role?: SupplyChainRole): string {
  return `${getPackageEntityLabelCapitalized(role)} Code`;
}

export function getEditPackageActionLabel(role?: SupplyChainRole): string {
  return `Edit ${getPackageEntityLabelCapitalized(role)}`;
}

export function getDeletePackageActionLabel(role?: SupplyChainRole): string {
  return `Delete ${getPackageEntityLabelCapitalized(role)}`;
}

export function getPackagesTableEmptyMessage(role?: SupplyChainRole): string {
  return usesShipmentWorkflowLanguage(role) ? 'No shipments found' : 'No packages found';
}

export function getRunComplianceCheckActionLabel(role?: SupplyChainRole): string {
  return role === 'importer' ? 'Run Declaration Check' : 'Run Compliance Check';
}

export function getShipmentsListBackLabel(role?: SupplyChainRole): string {
  return getPackageDetailBackLabel(role);
}

export function getExporterSubmittedQueueHint(): string {
  return 'Awaiting importer acceptance for EU filing';
}

export function getNewShipmentPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'exporter') {
    return 'Select batches (voucher packages) to combine into one shipment before sealing and importer handoff';
  }
  if (role === 'cooperative') {
    return 'Select member batches to combine into one cooperative shipment assembly';
  }
  return 'Select batches (voucher packages) to combine into one EU-bound shipment';
}
