/**
 * Single source of truth for “plot ready / compliant checklist” used on Home,
 * My Plots (explore), and Plot detail. Keeps ground truth, tenure, FPIC, permit,
 * and server-sync rules aligned.
 */

import { summarizeTenureAiParseStatus } from '@/features/compliance/plotTenureAiReview';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import {
  isGroundTruthPhotoSetComplete,
} from '@/features/compliance/groundTruthPhotoGeo';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';

export const MIN_GROUND_TRUTH_PHOTOS = 4;

export type TenureParseGateStatus =
  | 'not_applicable'
  | 'not_synced'
  /** Plot on server; land papers saved on phone but not uploaded for AI review yet. */
  | 'documents_local_only'
  | 'pending'
  | 'blocked'
  | 'cleared';

export type LandDocumentsUiStatus =
  | 'missing'
  | 'local_only'
  /** Synced plot; photo/file on phone but no server tenure check row yet. */
  | 'awaiting_upload'
  | 'reviewing'
  | 'blocked'
  | 'verified';

/** Farmer-facing land-papers state — do not equate upload with “verified”. */
export function resolveLandDocumentsUiStatus(params: {
  titlePhotoCount: number;
  evidenceKinds: readonly string[];
  tenureParseGate: TenureParseGateStatus;
}): LandDocumentsUiStatus {
  const hasLandDocuments =
    params.titlePhotoCount > 0 || evidenceHasKind(params.evidenceKinds, 'tenure_evidence');
  if (!hasLandDocuments) return 'missing';
  if (params.tenureParseGate === 'blocked') return 'blocked';
  if (params.tenureParseGate === 'pending') return 'reviewing';
  if (params.tenureParseGate === 'documents_local_only') return 'awaiting_upload';
  if (params.tenureParseGate === 'not_synced') return 'local_only';
  if (params.tenureParseGate === 'cleared') return 'verified';
  return 'missing';
}

export function evaluateTenureParseGate(params: {
  /** Land title photos and/or tenure evidence documents uploaded for this plot. */
  hasLandDocuments: boolean;
  isSyncedToServer: boolean;
  tenureVerifications?: PlotTenureVerificationRecord[];
}): TenureParseGateStatus {
  if (!params.hasLandDocuments) return 'not_applicable';
  if (!params.isSyncedToServer) return 'not_synced';
  const verifications = params.tenureVerifications ?? [];
  if (verifications.length === 0) return 'documents_local_only';
  const status = summarizeTenureAiParseStatus(verifications);
  if (!status || status === 'PENDING' || status === 'IN_PROGRESS') return 'pending';
  if (status === 'FAILED' || status === 'MANUAL_REQUIRED') return 'blocked';
  return 'cleared';
}

export type BackendOverlapFlags = {
  sinaph_overlap?: boolean;
  indigenous_overlap?: boolean;
};

export type PlotReadinessChecklist = {
  groundOk: boolean;
  landOk: boolean;
  tenureParseGate: TenureParseGateStatus;
  needsFpic: boolean;
  needsPermit: boolean;
  fpicOk: boolean;
  permitOk: boolean;
  syncOk: boolean;
  /** All required items satisfied for this plot. */
  done: boolean;
};

function evidenceHasKind(kinds: readonly string[], kind: string): boolean {
  return kinds.some((k) => k === kind);
}

/**
 * @param backendFlags — Overlap flags from the matched server plot row (if any).
 *   When there is no server match, pass `null` / omit so FPIC/permit are not required.
 */
export function computePlotReadinessChecklist(params: {
  /** Prefer geo-verified direction slots when plot is available. */
  groundTruthPhotos?: PlotPhoto[];
  plot?: Plot | null;
  /** Legacy count-only check when photos/plot are omitted (tests, partial callers). */
  groundTruthPhotoCount?: number;
  titlePhotoCount: number;
  evidenceKinds: readonly string[];
  /** Farmer-level FPIC / labor uploads (Documents from Home). */
  producerEvidenceKinds?: readonly string[];
  /** True when farmer completed FPIC + labor attestations on Documents. */
  producerAttestationsComplete?: boolean;
  /** True when a local plot is linked to a server row (name/area match or known plot id). */
  isSyncedToServer: boolean;
  backendFlags?: BackendOverlapFlags | null;
  minGroundTruthPhotos?: number;
  tenureVerifications?: PlotTenureVerificationRecord[];
}): PlotReadinessChecklist {
  const minG = params.minGroundTruthPhotos ?? MIN_GROUND_TRUTH_PHOTOS;
  const flags = params.backendFlags ?? null;
  const groundOk =
    params.groundTruthPhotos && params.plot
      ? isGroundTruthPhotoSetComplete(params.groundTruthPhotos, params.plot)
      : (params.groundTruthPhotoCount ?? 0) >= minG;
  const hasTenureEvidence = evidenceHasKind(params.evidenceKinds, 'tenure_evidence');
  const hasLandDocuments = params.titlePhotoCount > 0 || hasTenureEvidence;
  const tenureParseGate = evaluateTenureParseGate({
    hasLandDocuments,
    isSyncedToServer: params.isSyncedToServer,
    tenureVerifications: params.tenureVerifications,
  });
  const landOk = hasLandDocuments && tenureParseGate !== 'blocked';
  const needsFpic = flags?.indigenous_overlap === true;
  const needsPermit = flags?.sinaph_overlap === true;
  const producerKinds = params.producerEvidenceKinds ?? [];
  const fpicOk =
    evidenceHasKind(params.evidenceKinds, 'fpic_repository') ||
    evidenceHasKind(producerKinds, 'fpic_repository') ||
    params.producerAttestationsComplete === true;
  const permitOk = evidenceHasKind(params.evidenceKinds, 'protected_area_permit');
  const syncOk = params.isSyncedToServer;
  const done =
    groundOk &&
    landOk &&
    (!needsFpic || fpicOk) &&
    (!needsPermit || permitOk) &&
    syncOk;

  return {
    groundOk,
    landOk,
    tenureParseGate,
    needsFpic,
    needsPermit,
    fpicOk,
    permitOk,
    syncOk,
    done,
  };
}
