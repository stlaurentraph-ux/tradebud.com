/**
 * Single source of truth for “plot ready / compliant checklist” used on Home,
 * My Plots (explore), and Plot detail. Keeps ground truth, tenure, FPIC, permit,
 * and server-sync rules aligned.
 */

export const MIN_GROUND_TRUTH_PHOTOS = 4;

export type BackendOverlapFlags = {
  sinaph_overlap?: boolean;
  indigenous_overlap?: boolean;
};

export type PlotReadinessChecklist = {
  groundOk: boolean;
  landOk: boolean;
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
  groundTruthPhotoCount: number;
  titlePhotoCount: number;
  evidenceKinds: readonly string[];
  /** True when a local plot is linked to a server row (name/area match or known plot id). */
  isSyncedToServer: boolean;
  backendFlags?: BackendOverlapFlags | null;
  minGroundTruthPhotos?: number;
}): PlotReadinessChecklist {
  const minG = params.minGroundTruthPhotos ?? MIN_GROUND_TRUTH_PHOTOS;
  const flags = params.backendFlags ?? null;
  const groundOk = params.groundTruthPhotoCount >= minG;
  const landOk =
    params.titlePhotoCount > 0 || evidenceHasKind(params.evidenceKinds, 'tenure_evidence');
  const needsFpic = flags?.indigenous_overlap === true;
  const needsPermit = flags?.sinaph_overlap === true;
  const fpicOk = evidenceHasKind(params.evidenceKinds, 'fpic_repository');
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
    needsFpic,
    needsPermit,
    fpicOk,
    permitOk,
    syncOk,
    done,
  };
}
