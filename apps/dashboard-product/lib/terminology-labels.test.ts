import { describe, expect, it } from 'vitest';
import {
  formatImporterVerifiedPct,
  formatCooperativePlotCoverageHint,
  formatSponsorBillingQuickHint,
  formatSponsorStatHint,
  getCooperativeDashboardLabels,
  getExporterNorthStarLabels,
  getExporterSealedCountLabel,
  getExporterSubmittedQueueHint,
  getImporterDashboardLabels,
  getImporterNorthStarLabels,
  getReviewerDashboardLabels,
  getReviewerJurisdictionActivityHint,
  getReviewerNorthStarLabels,
  getSponsorDashboardLabels,
  getSponsorInterventionItems,
  getSponsorNorthStarLabels,
  getTracesFilingHint,
} from './terminology-labels';

describe('terminology-labels', () => {
  it('keeps TRACES filing language for importers', () => {
    expect(getTracesFilingHint('importer')).toContain('TRACES');
    expect(getTracesFilingHint('exporter')).toContain('hand off');
  });

  it('translates importer dashboard copy structure', () => {
    const labels = getImporterDashboardLabels();
    expect(labels.kpiIncomingShipments).toBe('Incoming Shipments');
    expect(getImporterNorthStarLabels('filing').ctaLabel).toBe('Prepare TRACES submission');
  });

  it('interpolates verified plot percentage', () => {
    expect(formatImporterVerifiedPct(82)).toBe('82% Verified');
  });

  it('uses handoff language for exporter sealed counts', () => {
    expect(getExporterSealedCountLabel(3)).toBe('3 sealed and handoff-ready');
    expect(getExporterSubmittedQueueHint()).toContain('importer');
    expect(getExporterNorthStarLabels('handoff', 2).label).toBe('Handoff-ready shipments');
  });

  it('exposes cooperative dashboard label bundles', () => {
    const labels = getCooperativeDashboardLabels();
    expect(labels.kpiMembers).toBe('Members');
    expect(formatCooperativePlotCoverageHint(4, 10)).toBe('4/10 plots compliant');
  });

  it('exposes reviewer dashboard label bundles', () => {
    const labels = getReviewerDashboardLabels();
    expect(labels.triageTitle).toBe('Issue triage');
    expect(getReviewerJurisdictionActivityHint()).toContain('jurisdiction');
    expect(getReviewerNorthStarLabels(5).hint).toBe('5 flagged items in your jurisdiction');
  });

  it('exposes sponsor dashboard label bundles', () => {
    const labels = getSponsorDashboardLabels();
    expect(labels.campaignTitle).toBe('Programmes');
    expect(formatSponsorStatHint('countries', { count: 3 })).toBe('3 governed organisations');
    expect(formatSponsorBillingQuickHint(2)).toContain('at-risk');
    expect(getSponsorInterventionItems({ pendingApprovals: 1, uncoveredCoverage: 2, belowReadiness: 3 })[0].title).toContain(
      'policy exceptions',
    );
    expect(getSponsorNorthStarLabels(4).ctaLabel).toBe('Review compliance health');
  });
});
