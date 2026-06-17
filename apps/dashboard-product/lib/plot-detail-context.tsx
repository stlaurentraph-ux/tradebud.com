'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  assessPlotEudrReadiness,
  buildInventoryRowFromMapPreview,
  defaultGroundTruthPhotoSummary,
  normalizeGroundTruthPhotoSummary,
  type PlotEudrReadinessAssessment,
} from '@/lib/plot-eudr-readiness';
import { buildPlotDetailHeadline, type PlotDetailHeadline } from '@/lib/plot-detail-headline';
import { computePlotTenureStatus, type PlotTenureStatus } from '@/lib/plot-tenure-status';
import { useEvidenceFeed, type EvidenceFeedDocument } from '@/lib/use-evidence-feed';
import { usePlotMapPreview, type PlotMapPreviewRecord } from '@/lib/use-plot-map-preview';
import { usePlotLegalSync, type PlotLegalSyncPayload } from '@/lib/use-plot-legal-sync';
import {
  usePlotTenureVerification,
  type PlotTenureVerificationRecord,
} from '@/lib/use-plot-tenure-verification';

export interface PlotDetailContextValue {
  plotId: string;
  preview: PlotMapPreviewRecord | null;
  previewLoading: boolean;
  previewError: string | null;
  documents: EvidenceFeedDocument[];
  evidenceLoading: boolean;
  evidenceError: string | null;
  legalSync: PlotLegalSyncPayload | null;
  legalLoading: boolean;
  legalError: string | null;
  verificationRecords: PlotTenureVerificationRecord[];
  verificationLoading: boolean;
  verificationError: string | null;
  reloadVerification: () => Promise<void>;
  tenureEvidence: EvidenceFeedDocument[];
  tenureStatus: PlotTenureStatus;
  assessment: PlotEudrReadinessAssessment | null;
  headline: PlotDetailHeadline;
  isLoading: boolean;
}

const PlotDetailContext = createContext<PlotDetailContextValue | null>(null);

export function PlotDetailProvider({ plotId, children }: { plotId: string; children: ReactNode }) {
  const { preview, isLoading: previewLoading, error: previewError } = usePlotMapPreview(plotId);
  const { documents, isLoading: evidenceLoading, error: evidenceError } = useEvidenceFeed({
    plotId,
    enabled: Boolean(plotId),
  });
  const { legalSync, isLoading: legalLoading, error: legalError } = usePlotLegalSync(plotId);
  const {
    records: verificationRecords,
    isLoading: verificationLoading,
    error: verificationError,
    reload: reloadVerification,
  } = usePlotTenureVerification(plotId, { pollWhilePending: true });

  const tenureEvidence = useMemo(
    () => documents.filter((doc) => doc.evidence_kind === 'tenure_evidence'),
    [documents],
  );

  const tenureStatus = useMemo(
    () =>
      computePlotTenureStatus({
        informalTenure: legalSync?.informalTenure ?? null,
        cadastralKey: legalSync?.cadastralKey ?? null,
        tenureEvidenceCount: tenureEvidence.length,
        landTenureDeclared: null,
      }),
    [legalSync, tenureEvidence.length],
  );

  const assessment = useMemo((): PlotEudrReadinessAssessment | null => {
    if (!preview) return null;
    const inventoryRow = buildInventoryRowFromMapPreview(preview);
    if (!inventoryRow) return null;
    const groundTruthPhotos = preview.ground_truth_photos
      ? normalizeGroundTruthPhotoSummary(preview.ground_truth_photos)
      : defaultGroundTruthPhotoSummary();
    return assessPlotEudrReadiness({
      plot: inventoryRow,
      tenureBadge: tenureStatus.badge,
      tenureEvidenceCount: tenureEvidence.length,
      plotEvidenceCount: documents.length,
      groundTruthPhotos,
    });
  }, [preview, tenureStatus.badge, tenureEvidence.length, documents.length]);

  const headline = useMemo(
    () =>
      buildPlotDetailHeadline({
        assessment,
        screeningStatus: preview?.status,
        tenureBadge: tenureStatus.badge,
      }),
    [assessment, preview?.status, tenureStatus.badge],
  );

  const isLoading =
    (previewLoading && !preview) ||
    (evidenceLoading && documents.length === 0) ||
    (legalLoading && !legalSync);

  const value = useMemo(
    (): PlotDetailContextValue => ({
      plotId,
      preview,
      previewLoading,
      previewError,
      documents,
      evidenceLoading,
      evidenceError,
      legalSync,
      legalLoading,
      legalError,
      verificationRecords,
      verificationLoading,
      verificationError,
      reloadVerification,
      tenureEvidence,
      tenureStatus,
      assessment,
      headline,
      isLoading,
    }),
    [
      plotId,
      preview,
      previewLoading,
      previewError,
      documents,
      evidenceLoading,
      evidenceError,
      legalSync,
      legalLoading,
      legalError,
      verificationRecords,
      verificationLoading,
      verificationError,
      reloadVerification,
      tenureEvidence,
      tenureStatus,
      assessment,
      headline,
      isLoading,
    ],
  );

  return <PlotDetailContext.Provider value={value}>{children}</PlotDetailContext.Provider>;
}

export function usePlotDetailContext(): PlotDetailContextValue {
  const ctx = useContext(PlotDetailContext);
  if (!ctx) {
    throw new Error('usePlotDetailContext must be used within PlotDetailProvider');
  }
  return ctx;
}

export function useOptionalPlotDetailContext(): PlotDetailContextValue | null {
  return useContext(PlotDetailContext);
}
